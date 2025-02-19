import { Navigate } from "react-router-dom";
import { useAuthContext } from "./useAuthContext";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    
    const { isAuthenticated }: any = useAuthContext();
    return isAuthenticated ? children : <Navigate to="/" />;
};

export default RequireAuth;