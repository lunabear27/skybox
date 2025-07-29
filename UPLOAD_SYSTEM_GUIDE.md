# 🚀 Enhanced Upload System Guide

## Overview

The SkyBox application now features a comprehensive upload system with accurate progress tracking, real-time speed calculation, ETA estimation, and robust error handling. This system provides users with a professional file upload experience.

## ✨ Key Features

### 🎯 **Accurate Progress Tracking**

- Real-time upload progress with percentage completion
- Speed calculation (bytes per second)
- ETA (Estimated Time of Arrival) calculation
- Visual progress bars with smooth animations

### 🔄 **Robust Upload Management**

- Concurrent upload support (configurable limit)
- Automatic retry mechanism with exponential backoff
- Pause/Resume functionality (future implementation)
- Upload queue management

### 🛡️ **Error Handling & Recovery**

- Comprehensive error detection and reporting
- Automatic retry on network failures
- Graceful error recovery
- User-friendly error messages

### 📊 **Real-time Statistics**

- Overall upload progress for multiple files
- Individual file status tracking
- Upload speed monitoring
- Success/failure statistics

## 🏗️ Architecture

### Core Components

#### 1. **Upload Progress Tracker** (`lib/utils/uploadProgress.ts`)

```typescript
export class UploadProgressTracker {
  // Manages upload state and progress
  initializeUpload(fileId: string, fileName: string, fileSize: number): void;
  updateProgress(
    fileId: string,
    uploadedBytes: number,
    totalBytes?: number
  ): void;
  completeUpload(fileId: string): void;
  setUploadError(fileId: string, error: string): void;
  // ... more methods
}
```

#### 2. **Upload Hook** (`lib/hooks/useUpload.ts`)

```typescript
export const useUpload = (options: UploadOptions = {}) => {
  // Provides upload functionality with progress tracking
  const { uploadFiles, isUploading, activeUploads } = useUpload({
    onProgress: (fileId, progress) => {
      /* ... */
    },
    onComplete: (fileId, result) => {
      /* ... */
    },
    onError: (fileId, error) => {
      /* ... */
    },
    maxConcurrent: 3,
    retryAttempts: 3,
  });
};
```

#### 3. **Upload Progress Component** (`components/ui/UploadProgress.tsx`)

```typescript
export const UploadProgress: React.FC<UploadProgressProps> = ({
  uploads,
  onRemove,
  onRetry,
  onPause,
  onResume,
  className = "",
}) => {
  // Renders upload progress with interactive controls
};
```

#### 4. **Enhanced API Route** (`app/api/upload/route.ts`)

```typescript
export async function POST(request: NextRequest) {
  // Handles file uploads with validation and error handling
  // Supports both regular and custom Appwrite sessions
  // Includes file size validation and cleanup on errors
}
```

## 🎨 User Interface

### Upload Progress Display

The upload progress component provides:

- **File Information**: Name, size, and type with appropriate icons
- **Progress Bar**: Visual representation of upload progress
- **Status Indicators**: Queued, Uploading, Completed, Error, Paused
- **Real-time Metrics**: Speed, ETA, uploaded/total bytes
- **Action Buttons**: Retry, Pause, Resume, Remove

### Visual States

```typescript
// Different visual states for upload progress
const visualStates = {
  queued: "bg-gray-50 border-gray-200",
  uploading: "bg-blue-50 border-blue-200 shadow-md",
  completed: "bg-green-50 border-green-200 shadow-sm",
  error: "bg-red-50 border-red-200 shadow-sm",
  paused: "bg-yellow-50 border-yellow-200",
};
```

## 🔧 Configuration

### Upload Options

```typescript
interface UploadOptions {
  onProgress?: (fileId: string, progress: number) => void;
  onComplete?: (fileId: string, result: any) => void;
  onError?: (fileId: string, error: string) => void;
  maxConcurrent?: number; // Default: 3
  retryAttempts?: number; // Default: 3
}
```

### File Validation

- **Maximum File Size**: 50MB per file
- **Supported Formats**: All file types
- **Concurrent Uploads**: Configurable (default: 3)
- **Retry Attempts**: Configurable (default: 3)

## 📈 Performance Features

### 1. **Concurrent Upload Management**

```typescript
// Process multiple files concurrently
const processQueue = async () => {
  const activePromises: Promise<void>[] = [];

  for (const fileItem of fileQueue) {
    while (activePromises.length >= maxConcurrent) {
      await Promise.race(activePromises);
    }
    // Start upload...
  }
};
```

### 2. **Real-time Progress Tracking**

```typescript
// XMLHttpRequest for accurate progress
xhr.upload.addEventListener("progress", (event) => {
  if (event.lengthComputable) {
    const progress = (event.loaded / event.total) * 100;
    uploadProgressTracker.updateProgress(fileId, event.loaded, event.total);
  }
});
```

### 3. **Speed and ETA Calculation**

```typescript
// Calculate upload speed and ETA
const timeDiff = (now - lastUpdateTime) / 1000;
const bytesDiff = uploadedBytes - previousUploadedBytes;
const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
const eta = speed > 0 ? remainingBytes / speed : 0;
```

## 🛠️ Usage Examples

### Basic Upload Implementation

```typescript
import { useUpload } from "@/lib/hooks/useUpload";
import { useUploadProgress } from "@/lib/utils/uploadProgress";

function UploadComponent() {
  const { progressState, uploadStats } = useUploadProgress();
  const { uploadFiles, isUploading } = useUpload({
    onProgress: (fileId, progress) => {
      console.log(`Upload ${fileId}: ${progress}%`);
    },
    onComplete: (fileId, result) => {
      console.log(`Upload completed: ${fileId}`);
    },
    onError: (fileId, error) => {
      console.error(`Upload failed: ${fileId} - ${error}`);
    },
  });

  const handleFileUpload = async (files: File[]) => {
    try {
      const results = await uploadFiles(files, userId);
      console.log("Upload results:", results);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <div>
      <UploadProgress uploads={Object.values(progressState)} />
      {/* Upload interface */}
    </div>
  );
}
```

### Advanced Upload with Custom Options

```typescript
const { uploadFiles, retryUpload, cancelUpload } = useUpload({
  maxConcurrent: 5, // Allow 5 concurrent uploads
  retryAttempts: 5, // Retry failed uploads 5 times
  onProgress: (fileId, progress) => {
    // Custom progress handling
  },
  onComplete: (fileId, result) => {
    // Custom completion handling
  },
  onError: (fileId, error) => {
    // Custom error handling
  },
});
```

## 🔍 Error Handling

### Common Error Scenarios

1. **Network Errors**

   - Automatic retry with exponential backoff
   - User notification of network issues
   - Graceful degradation

2. **File Size Exceeded**

   - Clear error message with file size limit
   - Suggestion to compress or split files

3. **Authentication Errors**

   - Session validation
   - Redirect to login if needed

4. **Server Errors**
   - Detailed error logging
   - User-friendly error messages
   - Automatic cleanup of partial uploads

### Error Recovery

```typescript
// Automatic retry with exponential backoff
if (fileItem.retries < retryAttempts) {
  fileItem.retries++;
  await new Promise((resolve) =>
    setTimeout(resolve, Math.pow(2, fileItem.retries) * 1000)
  );
  // Retry upload...
}
```

## 📊 Monitoring & Analytics

### Upload Statistics

```typescript
const uploadStats = {
  total: uploads.length,
  queued: uploads.filter((u) => u.status === "queued").length,
  uploading: uploads.filter((u) => u.status === "uploading").length,
  completed: uploads.filter((u) => u.status === "completed").length,
  error: uploads.filter((u) => u.status === "error").length,
  totalSize: uploads.reduce((sum, u) => sum + u.fileSize, 0),
  uploadedSize: uploads.reduce((sum, u) => sum + (u.uploadedBytes || 0), 0),
};
```

### Performance Metrics

- Upload speed tracking
- Success/failure rates
- Average upload time
- Concurrent upload efficiency

## 🚀 Future Enhancements

### Planned Features

1. **Resumable Uploads**

   - Chunk-based uploads
   - Resume from interruption
   - Cross-device upload continuation

2. **Advanced Progress Visualization**

   - Upload speed graphs
   - Network quality indicators
   - Predictive completion times

3. **Batch Operations**

   - Bulk file operations
   - Upload scheduling
   - Priority queuing

4. **Cloud Integration**
   - Direct cloud uploads
   - Multi-cloud support
   - Automatic backup

## 🔧 Troubleshooting

### Common Issues

1. **Upload Stuck at 0%**

   - Check network connection
   - Verify file size limits
   - Check browser console for errors

2. **Slow Upload Speed**

   - Check network bandwidth
   - Reduce concurrent uploads
   - Verify server performance

3. **Upload Failures**
   - Check error messages in console
   - Verify file permissions
   - Check server logs

### Debug Information

```typescript
// Enable debug logging
console.log("Upload progress:", progressState);
console.log("Upload stats:", uploadStats);
console.log("Active uploads:", activeUploads);
```

## 📝 Best Practices

### For Developers

1. **Always handle errors gracefully**
2. **Provide user feedback for all operations**
3. **Use appropriate file size limits**
4. **Implement proper cleanup on errors**
5. **Test with various file types and sizes**

### For Users

1. **Check file size before uploading**
2. **Ensure stable internet connection**
3. **Don't close browser during uploads**
4. **Use supported file formats**
5. **Monitor upload progress**

## 🎉 Conclusion

The enhanced upload system provides a professional, reliable, and user-friendly file upload experience. With accurate progress tracking, robust error handling, and comprehensive monitoring, users can confidently upload their files with full visibility into the process.

The system is designed to be scalable, maintainable, and extensible for future enhancements while providing immediate value through improved user experience and reliability.
