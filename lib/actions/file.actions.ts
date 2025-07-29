"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";

export interface FileItem {
  $id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  parentId?: string;
  userId: string;
  isFavorite: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  url?: string;
  thumbnailUrl?: string;
  storageId?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
}

// Get current user from session
const getCurrentUserId = async () => {
  const session = (await cookies()).get("appwrite_session");
  if (!session?.value) {
    throw new Error("No session found");
  }

  // For custom sessions, extract user ID
  if (session.value.startsWith("custom_")) {
    return session.value.split("_")[1];
  }

  // For Appwrite sessions, get user from session
  try {
    const { Client, Account } = await import("node-appwrite");
    const client = new Client()
      .setEndpoint(appwriteConfig.endpointUrl)
      .setProject(appwriteConfig.projectId)
      .setSession(session.value);

    const account = new Account(client);
    const user = await account.get();
    return user.$id;
  } catch {
    throw new Error("Invalid session");
  }
};

// Create a new folder
export const createFolder = async (name: string, parentId?: string) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    const folder = await databases.createDocument(
      appwriteConfig.databaseId,
      "files", // We'll need to create this collection
      ID.unique(),
      {
        name,
        type: "folder",
        parentId: parentId || null,
        userId,
        isFavorite: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({
      success: true,
      folder: folder,
      message: "Folder created successfully",
    });
  } catch (error) {
    console.error("Create folder error:", error);
    return parseStringify({
      success: false,
      error: "Failed to create folder",
    });
  }
};

// Get files and folders for current user
export const getFiles = async (parentId?: string, type?: "file" | "folder") => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    const queries = [
      Query.equal("userId", [userId]),
      Query.equal("isDeleted", [false]),
    ];

    if (parentId) {
      queries.push(Query.equal("parentId", [parentId]));
    } else {
      queries.push(Query.isNull("parentId"));
    }

    if (type) {
      queries.push(Query.equal("type", [type]));
    }

    // Load all files using pagination to bypass any limit issues
    let allFiles: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        "files",
        [...queries, Query.offset(offset), Query.limit(limit)]
      );

      allFiles = [...allFiles, ...result.documents];

      if (result.documents.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log(`🔍 Loaded ${allFiles.length} files using pagination`);

    // Normalize storageId
    const normalizedFiles = allFiles.map((file) => ({
      ...file,
      storageId:
        typeof file.storageId === "object" &&
        file.storageId &&
        typeof file.storageId.then === "function"
          ? undefined
          : file.storageId,
    }));

    return parseStringify({
      success: true,
      files: normalizedFiles,
      total: allFiles.length,
    });
  } catch (error) {
    console.error("Get files error:", error);
    return parseStringify({
      success: false,
      error: "Failed to get files",
      files: [],
      total: 0,
    });
  }
};

// Get files by type (documents, photos, videos)
export const getFilesByType = async (mimeTypePrefix: string) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    const queries = [
      Query.equal("userId", [userId]),
      Query.equal("type", ["file"]),
      Query.equal("isDeleted", [false]),
      Query.startsWith("mimeType", mimeTypePrefix),
    ];

    // Load all files using pagination
    let allFiles: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        "files",
        [...queries, Query.offset(offset), Query.limit(limit)]
      );

      allFiles = [...allFiles, ...result.documents];

      if (result.documents.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log(`🔍 Loaded ${allFiles.length} files by type using pagination`);

    // Normalize storageId
    const normalizedFiles = allFiles.map((file) => ({
      ...file,
      storageId:
        typeof file.storageId === "object" &&
        file.storageId &&
        typeof file.storageId.then === "function"
          ? undefined
          : file.storageId,
    }));

    return parseStringify({
      success: true,
      files: normalizedFiles,
      total: allFiles.length,
    });
  } catch (error) {
    console.error("Get files by type error:", error);
    return parseStringify({
      success: false,
      error: "Failed to get files",
      files: [],
      total: 0,
    });
  }
};

// Get favorite files
export const getFavoriteFiles = async () => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    const queries = [
      Query.equal("userId", userId),
      Query.equal("isFavorite", true),
      Query.equal("isDeleted", false),
    ];

    // Load all favorite files using pagination to bypass any limit issues
    let allFiles: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        "files",
        [...queries, Query.offset(offset), Query.limit(limit)]
      );

      allFiles = [...allFiles, ...result.documents];

      if (result.documents.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log(`⭐ Loaded ${allFiles.length} favorite files using pagination`);

    // Normalize storageId
    const normalizedFiles = allFiles.map((file) => ({
      ...file,
      storageId:
        typeof file.storageId === "object" &&
        file.storageId &&
        typeof file.storageId.then === "function"
          ? undefined
          : file.storageId,
    }));

    return parseStringify({
      success: true,
      files: normalizedFiles,
      total: allFiles.length,
    });
  } catch (error) {
    console.error("Get favorite files error:", error);
    return parseStringify({
      success: false,
      error: "Failed to get favorite files",
      files: [],
      total: 0,
    });
  }
};

// Get deleted files (trash)
export const getDeletedFiles = async () => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    const queries = [
      Query.equal("userId", userId),
      Query.equal("isDeleted", true),
    ];

    // Load all deleted files using pagination to bypass any limit issues
    let allFiles: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        "files",
        [...queries, Query.offset(offset), Query.limit(limit)]
      );

      allFiles = [...allFiles, ...result.documents];

      if (result.documents.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log(`🗑️ Loaded ${allFiles.length} deleted files using pagination`);

    // Normalize storageId
    const normalizedFiles = allFiles.map((file) => ({
      ...file,
      storageId:
        typeof file.storageId === "object" &&
        file.storageId &&
        typeof file.storageId.then === "function"
          ? undefined
          : file.storageId,
    }));

    return parseStringify({
      success: true,
      files: normalizedFiles,
      total: allFiles.length,
    });
  } catch (error) {
    console.error("Get deleted files error:", error);
    return parseStringify({
      success: false,
      error: "Failed to get deleted files",
      files: [],
      total: 0,
    });
  }
};

// Toggle favorite status
export const toggleFavorite = async (fileId: string) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    // Get current file
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      "files",
      fileId
    );

    // Check if user owns the file
    if (file.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Toggle favorite status
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      "files",
      fileId,
      {
        isFavorite: !file.isFavorite,
        updatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({
      success: true,
      file: updatedFile,
      message: file.isFavorite
        ? "Removed from favorites"
        : "Added to favorites",
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return parseStringify({
      success: false,
      error: "Failed to update favorite status",
    });
  }
};

// Move file to trash
export const moveToTrash = async (fileId: string) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    // Get current file
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      "files",
      fileId
    );

    // Check if user owns the file
    if (file.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Move to trash
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      "files",
      fileId,
      {
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({
      success: true,
      file: updatedFile,
      message: "Moved to trash",
    });
  } catch (error) {
    console.error("Move to trash error:", error);
    return parseStringify({
      success: false,
      error: "Failed to move to trash",
    });
  }
};

// Restore from trash
export const restoreFromTrash = async (fileId: string) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    // Get current file
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      "files",
      fileId
    );

    // Check if user owns the file
    if (file.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Restore from trash
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      "files",
      fileId,
      {
        isDeleted: false,
        updatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({
      success: true,
      file: updatedFile,
      message: "Restored from trash",
    });
  } catch (error) {
    console.error("Restore from trash error:", error);
    return parseStringify({
      success: false,
      error: "Failed to restore from trash",
    });
  }
};

// Permanently delete file
export const permanentlyDelete = async (fileId: string) => {
  try {
    const userId = await getCurrentUserId();
    const { databases, storage } = await createAdminClient();

    // Get current file
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      "files",
      fileId
    );

    // Check if user owns the file
    if (file.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete from storage if it's a file
    if (file.type === "file" && file.storageId) {
      try {
        await storage.deleteFile(appwriteConfig.bucketId, file.storageId);
      } catch (storageError) {
        console.error("Storage deletion error:", storageError);
      }
    }

    // Delete from database
    await databases.deleteDocument(appwriteConfig.databaseId, "files", fileId);

    return parseStringify({
      success: true,
      message: "File permanently deleted",
    });
  } catch (error) {
    console.error("Permanent delete error:", error);
    return parseStringify({
      success: false,
      error: "Failed to permanently delete file",
    });
  }
};

// Empty trash
export const emptyTrash = async () => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    // Get all deleted files
    const deletedFiles = await databases.listDocuments(
      appwriteConfig.databaseId,
      "files",
      [Query.equal("userId", [userId]), Query.equal("isDeleted", [true])]
    );

    // Delete each file permanently
    const deletePromises = deletedFiles.documents.map((file) =>
      permanentlyDelete(file.$id)
    );

    await Promise.all(deletePromises);

    return parseStringify({
      success: true,
      message: `${deletedFiles.total} files permanently deleted`,
    });
  } catch (error) {
    console.error("Empty trash error:", error);
    return parseStringify({
      success: false,
      error: "Failed to empty trash",
    });
  }
};

// Rename file or folder
export const renameItem = async (fileId: string, newName: string) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    // Get current file
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      "files",
      fileId
    );

    // Check if user owns the file
    if (file.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Update name
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      "files",
      fileId,
      {
        name: newName,
        updatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({
      success: true,
      file: updatedFile,
      message: "Item renamed successfully",
    });
  } catch (error) {
    console.error("Rename item error:", error);
    return parseStringify({
      success: false,
      error: "Failed to rename item",
    });
  }
};

// Utility: Re-upload file with a new name (true rename in storage)
export const reuploadFileWithNewName = async (
  fileId: string,
  newName: string
) => {
  try {
    const userId = await getCurrentUserId();
    const { databases, storage } = await createAdminClient();

    // Get current file metadata
    const fileDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      "files",
      fileId
    );
    if (!fileDoc || fileDoc.userId !== userId) {
      throw new Error("Unauthorized or file not found");
    }

    // Download the file from storage
    const fileResponse = await storage.getFileView(
      appwriteConfig.bucketId,
      fileDoc.storageId
    );
    let buffer;
    if (Buffer.isBuffer(fileResponse)) {
      buffer = fileResponse;
    } else if (fileResponse instanceof ArrayBuffer) {
      buffer = Buffer.from(fileResponse);
    } else {
      throw new Error("Unknown fileResponse type from getFileView");
    }

    // Upload the file again with the new name
    const { Permission, Role } = await import("node-appwrite");
    const newStorageId = ID.unique();
    const uploadedFile = await storage.createFile(
      appwriteConfig.bucketId,
      newStorageId,
      buffer,
      [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))]
    );

    // Update the database record to point to the new storage file and new name
    const fileUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${appwriteConfig.bucketId}/files/${newStorageId}/download?project=${appwriteConfig.projectId}`;
    await databases.updateDocument(appwriteConfig.databaseId, "files", fileId, {
      name: newName,
      storageId: uploadedFile.$id,
      url: fileUrl,
      updatedAt: new Date().toISOString(),
    });

    // Optionally, delete the old file from storage
    try {
      await storage.deleteFile(appwriteConfig.bucketId, fileDoc.storageId);
    } catch (e) {
      // Ignore errors on delete
    }

    return {
      success: true,
      message: "File re-uploaded and renamed successfully.",
      newStorageId,
      fileUrl,
    };
  } catch (error) {
    console.error("reuploadFileWithNewName error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Get storage usage
export const getStorageUsage = async () => {
  try {
    const userId = await getCurrentUserId();
    console.log("🔍 Storage Usage - User ID:", userId);
    const { databases } = await createAdminClient();

    // Get all user files (same logic as getFiles)
    // Files in trash (isDeleted: true) should count towards storage usage
    const queries = [
      Query.equal("userId", [userId]),
      // Removed isDeleted filter to include files in trash
    ];

    // Load all files using pagination to get accurate storage usage
    let allFiles: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        "files",
        [...queries, Query.offset(offset), Query.limit(limit)]
      );

      allFiles = [...allFiles, ...result.documents];

      if (result.documents.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log(
      `🔍 Storage Usage - Loaded ${allFiles.length} files using pagination`
    );

    console.log("🔍 Storage Usage - Query result:", {
      total: allFiles.length,
      documents: allFiles.length,
      firstDocument: allFiles[0] || "No documents found",
    });

    // Debug: Log all files and their sizes
    console.log(
      "🔍 All files found:",
      allFiles.map((file: any) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        mimeType: file.mimeType,
        isDeleted: file.isDeleted,
      }))
    );

    // Calculate total size and breakdown by type
    let totalSize = 0;
    const breakdown = {
      documents: 0,
      photos: 0,
      videos: 0,
      others: 0,
    };

    let fileCount = 0;
    let folderCount = 0;

    allFiles.forEach((file: any) => {
      // Only count files, not folders
      if (file.type !== "file") {
        console.log(`📁 Skipping folder: ${file.name}`);
        folderCount++;
        return;
      }

      fileCount++;
      const size = file.size || 0;
      const isInTrash = file.isDeleted;
      console.log(
        `📄 File ${fileCount}: ${file.name}, Size: ${size}, MimeType: ${file.mimeType}, In Trash: ${isInTrash}`
      );
      totalSize += size; // Count all files including those in trash

      if (file.mimeType) {
        if (file.mimeType.startsWith("image/")) {
          breakdown.photos += size;
          console.log(`  → Added to photos: ${size} bytes`);
        } else if (file.mimeType.startsWith("video/")) {
          breakdown.videos += size;
          console.log(`  → Added to videos: ${size} bytes`);
        } else if (
          file.mimeType.includes("document") ||
          file.mimeType.includes("pdf") ||
          file.mimeType.includes("text") ||
          file.mimeType.includes("spreadsheet") ||
          file.mimeType.includes("presentation") ||
          file.mimeType.includes("word") ||
          file.mimeType.includes("excel") ||
          file.mimeType.includes("powerpoint") ||
          file.mimeType.includes("msword") ||
          file.mimeType.includes("vnd.openxmlformats") ||
          file.mimeType.includes("vnd.ms-excel") ||
          file.mimeType.includes("vnd.ms-powerpoint")
        ) {
          breakdown.documents += size;
          console.log(`  → Added to documents: ${size} bytes`);
        } else {
          breakdown.others += size;
          console.log(
            `  → Added to others: ${size} bytes (mimeType: ${file.mimeType})`
          );
        }
      } else {
        breakdown.others += size;
        console.log(`  → Added to others: ${size} bytes (no mimeType)`);
      }
    });

    console.log(
      `📊 File processing summary: ${fileCount} files, ${folderCount} folders processed`
    );

    // Get user's subscription to determine storage limit
    let maxStorage = 10 * 1024 * 1024 * 1024; // Default 10GB in bytes

    try {
      const { getUserSubscription } = await import("./subscription.actions");
      const subscriptionResult = await getUserSubscription();

      if (subscriptionResult.success && subscriptionResult.subscription) {
        const planId = subscriptionResult.subscription.planId;

        // Set storage limit based on plan
        switch (planId) {
          case "basic":
            maxStorage = 50 * 1024 * 1024 * 1024; // 50GB
            break;
          case "pro":
            maxStorage = 1024 * 1024 * 1024 * 1024; // 1TB
            break;
          case "enterprise":
            maxStorage = 10 * 1024 * 1024 * 1024 * 1024; // 10TB
            break;
          default: // free
            maxStorage = 10 * 1024 * 1024 * 1024; // 10GB
            break;
        }

        console.log(
          `📊 Using storage limit for ${planId} plan: ${
            maxStorage / (1024 * 1024 * 1024)
          } GB`
        );
      }
    } catch (error) {
      console.log("Could not get subscription, using default 10GB limit");
    }

    const rawPercentage = (totalSize / maxStorage) * 100;
    const usagePercentage =
      totalSize === 0
        ? 0
        : rawPercentage < 0.1
        ? 0.1
        : Math.round(rawPercentage);

    console.log("🔍 Final calculation:", {
      totalSize,
      maxStorage,
      usagePercentage,
      totalFiles: allFiles.length,
      breakdown,
    });

    console.log("🔍 Breakdown details:", {
      documents: breakdown.documents,
      photos: breakdown.photos,
      videos: breakdown.videos,
      others: breakdown.others,
      totalCalculated:
        breakdown.documents +
        breakdown.photos +
        breakdown.videos +
        breakdown.others,
      totalSize,
      match:
        breakdown.documents +
          breakdown.photos +
          breakdown.videos +
          breakdown.others ===
        totalSize,
    });

    return parseStringify({
      success: true,
      usage: {
        totalSize,
        maxStorage,
        usagePercentage,
        breakdown: {
          documents: breakdown.documents, // Keep as bytes
          photos: breakdown.photos,
          videos: breakdown.videos,
          others: breakdown.others,
        },
        totalFiles: allFiles.length, // Includes files in trash
      },
    });
  } catch (error) {
    console.error("Get storage usage error:", error);
    // Get user's subscription to determine storage limit for error case
    let maxStorage = 10 * 1024 * 1024 * 1024; // Default 10GB in bytes

    try {
      const { getUserSubscription } = await import("./subscription.actions");
      const subscriptionResult = await getUserSubscription();

      if (subscriptionResult.success && subscriptionResult.subscription) {
        const planId = subscriptionResult.subscription.planId;

        // Set storage limit based on plan
        switch (planId) {
          case "basic":
            maxStorage = 50 * 1024 * 1024 * 1024; // 50GB
            break;
          case "pro":
            maxStorage = 1024 * 1024 * 1024 * 1024; // 1TB
            break;
          case "enterprise":
            maxStorage = 10 * 1024 * 1024 * 1024 * 1024; // 10TB
            break;
          default: // free
            maxStorage = 10 * 1024 * 1024 * 1024; // 10GB
            break;
        }
      }
    } catch (error) {
      console.log(
        "Could not get subscription for error case, using default 10GB limit"
      );
    }

    return parseStringify({
      success: false,
      error: "Failed to get storage usage",
      usage: {
        totalSize: 0,
        maxStorage,
        usagePercentage: 0,
        breakdown: { documents: 0, photos: 0, videos: 0, others: 0 },
        totalFiles: 0,
      },
    });
  }
};

// Search files
export const searchFiles = async (query: string) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      "files",
      [
        Query.equal("userId", [userId]),
        Query.equal("isDeleted", [false]),
        Query.search("name", query),
      ],
      1000 // Increase limit to show more files
    );

    // Normalize storageId
    const normalizedFiles = result.documents.map((file) => ({
      ...file,
      storageId:
        typeof file.storageId === "object" &&
        file.storageId &&
        typeof file.storageId.then === "function"
          ? undefined
          : file.storageId,
    }));

    return parseStringify({
      success: true,
      files: normalizedFiles,
      total: result.total,
    });
  } catch (error) {
    console.error("Search files error:", error);
    return parseStringify({
      success: false,
      error: "Failed to search files",
      files: [],
      total: 0,
    });
  }
};

// Get recent activity
export const getRecentActivity = async (limit: number = 10) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      "files",
      [
        Query.equal("userId", [userId]),
        Query.equal("isDeleted", [false]),
        Query.orderDesc("updatedAt"),
        Query.limit(limit),
      ]
    );

    // Normalize storageId
    const normalizedFiles = result.documents.map((file) => ({
      ...file,
      storageId:
        typeof file.storageId === "object" &&
        file.storageId &&
        typeof file.storageId.then === "function"
          ? undefined
          : file.storageId,
    }));

    return parseStringify({
      success: true,
      files: normalizedFiles,
      total: result.total,
    });
  } catch (error) {
    console.error("Get recent activity error:", error);
    return parseStringify({
      success: false,
      error: "Failed to get recent activity",
      files: [],
      total: 0,
    });
  }
};

// Batch move to trash - optimized for multiple files
export const batchMoveToTrash = async (fileIds: string[]) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    console.log(`🗑️ Batch Move to Trash: Processing ${fileIds.length} files`);

    // Process files in batches to avoid Appwrite query limitations
    const batchSize = 25; // Appwrite limit for Query.equal with arrays
    let allUserFiles: any[] = [];

    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);
      console.log(
        `🗑️ Batch Move: Processing batch ${
          Math.floor(i / batchSize) + 1
        }, files ${i + 1}-${Math.min(i + batchSize, fileIds.length)}`
      );

      try {
        const files = await databases.listDocuments(
          appwriteConfig.databaseId,
          "files",
          [Query.equal("$id", batch)]
        );

        // Filter files owned by the user
        const userFiles = files.documents.filter(
          (file) => file.userId === userId
        );
        allUserFiles = [...allUserFiles, ...userFiles];

        console.log(
          `🗑️ Batch Move: Found ${userFiles.length} user files in batch`
        );
      } catch (batchError) {
        console.error(
          `🗑️ Batch Move: Error processing batch ${
            Math.floor(i / batchSize) + 1
          }:`,
          batchError
        );
      }
    }

    const userFileIds = allUserFiles.map((file) => file.$id);
    console.log(`🗑️ Batch Move: Total user files found: ${userFileIds.length}`);

    if (userFileIds.length === 0) {
      return parseStringify({
        success: false,
        error: "No files found or unauthorized",
      });
    }

    // Batch update all files at once
    const updatePromises = userFileIds.map((fileId) =>
      databases.updateDocument(appwriteConfig.databaseId, "files", fileId, {
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      })
    );

    await Promise.all(updatePromises);

    console.log(
      `🗑️ Batch Move: Successfully moved ${userFileIds.length} files to trash`
    );

    return parseStringify({
      success: true,
      message: `Moved ${userFileIds.length} files to trash`,
      processedCount: userFileIds.length,
    });
  } catch (error) {
    console.error("Batch move to trash error:", error);
    return parseStringify({
      success: false,
      error: "Failed to move files to trash",
    });
  }
};

// Batch restore from trash - optimized for multiple files
export const batchRestoreFromTrash = async (fileIds: string[]) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    console.log(`🔄 Batch Restore: Processing ${fileIds.length} files`);

    // Process files in batches to avoid Appwrite query limitations
    const batchSize = 25; // Appwrite limit for Query.equal with arrays
    let allUserFiles: any[] = [];

    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);
      console.log(
        `🔄 Batch Restore: Processing batch ${
          Math.floor(i / batchSize) + 1
        }, files ${i + 1}-${Math.min(i + batchSize, fileIds.length)}`
      );

      try {
        const files = await databases.listDocuments(
          appwriteConfig.databaseId,
          "files",
          [Query.equal("$id", batch)]
        );

        // Filter files owned by the user
        const userFiles = files.documents.filter(
          (file) => file.userId === userId
        );
        allUserFiles = [...allUserFiles, ...userFiles];

        console.log(
          `🔄 Batch Restore: Found ${userFiles.length} user files in batch`
        );
      } catch (batchError) {
        console.error(
          `🔄 Batch Restore: Error processing batch ${
            Math.floor(i / batchSize) + 1
          }:`,
          batchError
        );
      }
    }

    const userFileIds = allUserFiles.map((file) => file.$id);
    console.log(
      `🔄 Batch Restore: Total user files found: ${userFileIds.length}`
    );

    if (userFileIds.length === 0) {
      return parseStringify({
        success: false,
        error: "No files found or unauthorized",
      });
    }

    // Batch update all files at once
    const updatePromises = userFileIds.map((fileId) =>
      databases.updateDocument(appwriteConfig.databaseId, "files", fileId, {
        isDeleted: false,
        updatedAt: new Date().toISOString(),
      })
    );

    await Promise.all(updatePromises);

    console.log(
      `🔄 Batch Restore: Successfully restored ${userFileIds.length} files from trash`
    );

    return parseStringify({
      success: true,
      message: `Restored ${userFileIds.length} files from trash`,
      processedCount: userFileIds.length,
    });
  } catch (error) {
    console.error("Batch restore error:", error);
    return parseStringify({
      success: false,
      error: "Failed to restore files from trash",
    });
  }
};

// Batch permanently delete - optimized for multiple files
export const batchPermanentlyDelete = async (fileIds: string[]) => {
  try {
    const userId = await getCurrentUserId();
    const { databases, storage } = await createAdminClient();

    console.log(`🗑️ Batch Delete: Processing ${fileIds.length} files`);

    // Process files in batches to avoid Appwrite query limitations
    const batchSize = 25; // Appwrite limit for Query.equal with arrays
    let allUserFiles: any[] = [];

    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);
      console.log(
        `🗑️ Batch Delete: Processing batch ${
          Math.floor(i / batchSize) + 1
        }, files ${i + 1}-${Math.min(i + batchSize, fileIds.length)}`
      );

      try {
        const files = await databases.listDocuments(
          appwriteConfig.databaseId,
          "files",
          [Query.equal("$id", batch)]
        );

        // Filter files owned by the user
        const userFiles = files.documents.filter(
          (file) => file.userId === userId
        );
        allUserFiles = [...allUserFiles, ...userFiles];

        console.log(
          `🗑️ Batch Delete: Found ${userFiles.length} user files in batch`
        );
      } catch (batchError) {
        console.error(
          `🗑️ Batch Delete: Error processing batch ${
            Math.floor(i / batchSize) + 1
          }:`,
          batchError
        );
      }
    }

    const userFileIds = allUserFiles.map((file) => file.$id);
    console.log(
      `🗑️ Batch Delete: Total user files found: ${userFileIds.length}`
    );

    if (userFileIds.length === 0) {
      return parseStringify({
        success: false,
        error: "No files found or unauthorized",
      });
    }

    // Separate files and folders
    const filesToDelete = allUserFiles.filter(
      (file) => file.type === "file" && file.storageId
    );
    const foldersToDelete = allUserFiles.filter(
      (file) => file.type === "folder"
    );

    console.log(
      `🗑️ Batch Delete: Files to delete from storage: ${filesToDelete.length}`
    );
    console.log(
      `🗑️ Batch Delete: Folders to delete: ${foldersToDelete.length}`
    );

    // Delete from storage in parallel
    const storageDeletePromises = filesToDelete.map((file) =>
      storage
        .deleteFile(appwriteConfig.bucketId, file.storageId)
        .catch((error) => {
          console.error(`Storage deletion error for file ${file.$id}:`, error);
          return null; // Continue with other deletions even if one fails
        })
    );

    // Delete from database in parallel
    const databaseDeletePromises = userFileIds.map((fileId) =>
      databases.deleteDocument(appwriteConfig.databaseId, "files", fileId)
    );

    // Execute all deletions in parallel
    await Promise.all([...storageDeletePromises, ...databaseDeletePromises]);

    console.log(
      `🗑️ Batch Delete: Successfully deleted ${userFileIds.length} items`
    );

    return parseStringify({
      success: true,
      message: `Permanently deleted ${userFileIds.length} items`,
      processedCount: userFileIds.length,
      filesDeleted: filesToDelete.length,
      foldersDeleted: foldersToDelete.length,
    });
  } catch (error) {
    console.error("Batch permanent delete error:", error);
    return parseStringify({
      success: false,
      error: "Failed to permanently delete files",
    });
  }
};

// Optimized empty trash - delete all at once
export const optimizedEmptyTrash = async () => {
  try {
    const userId = await getCurrentUserId();
    const { databases, storage } = await createAdminClient();

    // Get all deleted files in batches to avoid limits
    const batchSize = 100;
    let allDeletedFiles: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        "files",
        [
          Query.equal("userId", userId),
          Query.equal("isDeleted", true),
          Query.limit(batchSize),
          Query.offset(offset),
        ]
      );

      allDeletedFiles = [...allDeletedFiles, ...result.documents];
      hasMore = result.documents.length === batchSize;
      offset += batchSize;
    }

    if (allDeletedFiles.length === 0) {
      return parseStringify({
        success: true,
        message: "Trash is already empty",
        processedCount: 0,
      });
    }

    // Separate files and folders
    const filesToDelete = allDeletedFiles.filter(
      (file) => file.type === "file" && file.storageId
    );
    const foldersToDelete = allDeletedFiles.filter(
      (file) => file.type === "folder"
    );
    const fileIds = allDeletedFiles.map((file) => file.$id);

    // Delete from storage in parallel (with error handling)
    const storageDeletePromises = filesToDelete.map((file) =>
      storage
        .deleteFile(appwriteConfig.bucketId, file.storageId)
        .catch((error) => {
          console.error(`Storage deletion error for file ${file.$id}:`, error);
          return null; // Continue with other deletions
        })
    );

    // Delete from database in parallel
    const databaseDeletePromises = fileIds.map((fileId) =>
      databases.deleteDocument(appwriteConfig.databaseId, "files", fileId)
    );

    // Execute all deletions in parallel
    await Promise.all([...storageDeletePromises, ...databaseDeletePromises]);

    return parseStringify({
      success: true,
      message: `Emptied trash: ${allDeletedFiles.length} items deleted`,
      processedCount: allDeletedFiles.length,
      filesDeleted: filesToDelete.length,
      foldersDeleted: foldersToDelete.length,
    });
  } catch (error) {
    console.error("Optimized empty trash error:", error);
    return parseStringify({
      success: false,
      error: "Failed to empty trash",
    });
  }
};

// Batch toggle favorite - optimized for multiple files
export const batchToggleFavorite = async (fileIds: string[]) => {
  try {
    const userId = await getCurrentUserId();
    const { databases } = await createAdminClient();

    console.log(`⭐ Batch Toggle Favorite: Processing ${fileIds.length} files`);

    // Process files in batches to avoid Appwrite query limitations
    const batchSize = 25; // Appwrite limit for Query.equal with arrays
    let allUserFiles: any[] = [];

    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);
      console.log(
        `⭐ Batch Favorite: Processing batch ${
          Math.floor(i / batchSize) + 1
        }, files ${i + 1}-${Math.min(i + batchSize, fileIds.length)}`
      );

      try {
        const files = await databases.listDocuments(
          appwriteConfig.databaseId,
          "files",
          [Query.equal("$id", batch)]
        );

        // Filter files owned by the user
        const userFiles = files.documents.filter(
          (file) => file.userId === userId
        );
        allUserFiles = [...allUserFiles, ...userFiles];

        console.log(
          `⭐ Batch Favorite: Found ${userFiles.length} user files in batch`
        );
      } catch (batchError) {
        console.error(
          `⭐ Batch Favorite: Error processing batch ${
            Math.floor(i / batchSize) + 1
          }:`,
          batchError
        );
      }
    }

    const userFileIds = allUserFiles.map((file) => file.$id);
    console.log(
      `⭐ Batch Favorite: Total user files found: ${userFileIds.length}`
    );

    if (userFileIds.length === 0) {
      return parseStringify({
        success: false,
        error: "No files found or unauthorized",
      });
    }

    // Batch update all files at once - toggle their favorite status
    const updatePromises = allUserFiles.map((file) =>
      databases.updateDocument(appwriteConfig.databaseId, "files", file.$id, {
        isFavorite: !file.isFavorite,
        updatedAt: new Date().toISOString(),
      })
    );

    await Promise.all(updatePromises);

    // Count how many were added vs removed
    const addedToFavorites = allUserFiles.filter(
      (file) => !file.isFavorite
    ).length;
    const removedFromFavorites = allUserFiles.filter(
      (file) => file.isFavorite
    ).length;

    console.log(
      `⭐ Batch Favorite: Successfully processed ${userFileIds.length} files`
    );
    console.log(
      `⭐ Batch Favorite: Added to favorites: ${addedToFavorites}, Removed from favorites: ${removedFromFavorites}`
    );

    return parseStringify({
      success: true,
      message: `Updated favorite status for ${userFileIds.length} files`,
      processedCount: userFileIds.length,
      addedToFavorites,
      removedFromFavorites,
    });
  } catch (error) {
    console.error("Batch toggle favorite error:", error);
    return parseStringify({
      success: false,
      error: "Failed to update favorite status",
    });
  }
};

// Utility function for rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Rate limiting helper
const rateLimitedBatch = async <T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>,
  delayMs: number = 100 // 100ms delay between batches
) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);

    // Add delay between batches to prevent server overload
    if (i + batchSize < items.length) {
      await delay(delayMs);
    }
  }
};
