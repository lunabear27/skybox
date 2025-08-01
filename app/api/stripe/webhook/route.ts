import { NextRequest, NextResponse } from "next/server";
import {
  stripe,
  validateStripeConfig,
  getPlanIdFromPriceId,
} from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe configuration
    validateStripeConfig();

    const body = await request.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { databases } = await createAdminClient();

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        await handleCheckoutSessionCompleted(session, databases);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as any;
        await handleSubscriptionCreated(subscription, databases);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription, databases);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        await handleSubscriptionDeleted(subscription, databases);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        await handleInvoicePaymentSucceeded(invoice, databases);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        await handleInvoicePaymentFailed(invoice, databases);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any, databases: any) {
  const { userId, planId, billingCycle } = session.metadata;

  if (!userId || !planId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  console.log(`Checkout completed for user ${userId}, plan ${planId}`);
}

async function handleSubscriptionCreated(subscription: any, databases: any) {
  const { userId, planId, billingCycle } = subscription.metadata;

  if (!userId || !planId) {
    console.error("Missing metadata in subscription:", subscription.id);
    return;
  }

  try {
    // Get the subscriptions collection
    const collections = await databases.listCollections(
      appwriteConfig.databaseId
    );
    const subscriptionsCollection = collections.collections.find(
      (col: any) => col.name === "subscriptions"
    );

    if (!subscriptionsCollection) {
      console.error("Subscriptions collection not found - please run: npm run setup-subscriptions");
      return;
    }

    // Create or update subscription in database
    const subscriptionData = {
      userId,
      planId,
      status: subscription.status,
      currentPeriodStart: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      currentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeSubscriptionId: subscription.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check if subscription already exists
    const existingSubscriptions = await databases.listDocuments(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id,
      [{ key: "userId", operator: "equal", value: userId }]
    );

    if (existingSubscriptions.documents.length > 0) {
      // Update existing subscription
      await databases.updateDocument(
        appwriteConfig.databaseId,
        subscriptionsCollection.$id,
        existingSubscriptions.documents[0].$id,
        subscriptionData
      );
    } else {
      // Create new subscription
      await databases.createDocument(
        appwriteConfig.databaseId,
        subscriptionsCollection.$id,
        "unique()",
        subscriptionData
      );
    }

    console.log(`Subscription created for user ${userId}, plan ${planId}`);
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(subscription: any, databases: any) {
  const { userId, planId } = subscription.metadata;

  if (!userId || !planId) {
    console.error("Missing metadata in subscription update:", subscription.id);
    return;
  }

  try {
    const collections = await databases.listCollections(
      appwriteConfig.databaseId
    );
    const subscriptionsCollection = collections.collections.find(
      (col: any) => col.name === "subscriptions"
    );

    if (!subscriptionsCollection) {
      console.error("Subscriptions collection not found");
      return;
    }

    // Find and update subscription
    const existingSubscriptions = await databases.listDocuments(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id,
      [
        {
          key: "stripeSubscriptionId",
          operator: "equal",
          value: subscription.id,
        },
      ]
    );

    if (existingSubscriptions.documents.length > 0) {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        subscriptionsCollection.$id,
        existingSubscriptions.documents[0].$id,
        {
          status: subscription.status,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          currentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date().toISOString(),
        }
      );
    }

    console.log(
      `Subscription updated for user ${userId}, status: ${subscription.status}`
    );
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: any, databases: any) {
  const { userId } = subscription.metadata;

  if (!userId) {
    console.error("Missing userId in subscription deletion:", subscription.id);
    return;
  }

  try {
    const collections = await databases.listCollections(
      appwriteConfig.databaseId
    );
    const subscriptionsCollection = collections.collections.find(
      (col: any) => col.name === "subscriptions"
    );

    if (!subscriptionsCollection) {
      console.error("Subscriptions collection not found");
      return;
    }

    // Find and update subscription status
    const existingSubscriptions = await databases.listDocuments(
      appwriteConfig.databaseId,
      subscriptionsCollection.$id,
      [
        {
          key: "stripeSubscriptionId",
          operator: "equal",
          value: subscription.id,
        },
      ]
    );

    if (existingSubscriptions.documents.length > 0) {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        subscriptionsCollection.$id,
        existingSubscriptions.documents[0].$id,
        {
          status: "canceled",
          updatedAt: new Date().toISOString(),
        }
      );
    }

    console.log(`Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any, databases: any) {
  console.log(`Payment succeeded for invoice ${invoice.id}`);
  // Handle successful payment - could send confirmation email, etc.
}

async function handleInvoicePaymentFailed(invoice: any, databases: any) {
  console.log(`Payment failed for invoice ${invoice.id}`);
  // Handle failed payment - could send notification, etc.
}
