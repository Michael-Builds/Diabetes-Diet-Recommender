import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "/assets/logo.svg";
import Input from "../../../shared/Input";
import Button from "../../../shared/Button";
import { Mail } from "lucide-react";
import { toast } from "react-toastify";
import { authService } from "../../../services/authService";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authService.forgotPassword(email);
      toast.success(response.data.message);
      navigate("/reset-password", { state: { email } });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-[30rem] h-[22rem] select-none font-geist shadow-lg p-10 bg-white rounded-lg">
      <div className="flex flex-col items-center">
        <img src={Logo} alt="Logo" className="w-52 h-auto" />
        <p className="text-sm text-gray-500 mt-4">Reset your password</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          icon={<Mail className="w-5 h-5" />}
          error={!email ? "Email is required" : ""}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          showErrorBelow={false}
        />
      </div>

      <div className="mt-8">
        <Button
          text="Reset Password"
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

      <p className="mt-8 text-sm flex items-center justify-center text-gray-600">
        Remembered your password?
        <span className="text-blue-500 ml-2 hover:underline cursor-pointer" onClick={() => navigate("/login")}>
          Login here
        </span>
      </p>
    </div>
  );
};

export default ForgotPassword;
