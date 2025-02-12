import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import Button from "../shared/Button";
import CustomDatePicker from "../shared/DatePicker";
import Dropdown from "../shared/Dropdown";
import Input from "../shared/Input";
import Modal from "../shared/Modal";
import RadioButton from "../shared/RadioButton";
import Toggle from "../shared/Toggle";

const Testing = () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | string[] | null>(null);
    const [selectedRadio, setSelectedRadio] = useState("");
    const [isToggled, setIsToggled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error" | "warning">("success");


    const handleSubmit = () => {
        setIsSubmitting(true);
        console.log("Submitted!");
        setIsSubmitting(false);
    };

    return (
        <section className="h-screen flex items-center justify-center font-bold">
            <div className="max-w-md mx-auto space-y-4">
                <Input
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    icon={<Mail className="w-5 h-5" />}
                    value={email}
                    width="w-full"
                    height="h-10"
                    onChange={(e) => setEmail(e.target.value)}
                    error={!email ? "Email is required" : ""}
                    borderRadius="rounded-md"

                />

                <Input
                    label="Password"
                    type="password"
                    placeholder="Enter password"
                    icon={<Lock className="w-5 h-5" />}
                    value={password}
                    width="w-full"
                    height="h-10"
                    onChange={(e) => setPassword(e.target.value)}
                    error={!password ? "Password is required" : ""}
                    borderRadius="rounded-md"

                />
                <CustomDatePicker
                    label="Date of Birth"
                    selectedDate={selectedDate}
                    onChange={setSelectedDate}
                    error={!selectedDate ? "Date is required" : ""}
                    width="w-full"
                    height="h-10"
                    borderRadius="rounded-md"
                />

                <Dropdown
                    label="Select an Item"
                    options={[
                        { label: "Apple", value: "apple" },
                        { label: "Banana", value: "banana" },
                        { label: "Cherry", value: "cherry" }
                    ]}
                    selected={selectedOption}
                    onChange={setSelectedOption}
                    width="w-full"
                    height="h-10"
                    borderRadius="rounded-md"
                    isSearchable={true}
                    isMultiSelect={true}
                    error={
                        (Array.isArray(selectedOption) && selectedOption.length === 0) ||
                            (!Array.isArray(selectedOption) && !selectedOption)
                            ? "Select an option"
                            : ""
                    }
                />

                <RadioButton
                    label="Select Gender"
                    options={[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                        { label: "Other", value: "other" },
                    ]}
                    selected={selectedRadio}
                    onChange={setSelectedRadio}
                    width="w-full"
                    error={!selectedRadio ? "Select a gender" : ""}
                    showErrorBelow={false}
                />

                <Toggle
                    label="Enable Notifications"
                    checked={isToggled}
                    onChange={setIsToggled}
                    width="w-12"
                    height="h-6"
                    borderRadius="rounded-full"
                    activeColor="bg-blue-600"
                    inactiveColor="bg-gray-400"
                    thumbColor="bg-white"
                />

                <Button
                    text="Submit"
                    onClick={handleSubmit}
                    bgColor="bg-green-600"
                    textColor="text-white"
                    borderRadius="rounded-md"
                    width="w-full"
                    height="h-10"
                    isLoading={isSubmitting}
                    hover={true}
                    hoverColor="hover:bg-green-700"
                    animate={true}
                />
            </div>
            <Button
                text="Show Success Modal"
                onClick={() => { setModalType("success"); setIsOpen(true); }}
                bgColor="bg-green-600"
                hoverColor="hover:bg-green-700"
                width="w-64"
                height="h-12"
                borderRadius="rounded-lg"
            />

            <Button
                text="Show Error Modal"
                onClick={() => { setModalType("error"); setIsOpen(true); }}
                bgColor="bg-red-600"
                hoverColor="hover:bg-red-700"
                width="w-64"
                height="h-12"
                borderRadius="rounded-lg"
            />

            <Button
                text="Show Warning Modal"
                onClick={() => { setModalType("warning"); setIsOpen(true); }}
                bgColor="bg-yellow-600"
                hoverColor="hover:bg-yellow-700"
                textColor="text-black"
                width="w-64"
                height="h-12"
                borderRadius="rounded-lg"
            />

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Modal Title"
                message="This is a customizable modal component."
                type={modalType}
                confirmText="Confirm"
                cancelText="Cancel"
                showCancel={false}
                showConfirm={false}
            />

            Welcome to DiaNutri
        </section>
    )
};

export default Testing;
