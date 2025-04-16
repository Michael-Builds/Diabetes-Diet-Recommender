import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";

export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Handle known errors first
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    }

    if (err.name === "JsonWebTokenError") {
        err = new ErrorHandler("JSON Web Token is invalid, try again", 400);
    }

    if (err.name === "TokenExpiredError") {
        err = new ErrorHandler("JSON Web Token is expired, try again", 400);
    }

    // 👇 Always set default values *after* any potential replacements
    err.status = err.status || 500;
    err.message = err.message || "Internal Server Error";

    res.status(err.status).json({
        success: false,
        message: err.message,
    });
}