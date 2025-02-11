import express from "express";
import {
    accountRegister,
    activateAccount,
    forgotPassword,
    getUserInfo,
    resendActivationCode,
    resetPassword,
    updateUserCustomizations,
    updateUserHealthDetails,
    updateUserProfile,
    userLogin,
    userLogout
} from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { getUserNotifications, updateNotificationStatus } from "../controllers/notification.controller";
import { generateMonthlyRecommendations, getUserRecommendations } from "../controllers/recommendation.controller";

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
userRouter.put("/update-profile", isAuthenticated, updateUserProfile);
userRouter.put("/update-health-details", isAuthenticated, updateUserHealthDetails);
userRouter.put("/update-customizations", isAuthenticated, updateUserCustomizations);

// Generate recommendations for the next 30 days
userRouter.post("/generate-recommendations/:userId", isAuthenticated, generateMonthlyRecommendations);
userRouter.get("/get-recommendations/:userId", isAuthenticated, getUserRecommendations);

export default userRouter;
