import { useState, useCallback, useRef } from "react";
import {
  uploadProgressTracker,
  UploadProgressData,
} from "@/lib/utils/uploadProgress";

interface UploadOptions {
  onProgress?: (fileId: string, progress: number) => void;
  onComplete?: (fileId: string, result: any) => void;
  onError?: (fileId: string, error: string) => void;
  maxConcurrent?: number;
  retryAttempts?: number;
}

interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

export const useUpload = (options: UploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const activeUploads = useRef<Set<string>>(new Set());
  const retryCounts = useRef<Map<string, number>>(new Map());

  const {
    onProgress,
    onComplete,
    onError,
    maxConcurrent = 3,
    retryAttempts = 3,
  } = options;

  // Upload a single file with progress tracking
  const uploadFile = useCallback(
    async (
      file: File,
      userId: string,
      parentId?: string
    ): Promise<UploadResult> => {
      const fileId = `upload_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Initialize upload progress
      uploadProgressTracker.initializeUpload(fileId, file.name, file.size);

      try {
        // Start upload
        uploadProgressTracker.startUpload(fileId);

        // Create form data
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        if (parentId) formData.append("parentId", parentId);

        // Create XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Track upload progress
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              uploadProgressTracker.updateProgress(
                fileId,
                event.loaded,
                event.total
              );
              onProgress?.(fileId, progress);
            }
          });

          // Handle response
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                if (result.success) {
                  uploadProgressTracker.completeUpload(fileId);
                  onComplete?.(fileId, result);
                  resolve(result);
                } else {
                  const error = result.error || "Upload failed";
                  uploadProgressTracker.setUploadError(fileId, error);
                  onError?.(fileId, error);
                  reject(new Error(error));
                }
              } catch (parseError) {
                const error = "Failed to parse response";
                uploadProgressTracker.setUploadError(fileId, error);
                onError?.(fileId, error);
                reject(new Error(error));
              }
            } else {
              const error = `HTTP ${xhr.status}: ${xhr.statusText}`;
              uploadProgressTracker.setUploadError(fileId, error);
              onError?.(fileId, error);
              reject(new Error(error));
            }
          });

          // Handle network errors
          xhr.addEventListener("error", () => {
            const error = "Network error occurred";
            uploadProgressTracker.setUploadError(fileId, error);
            onError?.(fileId, error);
            reject(new Error(error));
          });

          // Handle timeout
          xhr.addEventListener("timeout", () => {
            const error = "Upload timeout";
            uploadProgressTracker.setUploadError(fileId, error);
            onError?.(fileId, error);
            reject(new Error(error));
          });

          // Send request
          xhr.open("POST", "/api/upload");
          xhr.timeout = 300000; // 5 minutes timeout
          xhr.send(formData);
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        uploadProgressTracker.setUploadError(fileId, errorMessage);
        onError?.(fileId, errorMessage);
        throw error;
      }
    },
    [onProgress, onComplete, onError]
  );

  // Upload multiple files with queue management
  const uploadFiles = useCallback(
    async (
      files: File[],
      userId: string,
      parentId?: string
    ): Promise<UploadResult[]> => {
      setIsUploading(true);
      const results: UploadResult[] = [];

      // Add files to queue
      const fileQueue = files.map((file, index) => ({
        file,
        id: `upload_${Date.now()}_${index}`,
        retries: 0,
      }));

      // Process queue with concurrency limit
      const processQueue = async () => {
        const activePromises: Promise<void>[] = [];

        for (const fileItem of fileQueue) {
          // Wait if we've reached the concurrency limit
          while (activePromises.length >= maxConcurrent) {
            await Promise.race(activePromises);
          }

          // Start upload
          const uploadPromise = (async () => {
            try {
              activeUploads.current.add(fileItem.id);
              const result = await uploadFile(fileItem.file, userId, parentId);
              results.push(result);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Upload failed";

              // Retry logic
              if (fileItem.retries < retryAttempts) {
                fileItem.retries++;
                retryCounts.current.set(fileItem.id, fileItem.retries);

                // Wait before retry (exponential backoff)
                await new Promise((resolve) =>
                  setTimeout(resolve, Math.pow(2, fileItem.retries) * 1000)
                );

                // Retry the upload
                try {
                  const retryResult = await uploadFile(
                    fileItem.file,
                    userId,
                    parentId
                  );
                  results.push(retryResult);
                } catch (retryError) {
                  const retryErrorMessage =
                    retryError instanceof Error
                      ? retryError.message
                      : "Retry failed";
                  results.push({ success: false, error: retryErrorMessage });
                }
              } else {
                results.push({ success: false, error: errorMessage });
              }
            } finally {
              activeUploads.current.delete(fileItem.id);
            }
          })();

          activePromises.push(uploadPromise);
        }

        // Wait for all uploads to complete
        await Promise.all(activePromises);
      };

      try {
        await processQueue();
      } finally {
        setIsUploading(false);
      }

      return results;
    },
    [uploadFile, maxConcurrent, retryAttempts]
  );

  // Retry a failed upload
  const retryUpload = useCallback(
    async (
      fileId: string,
      file: File,
      userId: string,
      parentId?: string
    ): Promise<UploadResult> => {
      const currentRetries = retryCounts.current.get(fileId) || 0;

      if (currentRetries >= retryAttempts) {
        throw new Error("Maximum retry attempts reached");
      }

      retryCounts.current.set(fileId, currentRetries + 1);

      // Remove the failed upload from tracking
      uploadProgressTracker.removeUpload(fileId);

      // Start a new upload
      return uploadFile(file, userId, parentId);
    },
    [uploadFile, retryAttempts]
  );

  // Pause upload (for future implementation)
  const pauseUpload = useCallback((fileId: string) => {
    uploadProgressTracker.pauseUpload(fileId);
  }, []);

  // Resume upload (for future implementation)
  const resumeUpload = useCallback((fileId: string) => {
    uploadProgressTracker.resumeUpload(fileId);
  }, []);

  // Cancel upload
  const cancelUpload = useCallback((fileId: string) => {
    uploadProgressTracker.removeUpload(fileId);
    activeUploads.current.delete(fileId);
  }, []);

  // Get upload statistics
  const getUploadStats = useCallback(() => {
    return uploadProgressTracker.getUploadStats();
  }, []);

  // Clear all uploads
  const clearUploads = useCallback(() => {
    uploadProgressTracker.clearAll();
    activeUploads.current.clear();
    retryCounts.current.clear();
  }, []);

  return {
    uploadFile,
    uploadFiles,
    retryUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    getUploadStats,
    clearUploads,
    isUploading,
    activeUploads: activeUploads.current.size,
  };
};
