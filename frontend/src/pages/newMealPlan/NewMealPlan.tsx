import axios from "axios";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthContext } from "../../context/useAuthContext";
import { generate_recommendation_url } from "../../endpoints";

const NewMealPlan = () => {
    const { user, fetchRecommendations, isLoadingRecs } = useAuthContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleGenerateRecommendations = async () => {
        if (!user?._id) {
            setMessage("User not authenticated.");
            toast.error("User not authenticated!", { position: "top-center" });
            return;
        }
    
        setIsSubmitting(true);
        setMessage("");
        toast.dismiss();
    
        try {
             await axios.post( `${generate_recommendation_url}/${user._id}`, {},
                { withCredentials: true }
            );
            
            await fetchRecommendations(); 
            
            const successMsg = "Weekly diet plan generated successfully! ✅";
            setMessage(successMsg);
            toast.success(successMsg, { position: "top-center" });
        } catch (error: any) {
            
            const errMsg = axios.isAxiosError(error)
                ? error.response?.data?.message || "Request failed"
                : "Network error occurred";
            
            setMessage(errMsg);
            toast.error(errMsg, { position: "top-center" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="h-screen flex flex-col items-center justify-center bg-gradient-to-r from-green-500 to-teal-500 text-white relative font-geist">
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
                        Generating your personalized meal plan... Stay Healthy! �
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
                    disabled={isSubmitting || isLoadingRecs}
                >
                    {isSubmitting ? "Generating..." : "Generate My Meal Plan"}
                </motion.button>

                {message && (
                    <motion.p
                        className="mt-4 text-lg font-semibold"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {message}
                    </motion.p>
                )}

                {!isSubmitting && message.includes("successfully") && (
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