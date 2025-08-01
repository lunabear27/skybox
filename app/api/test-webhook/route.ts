import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing webhook configuration...");
    
    const { databases } = await createAdminClient();
    
    // Check if subscriptions collection exists
    const collections = await databases.listCollections(appwriteConfig.databaseId);
    const subscriptionsCollection = collections.collections.find(
      (col: any) => col.name === "subscriptions"
    );
    
    if (!subscriptionsCollection) {
      return NextResponse.json({
        success: false,
        error: "Subscriptions collection not found",
        message: "Please run: npm run setup-subscriptions"
      });
    }
    
    // Check environment variables
    const envCheck = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      STRIPE_BASIC_PRICE_ID: !!process.env.STRIPE_BASIC_PRICE_ID,
      STRIPE_PRO_PRICE_ID: !!process.env.STRIPE_PRO_PRICE_ID,
      STRIPE_ENTERPRISE_PRICE_ID: !!process.env.STRIPE_ENTERPRISE_PRICE_ID,
    };
    
    return NextResponse.json({
      success: true,
      message: "Webhook configuration check",
      subscriptionsCollection: {
        exists: true,
        id: subscriptionsCollection.$id,
        name: subscriptionsCollection.name
      },
      environmentVariables: envCheck,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`,
      instructions: [
        "1. Configure webhook URL in Stripe dashboard:",
        `   ${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`,
        "2. Add these events:",
        "   - checkout.session.completed",
        "   - customer.subscription.created", 
        "   - customer.subscription.updated",
        "   - customer.subscription.deleted",
        "   - invoice.payment_succeeded",
        "   - invoice.payment_failed",
        "3. Copy the webhook secret to STRIPE_WEBHOOK_SECRET"
      ]
    });
    
  } catch (error) {
    console.error("Webhook test error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to test webhook configuration",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 