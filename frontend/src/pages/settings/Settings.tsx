import { useEffect, useState } from "react";
import { useAuthContext } from "../../context/useAuthContext";
import Avatar from "/assets/avator2.png";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import Input from "../../shared/Input";
import Button from "../../shared/Button";
import Dropdown from "../../shared/Dropdown";
import { toast } from "react-toastify";
import { update_profile_url, update_health_details_url, update_customization_url } from "../../endpoints";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CustomDropdown from "../../shared/CustomDropdown";
import Toggle from "../../shared/Toggle";


export const dietTypes = [
    { label: "Keto", value: "keto" },
    { label: "Vegan", value: "vegan" },
    { label: "Vegetarian", value: "vegetarian" },
    { label: "Paleo", value: "paleo" },
];

export const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
];

export const notificationPreferences = [
    { label: "Email", value: "email" },
    { label: "SMS", value: "sms" },
    { label: "Phone", value: "phone" },
];

export const preferredDietTimes = [
    { label: "Morning", value: "morning" },
    { label: "Afternoon", value: "afternoon" },
    { label: "Evening", value: "evening" },
];

const Settings = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthContext();
    const [avatar, setAvatar] = useState(user?.avatar?.url || Avatar);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("Profile Update");

    // Profile Update Form Data
    const [profileData, setProfileData] = useState({
        firstname: "",
        lastname: "",
        phone_number: "",
        gender: "",
        oldPassword: "",
        newPassword: "",
        avatarFile: null as File | null
    });

    // Health Records Form Data
    const [healthData, setHealthData] = useState({
        diabetic_type: "",
        current_weight: "",
        height: "",
        preferred_diet_type: "",
        food_allergies: [],
        foods_to_avoid: [],
        favorite_foods: [],
    });

    // Customizations State
    const [customizationData, setCustomizationData] = useState({
        meal_reminder_preference: false,
        preferred_time_for_diet: "",
        notification_preference: "",
    });

    // ✅ Load User Data Once It's Available
    useEffect(() => {
        if (user) {
            setProfileData({
                firstname: user.firstname || "",
                lastname: user.lastname || "",
                phone_number: user.phone_number || "",
                gender: user.gender || "",
                oldPassword: "",
                newPassword: "",
                avatarFile: null
            });

            setHealthData({
                diabetic_type: user?.health_details?.diabetic_type || "",
                current_weight: user?.health_details?.current_weight || "",
                height: user?.health_details?.height || "",
                preferred_diet_type: user?.diatery_preferences?.preferred_diet_type || "",
                food_allergies: user?.diatery_preferences?.food_allergies || [],
                foods_to_avoid: user?.diatery_preferences?.foods_to_avoid || [],
                favorite_foods: user?.diatery_preferences?.favorite_foods || [],
            });

            setCustomizationData({
                meal_reminder_preference: user.customizations.meal_reminder_preference || false,
                preferred_time_for_diet: user.customizations.preferred_time_for_diet || "",
                notification_preference: user.customizations.notification_preference || "",
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (activeTab === "Profile Update") {
            setProfileData((prev) => ({
                ...prev,
                [name]: value,
            }));
        } else if (activeTab === "Health Records") {
            setHealthData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const file = e.target.files[0];
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

            if (!allowedTypes.includes(file.type)) {
                toast.error("Only PNG, JPEG, or JPG files are allowed.", {
                    position: "top-center",
                });
                return;
            }
            setAvatar(URL.createObjectURL(file));
            setProfileData((prev) => ({
                ...prev,
                avatarFile: file,
            }));
        }
    };

    const handleGenderChange = (value: string | string[]) => {
        setProfileData((prev) => ({
            ...prev,
            gender: Array.isArray(value) ? value[0] : value,
        }));
    };

    const handleUpdateProfile = async () => {
        setIsSubmitting(true);
        const data = new FormData();
        data.append("firstname", profileData.firstname);
        data.append("lastname", profileData.lastname);
        data.append("phone_number", profileData.phone_number);
        data.append("gender", profileData.gender);
        if (profileData.avatarFile) {
            data.append("avatar", profileData.avatarFile);
        }
        if (profileData.oldPassword && profileData.newPassword) {
            data.append("oldPassword", profileData.oldPassword);
            data.append("newPassword", profileData.newPassword);
        }

        try {
            const response = await axios.put(update_profile_url, data, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            const updatedUser = { ...user, ...response.data.user };
            setUser(updatedUser);
            toast.success(response.data.message, {
                position: "top-center",
            });
            navigate(`/profile`);
        } catch (error: any) {
            console.error("Error: ", error.data.message);
            toast.error("Error Updating Profile", {
                position: "top-center",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateHealthRecords = async () => {
        setIsSubmitting(true);
        try {
            const response = await axios.put(
                update_health_details_url,
                healthData,
                { withCredentials: true }
            );
            const updatedUser = { ...user, health_details: response.data.health_details };
            setUser(updatedUser);
            toast.success(response.data.message, {
                position: "top-center",
            });
            navigate(`/profile`);
        } catch (error: any) {
            console.error("Error: ", error.data.message);
            toast.error("Error Updating Health Records", {
                position: "top-center",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDropdownChange = (name: string, value: string | string[]) => {
        setHealthData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const handleCustomizationChange = (name: string, value: string | string[] | boolean) => {
        setCustomizationData((prev) => ({
            ...prev,
            [name]: typeof value === "boolean" ? value : (Array.isArray(value) ? value[0] : value),
        }));
    };


    const handleUpdateCustomizations = async () => {
        setIsSubmitting(true);
        try {
            console.log("Custimization", customizationData)
            const response = await axios.put(update_customization_url, customizationData, { withCredentials: true });
            const updatedUser = { ...user, customizations: response.data.customizations };
            setUser(updatedUser);
            toast.success(response.data.message, {
                position: "top-center"
            });
            navigate(`/profile`);
        } catch (error: any) {
            toast.error("Error updating customizations", { position: "top-center" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "Profile Update":
                return (
                    <form className="space-y-6  p-6 lg:pb-0 pb-12">
                        <div className="gflex flex-col gap-6">
                            <div className="flex lg:flex-row flex-col items-center space-x-2 lg:space-y-0 space-y-6">
                                <Input
                                    label="First Name"
                                    name="firstname"
                                    value={profileData.firstname}
                                    onChange={handleChange}
                                    placeholder="First Name"
                                    required
                                    width="w-full"
                                />
                                <Input
                                    label="Last Name"
                                    name="lastname"
                                    value={profileData.lastname}
                                    onChange={handleChange}
                                    placeholder="Last Name"
                                    width="w-full"
                                    required
                                />
                            </div>

                            <div className="flex mt-6 items-center space-x-2 lg:flex-row flex-col lg:space-y-0 space-y-6">
                                <Input
                                    label="Contact Phone"
                                    name="phone_number"
                                    value={profileData.phone_number}
                                    onChange={handleChange}
                                    placeholder="Phone Number"
                                    required
                                    width="w-full"
                                />
                                <Dropdown
                                    label="Gender"
                                    options={genderOptions}
                                    selected={profileData.gender}
                                    onChange={handleGenderChange}
                                    width="w-full"
                                    isMultiSelect={false}
                                />

                            </div>

                            {/* Password */}
                            <div className="flex mt-6 space-x-2 lg:flex-row flex-col lg:space-y-0 space-y-6">
                                <Input
                                    label="Old Password"
                                    name="oldPassword"
                                    type="password"
                                    value={profileData.oldPassword}
                                    onChange={handleChange}
                                    placeholder="Old Password"
                                    width="w-full"
                                />
                                <Input
                                    label="New Password"
                                    name="newPassword"
                                    type="password"
                                    value={profileData.newPassword}
                                    onChange={handleChange}
                                    placeholder="New Password"
                                    width="w-full"
                                />
                            </div>
                        </div>

                        {/* Save Changes Button */}
                        <div className="lg:justify-end lg:flex-end flex lg:mt-4 mt-6">
                            <Button
                                width="w-48"
                                text="Save Changes"
                                isLoading={isSubmitting}
                                onClick={handleUpdateProfile}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full"
                            />
                        </div>
                    </form>
                );
            case "Health Records":
                return (
                    <form className="space-y-6 p-6 lg:pb-0 pb-12">
                        <div className="gflex flex-col gap-6">
                            <div className="flex items-center space-x-2 lg:flex-row flex-col lg:space-y-0 space-y-6">
                                <Input
                                    label="Diabetic Type"
                                    name="diabetic_type"
                                    value={healthData.diabetic_type}
                                    onChange={handleChange}
                                    placeholder="Enter diabetic type"
                                    width="w-full"
                                />
                                <Input
                                    label="Current Weight (kg)"
                                    name="current_weight"
                                    value={healthData.current_weight}
                                    onChange={handleChange}
                                    placeholder="Enter current weight"
                                    width="w-full"
                                />
                            </div>
                            <div className="flex mt-4 items-center space-x-2 lg:flex-row flex-col lg:space-y-0 space-y-6">
                                <Input
                                    label="Height (cm)"
                                    name="height"
                                    value={healthData.height}
                                    onChange={handleChange}
                                    placeholder="Enter height"
                                    width="w-full"
                                />
                                <Dropdown
                                    label="Preferred Diet Type"
                                    options={dietTypes}
                                    selected={healthData.preferred_diet_type}
                                    onChange={(value) => handleDropdownChange("preferred_diet_type", value)}
                                    width="w-full"
                                    isMultiSelect={false}
                                />
                            </div>
                            <div className="flex mt-4 items-center space-x-2 lg:flex-row flex-col lg:space-y-0 space-y-6">
                                <CustomDropdown
                                    label="Food Allergies"
                                    selected={healthData.food_allergies}
                                    onChange={(value) => handleDropdownChange("food_allergies", value)}
                                    width="w-full"
                                />

                                <CustomDropdown
                                    label="Foods to Avoid"
                                    selected={healthData.foods_to_avoid}
                                    onChange={(value) => handleDropdownChange("foods_to_avoid", value)}
                                    width="w-full"
                                />
                            </div>
                            <div className="flex mt-4 items-center space-x-2 lg:flex-row flex-col lg:space-y-0 space-y-6">
                                <CustomDropdown
                                    label="Favorite Foods"
                                    selected={healthData.favorite_foods}
                                    onChange={(value) => handleDropdownChange("favorite_foods", value)}
                                    width="w-full"
                                />
                            </div>
                        </div>

                        {/* Save Changes Button */}
                        <div className="lg:justify-end lg:flex-end flex lg:mt-4 mt-8">
                            <Button
                                width="w-48"
                                text="Save Changes"
                                isLoading={isSubmitting}
                                onClick={handleUpdateHealthRecords}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full"
                            />
                        </div>
                    </form>
                )
            case "Customizations":
                return (
                    <form className="space-y-20 p-6">
                        <div className="flex flex-col gap-6">

                            <div className="flex items-center mt-4 space-x-4">
                                <Toggle
                                    label="Meal Reminder Preference"
                                    checked={customizationData.meal_reminder_preference}
                                    onChange={(value: boolean) => handleCustomizationChange("meal_reminder_preference", value)}
                                />

                            </div>
                            <div className="flex items-center mb-2 mt-2 space-x-4 lg:flex-row flex-col lg:space-y-0 space-y-6">
                                <Dropdown
                                    label="Preferred Time for Diet"
                                    options={preferredDietTimes}
                                    selected={customizationData.preferred_time_for_diet}
                                    onChange={(value) => handleCustomizationChange("preferred_time_for_diet", value)}
                                    width="w-full"
                                    isMultiSelect={false}
                                />

                                <Dropdown
                                    label="Notification Preference"
                                    options={notificationPreferences}
                                    selected={customizationData.notification_preference}
                                    onChange={(value) => handleCustomizationChange("notification_preference", value)}
                                    width="w-full"
                                    isMultiSelect={false}
                                />
                            </div>
                        </div>

                        {/* Save Customizations Button */}
                        <div className="justify-end flex mt-4">
                            <Button
                                width="w-48"
                                text="Save Changes"
                                isLoading={isSubmitting}
                                onClick={handleUpdateCustomizations}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full"
                            />
                        </div>
                    </form>
                )
            default:
                return null;
        }
    };
    return (
        <section className="h-screen py-6 ">
            <div className="max-w-screen-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                {/* Profile Header */}
                <div className="flex flex-col justify-between ">
                    <div className="flex p-6 items-center ">
                        <div className="relative">
                            <img
                                src={avatar}
                                alt="Profile"
                                className="w-24 h-24 rounded-full border-2 border-gray-200"
                            />
                            <label htmlFor="avatar" className="absolute bottom-6 right-16 lg:bottom-6 lg:right-[70px] p-1 bg-white rounded-full shadow-md cursor-pointer">
                                <span className="text-xl text-gray-500">
                                    <HiOutlinePencilSquare />
                                </span>
                            </label>
                            <input
                                type="file"
                                id="avatar"
                                name="avatar"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <p className="text-xs text-red-500 mt-1">Allowed formats: png, jpeg, jpg</p>
                        </div>
                        <div className="lg:-ml-[55px] -ml-10">
                            <h2 className="lg:text-2xl text-lg font-semibold text-gray-700">
                                {user.firstname} {user.lastname}
                            </h2>
                            <p className="lg:text-sm text-xs lg:whitespace-normal whitespace-nowrap text-gray-500">Manage your profile and preferences</p>
                        </div>
                    </div>
                    <div className="border-b-2">
                        <div className="flex space-x-6 -mb-[1px] px-6">
                            {["Profile Update", "Health Records", "Customizations"].map((tab) => (
                                <div
                                    key={tab}
                                    className={`lg:text-md text-sm py-2 select-none cursor-pointer ${activeTab === tab ? "border-b-2 border-blue-600" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {renderTabContent()}
            </div>
        </section>
    )
}

export default Settings