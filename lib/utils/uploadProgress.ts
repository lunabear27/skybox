import React from "react";

// Enhanced Upload Progress Tracking System
// Provides accurate progress tracking, speed calculation, and ETA estimation

export interface UploadProgressData {
  fileId: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: "queued" | "uploading" | "completed" | "error" | "paused";
  error?: string;
  startTime?: number;
  endTime?: number;
  speed?: number; // bytes per second
  eta?: number; // estimated time remaining in seconds
  uploadedBytes?: number;
  lastUpdateTime?: number;
}

export interface UploadProgressState {
  [fileId: string]: UploadProgressData;
}

export class UploadProgressTracker {
  private progressState: UploadProgressState = {};
  private listeners: ((state: UploadProgressState) => void)[] = [];

  // Initialize upload progress
  initializeUpload(fileId: string, fileName: string, fileSize: number): void {
    this.progressState[fileId] = {
      fileId,
      fileName,
      fileSize,
      progress: 0,
      status: "queued",
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      uploadedBytes: 0,
    };
    this.notifyListeners();
  }

  // Start upload
  startUpload(fileId: string): void {
    if (this.progressState[fileId]) {
      this.progressState[fileId].status = "uploading";
      this.progressState[fileId].startTime = Date.now();
      this.progressState[fileId].lastUpdateTime = Date.now();
      this.notifyListeners();
    }
  }

  // Update progress with real data
  updateProgress(
    fileId: string,
    uploadedBytes: number,
    totalBytes?: number
  ): void {
    const upload = this.progressState[fileId];
    if (!upload || upload.status !== "uploading") return;

    const now = Date.now();
    const totalSize = totalBytes || upload.fileSize;
    const progress = Math.min(100, (uploadedBytes / totalSize) * 100);

    // Calculate speed (bytes per second)
    const timeDiff = (now - (upload.lastUpdateTime || now)) / 1000;
    const bytesDiff = uploadedBytes - (upload.uploadedBytes || 0);
    const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

    // Calculate ETA
    const remainingBytes = totalSize - uploadedBytes;
    const eta = speed > 0 ? remainingBytes / speed : 0;

    this.progressState[fileId] = {
      ...upload,
      progress,
      uploadedBytes,
      speed,
      eta,
      lastUpdateTime: now,
    };

    this.notifyListeners();
  }

  // Complete upload
  completeUpload(fileId: string): void {
    if (this.progressState[fileId]) {
      this.progressState[fileId] = {
        ...this.progressState[fileId],
        status: "completed",
        progress: 100,
        endTime: Date.now(),
        uploadedBytes: this.progressState[fileId].fileSize,
        eta: 0,
      };
      this.notifyListeners();
    }
  }

  // Handle upload error
  setUploadError(fileId: string, error: string): void {
    if (this.progressState[fileId]) {
      this.progressState[fileId] = {
        ...this.progressState[fileId],
        status: "error",
        error,
        endTime: Date.now(),
      };
      this.notifyListeners();
    }
  }

  // Pause upload
  pauseUpload(fileId: string): void {
    if (this.progressState[fileId]) {
      this.progressState[fileId].status = "paused";
      this.notifyListeners();
    }
  }

  // Resume upload
  resumeUpload(fileId: string): void {
    if (this.progressState[fileId]) {
      this.progressState[fileId].status = "uploading";
      this.notifyListeners();
    }
  }

  // Remove upload from tracking
  removeUpload(fileId: string): void {
    delete this.progressState[fileId];
    this.notifyListeners();
  }

  // Get current progress state
  getProgressState(): UploadProgressState {
    return { ...this.progressState };
  }

  // Get specific upload progress
  getUploadProgress(fileId: string): UploadProgressData | undefined {
    return this.progressState[fileId];
  }

  // Get upload statistics
  getUploadStats() {
    const uploads = Object.values(this.progressState);
    return {
      total: uploads.length,
      queued: uploads.filter((u) => u.status === "queued").length,
      uploading: uploads.filter((u) => u.status === "uploading").length,
      completed: uploads.filter((u) => u.status === "completed").length,
      error: uploads.filter((u) => u.status === "error").length,
      paused: uploads.filter((u) => u.status === "paused").length,
      totalSize: uploads.reduce((sum, u) => sum + u.fileSize, 0),
      uploadedSize: uploads.reduce((sum, u) => sum + (u.uploadedBytes || 0), 0),
    };
  }

  // Subscribe to progress updates
  subscribe(listener: (state: UploadProgressState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getProgressState()));
  }

  // Clear all uploads
  clearAll(): void {
    this.progressState = {};
    this.notifyListeners();
  }
}

// Utility functions for progress tracking
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatSpeed = (bytesPerSecond: number): string => {
  return formatFileSize(bytesPerSecond) + "/s";
};

export const formatTime = (seconds: number): string => {
  if (seconds === 0 || !isFinite(seconds)) return "Calculating...";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const calculateProgressPercentage = (
  uploaded: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (uploaded / total) * 100));
};

// Create a global upload progress tracker instance
export const uploadProgressTracker = new UploadProgressTracker();

// React hook for using upload progress
export const useUploadProgress = () => {
  const [progressState, setProgressState] = React.useState<UploadProgressState>(
    {}
  );

  React.useEffect(() => {
    const unsubscribe = uploadProgressTracker.subscribe(setProgressState);
    return unsubscribe;
  }, []);

  return {
    progressState,
    uploadStats: uploadProgressTracker.getUploadStats(),
    removeUpload: uploadProgressTracker.removeUpload.bind(
      uploadProgressTracker
    ),
    clearAll: uploadProgressTracker.clearAll.bind(uploadProgressTracker),
  };
};
