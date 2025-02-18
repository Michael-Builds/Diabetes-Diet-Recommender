import { AxiosError } from "axios";
import {
    createContext,
    Dispatch,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

interface AuthState {
    user: any | null;
    isAuthenticated: boolean;
    notifications: any[];
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    notifications: [],
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

interface AuthContextProps {
    user: any | null;
    notifications: any[];
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
    fetchNotifications: () => Promise<void>;
    dispatch: Dispatch<AuthAction>
}

type AuthAction =
    | { type: "LOGIN_SUCCESS"; payload: any }
    | { type: "LOGOUT" }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "SET_NOTIFICATIONS"; payload: any[] };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case "LOGIN_SUCCESS":
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };
        case "LOGOUT":
            return { ...initialState };
        case "SET_LOADING":
            return { ...state, isLoading: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload };
        case "SET_NOTIFICATIONS":
            return { ...state, notifications: action.payload };
        default:
            return state;
    }
};



const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        if (!state.isAuthenticated) return;
        try {
            const { data } = await authService.getNotifications();
            dispatch({ type: "SET_NOTIFICATIONS", payload: data.notifications });
            console.log("🟢 Notifications Fetched:", data.notifications);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const login = async (credentials: any) => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
            const { data } = await authService.login(credentials);
            console.log("🔵 Login Response:", data);
            localStorage.setItem("user", JSON.stringify(data.user));
            dispatch({ type: "LOGIN_SUCCESS", payload: data.user });
            await fetchNotifications();
        } catch (error: any) {
            const errorMsg = error instanceof AxiosError
                ? error.response?.data?.message || "Login failed"
                : "An error occurred";
            dispatch({ type: "SET_ERROR", payload: errorMsg });
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            localStorage.removeItem("user");
            dispatch({ type: "LOGOUT" });
            navigate("/login");
        }
    };

    const refresh = async () => {
        if (!state.user) return;
        try {
            const { data } = await authService.refreshToken();
            
            if (data.token && data.refreshToken) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("refreshToken", data.refreshToken);
            }

            localStorage.setItem("user", JSON.stringify(data.user));
            dispatch({ type: "LOGIN_SUCCESS", payload: data.user });
            await fetchNotifications();
        } catch (error) {
            console.error("Failed to refresh token:", error);
            logout();
        }
    };

    const updateProfile = async (data: any) => {
        try {
            await authService.updateProfile(data);
            const updatedUser = { ...state.user, ...data };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            dispatch({ type: "LOGIN_SUCCESS", payload: { ...state.user, ...data } });
            await fetchNotifications();
        } catch (error) {
            console.error("Profile update failed:", error);
        }
    };


    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        try {
            if (storedUser && storedToken) {
                dispatch({ type: "LOGIN_SUCCESS", payload: JSON.parse(storedUser) });
                fetchNotifications();
            } else {
                localStorage.removeItem("user");
                refresh();
            }
        } catch (error) {
            console.error("Error parsing stored user:", error);
            localStorage.removeItem("user");
            refresh();
        }
    }, []);


    // ✅ Fetch notifications **only when user is authenticated**
    useEffect(() => {
        if (state.isAuthenticated) {
            fetchNotifications();
        }
    }, [state.isAuthenticated]);

    // Check if user is authenticated on app load
    useEffect(() => {
        if (!state.user) return;
        const checkAuth = async () => {
            try {
                await refresh();
            } catch (error) {
                logout();
            }
        };
        checkAuth();
    }, [state.user]);

    const contextValue = useMemo(() => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        notifications: state.notifications,
        isLoading: state.isLoading,
        error: state.error,
        login,
        logout,
        refresh,
        updateProfile,
        fetchNotifications,
        dispatch
    }), [state]);

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
};
