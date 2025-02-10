import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import mealModel from "../models/meals.model";

interface MealCSVRow {
    "Food Name"?: string;
    "Glycemic Index"?: string;
    Calories?: string;
    Carbohydrates?: string;
    Protein?: string;
    Fat?: string;
    "Suitable for Diabetes"?: string;
    "Suitable for Blood Pressure"?: string;
    "Sodium Content"?: string;
    "Potassium Content"?: string;
    "Magnesium Content"?: string;
    "Calcium Content"?: string;
    "Fiber Content"?: string;
}

interface Meal {
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

const csvFilePath: string = path.join(__dirname, "../views/data.csv");

/**
 * Classify meal type (breakfast, lunch, dinner) based on food name
 */
const inferMealType = (foodName: string): "breakfast" | "lunch" | "dinner" => {
    const lowerName = foodName.toLowerCase();
    if (lowerName.includes("paratha") || lowerName.includes("pancake") || lowerName.includes("idli") || lowerName.includes("dosa") || lowerName.includes("oats")) {
        return "breakfast";
    } else if (lowerName.includes("biryani") || lowerName.includes("curry") || lowerName.includes("rice") || lowerName.includes("dal")) {
        return "lunch";
    } else {
        return "dinner";
    }
};


export const loadCsvDataToMongoDB = async (): Promise<void> => {
    try {
        console.log("🔍 Checking for existing meals in Datasbase...");
        const existingMeals = await mealModel.find({}, "name");
        const existingMealNames = new Set(existingMeals.map(meal => meal.name.toLowerCase()));

        const meals: Meal[] = [];

        fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on("data", (row: MealCSVRow) => {
                if (!row["Food Name"]) {
                    console.warn("⚠️ Skipping row due to missing food name:", row);
                    return;
                }

                const foodName = row["Food Name"].trim();

                if (existingMealNames.has(foodName.toLowerCase())) {
                    return;
                }

                const mealType = inferMealType(foodName);

                const meal: Meal = {
                    name: foodName,
                    type: mealType,
                    ingredients: [],
                    dietTypes: [
                        row["Suitable for Diabetes"] === "1" ? "diabetic" : "",
                        row["Suitable for Blood Pressure"] === "1" ? "low-blood-pressure" : "",
                    ].filter(Boolean),
                    calories: row.Calories ? parseInt(row.Calories, 10) || 0 : 0,
                    protein: row.Protein ? parseFloat(row.Protein) || 0 : 0,
                    carbs: row.Carbohydrates ? parseFloat(row.Carbohydrates) || 0 : 0,
                    fat: row.Fat ? parseFloat(row.Fat) || 0 : 0,
                    glycemicIndex: row["Glycemic Index"] ? parseFloat(row["Glycemic Index"]) || 0 : 0,
                    fiber: row["Fiber Content"] ? parseFloat(row["Fiber Content"]) || 0 : 0,
                    sodium: row["Sodium Content"] ? parseFloat(row["Sodium Content"]) || 0 : 0,
                    potassium: row["Potassium Content"] ? parseFloat(row["Potassium Content"]) || 0 : 0,
                    magnesium: row["Magnesium Content"] ? parseFloat(row["Magnesium Content"]) || 0 : 0,
                    calcium: row["Calcium Content"] ? parseFloat(row["Calcium Content"]) || 0 : 0,
                };

                meals.push(meal);
            })
            .on("end", async () => {
                try {
                    if (meals.length > 0) {
                        await mealModel.insertMany(meals);
                        console.log("✅ CSV data successfully loaded into Database!");
                    } else {
                        console.log("⚠️ No new meals to insert. All data already exists.");
                    }
                } catch (dbError) {
                    console.error("❌ Error inserting data into MongoDB:", dbError);
                }
            })
            .on("error", (fileError) => {
                console.error("❌ Error reading CSV file:", fileError);
            });
    } catch (error) {
        console.error("❌ Unexpected error loading CSV into MongoDB:", error);
    }
};
