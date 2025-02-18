import axios from "axios";
import { Key } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { activate_account_url, resend_activate_code_url } from "../../../endpoints";
import Button from "../../../shared/Button";
import Input from "../../../shared/Input";
import Logo from "/assets/logo.svg";

const VerifyOtp = () => {
    const navigate = useNavigate();
    const [otp, setOtp] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOtp(e.target.value);
        setErrorMessage("");
    };

    // Handle OTP Verification
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        if (!otp) {
            setErrorMessage("No OTP Found");
            setIsSubmitting(false);
            return;
        }

        try {
            await axios.post(
                activate_account_url,
                { activation_code: otp },
                { withCredentials: true }
            );


            toast.success("Account verified successfully! Redirecting to login...", { position: "top-center" });
            setSuccessMessage("Account verified successfully!");


            setTimeout(() => navigate("/login"), 3000);
        } catch (error: any) {
            console.error("OTP Verification Failed:", error);

            if (error.response) {
                if (error.response.status === 400) {
                    setErrorMessage("Invalid OTP. Please try again.");
                } else if (error.response.status === 401) {
                    setErrorMessage("This OTP has expired. Request a new one.");
                } else {
                    setErrorMessage(error.response.data.message || "Something went wrong. Try again.");
                }
            } else {
                setErrorMessage("Network error. Please check your connection.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Resend OTP
    const handleResendOTP = async () => {
        try {
            await axios.post(resend_activate_code_url, {}, { withCredentials: true });
            toast.success("A new OTP has been sent to your email.", { position: "top-center" });
        } catch (error: any) {
            console.error("Resend OTP Failed:", error);
            toast.error("Failed to resend OTP. Try again later.", { position: "top-center" });
        }
    };

    return (
        <div className="w-[30rem] h-[23rem] font-geist shadow-lg p-10 bg-white rounded-lg">
            <div className="flex flex-col items-center">
                <img src={Logo} alt="Logo" className="w-52 h-auto" />
            </div>

            {/* Placeholder for error/success messages */}
            <div className="min-h-[24px] mt-2">
                {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>}
                {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
            </div>

            <div className="mt-6 flex flex-col gap-3">
                <Input
                    label="OTP Code"
                    name="otp"
                    type="text"
                    placeholder="Enter OTP"
                    maxLength={6}
                    icon={<Key className="w-5 h-5" />}
                    value={otp}
                    onChange={handleChange}
                    error={!otp ? "OTP is required" : ""}
                    showErrorBelow={false}
                />
            </div>

            <div className="mt-10">
                <Button
                    text="Verify OTP"
                    onClick={handleSubmit}
                    fullWidth
                    hover={true}
                    textColor="text-white"
                    bgColor="bg-blue-600"
                    hoverColor="hover:bg-blue-800"
                    isLoading={isSubmitting}
                    animate={false}
                />
            </div>

            <p className="mt-4 text-sm flex items-center justify-center text-gray-600">
                Didn't receive the OTP?
                <span
                    className="text-blue-500 ml-2 hover:underline cursor-pointer"
                    onClick={handleResendOTP}
                >
                    Resend OTP
                </span>
            </p>
        </div>
    );
};

export default VerifyOtp;
