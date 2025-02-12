import clsx from "clsx";
import { FC, ReactNode } from "react";

interface ButtonProps {
  text: string;
  onClick: () => void;
  width?: string;
  height?: string;
  borderRadius?: string;
  bgColor?: string;
  textColor?: string;
  hover?: boolean;
  hoverColor?: string;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  animate?: boolean;
  className?: string;
}

const Button: FC<ButtonProps> = ({
  text,
  onClick,
  width = "w-auto",
  height = "h-10",
  borderRadius = "rounded-md",
  bgColor = "bg-blue-600",
  textColor = "text-white",
  hover = true,
  hoverColor = "hover:bg-blue-700",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon,
  animate = false,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={clsx(
        "flex items-center font-geist justify-center font-medium transition-all duration-300 ease-in-out px-4",
        width,
        height,
        borderRadius,
        bgColor,
        textColor,
        fullWidth && "w-full",
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        hover && hoverColor,
        animate && "transform transition-transform hover:scale-105",
        className
      )}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
          <span>Loading...</span>
        </div>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {text}
        </>
      )}
    </button>
  );
};

export default Button;
