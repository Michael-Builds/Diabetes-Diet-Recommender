import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { ACCESS_TOKEN, ACTIVATION_SECRET, REFRESH_TOKEN, RESET_PASSWORD_SECRET } from "../config";
import { AuthenticatedRequest, IActivationRequest, IActivationToken, ILoginRequest, IUser } from "../interfaces/user.interface";
import notificationModel from '../models/notification.model';
import userModel from "../models/user";
import { clearCache, setCache } from '../utils/catche.management';
import ErrorHandler from "../utils/ErrorHandler";
import { accessTokenOptions, refreshTokenOptions, sendToken } from '../utils/jwt';
import { redis } from '../utils/redis';
import sendEmail from "../utils/sendEmail";
import { CatchAsyncErrors } from './../middlewares/catchAsyncError';
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Validate password strength
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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

        res.cookie("activation_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 60 * 1000,
        });
        res.status(201).json({
            success: true,
            message: `Please check your email: ${user.email} to activate your account.`,
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
    // ✅ Read activation token from cookies instead of request body
    const activation_token = req.cookies.activation_token;
    const { activation_code } = req.body as IActivationRequest;

    if (!activation_token) {
        return next(new ErrorHandler("Activation token is missing", 400));
    }

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

        // ✅ Remove activation token from cookies after successful activation
        res.clearCookie("activation_token");

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

        // ✅ Ensure password is retrieved from database
        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }

        // ✅ Ensure password comparison works correctly
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }
        await setCache(String(user._id), user, 3600);

        sendToken(user, 200, res);
    } catch (err: any) {
        return next(new ErrorHandler(err.message, 400));
    }
});


// user logout handler
export const userLogout = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        console.log("🟡 Logging out user...");

        // Clear the access token cookie
        res.cookie("access_token", "", { maxAge: 1, httpOnly: true });
        res.cookie("refresh_token", "", { maxAge: 1, httpOnly: true });

        // Remove session from Redis
        const user = req.user;
        if (user) {
            console.log("🟡 Removing Redis session for user:", user._id);
            await clearCache(String(user._id));
        } else {
            console.warn("🔴 No user found in request, skipping Redis deletion.");
        }

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });

    } catch (err: any) {
        console.error("❌ Logout error:", err.message);
        return next(new ErrorHandler(err.message, 400));
    }
});


// Function to generate a 4-digit activation code
const generateActivationCode = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Forgot Password Handler
export const forgotPassword = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return next(new ErrorHandler("User not found with this email", 404));
        }

        // Generate a 4-digit reset code
        const activationCode = generateActivationCode();

        // Store activation code in Redis (expires in 10 minutes)
        await redis.set(`reset-code:${email}`, activationCode, "EX", 600);

        // Email data
        const data = { firstname: user.firstname, activationCode };

        // Send email with activation code
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request",
            template: "forgot-password.ejs",
            data,
        });

        // Create a notification for the user
        await notificationModel.create({
            userId: String(user._id),
            title: "Forgot Password",
            message: `You've requested to reset your password.`,
        });

        res.status(200).json({
            success: true,
            message: `A password reset code has been sent to ${user.email}`,
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


// Reset Password Handler
export const resetPassword = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { email, activationCode, newPassword } = req.body;

    try {
        if (!email || !activationCode || !newPassword) {
            return next(new ErrorHandler("All fields are required", 400));
        }

        // Validate password strength
        if (!passwordRegex.test(newPassword)) {
            return next(new ErrorHandler("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character", 400));
        }

        const storedCode = await redis.get(`reset-code:${email}`);
        if (!storedCode) {
            return next(new ErrorHandler("Reset code has expired or is invalid", 400));
        }

        if (storedCode !== activationCode) {
            return next(new ErrorHandler("Invalid reset code", 400));
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password directly in the database
        await userModel.findOneAndUpdate(
            { email },
            { $set: { password: hashedPassword } },
            { new: true }
        );

        // Clear the reset code from Redis
        await redis.del(`reset-code:${email}`);

        // Generate new tokens
        const accessToken = jwt.sign({ id: user._id }, ACCESS_TOKEN as Secret, { expiresIn: "24h" });
        const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN as Secret, { expiresIn: "14d" });

        // Update Redis cache with the latest user data
        const updatedUser = await userModel.findOne({ email });
        if (updatedUser) {
            await redis.set(String(user._id), JSON.stringify(updatedUser), "EX", 86400); // 24 hours
        }

        // Create notification
        await notificationModel.create({
            userId: String(user._id),
            title: "Password Reset Successful",
            message: `Your password has been successfully reset.`,
        });

        // Send email confirmation
        await sendEmail({
            email: user.email,
            subject: "Password Reset Successful",
            template: "reset-password-success.ejs",
            data: { firstname: user.firstname }
        });

        // Set cookies
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);
        res.cookie("access_token", accessToken, accessTokenOptions);

        res.status(200).json({
            success: true,
            message: "Password has been reset successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// get user infor handler
export const getUserInfo = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        let userId: string | null = null;

        // Check for access token in cookies
        const accessToken = req.cookies.access_token;

        if (accessToken) {
            try {
                // Verify the access token
                const decoded = jwt.verify(accessToken, ACCESS_TOKEN as string) as JwtPayload;
                userId = decoded.id;
            } catch (error: any) {
                if (error.name === 'TokenExpiredError') {
                    await updateAccessToken(req, res, next);
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

        // **Check Redis first**
        const cachedUser = await redis.get(userId);
        if (cachedUser) {
            return res.status(200).json({
                success: true,
                message: "User retrieved successfully (from cache).",
                user: JSON.parse(cachedUser),
            });
        }

        // **Fetch from MongoDB if not in Redis**
        const user = await userModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // **Store the latest user data in Redis for faster retrieval next time**
        await setCache(userId, user, 3600);

        res.status(200).json({
            success: true,
            message: "User retrieved successfully.",
            user,
        });
    } catch (err: any) {
        return next(new ErrorHandler(err.message, 400));
    }
});


// Update access token handler
export const updateAccessToken = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {

        const refresh_token = req.cookies.refresh_token as string;
        if (!refresh_token) {
            return next(new ErrorHandler("No refresh token provided", 400));
        }

        // Verify the refresh token
        const decoded = jwt.verify(refresh_token, REFRESH_TOKEN as Secret) as JwtPayload;
        if (!decoded) return next(new ErrorHandler("Invalid refresh token", 400));

        // Check if session exists in Redis
        const session = await redis.get(decoded.id);

        if (!session) {
            return next(new ErrorHandler("Session expired. Please log in again.", 400));
        }

        const user = JSON.parse(session);

        // Generate new access & refresh tokens
        const accessToken = jwt.sign({ id: user._id }, ACCESS_TOKEN as Secret, { expiresIn: "24h" });
        const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN as Secret, { expiresIn: "14d" });

        // ✅ Set Cookies Properly
        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
        });

        // Store updated user session in Redis
        await setCache(user._id, user, 604800);
        return res.status(200).json({ success: true, accessToken });
    } catch (err: any) {
        return next(new ErrorHandler("Authorization failed", 500));
    }
});


// Update user profile
export const updateUserProfile = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        const { firstname, lastname, oldPassword, newPassword, phone_number, gender } = req.body;

        const avatarFile = req.file;

        // Fetch user from database
        const user = await userModel.findById(userId).select("+password");
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (firstname) user.firstname = firstname;
        if (lastname) user.lastname = lastname;
        if (phone_number) user.phone_number = phone_number;
        if (gender) user.gender = gender;

        if (oldPassword && newPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return next(new ErrorHandler("Old password is incorrect", 400));
            }
            user.password = await bcrypt.hash(newPassword, 10);
        }

        // Upload avatar to Cloudinary if a file is provided
        if (avatarFile) {
            console.log("Uploading avatar to Cloudinary...");
            const result = await cloudinary.uploader.upload(avatarFile.path, {
                folder: "user_avatars",
                width: 250,
                height: 250,
                crop: "fill",
            });
            user.avatar = { public_id: result.public_id, url: result.secure_url };

            fs.unlinkSync(avatarFile.path);
        }

        // Save updated user details
        await user.save();

        // **Update in Redis**
        await setCache(String(userId), user, 3600);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// User health details handler
export const updateUserHealthDetails = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        const {
            diabetic_type,
            current_weight,
            height,
            preferred_diet_type,
            food_allergies,
            foods_to_avoid,
            favorite_foods,
        } = req.body;

        // Fetch user from database
        const user = await userModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (diabetic_type) user.health_details.diabetic_type = diabetic_type;
        if (current_weight) user.health_details.current_weight = current_weight;
        if (height) user.health_details.height = height;
        if (preferred_diet_type) user.diatery_preferences.preferred_diet_type = preferred_diet_type;
        if (food_allergies) user.diatery_preferences.food_allergies = food_allergies;
        if (foods_to_avoid) user.diatery_preferences.foods_to_avoid = foods_to_avoid;
        if (favorite_foods) user.diatery_preferences.favorite_foods = favorite_foods;

        await user.save();

        // **Update in Redis**
        await setCache(String(userId), user, 3600);

        res.status(200).json({
            success: true,
            message: "Health and dietary preferences updated successfully",
            user,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// Update user customizations handler
export const updateUserCustomizations = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        const { meal_reminder_preference, preferred_time_for_diet, notification_preference } = req.body;

        // Fetch user from database
        const user = await userModel.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (meal_reminder_preference !== undefined) {
            user.customizations.meal_reminder_preference = meal_reminder_preference;
        }
        if (preferred_time_for_diet) {
            user.customizations.preferred_time_for_diet = preferred_time_for_diet;
        }
        if (notification_preference) {
            user.customizations.notification_preference = notification_preference;
        }

        await user.save();

        // **Update in Redis**
        await setCache(String(userId), user, 3600);

        res.status(200).json({
            success: true,
            message: "Customizations updated successfully",
            user,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

