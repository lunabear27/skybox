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
    console.log('🔍 getBaseUrl - Production environment detected');
    console.log('🔍 NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('🔍 VERCEL_URL:', process.env.VERCEL_URL);
    
    // First try the environment variable
    if (process.env.NEXT_PUBLIC_APP_URL) {
      console.log('✅ Using NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // Fallback: try to get from Vercel environment
    if (process.env.VERCEL_URL) {
      const vercelUrl = `https://${process.env.VERCEL_URL}`;
      console.log('✅ Using VERCEL_URL:', vercelUrl);
      return vercelUrl;
    }
    
    // If neither is available, use the actual deployed domain
    console.log('✅ Using hardcoded domain: https://skybox-pi.vercel.app');
    return 'https://skybox-pi.vercel.app';
  }
  
  // In development, use localhost
  console.log('✅ Development environment - using localhost:3000');
  return 'http://localhost:3000';
};