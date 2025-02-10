import mealModel from "../models/meals.model";

/**
 * Generate a balanced set of meals for a day
 */
export const generateDailyMeals = async (dietaryPreferences: string[], dayIndex: number) => {
    try {
        const breakfastOptions = await mealModel.find({ type: "breakfast", dietTypes: { $in: dietaryPreferences } });
        const lunchOptions = await mealModel.find({ type: "lunch", dietTypes: { $in: dietaryPreferences } });
        const dinnerOptions = await mealModel.find({ type: "dinner", dietTypes: { $in: dietaryPreferences } });

        if (!breakfastOptions.length || !lunchOptions.length || !dinnerOptions.length) {
            console.warn("⚠️ Some meal types are missing. Returning partial results.");
        }

        const getMealCombo = (options: any[], day: number) => {
            const numItems = day % 2 === 0 ? 3 : 2; 
            if (options.length === 0) return [];
            const shuffled = options.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, numItems);
        };

        return {
            breakfast: getMealCombo(breakfastOptions, dayIndex),
            lunch: getMealCombo(lunchOptions, dayIndex),
            dinner: getMealCombo(dinnerOptions, dayIndex),
        };
    } catch (error) {
        console.error("❌ Error generating meals:", error);
        return null;
    }
};
