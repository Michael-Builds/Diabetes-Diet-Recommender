import clsx from "clsx";
import { FC, ReactNode } from "react";
import Spinner from "./Spinner";

interface ButtonProps {
  text: string;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void; 
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
        "flex items-center font-geist justify-center  transition-all duration-300 ease-in-out px-4",
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
        <Spinner height="18px" width="18px" borderWidth="2px" />
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
