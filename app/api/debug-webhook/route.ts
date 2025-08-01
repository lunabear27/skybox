import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Debug webhook - simulating subscription update...");
    
    const { databases } = await createAdminClient();
    
    // Get the subscriptions collection
    const collections = await databases.listCollections(appwriteConfig.databaseId);
    const subscriptionsCollection = collections.collections.find(
      (col: any) => col.name === "subscriptions"
    );

    if (!subscriptionsCollection) {
      return NextResponse.json({
        success: false,
        error: "Subscriptions collection not found"
      });
    }

    // Get all subscriptions to see what's in the database
    const allSubscriptions = await databases.listDocuments(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id
    );

    return NextResponse.json({
      success: true,
      message: "Debug webhook - current subscriptions",
      subscriptionsCollection: {
        id: subscriptionsCollection.$id,
        name: subscriptionsCollection.name
      },
      totalSubscriptions: allSubscriptions.documents.length,
      subscriptions: allSubscriptions.documents.map((sub: any) => ({
        id: sub.$id,
        userId: sub.userId,
        planId: sub.planId,
        status: sub.status,
        isTrial: sub.isTrial,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      }))
    });
    
  } catch (error) {
    console.error("Debug webhook error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to debug webhook",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Debug webhook endpoint",
    instructions: [
      "POST to this endpoint to see current subscriptions",
      "This helps debug why webhook isn't updating subscriptions"
    ]
  });
} 