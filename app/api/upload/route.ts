import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = (await cookies()).get("appwrite_session");
    if (!session?.value) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user data for custom sessions
    let userId: string;
    if (session.value.startsWith("custom_")) {
      const userData = (await cookies()).get("user_data");
      if (!userData?.value) {
        return NextResponse.json(
          { success: false, error: "User data not found" },
          { status: 401 }
        );
      }
      const user = JSON.parse(userData.value);
      userId = user.$id;
    } else {
      // For regular sessions, we'll get userId from form data
      userId = ""; // Will be set below
    }

    // Parse form data ONCE
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userIdFromForm = formData.get("userId") as string;
    const parentId = formData.get("parentId") as string | null;

    // Set userId if not already set (for regular sessions)
    if (!userId && userIdFromForm) {
      userId = userIdFromForm;
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File size (${(file.size / 1024 / 1024).toFixed(
            2
          )}MB) exceeds the 50MB limit`,
        },
        { status: 400 }
      );
    }

    console.log(
      "📤 Upload API - File:",
      file.name,
      "Size:",
      (file.size / 1024 / 1024).toFixed(2) + "MB",
      "User:",
      userId
    );
    console.log("🗂️ Bucket ID:", appwriteConfig.bucketId);

    // Use admin client for upload (since we can't use user session for custom sessions)
    const { storage, databases } = await createAdminClient();

    // Upload to Appwrite Storage with permissions
    const storageId = ID.unique();
    console.log("📦 Uploading to storage with ID:", storageId);

    // Set read permission for the user
    const { Permission, Role } = await import("node-appwrite");

    // Start upload with proper error handling
    let uploadedFile;
    try {
      uploadedFile = await storage.createFile(
        appwriteConfig.bucketId,
        storageId,
        file,
        [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
        ]
      );
    } catch (uploadError) {
      console.error("❌ Storage upload failed:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: `Storage upload failed: ${
            uploadError instanceof Error ? uploadError.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }

    console.log("✅ File uploaded to storage:", uploadedFile.$id);
    console.log("🪣 Bucket ID:", appwriteConfig.bucketId);

    // Get file URL (hardcoded base for Appwrite Cloud)
    const fileUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${appwriteConfig.bucketId}/files/${storageId}/download?project=${appwriteConfig.projectId}`;
    console.log("🔗 File Download URL:", fileUrl);

    // Save file metadata to database
    console.log("💾 Saving metadata to database...");
    let fileDoc;
    try {
      fileDoc = await databases.createDocument(
        appwriteConfig.databaseId,
        "files",
        ID.unique(),
        {
          name: file.name,
          type: "file",
          size: file.size,
          mimeType: file.type,
          parentId: parentId || null,
          userId,
          isFavorite: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          storageId: uploadedFile.$id,
          url: fileUrl,
        }
      );
    } catch (dbError) {
      console.error("❌ Database save failed:", dbError);
      // Try to clean up the uploaded file if database save fails
      try {
        await storage.deleteFile(appwriteConfig.bucketId, storageId);
        console.log("🧹 Cleaned up uploaded file after database error");
      } catch (cleanupError) {
        console.error(
          "❌ Failed to cleanup file after database error:",
          cleanupError
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Database save failed: ${
            dbError instanceof Error ? dbError.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }

    console.log("✅ File metadata saved:", fileDoc.$id);

    return NextResponse.json({
      success: true,
      fileId: fileDoc.$id,
      url: fileUrl.toString(),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Upload API error:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
