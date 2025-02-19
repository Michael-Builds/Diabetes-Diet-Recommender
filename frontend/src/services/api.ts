import axios from "axios";
import { domain } from "../endpoints";
import { useAuthContext } from "../context/useAuthContext";
import { useNavigate } from "react-router-dom";

const api = axios.create({
    baseURL: domain,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string | null) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { logout, refreshSession } = useAuthContext();
        const navigate = useNavigate()
        const originalRequest = error.config;

        // If unauthorized (401) due to expired session, logout the user
        if (error.response?.status === 401 && error.response?.data?.message?.includes("Session expired")) {
            await logout();
            navigate("/");
            return Promise.reject(error);
        }

        // If unauthorized (401), try refreshing the token
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers["Authorization"] = `Bearer ${token}`;
                        return axios(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await refreshSession();
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                logout();
                navigate("/");
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
