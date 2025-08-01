"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import {
  SUBSCRIPTION_PLANS,
  getPlanById,
  getPlanFeatures,
  type UserSubscription,
  type SubscriptionPlan,
} from "../types/subscription";

// Get current user from session
const getCurrentUserId = async () => {
  const session = (await cookies()).get("appwrite_session");
  if (!session?.value) {
    throw new Error("No session found");
  }

  // For custom sessions, extract user ID
  if (session.value.startsWith("custom_")) {
    return session.value.split("_")[1];
  }

  // For Appwrite sessions, get user from session
  try {
    const { Client, Account } = await import("node-appwrite");
    const client = new Client()
      .setEndpoint(appwriteConfig.endpointUrl)
      .setProject(appwriteConfig.projectId)
      .setSession(session.value);

    const account = new Account(client);
    const user = await account.get();
    return user.$id;
  } catch {
    throw new Error("Invalid session");
  }
};

// Get user's current subscription
export const getUserSubscription = async () => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    // Get the subscriptions collection ID
    const collections = await databases.listCollections(
      appwriteConfig.databaseId
    );
    const subscriptionsCollection = collections.collections.find(
      (col) => col.name === "subscriptions"
    );

    if (!subscriptionsCollection) {
      console.error("Subscriptions collection not found");
      return parseStringify({
        success: false,
        error: "Subscriptions collection not found",
      });
    }

    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id,
      [Query.equal("userId", userId), Query.orderDesc("$createdAt")]
    );

    if (result.documents.length === 0) {
      // User has no subscription, return free plan
      const freePlan = getPlanById("free");
      return parseStringify({
        success: true,
        subscription: {
          id: "free",
          userId,
          planId: "free",
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(), // 1 year from now
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        plan: freePlan,
        features: getPlanFeatures("free"),
      });
    }

    const subscription = result.documents[0] as UserSubscription;

    // If subscription is canceled, treat it as free plan
    if (subscription.status === "canceled") {
      const freePlan = getPlanById("free");
      return parseStringify({
        success: true,
        subscription: {
          id: "free",
          userId,
          planId: "free",
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(), // 1 year from now
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        plan: freePlan,
        features: getPlanFeatures("free"),
      });
    }

    const plan = getPlanById(subscription.planId);

    return parseStringify({
      success: true,
      subscription,
      plan,
      features: getPlanFeatures(subscription.planId),
    });
  } catch (error) {
    console.error("Get user subscription error:", error);
    return parseStringify({
      success: false,
      error: "Failed to get subscription",
    });
  }
};

// Start a free trial for a plan
export const startTrial = async (planId: string) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    // Check if plan exists
    const plan = getPlanById(planId);
    if (!plan) {
      console.log(`❌ Invalid plan: ${planId}`);
      return parseStringify({
        success: false,
        error: "Invalid plan",
      });
    }
    console.log(`✅ Plan found: ${plan.name}`);

    // Get the subscriptions collection ID
    const collections = await databases.listCollections(
      appwriteConfig.databaseId
    );
    const subscriptionsCollection = collections.collections.find(
      (col) => col.name === "subscriptions"
    );

    if (!subscriptionsCollection) {
      console.error("Subscriptions collection not found");
      return parseStringify({
        success: false,
        error: "Subscriptions collection not found",
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await databases.listDocuments(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id,
      [Query.equal("userId", userId), Query.equal("status", "active")]
    );

    if (existingSubscription.documents.length > 0) {
      return parseStringify({
        success: false,
        error: "You already have an active subscription",
      });
    }

    // Create trial subscription
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const subscription = await databases.createDocument(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id,
      ID.unique(),
      {
        userId,
        planId,
        status: "trialing",
        currentPeriodStart: trialStart.toISOString(),
        currentPeriodEnd: trialEnd.toISOString(),
        trialStart: trialStart.toISOString(),
        trialEnd: trialEnd.toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    console.log(`🎉 Started trial for user ${userId} on plan ${planId}`);

    return parseStringify({
      success: true,
      subscription,
      plan,
      features: getPlanFeatures(planId),
      message: `14-day trial started for ${plan.name} plan`,
    });
  } catch (error) {
    console.error("Start trial error:", error);
    return parseStringify({
      success: false,
      error: "Failed to start trial",
    });
  }
};

// Upgrade to a paid plan (simulated payment)
export const upgradePlan = async (planId: string) => {
  try {
    console.log(`🔄 Starting upgrade to plan: ${planId}`);

    const userId = await getCurrentUserId();
    console.log(`👤 User ID: ${userId}`);

    // Check if plan exists
    const plan = getPlanById(planId);
    if (!plan) {
      console.log(`❌ Invalid plan: ${planId}`);
      return parseStringify({
        success: false,
        error: "Invalid plan",
      });
    }
    console.log(`✅ Plan found: ${plan.name}`);

    // For Stripe integration, we'll redirect to checkout instead of directly updating
    // The actual subscription update will happen via webhook
    return parseStringify({
      success: true,
      redirectToCheckout: true,
      planId,
      plan,
      features: getPlanFeatures(planId),
      message: `Redirecting to payment for ${plan.name} plan`,
    });
  } catch (error) {
    console.error("Upgrade plan error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return parseStringify({
      success: false,
      error: "Failed to upgrade plan",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Cancel subscription
export const cancelSubscription = async () => {
  try {
    console.log(`❌ Starting subscription cancellation...`);

    const userId = await getCurrentUserId();
    console.log(`👤 User ID: ${userId}`);

    const { databases } = await createAdminClient();
    console.log(`🔗 Database client created`);

    // Get the subscriptions collection ID
    const collections = await databases.listCollections(
      appwriteConfig.databaseId
    );
    const subscriptionsCollection = collections.collections.find(
      (col) => col.name === "subscriptions"
    );

    if (!subscriptionsCollection) {
      console.error("Subscriptions collection not found");
      return parseStringify({
        success: false,
        error: "Subscriptions collection not found",
      });
    }

    console.log(`🔍 Looking for existing subscriptions...`);
    const existingSubscription = await databases.listDocuments(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id,
      [Query.equal("userId", userId)]
    );
    console.log(
      `📊 Found ${existingSubscription.documents.length} subscriptions`
    );

    if (existingSubscription.documents.length === 0) {
      console.log(`❌ No subscription found for user ${userId}`);
      return parseStringify({
        success: false,
        error: "No subscription found",
      });
    }

    const subscription = existingSubscription.documents[0] as UserSubscription;
    console.log(
      `📝 Found subscription: ${subscription.$id} (Plan: ${subscription.planId}, Status: ${subscription.status})`
    );

    console.log(`📝 Attempting to delete subscription...`);

    // Delete the subscription to revert to free plan
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id,
      subscription.$id
    );

    console.log(`✅ Successfully deleted subscription for user ${userId}`);

    // Return free plan subscription
    const freePlan = getPlanById("free");
    return parseStringify({
      success: true,
      subscription: {
        id: "free",
        userId,
        planId: "free",
        status: "active",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 year from now
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      plan: freePlan,
      features: getPlanFeatures("free"),
      message: "Subscription canceled successfully. Reverted to Free plan.",
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return parseStringify({
      success: false,
      error: "Failed to cancel subscription",
    });
  }
};

// Get all available plans
export const getAvailablePlans = async () => {
  try {
    return parseStringify({
      success: true,
      plans: SUBSCRIPTION_PLANS,
    });
  } catch (error) {
    console.error("Get available plans error:", error);
    return parseStringify({
      success: false,
      error: "Failed to get plans",
    });
  }
};

// Check if user can upload file (based on plan limits)
export const checkUploadPermission = async (fileSize: number) => {
  try {
    const result = await getUserSubscription();
    if (!result.success) {
      return parseStringify({
        success: false,
        error: "Failed to check subscription",
      });
    }

    const features = result.features;

    if (
      features.fileUploadLimit !== -1 &&
      fileSize > features.fileUploadLimit
    ) {
      return parseStringify({
        success: false,
        error: `File size exceeds your plan limit. Upgrade to upload larger files.`,
        limit: features.fileUploadLimit,
        currentSize: fileSize,
      });
    }

    return parseStringify({
      success: true,
      canUpload: true,
    });
  } catch (error) {
    console.error("Check upload permission error:", error);
    return parseStringify({
      success: false,
      error: "Failed to check upload permission",
    });
  }
};

// Test database connectivity and permissions
export const testDatabaseConnection = async () => {
  try {
    console.log("🧪 Testing database connection...");

    const userId = await getCurrentUserId();
    console.log(`👤 User ID: ${userId}`);

    const { databases } = await createAdminClient();
    console.log(`🔗 Database client created`);

    // First check if subscriptions collection exists
    console.log(`📊 Checking if subscriptions collection exists...`);
    let subscriptionsCollection;

    try {
      const collections = await databases.listCollections(
        appwriteConfig.databaseId
      );
      console.log(`📋 Found ${collections.collections.length} collections:`);
      collections.collections.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col.name} (ID: ${col.$id})`);
      });

      subscriptionsCollection = collections.collections.find(
        (col) => col.name === "subscriptions"
      );

      if (!subscriptionsCollection) {
        return parseStringify({
          success: false,
          error: "Subscriptions collection not found",
          details: "Please run 'Setup Subscriptions Collection' first",
          note: "The subscriptions collection needs to be created before testing the connection",
          availableCollections: collections.collections.map((col) => ({
            name: col.name,
            id: col.$id,
          })),
        });
      }

      console.log(
        `✅ Subscriptions collection found: ${subscriptionsCollection.$id}`
      );
    } catch (collectionError) {
      return parseStringify({
        success: false,
        error: "Failed to check collections",
        details:
          collectionError instanceof Error
            ? collectionError.message
            : "Unknown error",
      });
    }

    // Test listing documents
    console.log(`📊 Testing document listing...`);
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id,
      [Query.equal("userId", userId)]
    );
    console.log(`✅ Successfully listed ${result.documents.length} documents`);

    return parseStringify({
      success: true,
      message: "Database connection successful",
      documentCount: result.documents.length,
    });
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    return parseStringify({
      success: false,
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get current user information
export const getCurrentUserInfo = async () => {
  try {
    console.log("👤 Getting current user info...");

    const userId = await getCurrentUserId();
    console.log(`👤 User ID: ${userId}`);

    // First try to get user from Appwrite Auth directly
    try {
      const { Client, Account } = await import("node-appwrite");
      const session = (await cookies()).get("appwrite_session");

      if (session?.value) {
        const client = new Client()
          .setEndpoint(appwriteConfig.endpointUrl)
          .setProject(appwriteConfig.projectId)
          .setSession(session.value);

        const account = new Account(client);
        const user = await account.get();

        console.log(`✅ Got user from Appwrite Auth: ${user.email}`);

        return parseStringify({
          success: true,
          user: {
            id: user.$id,
            email: user.email,
            name: user.name,
            createdAt: user.$createdAt,
            emailVerification: user.emailVerification,
          },
        });
      }
    } catch (authError) {
      console.log("Could not get user from Auth, trying database...");
    }

    // Fallback to database lookup
    const { databases } = await createAdminClient();
    console.log(`🔗 Database client created`);

    // Get the users collection ID
    const collections = await databases.listCollections(
      appwriteConfig.databaseId
    );
    console.log(`📋 Available collections:`);
    collections.collections.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.name} (ID: ${col.$id})`);
    });

    const usersCollection = collections.collections.find(
      (col) => col.name === "users"
    );

    if (!usersCollection) {
      console.log(
        `❌ Users collection not found. Available collections: ${collections.collections
          .map((col) => col.name)
          .join(", ")}`
      );
      return parseStringify({
        success: false,
        error: "Users collection not found",
        availableCollections: collections.collections.map((col) => ({
          name: col.name,
          id: col.$id,
        })),
      });
    }

    console.log(
      `🔍 Looking for user in collection: ${usersCollection.name} (${usersCollection.$id})`
    );

    // Get user document
    const userResult = await databases.listDocuments(
      appwriteConfig.databaseId,
      usersCollection.$id,
      [Query.equal("$id", userId)]
    );
    console.log(`📊 Found ${userResult.documents.length} user documents`);

    if (userResult.documents.length === 0) {
      console.log(
        `❌ User ${userId} not found in collection ${usersCollection.name}`
      );
      return parseStringify({
        success: false,
        error: "User not found in database",
        userId: userId,
        collectionName: usersCollection.name,
        collectionId: usersCollection.$id,
        note: "User exists in Appwrite Auth but not in database collection",
      });
    }

    const user = userResult.documents[0];

    return parseStringify({
      success: true,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
        createdAt: user.$createdAt,
        emailVerification: user.emailVerification,
      },
    });
  } catch (error) {
    console.error("Get current user info error:", error);
    return parseStringify({
      success: false,
      error: "Failed to get user info",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
