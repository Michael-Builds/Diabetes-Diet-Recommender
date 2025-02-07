import mongoose, { Model, Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../config";

// Email regex pattern (strict validation)
const emailRegexPattern: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password regex: At least 8 characters, one uppercase, one lowercase, one digit, and one special character
const passwordRegexPattern: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
        required: [true, "Please enter your password"],
        select: false,
        validate: {
            validator: function (value: string) {
                return passwordRegexPattern.test(value);
            },
            message:
                "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        },
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
        type: String, 
        required: false,
        match: [/^\d{10,15}$/, "Invalid phone number format"],
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
        preferred_time_for_diet: {
            type: String,
            default: "",
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


// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error: any) {
        return next(error);
    }
});

// Method to sign the access token
userSchema.methods.signAccessToken = function () {
    return jwt.sign({ id: this._id }, ACCESS_TOKEN || "", {
        expiresIn: "24h",
    });
};


// Method to sign the refresh token
userSchema.methods.signRefreshToken = function () {
    return jwt.sign({ id: this._id }, REFRESH_TOKEN || "", {
        expiresIn: "14d",
    });
};


// Compare password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);
export default userModel