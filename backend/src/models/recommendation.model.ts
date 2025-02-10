import mongoose, { Schema, Document } from "mongoose";

export interface IRecommendation extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    date: Date;
    meals: {
        type: String;
        mealId: mongoose.Schema.Types.ObjectId[];
    }[];
}

const RecommendationSchema: Schema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        meals: [
            {
                type: { type: String, enum: ["breakfast", "lunch", "dinner"] },
                mealId: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Meal",
                    },
                ],
            },
        ],
    },
    { timestamps: true }
);

const recommendationModel = mongoose.model<IRecommendation>("Recommendation", RecommendationSchema);
export default recommendationModel;
