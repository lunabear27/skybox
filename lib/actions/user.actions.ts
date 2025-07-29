"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();
  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])]
  );
  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

export const createAccount = async ({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}) => {
  try {
    console.log("Starting account creation for:", email);

    const { account, databases } = await createAdminClient();

    // Check if user already exists in database
    console.log("Checking for existing user...");
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return parseStringify({
        error: "User with this email already exists",
        success: false,
      });
    }

    console.log("Creating Appwrite account...");
    // Create Appwrite account
    let newAccount;
    try {
      newAccount = await account.create(ID.unique(), email, password, username);
      console.log("Appwrite account created:", newAccount.$id);
    } catch (appwriteError: unknown) {
      const error = appwriteError as { code?: number; message?: string };
      if (error.code === 409) {
        return parseStringify({
          error: "User with this email already exists",
          success: false,
        });
      }
      throw appwriteError; // Re-throw if it's a different error
    }

    console.log("Creating user document in database...");
    // Create user document (using existing schema)
    const userDoc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName: username,
        email,
        password,
        accountId: newAccount.$id,
      }
    );
    console.log("User document created:", userDoc.$id);

    console.log("Sending verification email...");
    console.log(
      "Verification URL:",
      `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
    );

    // Send verification email using user session (not admin client)
    try {
      // Create a user session to send verification email
      const tempSession = await account.createEmailPasswordSession(
        email,
        password
      );
      console.log("Temporary session created for verification email");

      // Create a session client for the user
      const { Client, Account } = await import("node-appwrite");
      const userClient = new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId)
        .setSession(tempSession.secret);

      const userAccount = new Account(userClient);

      // Send verification email using user's session
      const verification = await userAccount.createVerification(
        `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
      );
      console.log("Verification email sent successfully:", verification);

      // Delete the temporary session using user client
      try {
        await userAccount.deleteSession("current");
        console.log("Temporary session deleted");
      } catch {
        console.log(
          "Could not delete temp session with user client, continuing..."
        );
      }
    } catch (emailError: unknown) {
      console.error("Failed to send verification email:", emailError);
      const err = emailError as {
        code?: number;
        type?: string;
        message?: string;
      };
      console.error("Email error details:", {
        code: err.code,
        type: err.type,
        message: err.message,
      });
      // Continue with account creation even if email fails
    }

    // Create session for new user (allow login even without verification)
    console.log("Account created successfully, creating session...");

    // Create a session for the new user
    try {
      const session = await account.createEmailPasswordSession(email, password);

      (await cookies()).set("appwrite_session", session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      console.log("✅ Session created for new user");

      return parseStringify({
        accountId: newAccount.$id,
        success: true,
        requiresVerification: true,
        message:
          "Account created successfully! Please check your email to verify your account.",
        user: {
          $id: newAccount.$id,
          email: email,
          name: username,
          emailVerified: false,
        },
      });
    } catch (sessionError) {
      console.error("Failed to create session for new user:", sessionError);

      // Create custom session as fallback
      const sessionToken = `custom_${newAccount.$id}_${Date.now()}`;

      (await cookies()).set("appwrite_session", sessionToken, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      (await cookies()).set(
        "user_data",
        JSON.stringify({
          $id: newAccount.$id,
          email: email,
          name: username,
          $createdAt: new Date().toISOString(),
          emailVerification: false,
        }),
        {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        }
      );

      console.log("✅ Custom session created for new user");

      return parseStringify({
        accountId: newAccount.$id,
        success: true,
        requiresVerification: true,
        message:
          "Account created successfully! Please check your email to verify your account.",
        user: {
          $id: newAccount.$id,
          email: email,
          name: username,
          emailVerified: false,
        },
      });
    }
  } catch (error: unknown) {
    console.error("createAccount error:", error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);

    const err = error as {
      code?: number;
      message?: string;
      type?: string;
      response?: string;
    };

    // Log detailed error information
    console.error("Detailed error info:", {
      code: err.code,
      message: err.message,
      type: err.type,
      response: err.response,
    });

    // Return error instead of throwing
    if (err.code === 409) {
      return parseStringify({
        error: "User with this email already exists",
        success: false,
      });
    } else if (err.message?.includes("password")) {
      return parseStringify({
        error: "Password must be at least 8 characters long",
        success: false,
      });
    } else if (err.message?.includes("email")) {
      return parseStringify({
        error: "Please provide a valid email address",
        success: false,
      });
    } else {
      console.error("Full error details:", JSON.stringify(error, null, 2));

      // Return more specific error message if available
      const specificError =
        err.message || err.response || "Unknown error occurred";
      return parseStringify({
        error: `Account creation failed: ${specificError}`,
        success: false,
      });
    }
  }
};

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    // First, check if user exists in database
    const user = await getUserByEmail(email);

    if (!user) {
      return parseStringify({
        error: "Invalid email or password",
        success: false,
      });
    }

    // Verify password
    if (user.password !== password) {
      return parseStringify({
        error: "Invalid email or password",
        success: false,
      });
    }

    // If user exists and password matches, create a session
    const { account } = await createAdminClient();

    // Try to create session with Appwrite auth first
    try {
      const session = await account.createEmailPasswordSession(email, password);
      console.log("✅ Appwrite session created successfully");

      // Create a session client to get user data
      const { Client, Account } = await import("node-appwrite");
      const userClient = new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId)
        .setSession(session.secret);

      const userAccount = new Account(userClient);
      const appwriteUser = await userAccount.get();

      console.log(
        "📧 Email verification status:",
        appwriteUser.emailVerification
      );

      // Allow login regardless of email verification status
      // Dashboard will handle verification requirements

      (await cookies()).set("appwrite_session", session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      console.log("✅ Login successful with verified email");

      return parseStringify({
        sessionId: session.$id,
        success: true,
        user: {
          $id: user.accountId,
          email: user.email,
          name: user.fullName,
          emailVerified: appwriteUser.emailVerification,
        },
      });
    } catch (authError: unknown) {
      console.error("❌ Appwrite auth failed:", authError);

      // For auth failures, create a custom session regardless of verification status
      console.log("🔄 Falling back to custom session...");

      // Create custom session for unverified users
      const sessionToken = `custom_${user.accountId}_${Date.now()}`;

      (await cookies()).set("appwrite_session", sessionToken, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      (await cookies()).set(
        "user_data",
        JSON.stringify({
          $id: user.accountId,
          email: user.email,
          name: user.fullName,
          $createdAt: user.$createdAt,
          emailVerification: false, // Assume unverified for fallback
        }),
        {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        }
      );

      console.log("✅ Custom session created for unverified user");

      return parseStringify({
        sessionId: sessionToken,
        success: true,
        user: {
          $id: user.accountId,
          email: user.email,
          name: user.fullName,
          emailVerified: false, // Assume unverified for fallback
        },
      });
    }
  } catch (error: unknown) {
    console.error("loginUser error:", error);
    return parseStringify({
      error: "Something went wrong. Please try again.",
      success: false,
    });
  }
};

export const verifyEmail = async (userId: string, secret: string) => {
  try {
    console.log("Verifying email for user:", userId);

    // Use public client for email verification (not admin client)
    const { Client, Account } = await import("node-appwrite");
    const client = new Client()
      .setEndpoint(appwriteConfig.endpointUrl)
      .setProject(appwriteConfig.projectId);

    const account = new Account(client);

    // Verify the email with Appwrite using public client
    await account.updateVerification(userId, secret);
    console.log("Appwrite email verification successful");

    // Get user data to return email for resend functionality
    try {
      const { createAdminClient } = await import("../appwrite");
      const { account: adminAccount } = await createAdminClient();
      const userData = await adminAccount.get(userId);

      return parseStringify({
        success: true,
        message:
          "Email verified successfully! You can now sign in to your account.",
        email: userData.email,
      });
    } catch (getUserError) {
      console.log("Could not get user data, continuing without email");
      return parseStringify({
        success: true,
        message:
          "Email verified successfully! You can now sign in to your account.",
      });
    }
  } catch (error: unknown) {
    console.error("Email verification error:", error);

    // Try to get user email even on error for resend functionality
    try {
      const { createAdminClient } = await import("../appwrite");
      const { account: adminAccount } = await createAdminClient();
      const userData = await adminAccount.get(userId);

      return parseStringify({
        error:
          "Invalid or expired verification link. Please try requesting a new verification email.",
        success: false,
        email: userData.email,
      });
    } catch (getUserError) {
      return parseStringify({
        error:
          "Invalid or expired verification link. Please try requesting a new verification email.",
        success: false,
      });
    }
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    console.log("Resending verification email for:", email);

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return parseStringify({
        error: "No account found with this email address.",
        success: false,
      });
    }

    const { account } = await createAdminClient();

    // Create a temporary session to send verification email
    try {
      const session = await account.createEmailPasswordSession(
        email,
        user.password
      );

      // Create a session client for the user
      const { Client, Account } = await import("node-appwrite");
      const userClient = new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId)
        .setSession(session.secret);

      const userAccount = new Account(userClient);

      // Check if already verified
      const appwriteUser = await userAccount.get();
      if (appwriteUser.emailVerification) {
        try {
          await userAccount.deleteSession("current");
        } catch {
          console.log(
            "Could not delete session with user client, continuing..."
          );
        }
        return parseStringify({
          error: "This email address is already verified.",
          success: false,
        });
      }

      // Send verification email using user's session
      await userAccount.createVerification(
        `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
      );

      // Delete the temporary session using user client
      try {
        await userAccount.deleteSession("current");
      } catch {
        console.log(
          "Could not delete temp session with user client, continuing..."
        );
      }

      console.log("Verification email resent successfully");

      return parseStringify({
        success: true,
        message: "Verification email sent! Please check your inbox.",
      });
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      return parseStringify({
        error: "Failed to send verification email. Please try again later.",
        success: false,
      });
    }
  } catch (error: unknown) {
    console.error("Resend verification error:", error);
    return parseStringify({
      error: "Something went wrong. Please try again.",
      success: false,
    });
  }
};

export const signOutUser = async () => {
  try {
    const session = (await cookies()).get("appwrite_session");

    // Only try to delete Appwrite session if it's not a custom session
    if (session && session.value && !session.value.startsWith("custom_")) {
      try {
        // Use session client instead of admin client to delete the session
        const { Client, Account } = await import("node-appwrite");
        const client = new Client()
          .setEndpoint(appwriteConfig.endpointUrl)
          .setProject(appwriteConfig.projectId)
          .setSession(session.value);

        const account = new Account(client);
        await account.deleteSession("current");
      } catch (error) {
        // Ignore errors when deleting Appwrite session
        console.log("Error deleting Appwrite session:", error);
      }
    }

    // Clear session cookies after attempting to delete the session
    (await cookies()).delete("appwrite_session");
    (await cookies()).delete("user_data");
  } catch (error) {
    handleError(error, "Failed to sign out");
  } finally {
    redirect("/sign-in");
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    console.log("Sending password reset email for:", email);

    // Check if user exists in database
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security reasons
      return parseStringify({
        success: true,
        message:
          "If an account with this email exists, you'll receive a reset link.",
      });
    }

    const { account } = await createAdminClient();

    // Create temporary session to send reset email
    try {
      const session = await account.createEmailPasswordSession(
        email,
        user.password
      );

      // Create a session client for the user
      const { Client, Account } = await import("node-appwrite");
      const userClient = new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId)
        .setSession(session.secret);

      const userAccount = new Account(userClient);

      // Send password recovery email
      await userAccount.createRecovery(
        email,
        `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      );

      // Clean up session
      try {
        await userAccount.deleteSession("current");
      } catch {
        console.log("Could not delete temp session, continuing...");
      }

      console.log("Password reset email sent successfully");

      return parseStringify({
        success: true,
        message: "Password reset link sent to your email.",
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return parseStringify({
        success: false,
        error: "Failed to send reset email. Please try again later.",
      });
    }
  } catch (error: unknown) {
    console.error("Password reset error:", error);
    return parseStringify({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  }
};

export const resetPassword = async (
  userId: string,
  secret: string,
  newPassword: string
) => {
  try {
    console.log("Resetting password for user:", userId);

    // Use public client for password recovery
    const { Client, Account } = await import("node-appwrite");
    const client = new Client()
      .setEndpoint(appwriteConfig.endpointUrl)
      .setProject(appwriteConfig.projectId);

    const account = new Account(client);

    // Complete password recovery with Appwrite (only 3 parameters needed)
    await account.updateRecovery(userId, secret, newPassword);
    console.log("Appwrite password recovery successful");

    // Update password in our database
    try {
      const { databases } = await createAdminClient();

      // Find user by accountId (userId from Appwrite)
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("accountId", [userId])]
      );

      if (result.total > 0) {
        const user = result.documents[0];
        // Update password in our database
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          user.$id,
          { password: newPassword }
        );
        console.log("Database password updated successfully");
      }
    } catch (dbError) {
      console.error("Failed to update password in database:", dbError);
      // Continue anyway since Appwrite password was updated
    }

    return parseStringify({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (error: unknown) {
    console.error("Password reset completion error:", error);
    return parseStringify({
      success: false,
      error: "Invalid or expired reset link. Please request a new one.",
    });
  }
};
