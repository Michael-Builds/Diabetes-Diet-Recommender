import mongoose, { Schema, Document } from "mongoose";

export interface IMealEntry {
    type: "breakfast" | "lunch" | "dinner";
    mealId: mongoose.Schema.Types.ObjectId;
    mealName: string;
}

export interface IDayMeals {
    day: string;
    meals: IMealEntry[];
}

export interface IRecommendation extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    recommendations: {
        recommendationId: string;
        date: Date;
        expired: boolean;
        weeklyMeals: IDayMeals[];
    }[];
}

const MealEntrySchema = new Schema({
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

const DayMealsSchema = new Schema({
    day: {
        type: String,
        required: true
    },
    meals: [MealEntrySchema]
});

const RecommendationSchema: Schema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        recommendations: [
            {
                recommendationId: {
                    type: String,
                    required: true,
                    unique: true
                },
                expired: {
                    type: Boolean,
                    default: false
                },
                date: {
                    type: Date,
                    default: Date.now
                },
                weeklyMeals: [DayMealsSchema]
            }
        ]
    },
    { timestamps: true }
);

const recommendationModel = mongoose.model<IRecommendation>("Recommendation", RecommendationSchema);
export default recommendationModel;
