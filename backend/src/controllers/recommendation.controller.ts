import { NextFunction, Request, Response } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncError";
import userModel from "../models/user";
import ErrorHandler from "../utils/ErrorHandler";
import { generateDailyMeals } from "../utils/mealGenerator";
import recommendationModel from "../models/recommendation.model";
import notificationModel from "../models/notification.model";
import sendEmail from "../utils/sendEmail";

/**
 * Check if user has preferences set before generating recommendations
 */
const isUserPreferencesSet = (user: any): boolean => {
    return (
        !!user.health_details?.diabetic_type &&
        !!user.health_details?.current_weight &&
        !!user.health_details?.height &&
        !!user.diatery_preferences?.preferred_diet_type &&
        user.diatery_preferences.food_allergies.length > 0 &&
        user.diatery_preferences.foods_to_avoid.length > 0 &&
        user.diatery_preferences.favorite_foods.length > 0 &&
        !!user.customizations?.meal_reminder_preference &&
        !!user.customizations?.preferred_time_for_diet
    );
};

/**
 * Generate 30-day meal plan for a user & notify them via email & in-app notification
 */
export const generateMonthlyRecommendations = CatchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        const user = await userModel.findById(userId);
        if (!user) return next(new ErrorHandler("User not found", 404));

        if (!isUserPreferencesSet(user)) {
            return next(
                new ErrorHandler(
                    "Please update your health details and dietary preferences before generating recommendations.",
                    400
                )
            );
        }

        const dietaryPreferences = user.diatery_preferences?.preferred_diet_type
            ? [user.diatery_preferences.preferred_diet_type, ...user.diatery_preferences.foods_to_avoid]
            : ["diabetic"];

        // **Check existing recommendations and enforce the limit of 3**
        const existingRecommendations = await recommendationModel.find({ userId });
        if (existingRecommendations.length >= 3) {
            return res.json({ message: "Maximum limit reached: You can have up to 3 active recommendations." });
        }

        const recommendations = [];

        for (let i = 0; i < 30; i++) {
            const dailyMeals = await generateDailyMeals(dietaryPreferences, i);
            if (!dailyMeals || !dailyMeals.breakfast.length || !dailyMeals.lunch.length || !dailyMeals.dinner.length) {
                console.warn(`⚠️ Skipping day ${i + 1} due to missing meals in dataset.`);
                continue;
            }

            const recommendation = await recommendationModel.create({
                userId: user._id,
                date: new Date(new Date().setDate(new Date().getDate() + i)),
                meals: [
                    { type: "breakfast", mealId: dailyMeals.breakfast.map(meal => meal._id) },
                    { type: "lunch", mealId: dailyMeals.lunch.map(meal => meal._id) },
                    { type: "dinner", mealId: dailyMeals.dinner.map(meal => meal._id) },
                ],
            });

            recommendations.push(recommendation);
        }

        // **Create a notification**
        await notificationModel.create({
            userId: user._id,
            title: "New Monthly Meal Plan",
            message: `Your meal recommendations for the next 30 days have been successfully generated!`,
        });

        await sendEmail({
            email: user.email,
            subject: "Your Monthly Meal Plan is Ready!",
            template: "meal-plan-notification.ejs",
            data: {
                firstname: user.firstname,
                dietaryPreferences: dietaryPreferences.join(", "),
                startDate: new Date().toLocaleDateString(),
            },
        });

        res.json({ message: "✅ Monthly diet plan generated successfully!", recommendations });
    }
);



/**
 * Retrieve recommendations for a specific user
 */

export const getUserRecommendations = CatchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        // **Fully populate meal data**
        const recommendations = await recommendationModel
            .find({ userId })
            .populate({
                path: "meals.mealId",
                select: "name type ingredients calories protein carbs fat glycemicIndex fiber sodium potassium magnesium calcium"
            })
            .sort({ date: 1 });

        if (!recommendations.length) {
            return next(new ErrorHandler("No recommendations found", 404));
        }

        res.json({ success: true, recommendations });
    }
);

