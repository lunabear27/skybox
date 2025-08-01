import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      stripePublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
      stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      stripeBasicPriceId: !!process.env.STRIPE_BASIC_PRICE_ID,
      appwriteEndpoint: !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
      appwriteProjectId: !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
      appwriteDatabaseId: !!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      appwriteUsersCollectionId: !!process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
      appwriteSecretKey: !!process.env.APPWRITE_SECRET_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    };

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: "Environment variables check completed"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 