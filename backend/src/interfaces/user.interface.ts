import { Request } from "express";
import { Document } from "mongoose";

export interface IUser extends Document {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    },
    comparePassword: (password: string) => Promise<boolean>
    signAccessToken: () => string
    signRefreshToken: () => string
    isVerified: boolean
    gender: string;
    phone_number: string;
    date_of_birth: Date;
    health_details: {
        diabetic_type: string;
        current_weight: number;
        height: number;
    },
    diatery_preferences: {
        preferred_diet_type: string;
        food_allergies: string[];
        foods_to_avoid: string[];
        favorite_foods: string[];
    },
    customizations: {
        meal_reminder_preference: boolean;
        preferred_time_for_diet: string;
        notification_preference: string;
    }
}

export interface IActivationToken {
    token: string;
    activationCode: string;
    expirationTimestamp: number;
}



export interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}


export interface ILoginRequest {
    email: string;
    password: string;
}



export interface AuthenticatedRequest extends Request {
    user?: IUser;
}