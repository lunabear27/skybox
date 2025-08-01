const { Client, Databases } = require("node-appwrite");

async function quickFixSubscription() {
  console.log("🔧 Quick Subscription Fix");
  console.log("========================");

  try {
    // Your Appwrite configuration
    const endpoint = "https://nyc.cloud.appwrite.io/v1";
    const projectId = "6880c686001ee8dd4724";
    const databaseId = "6880cd1f00122641efc5";
    const secretKey =
      "standard_e19d6e4d05c3f6338a67ba24c0e91a2fb2d44f35e544a3f4acc24b7e4555c85f14bbf881494e5ef0c68fddec8303431c11baea4a240a650b331fd8f6e4b7f059ae9f429b4680f3adf441f1a565920a34cb0430f7260da87a6d286863b3165041715bcee3083d6e66802c01857996f215deb75f83e1cf91af8860147426345cbe";
    const userId = "688c8b770027a3420fac"; // Your actual User ID
    const planId = "pro";

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(secretKey);

    const databases = new Databases(client);

    console.log("🔍 Finding subscriptions collection...");

    // List existing collections
    const collections = await databases.listCollections(databaseId);
    const subscriptionsCollection = collections.collections.find(
      (col) => col.name === "subscriptions"
    );

    if (!subscriptionsCollection) {
      console.error("❌ Subscriptions collection not found");
      return;
    }

    console.log("✅ Found subscriptions collection");

    const subscriptionData = {
      userId,
      planId,
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // 30 days from now
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: `manual_pro_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create new subscription
    console.log("📝 Creating Pro subscription...");
    await databases.createDocument(
      databaseId,
      subscriptionsCollection.$id,
      "unique()",
      subscriptionData
    );
    console.log("✅ Pro subscription created successfully");

    console.log("\n🎉 Subscription updated!");
    console.log(`📋 User: ${userId}`);
    console.log(`📋 Plan: ${planId}`);
    console.log(`📋 Status: active`);
    console.log(
      `📋 Period: ${subscriptionData.currentPeriodStart} to ${subscriptionData.currentPeriodEnd}`
    );

    console.log("\n🔄 Now refresh your dashboard to see the changes!");
  } catch (error) {
    console.error("❌ Error updating subscription:", error);
  }
}

quickFixSubscription();
