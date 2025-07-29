import React from "react";
import { cn } from "@/lib/utils";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  transitions,
} from "@/lib/design-system";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      variant = "default",
      padding = "md",
      hover = false,
      as: Component = "div",
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      bg-[${colors.background.primary}] 
      rounded-[${borderRadius.xl}]
      transition-all duration-200
    `;

    const variantStyles = {
      default: `shadow-[${shadows.sm}] border border-[${colors.border.light}]`,
      elevated: `shadow-[${shadows.lg}] border border-[${colors.border.light}]`,
      outlined: `border-2 border-[${colors.border.medium}]`,
      ghost: `bg-transparent`,
    };

    const paddingStyles = {
      none: "",
      sm: `p-[${spacing.sm}]`,
      md: `p-[${spacing.md}]`,
      lg: `p-[${spacing.lg}]`,
    };

    const hoverStyles = hover
      ? `
      hover:shadow-[${shadows.md}] 
      hover:transform hover:-translate-y-1 
      hover:border-[${colors.border.medium}]
    `
      : "";

    return (
      <Component
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          hoverStyles,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(`pb-[${spacing.md}]`, className)} {...props}>
        {children}
      </div>
    );
  }
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(`space-y-[${spacing.md}]`, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          `pt-[${spacing.md}] border-t border-[${colors.border.light}]`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";
CardContent.displayName = "CardContent";
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardContent, CardFooter };
