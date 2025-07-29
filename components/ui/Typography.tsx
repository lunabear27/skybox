import React from "react";
import { cn } from "@/lib/utils";
import { colors, typography } from "@/lib/design-system";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  color?: "primary" | "secondary" | "tertiary" | "muted" | "inverse";
  weight?: "normal" | "medium" | "semibold" | "bold";
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      children,
      className,
      as: Component = "p",
      color = "primary",
      weight = "normal",
      ...props
    },
    ref
  ) => {
    const colorClasses = {
      primary: `text-[${colors.text.primary}]`,
      secondary: `text-[${colors.text.secondary}]`,
      tertiary: `text-[${colors.text.tertiary}]`,
      muted: `text-[${colors.text.muted}]`,
      inverse: `text-[${colors.text.inverse}]`,
    };

    const weightClasses = {
      normal: `font-[${typography.fontWeight.normal}]`,
      medium: `font-[${typography.fontWeight.medium}]`,
      semibold: `font-[${typography.fontWeight.semibold}]`,
      bold: `font-[${typography.fontWeight.bold}]`,
    };

    return (
      <Component
        ref={ref}
        className={cn(
          `font-sans leading-[${typography.lineHeight.normal}]`,
          colorClasses[color],
          weightClasses[weight],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

interface HeadingProps extends TypographyProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    {
      children,
      className,
      level = 1,
      color = "primary",
      weight = "semibold",
      ...props
    },
    ref
  ) => {
    const levelClasses = {
      1: `text-[${typography.fontSize["5xl"]}] leading-[${typography.lineHeight.tight}]`,
      2: `text-[${typography.fontSize["4xl"]}] leading-[${typography.lineHeight.tight}]`,
      3: `text-[${typography.fontSize["3xl"]}] leading-[${typography.lineHeight.tight}]`,
      4: `text-[${typography.fontSize["2xl"]}] leading-[${typography.lineHeight.tight}]`,
      5: `text-[${typography.fontSize.xl}] leading-[${typography.lineHeight.tight}]`,
      6: `text-[${typography.fontSize.lg}] leading-[${typography.lineHeight.tight}]`,
    };

    const Component = `h${level}` as keyof JSX.IntrinsicElements;

    return (
      <Typography
        ref={ref}
        as={Component}
        className={cn(levelClasses[level], className)}
        color={color}
        weight={weight}
        {...props}
      >
        {children}
      </Typography>
    );
  }
);

interface TextProps extends TypographyProps {
  size?: "xs" | "sm" | "base" | "lg" | "xl";
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  (
    {
      children,
      className,
      size = "base",
      color = "primary",
      weight = "normal",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: `text-[${typography.fontSize.xs}]`,
      sm: `text-[${typography.fontSize.sm}]`,
      base: `text-[${typography.fontSize.base}]`,
      lg: `text-[${typography.fontSize.lg}]`,
      xl: `text-[${typography.fontSize.xl}]`,
    };

    return (
      <Typography
        ref={ref}
        as="p"
        className={cn(sizeClasses[size], className)}
        color={color}
        weight={weight}
        {...props}
      >
        {children}
      </Typography>
    );
  }
);

interface LabelProps extends TypographyProps {
  size?: "sm" | "base" | "lg";
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      children,
      className,
      size = "base",
      color = "primary",
      weight = "medium",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: `text-[${typography.fontSize.sm}]`,
      base: `text-[${typography.fontSize.base}]`,
      lg: `text-[${typography.fontSize.lg}]`,
    };

    return (
      <Typography
        ref={ref}
        as="label"
        className={cn(sizeClasses[size], className)}
        color={color}
        weight={weight}
        {...props}
      >
        {children}
      </Typography>
    );
  }
);

Typography.displayName = "Typography";
Heading.displayName = "Heading";
Text.displayName = "Text";
Label.displayName = "Label";

export { Typography, Heading, Text, Label };
