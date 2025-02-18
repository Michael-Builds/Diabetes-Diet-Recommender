import { Response } from "express";
import { ACCESS_TOKEN_EXPIRY, NODE_ENV, REFRESH_TOKEN_EXPIRY } from "../config";
import { redis } from "./redis";
import { IUser } from "../interfaces/user.interface";

interface ITokenOptions {
    expires?: Date;
    maxAge?: number;
    httpOnly: boolean;
    sameSite: "lax" | "none" | "strict";
    secure?: boolean;
}

// Parse the environment variables and provide default values
const accessTokenExpiry = ACCESS_TOKEN_EXPIRY || '5m';
const refreshTokenExpiry = REFRESH_TOKEN_EXPIRY || '7d';


// Helper function to convert time string to milliseconds
const timeToMs = (timeString: string): number => {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1));
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 0;
    }
};

// Set options for the access token cookie
export const accessTokenOptions: ITokenOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === 'production' ? true : undefined,
    maxAge: timeToMs(accessTokenExpiry),
    expires: new Date(Date.now() + timeToMs(accessTokenExpiry)),
};

// Set options for the refresh token cookie
export const refreshTokenOptions: ITokenOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === 'production' ? true : undefined,
    maxAge: timeToMs(refreshTokenExpiry),
    expires: new Date(Date.now() + timeToMs(refreshTokenExpiry)),
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    // Store tokens in HTTP-only cookies (not accessible by JavaScript)
    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, 
    });

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    res.status(statusCode).json({
        success: true,
        user,
        message: "Logged in successfully",
    });
};
