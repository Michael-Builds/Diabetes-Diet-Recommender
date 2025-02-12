import { FC } from "react";
import clsx from "clsx";

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  disabled?: boolean;
}

const Toggle: FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  className,
  width = "w-12",
  height = "h-6",
  borderRadius = "rounded-full",
  activeColor = "bg-green-500",
  inactiveColor = "bg-gray-300",
  thumbColor = "bg-white",
  disabled = false,
}) => {
  return (
    <div className="flex items-center space-x-3">
      {label && <span className="text-sm font-medium text-gray-800">{label}</span>}

      <button
        className={clsx(
          "relative flex items-center  transition-all duration-300 ease-in-out cursor-pointer",
          width,
          height,
          borderRadius,
          checked ? activeColor : inactiveColor,
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <div
          className={clsx(
            "absolute transition-all duration-300 ease-in-out transform",
            thumbColor,
            "w-5 h-5",
            borderRadius,
            checked ? "translate-x-6" : "translate-x-1"
          )}
        ></div>
      </button>
    </div>
  );
};

export default Toggle;
