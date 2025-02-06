import mongoose, { Model, Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../config";

const emailRegexPattern: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userSchema: Schema<IUser> = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, "Please enter your first name"]
    },
    lastname: {
        type: String,
        required: [true, "Please enter your last name"]
    },
    email: {
        type: String,
        require: [true, "Please enter your email"],
        unique: true,
        match: [emailRegexPattern, "Please enter a valid email"]
    },
    password: {
        type: String,
        minlength: [8, "Password must be at least 8 characters"],
        required: [true, "Please enter your password"],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            default: null,
        },
        url: {
            type: String,
            default: null
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    gender: {
        type: String,
        enum: ["male", "female", "undefined"],
        default: "undefined",
        required: false,
    },
    phone_number: {
        type: Number,
        required: false
    },
    date_of_birth: {
        type: Date,
        required: false
    },
    health_details: {
        diabetic_type: {
            type: String,
            required: false
        },
        current_weight: {
            type: Number,
            required: false
        },
        height: {
            type: Number,
            required: false
        }
    },
    diatery_preferences: {
        preferred_diet_type: {
            type: String,
            required: false
        },
        food_allergies: {
            type: [String],
            default: [],
            required: false
        },
        foods_to_avoid: {
            type: [String],
            default: [],
            required: false
        },
        favorite_foods: {
            type: [String],
            default: [],
            required: false
        }
    },
    customizations: {
        meal_reminder_preference: {
            type: Boolean,
            default: false,
            required: false
        },
        preffered_time_for_diet: {
            type: String,
            default: "08:00 AM",
            required: false
        },
        notification_preference: {
            type: String,
            enum: ["email", "sms", "push"],
            default: "email",
            required: false
        }
    }
}, { timestamps: true })


// Hash password before saving into the database
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
    } catch (error: any) {
        return next(error);
    }
    next();
})

// Method to sign the access token
userSchema.methods.signAccessToken = function () {
    try {
        return jwt.sign({ id: this._id }, ACCESS_TOKEN || "", {
            expiresIn: "24h"
        });
    } catch (error: any) {
        throw new Error("Could not generate access token")
    }
}

// Method to sign the refresh token
userSchema.methods.signRefreshToken = function () {
    try {
        return jwt.sign({ id: this._id }, REFRESH_TOKEN || "", {
            expiresIn: '14d',
        });
    } catch (error: any) {
        console.error("Error signing refresh token", error);
        throw new Error("Could not generate refresh token");
    }
};

userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password)
}

const userModel: Model<IUser> = mongoose.model("User", userSchema);
export default userModel