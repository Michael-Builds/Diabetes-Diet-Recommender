import { useState } from "react";
import { BsGrid } from "react-icons/bs";
import { CiCircleList } from "react-icons/ci";
import { RiAiGenerate2 } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Logo from "/assets/logo.svg";
import { LiaBookMedicalSolid } from "react-icons/lia";
import { VscSettings } from "react-icons/vsc";

const Sidebar = () => {
    const navigate = useNavigate();
    const [activePath, setActivePath] = useState("/dashboard");

    const navItems = [
        { name: "Dashboard", path: "/dashboard", icon: <BsGrid size={20} /> },
        { name: "Recommendations", path: "/recommendations", icon: <CiCircleList size={20} /> },
        { name: "Generate Meal Plan", path: "/new-meal-plan", icon: <RiAiGenerate2 size={20} /> },
        { name: "Health Records", path: "/health-records", icon: <LiaBookMedicalSolid size={20} /> },
        { name: "Customizations", path: "/customizations", icon: <VscSettings  size={20} /> },
    ];

    const handleNavigation = (path: string) => {
        setActivePath(path);
        navigate(path);
    };

    return (
        <section className="bg-white select-none font-geist shadow-sm h-full rounded-lg  w-full  flex flex-col gap-10 items-center">
            <div className="lg:mt-5 py-3 px-5">
                <img src={Logo} alt="Logo" className="h-12" />
            </div>

            <div className="flex flex-col gap-6 w-full">
                {navItems.map((item) => (
                    <div
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={`py-3 px-4 text-center text-gray-700 hover:bg-blue-300 hover:border-l-2 hover:border-blue-500 transition-all duration-300 flex items-center gap-2 cursor-pointer ${activePath === item.path
                            ? "bg-blue-200 border-blue-500 border-l-2"
                            : "border-l-2 border-transparent"}`} >
                        {item.icon}
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Sidebar;
