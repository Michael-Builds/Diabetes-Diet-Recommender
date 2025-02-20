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
import mongoose from "mongoose";

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
export const generateWeeklyRecommendations = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const MAX_RECOMMENDATIONS = 3;

    const user = await userModel.findById(new mongoose.Types.ObjectId(userId));
    if (!user) return next(new ErrorHandler("User not found", 404));

    if (!isUserPreferencesSet(user)) {
        return next(new ErrorHandler("Please update your health details and dietary preferences.", 400));
    }

    // **Get all non-expired recommendations**
    let userRecommendations = await recommendationModel.findOne({ userId });
    const activeRecommendations = userRecommendations
        ? userRecommendations.recommendations.filter((rec: any) => !rec.expired).length
        : 0;

    // **Check if user has free slots**
    if (activeRecommendations >= MAX_RECOMMENDATIONS) {
        return next(new ErrorHandler(`You can only have up to ${MAX_RECOMMENDATIONS} active recommendations. Wait for one to expire before generating another.`, 400));
    }

    const dietaryPreferences = user.diatery_preferences?.preferred_diet_type
        ? [user.diatery_preferences.preferred_diet_type, ...user.diatery_preferences.foods_to_avoid]
        : ["diabetic"];

    const recommendationId = uuidv4();
    let weeklyMealsArray: any[] = [];

    for (let i = 0; i < 7; i++) {
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

        weeklyMealsArray.push({
            day: dayKey,
            meals: [
                { type: "breakfast", mealId: dailyMeals.breakfast[0]._id, mealName: dailyMeals.breakfast[0].name },
                { type: "lunch", mealId: dailyMeals.lunch[0]._id, mealName: dailyMeals.lunch[0].name },
                { type: "dinner", mealId: dailyMeals.dinner[0]._id, mealName: dailyMeals.dinner[0].name }
            ]
        });
    }

    if (weeklyMealsArray.length === 0) {
        return next(new ErrorHandler("No valid meals found", 400));
    }

    // **If no recommendations exist, create a new entry**
    if (!userRecommendations) {
        userRecommendations = new recommendationModel({
            userId: user._id,
            recommendations: [],
        });
    }

    console.log("📢 Adding new recommendation:", { recommendationId, weeklyMealsArray });

    // ✅ Push new recommendation
    userRecommendations.recommendations.push({
        recommendationId,
        date: new Date(),
        expired: false,
        weeklyMeals: weeklyMealsArray
    });

    await sendEmail({
        email: user.email,
        subject: "Your Weekly Meal Plan is Ready! 🍽️",
        template: "meal-plan-notification.ejs",
        data: {
            firstname: user.firstname,
            startDate: new Date().toDateString(),
            dietaryPreferences: dietaryPreferences.join(", "),
        },
    });
    
    await userRecommendations.save();

    res.status(200).json({
        success: true,
        message: "Weekly diet plan generated successfully!",
        recommendations: userRecommendations.recommendations
    });
});


/**
 * Retrieve recommendations for a specific user
 */
export const getUserRecommendations = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    // **Fetch recommendations from MongoDB**
    const userRecommendations = await recommendationModel.findOne({ userId })
        .populate("recommendations.weeklyMeals.meals.mealId");

    if (!userRecommendations) {
        return res.status(200).json({
            success: true,
            message: "No recommendations found.",
            recommendations: [],
        });
    }

    // ✅ Filter active recommendations
    const activeRecommendations = userRecommendations.recommendations.filter(rec => !rec.expired);

    res.status(200).json({
        success: true,
        message: "Fetched active recommendations successfully.",
        recommendations: activeRecommendations
    });
});







