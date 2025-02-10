import { CatchAsyncErrors } from './../middlewares/catchAsyncError';
import { NextFunction, Request, Response } from "express";
import userModel from "../models/user";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthenticatedRequest, IActivationRequest, IActivationToken, ILoginRequest, IUser } from "../interfaces/user.interface";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { ACCESS_TOKEN, ACCESS_TOKEN_EXPIRY, ACTIVATION_SECRET, REFRESH_TOKEN, REFRESH_TOKEN_EXPIRY, RESET_PASSWORD_SECRET } from "../config";
import sendEmail from "../utils/sendEmail";
import { clearCache, setCache } from '../utils/catche.management';
import { accessTokenOptions, refreshTokenOptions, sendToken } from '../utils/jwt';
import bcrypt from 'bcrypt';
import { redis } from '../utils/redis';
import { getUserById } from '../services/user.services';

// Account registration handler
export const accountRegister = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    // Extract user details from request body
    const { firstname, lastname, email, phone_number, password, gender } = req.body;

    try {
        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return next(new ErrorHandler("Invalid email format", 400));
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return next(
                new ErrorHandler("Weak Password", 400)
            );
        }

        // Check if email already exists
        const isEmailExist = await userModel.exists({ email });
        if (isEmailExist) {
            return next(new ErrorHandler("Email already exists", 400));
        }

        // Create new user
        const user = new userModel({
            firstname,
            lastname,
            email,
            password,
            gender,
            phone_number,
        });

        await user.save();

        // Generate activation token
        const { token, activationCode, expirationTimestamp } = createActivationToken(user);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = Math.max(0, Math.ceil((expirationTimestamp - currentTime) / 60));

        const data = { user: { firstname: user.firstname }, activationCode, timeRemaining };

        // Send activation email
        await sendEmail({
            email: user.email,
            subject: "Activate your account",
            template: "activation-email.ejs",
            data
        });

        res.status(201).json({
            success: true,
            message: `Please check your email: ${user.email} to activate your account.`,
            activationToken: token,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// Function to create an activation token
export const createActivationToken = (user: IUser): IActivationToken => {
    const activationCode = Math.floor(10000 + Math.random() * 9000).toString();

    const expiresInSeconds = 30 * 60;
    const expirationTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;

    const token = jwt.sign(
        { user: { email: user.email }, activationCode, exp: expirationTimestamp },
        ACTIVATION_SECRET as Secret
    );

    return { token, activationCode, expirationTimestamp };
};


// Resend activation code handler without email input
export const resendActivationCode = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { activation_token } = req.body;

    try {
        const decoded = jwt.verify(activation_token, ACTIVATION_SECRET as string) as JwtPayload & {
            user: { email: string };
            activationCode: string;
        };

        const { user, exp } = decoded;
        const { email } = user;

        const foundUser = await userModel.findOne({ email });

        if (!foundUser) return next(new ErrorHandler("User not found", 404));
        if (foundUser.isVerified) return next(new ErrorHandler("User already verified", 400));

        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = exp ? Math.max(0, Math.ceil((exp - currentTime) / 60)) : 0;

        if (timeRemaining <= 0) {
            return next(new ErrorHandler("Activation token has expired. Request a new one.", 400));
        }

        const { token, activationCode: newActivationCode } = createActivationToken(foundUser);
        const data = { user: { firstname: foundUser.firstname }, activationCode: newActivationCode, timeRemaining };

        await sendEmail({
            email: foundUser.email,
            subject: "Resent Activation Code",
            template: "resend-activation.ejs",
            data
        });

        res.status(200).json({
            success: true,
            message: `A new activation code has been sent to: ${foundUser.email}`,
            activationToken: token
        });

    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            return next(new ErrorHandler("Activation token has expired. Request a new one.", 400));
        } else if (err.name === "JsonWebTokenError") {
            return next(new ErrorHandler("Invalid activation token", 400));
        }
        return next(new ErrorHandler("Resend activation code failed", 500));
    }
});


// Account activation handler
export const activateAccount = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { activation_token, activation_code } = req.body as IActivationRequest;

    try {
        const decoded = jwt.verify(
            activation_token,
            ACTIVATION_SECRET as string
        ) as JwtPayload & { user: { email: string }; activationCode: string; exp: number };

        const { user, activationCode, exp } = decoded;

        if (activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid activation code", 400));
        }

        const existingUser = await userModel.findOne({ email: user.email });

        if (!existingUser) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (existingUser.isVerified) {
            return next(new ErrorHandler("User is already verified", 400));
        }

        existingUser.isVerified = true;
        await existingUser.save();

        res.status(200).json({
            success: true,
            message: "Account activated successfully",
        });

    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return next(new ErrorHandler("Activation link has expired", 400));
        } else if (err.name === 'JsonWebTokenError') {
            return next(new ErrorHandler("Invalid activation link", 400));
        }
        return next(new ErrorHandler("Activation failed", 500));
    }
});

// User login handler
export const userLogin = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body as ILoginRequest;

        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400));
        }

        // Find the user in the database
        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }

        // Compare the provided password with the stored hashed password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }

        await user.save();

        // Save user session in Redis with a 1-hour expiration
        await setCache(user?.id, user, 3600);

        // Generate tokens and send them in the response
        sendToken(user, 200, res);
    } catch (err: any) {
        return next(new ErrorHandler(err.message, 400));
    }
});


// user logout handler
export const userLogout = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Clear the access token cookie by setting its maxAge to 1 millisecond
        res.cookie("access_token", "", { maxAge: 1, httpOnly: true });

        // Clear the refresh token cookie by setting its maxAge to 1 millisecond
        res.cookie("refresh_token", "", { maxAge: 1, httpOnly: true });

        // Extract the authenticated user from the request object
        const user = req.user;

        if (user) {
            // Convert the user's ObjectId to a string format
            const userId = String(user._id);
            await clearCache(userId);
        } else {
            console.warn("No user found in request, skipping Redis deletion.");
        }
        // Send a success response to the client indicating the user has been logged out
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (err: any) {
        // Pass any errors that occur to the global error handler
        return next(new ErrorHandler(err.message, 400));
    }
});


// forgot password
export const forgotPassword = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return next(new ErrorHandler("User not found with this email", 404));
        }

        // Generate a 4-digit reset code and JWT token
        const { token, activationCode } = createResetPasswordToken(user);

        // Email data
        const data = { user: { firstname: user.firstname }, activationCode };

        // Send email with reset code
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request",
            template: "password-reset.ejs",
            data,
        });

        res.status(200).json({
            success: true,
            message: `A password reset code has been sent to ${user.email}`,
            resetToken: token,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// Function to create a reset token with activation code
export const createResetPasswordToken = (user: IUser): IActivationToken => {
    // Generate a random 4-digit code
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Set token expiration time (e.g., 30 minutes)
    const expiresInSeconds = 30 * 60; // 30 minutes
    const expirationTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;

    // Create a reset JWT token with expiration
    const token = jwt.sign(
        { user: { id: user._id }, activationCode, exp: expirationTimestamp },
        RESET_PASSWORD_SECRET as Secret,
        { expiresIn: expiresInSeconds }
    );

    return { token, activationCode, expirationTimestamp };
};


// reset password handler
export const resetPassword = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { token, activationCode, newPassword } = req.body;

    try {
        // Decode the JWT and get the user ID and code
        const decoded = jwt.verify(token, RESET_PASSWORD_SECRET as string) as { user: { id: string }; activationCode: string };

        if (decoded.activationCode !== activationCode) {
            return next(new ErrorHandler("Invalid reset code", 400));
        }

        // Find the user by ID
        const user = await userModel.findById(decoded.user.id);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Update the password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password has been reset successfully",
        });

    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return next(new ErrorHandler("Reset token has expired", 400));
        } else if (error.name === 'JsonWebTokenError') {
            return next(new ErrorHandler("Invalid reset token", 400));
        }
        return next(new ErrorHandler("Password reset failed", 500));
    }
});


// get user infor handler
export const getUserInfo = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        let userId: string;

        // Check for access token in cookies
        const accessToken = req.cookies.access_token;

        if (accessToken) {
            try {
                // Attempt to verify the access token
                const decoded = jwt.verify(accessToken, ACCESS_TOKEN as string) as JwtPayload;
                userId = decoded.id;
            } catch (error: any) {
                if (error.name === 'TokenExpiredError') {
                    // Attempt to refresh the token
                    updateAccessToken(req, res, next);
                    // Check if the token refresh was successful
                    if (req.user) {
                        userId = String(req.user._id);
                    } else {
                        return next(new ErrorHandler("Session expired. Please log in again.", 401));
                    }
                } else {
                    return next(new ErrorHandler("Invalid token. Please log in again.", 401));
                }
            }
        } else {
            return next(new ErrorHandler("No access token found. Please log in.", 401));
        }

        if (!userId) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        // Retrieve user details from Redis or database
        const userSession = await redis.get(userId);

        if (userSession) {
            const userDetails = JSON.parse(userSession);
            res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                user: userDetails
            });
        } else {
            await getUserById(userId, res);
        }
    } catch (err: any) {
        return next(new ErrorHandler(err.message, 400));
    }
});

// Update access token handler
export const updateAccessToken = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token as string;
        // const refresh_token = req.headers["refresh-token"] as string;

        const decoded = jwt.verify(refresh_token, REFRESH_TOKEN as string) as JwtPayload;
        const message = "Couldn't refresh token";

        if (!decoded) {
            return next(new ErrorHandler(message, 400));
        }

        const session = await redis.get(decoded.id);

        if (!session) {
            return next(new ErrorHandler("Please login to access this resource", 400));
        }

        const user = JSON.parse(session);

        const accessToken = jwt.sign({ id: user._id }, ACCESS_TOKEN as string, {
            expiresIn: "24h",
        });

        const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN as string, {
            expiresIn: "14d",
        });

        // If called within a middleware, continue the request
        if (next) {
            req.user = user;
            return next();
        }
        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        await setCache(user?.id, user, 604800);

        res.status(200).json({
            success: true,
            accessToken,
        });
    } catch (err: any) {
        return next(new ErrorHandler("Authorization failed", 500));
    }
});
