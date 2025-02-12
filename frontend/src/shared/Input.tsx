import { FC, ChangeEvent, InputHTMLAttributes, useState, ReactNode } from "react";
import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showErrorBelow?: boolean;
  icon?: ReactNode;
  className?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  width?: string;
  height?: string;
  borderRadius?: string;
}

const Input: FC<InputProps> = ({
  label,
  error,
  showErrorBelow = true,
  icon,
  className,
  value,
  onChange,
  type,
  width = "w-full",
  height = "h-10",
  borderRadius = "rounded-md",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";

  return (
    <div className="w-full font-geist">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-800">
          {label}
        </label>
      )}

      <div
        className={clsx(
          "relative mt-1 flex items-center border bg-white",
          error && showErrorBelow ? "border-red-500" : "border-gray-400",
          borderRadius,
          className
        )}
      >
        {icon && <div className="absolute left-3 text-gray-400">{icon}</div>}

        <input
          className={clsx(
            "px-3 font-normal rounded-md outline-none transition-all duration-200",
            icon ? "pl-10" : "pl-3",
            "text-gray-600 bg-transparent",
            error && !showErrorBelow ? "border-red-500" : "border-gray-300",
            props.disabled && "cursor-not-allowed bg-gray-200",
            width,
            height
          )}
          type={isPasswordField && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          {...props}
        />

        {isPasswordField && (
          <button
            type="button"
            className="absolute right-3 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {error && showErrorBelow && <p className="mt-1 font-normal text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
