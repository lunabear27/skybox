import Stripe from "stripe";

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  priceIds: {
    basic: process.env.STRIPE_BASIC_PRICE_ID!,
    pro: process.env.STRIPE_PRO_PRICE_ID!,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  },
  // Annual price IDs (for future implementation)
  annualPriceIds: {
    basic: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID!,
    pro: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
    enterprise: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID!,
  },
};

// Validate Stripe configuration
export const validateStripeConfig = () => {
  const requiredEnvVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_BASIC_PRICE_ID",
    "STRIPE_PRO_PRICE_ID",
    "STRIPE_ENTERPRISE_PRICE_ID",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missingVars.join(", ")}`
    );
  }
};

// Helper function to get price ID by plan
export const getPriceId = (
  planId: string,
  billingCycle: "monthly" | "yearly" = "monthly"
) => {
  if (billingCycle === "yearly") {
    return STRIPE_CONFIG.annualPriceIds[
      planId as keyof typeof STRIPE_CONFIG.annualPriceIds
    ];
  }
  return STRIPE_CONFIG.priceIds[planId as keyof typeof STRIPE_CONFIG.priceIds];
};

// Helper function to get plan ID from price ID
export const getPlanIdFromPriceId = (priceId: string): string | null => {
  const allPriceIds = {
    ...STRIPE_CONFIG.priceIds,
    ...STRIPE_CONFIG.annualPriceIds,
  };

  for (const [planId, id] of Object.entries(allPriceIds)) {
    if (id === priceId) {
      return planId.replace("Annual", ""); // Remove 'Annual' suffix if present
    }
  }
  return null;
};
