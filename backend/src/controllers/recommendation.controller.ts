import { NextFunction, Request, Response } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncError";
import userModel from "../models/user";
import ErrorHandler from "../utils/ErrorHandler";
import { generateDailyMeals } from "../utils/mealGenerator";
import recommendationModel from "../models/recommendation.model";
import notificationModel from "../models/notification.model";
import sendEmail from "../utils/sendEmail";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../utils/redis";

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
 * Generate 7-day meal plan for a user & notify them via email & in-app notification
 */
export const generateWeeklyRecommendations = CatchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        const user = await userModel.findById(userId);
        if (!user) return next(new ErrorHandler("User not found", 404));

        if (!isUserPreferencesSet(user)) {
            return next(new ErrorHandler(
                "Please update your health details and dietary preferences before generating recommendations.",
                400
            ));
        }

        // **Check Redis Cache First**
        const cachedRecommendation = await redis.get(`recommendations:${user._id}`);
        if (cachedRecommendation) {
            return res.status(200).json(JSON.parse(cachedRecommendation));
        }

        const dietaryPreferences = user.diatery_preferences?.preferred_diet_type
            ? [user.diatery_preferences.preferred_diet_type, ...user.diatery_preferences.foods_to_avoid]
            : ["diabetic"];

        const existingRecommendations = await recommendationModel.find({ userId });
        if (existingRecommendations.length >= 3) {
            return res.status(400).json({
                success: false,
                message: "Maximum limit reached: You can have up to 3 active recommendations."
            });
        }

        const recommendationId = uuidv4();
        const structuredMeals: Record<string, any> = {};

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + i);
            const dayKey = `day${i + 1}`;

            const dailyMeals = await generateDailyMeals(dietaryPreferences, i, {
                strict: true,
                minCalories: 300,
                maxCalories: 800
            });

            if (!dailyMeals || !dailyMeals.breakfast.length || !dailyMeals.lunch.length || !dailyMeals.dinner.length) {
                console.warn(`⚠️ Skipping ${dayKey} due to missing meals`);
                continue;
            }

            structuredMeals[dayKey] = {
                breakfast: {
                    date: currentDate,
                    type: "breakfast",
                    mealId: dailyMeals.breakfast[0]._id,
                    mealName: dailyMeals.breakfast[0].name
                },
                lunch: {
                    date: currentDate,
                    type: "lunch",
                    mealId: dailyMeals.lunch[0]._id,
                    mealName: dailyMeals.lunch[0].name
                },
                dinner: {
                    date: currentDate,
                    type: "dinner",
                    mealId: dailyMeals.dinner[0]._id,
                    mealName: dailyMeals.dinner[0].name
                }
            };
        }

        if (Object.keys(structuredMeals).length === 0) {
            return next(new ErrorHandler("Failed to generate meal plan: No valid meals found", 400));
        }

        // Save to database
        const recommendation = await recommendationModel.create({
            userId: user._id,
            recommendationId,
            date: new Date(),
            meals: structuredMeals
        });

        // Populate meal details for the response
        const populatedRecommendation = await recommendationModel
            .findById(recommendation._id)
            .populate("meals.day1.breakfast.mealId meals.day1.lunch.mealId meals.day1.dinner.mealId")
            .populate("meals.day2.breakfast.mealId meals.day2.lunch.mealId meals.day2.dinner.mealId")
            .populate("meals.day3.breakfast.mealId meals.day3.lunch.mealId meals.day3.dinner.mealId")
            .populate("meals.day4.breakfast.mealId meals.day4.lunch.mealId meals.day4.dinner.mealId")
            .populate("meals.day5.breakfast.mealId meals.day5.lunch.mealId meals.day5.dinner.mealId")
            .populate("meals.day6.breakfast.mealId meals.day6.lunch.mealId meals.day6.dinner.mealId")
            .populate("meals.day7.breakfast.mealId meals.day7.lunch.mealId meals.day7.dinner.mealId");

        // **Store in Redis for 7 days**
        await redis.set(`recommendations:${user.email}`, JSON.stringify(populatedRecommendation), "EX", 60 * 60 * 24 * 7);

        res.status(200).json({
            success: true,
            message: "Weekly diet plan generated successfully!",
            recommendation: populatedRecommendation
        });
    }
);


/**
 * Retrieve recommendations for a specific user
 */

export const getUserRecommendations = CatchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        // **Check Redis Cache First**
        const cachedRecommendation = await redis.get(`recommendations:${userId}`);
        if (cachedRecommendation) {
            console.log("📌 Returning Cached Recommendation from Redis");
            return res.status(200).json(JSON.parse(cachedRecommendation));
        }

        // **If not in Redis, Fetch from MongoDB**
        const recommendation = await recommendationModel.findOne({ userId });

        if (!recommendation) {
            return next(new ErrorHandler("No recommendations found", 404));
        }

        const populatedRecommendation = await recommendationModel.findById(recommendation._id)
            .populate("meals.day1.breakfast.mealId meals.day1.lunch.mealId meals.day1.dinner.mealId")
            .populate("meals.day2.breakfast.mealId meals.day2.lunch.mealId meals.day2.dinner.mealId")
            .populate("meals.day3.breakfast.mealId meals.day3.lunch.mealId meals.day3.dinner.mealId")
            .populate("meals.day4.breakfast.mealId meals.day4.lunch.mealId meals.day4.dinner.mealId")
            .populate("meals.day5.breakfast.mealId meals.day5.lunch.mealId meals.day5.dinner.mealId")
            .populate("meals.day6.breakfast.mealId meals.day6.lunch.mealId meals.day6.dinner.mealId")
            .populate("meals.day7.breakfast.mealId meals.day7.lunch.mealId meals.day7.dinner.mealId");

        // ✅ Ensure `populatedRecommendation` is not null
        if (!populatedRecommendation) {
            return next(new ErrorHandler("Failed to retrieve meal details", 500));
        }

        // **Store in Redis for 7 days**
        await redis.set(`recommendations:${userId}`, JSON.stringify(populatedRecommendation), "EX", 60 * 60 * 24 * 7);

        res.status(200).json({
            success: true,
            recommendationId: populatedRecommendation.recommendationId,
            meals: populatedRecommendation.meals,
        });
    }
);




