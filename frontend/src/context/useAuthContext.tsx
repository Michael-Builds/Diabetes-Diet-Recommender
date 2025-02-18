import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
    login: (credentials: any) => Promise<any>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
    isAuthenticated: boolean;
    user: any;
    notifications: any[];
    fetchNotifications: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("user") || "null"));
    const [token, setToken] = useState<string | null>(localStorage.getItem("token") || null);
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken") || null);
    const [notifications, setNotifications] = useState<any[]>([]);
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

                await fetchNotifications()
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
            setUser(null);
            setToken(null);
            setRefreshToken(null);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Refresh token function
    const refreshSession = async () => {
        if (refreshToken) {
            try {
                const { data } = await authService.refreshToken();
                if (data.success) {
                    setToken(data.accessToken);
                    localStorage.setItem("token", data.accessToken);
                }
            } catch (error) {
                console.error("Failed to refresh session:", error);
                logout();
            }
        }
    };

    // Fetch notifications function
    const fetchNotifications = async () => {
        try {
            const { data } = await authService.getNotifications();
            setNotifications(data.notifications);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
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

    const contextValue = useMemo(
        () => ({
            login,
            logout,
            isAuthenticated,
            notifications,
            fetchNotifications,
            refreshSession,
            user,
        }),
        [isAuthenticated, user, notifications]
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
