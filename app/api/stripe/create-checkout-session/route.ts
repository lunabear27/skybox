import { NextRequest, NextResponse } from "next/server";
import { stripe, getPriceId, validateStripeConfig } from "@/lib/stripe/config";
import { getCurrentUser } from "@/lib/actions/session.actions";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID } from "node-appwrite";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Stripe checkout session - Starting...");
    
    // Validate Stripe configuration
    try {
      validateStripeConfig();
      console.log("✅ Stripe config validation passed");
    } catch (configError) {
      console.error("❌ Stripe config validation failed:", configError);
      return NextResponse.json(
        { error: "Stripe configuration error", details: configError instanceof Error ? configError.message : "Unknown error" },
        { status: 500 }
      );
    }

    // Get current user
    console.log("🔍 Getting current user...");
    const user = await getCurrentUser();
    if (!user) {
      console.error("❌ No user found - authentication required");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    console.log("✅ User found:", user.$id);

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
    console.log("🔍 Creating admin client...");
    const { databases } = await createAdminClient();
    console.log("✅ Admin client created");

    // Check if user already has a Stripe customer ID
    console.log("🔍 Getting user document from database...");
    console.log("🔍 User ID:", user.$id);
    console.log("🔍 Database ID:", appwriteConfig.databaseId);
    console.log("🔍 Users Collection ID:", appwriteConfig.usersCollectionId);
    
    let userDoc;
    try {
      userDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        user.$id
      );
      console.log("✅ User document retrieved");
         } catch (docError) {
       console.error("❌ User document not found:", docError);
       console.log("🔍 Creating new user document...");
       
       try {
         // Create the user document if it doesn't exist
         userDoc = await databases.createDocument(
           appwriteConfig.databaseId,
           appwriteConfig.usersCollectionId,
           user.$id,
           {
             email: user.email,
             name: user.name,
             $createdAt: user.$createdAt,
             emailVerification: user.emailVerification,
             stripeCustomerId: null,
           }
         );
         console.log("✅ New user document created");
       } catch (createError) {
         console.error("❌ Failed to create user document:", createError);
         
         // If creation fails, try to get the document again (maybe it was created by another process)
         try {
           userDoc = await databases.getDocument(
             appwriteConfig.databaseId,
             appwriteConfig.usersCollectionId,
             user.$id
           );
           console.log("✅ User document retrieved after creation failure");
                   } catch (retryError) {
            console.error("❌ Failed to retrieve user document after creation failure:", retryError);
            console.log("🔍 Proceeding without user document - will create Stripe customer directly");
            
            // Create a minimal user document structure to proceed
            userDoc = {
              stripeCustomerId: null,
              email: user.email,
              name: user.name,
              $id: user.$id
            };
          }
        }
      }
  
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
 
       // Try to update user document with Stripe customer ID (if it exists)
       try {
         await databases.updateDocument(
           appwriteConfig.databaseId,
           appwriteConfig.usersCollectionId,
           user.$id,
           {
             stripeCustomerId: customerId,
           }
         );
         console.log("✅ User document updated with Stripe customer ID");
       } catch (updateError) {
         console.warn("⚠️ Could not update user document with Stripe customer ID:", updateError);
         console.log("ℹ️ Stripe customer created successfully, but user document update failed");
       }
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
