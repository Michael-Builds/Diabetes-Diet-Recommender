import axios from "axios";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthContext } from "../../context/useAuthContext";
import { generate_recommendation_url } from "../../endpoints";

const NewMealPlan = () => {
    const { user, setRecommendations, fetchNotifications } = useAuthContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const userId = user._id;

    const handleGenerateRecommendations = async () => {
        if (!userId) {
            console.error("❌ User ID is missing.");
            return;
        }
        setIsSubmitting(true);
        setMessage("");
        try {
            const response = await axios.post(`${generate_recommendation_url}/${userId}`, {}, { withCredentials: true });

            if (!response.data || !Array.isArray(response.data.recommendations)) {
                setRecommendations([]);
                localStorage.setItem("recommendations", JSON.stringify([]));
                setMessage("No recommendations found. Try again later! ❌");
                toast.error("No recommendations found", {
                    position: "top-center",
                })
                return;
            }

            setRecommendations(response.data.recommendations);
            localStorage.setItem("recommendations", JSON.stringify(response.data.recommendations));
            setMessage("Weekly diet plan generated successfully! ✅");
            toast.success("Recommendation Generated!!", {
                position: "top-center",
            })
            await fetchNotifications();
        } catch (error: any) {
            setRecommendations([]);
            localStorage.setItem("recommendations", JSON.stringify([]));

            if (error.response?.status === 400) {
                setMessage(error.response.data.message);
                toast.error(error.response.data.message, {
                    position: "top-center",
                });
            } else {
                setMessage("Something went wrong! Please try again. ❌");
                toast.error("Something went wrong!", {
                    position: "top-center",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="h-screen flex flex-col items-center justify-center bg-gradient-to-r from-green-500 to-teal-500 text-white relative font-geist">

            {/* Overlay with Health-Related Animation While Loading */}
            {isSubmitting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 z-50">
                    <motion.span
                        className="text-6xl"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                    >
                        ❤️‍🔥
                    </motion.span>
                    <p className="lg:text-lg text-md mt-4 font-semibold">
                        Generating your personalized meal plan... Stay Healthy! 🍎
                    </p>
                </div>
            )}

            <div className="text-center">
                <h1 className="lg:text-4xl text-xl font-bold">Personalized Meal Plan</h1>
                <p className="mt-2 lg:text-lg text-sm">Click below to generate a diet plan tailored to your health needs!</p>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 text-sm lg:text-md px-6 py-3 bg-white text-green-600 font-bold rounded-full shadow-lg hover:bg-gray-200 transition"
                    onClick={handleGenerateRecommendations}
                    disabled={isSubmitting}
                >
                    Generate My Meal Plan
                </motion.button>

                {/* Success/Error Message */}
                {message && (
                    <motion.p
                        className="mt-4 text-lg font-semibold"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {message}
                    </motion.p>
                )}

                {/* Navigate to Meal Plan Page after Success */}
                {!isSubmitting && message.includes("ready") && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4 px-6 text-sm lg:text-md py-3 bg-white text-green-600 font-bold rounded-full shadow-lg hover:bg-gray-200 transition"
                        onClick={() => navigate("/recommendations")}
                    >
                        View My Meal Plan 🍽️
                    </motion.button>
                )}
            </div>
        </section>
    );
};

export default NewMealPlan;