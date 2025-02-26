import axios from "axios";
import { domain } from "../endpoints";

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

// Function to attach interceptors
export const setupAxiosInterceptors = (logout: () => Promise<void>, refreshSession: () => Promise<void>, navigate: (path: string) => void) => {
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (error.response?.status === 401 && error.response?.data?.message?.includes("Session expired")) {
                await logout();
                navigate("/");
                return Promise.reject(error);
            }

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
                    await logout();
                    navigate("/");
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );
};

export default api;
