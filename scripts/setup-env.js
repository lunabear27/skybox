#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔧 SkyBox Environment Setup Script");
console.log("==================================\n");

const questions = [
  {
    name: "appwriteEndpoint",
    message: "Enter your Appwrite Endpoint (default: https://cloud.appwrite.io/v1): ",
    default: "https://cloud.appwrite.io/v1",
  },
  {
    name: "appwriteProjectId",
    message: "Enter your Appwrite Project ID: ",
    required: true,
  },
  {
    name: "appwriteDatabaseId",
    message: "Enter your Appwrite Database ID: ",
    required: true,
  },
  {
    name: "appwriteUsersCollectionId",
    message: "Enter your Appwrite Users Collection ID: ",
    required: true,
  },
  {
    name: "appwriteFilesCollectionId",
    message: "Enter your Appwrite Files Collection ID: ",
    required: true,
  },
  {
    name: "appwriteBucketId",
    message: "Enter your Appwrite Bucket ID: ",
    required: true,
  },
  {
    name: "appwriteSecretKey",
    message: "Enter your Appwrite Secret Key: ",
    required: true,
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

async function setupEnv() {
  try {
    console.log("📝 Please provide your Appwrite configuration:\n");

    const answers = {};

    for (const question of questions) {
      answers[question.name] = await askQuestion(question);
    }

    // Read existing .env.local if it exists
    const envPath = path.join(process.cwd(), ".env.local");
    let existingEnvContent = "";
    
    if (fs.existsSync(envPath)) {
      existingEnvContent = fs.readFileSync(envPath, "utf8");
    }

    // Create new environment variables
    const newEnvContent = `# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=${answers.appwriteEndpoint}
NEXT_PUBLIC_APPWRITE_PROJECT_ID=${answers.appwriteProjectId}
NEXT_PUBLIC_APPWRITE_DATABASE_ID=${answers.appwriteDatabaseId}
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=${answers.appwriteUsersCollectionId}
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID=${answers.appwriteFilesCollectionId}
NEXT_PUBLIC_APPWRITE_BUCKET_ID=${answers.appwriteBucketId}
APPWRITE_SECRET_KEY=${answers.appwriteSecretKey}

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

`;

    // Combine existing and new content
    const finalEnvContent = existingEnvContent + newEnvContent;

    // Write to .env.local
    fs.writeFileSync(envPath, finalEnvContent);

    console.log("\n✅ Appwrite configuration saved to .env.local");
    console.log("\n📋 Next steps:");
    console.log("1. Restart your development server: npm run dev");
    console.log("2. Test the payment buttons in your dashboard");
    console.log("3. If you have Stripe configured, run: npm run setup-stripe");
    console.log("\n🔗 Get your Appwrite credentials from:");
    console.log("   https://cloud.appwrite.io/console");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  } finally {
    rl.close();
  }
}

setupEnv(); 