import { ID } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";

export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

export const uploadFile = async (
  file: File,
  userId: string,
  parentId?: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    const { storage, databases } = await createAdminClient();

    // Upload to Appwrite Storage
    const storageId = ID.unique();
    
    // Create a promise that resolves when upload is complete
    const uploadPromise = storage.createFile(
      appwriteConfig.bucketId,
      storageId,
      file
    );

    // Simulate progress updates (Appwrite doesn't provide real-time progress)
    if (onProgress) {
      const progressInterval = setInterval(() => {
        // Simulate progress
        const progress = Math.min(90, Math.random() * 80 + 10);
        onProgress(progress);
      }, 500);

      uploadPromise.finally(() => {
        clearInterval(progressInterval);
        onProgress(100);
      });
    }

    const uploadedFile = await uploadPromise;

    // Get file URL
    const fileUrl = storage.getFileView(appwriteConfig.bucketId, storageId);

    // Save file metadata to database
    const fileDoc = await databases.createDocument(
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
        url: fileUrl.toString(),
      }
    );

    return {
      success: true,
      fileId: fileDoc.$id,
      url: fileUrl.toString(),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: "Failed to upload file",
    };
  }
};

export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "📽️";
  if (mimeType.includes("zip") || mimeType.includes("archive")) return "🗜️";
  if (mimeType.includes("text")) return "📄";
  return "📁";
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i)) + " " + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  
  return date.toLocaleDateString();
};
