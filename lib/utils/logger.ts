// Logger utility for managing console logs based on environment
const isDevelopment = process.env.NODE_ENV === "development";
const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

export const logger = {
  // Info logs - always show in development, never in production
  info: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.log(...args);
    }
  },

  // Debug logs - only show when debug mode is enabled
  debug: (...args: any[]) => {
    if (isDebugMode) {
      console.log("🔍", ...args);
    }
  },

  // Success logs - always show in development, never in production
  success: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.log("✅", ...args);
    }
  },

  // Warning logs - always show
  warn: (...args: any[]) => {
    console.warn("⚠️", ...args);
  },

  // Error logs - always show
  error: (...args: any[]) => {
    console.error("❌", ...args);
  },

  // File operation logs - only in development
  file: (...args: any[]) => {
    if (isDevelopment) {
      console.log("📁", ...args);
    }
  },

  // Storage logs - only in development
  storage: (...args: any[]) => {
    if (isDevelopment) {
      console.log("📊", ...args);
    }
  },

  // Action logs - only in development
  action: (...args: any[]) => {
    if (isDevelopment) {
      console.log("🚀", ...args);
    }
  },

  // Loading logs - only in development
  loading: (...args: any[]) => {
    if (isDevelopment) {
      console.log("🔄", ...args);
    }
  },
};

// Environment check utility
export const shouldLog = {
  development: () => isDevelopment,
  debug: () => isDebugMode,
  production: () => !isDevelopment && !isDebugMode,
};
