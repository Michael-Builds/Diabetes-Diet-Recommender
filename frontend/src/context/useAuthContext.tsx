import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { setupAxiosInterceptors } from "../services/api";

interface AuthContextType {
    login: (credentials: any) => Promise<any>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
    isAuthenticated: boolean;
    user: any;
    notifications: any[];
    fetchNotifications: () => Promise<void>;
    setUser: (user: any) => void;
    recommendations: any[];
    fetchRecommendations: () => Promise<void>;
    isLoadingRecs: boolean;
    updateNotificationStatus: (notificationId: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUserState] = useState<any>(JSON.parse(localStorage.getItem("user") || "null"));
    const [token, setToken] = useState<string | null>(localStorage.getItem("token") || null);
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken") || null);
    const [notifications, setNotifications] = useState<any[]>(JSON.parse(localStorage.getItem("notifications") || "[]"));
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = useMemo(() => !!token, [token]);

    const setUser = (updatedUser: any) => {
        const newUser = JSON.parse(JSON.stringify({ ...user, ...updatedUser }));
        setUserState(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
    };

    const fetchRecommendations = useCallback(async () => {
        try {
            if (!user?._id) return;
            
            setIsLoadingRecs(true);
            const { data } = await authService.getRecommendations(user._id);
            setRecommendations(data?.recommendations || []);
        } catch (error) {
            console.error("Failed to fetch recommendations:", error);
            setRecommendations([]);
        } finally {
            setIsLoadingRecs(false);
        }
    }, [user?._id]);

    const login = async (credentials: any) => {
        try {
            const { data } = await authService.login(credentials);
            if (data.success) {
                setUser(data.user);
                setToken(data.accessToken);
                setRefreshToken(data.refreshToken);
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("token", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);

                await Promise.all([fetchNotifications(), fetchRecommendations()]);
                return data;
            }
            throw new Error(data.message);
        } catch (error) {
            return "Error during login.";
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await authService.logout();
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("notifications");
            setUser(null);
            setToken(null);
            setRefreshToken(null);
            setRecommendations([]);
            setNotifications([]);
            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const refreshSession = async () => {
        if (!refreshToken) {
            await logout();
            return;
        }
        try {
            const { data } = await authService.refreshToken();
            if (data.success) {
                setToken(data.accessToken);
                localStorage.setItem("token", data.accessToken);
            } else {
                await logout();
            }
        } catch (error) {
            console.error("Failed to refresh session:", error);
            await logout();
        }
    };

    const fetchNotifications = async () => {
        try {
            const { data } = await authService.getNotifications();
            setNotifications(data.notifications);
            localStorage.setItem("notifications", JSON.stringify(data.notifications));
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const updateNotificationStatus = async (notificationId: string): Promise<void> => {
        try {
            const response = await authService.updateNotificationStatus(notificationId);
            if (response.data.success) {
                setNotifications(prev => {
                    const updated = prev.map(n => 
                        n._id === notificationId ? { ...n, status: "read" } : n
                    );
                    localStorage.setItem("notifications", JSON.stringify(updated));
                    return updated;
                });
            }
        } catch (error) {
            console.error(`Failed to update notification ${notificationId}:`, error);
        }
    };

    useEffect(() => {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        }
    }, [user]);

    useEffect(() => {
        setupAxiosInterceptors(logout, refreshSession, navigate);
    }, [logout, refreshSession, navigate]);

    const contextValue = useMemo(() => ({
        login,
        logout,
        isAuthenticated,
        notifications,
        fetchNotifications,
        refreshSession,
        user,
        setUser,
        fetchRecommendations,
        recommendations,
        isLoadingRecs,
        updateNotificationStatus
    }), [isAuthenticated, user, notifications, recommendations, isLoadingRecs]);

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
};