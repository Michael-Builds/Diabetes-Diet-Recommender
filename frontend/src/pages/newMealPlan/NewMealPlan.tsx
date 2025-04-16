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
            setMessage("User not authenticated.");
            toast.error("User not authenticated!", { position: "top-center" });
            return;
        }

        setIsSubmitting(true);
        setMessage("");
        toast.dismiss(); // Close any previous toasts

        try {
            const response = await axios.post(
                `${generate_recommendation_url}/${userId}`,
                {},
                { withCredentials: true }
            );

            const recommendations = response?.data?.recommendations;

            if (!Array.isArray(recommendations) || recommendations.length === 0) {
                setRecommendations([]);
                localStorage.setItem("recommendations", JSON.stringify([]));
                const msg = "No recommendations found. Try again later! ❌";
                setMessage(msg);
                toast.error(msg, { position: "top-center" });
                return;
            }

            setRecommendations(recommendations);
            localStorage.setItem("recommendations", JSON.stringify(recommendations));
            const successMsg = "Weekly diet plan generated successfully! ✅";
            setMessage(successMsg);
            toast.success("Recommendation Generated!!", { position: "top-center" });

            await fetchNotifications();
        } catch (error: any) {
            console.error("Recommendation error:", error);

            setRecommendations([]);
            localStorage.setItem("recommendations", JSON.stringify([]));

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const errMsg = error.response?.data?.message || "Bad request. ❌";
                    setMessage(errMsg);
                    toast.error(errMsg, { position: "top-center" });
                } else if (error.response?.status === 401) {
                    const errMsg = "Unauthorized access. Please login again.";
                    setMessage(errMsg);
                    toast.error(errMsg, { position: "top-center" });
                } else {
                    const errMsg = error.response?.data?.message || "Server error occurred.";
                    setMessage(errMsg);
                    toast.error(errMsg, { position: "top-center" });
                }
            } else {
                setMessage("Network error or unknown issue occurred. ❌");
                toast.error("Network error or unknown issue occurred!", { position: "top-center" });
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