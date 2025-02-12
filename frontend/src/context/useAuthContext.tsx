import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login_url, logout_url, refresh_token_url } from "../endpoints";
import { AuthResponse, AuthState, EnhancedAuthContextType, initialState, LoginCredentials, User } from "../interfaces";



const AuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>(initialState);

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

    const updateState = useCallback((updates: Partial<AuthState>) => {
        setState(prev => {
            const newState = { ...prev, ...updates };

            // Handle token updates
            if ('token' in updates) {
                if (updates.token) {
                    localStorage.setItem('token', updates.token);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${updates.token}`;
                } else {
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }

            // Handle refresh token updates
            if ('refreshToken' in updates) {
                updates.refreshToken
                    ? localStorage.setItem('refreshToken', updates.refreshToken)
                    : localStorage.removeItem('refreshToken');
            }

            // Handle user updates
            if ('user' in updates) {
                updates.user
                    ? localStorage.setItem('user', JSON.stringify(updates.user))
                    : localStorage.removeItem('user');
            }

            return newState;
        });
    }, []);

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

    const contextValue = useMemo(
        () => ({
            user: state.user,
            setUser: (user: User | null) => updateState({ user }),
            login,
            logout,
            refresh,
            isAuthenticated: !!state.user && !!state.token,
            isLoading: state.isLoading,
            error: state.error,
        }),
        [state, login, logout, refresh, updateState]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};