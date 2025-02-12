import { FC } from "react";
import clsx from "clsx";

interface RadioButtonProps {
    label?: string;
    options: { label: string; value: string }[];
    selected: string;
    onChange: (value: string) => void;
    className?: string;
    error?: string;
    width?: string;
    textColor?: string;
    radioColor?: string;
    errorColor?: string;
    showErrorBelow?: boolean;
}

const RadioButton: FC<RadioButtonProps> = ({
    label,
    options,
    selected,
    onChange,
    className,
    error,
    width = "w-full",
    textColor = "text-gray-800",
    radioColor = "text-blue-600",
    errorColor = "text-red-500",
    showErrorBelow = true,
}) => {
    return (
        <div className={clsx("w-full font-geist", className)}>
            {label && <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>}

            <div className={clsx("flex flex-wrap gap-4 items-center", width)}>
                {options.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="radio-group"
                            value={option.value}
                            checked={selected === option.value}
                            onChange={() => onChange(option.value)}
                            className={clsx(
                                "w-4 h-4 cursor-pointer focus:none focus:ring-offset-1",
                                radioColor
                            )}
                        />
                        <span className={clsx("text-sm font-medium", textColor)}>{option.label}</span>
                    </label>
                ))}
            </div>

            {error && showErrorBelow &&  !selected && <p className={clsx("mt-1 text-sm font-normal", errorColor)}>{error}</p>}
        </div>
    );
};

export default RadioButton;
