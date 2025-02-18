import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "/assets/logo.svg";
import Button from "../../../shared/Button";
import Input from "../../../shared/Input";
import { Lock, Mail, Phone, User } from "lucide-react";
import RadioButton from "../../../shared/RadioButton";
import axios from "axios";
import { register_url } from "../../../endpoints";
import { toast } from "react-toastify";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState("");

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone_number: "",
    gender: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone_number: "",
    gender: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateStep1 = () => {
    let newErrors = { firstname: "", lastname: "", gender: "" };
    if (!formData.firstname) newErrors.firstname = "First Name is required";
    if (!formData.lastname) newErrors.lastname = "Last Name is required";
    if (!selectedRadio) newErrors.gender = "Please select a gender";

    setErrors({ ...errors, ...newErrors });

    if (Object.values(newErrors).some((error) => error !== "")) {
      toast.error("Please fill in all required fields.", { position: "top-center" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    let newErrors = { email: "", phone_number: "", password: "" };
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone_number) newErrors.phone_number = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";

    setErrors({ ...errors, ...newErrors });

    if (Object.values(newErrors).some((error) => error !== "")) {
      toast.error("Please fill in all required fields.", { position: "top-center" });
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setFormData((prev) => ({ ...prev, gender: selectedRadio }));
      setStep(2);
    }
  };

  const handleSignUp = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    try {
      await axios.post(register_url, formData, { withCredentials: true });
      toast.success("Account created successfully! Please verify your OTP.", {
        position: "top-center",
      });

      navigate(`/verify-otp`);
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Failed to register. Please try again.", {
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="2xl:w-[34rem] lg:w-[32rem] h-auto select-none font-geist shadow-lg p-10 bg-white rounded-lg">
      <div className="flex flex-col items-center">
        <img src={Logo} alt="Logo" className="w-52 h-auto" />
        <p className="text-sm text-gray-500 mt-4">Create your account</p>
      </div>
      {/* Step 1: Basic Information */}
      {step === 1 && (
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="First Name"
            name="firstname"
            type="text"
            placeholder="Enter your first name"
            icon={<User className="w-5 h-5" />}
            value={formData.firstname}
            onChange={handleChange}
            error={errors.firstname}
            showErrorBelow={false}
          />
          <Input
            label="Last Name"
            name="lastname"
            type="text"
            placeholder="Enter your last name"
            icon={<User className="w-5 h-5" />}
            value={formData.lastname}
            onChange={handleChange}
            error={errors.lastname}
            showErrorBelow={false}
          />
          <RadioButton
            label="Select Gender"
            options={[
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
            ]}
            selected={selectedRadio}
            onChange={setSelectedRadio}
            width="w-full"
            error={errors.gender}
            showErrorBelow={false}
            className="mt-2 mb-2"
          />

          <Button
            text="Next"
            onClick={handleNextStep}
            fullWidth
            bgColor="bg-blue-600"
            hoverColor="hover:bg-blue-800"
          />
        </div>
      )}

      {/* Step 2: Contact Information */}
      {step === 2 && (
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            icon={<Mail className="w-5 h-5" />}
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            showErrorBelow={false}
          />
          <Input
            label="Phone Number"
            name="phone_number"
            type="tel"
            placeholder="Enter your phone number"
            icon={<Phone className="w-5 h-5" />}
            value={formData.phone_number}
            onChange={handleChange}
            error={errors.phone_number}
            showErrorBelow={false}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            icon={<Lock className="w-5 h-5" />}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            showErrorBelow={true}
          />

          <div className="mt-4 flex gap-4">
            <Button
              text="Back"
              onClick={() => setStep(1)}
              fullWidth
              bgColor="bg-gray-500"
              hoverColor="hover:bg-gray-600"
            />
            <Button
              text="Register"
              onClick={handleSignUp}
              fullWidth
              isLoading={isSubmitting}
              bgColor="bg-blue-600"
              hoverColor="hover:bg-blue-800"
            />
          </div>
        </div>
      )}

      <p className="mt-6 text-sm flex items-center justify-center text-gray-600">
        Already have an account?
        <span className="text-blue-500 ml-2 hover:underline cursor-pointer" onClick={() => navigate("/login")}>
          Login into your account
        </span>
      </p>
    </div>
  );
};

export default Signup;
