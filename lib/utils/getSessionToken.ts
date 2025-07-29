"use client";

// Get session token from cookies (client-side)
export const getSessionToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const sessionCookie = cookies.find(cookie => 
    cookie.trim().startsWith('appwrite_session=')
  );
  
  if (sessionCookie) {
    const token = sessionCookie.split('=')[1];
    
    // Check if this is a custom session (starts with 'custom_')
    if (token.startsWith('custom_')) {
      console.log("🔍 Found custom session token");
      return token;
    } else {
      console.log("🔍 Found regular Appwrite session token");
      return token;
    }
  }
  
  return null;
};