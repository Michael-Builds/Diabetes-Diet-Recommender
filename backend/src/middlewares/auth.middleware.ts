import { NextFunction, Request } from "express";
import { CatchAsyncErrors } from "./catchAsyncError";

export const isAuthenticated = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    
})