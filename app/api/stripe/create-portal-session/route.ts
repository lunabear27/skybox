import { NextRequest, NextResponse } from "next/server";
import { stripe, validateStripeConfig } from "@/lib/stripe/config";
import { getCurrentUser } from "@/lib/actions/session.actions";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe configuration
    validateStripeConfig();

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const { returnUrl } = await request.json();

    // Get user's Stripe customer ID
    const { databases } = await createAdminClient();
    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      user.$id
    );

    if (!userDoc.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userDoc.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe portal session error:", error);

    return NextResponse.json(
      {
        error: "Failed to create portal session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
