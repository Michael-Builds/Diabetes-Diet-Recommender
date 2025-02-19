import clsx from "clsx";
import { X } from "lucide-react";
import { FC, useEffect, useRef, useState } from "react";

interface DropdownProps {
    label?: string;
    selected: string[];
    onChange: (value: string[]) => void;
    className?: string;
    error?: string;
    showErrorBelow?: boolean;
    width?: string;
    height?: string;
    borderRadius?: string;
    placeholder?: string;
}

const CustomDropdown: FC<DropdownProps> = ({
    label,
    selected,
    onChange,
    className,
    error,
    showErrorBelow = true,
    width = "w-full",
    height = "h-10",
    borderRadius = "rounded-md",
    placeholder = "Type and press Enter...",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddItem = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && inputValue.trim() !== "") {
            event.preventDefault();
            if (!selected.includes(inputValue.trim())) {
                onChange([...selected, inputValue.trim()]);
            }
            setInputValue("");
        }
    };

    const handleRemoveItem = (item: string) => {
        onChange(selected.filter((value) => value !== item));
    };

    return (
        <div className="w-full font-geist relative" ref={dropdownRef}>
            {label && <label className="block text-sm font-medium text-gray-800">{label}</label>}

            <div
                className={clsx(
                    "relative mt-1 border bg-white flex items-center cursor-pointer px-2 py-1 flex-wrap gap-2",
                    error && showErrorBelow ? "border-red-500" : "border-gray-400",
                    width,
                    height,
                    borderRadius,
                    className
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Selected Items */}
                <div className="flex flex-wrap gap-1 items-center">
                    {selected.map((item) => (
                        <div key={item} className="bg-blue-500 text-white px-2 py-1 rounded flex items-center">
                            {item}
                            <X
                                size={14}
                                className="ml-1 cursor-pointer"
                                onClick={() => handleRemoveItem(item)}
                            />
                        </div>
                    ))}
                </div>

                {/* Input Field */}
                <input
                    type="text"
                    className="flex-1 bg-transparent text-sm outline-none text-gray-600  py-1"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleAddItem}
                />
            </div>

            {error && showErrorBelow && (
                <p className="mt-1 text-sm font-normal text-red-500">{error}</p>
            )}
        </div>
    );
};

export default CustomDropdown;
