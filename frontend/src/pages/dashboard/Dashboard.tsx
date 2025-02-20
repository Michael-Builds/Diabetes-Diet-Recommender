import { useAuthContext } from "../../context/useAuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { CustomTooltip } from "../../utils/CustomToolTip";
import { useState } from "react";
import Dropdown from "../../shared/Dropdown";

const Dashboard = () => {
  const { user, recommendations } = useAuthContext();
  const [selectedRecommendation, setSelectedRecommendation] = useState(0)

  const handleRecommendationChange = (value: string | string[]) => {
    setSelectedRecommendation(Number(value))
  }

  // ✅ Ensure at least one recommendation exists
  const recommendationOptions = recommendations.map((_, index) => ({
    label: `${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"} recommendation`,
    value: String(index),
  }));

  // ✅ Get selected recommendation
  const selectedMeals = recommendations[selectedRecommendation]?.weeklyMeals || [];

  // ✅ Extract user data
  const {
    health_details,
    diatery_preferences,
    customizations,
  } = user || {};

  // ✅ Health Overview
  const healthOverviewData = [
    { title: "Current Weight", value: health_details?.current_weight ? `${health_details.current_weight} kg` : "N/A", color: "text-green-500" },
    { title: "Height", value: health_details?.height ? `${health_details.height} cm` : "N/A", color: "text-orange-500" },
    { title: "Diabetic Type", value: health_details?.diabetic_type || "Not specified", color: "text-purple-500" },
  ];

  // ✅ Dietary Preferences
  const dietaryPreferences = [
    { title: "Preferred Diet Type", value: diatery_preferences?.preferred_diet_type || "Not specified", color: "text-red-500" },
    { title: "Food Allergies", value: diatery_preferences?.food_allergies?.length > 0 ? diatery_preferences.food_allergies.join(", ") : "None", color: "text-yellow-500" },
    { title: "Foods to Avoid", value: diatery_preferences?.foods_to_avoid?.length > 0 ? diatery_preferences.foods_to_avoid.join(", ") : "None", color: "text-gray-500" },
    { title: "Favorite Foods", value: diatery_preferences?.favorite_foods?.length > 0 ? diatery_preferences.favorite_foods.join(", ") : "None", color: "text-blue-500" },
  ];

  // ✅ Customization Settings
  const customizationSettings = [
    { title: "Meal Reminder", value: customizations?.meal_reminder_preference ? "Enabled ✅" : "Disabled ❌", color: "text-green-500" },
    { title: "Preferred Time for Diet", value: customizations?.preferred_time_for_diet || "N/A", color: "text-blue-500" },
    { title: "Notification Preference", value: customizations?.notification_preference || "None", color: "text-purple-500" },
  ];


  // ✅ Format Recommendations for Chart
  const mealChartData = selectedMeals.map((day: any) => ({
    day: day.day.toUpperCase(),
    Breakfast: day.meals.filter((meal: any) => meal.type === "breakfast").length,
    Lunch: day.meals.filter((meal: any) => meal.type === "lunch").length,
    Dinner: day.meals.filter((meal: any) => meal.type === "dinner").length,

    breakfastMeals: day.meals
      .filter((meal: any) => meal.type === "breakfast")
      .map((meal: any) => meal.mealName),

    lunchMeals: day.meals
      .filter((meal: any) => meal.type === "lunch")
      .map((meal: any) => meal.mealName),

    dinnerMeals: day.meals
      .filter((meal: any) => meal.type === "dinner")
      .map((meal: any) => meal.mealName),
  }));


  return (
    <section className="p-6 bg-gray-100 min-h-screen font-geist">
      <div className="flex lg:flex-row flex-col lg:items-center justify-between lg:-mt-4">
        <h1 className="text-2xl font-bold text-gray-700">Diabetes Dashboard</h1>

        {/* ✅ Recommendation Selector */}
        {recommendations.length > 0 && (
          <div className="mt-4">
            <Dropdown
              options={recommendationOptions}
              selected={String(selectedRecommendation)}
              onChange={handleRecommendationChange}
              label="Pick a category"
              isSearchable={false}
              isMultiSelect={false}
              className="mt-2"
            />
          </div>
        )}
      </div>

      {/* ✅ Health Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {healthOverviewData.map((item, index) => (
          <div key={index} className="bg-white p-4 shadow rounded-md">
            <h2 className="text-lg font-semibold text-gray-600">{item.title}</h2>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* ✅ Weekly Meal Plan Chart */}
      <div className="bg-white p-4 shadow rounded-md mt-6">
        <h2 className="text-lg font-semibold text-gray-600">Weekly Meal Plan Overview</h2>
        <p className="text-sm text-gray-500">Number of meals scheduled per day (Hover for meal names)</p>

        {mealChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350} >
            <BarChart data={mealChartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="day"
                tick={{ fontFamily: "Geist, sans-serif", fontSize: 12, fill: "#4B5563" }}
              />

              <YAxis
                tick={{ fontFamily: "Geist, sans-serif", fontSize: 12, fill: "#4B5563" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="Breakfast"
                stackId="a"
                fill="#FFD700"
                name="Breakfast 🥞"
                label={{
                  position: "top",
                  fontSize: 14,
                  fontFamily: "Geist, sans-serif",
                  fill: "#4B5563"
                }}
              />
              <Bar
                dataKey="Lunch"
                stackId="a"
                fill="#32CD32"
                name="Lunch 🍛"
                label={{
                  position: "top",
                  fontSize: 14,
                  fontFamily: "Geist, sans-serif",
                  fill: "#4B5563"
                }}
              />
              <Bar
                dataKey="Dinner"
                stackId="a"
                fill="#FF4500"
                name="Dinner 🍽️"
                label={{
                  position: "top",
                  fontSize: 14,
                  fontFamily: "Geist, sans-serif",
                  fill: "#4B5563"
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 mt-2">No meal data available</p>
        )}
      </div>


      {/* ✅ Dietary Preferences Section */}
      <div className="bg-white p-4 shadow rounded-md mt-6">
        <h2 className="text-lg font-semibold text-gray-600">Dietary Preferences</h2>
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dietaryPreferences.map((item, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-semibold text-gray-700">{item.title}</h3>
              <p className={`capitalize text-md font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>


      {/* ✅ Customization Settings Section */}
      <div className="bg-white p-4 shadow rounded-md mt-6">
        <h2 className="text-lg font-semibold text-gray-600">Customization Settings</h2>
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {customizationSettings.map((item, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-semibold text-gray-700">{item.title}</h3>
              <p className={` text-md font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
