import mongoose, { Schema, Document } from "mongoose";

export interface IMeal extends Document {
    name: string;
    type: "breakfast" | "lunch" | "dinner";
    ingredients: string[];
    dietTypes: string[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    glycemicIndex: number;
    fiber: number;
    sodium: number;
    potassium: number;
    magnesium: number;
    calcium: number;
}

const MealSchema: Schema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ["breakfast", "lunch", "dinner"], required: true },
        ingredients: { type: [String], default: [] },
        dietTypes: { type: [String], default: [] },
        calories: { type: Number, required: true },
        protein: { type: Number, required: true },
        carbs: { type: Number, required: true },
        fat: { type: Number, required: true },
        glycemicIndex: { type: Number, required: true },
        fiber: { type: Number, required: true },
        sodium: { type: Number, required: true },
        potassium: { type: Number, required: true },
        magnesium: { type: Number, required: true },
        calcium: { type: Number, required: true },
    },
    { timestamps: true }
);

const mealModel = mongoose.model<IMeal>("Meal", MealSchema);
export default mealModel;
