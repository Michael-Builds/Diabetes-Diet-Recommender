import { useState } from "react";
import { useAuthContext } from "../../context/useAuthContext";
import Avatar from "/assets/avator2.png";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import Input from "../../shared/Input";
import Button from "../../shared/Button";
import Dropdown from "../../shared/Dropdown";
import { toast } from "react-toastify";
import { update_profile_url } from "../../endpoints";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Settings = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [avatar, setAvatar] = useState(user?.avatar?.url || Avatar);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstname: user?.firstname || "",
        lastname: user?.lastname || "",
        phone_number: user?.phone_number || "",
        gender: user?.gender || "",
        oldPassword: "",
        newPassword: "",
        avatarFile: null as File | null
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const file = e.target.files[0];
            setAvatar(URL.createObjectURL(file));
            setFormData((prev) => ({
                ...prev,
                avatarFile: file,
            }));
        }
    };

    const handleGenderChange = (value: string | string[]) => {
        setFormData((prev) => ({
            ...prev,
            gender: value,
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const data = new FormData();
        data.append("firstname", formData.firstname);
        data.append("lastname", formData.lastname);
        data.append("phone_number", formData.phone_number);
        data.append("gender", formData.gender);
        if (formData.avatarFile) {
            data.append("avatar", formData.avatarFile);
        }
        if (formData.oldPassword && formData.newPassword) {
            data.append("oldPassword", formData.oldPassword);
            data.append("newPassword", formData.newPassword);
        }
        console.log(data);
        try {
            const response = await axios.put(update_profile_url, data, { withCredentials: true });
            console.log("Response:", response);
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

    return (
        <section className="h-screen  py-8 px-6">
            <div className="max-w-screen-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                {/* Profile Header */}
                <div className="flex items-center justify-between p-6 border-b-2">
                    <div className="flex items-center">
                        <div className="relative">
                            <img
                                src={avatar}
                                alt="Profile"
                                className="w-20 h-20 rounded-full border-2 border-gray-200"
                            />
                            <label htmlFor="avatar" className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-md cursor-pointer">
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
                        </div>
                        <div className="ml-4">
                            <h2 className="text-2xl font-semibold text-gray-700">{user.firstname} {user.lastname}</h2>
                            <p className="text-sm text-gray-500">Manage your profile and preferences</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form className="space-y-6 p-6">
                    <div className="gflex flex-col gap-6">
                        <div className="flex  items-center space-x-2">
                            <Input
                                label="First Name"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleChange}
                                placeholder="First Name"
                                required
                                width="w-full"
                            />
                            <Input
                                label="Last Name"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleChange}
                                placeholder="Last Name"
                                width="w-full"
                                required
                            />
                        </div>

                        <div className="flex mt-6 items-center space-x-2">
                            <Input
                                label="Contact Phone"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="Phone Number"
                                required
                                width="w-full"
                            />
                            <Dropdown
                                label="Gender"
                                options={[
                                    { label: "Male", value: "male" },
                                    { label: "Female", value: "female" },
                                    { label: "Other", value: "other" },
                                ]}
                                selected={formData.gender}
                                onChange={handleGenderChange}
                                width="w-full"
                                isMultiSelect={false}
                            />
                        </div>

                        {/* Password */}
                        <div className="flex mt-6  space-x-2">
                            <Input
                                label="Old Password"
                                name="oldPassword"
                                type="password"
                                value={formData.oldPassword}
                                onChange={handleChange}
                                placeholder="Old Password"
                                width="w-full"
                            />
                            <Input
                                label="New Password"
                                name="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="New Password"
                                width="w-full"
                            />
                        </div>
                    </div>

                    {/* Save Changes Button */}
                    <div className="justify-end flex-end flex mt-4">
                        <Button
                            width="w-48"
                            text="Save Changes"
                            isLoading={isSubmitting}
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full"
                        />
                    </div>
                </form>
            </div>
        </section>
    )
}

export default Settings