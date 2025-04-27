import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthContext } from "../../context/useAuthContext";
import { toast } from "react-toastify";

const Recommendations = () => {
    const {
        recommendations,
        fetchRecommendations,
        isLoadingRecs
    } = useAuthContext();

    const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    useEffect(() => {
        const loadRecommendations = async () => {
            try {
                await fetchRecommendations();
            } catch (error) {
                toast.error("Failed to load recommendations");
                console.error("Recommendations load error:", error);
            }
        };
        loadRecommendations();
    }, [fetchRecommendations]);

    if (isLoadingRecs) {
        return (
            <section className="min-h-screen p-6 bg-gray-100 font-geist">
                <h1 className="lg:text-3xl text-xl font-bold text-gray-500 mb-6">
                    Meal Plan Recommendations
                </h1>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen p-6 bg-gray-100 font-geist">
            <div className="flex justify-between items-center mb-6">
                <h1 className="lg:text-3xl text-xl font-bold text-gray-500">
                    Meal Plan Recommendations
                </h1>
                <button
                    onClick={fetchRecommendations}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                    Refresh
                </button>
            </div>

            {recommendations.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <p className="text-gray-600 mb-4">No recommendations available.</p>
                    <button
                        onClick={fetchRecommendations}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {recommendations.map((rec) => (
                        <div
                            key={rec.recommendationId}
                            className="bg-white shadow-md rounded-lg overflow-hidden"
                        >
                            <div
                                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition"
                                onClick={() =>
                                    setExpandedRecommendation(
                                        expandedRecommendation === rec.recommendationId
                                            ? null
                                            : rec.recommendationId
                                    )
                                }
                            >
                                <div>
                                    <h2 className="lg:text-lg font-semibold text-gray-700">
                                        Meal Plan from {new Date(rec.date).toLocaleDateString()}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {rec.weeklyMeals.length} days planned
                                    </p>
                                </div>
                                {expandedRecommendation === rec.recommendationId ? (
                                    <ChevronUp className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-600" />
                                )}
                            </div>

                            {expandedRecommendation === rec.recommendationId && (
                                <div className="p-4 pt-0 space-y-4">
                                    {rec.weeklyMeals.map((day: any) => {
                                        const dayId = `${rec.recommendationId}-${day.day}`;
                                        return (
                                            <div
                                                key={dayId}
                                                className="border rounded-lg overflow-hidden bg-gray-50"
                                            >
                                                <div
                                                    className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 transition"
                                                    onClick={() =>
                                                        setExpandedDay(expandedDay === dayId ? null : dayId)
                                                    }
                                                >
                                                    <h3 className="font-medium text-gray-700 capitalize">
                                                        {day.day.replace('day', 'Day ')}
                                                    </h3>
                                                    {expandedDay === dayId ? (
                                                        <ChevronUp className="w-4 h-4 text-gray-600" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-600" />
                                                    )}
                                                </div>

                                                {expandedDay === dayId && (
                                                    <div className="p-3 pt-0">
                                                        <ul className="space-y-3">
                                                            {day.meals.map((meal: any) => (
                                                                <li
                                                                    key={`${dayId}-${meal.type}`}
                                                                    className="flex items-start py-2"
                                                                >
                                                                    <span className="font-medium capitalize w-24 text-gray-600">
                                                                        {meal.type}:
                                                                    </span>
                                                                    <span className="text-gray-800 flex-1">
                                                                        {meal.mealName}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
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