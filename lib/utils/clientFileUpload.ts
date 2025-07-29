"use client";

import { Client, Storage, Databases, ID, Account } from "appwrite";
import { appwriteConfig } from "../appwrite/config";

// Create client-side Appwrite client
const createClientSideClient = () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

  return {
    storage: new Storage(client),
    databases: new Databases(client),
    account: new Account(client),
    client,
  };
};

// Get user data from cookies
const getUserDataFromCookies = () => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const userDataCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("user_data=")
  );

  if (userDataCookie) {
    try {
      const userData = JSON.parse(
        decodeURIComponent(userDataCookie.split("=")[1])
      );
      return userData;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  return null;
};

export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

export const uploadFileClient = async (
  file: File,
  userId: string,
  sessionToken: string,
  parentId?: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    const { storage, databases, account, client } = createClientSideClient();

    // Handle custom sessions vs regular Appwrite sessions
    if (sessionToken.startsWith("custom_")) {
      console.log(
        "🔄 Handling custom session - creating temporary Appwrite session"
      );

      // Get user data from cookies
      const userData = getUserDataFromCookies();
      if (!userData || !userData.email) {
        throw new Error("User data not found in cookies");
      }

      // We need to get the password from somewhere or use a different approach
      // For now, let's try to use the admin client approach
      console.log(
        "⚠️ Custom session detected - using server-side upload instead"
      );

      // Call server action for upload instead
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      if (parentId) formData.append("parentId", parentId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } else {
      console.log("✅ Using regular Appwrite session");
      // Set session for authentication
      client.setSession(sessionToken);
    }

    // Upload to Appwrite Storage
    const storageId = ID.unique();

    // Simulate progress updates (Appwrite doesn't provide real-time progress)
    let progressInterval: NodeJS.Timeout | null = null;
    if (onProgress) {
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress = Math.min(90, currentProgress + Math.random() * 20);
        onProgress(currentProgress);
      }, 500);
    }

    try {
      const { Permission, Role } = await import("appwrite");
      const uploadedFile = await storage.createFile(
        appwriteConfig.bucketId,
        storageId,
        file,
        [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
        ]
      );

      console.log("✅ File uploaded to storage:", uploadedFile.$id);
      console.log("🪣 Bucket ID:", appwriteConfig.bucketId);
      // Get file URL (remove any trailing /v1, /v1/, or slashes from endpoint, then add /storage/...)
      const baseUrl = appwriteConfig.endpointUrl;

      const fileUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${appwriteConfig.bucketId}/files/${storageId}/download?project=${appwriteConfig.projectId}`;
      console.log("🔗 File Download URL:", fileUrl);

      if (progressInterval) {
        clearInterval(progressInterval);
        onProgress?.(100);
      }

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
          url: fileUrl,
        }
      );

      return {
        success: true,
        fileId: fileDoc.$id,
        url: fileUrl,
      };
    } catch (uploadError) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      throw uploadError;
    }
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
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

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

// Enhanced date formatting with multiple options
export const formatDateDetailed = (
  dateString: string,
  format: "relative" | "short" | "long" | "full" = "relative"
): string => {
  const date = new Date(dateString);
  const now = new Date();

  // Validate date
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  switch (format) {
    case "relative":
      return formatRelativeDate(date, now);
    case "short":
      return formatShortDate(date);
    case "long":
      return formatLongDate(date);
    case "full":
      return formatFullDate(date);
    default:
      return formatRelativeDate(date, now);
  }
};

// Format relative time (e.g., "2 hours ago", "3 days ago")
const formatRelativeDate = (date: Date, now: Date): string => {
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return diffSeconds === 1 ? "1 second ago" : `${diffSeconds} seconds ago`;
  }
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  if (diffDays < 7) {
    return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
  }
  if (diffWeeks < 4) {
    return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
  }
  if (diffMonths < 12) {
    return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
  }
  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
};

// Format short date (e.g., "Dec 15, 2023")
const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format long date (e.g., "December 15, 2023")
const formatLongDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// Format full date with time (e.g., "December 15, 2023 at 2:30 PM")
const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Format time only (e.g., "2:30 PM")
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid time";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Format date and time separately for detailed display
export const formatDateTime = (
  dateString: string
): { date: string; time: string; relative: string } => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      date: "Invalid date",
      time: "Invalid time",
      relative: "Invalid date",
    };
  }

  return {
    date: formatShortDate(date),
    time: formatTime(dateString),
    relative: formatRelativeDate(date, new Date()),
  };
};
