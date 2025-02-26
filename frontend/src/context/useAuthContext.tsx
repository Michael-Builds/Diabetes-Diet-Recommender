import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
    setRecommendations: (recommendations: any[]) => void;
    updateNotificationStatus: (notificationId: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("user") || "null"));
    const [token, setToken] = useState<string | null>(localStorage.getItem("token") || null);
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken") || null);
    const [notifications, setNotifications] = useState<any[]>(JSON.parse(localStorage.getItem("notifications") || "[]"));
    const [recommendations, setRecommendations] = useState<any>(JSON.parse(localStorage.getItem("recommendations") || "[]"));
    const navigate = useNavigate();
    const isAuthenticated = useMemo(() => !!token, [token]);

    // Login function
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

                await fetchNotifications();
                await fetchRecommendations();
                return data;
            }
            throw new Error(data.message);
        } catch (error) {
            return "Error during login.";
        }
    };

    // Logout function
    const logout = async (): Promise<void> => {
        try {
            await authService.logout();
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("recommendations");
            setUser(null);
            setToken(null);
            setRefreshToken(null);
            setRecommendations([])
            setNotifications([])
            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Refresh token function
    const refreshSession = async () => {
        if (!refreshToken) {
            await logout();
            navigate("/");
            return;
        }
        try {
            const { data } = await authService.refreshToken();
            if (data.success) {
                setToken(data.accessToken);
                localStorage.setItem("token", data.accessToken);
            } else {
                await logout();
                navigate("/");
            }
        } catch (error) {
            console.error("Failed to refresh session:", error);
            await logout();
            navigate("/");
        }
    };

    // Fetch notifications function
    const fetchNotifications = async () => {
        try {
            const { data } = await authService.getNotifications();
            setNotifications(data.notifications);
            localStorage.setItem("notifications", JSON.stringify(data.notifications));
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    // Fetch Recommendations function
    const fetchRecommendations = async () => {
        try {
            if (!user?._id) {
                console.error("❌ User ID is missing, cannot fetch recommendations.");
                return;
            }
            console.log("📢 Fetching recommendations for user:", user._id);

            const { data } = await authService.getRecommendations(user._id);

            if (!data || !Array.isArray(data.recommendations)) {
                console.warn("⚠️ No recommendations returned from API, setting empty array.");
                setRecommendations([]);
                localStorage.setItem("recommendations", JSON.stringify([]));
                return;
            }

            setRecommendations(data.recommendations);
            localStorage.setItem("recommendations", JSON.stringify(data.recommendations));
            console.log("✅ Updated Recommendations:", data.recommendations);
        } catch (error: any) {
            console.error("❌ Failed to fetch recommendations:", error.message);
            setRecommendations([]);
            localStorage.setItem("recommendations", JSON.stringify([]));
        }
    };

    const updateNotificationStatus = async (notificationId: string): Promise<void> => {
        try {
            const response = await authService.updateNotificationStatus(notificationId);

            if (response.data.success) {
                setNotifications((prevNotifications) => {
                    const updatedNotifications = prevNotifications.map((notification) =>
                        notification._id === notificationId
                            ? { ...notification, status: "read" }
                            : notification
                    );

                    // ✅ Update localStorage with the new notifications list
                    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));

                    return updatedNotifications;
                });

            }
        } catch (error) {
            console.error(`❌ Failed to update notification ${notificationId}:`, error);
        }
    };

    // Auto route to login page if no token is available
    useEffect(() => {
        if (!token) {
            navigate("/");
        }
    }, [token, navigate]);

    // store the user data to be accessed globally
    useEffect(() => {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        }
    }, [user]);


    useEffect(() => {
        setupAxiosInterceptors(logout, refreshSession, navigate);
    }, [logout, refreshSession, navigate]);

    const contextValue = useMemo(
        () => ({
            login,
            logout,
            isAuthenticated,
            notifications,
            fetchNotifications,
            refreshSession,
            user,
            setUser,
            recommendations,
            setRecommendations,
            updateNotificationStatus
        }),
        [isAuthenticated, user, notifications, recommendations]
    );

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};


export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
};
