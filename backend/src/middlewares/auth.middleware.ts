import { NextFunction } from "express";
import { ACCESS_TOKEN } from "../config";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import { CatchAsyncErrors } from "./catchAsyncError";
import jwt, { JwtPayload } from "jsonwebtoken";


// export const isAuthenticated = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {

//     const access_token = req.cookies.access_token as string;
//     // const access_token = req.headers["access-token"] as string;

//     // console.log(access_token)

//     if (!access_token) {
//         return next(new ErrorHandler("Please login to access this resource", 401));
//     }

//     try {
//         // Verify the access token
//         const decoded = jwt.verify(access_token, ACCESS_TOKEN as string) as JwtPayload;

//         if (!decoded) {
//             return next(new ErrorHandler("Invalid access token", 401));
//         }
//         // Retrieve user from Redis using the ID from the token
//         const user = await redis.get(decoded.id);

//         if (!user) {
//             return next(new ErrorHandler("Please login to access this resource", 400));
//         }
//         req.user = JSON.parse(user);
//         next();
//     } catch (error: any) {
//         return next(new ErrorHandler("Invalid or expired token", 500));
//     }
// });


// export const authorizeRoles = (...roles: string[]) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         try {
//             // Ensure req.user is populated (typically done by authentication middleware)
//             const user = req.user as IUser;

//             // Check if the user's role is included in the allowed roles
//             if (!roles.includes(user.role || "")) {
//                 // If the role is not authorized, return a 403 Forbidden error
//                 return next(new ErrorHandler(`Access denied: Role ${user.role} is not authorized to access this resource`, 403));
//             }
//             // If the role is authorized, proceed to the next middleware or route handler
//             next();
//         } catch (err: any) {
//             // Handle any unexpected errors and pass them to the global error handler
//             return next(new ErrorHandler("Authorization failed", 500));
//         }
//     };
// };