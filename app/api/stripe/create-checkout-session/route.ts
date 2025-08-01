import { NextRequest, NextResponse } from "next/server";
import { stripe, getPriceId, validateStripeConfig } from "@/lib/stripe/config";
import { getCurrentUser } from "@/lib/actions/session.actions";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID } from "node-appwrite";

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
    const {
      planId,
      billingCycle = "monthly",
      successUrl,
      cancelUrl,
    } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Get Stripe price ID for the plan
    const priceId = getPriceId(planId, billingCycle);
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Get or create Stripe customer
    const { databases } = await createAdminClient();

    // Check if user already has a Stripe customer ID
    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      user.$id
    );

    let customerId = userDoc.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          appwriteUserId: user.$id,
        },
      });

      customerId = customer.id;

      // Update user document with Stripe customer ID
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        user.$id,
        {
          stripeCustomerId: customerId,
        }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        userId: user.$id,
        planId,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.$id,
          planId,
          billingCycle,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout session error:", error);

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
