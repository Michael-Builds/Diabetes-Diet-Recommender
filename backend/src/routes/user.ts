import express from "express";
import {
    accountRegister,
    activateAccount,
    forgotPassword,
    getUserInfo,
    resendActivationCode,
    resetPassword,
    userLogin,
    userLogout
} from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { getUserNotifications, updateNotificationStatus } from "../controllers/notification.controller";

const userRouter = express.Router();

// Public routes
userRouter.post("/register", accountRegister);
userRouter.post("/account-activate", activateAccount);
userRouter.post("/resend-activation", resendActivationCode);
userRouter.post("/login", userLogin);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);

// Authenticated User Routes
userRouter.get("/logout", isAuthenticated, userLogout);
userRouter.get("/get-user", isAuthenticated, getUserInfo);
userRouter.get("/notifications", isAuthenticated, getUserNotifications);
userRouter.put("/update-notification-status/:id", isAuthenticated, updateNotificationStatus);

export default userRouter;
