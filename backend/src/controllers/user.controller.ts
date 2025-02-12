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
        // Validate input
        if (!email || !activationCode || !newPassword) {
            return next(new ErrorHandler("All fields are required", 400));
        }

        // Retrieve stored activation code from Redis
        const storedCode = await redis.get(`reset-code:${email}`);

        if (!storedCode) {
            return next(new ErrorHandler("Reset code has expired or is invalid", 400));
        }

        if (storedCode !== activationCode) {
            return next(new ErrorHandler("Invalid reset code", 400));
        }

        // Find the user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Hash the new password
        user.password = await bcrypt.hash(newPassword, 10);

        // Save updated password
        await user.save();

        // Remove activation code from Redis after successful reset
        await redis.del(`reset-code:${email}`);

        // Create a notification for the user
        await notificationModel.create({
            userId: String(user._id),
            title: "Reset Password",
            message: `You've successfully reset your password.`,
        });


        // Send email with activation code
        await sendEmail({
            email: user.email,
            subject: "Password Reset Successful",
            template: "reset-password-success.ejs",
            data: {
                firstname: user.firstname,
            },
        });

        res.status(200).json({
            success: true,
            message: "Password has been reset successfully",
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
        if (!refresh_token) return next(new ErrorHandler("No refresh token provided", 400));

        const decoded = jwt.verify(refresh_token, REFRESH_TOKEN as string) as JwtPayload;
        if (!decoded) return next(new ErrorHandler("Invalid refresh token", 400));

        const session = await redis.get(decoded.id);
        if (!session) return next(new ErrorHandler("Session expired. Please login again.", 400));

        const user = JSON.parse(session);

        const accessToken = jwt.sign({ id: user._id }, ACCESS_TOKEN as string, { expiresIn: "24h" });
        const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN as string, { expiresIn: "14d" });

        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        await setCache(user?.id, user, 604800);

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

        const { firstname, lastname, oldPassword, newPassword, avatar, phone_number, gender } = req.body;

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

        if (avatar && avatar.public_id && avatar.url) {
            user.avatar = { public_id: avatar.public_id, url: avatar.url };
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

