import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "/assets/logo.svg"
import Input from "../../../shared/Input";
import Button from "../../../shared/Button";
import { useAuthContext } from "../../../context/useAuthContext";
import { Lock, Mail } from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../../utils/msc";

const Login = () => {
    const { login } = useAuthContext();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        if (!formData.email.trim() || !formData.password.trim()) {
            toast.error("Please fill in both email and password.", { position: "top-center" });
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const response = await login(formData);
            if (response.success) {
                toast.success(response.message, {
                    position: "top-center",
                    autoClose: 2000
                });
                navigate("/dashboard");
            } else {
                toast.error(response?.message || "Invalid invalid or password", {
                    position: "top-center",
                    autoClose: 2000
                });
            }
        } catch (error: unknown) {
            const message = getErrorMessage(error);

            toast.error(message, {
                position: "top-center",
                autoClose: 2000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="2xl:w-[32rem] lg:w-[30rem] 2xl:h-[30rem] lg:h-[29rem] select-none font-geist shadow-lg p-10">
            <div className="flex flex-col items-center">
                <img src={Logo} alt="Logo" className="w-52 h-auto" />
                <p className="text-sm text-gray-500 mt-4">Login into your account</p>
            </div>
            <div className="mt-2 flex flex-col gap-3">
                <Input
                    label="Email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    icon={<Mail className="w-5 h-5" />}
                    error={!formData.email ? "Email is required" : ""}
                    value={formData.email}
                    onChange={handleChange}
                    className="mb-4"
                    showErrorBelow={false}
                />
                <Input
                    label="Password"
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    icon={<Lock className="w-5 h-5" />}
                    width="w-full"
                    height="h-10"
                    value={formData.password}
                    onChange={handleChange}
                    error={!formData.password ? "Password is required" : ""}
                    borderRadius="rounded-md"
                    showErrorBelow={false}
                />
            </div>

            <div className="flex justify-between items-center mt-8 text-sm text-gray-600">
                <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Remember this Device
                </label>
                <a href="/forgot-password" className="text-blue-500 hover:underline">Forgot Password?</a>
            </div>

            <div className="mt-6">
                <Button
                    text="Login"
                    onClick={handleLogin}
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
                New to DiaNutri ?  <a href="/register" className="text-blue-500 ml-4 hover:underline">Create an account</a>
            </p>
        </div>
    )
}

export default Login;