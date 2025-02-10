import { NextFunction, Request, Response } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncError";
import notificationModel from "../models/notification.model";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthenticatedRequest } from "../interfaces/user.interface";


// Fetches user notifications
export const getUserNotifications = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?._id) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        const userId = req.user._id;

        // Fetch notifications for the logged-in user
        const notifications = await notificationModel
            .find({ userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "User notifications retrieved successfully",
            notifications,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
}
);

// update notification status handler
export const updateNotificationStatus = CatchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?._id) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        const notification = await notificationModel.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { status: "read" },
            { new: true }
        );

        if (!notification) {
            return next(new ErrorHandler("Notification not found or unauthorized", 404));
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});


