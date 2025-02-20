export const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload;

        return (
            <div className="bg-white p-3 lg:text-sm text-xs font-geist rounded-lg shadow-md border">
                <p className="text-gray-700  font-semibold">{data.day}</p>

                {/* Breakfast */}
                {Array.isArray(data.breakfastMeals) && data.breakfastMeals.length > 0 ? (
                    <p className="lg:text-sm text-xs text-yellow-600">
                        🍳 <strong>Breakfast:</strong> {data.breakfastMeals.join(", ")}
                    </p>
                ) : (
                    <p className="lg:text-sm text-xs text-gray-500">No breakfast data</p>
                )}

                {/* Lunch */}
                {Array.isArray(data.lunchMeals) && data.lunchMeals.length > 0 ? (
                    <p className="lg:text-sm text-xs text-green-600">
                        🍛 <strong>Lunch:</strong> {data.lunchMeals.join(", ")}
                    </p>
                ) : (
                    <p className="lg:text-sm text-xs text-gray-500">No lunch data</p>
                )}

                {/* Dinner */}
                {Array.isArray(data.dinnerMeals) && data.dinnerMeals.length > 0 ? (
                    <p className="lg:text-sm text-xs text-red-600">
                        🍽️ <strong>Dinner:</strong> {data.dinnerMeals.join(", ")}
                    </p>
                ) : (
                    <p className="lg:text-sm text-xs text-gray-500">No dinner data</p>
                )}
            </div>
        );
    }
    return null;
};
