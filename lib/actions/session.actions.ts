"use server";

import { cookies } from "next/headers";
import { Account, Client } from "node-appwrite";
import { appwriteConfig } from "../appwrite/config";

export const getCurrentUser = async () => {
  try {
    const session = (await cookies()).get('appwrite_session');
    if (!session || !session.value) {
      throw new Error('No session found');
    }
    
    // Check if this is a custom session (database-only auth)
    if (session.value.startsWith('custom_')) {
      const userData = (await cookies()).get('user_data');
      if (!userData || !userData.value) {
        throw new Error('No user data found for custom session');
      }
      
      const user = JSON.parse(userData.value);
      
      // Try to get fresh verification status from Appwrite
      try {
        const { createAdminClient } = await import("../appwrite");
        const { account: adminAccount } = await createAdminClient();
        
        // Create a temporary session to check verification status
        const tempSession = await adminAccount.createEmailPasswordSession(user.email, user.password);
        
        const client = new Client()
          .setEndpoint(appwriteConfig.endpointUrl)
          .setProject(appwriteConfig.projectId)
          .setSession(tempSession.secret);
        
        const userAccount = new Account(client);
        const freshUserData = await userAccount.get();
        
        // Delete the temporary session
        await adminAccount.deleteSession(tempSession.$id);
        
        // Update the cached user data with fresh verification status
        const updatedUserData = {
          ...user,
          emailVerification: freshUserData.emailVerification
        };
        
        // Update the cookie with fresh data
        (await cookies()).set("user_data", JSON.stringify(updatedUserData), {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        });
        
        return {
          $id: user.$id,
          email: user.email,
          name: user.name || user.fullName,
          $createdAt: user.$createdAt,
          emailVerification: freshUserData.emailVerification
        };
      } catch (error) {
        // If we can't get fresh data, fall back to cached data
        console.log("Could not fetch fresh verification status, using cached data");
        return {
          $id: user.$id,
          email: user.email,
          name: user.name || user.fullName,
          $createdAt: user.$createdAt,
          emailVerification: user.emailVerification || false
        };
      }
    }
    
    // For standard Appwrite sessions
    const client = new Client()
      .setEndpoint(appwriteConfig.endpointUrl)
      .setProject(appwriteConfig.projectId)
      .setSession(session.value);

    const account = new Account(client);
    const userData = await account.get();
    
    return {
      $id: userData.$id,
      email: userData.email,
      name: userData.name,
      $createdAt: userData.$createdAt,
      emailVerification: userData.emailVerification
    };
  } catch (error) {
    throw error;
  }
};

export const getSessionInfo = async () => {
  try {
    const session = (await cookies()).get('appwrite_session');
    if (!session || !session.value) {
      return { hasSession: false, sessionType: null };
    }
    
    const isCustomSession = session.value.startsWith('custom_');
    
    return {
      hasSession: true,
      sessionType: isCustomSession ? 'custom' : 'appwrite',
      sessionExists: true
    };
  } catch (error) {
    return { hasSession: false, sessionType: null };
  }
};

export const deleteCurrentSession = async () => {
  try {
    const session = (await cookies()).get('appwrite_session');
    if (!session || !session.value) {
      throw new Error('No session found');
    }
    
    // Clear cookies first
    (await cookies()).delete("appwrite_session");
    (await cookies()).delete("user_data");
    
    // Only try to delete Appwrite session if it's not a custom session
    if (!session.value.startsWith('custom_')) {
      try {
        const client = new Client()
          .setEndpoint(appwriteConfig.endpointUrl)
          .setProject(appwriteConfig.projectId)
          .setSession(session.value);

        const account = new Account(client);
        await account.deleteSession('current');
      } catch (error) {
        // Ignore errors when deleting Appwrite session
        console.log("Error deleting Appwrite session:", error);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("deleteCurrentSession error:", error);
    throw error;
  }
};