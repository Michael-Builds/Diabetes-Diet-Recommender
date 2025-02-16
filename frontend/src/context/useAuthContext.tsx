import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get_notifications_url, login_url, logout_url, refresh_token_url, update_profile_url } from "../endpoints";
import { AuthResponse, AuthState, EnhancedAuthContextType, initialState, LoginCredentials, User } from "../interfaces";

const AuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>(initialState);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifLoading, setIsNotifLoading] = useState<boolean>(false);
    const [notifError, setNotifError] = useState<string | null>(null);

    // Function to process failed requests when refreshing tokens
    const processQueue = (error: Error | null, token: string | null = null) => {
        failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        failedQueue = [];
    };

    // Function to update AuthState globally
    const updateState = useCallback((updates: Partial<AuthState>) => {
        setState(prev => {
            const newState = { ...prev, ...updates };

            if ('token' in updates) {
                if (updates.token) {
                    localStorage.setItem('token', updates.token);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${updates.token}`;
                } else {
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }

            if ('refreshToken' in updates) {
                updates.refreshToken
                    ? localStorage.setItem('refreshToken', updates.refreshToken)
                    : localStorage.removeItem('refreshToken');
            }

            if ('user' in updates) {
                updates.user
                    ? localStorage.setItem('user', JSON.stringify(updates.user))
                    : localStorage.removeItem('user');
            }

            return newState;
        });
    }, []);

    // Refresh Token
    const refresh = useCallback(async (): Promise<AuthResponse> => {
        try {
            updateState({ isLoading: true, error: null });
            const response = await axios.get<AuthResponse>(refresh_token_url);

            updateState({
                token: response.data.access_token,
                refreshToken: response.data.refresh_token,
                isLoading: false
            });

            return response.data;
        } catch (error) {
            const message = error instanceof AxiosError
                ? `Refresh failed: ${error.message}`
                : 'An unexpected error occurred';

            updateState({ error: message, isLoading: false });
            throw new Error(message);
        }
    }, [updateState]);

    // Login Function
    const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
        try {
            updateState({ isLoading: true, error: null });
            const response = await axios.post<AuthResponse>(login_url, credentials);

            updateState({
                user: response.data.user,
                token: response.data.access_token,
                refreshToken: response.data.refresh_token,
                isLoading: false
            });

            return response.data;
        } catch (error) {
            const message = error instanceof AxiosError
                ? `Login failed: ${error.message}`
                : 'An unexpected error occurred';

            updateState({ error: message, isLoading: false });
            throw new Error(message);
        }
    }, [updateState]);

    // Logout Function
    const logout = useCallback(async (): Promise<void> => {
        try {
            updateState({ isLoading: true, error: null });
            await axios.post(logout_url);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            updateState({
                user: null,
                token: null,
                refreshToken: null,
                isLoading: false,
                error: null
            });
            localStorage.clear();
        }
    }, [updateState]);

    // Fetch Notifications
    const fetchNotifications = useCallback(async () => {
        setIsNotifLoading(true);
        setNotifError(null);
        try {
            const response = await axios.get(get_notifications_url);
            setNotifications(response.data);
        } catch (error) {
            setNotifError("Failed to fetch notifications");
        } finally {
            setIsNotifLoading(false);
        }
    }, []);

    // Fetch Notifications on Mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Update Profile Function
    const updateProfile = useCallback(async (updatedData: any) => {
        try {
            updateState({ isLoading: true, error: null });
            await axios.put(update_profile_url, updatedData);

            fetchNotifications();

            updateState({ isLoading: false });
        } catch (error) {
            updateState({ error: "Profile update failed", isLoading: false });
        }
    }, [fetchNotifications, updateState]);

    // Axios Interceptor for Auto-Refresh
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (isRefreshing) {
                        return new Promise((resolve, reject) => {
                            failedQueue.push({ resolve, reject });
                        })
                            .then(() => axios(originalRequest))
                            .catch((err) => Promise.reject(err));
                    }

                    originalRequest._retry = true;
                    isRefreshing = true;

                    try {
                        await refresh();
                        processQueue(null);
                        return axios(originalRequest);
                    } catch (refreshError) {
                        processQueue(refreshError as Error);
                        logout();
                        return Promise.reject(refreshError);
                    } finally {
                        isRefreshing = false;
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [refresh, logout]);

    // Expose everything in Context
    const contextValue = useMemo(
        () => ({
            user: state.user,
            setUser: (user: User | null) => updateState({ user }),
            login,
            logout,
            refresh,
            updateProfile,
            isAuthenticated: !!state.user && !!state.token,
            isLoading: state.isLoading,
            error: state.error,
            notifications,
            fetchNotifications,
            isNotifLoading,
            notifError
        }),
        [state, login, logout, refresh, updateProfile, updateState, notifications, fetchNotifications, isNotifLoading, notifError]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use AuthContext
export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
