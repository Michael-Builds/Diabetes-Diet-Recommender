import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { CatchAsyncErrors } from "../middlewares/catchAsyncError";
import recommendationModel from "../models/recommendation.model";
import userModel from "../models/user";
import ErrorHandler from "../utils/ErrorHandler";
import { generateDailyMeals } from "../utils/mealGenerator";
import sendEmail from "../utils/sendEmail";

// Interface for recommendation data
interface IRecommendation {
    recommendationId: string;
    date: Date;
    expired: boolean;
    weeklyMeals: {
        day: string;
        meals: {
            type: string;
            mealId: mongoose.Types.ObjectId;
            mealName: string;
        }[];
    }[];
}

// Validate user preferences before generating recommendations
const validateUserPreferences = (user: any): void => {
    const requiredFields = [
        !user.health_details?.diabetic_type && "diabetic type",
        !user.health_details?.current_weight && "current weight",
        !user.health_details?.height && "height",
        !user.diatery_preferences?.preferred_diet_type && "preferred diet type",
        user.diatery_preferences?.food_allergies.length === 0 && "food allergies",
        user.diatery_preferences?.foods_to_avoid.length === 0 && "foods to avoid",
        user.diatery_preferences?.favorite_foods.length === 0 && "favorite foods",
        !user.customizations?.meal_reminder_preference && "meal reminder preference",
        !user.customizations?.preferred_time_for_diet && "preferred diet time"
    ].filter(Boolean);

    if (requiredFields.length > 0) {
        throw new ErrorHandler(
            `Please complete your profile: ${requiredFields.join(", ")}`,
            400
        );
    }
};

// Generate weekly meal recommendations
export const generateWeeklyRecommendations = CatchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;
        const MAX_RECOMMENDATIONS = 3;

        try {
            // Validate user exists
            const user = await userModel.findById(userId);
            if (!user) {
                throw new ErrorHandler("User not found", 404);
            }

            // Check user preferences
            validateUserPreferences(user);

            // Get or create recommendations document
            let userRecommendations = await recommendationModel.findOne({ userId });
            if (!userRecommendations) {
                userRecommendations = new recommendationModel({
                    userId: user._id,
                    recommendations: [],
                });
            }

            // Check active recommendations limit
            const activeCount = userRecommendations.recommendations.filter(
                (rec: IRecommendation) => !rec.expired
            ).length;

            if (activeCount >= MAX_RECOMMENDATIONS) {
                throw new ErrorHandler(
                    `Maximum ${MAX_RECOMMENDATIONS} active recommendations allowed`,
                    400
                );
            }

            // Generate meal plan
            const dietaryPreferences = [
                user.diatery_preferences.preferred_diet_type,
                ...user.diatery_preferences.foods_to_avoid
            ]

            const recommendationId = uuidv4();
            const weeklyMeals: IRecommendation["weeklyMeals"] = [];

            // Generate meals for 7 days
            for (let i = 0; i < 7; i++) {
                const dayKey = `day${i + 1}`;
                const dailyMeals = await generateDailyMeals(dietaryPreferences, i, {
                    strict: true,
                    minCalories: 300,
                    maxCalories: 800
                });

                if (!dailyMeals?.breakfast?.length ||
                    !dailyMeals?.lunch?.length ||
                    !dailyMeals?.dinner?.length) {
                    console.warn(`Skipping ${dayKey} - incomplete meals`);
                    continue;
                }

                weeklyMeals.push({
                    day: dayKey,
                    meals: [
                        {
                            type: "breakfast",
                            mealId: dailyMeals.breakfast[0]._id,
                            mealName: dailyMeals.breakfast[0].name
                        },
                        {
                            type: "lunch",
                            mealId: dailyMeals.lunch[0]._id,
                            mealName: dailyMeals.lunch[0].name
                        },
                        {
                            type: "dinner",
                            mealId: dailyMeals.dinner[0]._id,
                            mealName: dailyMeals.dinner[0].name
                        }
                    ]
                });
            }

            if (weeklyMeals.length === 0) {
                throw new ErrorHandler("Failed to generate valid meals", 400);
            }

            // Create and save new recommendation
            const newRecommendation: IRecommendation = {
                recommendationId,
                date: new Date(),
                expired: false,
                weeklyMeals
            };

            // Check for duplicates before saving
            const duplicateExists = userRecommendations.recommendations.some(
                (rec: IRecommendation) => rec.recommendationId === recommendationId
            );

            if (duplicateExists) {
                throw new ErrorHandler("Duplicate recommendation detected", 500);
            }

            userRecommendations.recommendations.push(newRecommendation);
            await userRecommendations.save();

            // Send notification email
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

            res.status(201).json({
                success: true,
                message: "Meal plan generated successfully",
                recommendation: newRecommendation
            });

        } catch (error) {
            next(error);
        }
    }
);

// Get user recommendations
export const getUserRecommendations = CatchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        try {
            const userRecommendations = await recommendationModel.findOne({ userId })
                .populate("recommendations.weeklyMeals.meals.mealId")
                .lean();

            if (!userRecommendations) {
                return res.status(200).json({
                    success: true,
                    recommendations: []
                });
            }

            const activeRecommendations = userRecommendations.recommendations.filter(
                (rec: IRecommendation) => !rec.expired
            );

            res.status(200).json({
                success: true,
                recommendations: activeRecommendations
            });

        } catch (error) {
            next(error);
        }
    }
);