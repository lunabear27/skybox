import * as React from "react";
import { cn } from "@/lib/utils";
import {
  colors,
  typography,
  borderRadius,
  transitions,
} from "@/lib/design-system";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        `bg-[${colors.background.primary}] border border-[${colors.border.medium}] 
         text-[${colors.text.primary}] placeholder:text-[${colors.text.tertiary}] 
         rounded-xl focus:ring-2 focus:ring-[${colors.primary[600]}] 
         focus:border-[${colors.primary[600]}] 
         transition-colors duration-200 font-sans text-[${typography.fontSize.base}]
         px-3 py-2 h-11
         focus:outline-none focus:ring-offset-2
         disabled:opacity-50 disabled:cursor-not-allowed`,
        className
      )}
      {...props}
    />
  );
}

// SearchInput with right-aligned search icon inside, perfectly centered
function SearchInput({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"input"> & { containerClassName?: string }) {
  return (
    <div
      className={cn("relative w-full max-w-6xl mx-auto", containerClassName)}
    >
      <Input
        {...props}
        className={cn(
          "pl-4 pr-12 py-4 text-lg bg-white border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:bg-gray-50",
          className
        )}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
        <svg
          className="text-gray-400 w-6 h-6"
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
}

export { Input, SearchInput };
