import { FC, useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  label?: string;
  options: { label: string; value: string }[];
  selected: string | string[] | null;
  onChange: (value: string | string[]) => void;
  className?: string;
  error?: string;
  showErrorBelow?: boolean;
  width?: string;
  height?: string;
  borderRadius?: string;
  placeholder?: string;
  isSearchable?: boolean;
  isMultiSelect?: boolean;
}

const Dropdown: FC<DropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  className,
  error,
  showErrorBelow = true,
  width = "w-full",
  height = "h-10",
  borderRadius = "rounded-md",
  placeholder = "Select an option",
  isSearchable = false,
  isMultiSelect = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState("w-full");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (dropdownRef.current) {
      setDropdownWidth(`${dropdownRef.current.offsetWidth}px`);
    }
  }, [isOpen]);

  const handleSelect = (value: string) => {
    if (isMultiSelect) {
      const updatedSelection = Array.isArray(selected)
        ? selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value]
        : [value];

      onChange(updatedSelection);
    } else {
      onChange(value);
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full font-geist relative" ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-gray-800">{label}</label>}

      {/* Input Field */}
      <div
        className={clsx(
          "relative mt-1 text-sm border bg-white flex items-center cursor-pointer",
          error && showErrorBelow ? "border-red-500" : "border-gray-400",
          width,
          height,
          borderRadius,
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-full flex font-normal items-center justify-between px-3 py-2">
          {isMultiSelect ? (
            <span className="truncate text-gray-600">
              {Array.isArray(selected) && selected.length > 0
                ? selected.join(", ")
                : placeholder}
            </span>
          ) : (
            <span className="truncate text-gray-600">
              {selected ? options.find((opt) => opt.value === selected)?.label : placeholder}
            </span>
          )}
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Dropdown List (Absolute Positioned) */}
      {isOpen && (
        <div
          ref={dropdownListRef}
          style={{ width: dropdownWidth }}
          className={clsx(
            "absolute z-50 text-sm mt-1 bg-white shadow-lg border rounded-md overflow-hidden left-0",
            borderRadius
          )}
        >
          {isSearchable && (
            <input
              type="text"
              placeholder="Search..."
              className="w-full font-normal p-2 border-b outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}

          <ul className="max-h-48 font-normal overflow-y-auto">
            {options
              .filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((opt) => (
                <li
                  key={opt.value}
                  className={clsx(
                    "px-4 py-2 cursor-pointer hover:bg-gray-200 flex items-center",
                    (isMultiSelect
                      ? Array.isArray(selected) && selected.includes(opt.value)
                      : selected === opt.value) && "bg-blue-100"
                  )}
                  onClick={() => handleSelect(opt.value)}
                >
                  {isMultiSelect && (
                    <input
                      type="checkbox"
                      checked={Array.isArray(selected) && selected.includes(opt.value)}
                      className="mr-2"
                      readOnly
                    />
                  )}
                  {opt.label}
                </li>
              ))}
          </ul>
        </div>
      )}

      {error && showErrorBelow && (
        <p className="mt-1 text-sm font-normal text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Dropdown;
