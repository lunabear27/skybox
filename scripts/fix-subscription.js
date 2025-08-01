const readline = require('readline');
const { Client, Databases } = require('node-appwrite');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function fixSubscription() {
  console.log('🔧 SkyBox Subscription Fix');
  console.log('==========================');
  
  try {
    // Get Appwrite configuration
    const endpoint = await askQuestion('Enter your Appwrite Endpoint (default: https://nyc.cloud.appwrite.io/v1): ') || 'https://nyc.cloud.appwrite.io/v1';
    const projectId = await askQuestion('Enter your Appwrite Project ID: ');
    const databaseId = await askQuestion('Enter your Appwrite Database ID: ');
    const secretKey = await askQuestion('Enter your Appwrite Secret Key: ');
    const userId = await askQuestion('Enter your User ID: ');
    const planId = await askQuestion('Enter the plan ID (basic/pro/enterprise): ');

    if (!projectId || !databaseId || !secretKey || !userId || !planId) {
      console.error('❌ Missing required configuration');
      rl.close();
      return;
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(secretKey);

    const databases = new Databases(client);

    console.log('\n🔍 Finding subscriptions collection...');
    
    // List existing collections
    const collections = await databases.listCollections(databaseId);
    const subscriptionsCollection = collections.collections.find(col => col.name === 'subscriptions');
    
    if (!subscriptionsCollection) {
      console.error('❌ Subscriptions collection not found');
      rl.close();
      return;
    }

    console.log('✅ Found subscriptions collection');

    // Check if subscription already exists
    const existingSubscriptions = await databases.listDocuments(
      databaseId,
      subscriptionsCollection.$id,
      [{ key: "userId", operator: "equal", value: userId }]
    );

    const subscriptionData = {
      userId,
      planId,
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: `manual_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingSubscriptions.documents.length > 0) {
      // Update existing subscription
      console.log('📝 Updating existing subscription...');
      await databases.updateDocument(
        databaseId,
        subscriptionsCollection.$id,
        existingSubscriptions.documents[0].$id,
        subscriptionData
      );
      console.log('✅ Subscription updated successfully');
    } else {
      // Create new subscription
      console.log('📝 Creating new subscription...');
      await databases.createDocument(
        databaseId,
        subscriptionsCollection.$id,
        "unique()",
        subscriptionData
      );
      console.log('✅ Subscription created successfully');
    }

    console.log('\n🎉 Subscription fixed!');
    console.log(`📋 User: ${userId}`);
    console.log(`📋 Plan: ${planId}`);
    console.log(`📋 Status: active`);
    console.log(`📋 Period: ${subscriptionData.currentPeriodStart} to ${subscriptionData.currentPeriodEnd}`);
    
  } catch (error) {
    console.error('❌ Error fixing subscription:', error);
  } finally {
    rl.close();
  }
}

fixSubscription(); 