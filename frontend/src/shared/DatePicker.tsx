import { FC } from "react";
import clsx from "clsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

interface DatePickerProps {
    label?: string;
    selectedDate: Date | null;
    onChange: (date: Date | null) => void;
    className?: string;
    error?: string;
    showErrorBelow?: boolean;
    width?: string;
    height?: string;
    borderRadius?: string;
}

const CustomDatePicker: FC<DatePickerProps> = ({
    label,
    selectedDate,
    onChange,
    className,
    error,
    showErrorBelow = true,
    width = "w-full",
    height = "h-10",
    borderRadius = "rounded-md",
}) => {
    return (
        <div className="w-full font-geist">
            {label && <label className="block text-sm font-medium text-gray-800">{label}</label>}

            <div
                className={clsx(
                    "relative mt-1 flex items-center border bg-white",
                    error && showErrorBelow ? "border-red-500" : "border-gray-400",
                    className,
                    width,
                    borderRadius,
                    height
                )}
            >
                <DatePicker
                    selected={selectedDate}
                    onChange={onChange}
                    dateFormat="yyyy-MM-dd"
                    className={clsx(
                        "px-3 font-normal rounded-md outline-none bg-transparent text-gray-600 placeholder-gray-400",
                        width,
                        height
                    )}
                    placeholderText="Select a date"
                />

                <div className="absolute right-3 text-gray-500">
                    <Calendar className="w-5 h-5" />
                </div>
            </div>

            {error && showErrorBelow && <p className="mt-1 text-sm font-normal text-red-500">{error}</p>}
        </div>
    );
};

export default CustomDatePicker;
