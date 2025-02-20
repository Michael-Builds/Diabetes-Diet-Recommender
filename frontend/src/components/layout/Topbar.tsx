import React, { useEffect, useRef, useState } from 'react';
import { IoIosLogOut } from "react-icons/io";
import { MdKeyboardArrowDown, MdOutlineNotificationsActive, MdPerson } from "react-icons/md";
import { VscSettings } from 'react-icons/vsc';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthContext } from '../../context/useAuthContext';
import Avatar from "/assets/avator2.png";

const Topbar = React.memo(({ toggleDrawer }: any) => {
    const { user, logout, notifications } = useAuthContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const avatarUrl = user?.avatar?.url || Avatar

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully", { position: "top-center", autoClose: 1000 });
            navigate("/")
        } catch (error) {
            toast.error("Failed to log out. Please try again later.", { position: "top-center", autoClose: 1000 });
        }
    };

    const dropdownItems = [
        { id: "profile", label: "Profile", icon: <MdPerson size={20} className="mr-2" color={"gray"} />, path: "/profile" },
        { id: "settings", label: "Settings", icon: <VscSettings size={20} className="mr-2" color={"gray"} />, path: "/settings" },
        { id: "logout", label: "Logout", icon: <IoIosLogOut size={20} className="mr-2" color={"gray"} />, action: logout },
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);


    return (
        <section className="bg-white select-none pl-2 pr-2 lg:pl-8 lg:pr-8 font-geist shadow-md h-14 rounded-xl items-center flex justify-between">
            <div className="relative lg:ml-0 ml-12" onClick={toggleDrawer}>
                <MdOutlineNotificationsActive size={26} color={"gray"} />
                {notifications.length > 0 && (
                    <span className="absolute bottom-3 cursor-pointer left-4 text-xs text-white bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications.length > 10 ? "10+" : notifications.length}
                    </span>
                )}
            </div>
            <div className="flex items-center cursor-pointer" onClick={toggleDropdown} ref={dropdownRef}>
                <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full mr-2"
                />
                <div className="text-sm text-gray-700">
                    {user?.firstname}
                    <span className="ml-1">{user?.lastname}</span>
                </div>
                <MdKeyboardArrowDown
                    size={24}
                    color={"gray"}
                    className={`ml-2 transform transition-all duration-100 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />

                {isDropdownOpen && (
                    <div className="absolute select-none mt-[10.5rem] text-sm font-geist right-0 w-48 bg-white shadow-md border-gray-100 border-2 z-10">
                        <ul>
                            {dropdownItems.map((item) => (
                                <li
                                    key={item.id}
                                    onClick={item.path ? () => handleNavigation(item.path) : handleLogout}
                                    className="px-4 py-2 hover:bg-gray-100 flex items-center"
                                >
                                    {item.icon} {item.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
});

export default Topbar;
