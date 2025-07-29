import * as React from "react";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  ...props
}) => {
  return (
    <div className={`relative w-full max-w-3xl mx-auto ${className}`}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-5 pr-14 py-4 text-lg bg-white border border-gray-200 rounded-2xl shadow focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:bg-gray-50 font-sans text-gray-900 placeholder:text-gray-400 outline-none"
        {...props}
      />
      <span className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
        {/* Heroicons MagnifyingGlassIcon SVG */}
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
    </div>
  );
};
