import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthContext } from "../../context/useAuthContext";

const Recommendations = () => {
    const { recommendations, fetchRecommendations } = useAuthContext();
    const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    return (
        <section className="min-h-screen p-6 bg-gray-100 font-geist">
            <h1 className="lg:text-3xl text-xl font-bold text-gray-500 mb-6">Meal Plan Recommendations</h1>

            {recommendations.length === 0 ? (
                <p className="text-gray-600">No recommendations available.</p>
            ) : (
                <div className="space-y-6">
                    {recommendations.map((rec: any) => (
                        <div key={rec.recommendationId} className="bg-white shadow-md rounded-lg p-4">
                            <div
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() =>
                                    setExpandedRecommendation(expandedRecommendation === rec.recommendationId ? null : rec.recommendationId)
                                }
                            >
                                <h2 className="lg:text-lg font-semibold text-gray-500">
                                    Recommendation from {new Date(rec.date).toLocaleDateString()}
                                </h2>
                                {expandedRecommendation === rec.recommendationId ? (
                                    <ChevronUp className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-600" />
                                )}
                            </div>

                            {/* Expandable Section */}
                            {expandedRecommendation === rec.recommendationId && (
                                <div className="mt-4 space-y-4">
                                    {rec.weeklyMeals.map((day: any) => {
                                        const dayId = `${rec.recommendationId}-${day.day}`;
                                        return (
                                            <div key={dayId} className="border rounded-lg p-3 shadow-sm bg-gray-50">
                                                {/* Day Header */}
                                                <div
                                                    className="flex justify-between items-center cursor-pointer"
                                                    onClick={() => setExpandedDay(expandedDay === dayId ? null : dayId)}
                                                >
                                                    <h3 className="text-gray-700 font-semibold capitalize">{day.day}</h3>
                                                    {expandedDay === dayId ? (
                                                        <ChevronUp className="w-4 h-4 text-gray-600" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-600" />
                                                    )}
                                                </div>

                                                {/* Expanded Meal Details */}
                                                {expandedDay === dayId && (
                                                    <ul className="mt-2 space-y-1 text-gray-600">
                                                        {day.meals.map((meal: any) => (
                                                            <li key={meal.mealId} className="flex items-center">
                                                                <span className="font-medium capitalize w-24">{meal.type}:</span>
                                                                <span className="text-gray-700">{meal.mealName}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default Recommendations;
