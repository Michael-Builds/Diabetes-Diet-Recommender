import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../interfaces/user.interface";

export const CatchAsyncErrors = <T>(theFunc: (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<T>>) => {
    return (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => {
        Promise.resolve(theFunc(req, res, next)).catch(next);
    };
};
