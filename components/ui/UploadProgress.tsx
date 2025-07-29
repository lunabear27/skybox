import React from "react";
import {
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Clock,
  Zap,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
} from "lucide-react";
import { Button } from "./button";
import {
  UploadProgressData,
  formatFileSize,
  formatSpeed,
  formatTime,
  uploadProgressTracker,
} from "@/lib/utils/uploadProgress";
import { colors } from "@/lib/design-system";

interface UploadProgressProps {
  uploads: UploadProgressData[];
  onRemove?: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onPause?: (fileId: string) => void;
  onResume?: (fileId: string) => void;
  className?: string;
}

const getFileIcon = (fileName: string, mimeType?: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (mimeType?.startsWith("image/")) return <ImageIcon size={16} />;
  if (mimeType?.startsWith("video/")) return <Video size={16} />;
  if (mimeType?.startsWith("audio/")) return <Music size={16} />;

  switch (extension) {
    case "pdf":
      return <FileText size={16} />;
    case "doc":
    case "docx":
      return <FileText size={16} />;
    case "zip":
    case "rar":
    case "7z":
      return <Archive size={16} />;
    default:
      return <File size={16} />;
  }
};

const getStatusColor = (status: UploadProgressData["status"]) => {
  switch (status) {
    case "completed":
      return colors.success[600];
    case "error":
      return colors.error[600];
    case "uploading":
      return colors.primary[600];
    case "paused":
      return colors.warning[600];
    case "queued":
      return colors.secondary[500];
    default:
      return colors.secondary[500];
  }
};

const getStatusIcon = (status: UploadProgressData["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle size={16} />;
    case "error":
      return <XCircle size={16} />;
    case "uploading":
      return (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      );
    case "paused":
      return <Pause size={16} />;
    case "queued":
      return <Clock size={16} />;
    default:
      return <Clock size={16} />;
  }
};

export const UploadProgress: React.FC<UploadProgressProps> = ({
  uploads,
  onRemove,
  onRetry,
  onPause,
  onResume,
  className = "",
}) => {
  if (uploads.length === 0) return null;

  const stats = {
    total: uploads.length,
    completed: uploads.filter((u) => u.status === "completed").length,
    uploading: uploads.filter((u) => u.status === "uploading").length,
    error: uploads.filter((u) => u.status === "error").length,
    paused: uploads.filter((u) => u.status === "paused").length,
    queued: uploads.filter((u) => u.status === "queued").length,
  };

  const totalSize = uploads.reduce((sum, u) => sum + u.fileSize, 0);
  const uploadedSize = uploads.reduce(
    (sum, u) => sum + (u.uploadedBytes || 0),
    0
  );
  const overallProgress = totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            <Zap className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Upload Progress
            </h3>
            <p className="text-sm text-gray-600">
              {stats.uploading > 0 && `${stats.uploading} uploading`}
              {stats.completed > 0 &&
                `${stats.completed > 0 ? " • " : ""}${
                  stats.completed
                } completed`}
              {stats.error > 0 &&
                `${stats.error > 0 ? " • " : ""}${stats.error} failed`}
            </p>
          </div>
        </div>

        {stats.uploading > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-sm text-blue-600 font-medium">Active</span>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      {stats.total > 1 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm text-gray-600">
              {formatFileSize(uploadedSize)} / {formatFileSize(totalSize)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{Math.round(overallProgress)}% complete</span>
            <span>
              {stats.completed} of {stats.total} files
            </span>
          </div>
        </div>
      )}

      {/* Individual Uploads */}
      <div className="space-y-3">
        {uploads.map((upload) => {
          const isCompleted = upload.status === "completed";
          const isUploading = upload.status === "uploading";
          const isError = upload.status === "error";
          const isPaused = upload.status === "paused";
          const isQueued = upload.status === "queued";

          return (
            <div
              key={upload.fileId}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                isCompleted
                  ? "bg-green-50 border-green-200"
                  : isUploading
                  ? "bg-blue-50 border-blue-200"
                  : isError
                  ? "bg-red-50 border-red-200"
                  : isPaused
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              {/* File Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-100"
                        : isUploading
                        ? "bg-blue-100"
                        : isError
                        ? "bg-red-100"
                        : isPaused
                        ? "bg-yellow-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {getFileIcon(upload.fileName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(upload.fileSize)}
                    </p>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(upload.status)}
                    <span
                      className={`text-xs font-medium ${
                        isCompleted
                          ? "text-green-600"
                          : isUploading
                          ? "text-blue-600"
                          : isError
                          ? "text-red-600"
                          : isPaused
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                    >
                      {upload.status === "uploading"
                        ? `${Math.round(upload.progress)}%`
                        : upload.status === "completed"
                        ? "Complete"
                        : upload.status === "error"
                        ? "Failed"
                        : upload.status === "paused"
                        ? "Paused"
                        : "Queued"}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1">
                    {isError && onRetry && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRetry(upload.fileId)}
                        className="h-6 px-2 text-xs"
                      >
                        Retry
                      </Button>
                    )}

                    {isUploading && onPause && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPause(upload.fileId)}
                        className="h-6 px-2 text-xs"
                      >
                        <Pause size={12} />
                      </Button>
                    )}

                    {isPaused && onResume && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResume(upload.fileId)}
                        className="h-6 px-2 text-xs"
                      >
                        <Play size={12} />
                      </Button>
                    )}

                    {onRemove && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemove(upload.fileId)}
                        className="h-6 px-2 text-xs text-gray-500 hover:text-red-600"
                      >
                        <XCircle size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-green-500"
                      : isUploading
                      ? "bg-blue-500"
                      : isError
                      ? "bg-red-500"
                      : isPaused
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>

              {/* Progress Details */}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  {isUploading && upload.speed && (
                    <span>Speed: {formatSpeed(upload.speed)}</span>
                  )}
                  {isUploading && upload.eta && (
                    <span>ETA: {formatTime(upload.eta)}</span>
                  )}
                  {upload.startTime && (
                    <span>
                      Started: {new Date(upload.startTime).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  {isUploading && (
                    <span>
                      {formatFileSize(upload.uploadedBytes || 0)} /{" "}
                      {formatFileSize(upload.fileSize)}
                    </span>
                  )}
                  {isError && upload.error && (
                    <span className="text-red-600">{upload.error}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success Message */}
      {stats.completed > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-green-600" size={16} />
            <span className="text-sm font-medium text-green-700">
              {stats.completed} file{stats.completed !== 1 ? "s" : ""} uploaded
              successfully!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadProgress;
