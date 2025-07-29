// Design System Tokens for SkyBox
// This file defines consistent design tokens for the entire application

export const colors = {
  // Primary Colors
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#3DA9FC", // Main brand color
    700: "#0077C2", // Darker variant
    800: "#1e40af",
    900: "#1e3a8a",
  },

  // Secondary Colors
  secondary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },

  // Success Colors
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#29C393", // Brand success color
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  // Warning Colors
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  // Error Colors
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  // Neutral Colors
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },

  // Text Colors
  text: {
    primary: "#1C1C1C",
    secondary: "#64748b",
    tertiary: "#94a3b8",
    inverse: "#ffffff",
    muted: "#6b7280",
  },

  // Background Colors
  background: {
    primary: "#ffffff",
    secondary: "#f8fafc",
    tertiary: "#f1f5f9",
    accent: "#eff6ff",
    overlay: "rgba(0, 0, 0, 0.5)",
  },

  // Border Colors
  border: {
    light: "#e2e8f0",
    medium: "#cbd5e1",
    dark: "#94a3b8",
    focus: "#3DA9FC",
  },
} as const;

export const spacing = {
  // Base spacing scale (4px grid)
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
  "4xl": "6rem", // 96px

  // Component-specific spacing
  button: {
    padding: {
      sm: "0.5rem 1rem",
      md: "0.75rem 1.5rem",
      lg: "1rem 2rem",
    },
    height: {
      sm: "2.25rem",
      md: "2.75rem",
      lg: "3.5rem",
    },
  },

  card: {
    padding: {
      sm: "1rem",
      md: "1.5rem",
      lg: "2rem",
    },
    gap: "1rem",
  },

  input: {
    padding: "0.75rem 1rem",
    height: "2.75rem",
  },
} as const;

export const typography = {
  // Font families
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: "JetBrains Mono, Consolas, Monaco, monospace",
  },

  // Font sizes
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
    "6xl": "3.75rem", // 60px
  },

  // Font weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },

  // Line heights
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
} as const;

export const borderRadius = {
  none: "0",
  sm: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  none: "none",
} as const;

export const transitions = {
  duration: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
  },
  easing: {
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const zIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Component-specific design tokens
export const components = {
  button: {
    variants: {
      primary: {
        backgroundColor: colors.primary[600],
        color: colors.text.inverse,
        borderColor: "transparent",
        hover: {
          backgroundColor: colors.primary[700],
          transform: "translateY(-1px)",
          boxShadow: shadows.lg,
        },
      },
      secondary: {
        backgroundColor: colors.background.secondary,
        color: colors.text.primary,
        borderColor: colors.border.light,
        hover: {
          backgroundColor: colors.background.tertiary,
          borderColor: colors.border.medium,
        },
      },
      outline: {
        backgroundColor: "transparent",
        color: colors.text.primary,
        borderColor: colors.border.medium,
        hover: {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.dark,
        },
      },
      ghost: {
        backgroundColor: "transparent",
        color: colors.text.primary,
        borderColor: "transparent",
        hover: {
          backgroundColor: colors.background.secondary,
        },
      },
    },
    sizes: {
      sm: {
        padding: spacing.button.padding.sm,
        height: spacing.button.height.sm,
        fontSize: typography.fontSize.sm,
      },
      md: {
        padding: spacing.button.padding.md,
        height: spacing.button.height.md,
        fontSize: typography.fontSize.base,
      },
      lg: {
        padding: spacing.button.padding.lg,
        height: spacing.button.height.lg,
        fontSize: typography.fontSize.lg,
      },
    },
  },

  card: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.light,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.sm,
    padding: spacing.card.padding.md,
    hover: {
      boxShadow: shadows.md,
      transform: "translateY(-2px)",
    },
  },

  input: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.xl,
    padding: spacing.input.padding,
    height: spacing.input.height,
    fontSize: typography.fontSize.base,
    focus: {
      borderColor: colors.border.focus,
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    },
  },
} as const;

// Utility functions for consistent styling
export const createTransition = (
  properties: string[] = ["all"],
  duration = transitions.duration.normal,
  easing = transitions.easing.ease
) => {
  return properties.map((prop) => `${prop} ${duration} ${easing}`).join(", ");
};

export const createFocusRing = (color = colors.primary[600]) => {
  return `0 0 0 3px ${color}40`;
};

export const createHoverState = (
  transform = "translateY(-1px)",
  shadow = shadows.md
) => {
  return {
    transform,
    boxShadow: shadow,
  };
};

// Responsive design utilities
export const responsive = {
  mobile: `@media (max-width: ${breakpoints.md})`,
  tablet: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  desktop: `@media (min-width: ${breakpoints.lg})`,
  wide: `@media (min-width: ${breakpoints.xl})`,
} as const;

// Export all design tokens
export const designTokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  components,
  responsive,
} as const;
