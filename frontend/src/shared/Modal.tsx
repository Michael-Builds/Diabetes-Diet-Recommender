import clsx from "clsx";
import Lottie from "lottie-react";
import { X } from "lucide-react";
import { FC } from "react";
import errorAnimation from "../../public/assets/modal/error.json";
import warningAnimation from "../../public/assets/modal/warning.json";
import successAnimation from "../../public/assets/modal/success.json";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  showConfirm?: boolean;
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "success",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = true,
  showConfirm = true,
  width = "w-96",
  height = "h-auto",
  borderRadius = "rounded-md",
  className,
}) => {
  if (!isOpen) return null;

  // ✅ Ensure correct animation shows
  const animationData =
    type === "success" ? successAnimation : type === "error" ? errorAnimation : warningAnimation;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className={clsx(
          "relative bg-white p-6 shadow-lg flex flex-col items-center",
          width,
          height,
          borderRadius,
          className
        )}
      >

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>


        <Lottie animationData={animationData} className="w-24 h-24 mb-4" />


        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-gray-600 font-normal text-sm text-center mt-2">{message}</p>


        <div className="mt-4 flex space-x-4">
          {showCancel && (
            <button
              onClick={onCancel || onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              {cancelText}
            </button>
          )}
          {showConfirm && (
            <button
              onClick={onConfirm || onClose}
              className={clsx(
                "px-10 py-2 font-normal text-white rounded-sm",
                type === "success"
                  ? "bg-green-500 hover:bg-green-600"
                  : type === "error"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-yellow-500 hover:bg-yellow-600"
              )}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
