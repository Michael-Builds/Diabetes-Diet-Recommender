import { NextFunction, Request } from "express";
import { CatchAsyncErrors } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { ACCESS_TOKEN } from "../config";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
import { AuthenticatedRequest, IUser } from "../interfaces/user.interface";


export const isAuthenticated = CatchAsyncErrors(async (req: AuthenticatedRequest, next: NextFunction) => {

    const access_token = req.cookies.access_token as string;
    if (!access_token) {
        return next(new ErrorHandler("Please login to access this resource.", 401));
    }

    try {
        // Verify the access token
        const decoded = jwt.verify(access_token, ACCESS_TOKEN as string) as JwtPayload
        if (!decoded) {
            return next(new ErrorHandler("Invalid access token", 401));
        }

        // Retreive user fromredis using the ID from the token
        const user = await redis.get(decoded.id)
        if (!user) {
            return next(new ErrorHandler("Please login to access this resource.", 401))
        }

        req.user = JSON.parse(user)
        next();

    } catch (error: any) {
        return next(new ErrorHandler("Invalid or expired token", 500));
    }
})