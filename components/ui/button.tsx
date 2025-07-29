import * as React from "react";
import { cn } from "@/lib/utils";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
} from "@/lib/design-system";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center whitespace-nowrap 
      font-medium transition-all duration-200 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
      disabled:pointer-events-none disabled:opacity-50 
      active:scale-95 rounded-xl
      font-sans
    `;

    const variantStyles = {
      default: `
        bg-[${colors.primary[600]}] text-[${colors.text.inverse}] 
        hover:bg-[${colors.primary[700]}] 
        shadow-md hover:shadow-lg
        focus-visible:ring-[${colors.primary[600]}]
      `,
      destructive: `
        bg-[${colors.error[600]}] text-[${colors.text.inverse}] 
        hover:bg-[${colors.error[700]}] 
        shadow-md hover:shadow-lg
        focus-visible:ring-[${colors.error[600]}]
      `,
      outline: `
        border border-[${colors.border.medium}] bg-[${colors.background.primary}] 
        text-[${colors.text.primary}] 
        hover:bg-[${colors.background.secondary}] hover:border-[${colors.border.dark}] 
        shadow-sm
        focus-visible:ring-[${colors.primary[600]}]
      `,
      secondary: `
        bg-[${colors.background.secondary}] text-[${colors.text.primary}] 
        hover:bg-[${colors.background.tertiary}] 
        shadow-sm
        focus-visible:ring-[${colors.primary[600]}]
      `,
      ghost: `
        hover:bg-[${colors.background.secondary}] text-[${colors.text.primary}]
        focus-visible:ring-[${colors.primary[600]}]
      `,
      link: `
        text-[${colors.primary[600]}] underline-offset-4 hover:underline
        focus-visible:ring-[${colors.primary[600]}]
      `,
    };

    const sizeStyles = {
      default: `h-12 px-6 py-3 text-[${typography.fontSize.base}]`,
      sm: `h-9 px-4 py-2 text-[${typography.fontSize.sm}]`,
      lg: `h-14 px-8 py-4 text-[${typography.fontSize.lg}]`,
      icon: `h-10 w-10`,
    };

    return (
      <button
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
