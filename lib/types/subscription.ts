export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  storageLimit: number; // in bytes
  fileUploadLimit: number; // in bytes
  features: string[];
  isPopular?: boolean;
  isEnterprise?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  isTrial?: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFeatures {
  storageLimit: number;
  fileUploadLimit: number;
  maxFiles: number;
  supportLevel: "community" | "email" | "priority" | "dedicated";
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    billingCycle: "monthly",
    storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB
    fileUploadLimit: 100 * 1024 * 1024, // 100 MB
    features: [
      "Basic file storage",
      "Community support",
      "File sharing",
      "Basic analytics",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 5,
    billingCycle: "monthly",
    storageLimit: 50 * 1024 * 1024 * 1024, // 50 GB
    fileUploadLimit: 2 * 1024 * 1024 * 1024, // 2 GB
    features: [
      "50 GB Storage",
      "Unlimited files",
      "Email support",
      "File sharing",
      "Advanced analytics",
      "Version history",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 15,
    billingCycle: "monthly",
    storageLimit: 1024 * 1024 * 1024 * 1024, // 1 TB
    fileUploadLimit: 10 * 1024 * 1024 * 1024, // 10 GB
    isPopular: true,
    features: [
      "1 TB Storage",
      "Unlimited files",
      "Priority support",
      "Advanced analytics",
      "Team collaboration",
      "Version history",
      "Custom branding",
      "API access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 50,
    billingCycle: "monthly",
    storageLimit: 10 * 1024 * 1024 * 1024 * 1024, // 10 TB
    fileUploadLimit: -1, // Unlimited
    isEnterprise: true,
    features: [
      "10 TB Storage",
      "Unlimited files",
      "24/7 Support",
      "Advanced security",
      "Custom integrations",
      "Dedicated manager",
      "SLA guarantee",
      "On-premise option",
    ],
  },
];

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(
    (plan) => plan.id.toLowerCase() === planId.toLowerCase()
  );
};

export const getPlanFeatures = (planId: string): SubscriptionFeatures => {
  const plan = getPlanById(planId);
  if (!plan) {
    // Return free plan features as default
    return {
      storageLimit: 10 * 1024 * 1024 * 1024,
      fileUploadLimit: 100 * 1024 * 1024,
      maxFiles: 1000,
      supportLevel: "community",
      features: ["Basic file storage", "Community support"],
    };
  }

  return {
    storageLimit: plan.storageLimit,
    fileUploadLimit: plan.fileUploadLimit,
    maxFiles: plan.fileUploadLimit === -1 ? -1 : 100000, // Unlimited for enterprise
    supportLevel:
      plan.id === "enterprise"
        ? "dedicated"
        : plan.id === "pro"
        ? "priority"
        : plan.id === "basic"
        ? "email"
        : "community",
    features: plan.features,
  };
};
