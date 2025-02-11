import mealModel from "../models/meals.model";

interface MealOptions {
    strict: boolean;
    minCalories?: number;
    maxCalories?: number;
}

/**
 * Generate a balanced set of meals for a day with fallback options
 */
export const generateDailyMeals = async (
    dietaryPreferences: string[],
    dayIndex: number,
    options: MealOptions = { strict: false }
) => {
    try {
        // Function to get meals with dietary preferences
        const getMealsWithPreferences = async (mealType: string) => {
            const query: any = { type: mealType };

            if (options.strict) {
                query.dietTypes = { $all: dietaryPreferences };
            } else {
                query.dietTypes = { $in: dietaryPreferences };
            }

            if (options.minCalories) {
                query.calories = { $gte: options.minCalories };
            }
            if (options.maxCalories) {
                query.calories = { ...query.calories, $lte: options.maxCalories };
            }

            return await mealModel.find(query);
        };

        // Get meals for each type
        let [breakfastOptions, lunchOptions, dinnerOptions] = await Promise.all([
            getMealsWithPreferences("breakfast"),
            getMealsWithPreferences("lunch"),
            getMealsWithPreferences("dinner")
        ]);

        // **If no meals were found, return default meals instead**
        if (!breakfastOptions.length) breakfastOptions = await mealModel.find({ type: "breakfast" });
        if (!lunchOptions.length) lunchOptions = await mealModel.find({ type: "lunch" });
        if (!dinnerOptions.length) dinnerOptions = await mealModel.find({ type: "dinner" });

        // **Ensure at least one meal per type**
        if (!breakfastOptions.length || !lunchOptions.length || !dinnerOptions.length) {
            return null;
        }

        // Helper function to get random meals
        const getRandomMeals = (meals: any[], count: number) => {
            return meals.sort(() => 0.5 - Math.random()).slice(0, count);
        };

        return {
            breakfast: getRandomMeals(breakfastOptions, 1),
            lunch: getRandomMeals(lunchOptions, 1),
            dinner: getRandomMeals(dinnerOptions, 1),
        };

    } catch (error) {
        console.error(`❌ Error generating meals for day ${dayIndex + 1}:`, error);
        return null;
    }
};
