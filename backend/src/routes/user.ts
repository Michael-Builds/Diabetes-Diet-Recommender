import express from "express";
import {
    accountRegister,
    activateAccount,
    resendActivationCode,
    userLogin,
    userLogout
} from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/auth.middleware";

const userRouter = express.Router();

// Public routes
userRouter.post("/register", accountRegister);
userRouter.post("/account-activate", activateAccount);
userRouter.post("/resend-activation", resendActivationCode);
userRouter.post("/login", userLogin);

// Authenticated User Routes
userRouter.get("/logout", isAuthenticated, userLogout);

export default userRouter;
