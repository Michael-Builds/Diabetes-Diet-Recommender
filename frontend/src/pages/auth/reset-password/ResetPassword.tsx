import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/assets/logo.svg";
import Input from "../../../shared/Input";
import Button from "../../../shared/Button";
import { Lock, Key, Mail } from "lucide-react";
import { toast } from "react-toastify";
import { authService } from "../../../services/authService";
import { useAuthContext } from "../../../context/useAuthContext";
import { getErrorMessage } from "../../../utils/msc";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || ""
  const { dispatch, refresh } = useAuthContext();

  const [formData, setFormData] = useState({
    email: email,
    activationCode: "",
    newPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (email) {
      setFormData((prev) => ({ ...prev, email }));
    }
  }, [email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.activationCode || !formData.newPassword) {
      toast.error("All fields are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authService.resetPassword(formData);
      toast.success(response.data.message);

      if (response.data.token && response.data.refreshToken) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        dispatch({ type: "LOGIN_SUCCESS", payload: response.data.user });

        await refresh();
      }

      navigate("/");
    } catch (error: unknown) {
     const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-[34rem] h-[33rem] select-none font-geist shadow-lg p-10 bg-white rounded-lg">
      <div className="flex flex-col items-center">
        <img src={Logo} alt="Logo" className="w-52 h-auto" />
        <p className="text-sm text-gray-500 mt-4">Enter your reset code and new password</p>
      </div>
      <div className="mt-4 flex flex-col gap-6">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          icon={<Mail className="w-5 h-5" />}
          value={formData.email}
          readOnly
          onKeyDown={(e) => e.preventDefault()}
        />

        <Input
          label="Reset Code"
          name="activationCode"
          type="text"
          placeholder="Enter the reset code"
          icon={<Key className="w-5 h-5" />}
          value={formData.activationCode}
          onChange={handleChange}
          error={!formData.activationCode ? "Reset code is required" : ""}
          showErrorBelow={false}

        />
        <Input
          label="New Password"
          name="newPassword"
          type="password"
          placeholder="Enter your new password"
          icon={<Lock className="w-5 h-5" />}
          value={formData.newPassword}
          onChange={handleChange}
          error={!formData.newPassword ? "Password is required" : ""}
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

      <p className="mt-6 text-sm flex items-center justify-center text-gray-600">
        Remembered your password?
        <span className="text-blue-500 ml-2 hover:underline cursor-pointer" onClick={() => navigate("/")}>
          Login here
        </span>
      </p>
    </div>
  );
};

export default ResetPassword;
