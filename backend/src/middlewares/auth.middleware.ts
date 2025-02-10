import { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ACCESS_TOKEN } from "../config";
import { AuthenticatedRequest } from "../interfaces/user.interface";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import { CatchAsyncErrors } from "./catchAsyncError";

export const isAuthenticated = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    // Retrieve access token from cookies
    const access_token = req.cookies?.access_token;
    if (!access_token) {
        return next(new ErrorHandler("Please login to access this resource.", 401));
    }

    try {
        // Verify the access token
        const decoded = jwt.verify(access_token, ACCESS_TOKEN as string) as JwtPayload;
        if (!decoded || !decoded.id) {
            return next(new ErrorHandler("Invalid access token", 401));
        }

        // Retrieve user from Redis using the ID from the token
        const user = await redis.get(decoded.id);
        if (!user) {
            return next(new ErrorHandler("Session expired. Please login again.", 401));
        }

        // Attach user data to request object
        req.user = JSON.parse(user);
        next(); // ✅ Ensure `next` is correctly called without returning

    } catch (error: any) {
        return next(new ErrorHandler("Invalid or expired token", 401));
    }
});