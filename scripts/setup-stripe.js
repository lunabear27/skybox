#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🚀 SkyBox Stripe Setup Script");
console.log("==============================\n");

const questions = [
  {
    name: "stripeSecretKey",
    message: "Enter your Stripe Secret Key (sk_test_...): ",
    required: true,
  },
  {
    name: "stripePublishableKey",
    message: "Enter your Stripe Publishable Key (pk_test_...): ",
    required: true,
  },
  {
    name: "stripeWebhookSecret",
    message: "Enter your Stripe Webhook Secret (whsec_...): ",
    required: true,
  },
  {
    name: "basicPriceId",
    message: "Enter Basic Plan Price ID (price_...): ",
    required: true,
  },
  {
    name: "proPriceId",
    message: "Enter Pro Plan Price ID (price_...): ",
    required: true,
  },
  {
    name: "enterprisePriceId",
    message: "Enter Enterprise Plan Price ID (price_...): ",
    required: true,
  },
  {
    name: "appUrl",
    message: "Enter your app URL (default: http://localhost:3000): ",
    default: "http://localhost:3000",
  },
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question.message, (answer) => {
      if (!answer && question.required) {
        console.log("❌ This field is required!");
        return askQuestion(question).then(resolve);
      }
      resolve(answer || question.default || "");
    });
  });
}

async function setupStripe() {
  try {
    console.log("📝 Please provide the following information:\n");

    const answers = {};

    for (const question of questions) {
      answers[question.name] = await askQuestion(question);
    }

    // Create .env.local content
    const envContent = `# Stripe Configuration
STRIPE_SECRET_KEY=${answers.stripeSecretKey}
STRIPE_PUBLISHABLE_KEY=${answers.stripePublishableKey}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${answers.stripePublishableKey}
STRIPE_WEBHOOK_SECRET=${answers.stripeWebhookSecret}

# Stripe Price IDs
STRIPE_BASIC_PRICE_ID=${answers.basicPriceId}
STRIPE_PRO_PRICE_ID=${answers.proPriceId}
STRIPE_ENTERPRISE_PRICE_ID=${answers.enterprisePriceId}

# App Configuration
NEXT_PUBLIC_APP_URL=${answers.appUrl}

# Add your existing Appwrite configuration here
`;

    // Write to .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    fs.writeFileSync(envPath, envContent);

    console.log("\n✅ Stripe configuration saved to .env.local");
    console.log("\n📋 Next steps:");
    console.log("1. Add your Appwrite configuration to .env.local");
    console.log("2. Run: npm install");
    console.log("3. Run: npm run dev");
    console.log("4. Test the payment flow in your dashboard");
    console.log(
      "\n📚 For detailed setup instructions, see: STRIPE_SETUP_GUIDE.md"
    );
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  } finally {
    rl.close();
  }
}

setupStripe();
