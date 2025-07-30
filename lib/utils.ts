import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseStringify = (value:unknown) => {
  return  JSON.parse(JSON.stringify(value));
}

/**
 * Get the correct base URL for the application
 * This ensures email verification links work in both development and production
 */
export const getBaseUrl = () => {
  // In production, use the environment variable or try to detect from headers
  if (process.env.NODE_ENV === 'production') {
    // First try the environment variable
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // Fallback: try to get from Vercel environment
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // If neither is available, this will need to be set manually
    return 'https://your-domain.vercel.app'; // This should be updated in Vercel env vars
  }
  
  // In development, use localhost
  return 'http://localhost:3000';
};