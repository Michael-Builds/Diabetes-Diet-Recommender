import { CatchAsyncErrors } from './../middlewares/catchAsyncError';
import { NextFunction, Request, Response } from "express";
import userModel from "../models/user";
import ErrorHandler from "../utils/ErrorHandler";
import { IActivationRequest, IActivationToken, ILoginRequest, IUser } from "../interfaces/user.interface";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { ACTIVATION_SECRET } from "../config";
import sendEmail from "../utils/sendEmail";
import { clearCache, setCache } from '../utils/catche.management';
import { sendToken } from '../utils/jwt';

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


export const userLogout = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    
})

