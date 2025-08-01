const readline = require('readline');
const { Client, Databases, Permission, Role } = require('node-appwrite');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupSubscriptionsCollection() {
  console.log('🔧 SkyBox Subscriptions Collection Setup');
  console.log('==========================================');
  
  try {
    // Get Appwrite configuration
    const endpoint = await askQuestion('Enter your Appwrite Endpoint (default: https://nyc.cloud.appwrite.io/v1): ') || 'https://nyc.cloud.appwrite.io/v1';
    const projectId = await askQuestion('Enter your Appwrite Project ID: ');
    const databaseId = await askQuestion('Enter your Appwrite Database ID: ');
    const secretKey = await askQuestion('Enter your Appwrite Secret Key: ');

    if (!projectId || !databaseId || !secretKey) {
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

    console.log('\n🔍 Checking existing collections...');
    
    // List existing collections
    const collections = await databases.listCollections(databaseId);
    const existingCollection = collections.collections.find(col => col.name === 'subscriptions');
    
    if (existingCollection) {
      console.log('✅ Subscriptions collection already exists');
      console.log(`   Collection ID: ${existingCollection.$id}`);
    } else {
      console.log('📝 Creating subscriptions collection...');
      
      // Create subscriptions collection
      const collection = await databases.createCollection(
        databaseId,
        'unique()',
        'subscriptions',
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      );

      console.log('✅ Subscriptions collection created');
      console.log(`   Collection ID: ${collection.$id}`);

      // Create attributes
      console.log('📝 Creating collection attributes...');
      
      await databases.createStringAttribute(databaseId, collection.$id, 'userId', 255, true);
      await databases.createStringAttribute(databaseId, collection.$id, 'planId', 255, true);
      await databases.createStringAttribute(databaseId, collection.$id, 'status', 255, true);
      await databases.createStringAttribute(databaseId, collection.$id, 'currentPeriodStart', 255, true);
      await databases.createStringAttribute(databaseId, collection.$id, 'currentPeriodEnd', 255, true);
      await databases.createBooleanAttribute(databaseId, collection.$id, 'cancelAtPeriodEnd', true);
      await databases.createStringAttribute(databaseId, collection.$id, 'stripeSubscriptionId', 255, false);
      await databases.createStringAttribute(databaseId, collection.$id, 'stripeCustomerId', 255, false);
      
      console.log('✅ Collection attributes created');
    }

    console.log('\n🎉 Subscriptions collection setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Configure Stripe webhook URL in your Stripe dashboard');
    console.log('2. Webhook URL should be: https://your-domain.com/api/stripe/webhook');
    console.log('3. Test a payment to verify webhook integration');
    
  } catch (error) {
    console.error('❌ Error setting up subscriptions collection:', error);
  } finally {
    rl.close();
  }
}

setupSubscriptionsCollection(); 