export const appwriteConfig = {
  endpointUrl:
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
  usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "",
  filesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID || "",
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "",
  secretKey: process.env.APPWRITE_SECRET_KEY || "",
};

// Validate configuration
export const validateAppwriteConfig = () => {
  const requiredVars = [
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    "NEXT_PUBLIC_APPWRITE_DATABASE_ID",
    "NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID",
    "NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID",
    "NEXT_PUBLIC_APPWRITE_BUCKET_ID",
    "APPWRITE_SECRET_KEY",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(
      `Missing Appwrite environment variables: ${missingVars.join(", ")}`
    );
    return false;
  }

  return true;
};
