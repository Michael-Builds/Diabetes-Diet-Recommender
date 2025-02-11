import { Navigate } from "react-router-dom";
import { useAuthContext } from "./useAuthContext";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    const { user }: any = useAuthContext();
    return user ? children : <Navigate to="/login" />;
};

export default RequireAuth;