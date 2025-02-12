export interface User {
    id: string;
    email: string;
    
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}


export interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (credentials: LoginCredentials) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refresh: () => Promise<AuthResponse>;
    isAuthenticated: boolean;
}



// Enhanced state interface
export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    error: string | null;
}

// Enhanced context type
export interface EnhancedAuthContextType extends AuthContextType {
    isLoading: boolean;
    error: string | null;
}

export const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    isLoading: false,
    error: null,
};