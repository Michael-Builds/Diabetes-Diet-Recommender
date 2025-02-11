import mongoose, { Schema, Document } from "mongoose";

export interface IRecommendation extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    recommendationId: string;
    date: Date;
    meals: {
        [key: string]: IMealDay;
    };
}

export interface IMealDay {
    breakfast: IMealEntry;
    lunch: IMealEntry;
    dinner: IMealEntry;
}

export interface IMealEntry {
    date: Date;
    type: "breakfast" | "lunch" | "dinner";
    mealId: mongoose.Schema.Types.ObjectId;
    mealName: string;
}

const MealEntrySchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ["breakfast", "lunch", "dinner"],
        required: true
    },
    mealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meal",
        required: true
    },
    mealName: {
        type: String,
        required: true
    }
});

const MealDaySchema = new Schema({
    breakfast: {
        type: MealEntrySchema,
        required: true
    },
    lunch: {
        type: MealEntrySchema,
        required: true
    },
    dinner: {
        type: MealEntrySchema,
        required: true
    }
});

const RecommendationSchema: Schema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        recommendationId: {
            type: String,
            required: true,
            unique: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        meals: {
            type: Map,
            of: MealDaySchema
        }
    },
    { timestamps: true }
);

const recommendationModel = mongoose.model<IRecommendation>("Recommendation", RecommendationSchema);
export default recommendationModel;
