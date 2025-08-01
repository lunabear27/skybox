const { Client, Users } = require("node-appwrite");

async function findUserId() {
  console.log("🔍 Finding User ID");
  console.log("==================");

  try {
    // Your Appwrite configuration
    const endpoint = "https://nyc.cloud.appwrite.io/v1";
    const projectId = "6880c686001ee8dd4724";
    const secretKey =
      "standard_e19d6e4d05c3f6338a67ba24c0e91a2fb2d44f35e544a3f4acc24b7e4555c85f14bbf881494e5ef0c68fddec8303431c11baea4a240a650b331fd8f6e4b7f059ae9f429b4680f3adf441f1a565920a34cb0430f7260da87a6d286863b3165041715bcee3083d6e66802c01857996f215deb75f83e1cf91af8860147426345cbe";

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(secretKey);

    const users = new Users(client);

    console.log("📋 Listing all users...");

    // List all users
    const userList = await users.list();

    console.log(`\n✅ Found ${userList.total} users:`);
    console.log("=====================================");

    userList.users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.$id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || "N/A"}`);
      console.log(`   Created: ${new Date(user.$createdAt).toLocaleString()}`);
      console.log("   ---");
    });

    // Look for your specific email
    const yourEmail = "mjdialogo1@gmail.com";
    const yourUser = userList.users.find((user) => user.email === yourEmail);

    if (yourUser) {
      console.log(`\n🎯 YOUR USER ID: ${yourUser.$id}`);
      console.log(`📧 Email: ${yourUser.email}`);
    } else {
      console.log(`\n❌ User with email ${yourEmail} not found`);
    }
  } catch (error) {
    console.error("❌ Error finding user ID:", error);
  }
}

findUserId();
