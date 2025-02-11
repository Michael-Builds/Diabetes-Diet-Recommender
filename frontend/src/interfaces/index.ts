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
