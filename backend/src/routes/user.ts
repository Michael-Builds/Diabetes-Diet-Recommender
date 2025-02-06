import express from "express";
import { accountRegister, activateAccount, resendActivationCode } from "../controllers/user.controller";

const userRouter = express.Router();

// Public routes
userRouter.post("/register", accountRegister);
userRouter.post("/account-activate", activateAccount);
userRouter.post("/resend-activation", resendActivationCode);

export default userRouter;
