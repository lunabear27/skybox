"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  FileText,
  Folder,
  File as FilePdf,
  Archive as FileArchive,
  Video,
  Trash2,
  Share2,
  History,
  File,
  CloudUpload,
  MoreHorizontal,
  XCircle,
  CheckCircle,
  Edit3,
  Download,
  Heart,
  HeartOff,
  RefreshCw,
  PieChart,
  ArrowUp,
  TrendingUp,
  HardDrive,
  BarChart3,
  Activity,
  CheckSquare,
  Square,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getFiles,
  getFilesByType,
  getFavoriteFiles,
  getDeletedFiles,
  getRecentActivity,
  getStorageUsage,
  searchFiles,
  createFolder,
  toggleFavorite,
  moveToTrash,
  restoreFromTrash,
  permanentlyDelete,
  renameItem,
  FileItem,
  batchMoveToTrash,
  batchRestoreFromTrash,
  batchPermanentlyDelete,
  batchToggleFavorite,
  optimizedEmptyTrash,
} from "@/lib/actions/file.actions";
import {
  getUserSubscription,
  startTrial,
  upgradePlan,
  cancelSubscription,
} from "@/lib/actions/subscription.actions";
import { SUBSCRIPTION_PLANS } from "@/lib/types/subscription";
import {
  formatFileSize,
  formatDate,
  formatDateDetailed,
  formatDateTime,
} from "@/lib/utils/clientFileUpload";
import { useDropzone } from "react-dropzone";
import * as Popover from "@radix-ui/react-popover";
import { Spinner } from "@/components/ui/Spinner";
import { uploadProgressTracker } from "@/lib/utils/uploadProgress";
import { useStripe } from "@/lib/hooks/useStripe";

interface User {
  $id: string;
  email: string;
  name: string;
  $createdAt: string;
  emailVerification: boolean;
}

interface DashboardContentProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  user: User;
  onSignOut: () => void;
  searchQuery?: string;
  refreshStorageUsage?: () => void;
  storageUsage?: { used: number; total: number };
}

interface StorageUsage {
  totalSize: number;
  maxStorage: number;
  usagePercentage: number;
  breakdown: {
    documents: number;
    photos: number;
    videos: number;
    others: number;
  };
  totalFiles: number;
}

// Add this helper at the top (after imports):
function formatGB(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "0 GB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export default function DashboardContentFixed({
  activeSection,
  setActiveSection,
  user,
  onSignOut,
  searchQuery = "",
  refreshStorageUsage,
  storageUsage: parentStorageUsage,
}: DashboardContentProps) {
  // Initialize Stripe hook
  const { createCheckoutSession } = useStripe();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQueryState, setSearchQueryState] = useState("");
  const [localStorageUsage, setLocalStorageUsage] =
    useState<StorageUsage | null>(null);

  // Use parent's storage usage if available, otherwise use local
  const storageUsage =
    parentStorageUsage && parentStorageUsage.used > 0
      ? {
          totalSize: parentStorageUsage.used,
          maxStorage: parentStorageUsage.total,
          usagePercentage:
            parentStorageUsage.total > 0
              ? Math.round(
                  (parentStorageUsage.used / parentStorageUsage.total) * 100
                )
              : 0,
          breakdown: localStorageUsage?.breakdown || {
            documents: 0,
            photos: 0,
            videos: 0,
            others: 0,
          },
          totalFiles: localStorageUsage?.totalFiles || 0,
        }
      : localStorageUsage;

  // Enhanced upload progress tracking
  const [progressState, setProgressState] = useState<{
    [key: string]: unknown;
  }>({});
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    queued: 0,
    uploading: 0,
    completed: 0,
    error: 0,
    paused: 0,
    totalSize: 0,
    uploadedSize: 0,
  });

  // Subscribe to upload progress updates
  useEffect(() => {
    const unsubscribe = uploadProgressTracker.subscribe((state) => {
      setProgressState(state);
      setUploadStats(uploadProgressTracker.getUploadStats());
    });
    return unsubscribe;
  }, []);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [pendingTrashFileId, setPendingTrashFileId] = useState<string | null>(
    null
  );
  const [trashPopoverFileId, setTrashPopoverFileId] = useState<string | null>(
    null
  );
  const [deleteAllPopoverOpen, setDeleteAllPopoverOpen] = useState(false);
  const [permanentDeletePopoverFileId, setPermanentDeletePopoverFileId] =
    useState<string | null>(null);
  const [activeFileMenu, setActiveFileMenu] = useState<string | null>(null);

  // Bulk Operations state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionProgress, setBulkActionProgress] = useState<{
    current: number;
    total: number;
    action: string;
  } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);

  // Recent Activity state
  const [activityFilter, setActivityFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");

  // Home page state
  const [quickStats, setQuickStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    recentUploads: 0,
    favoriteFiles: 0,
    storageUsed: 0,
    storageTotal: 0,
  });
  const [recentActivity, setRecentActivity] = useState<FileItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Favorites page state
  const [favoriteFiles, setFavoriteFiles] = useState<FileItem[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoriteFilter, setFavoriteFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Storage usage page state
  const [showLargeFiles, setShowLargeFiles] = useState(false);
  const [largeFiles, setLargeFiles] = useState<FileItem[]>([]);
  const [isLoadingLargeFiles, setIsLoadingLargeFiles] = useState(false);

  // Add state at the top of the component:
  const [showBulkPermanentDeleteModal, setShowBulkPermanentDeleteModal] =
    useState(false);
  const [showBulkMoveToTrashModal, setShowBulkMoveToTrashModal] =
    useState(false);
  const [showOptimizeStorageModal, setShowOptimizeStorageModal] =
    useState(false);
  const [largestFiles, setLargestFiles] = useState<FileItem[]>([]);

  // Add state for permanent delete confirmation
  const [showPermanentDeleteSuccess, setShowPermanentDeleteSuccess] =
    useState(false);
  const [showBulkPermanentDeleteSuccess, setShowBulkPermanentDeleteSuccess] =
    useState(false);
  const [deletedFilesCount, setDeletedFilesCount] = useState(0);

  // Add state for optimize storage move-to-trash notification
  const [showOptimizeStorageTrashSuccess, setShowOptimizeStorageTrashSuccess] =
    useState(false);
  const [optimizeStorageTrashFileName, setOptimizeStorageTrashFileName] =
    useState("");

  // Subscription state
  const [userSubscription, setUserSubscription] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");

  // Load data based on active section
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let result;

      switch (activeSection) {
        case "home":
        case "all-files":
        case "my-files":
          result = await getFiles();
          break;
        case "documents":
          result = await getFilesByType("application/");
          break;
        case "photos":
          result = await getFilesByType("image/");
          break;
        case "videos":
          result = await getFilesByType("video/");
          break;
        case "favorites":
          result = await getFavoriteFiles();
          break;
        case "trash":
          result = await getDeletedFiles();
          break;
        case "recent-activity":
          result = await getRecentActivity();
          break;
        default:
          result = await getFiles();
      }

      if (result.success) {
        console.log(
          `📁 Loaded ${result.files.length} files for section: ${activeSection}`
        );
        console.log(`📊 Total files in database: ${result.total}`);
        console.log(
          `📁 First 5 files:`,
          result.files
            .slice(0, 5)
            .map((f: FileItem) => ({ id: f.$id, name: f.name }))
        );
        console.log(
          `📁 Last 5 files:`,
          result.files
            .slice(-5)
            .map((f: FileItem) => ({ id: f.$id, name: f.name }))
        );
        setFiles(result.files);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeSection]);

  // Load subscription data
  const loadSubscriptionData = useCallback(async () => {
    try {
      setIsLoadingSubscription(true);
      const result = await getUserSubscription();
      if (result.success) {
        setUserSubscription(result.subscription);
        console.log("📊 Loaded subscription data:", result);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  // Load subscription data when upgrade plan section is active
  useEffect(() => {
    if (activeSection === "upgrade-plan") {
      loadSubscriptionData();
    }
  }, [activeSection, loadSubscriptionData]);

  // Load storage usage
  const loadStorageUsage = useCallback(async () => {
    try {
      const result = await getStorageUsage();
      if (result.success) {
        // Calculate breakdown client-side as a fallback
        const allFilesResult = await getFiles();
        const clientBreakdown = {
          documents: 0,
          photos: 0,
          videos: 0,
          others: 0,
        };

        if (allFilesResult.success) {
          allFilesResult.files.forEach((file: FileItem) => {
            if (file.type === "file" && file.size && file.mimeType) {
              const size = file.size;
              if (file.mimeType.startsWith("image/")) {
                clientBreakdown.photos += size;
              } else if (file.mimeType.startsWith("video/")) {
                clientBreakdown.videos += size;
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
                clientBreakdown.documents += size;
              } else {
                clientBreakdown.others += size;
              }
            }
          });
        }

        // Use client-side breakdown if server breakdown is all zeros
        const finalBreakdown =
          result.usage.breakdown.documents === 0 &&
          result.usage.breakdown.photos === 0 &&
          result.usage.breakdown.videos === 0 &&
          result.usage.breakdown.others === 0
            ? clientBreakdown
            : result.usage.breakdown;

        const finalUsage = {
          ...result.usage,
          breakdown: finalBreakdown,
        };

        setLocalStorageUsage(finalUsage);
      } else {
        console.error("❌ Storage usage failed:", result.error);
      }
    } catch (error) {
      console.error("Error loading storage usage:", error);
    }
  }, []);

  // Always load storage usage if parent data is not available or is zero
  useEffect(() => {
    if (
      (!parentStorageUsage || parentStorageUsage.used === 0) &&
      !localStorageUsage
    ) {
      console.log(
        "🔍 No valid parent storage usage, loading local storage usage..."
      );
      loadStorageUsage();
    }
  }, [parentStorageUsage, localStorageUsage, loadStorageUsage]);

  // Load quick stats for home page
  const loadQuickStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      // Get all files for stats and storage usage
      const allFilesResult = await getFiles();
      const favoriteResult = await getFavoriteFiles();
      const recentResult = await getRecentActivity(5);
      const storageResult = await getStorageUsage();

      if (
        allFilesResult.success &&
        favoriteResult.success &&
        recentResult.success
      ) {
        const totalSize = allFilesResult.files.reduce(
          (acc: number, file: FileItem) => acc + (file.size || 0),
          0
        );

        console.log("📊 Quick Stats Debug:", {
          allFilesCount: allFilesResult.files.length,
          allFilesTotal: allFilesResult.total,
          favoriteCount: favoriteResult.files.length,
          recentCount: recentResult.files.length,
          storageResult: storageResult.success ? storageResult.usage : "Failed",
        });

        setQuickStats({
          totalFiles: allFilesResult.files.length,
          totalSize,
          recentUploads: recentResult.files.length,
          favoriteFiles: favoriteResult.files.length,
          storageUsed: storageResult.success
            ? storageResult.usage.totalSize
            : totalSize,
          storageTotal: storageResult.success
            ? storageResult.usage.maxStorage
            : 10 * 1024 * 1024 * 1024, // 10GB default
        });

        setRecentActivity(recentResult.files);
      }
    } catch (error) {
      console.error("Error loading quick stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Load favorite files
  const loadFavoriteFiles = useCallback(async () => {
    setIsLoadingFavorites(true);
    try {
      const result = await getFavoriteFiles();
      if (result.success) {
        setFavoriteFiles(result.files);
      }
    } catch (error) {
      console.error("Error loading favorite files:", error);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery && searchQuery.trim() !== "") {
      // If searching, use searchFiles
      (async () => {
        setLoading(true);
        try {
          const result = await searchFiles(searchQuery);
          if (result.success) {
            setFiles(result.files);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      loadData();
      loadStorageUsage();

      // Load quick stats for home page
      if (activeSection === "home") {
        loadQuickStats();
      }

      // Load favorites for favorites page
      if (activeSection === "favorites") {
        loadFavoriteFiles();
      }
    }
  }, [searchQuery, activeSection]);

  // Load storage usage when switching to storage-usage section
  useEffect(() => {
    if (activeSection === "storage-usage") {
      loadStorageUsage();
    }
  }, [activeSection, loadStorageUsage]);

  // Clear selection when changing sections
  useEffect(() => {
    clearSelection();
  }, [activeSection]);

  // Update selectAll state when selectedFiles changes
  useEffect(() => {
    if (files.length > 0) {
      setSelectAll(selectedFiles.length === files.length);
    }
  }, [selectedFiles, files.length]);

  // Keyboard shortcuts for bulk operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A to select all files (only in selection mode)
      if (e.ctrlKey && e.key === "a" && files.length > 0 && selectionMode) {
        e.preventDefault();
        handleSelectAll();
      }

      // Escape to clear selection and exit selection mode
      if (e.key === "Escape" && (selectedFiles.length > 0 || selectionMode)) {
        clearSelection();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [files.length, selectedFiles.length, selectionMode]);

  // Enhanced file upload with accurate progress tracking
  // Enhanced file upload with concurrent progress tracking
  const handleFileUpload = async (uploadedFiles: File[]) => {
    try {
      console.log(
        "Starting concurrent upload for",
        uploadedFiles.length,
        "files"
      );
      setIsUploading(true);

      // Initialize all uploads at once
      const uploadPromises = uploadedFiles.map((file, index) => {
        const fileId = `upload_${Date.now()}_${index}`;

        // Initialize upload progress immediately
        uploadProgressTracker.initializeUpload(fileId, file.name, file.size);
        uploadProgressTracker.startUpload(fileId);

        return uploadSingleFile(file, fileId);
      });

      // Start all uploads concurrently
      await Promise.all(uploadPromises);

      // Refresh data after all uploads
      console.log("All uploads completed, refreshing data...");
      loadData();
      loadStorageUsage();
      refreshStorageUsage?.();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to upload a single file with progress tracking
  const uploadSingleFile = async (file: File, fileId: string) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.$id);

      // Use fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        uploadProgressTracker.completeUpload(fileId);
        console.log(`Upload completed for ${file.name}`);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error(`Upload error for ${file.name}:`, error);
      uploadProgressTracker.setUploadError(
        fileId,
        error instanceof Error ? error.message : "Upload failed"
      );
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const result = await searchFiles(query);
      if (result.success) {
        setFiles(result.files);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;

    try {
      const result = await createFolder(folderName);
      if (result.success) {
        loadData();
      }
    } catch (error) {
      console.error("Create folder error:", error);
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (fileId: string) => {
    try {
      const result = await toggleFavorite(fileId);
      if (result.success) {
        loadData();
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
    }
  };

  // Handle file actions (preview, download, share, move-to-trash)
  const handleFileAction = (file: FileItem, action: string) => {
    switch (action) {
      case "preview":
        console.log(`Previewing file: ${file.name}`);
        // Always use the preview page for proper file preview
        window.open(`/preview/${file.$id}`, "_blank");
        break;
      case "download":
        console.log(`Downloading file: ${file.name}`);
        // Trigger file download
        if (file.url) {
          const link = document.createElement("a");
          link.href = file.url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Fallback to preview page for download
          window.open(`/preview/${file.$id}`, "_blank");
        }
        break;
      case "share":
        console.log(`Sharing file: ${file.name}`);
        // Show share options
        if (navigator.share && file.url) {
          navigator
            .share({
              title: file.name,
              url: file.url,
            })
            .catch(console.error);
        } else {
          // Fallback: copy link to clipboard
          const shareUrl =
            file.url || `${window.location.origin}/preview/${file.$id}`;
          navigator.clipboard
            .writeText(shareUrl)
            .then(() => {
              alert(`Link to ${file.name} copied to clipboard!`);
            })
            .catch(() => {
              alert(`Share URL: ${shareUrl}`);
            });
        }
        break;
      case "move-to-trash":
        console.log(`Moving file to trash: ${file.name}`);
        confirmMoveToTrash(file.$id);
        setLargestFiles &&
          setLargestFiles((prev) => prev.filter((f) => f.$id !== file.$id));
        setOptimizeStorageTrashFileName(file.name);
        setShowOptimizeStorageTrashSuccess(true);
        setTimeout(() => setShowOptimizeStorageTrashSuccess(false), 2000);

        // Debug: Log current storage usage before and after
        console.log(
          "🔍 Before move to trash - Storage usage:",
          localStorageUsage
        );
        console.log(
          "🔍 refreshStorageUsage function exists:",
          !!refreshStorageUsage
        );

        // Force refresh storage usage with multiple attempts
        // Files in trash should count towards storage usage
        setTimeout(() => {
          console.log("🔍 Calling refreshStorageUsage...");
          refreshStorageUsage?.();
        }, 1000); // Increased delay to ensure database update

        setTimeout(() => {
          console.log(
            "🔍 After move to trash - Storage usage:",
            localStorageUsage
          );
          console.log("🔍 Files in current view:", files.length);
          console.log(
            "🔍 Files not in trash:",
            files.filter((f) => !f.isDeleted).length
          );
        }, 2000);
        break;
      default:
        break;
    }
  };

  // Handle move to trash with popover
  const handleMoveToTrash = (fileId: string) => {
    setTrashPopoverFileId(fileId);
  };

  const confirmMoveToTrash = async (fileId: string) => {
    try {
      const result = await moveToTrash(fileId);
      if (result.success) {
        loadData();
        // Add a longer delay to ensure database is updated before calculating storage
        // Files in trash should still count towards storage usage
        setTimeout(() => {
          loadStorageUsage();
        }, 500);
        setTimeout(() => {
          refreshStorageUsage?.();
        }, 1000);
        // Additional refresh attempts to ensure UI updates
        setTimeout(() => {
          refreshStorageUsage?.();
        }, 2000);
        setTimeout(() => {
          refreshStorageUsage?.();
        }, 3000);
      }
    } catch (error) {
      console.error("Move to trash error:", error);
    } finally {
      setTrashPopoverFileId(null);
    }
  };

  // Handle restore from trash
  const handleRestoreFromTrash = async (fileId: string) => {
    try {
      const result = await restoreFromTrash(fileId);
      if (result.success) {
        loadData();
      }
    } catch (error) {
      console.error("Restore error:", error);
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (fileId: string) => {
    // Removed browser confirm dialog; confirmation is handled by the custom modal
    try {
      const result = await permanentlyDelete(fileId);
      if (result.success) {
        loadData();
        // Add a small delay to ensure database is updated before calculating storage
        setTimeout(() => {
          loadStorageUsage();
        }, 100);
        setTimeout(() => {
          refreshStorageUsage?.();
        }, 500);
        setShowPermanentDeleteSuccess(true);
        setTimeout(() => setShowPermanentDeleteSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Permanent delete error:", error);
    }
  };

  // Handle empty trash
  const handleEmptyTrash = async () => {
    // Removed browser confirm dialog; confirmation is handled by the custom modal
    try {
      const result = await optimizedEmptyTrash();
      if (result.success) {
        loadData();
        loadStorageUsage();
        setTimeout(() => {
          refreshStorageUsage?.();
        }, 500);
        console.log(`✅ Emptied trash: ${result.processedCount} items deleted`);
      }
    } catch (error) {
      console.error("Empty trash error:", error);
    }
  };

  // Handle rename
  const handleRename = async (fileId: string) => {
    if (!newName.trim()) return;

    try {
      const result = await renameItem(fileId, newName);
      if (result.success) {
        setEditingFile(null);
        setNewName("");
        loadData();
      }
    } catch (error) {
      console.error("Rename error:", error);
    }
  };

  // Bulk Operations Handlers
  const handleSelectFile = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFiles([]);
      setSelectAll(false);
    } else {
      const allFileIds = files.map((file) => file.$id);
      console.log(`🔍 Select All: Total files in state: ${files.length}`);
      console.log(`🔍 Select All: Files to select: ${allFileIds.length}`);
      console.log(`🔍 Select All: First 5 file IDs:`, allFileIds.slice(0, 5));
      console.log(`🔍 Select All: Last 5 file IDs:`, allFileIds.slice(-5));
      setSelectedFiles(allFileIds);
      setSelectAll(true);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedFiles.length === 0) return;

    console.log(`🚀 Bulk Action: ${action}`);
    console.log(
      `🚀 Bulk Action: Selected files count: ${selectedFiles.length}`
    );
    console.log(
      `🚀 Bulk Action: First 5 selected IDs:`,
      selectedFiles.slice(0, 5)
    );
    console.log(
      `🚀 Bulk Action: Last 5 selected IDs:`,
      selectedFiles.slice(-5)
    );

    setBulkActionLoading(true);
    setBulkActionProgress({ current: 0, total: selectedFiles.length, action });
    try {
      switch (action) {
        case "download":
          // Download multiple files in parallel
          const downloadPromises = selectedFiles.map(async (fileId) => {
            const file = files.find((f) => f.$id === fileId);
            if (file && file.url) {
              const link = document.createElement("a");
              link.href = file.url;
              link.download = file.name;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          });
          await Promise.all(downloadPromises);
          break;

        case "favorite":
          // Use optimized batch operation
          const favoriteResult = await batchToggleFavorite(selectedFiles);
          if (favoriteResult.success) {
            loadData();
            console.log(
              `⭐ Updated favorite status for ${favoriteResult.processedCount} files`
            );
            console.log(
              `⭐ Added to favorites: ${favoriteResult.addedToFavorites}, Removed from favorites: ${favoriteResult.removedFromFavorites}`
            );
          }
          break;

        case "move-to-trash":
          // Use optimized batch operation
          const moveResult = await batchMoveToTrash(selectedFiles);
          if (moveResult.success) {
            loadData();
            console.log(`✅ Moved ${moveResult.processedCount} files to trash`);
          }
          break;

        case "restore":
          // Use optimized batch operation
          const restoreResult = await batchRestoreFromTrash(selectedFiles);
          if (restoreResult.success) {
            loadData();
            console.log(
              `✅ Restored ${restoreResult.processedCount} files from trash`
            );
          }
          break;

        case "permanently-delete":
          // Store the count before clearing selection
          const deletedCount = selectedFiles.length;
          // Use optimized batch operation
          const deleteResult = await batchPermanentlyDelete(selectedFiles);
          if (deleteResult.success) {
            loadData();
            // Add a small delay to ensure database is updated before calculating storage
            setTimeout(() => {
              loadStorageUsage();
            }, 100);
            setTimeout(() => {
              refreshStorageUsage?.();
            }, 500);
            setDeletedFilesCount(deletedCount);
            setShowBulkPermanentDeleteSuccess(true);
            setTimeout(() => setShowBulkPermanentDeleteSuccess(false), 2000);
            console.log(
              `✅ Permanently deleted ${deleteResult.processedCount} items`
            );
          }
          break;

        case "share":
          // Share multiple files (create a combined share link)
          const shareUrls = selectedFiles.map((fileId) => {
            const file = files.find((f) => f.$id === fileId);
            return file?.url || `${window.location.origin}/preview/${fileId}`;
          });

          const combinedUrl = shareUrls.join("\n");
          await navigator.clipboard.writeText(combinedUrl);
          alert(`Links to ${selectedFiles.length} files copied to clipboard!`);
          break;

        default:
          break;
      }

      // Clear selection after action
      setSelectedFiles([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Bulk action error:", error);
    } finally {
      setBulkActionLoading(false);
      setBulkActionProgress(null);
    }
  };

  // Helper function to process files in batches for better performance
  const processInBatches = async (
    fileIds: string[],
    action: (fileId: string) => Promise<unknown>,
    actionName: string
  ) => {
    const batchSize = 10; // Process 10 files at a time
    let processed = 0;

    for (let i = 0; i < fileIds.length; i += batchSize) {
      const batch = fileIds.slice(i, i + batchSize);
      const promises = batch.map(async (fileId) => {
        try {
          await action(fileId);
          processed++;
          setBulkActionProgress({
            current: processed,
            total: fileIds.length,
            action: actionName,
          });
        } catch (error) {
          console.error(`Error processing file ${fileId}:`, error);
        }
      });

      await Promise.all(promises);

      // Small delay between batches to prevent overwhelming the server
      if (i + batchSize < fileIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setSelectAll(false);
    setSelectionMode(false);
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setSelectAll(false);
  };

  // File icon component
  const FileIcon = ({ file }: { file: FileItem }) => {
    if (file.type === "folder") {
      return <Folder className="text-[#3DA9FC]" size={20} />;
    }

    const mimeType = file.mimeType || "";
    if (mimeType.startsWith("image/"))
      return <ImageIcon className="text-[#8B5CF6]" size={20} />;
    if (mimeType.startsWith("video/"))
      return <Video className="text-[#EF4444]" size={20} />;
    if (mimeType.includes("pdf"))
      return <FilePdf className="text-[#EF4444]" size={20} />;
    if (mimeType.includes("archive") || mimeType.includes("zip"))
      return <FileArchive className="text-[#F59E0B]" size={20} />;
    return <FileText className="text-[#3DA9FC]" size={20} />;
  };

  // File list component
  const FileList = ({
    showActions = true,
    isTrash = false,
  }: {
    showActions?: boolean;
    isTrash?: boolean;
  }) => (
    <div className="space-y-3">
      {/* Selection Controls */}
      {files.length > 0 && (
        <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            {selectionMode ? (
              <>
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 text-[#1C1C1C] hover:text-[#3DA9FC] transition-colors"
                >
                  {selectAll ? (
                    <CheckSquare size={20} className="text-[#3DA9FC]" />
                  ) : (
                    <Square size={20} className="text-[#64748b]" />
                  )}
                  <span className="text-sm font-medium">
                    Select All ({files.length})
                  </span>
                </button>
                <Button
                  onClick={clearSelection}
                  variant="outline"
                  size="sm"
                  className="text-[#64748b] hover:text-[#1C1C1C]"
                >
                  Cancel
                </Button>
                {/* Bulk action buttons, only show if files are selected */}
                {selectedFiles.length > 0 && (
                  <div className="flex items-center space-x-2 ml-4">
                    {!isTrash && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction("download")}
                          disabled={bulkActionLoading}
                          className="text-[#29C393] hover:text-[#29C393] hover:bg-green-50"
                        >
                          <Download size={16} className="mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction("favorite")}
                          disabled={bulkActionLoading}
                          className="text-[#EF4444] hover:text-[#EF4444] hover:bg-red-50"
                        >
                          <Heart size={16} className="mr-2" />
                          Add to Favorites
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction("share")}
                          disabled={bulkActionLoading}
                          className="text-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-purple-50"
                        >
                          <Share2 size={16} className="mr-2" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkMoveToTrashModal(true)}
                          disabled={bulkActionLoading}
                          className="text-[#F59E0B] hover:text-[#F59E0B] hover:bg-yellow-50"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Move to Trash
                        </Button>
                      </>
                    )}
                    {isTrash && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction("restore")}
                          disabled={bulkActionLoading}
                          className="text-[#29C393] hover:text-[#29C393] hover:bg-green-50"
                        >
                          <RefreshCw size={16} className="mr-2" />
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkPermanentDeleteModal(true)}
                          disabled={bulkActionLoading}
                          className="text-[#EF4444] hover:text-[#EF4444] hover:bg-red-50"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete Permanently
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelectedFiles}
                      className="text-[#64748b] hover:text-[#1C1C1C] border-gray-300"
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Button
                onClick={() => setSelectionMode(true)}
                variant="outline"
                size="sm"
                className="text-[#3DA9FC] border-[#3DA9FC] hover:bg-[#3DA9FC] hover:text-white transition-colors"
              >
                <CheckSquare size={16} className="mr-2" />
                Select Files
              </Button>
            )}
          </div>
          {/* Show selected count at the right */}
          {selectionMode && selectedFiles.length > 0 && (
            <span className="text-sm text-[#64748b]">
              {selectedFiles.length} selected of {files.length} total files
            </span>
          )}
          {/* Show progress/loading below the bar */}
          {bulkActionLoading && (
            <div className="mt-2 flex items-center text-sm text-[#64748b]">
              <Spinner size={18} className="mr-2" />
              {bulkActionProgress ? (
                <span>
                  {bulkActionProgress.action}... ({bulkActionProgress.current}/
                  {bulkActionProgress.total})
                </span>
              ) : (
                <span>Processing bulk action...</span>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size={20} className="mr-2" />
          <span>Loading...</span>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <File size={48} className="mx-auto mb-4 opacity-50" />
          <p>No files found</p>
        </div>
      ) : (
        files.map((file) => (
          <div
            key={file.$id}
            data-file-id={file.$id}
            className={`flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100 group hover:shadow-md transition-all duration-200 ${
              selectedFiles.includes(file.$id)
                ? "ring-2 ring-blue-500 bg-blue-50 shadow-md scale-[1.02]"
                : "hover:bg-gray-50"
            }`}
            onClick={
              selectionMode ? () => handleSelectFile(file.$id) : undefined
            }
          >
            <div className="flex items-center space-x-3 flex-1">
              {/* New Checkbox - only visible in selection mode */}
              {selectionMode && (
                <button
                  type="button"
                  aria-checked={selectedFiles.includes(file.$id)}
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFile(file.$id);
                  }}
                  className="w-6 h-6 flex items-center justify-center cursor-pointer bg-transparent border-none shadow-none p-0 m-0"
                  role="checkbox"
                  style={{
                    boxShadow: "none",
                    outline: "none",
                    border: "none",
                    background: "none",
                  }}
                >
                  {selectedFiles.includes(file.$id) ? (
                    <CheckSquare
                      className="w-5 h-5 text-blue-600"
                      strokeWidth={2.2}
                    />
                  ) : (
                    <Square
                      className="w-5 h-5 text-[#64748b]"
                      strokeWidth={2.2}
                    />
                  )}
                </button>
              )}

              {/* File icon */}
              <FileIcon file={file} />
              {editingFile === file.$id ? (
                <div className="flex items-center space-x-2 flex-1">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleRename(file.$id)
                    }
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleRename(file.$id)}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingFile(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex-1">
                  {file.type === "file" ? (
                    <div
                      className="cursor-pointer hover:underline"
                      onClick={(e) => {
                        if (selectionMode) {
                          e.stopPropagation();
                          return;
                        }
                        window.open(`/preview/${file.$id}`, "_blank");
                      }}
                    >
                      <p className="font-medium text-[#1C1C1C]">{file.name}</p>
                      <p className="text-sm text-[#64748b]">
                        {formatFileSize(file.size || 0)} •{" "}
                        {formatDateDetailed(file.updatedAt, "relative")}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-[#1C1C1C]">{file.name}</p>
                      <p className="text-sm text-[#64748b]">
                        Folder •{" "}
                        {formatDateDetailed(file.updatedAt, "relative")}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {showActions && (
              <div className="flex items-center space-x-2 justify-end relative">
                {/* Always-visible favorite heart (hidden for trash files) */}
                {!isTrash && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleFavorite(file.$id)}
                    className={
                      file.isFavorite
                        ? "text-[#EF4444]"
                        : "text-[#64748b] hover:text-[#EF4444]"
                    }
                    title={
                      file.isFavorite
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <Heart
                      size={18}
                      fill={file.isFavorite ? "#EF4444" : "none"}
                      stroke="#EF4444"
                      style={{ transition: "color 0.3s" }}
                    />
                  </Button>
                )}

                {/* More Actions Dropdown */}
                <Popover.Root
                  open={activeFileMenu === file.$id}
                  onOpenChange={(open: boolean) => {
                    setActiveFileMenu(open ? file.$id : null);
                  }}
                >
                  <Popover.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#64748b] hover:bg-gray-50 hover:text-[#1C1C1C] transition-colors"
                      title="More actions"
                    >
                      <MoreHorizontal size={16} />
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content
                    side="bottom"
                    align="end"
                    className="z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-2xl p-2"
                  >
                    <div className="space-y-1">
                      {!isTrash ? (
                        <>
                          {/* Preview/View Option */}
                          {file.type === "file" && (
                            <button
                              onClick={() => {
                                handleFileAction(file, "preview");
                                setActiveFileMenu(null);
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-blue-50 hover:text-[#3DA9FC] rounded-md transition-colors"
                            >
                              <FileText size={16} className="text-[#3DA9FC]" />
                              <span>Preview</span>
                            </button>
                          )}

                          {/* Download Option */}
                          {file.type === "file" && (
                            <button
                              onClick={() => {
                                handleFileAction(file, "download");
                                setActiveFileMenu(null);
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-green-50 hover:text-[#29C393] rounded-md transition-colors"
                            >
                              <Download size={16} className="text-[#29C393]" />
                              <span>Download</span>
                            </button>
                          )}

                          {/* Share Option */}
                          {file.type === "file" && (
                            <button
                              onClick={() => {
                                handleFileAction(file, "share");
                                setActiveFileMenu(null);
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-purple-50 hover:text-[#8B5CF6] rounded-md transition-colors"
                            >
                              <Share2 size={16} className="text-[#8B5CF6]" />
                              <span>Share</span>
                            </button>
                          )}

                          {/* Divider */}
                          <div className="border-t border-gray-100 my-1"></div>

                          {/* Rename Option */}
                          <button
                            onClick={() => {
                              setEditingFile(file.$id);
                              setNewName(file.name);
                              setActiveFileMenu(null);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <Edit3 size={16} className="text-[#64748b]" />
                            <span>Rename</span>
                          </button>

                          {/* Move to Trash Option */}
                          <button
                            onClick={() => {
                              handleMoveToTrash(file.$id);
                              setActiveFileMenu(null);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-red-50 hover:text-[#EF4444] rounded-md transition-colors"
                          >
                            <Trash2 size={16} className="text-[#EF4444]" />
                            <span>Move to trash</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Restore Option */}
                          <button
                            onClick={() => {
                              handleRestoreFromTrash(file.$id);
                              setActiveFileMenu(null);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-green-50 hover:text-[#29C393] rounded-md transition-colors"
                          >
                            <RefreshCw size={16} className="text-[#29C393]" />
                            <span>Restore</span>
                          </button>

                          {/* Permanently Delete Option */}
                          <button
                            onClick={() => {
                              setPermanentDeletePopoverFileId(file.$id);
                              setActiveFileMenu(null);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-red-50 hover:text-[#EF4444] rounded-md transition-colors"
                          >
                            <Trash2 size={16} className="text-[#EF4444]" />
                            <span>Permanently delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </Popover.Content>
                </Popover.Root>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  // Upload progress component
  const UploadProgress = () => {
    const uploads = Object.values(progressState);
    if (uploads.length === 0) return null;

    const completedUploads = uploads.filter(
      (data) => (data as any).status === "completed"
    ).length;
    const inProgressUploads = uploads.filter(
      (data) => (data as any).status === "uploading"
    ).length;
    const errorUploads = uploads.filter(
      (data) => (data as any).status === "error"
    ).length;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <RefreshCw className="text-[#3DA9FC]" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1C1C1C]">
                Upload Progress
              </h3>
              <p className="text-sm text-[#64748b]">
                {inProgressUploads} uploading • {completedUploads} completed
              </p>
            </div>
          </div>
          {inProgressUploads > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#3DA9FC] rounded-full animate-pulse"></div>
              <span className="text-sm text-[#3DA9FC] font-medium">Active</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {uploads.map((upload: any) => {
            const isCompleted = upload.status === "completed";
            const isInProgress = upload.status === "uploading";
            const isError = upload.status === "error";

            return (
              <div
                key={upload.fileId}
                className={`p-4 rounded-xl border transition-all duration-500 ease-out transform hover:scale-[1.02] ${
                  isCompleted
                    ? "bg-green-50 border-green-200 shadow-sm"
                    : isInProgress
                    ? "bg-blue-50 border-blue-200 shadow-md"
                    : isError
                    ? "bg-red-50 border-red-200 shadow-sm"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-200 shadow-sm"
                          : isInProgress
                          ? "bg-blue-200 shadow-md animate-pulse"
                          : isError
                          ? "bg-red-200 shadow-sm"
                          : "bg-gray-200"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="text-green-600" size={16} />
                      ) : isInProgress ? (
                        <div className="relative">
                          <RefreshCw
                            className="text-blue-600 animate-spin"
                            size={16}
                          />
                          <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20"></div>
                        </div>
                      ) : isError ? (
                        <XCircle className="text-red-600" size={16} />
                      ) : (
                        <FileText className="text-gray-600" size={16} />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#1C1C1C]">
                        {upload.fileName}
                      </span>
                      <p className="text-xs text-[#64748b]">
                        {formatFileSize(upload.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-semibold transition-all duration-300 ${
                        isCompleted
                          ? "text-green-600"
                          : isInProgress
                          ? "text-blue-600"
                          : isError
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {isCompleted
                        ? "Complete"
                        : isInProgress
                        ? `${Math.round(upload.progress)}%`
                        : isError
                        ? "Failed"
                        : "Queued"}
                    </span>
                    {isInProgress && (
                      <div className="text-xs text-[#64748b] mt-1 animate-pulse">
                        {upload.progress < 25
                          ? "Starting..."
                          : upload.progress < 50
                          ? "Uploading..."
                          : upload.progress < 75
                          ? "Almost done..."
                          : "Finishing..."}
                      </div>
                    )}
                    {isError && upload.error && (
                      <div className="text-xs text-red-600 mt-1">
                        {upload.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ease-out transform ${
                      isCompleted
                        ? "bg-gradient-to-r from-green-400 to-green-500 shadow-sm"
                        : isInProgress
                        ? "bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 shadow-md"
                        : isError
                        ? "bg-gradient-to-r from-red-400 to-red-500 shadow-sm"
                        : "bg-gray-400"
                    }`}
                    style={{
                      width: `${upload.progress}%`,
                      transform: isInProgress ? "scaleY(1.1)" : "scaleY(1)",
                    }}
                  />
                </div>

                {isInProgress && (
                  <div className="mt-2 text-xs text-[#64748b]">
                    <div className="flex justify-between">
                      <span>Uploaded</span>
                      <span className="animate-pulse">Processing...</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {completedUploads > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={16} />
              <span className="text-sm font-medium text-green-700">
                {completedUploads} file{completedUploads !== 1 ? "s" : ""}{" "}
                uploaded successfully!
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles);
      }
    },
    [handleFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const handleDeleteAllRecentUploads = async () => {
    if (!files.length) return;
    if (!confirm("Are you sure you want to move all recent uploads to trash?"))
      return;
    for (const file of files) {
      await handleMoveToTrash(file.$id);
    }
    loadData();
  };

  // In renderUploadContent, remove the Delete All button from Recent Uploads
  const renderUploadContent = () => (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            <CloudUpload className="text-[#3DA9FC]" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">Upload Files</h2>
            <p className="text-[#64748b] mt-1">
              Upload your files to the cloud with ease
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm text-[#64748b]">
            <span>💡</span>
            <span>Drag & drop or click to upload</span>
          </div>
        </div>
      </div>

      {/* Enhanced Upload Area - Enlarged */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 cursor-pointer ${
            isDragActive
              ? "border-[#3DA9FC] bg-blue-50 text-[#3DA9FC]"
              : "border-gray-200 hover:border-[#3DA9FC] hover:bg-gray-50 text-[#64748b]"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto">
              <CloudUpload
                className={`${
                  isDragActive ? "text-[#3DA9FC]" : "text-gray-400"
                } transition-colors`}
                size={48}
              />
            </div>
            {isDragActive ? (
              <div className="space-y-3">
                <p className="text-2xl font-semibold text-[#3DA9FC]">
                  Drop files here to upload
                </p>
                <p className="text-base text-[#3DA9FC]/80">
                  Release to start uploading
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-semibold text-[#1C1C1C]">
                  Upload your files
                </p>
                <p className="text-base text-[#64748b]">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-sm text-[#64748b]/70">
                  Supports: Images, Documents, Videos, and more
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      <UploadProgress />

      {/* Recent Uploads Section */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <FileText className="text-[#29C393]" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1C1C1C]">
                  Recent Uploads
                </h3>
                <p className="text-sm text-[#64748b]">
                  Your recently uploaded files
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSection("my-files")}
                className="flex items-center space-x-2"
              >
                <span>View All Files</span>
                <ArrowUp size={16} className="rotate-45" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-[#64748b] mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            💡 Tip: Click &quot;Select Files&quot; to enable bulk operations for
            managing multiple files at once
          </div>

          <FileList />
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-[#1C1C1C] mb-3">
          Upload Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-700 text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-[#1C1C1C]">Drag & Drop</p>
              <p className="text-[#64748b]">
                Simply drag files from your computer and drop them here
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-700 text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-[#1C1C1C]">Multiple Files</p>
              <p className="text-[#64748b]">
                Select multiple files at once for batch uploading
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-700 text-xs font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-[#1C1C1C]">Progress Tracking</p>
              <p className="text-[#64748b]">
                Monitor upload progress in real-time
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-700 text-xs font-bold">4</span>
            </div>
            <div>
              <p className="font-medium text-[#1C1C1C]">File Management</p>
              <p className="text-[#64748b]">
                Organize, share, and manage your uploaded files
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // In renderTrashContent, wrap the Delete All button in a Popover
  const renderTrashContent = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1C1C1C]">Trash</h2>
        {/* Delete All button and popover removed */}
      </div>
      {files.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Trash is empty</p>
        </div>
      ) : (
        <FileList isTrash={true} />
      )}
    </div>
  );

  const renderStorageUsageContent = () => {
    const getUsageColor = (percentage: number) => {
      if (percentage < 50) return "text-green-500";
      if (percentage < 80) return "text-yellow-500";
      return "text-red-500";
    };

    const getUsageBgColor = (percentage: number) => {
      if (percentage < 50) return "bg-green-100";
      if (percentage < 80) return "bg-yellow-100";
      return "bg-red-100";
    };

    const getUsageStatus = (percentage: number) => {
      if (percentage < 50) return "Great! You have plenty of storage space.";
      if (percentage < 80)
        return "Consider cleaning up some files to free up space.";
      return "Storage is running low. Consider upgrading your plan.";
    };

    const handleUpgradeClick = () => {
      setActiveSection("upgrade-plan");
    };

    const handleOptimizeStorage = async () => {
      try {
        // Get all files to analyze for optimization
        const result = await getFiles();
        if (result.success && result.files.length > 0) {
          // Sort files by size (largest first)
          const sortedFiles = result.files
            .filter((file: FileItem) => file.type === "file" && file.size)
            .sort((a: FileItem, b: FileItem) => (b.size || 0) - (a.size || 0))
            .slice(0, 10); // Top 10 largest files

          if (sortedFiles.length > 0) {
            setLargestFiles(sortedFiles);
            setShowOptimizeStorageModal(true);
          } else {
            alert("No files found for optimization analysis.");
          }
        } else {
          alert("No files found to analyze.");
        }
      } catch (error) {
        console.error("Storage optimization error:", error);
        alert("Error analyzing storage. Please try again.");
      }
    };

    const handleViewLargeFiles = async () => {
      try {
        setIsLoadingLargeFiles(true);
        // Get all files and filter large ones (>5MB)
        const result = await getFiles();
        if (result.success && result.files.length > 0) {
          const largeFiles = result.files
            .filter(
              (file: FileItem) =>
                file.type === "file" && file.size && file.size > 5 * 1024 * 1024
            ) // >5MB
            .sort((a: FileItem, b: FileItem) => (b.size || 0) - (a.size || 0));

          setLargeFiles(largeFiles);
          setShowLargeFiles(true);
        } else {
          alert("No files found.");
        }
      } catch (error) {
        console.error("Error loading large files:", error);
        alert("Error loading large files. Please try again.");
      } finally {
        setIsLoadingLargeFiles(false);
      }
    };

    const handleDownloadReport = async () => {
      try {
        // Generate and download storage report
        const report = {
          totalSize: storageUsage?.totalSize || 0,
          maxStorage: storageUsage?.maxStorage || 0,
          usagePercentage: storageUsage?.usagePercentage || 0,
          breakdown: storageUsage?.breakdown || {
            documents: 0,
            photos: 0,
            videos: 0,
            others: 0,
          },
          totalFiles: storageUsage?.totalFiles || 0,
          generatedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `storage-report-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading report:", error);
      }
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1C1C1C]">
            Storage Analytics
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              className="flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Download Report</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadStorageUsage();
                refreshStorageUsage?.();
              }}
              className="flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {storageUsage && (
          <>
            {/* Main Storage Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Circular Progress Chart */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        className="stroke-current text-[#E2E8F0]"
                        strokeWidth="8"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      />
                      <circle
                        className={`stroke-current ${getUsageColor(
                          storageUsage.usagePercentage
                        )}`}
                        strokeWidth="8"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={
                          251.2 - (251.2 * storageUsage.usagePercentage) / 100
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={`text-2xl font-bold ${getUsageColor(
                          storageUsage.usagePercentage
                        )}`}
                      >
                        {storageUsage.usagePercentage}%
                      </span>
                      <span className="text-xs text-[#64748b]">Used</span>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-[#1C1C1C]">
                    {`${formatFileSize(
                      storageUsage.totalSize
                    )} / ${formatFileSize(storageUsage.maxStorage)}`}
                  </p>
                  <p className="text-sm text-[#64748b] mt-1">
                    {storageUsage.totalFiles} files • Free Plan
                  </p>
                </div>
              </div>

              {/* Storage Status */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-[#1C1C1C] mb-4">
                  Storage Status
                </h3>
                <div
                  className={`p-4 rounded-lg ${getUsageBgColor(
                    storageUsage.usagePercentage
                  )} mb-4`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity
                      className={`${getUsageColor(
                        storageUsage.usagePercentage
                      )}`}
                      size={16}
                    />
                    <span
                      className={`font-medium ${getUsageColor(
                        storageUsage.usagePercentage
                      )}`}
                    >
                      {storageUsage.usagePercentage < 50
                        ? "Healthy"
                        : storageUsage.usagePercentage < 80
                        ? "Warning"
                        : "Critical"}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748b]">
                    {getUsageStatus(storageUsage.usagePercentage)}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748b]">
                      Available Space
                    </span>
                    <span className="font-medium">
                      {formatFileSize(
                        storageUsage.maxStorage - storageUsage.totalSize
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748b]">Files Count</span>
                    <span className="font-medium">
                      {storageUsage.totalFiles}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-[#1C1C1C] mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleUpgradeClick}
                    className="w-full bg-[#3DA9FC] hover:bg-[#0077C2] text-white"
                  >
                    <ArrowUp size={16} className="mr-2" />
                    Upgrade Plan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOptimizeStorage}
                    className="w-full"
                  >
                    <TrendingUp size={16} className="mr-2" />
                    Optimize Storage
                  </Button>
                  {/* Removed View Large Files button */}
                </div>
              </div>
            </div>

            {/* Usage Breakdown */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#1C1C1C]">
                  Usage Breakdown
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSection("my-files")}
                  >
                    View All Files
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="text-[#29C393]" size={20} />
                    <span className="font-medium">Documents</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1C1C1C]">
                    {formatFileSize(storageUsage.breakdown.documents)}
                  </p>

                  <p className="text-xs text-[#64748b] mt-1">
                    {storageUsage.breakdown.documents > 0
                      ? `${Math.round(
                          (storageUsage.breakdown.documents /
                            storageUsage.totalSize) *
                            100
                        )}% of total`
                      : "No documents"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-2 mb-2">
                    <ImageIcon className="text-[#8B5CF6]" size={20} />
                    <span className="font-medium">Photos</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1C1C1C]">
                    {formatFileSize(storageUsage.breakdown.photos)}
                  </p>

                  <p className="text-xs text-[#64748b] mt-1">
                    {storageUsage.breakdown.photos > 0
                      ? `${Math.round(
                          (storageUsage.breakdown.photos /
                            storageUsage.totalSize) *
                            100
                        )}% of total`
                      : "No photos"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-2 mb-2">
                    <Video className="text-[#EF4444]" size={20} />
                    <span className="font-medium">Videos</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1C1C1C]">
                    {formatFileSize(storageUsage.breakdown.videos)}
                  </p>

                  <p className="text-xs text-[#64748b] mt-1">
                    {storageUsage.breakdown.videos > 0
                      ? `${Math.round(
                          (storageUsage.breakdown.videos /
                            storageUsage.totalSize) *
                            100
                        )}% of total`
                      : "No videos"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-2 mb-2">
                    <File className="text-[#64748b]" size={20} />
                    <span className="font-medium">Others</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1C1C1C]">
                    {formatFileSize(storageUsage.breakdown.others)}
                  </p>
                  <p className="text-xs text-[#64748b] mt-1">
                    {storageUsage.breakdown.others > 0
                      ? `${Math.round(
                          (storageUsage.breakdown.others /
                            storageUsage.totalSize) *
                            100
                        )}% of total`
                      : "No other files"}
                  </p>
                </div>
              </div>
            </div>

            {/* Storage Tips */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-[#1C1C1C] mb-4">
                Storage Optimization Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#3DA9FC] rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-[#1C1C1C]">
                      Regular Cleanup
                    </p>
                    <p className="text-sm text-[#64748b]">
                      Delete unnecessary files and empty trash regularly
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#29C393] rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-[#1C1C1C]">
                      Compress Large Files
                    </p>
                    <p className="text-sm text-[#64748b]">
                      Compress videos and images to save space
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#8B5CF6] rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-[#1C1C1C]">
                      Organize Folders
                    </p>
                    <p className="text-sm text-[#64748b]">
                      Use folders to keep files organized and easy to find
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#EF4444] rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-[#1C1C1C]">Monitor Usage</p>
                    <p className="text-sm text-[#64748b]">
                      Check your storage usage regularly to stay informed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!storageUsage && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
            <Spinner size={48} className="mx-auto mb-4" />
            <p className="text-gray-600">Loading storage analytics...</p>
          </div>
        )}

        {/* Large Files Modal */}
        {showLargeFiles && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  Large Files (&gt;5MB)
                </h3>
                <button
                  onClick={() => setShowLargeFiles(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {isLoadingLargeFiles ? (
                  <div className="text-center py-8">
                    <Spinner size={32} className="mx-auto mb-4" />
                    <p className="text-gray-600">Loading large files...</p>
                  </div>
                ) : largeFiles.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Found {largeFiles.length} large files. Consider deleting
                      or compressing these to save space.
                    </p>
                    {largeFiles.map((file) => (
                      <div
                        key={file.$id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <FileIcon file={file} />
                          <div>
                            <p className="font-medium text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size || 0)} •{" "}
                              {formatDate(file.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileAction(file, "download")}
                          >
                            <Download size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleFileAction(file, "move-to-trash")
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <File size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">
                      No large files found (&gt;5MB).
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end p-6 border-t border-gray-200">
                <Button
                  onClick={() => setShowLargeFiles(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRecentActivityContent = () => {
    const getActivityIcon = (file: FileItem) => {
      if (file.mimeType?.includes("image/"))
        return <ImageIcon className="text-[#8B5CF6]" size={20} />;
      if (file.mimeType?.includes("video/"))
        return <Video className="text-[#EF4444]" size={20} />;
      if (file.mimeType?.includes("application/"))
        return <FileText className="text-[#29C393]" size={20} />;
      return <File className="text-[#64748b]" size={20} />;
    };

    const getActivityType = (file: FileItem) => {
      return formatDateDetailed(file.updatedAt, "relative");
    };

    const getActivityDescription = (file: FileItem) => {
      const size = file.size ? formatFileSize(file.size) : "Unknown size";
      const type = file.mimeType?.split("/")[1]?.toUpperCase() || "FILE";
      const timeInfo = formatDateTime(file.updatedAt);
      return `${type} • ${size} • ${timeInfo.time}`;
    };

    const handleFilterChange = (filter: string) => {
      setActivityFilter(filter);
      // In a real app, this would filter the activity data
      console.log(`Filtering by: ${filter}`);
    };

    const handleTimeRangeChange = (range: string) => {
      setTimeRange(range);
      // In a real app, this would fetch data for the selected time range
      console.log(`Time range: ${range}`);
    };

    const handleViewFile = (file: FileItem) => {
      // In a real app, this would open the file preview
      console.log(`Viewing file: ${file.name}`);
      alert(`Opening ${file.name} in preview mode!`);
    };

    const handleDownloadFile = (file: FileItem) => {
      // In a real app, this would trigger file download
      console.log(`Downloading file: ${file.name}`);
      alert(`Downloading ${file.name}...`);
    };

    const handleShareFile = (file: FileItem) => {
      // In a real app, this would open sharing options
      console.log(`Sharing file: ${file.name}`);
      alert(`Share options for ${file.name} coming soon!`);
    };

    const handleExportActivity = () => {
      try {
        const activityData = {
          files: files.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.mimeType,
            updatedAt: file.updatedAt,
            activityType: getActivityType(file),
            description: getActivityDescription(file),
          })),
          exportDate: new Date().toISOString(),
          filter: activityFilter,
          timeRange: timeRange,
        };

        const blob = new Blob([JSON.stringify(activityData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-report-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error exporting activity:", error);
      }
    };

    const filteredFiles = files.filter((file) => {
      if (activityFilter === "all") return true;
      if (activityFilter === "images" && file.mimeType?.includes("image/"))
        return true;
      if (
        activityFilter === "documents" &&
        file.mimeType?.includes("application/")
      )
        return true;
      if (activityFilter === "videos" && file.mimeType?.includes("video/"))
        return true;
      return false;
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1C1C1C]">Recent Activity</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportActivity}
              className="flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Activity Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="text-[#3DA9FC]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Total Files</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  {storageUsage?.totalFiles || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="text-[#29C393]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Images</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  {Math.round(
                    (storageUsage?.breakdown.photos || 0) / 1024 / 1024
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="text-[#8B5CF6]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Documents</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  {Math.round(
                    (storageUsage?.breakdown.documents || 0) / 1024 / 1024
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Video className="text-[#EF4444]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Videos</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  {Math.round(
                    (storageUsage?.breakdown.videos || 0) / 1024 / 1024
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-[#64748b] mb-2 block">
                  Filter by type:
                </label>
                <div className="flex space-x-2">
                  <Button
                    variant={activityFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={
                      activityFilter === "images" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleFilterChange("images")}
                  >
                    Images
                  </Button>
                  <Button
                    variant={
                      activityFilter === "documents" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleFilterChange("documents")}
                  >
                    Documents
                  </Button>
                  <Button
                    variant={
                      activityFilter === "videos" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleFilterChange("videos")}
                  >
                    Videos
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#64748b] mb-2 block">
                Time range:
              </label>
              <select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3DA9FC]"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-[#1C1C1C]">
              Activity Timeline
            </h3>
            <p className="text-sm text-[#64748b] mt-1">
              Showing {filteredFiles.length} files •{" "}
              {activityFilter === "all" ? "All types" : activityFilter}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={24} className="mr-2" />
              <span>Loading activity...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <History size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No activity found</p>
              <p className="text-sm text-[#64748b] mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredFiles.map((file, index) => (
                <div
                  key={file.$id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">{getActivityIcon(file)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-[#1C1C1C] truncate">
                            {file.name}
                          </h4>
                          <p className="text-xs text-[#64748b] mt-1">
                            {getActivityDescription(file)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-[#64748b] bg-gray-100 px-2 py-1 rounded-full">
                            {getActivityType(file)}
                          </span>
                          <Popover.Root
                            open={activeFileMenu === file.$id}
                            onOpenChange={(open: boolean) => {
                              setActiveFileMenu(open ? file.$id : null);
                            }}
                          >
                            <Popover.Trigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#64748b] hover:bg-gray-50 hover:text-[#1C1C1C] transition-colors"
                                title="More actions"
                              >
                                <MoreHorizontal size={16} />
                              </Button>
                            </Popover.Trigger>
                            <Popover.Content
                              side="bottom"
                              align="end"
                              className="z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
                            >
                              <div className="space-y-1">
                                {/* Preview/View Option */}
                                <button
                                  onClick={() => {
                                    handleFileAction(file, "preview");
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-blue-50 hover:text-[#3DA9FC] rounded-md transition-colors"
                                >
                                  <FileText
                                    size={16}
                                    className="text-[#3DA9FC]"
                                  />
                                  <span>Preview</span>
                                </button>

                                {/* Download Option */}
                                <button
                                  onClick={() => {
                                    handleFileAction(file, "download");
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-green-50 hover:text-[#29C393] rounded-md transition-colors"
                                >
                                  <Download
                                    size={16}
                                    className="text-[#29C393]"
                                  />
                                  <span>Download</span>
                                </button>

                                {/* Share Option */}
                                <button
                                  onClick={() => {
                                    handleFileAction(file, "share");
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-purple-50 hover:text-[#8B5CF6] rounded-md transition-colors"
                                >
                                  <Share2
                                    size={16}
                                    className="text-[#8B5CF6]"
                                  />
                                  <span>Share</span>
                                </button>
                              </div>
                            </Popover.Content>
                          </Popover.Root>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Insights */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-[#1C1C1C] mb-4">
            Activity Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-[#3DA9FC]">
                {files.length > 0
                  ? Math.round(
                      files.reduce((acc, f) => acc + (f.size || 0), 0) /
                        files.length /
                        1024
                    )
                  : 0}
              </p>
              <p className="text-sm text-[#64748b]">Avg file size (KB)</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-[#29C393]">
                {files.filter((f) => f.mimeType?.includes("image/")).length}
              </p>
              <p className="text-sm text-[#64748b]">Most common: Images</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-[#8B5CF6]">
                {files.length > 0
                  ? formatDateDetailed(
                      new Date(
                        Math.max(
                          ...files.map((f) => new Date(f.updatedAt).getTime())
                        )
                      ).toISOString(),
                      "relative"
                    )
                  : "N/A"}
              </p>
              <p className="text-sm text-[#64748b]">Last activity</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHomeContent = () => {
    const handleQuickAction = (action: string) => {
      switch (action) {
        case "upload":
          setActiveSection("upload");
          break;
        case "my-files":
          setActiveSection("my-files");
          break;
        case "favorites":
          setActiveSection("favorites");
          break;
        case "storage":
          setActiveSection("storage-usage");
          break;
        default:
          break;
      }
    };

    const handleFileAction = (file: FileItem, action: string) => {
      switch (action) {
        case "view":
          // In a real app, this would open file preview
          console.log(`Viewing file: ${file.name}`);
          alert(`Opening ${file.name} in preview mode!`);
          break;
        case "download":
          // In a real app, this would trigger download
          console.log(`Downloading file: ${file.name}`);
          alert(`Downloading ${file.name}...`);
          break;
        case "share":
          // In a real app, this would open sharing options
          console.log(`Sharing file: ${file.name}`);
          alert(`Share options for ${file.name} coming soon!`);
          break;
        default:
          break;
      }
    };

    const getFileTypeColor = (mimeType?: string) => {
      if (mimeType?.includes("image/")) return "text-[#8B5CF6]";
      if (mimeType?.includes("video/")) return "text-[#EF4444]";
      if (mimeType?.includes("application/")) return "text-[#29C393]";
      return "text-[#64748b]";
    };

    const getFileTypeIcon = (mimeType?: string) => {
      if (mimeType?.includes("image/"))
        return <ImageIcon size={18} className="md:w-5 md:h-5" />;
      if (mimeType?.includes("video/"))
        return <Video size={18} className="md:w-5 md:h-5" />;
      if (mimeType?.includes("application/"))
        return <FileText size={18} className="md:w-5 md:h-5" />;
      return <File size={18} className="md:w-5 md:h-5" />;
    };

    return (
      <div className="space-y-4 md:space-y-6">
        {/* Enhanced Welcome Header */}
        <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8 text-gray-900 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center border border-gray-200">
                    <FileText
                      size={20}
                      className="md:w-7 md:h-7 text-blue-600"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
                      Welcome back, {user.name || user.email.split("@")[0]}
                    </h1>
                    <p className="text-blue-700 text-base md:text-xl font-medium mt-1 md:mt-2">
                      Here&apos;s what&apos;s happening with your files today
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 md:px-4 py-1 md:py-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs md:text-sm font-medium text-green-700">
                      All Systems Operational
                    </span>
                  </div>
                  <div className="text-xs md:text-sm text-blue-600">
                    Last login:{" "}
                    {formatDateDetailed(new Date().toISOString(), "relative")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-gray-200 group">
            <div className="flex items-center justify-between">
              <div className="space-y-2 md:space-y-3">
                <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Total Files
                </p>
                <div className="text-2xl md:text-4xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-gray-200 h-6 md:h-10 w-12 md:w-20 rounded-lg"></div>
                  ) : (
                    quickStats.totalFiles.toLocaleString()
                  )}
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  Across all folders
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow">
                <FileText className="text-blue-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 group">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Recent Uploads
                </p>
                <div className="text-4xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-gray-200 h-10 w-16 rounded-lg"></div>
                  ) : (
                    quickStats.recentUploads
                  )}
                </div>
                <p className="text-sm text-gray-400 font-medium">This week</p>
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow">
                <CloudUpload className="text-blue-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 group">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Favorites
                </p>
                <div className="text-4xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-gray-200 h-10 w-16 rounded-lg"></div>
                  ) : (
                    quickStats.favoriteFiles
                  )}
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  Starred files
                </p>
              </div>
              <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow">
                <Heart className="text-yellow-500" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 group">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Storage Used
                </p>
                <div className="text-4xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-gray-200 h-10 w-16 rounded-lg"></div>
                  ) : (
                    formatGB(quickStats.storageUsed)
                  )}
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  of {formatGB(quickStats.storageTotal)}
                </p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow">
                <HardDrive className="text-green-600" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Quick Actions
              </h2>
              <p className="text-gray-500 mt-2 text-lg font-medium">
                Get started with your most common tasks
              </p>
            </div>
            {/* Removed keyboard shortcut pro tip */}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <button
              onClick={() => handleQuickAction("upload")}
              className="group relative flex flex-col items-center p-8 rounded-3xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <CloudUpload className="text-white" size={32} />
              </div>
              <span className="text-lg font-bold text-gray-800 mb-2">
                Upload Files
              </span>
              <span className="text-xs text-[#64748b] text-center">
                Drag & drop or click to upload
              </span>
              {/* Removed keyboard shortcut hint */}
            </button>

            <button
              onClick={() => handleQuickAction("my-files")}
              className="group relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-green-50 hover:to-green-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Folder className="text-[#29C393]" size={28} />
              </div>
              <span className="text-base font-semibold text-[#1C1C1C] mb-1">
                My Files
              </span>
              <span className="text-xs text-[#64748b] text-center">
                Browse and manage all files
              </span>
              {/* Removed keyboard shortcut hint */}
            </button>

            <button
              onClick={() => handleQuickAction("favorites")}
              className="group relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-red-50 hover:to-red-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="text-[#EF4444]" size={28} />
              </div>
              <span className="text-base font-semibold text-[#1C1C1C] mb-1">
                Favorites
              </span>
              <span className="text-xs text-[#64748b] text-center">
                View your starred files
              </span>
              {/* Removed keyboard shortcut hint */}
            </button>

            <button
              onClick={() => handleQuickAction("storage")}
              className="group relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-purple-50 hover:to-purple-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PieChart className="text-[#8B5CF6]" size={28} />
              </div>
              <span className="text-base font-semibold text-[#1C1C1C] mb-1">
                Storage
              </span>
              <span className="text-xs text-[#64748b] text-center">
                View usage analytics
              </span>
              {/* Removed keyboard shortcut hint */}
            </button>
          </div>
        </div>

        {/* Enhanced Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                  <Activity className="text-orange-500" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1C1C1C]">
                    Recent Activity
                  </h2>
                  <p className="text-[#64748b] mt-1">
                    Your latest file activities and updates
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadQuickStats}
                  className="flex items-center space-x-2 hover:bg-gray-50"
                >
                  <RefreshCw size={16} />
                  <span>Refresh</span>
                </Button>
                <Button
                  onClick={() => setActiveSection("recent-activity")}
                  className="bg-[#3DA9FC] hover:bg-[#0077C2] text-white flex items-center space-x-2"
                >
                  <span>View All</span>
                  <ArrowUp size={16} className="rotate-45" />
                </Button>
              </div>
            </div>
          </div>

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={24} className="mr-2" />
              <span>Loading recent activity...</span>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-16 px-8">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <History size={48} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2">
                No recent activity
              </h3>
              <p className="text-[#64748b] mb-6 max-w-md mx-auto">
                Start uploading files to see your activity timeline here. Your
                recent uploads, downloads, and file changes will appear here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => handleQuickAction("upload")}
                  className="bg-[#3DA9FC] hover:bg-[#0077C2] text-white px-6 py-3"
                >
                  <CloudUpload size={18} className="mr-2" />
                  Upload Your First File
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickAction("my-files")}
                  className="px-6 py-3"
                >
                  <Folder size={18} className="mr-2" />
                  Browse Files
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((file) => (
                <div
                  key={file.$id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 ${getFileTypeColor(
                        file.mimeType
                      )}`}
                    >
                      {getFileTypeIcon(file.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-[#1C1C1C] truncate">
                            {file.name}
                          </h4>
                          <p className="text-xs text-[#64748b] mt-1">
                            {file.size
                              ? formatFileSize(file.size)
                              : "Unknown size"}{" "}
                            • {formatDateDetailed(file.updatedAt, "relative")}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* More Actions Dropdown */}
                          <Popover.Root
                            open={activeFileMenu === file.$id}
                            onOpenChange={(open: boolean) => {
                              setActiveFileMenu(open ? file.$id : null);
                            }}
                          >
                            <Popover.Trigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#64748b] hover:bg-gray-50 hover:text-[#1C1C1C] transition-colors"
                                title="More actions"
                              >
                                <MoreHorizontal size={14} />
                              </Button>
                            </Popover.Trigger>
                            <Popover.Content
                              side="bottom"
                              align="end"
                              className="z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
                            >
                              <div className="space-y-1">
                                {/* Preview/View Option */}
                                <button
                                  onClick={() => {
                                    handleFileAction(file, "preview");
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-blue-50 hover:text-[#3DA9FC] rounded-md transition-colors"
                                >
                                  <FileText
                                    size={16}
                                    className="text-[#3DA9FC]"
                                  />
                                  <span>Preview</span>
                                </button>

                                {/* Download Option */}
                                <button
                                  onClick={() => {
                                    handleFileAction(file, "download");
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-green-50 hover:text-[#29C393] rounded-md transition-colors"
                                >
                                  <Download
                                    size={16}
                                    className="text-[#29C393]"
                                  />
                                  <span>Download</span>
                                </button>

                                {/* Share Option */}
                                <button
                                  onClick={() => {
                                    handleFileAction(file, "share");
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-purple-50 hover:text-[#8B5CF6] rounded-md transition-colors"
                                >
                                  <Share2
                                    size={16}
                                    className="text-[#8B5CF6]"
                                  />
                                  <span>Share</span>
                                </button>
                              </div>
                            </Popover.Content>
                          </Popover.Root>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Storage Overview */}
        {storageUsage && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <HardDrive className="text-[#3DA9FC]" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1C1C1C]">
                    Storage Overview
                  </h2>
                  <p className="text-[#64748b] mt-1">
                    Monitor your storage usage and space
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setActiveSection("storage-usage")}
                className="bg-[#3DA9FC] hover:bg-[#0077C2] text-white"
              >
                View Details
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Circle */}
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      className="stroke-current text-gray-200"
                      strokeWidth="8"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <circle
                      className="stroke-current text-[#3DA9FC] transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={
                        251.2 - (251.2 * storageUsage.usagePercentage) / 100
                      }
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[#3DA9FC]">
                      {storageUsage.usagePercentage}%
                    </span>
                    <span className="text-xs text-[#64748b]">Used</span>
                  </div>
                </div>
              </div>

              {/* Storage Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[#64748b] uppercase tracking-wide">
                    Storage Used
                  </p>
                  <p className="text-2xl font-bold text-[#1C1C1C]">
                    {formatFileSize(storageUsage.totalSize)}
                  </p>
                  <p className="text-sm text-[#64748b]">
                    of {formatFileSize(storageUsage.maxStorage)} total
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#64748b] uppercase tracking-wide">
                    Files
                  </p>
                  <p className="text-xl font-semibold text-[#1C1C1C]">
                    {storageUsage.totalFiles.toLocaleString()}
                  </p>
                  <p className="text-sm text-[#64748b]">Total files stored</p>
                </div>
              </div>

              {/* Plan Info */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-[#64748b] uppercase tracking-wide">
                    Current Plan
                  </p>
                  <p className="text-lg font-bold text-[#1C1C1C]">Free Plan</p>
                  <p className="text-sm text-[#64748b]">
                    Basic storage included
                  </p>
                </div>

                {storageUsage.usagePercentage > 80 && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <p className="text-sm font-medium text-orange-700">
                      Storage Alert
                    </p>
                    <p className="text-sm text-orange-600">
                      You&apos;re using {storageUsage.usagePercentage}% of your
                      storage
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Type Breakdown */}
        {files.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-[#8B5CF6]" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1C1C1C]">
                    File Type Breakdown
                  </h2>
                  <p className="text-[#64748b] mt-1">
                    Overview of your file types and sizes
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Images */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                    <ImageIcon className="text-[#8B5CF6]" size={20} />
                  </div>
                  <span className="text-2xl font-bold text-[#8B5CF6]">
                    {files.filter((f) => f.mimeType?.includes("image/")).length}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1C1C1C]">Images</p>
                <p className="text-xs text-[#64748b]">
                  {formatFileSize(
                    files
                      .filter((f) => f.mimeType?.includes("image/"))
                      .reduce((acc, f) => acc + (f.size || 0), 0)
                  )}
                </p>
              </div>

              {/* Documents */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                    <FileText className="text-[#29C393]" size={20} />
                  </div>
                  <span className="text-2xl font-bold text-[#29C393]">
                    {
                      files.filter((f) => f.mimeType?.includes("application/"))
                        .length
                    }
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1C1C1C]">Documents</p>
                <p className="text-xs text-[#64748b]">
                  {formatFileSize(
                    files
                      .filter((f) => f.mimeType?.includes("application/"))
                      .reduce((acc, f) => acc + (f.size || 0), 0)
                  )}
                </p>
              </div>

              {/* Videos */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                    <Video className="text-[#EF4444]" size={20} />
                  </div>
                  <span className="text-2xl font-bold text-[#EF4444]">
                    {files.filter((f) => f.mimeType?.includes("video/")).length}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1C1C1C]">Videos</p>
                <p className="text-xs text-[#64748b]">
                  {formatFileSize(
                    files
                      .filter((f) => f.mimeType?.includes("video/"))
                      .reduce((acc, f) => acc + (f.size || 0), 0)
                  )}
                </p>
              </div>

              {/* Others */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <File className="text-[#64748b]" size={20} />
                  </div>
                  <span className="text-2xl font-bold text-[#64748b]">
                    {
                      files.filter(
                        (f) =>
                          !f.mimeType?.includes("image/") &&
                          !f.mimeType?.includes("application/") &&
                          !f.mimeType?.includes("video/")
                      ).length
                    }
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1C1C1C]">Others</p>
                <p className="text-xs text-[#64748b]">
                  {formatFileSize(
                    files
                      .filter(
                        (f) =>
                          !f.mimeType?.includes("image/") &&
                          !f.mimeType?.includes("application/") &&
                          !f.mimeType?.includes("video/")
                      )
                      .reduce((acc, f) => acc + (f.size || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFavoritesContent = () => {
    const handleRemoveFavorite = async (fileId: string) => {
      try {
        const result = await toggleFavorite(fileId);
        if (result.success) {
          // Remove from local state
          setFavoriteFiles((prev) =>
            prev.filter((file) => file.$id !== fileId)
          );
        }
      } catch (error) {
        console.error("Error removing from favorites:", error);
      }
    };

    const handleFileAction = (file: FileItem, action: string) => {
      switch (action) {
        case "view":
          console.log(`Viewing file: ${file.name}`);
          alert(`Opening ${file.name} in preview mode!`);
          break;
        case "download":
          console.log(`Downloading file: ${file.name}`);
          alert(`Downloading ${file.name}...`);
          break;
        case "share":
          console.log(`Sharing file: ${file.name}`);
          alert(`Share options for ${file.name} coming soon!`);
          break;
        case "move-to-trash":
          handleMoveToTrash(file.$id);
          break;
        default:
          break;
      }
    };

    const handleBulkAction = async (action: string) => {
      if (favoriteFiles.length === 0) return;

      try {
        switch (action) {
          case "remove-all":
            if (
              confirm(
                `Remove all ${favoriteFiles.length} files from favorites?`
              )
            ) {
              // Remove all from favorites
              for (const file of favoriteFiles) {
                await toggleFavorite(file.$id);
              }
              setFavoriteFiles([]);
            }
            break;
          case "download-all":
            console.log("Downloading all favorite files...");
            alert("Bulk download feature coming soon!");
            break;
          case "share-all":
            console.log("Sharing all favorite files...");
            alert("Bulk share feature coming soon!");
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Error performing bulk action:", error);
      }
    };

    const getFileTypeColor = (mimeType?: string) => {
      if (mimeType?.includes("image/")) return "text-[#8B5CF6]";
      if (mimeType?.includes("video/")) return "text-[#EF4444]";
      if (mimeType?.includes("application/")) return "text-[#29C393]";
      return "text-[#64748b]";
    };

    const getFileTypeIcon = (mimeType?: string) => {
      if (mimeType?.includes("image/")) return <ImageIcon size={20} />;
      if (mimeType?.includes("video/")) return <Video size={20} />;
      if (mimeType?.includes("application/")) return <FileText size={20} />;
      return <File size={20} />;
    };

    // Filter and sort files
    const filteredAndSortedFiles = favoriteFiles
      .filter((file) => {
        if (favoriteFilter === "all") return true;
        if (favoriteFilter === "images" && file.mimeType?.includes("image/"))
          return true;
        if (
          favoriteFilter === "documents" &&
          file.mimeType?.includes("application/")
        )
          return true;
        if (favoriteFilter === "videos" && file.mimeType?.includes("video/"))
          return true;
        return false;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "size":
            comparison = (a.size || 0) - (b.size || 0);
            break;
          case "date":
            comparison =
              new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
          default:
            comparison = 0;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });

    const getFileTypeStats = () => {
      const stats = {
        total: favoriteFiles.length,
        images: favoriteFiles.filter((f) => f.mimeType?.includes("image/"))
          .length,
        documents: favoriteFiles.filter((f) =>
          f.mimeType?.includes("application/")
        ).length,
        videos: favoriteFiles.filter((f) => f.mimeType?.includes("video/"))
          .length,
        others: favoriteFiles.filter(
          (f) =>
            !f.mimeType?.includes("image/") &&
            !f.mimeType?.includes("application/") &&
            !f.mimeType?.includes("video/")
        ).length,
      };
      return stats;
    };

    const stats = getFileTypeStats();

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1C1C1C]">Favorites</h2>
            <p className="text-sm text-[#64748b] mt-1">
              Your starred files and folders ({favoriteFiles.length} items)
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadFavoriteFiles}
              className="flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="text-[#EF4444]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Total</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="text-[#8B5CF6]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Images</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  {stats.images}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="text-[#29C393]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Documents</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  {stats.documents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Video className="text-[#EF4444]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Videos</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  {stats.videos}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <File className="text-[#64748b]" size={20} />
              </div>
              <div>
                <p className="text-sm text-[#64748b]">Others</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  {stats.others}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-[#64748b] mb-2 block">
                  Filter by type:
                </label>
                <div className="flex space-x-2">
                  <Button
                    variant={favoriteFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFavoriteFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={
                      favoriteFilter === "images" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setFavoriteFilter("images")}
                  >
                    Images
                  </Button>
                  <Button
                    variant={
                      favoriteFilter === "documents" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setFavoriteFilter("documents")}
                  >
                    Documents
                  </Button>
                  <Button
                    variant={
                      favoriteFilter === "videos" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setFavoriteFilter("videos")}
                  >
                    Videos
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-[#64748b] mb-2 block">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3DA9FC] mr-2"
                >
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                  <option value="date">Date</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {favoriteFiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#64748b]">
                {filteredAndSortedFiles.length} of {favoriteFiles.length} files
                selected
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("download-all")}
                >
                  <Download size={16} className="mr-2" />
                  Download All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("share-all")}
                >
                  <Share2 size={16} className="mr-2" />
                  Share All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("remove-all")}
                  className="text-red-600 hover:text-red-700"
                >
                  <HeartOff size={16} className="mr-2" />
                  Remove All
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Favorites List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-[#1C1C1C]">
              Favorite Files
            </h3>
            <p className="text-sm text-[#64748b] mt-1">
              Showing {filteredAndSortedFiles.length} files •{" "}
              {favoriteFilter === "all" ? "All types" : favoriteFilter}
            </p>
          </div>

          {isLoadingFavorites ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={20} className="animate-spin mr-2" />
              <span>Loading favorites...</span>
            </div>
          ) : favoriteFiles.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No favorite files yet</p>
              <p className="text-sm text-[#64748b] mt-1">
                Heart files to add them to your favorites
              </p>
              <Button
                onClick={() => setActiveSection("my-files")}
                className="mt-4 bg-[#3DA9FC] hover:bg-[#0077C2] text-white"
              >
                <Folder size={16} className="mr-2" />
                Browse Files
              </Button>
            </div>
          ) : filteredAndSortedFiles.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No files match your filter</p>
              <p className="text-sm text-[#64748b] mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAndSortedFiles.map((file) => (
                <div
                  key={file.$id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 ${getFileTypeColor(
                        file.mimeType
                      )}`}
                    >
                      {getFileTypeIcon(file.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-[#1C1C1C] truncate">
                            {file.name}
                          </h4>
                          <p className="text-xs text-[#64748b] mt-1">
                            {file.size
                              ? formatFileSize(file.size)
                              : "Unknown size"}{" "}
                            • {formatDateDetailed(file.updatedAt, "relative")}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* More Actions Dropdown */}
                          <Popover.Root
                            open={activeFileMenu === file.$id}
                            onOpenChange={(open: boolean) => {
                              setActiveFileMenu(open ? file.$id : null);
                            }}
                          >
                            <Popover.Trigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#64748b] hover:bg-gray-50 hover:text-[#1C1C1C] transition-colors"
                                title="More actions"
                              >
                                <MoreHorizontal size={14} />
                              </Button>
                            </Popover.Trigger>
                            <Popover.Content
                              side="bottom"
                              align="end"
                              className="z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-2xl p-2"
                            >
                              <div className="space-y-1">
                                {/* Preview/View Option */}
                                <button
                                  onClick={() => {
                                    handleFileAction(file, "preview");
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-blue-50 hover:text-[#3DA9FC] rounded-md transition-colors"
                                >
                                  <FileText
                                    size={16}
                                    className="text-[#3DA9FC]"
                                  />
                                  <span>Preview</span>
                                </button>

                                {/* Download Option */}
                                <button
                                  onClick={() => {
                                    handleFileAction(file, "download");
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-green-50 hover:text-[#29C393] rounded-md transition-colors"
                                >
                                  <Download
                                    size={16}
                                    className="text-[#29C393]"
                                  />
                                  <span>Download</span>
                                </button>

                                {/* Share Option */}
                                <button
                                  onClick={() => {
                                    handleFileAction(file, "share");
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-purple-50 hover:text-[#8B5CF6] rounded-md transition-colors"
                                >
                                  <Share2
                                    size={16}
                                    className="text-[#8B5CF6]"
                                  />
                                  <span>Share</span>
                                </button>

                                {/* Divider */}
                                <div className="border-t border-gray-100 my-1"></div>

                                {/* Remove from Favorites Option */}
                                <button
                                  onClick={() => {
                                    handleRemoveFavorite(file.$id);
                                    setActiveFileMenu(null);
                                  }}
                                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#1C1C1C] hover:bg-red-50 hover:text-[#EF4444] rounded-md transition-colors"
                                >
                                  <HeartOff
                                    size={16}
                                    className="text-[#EF4444]"
                                  />
                                  <span>Remove from favorites</span>
                                </button>
                              </div>
                            </Popover.Content>
                          </Popover.Root>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-[#1C1C1C] mb-4">
            Favorites Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#3DA9FC] rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-[#1C1C1C]">Quick Access</p>
                <p className="text-sm text-[#64748b]">
                  Heart important files for quick access
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#29C393] rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-[#1C1C1C]">Organize</p>
                <p className="text-sm text-[#64748b]">
                  Use hearts to organize your most important files
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#8B5CF6] rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-[#1C1C1C]">Filter & Sort</p>
                <p className="text-sm text-[#64748b]">
                  Filter by type and sort by name, size, or date
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#EF4444] rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-[#1C1C1C]">Bulk Actions</p>
                <p className="text-sm text-[#64748b]">
                  Perform actions on multiple files at once
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUpgradePlanContent = () => {
    const handlePlanSelection = async (planId: string) => {
      try {
        setIsLoadingSubscription(true);
        setSubscriptionMessage("");

        const result = await upgradePlan(planId);
        if (result.success) {
          // Check if we need to redirect to Stripe checkout
          if (result.redirectToCheckout) {
            console.log(`🔄 Redirecting to Stripe checkout for ${planId} plan`);
            
            // Use the Stripe hook to create checkout session
            await createCheckoutSession(planId, "monthly");
          } else {
            setSubscriptionMessage(result.message);
            setUserSubscription(result.subscription);
            console.log(`✅ Successfully upgraded to ${planId} plan`);

            // Refresh storage usage to reflect new limits
            loadStorageUsage();
            refreshStorageUsage?.();
          }
        } else {
          setSubscriptionMessage(`Error: ${result.error}`);
          console.error("Upgrade failed:", result.error);
        }
      } catch (error) {
        setSubscriptionMessage("An error occurred during upgrade");
        console.error("Upgrade error:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    const handleContactSales = () => {
      // Open email client with sales inquiry
      const subject = encodeURIComponent("SKYBOX Enterprise Plan Inquiry");
      const body = encodeURIComponent(
        `Hello,\n\nI'm interested in the SKYBOX Enterprise plan.\n\nPlease contact me with more information.\n\nBest regards,\n${
          user.name || user.email
        }`
      );
      window.open(`mailto:sales@skybox.com?subject=${subject}&body=${body}`);
    };

    const handleStartTrial = async (planId: string) => {
      try {
        setIsLoadingSubscription(true);
        setSubscriptionMessage("");

        const result = await startTrial(planId);
        if (result.success) {
          setSubscriptionMessage(result.message);
          setUserSubscription(result.subscription);
          console.log(`🎉 Started trial for ${planId} plan`);

          // Refresh storage usage to reflect new limits
          loadStorageUsage();
          refreshStorageUsage?.();
        } else {
          setSubscriptionMessage(`Error: ${result.error}`);
          console.error("Trial start failed:", result.error);
        }
      } catch (error) {
        setSubscriptionMessage("An error occurred starting trial");
        console.error("Trial error:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    const handleCancelSubscription = async () => {
      if (
        !confirm(
          "Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period."
        )
      ) {
        return;
      }

      try {
        setIsLoadingSubscription(true);
        setSubscriptionMessage("");

        const result = await cancelSubscription();
        if (result.success) {
          setSubscriptionMessage(result.message);
          setUserSubscription(result.subscription);
          console.log("❌ Subscription canceled");

          // Refresh storage usage
          loadStorageUsage();
          refreshStorageUsage?.();
        } else {
          setSubscriptionMessage(`Error: ${result.error}`);
          console.error("Cancel failed:", result.error);
        }
      } catch (error) {
        setSubscriptionMessage("An error occurred canceling subscription");
        console.error("Cancel error:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-[#1C1C1C]">
          Upgrade Your Plan
        </h2>

        {/* Current Plan Status */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1C1C1C]">
              Current Plan
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                userSubscription?.planId === "free"
                  ? "bg-gray-100 text-gray-600"
                  : userSubscription?.status === "trialing"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-[#E0F2FE] text-[#0077C2]"
              }`}
            >
              {userSubscription?.planId === "free"
                ? "Free Plan"
                : userSubscription?.status === "trialing"
                ? `${
                    (userSubscription?.planId as string)
                      ?.charAt(0)
                      .toUpperCase() +
                    (userSubscription?.planId as string)?.slice(1)
                  } Trial`
                : `${
                    (userSubscription?.planId as string)
                      ?.charAt(0)
                      .toUpperCase() +
                    (userSubscription?.planId as string)?.slice(1)
                  } Plan`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1C1C1C]">
                {storageUsage
                  ? formatFileSize(storageUsage.maxStorage)
                  : "10 GB"}
              </p>
              <p className="text-sm text-[#64748b]">Storage Limit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1C1C1C]">
                {storageUsage ? storageUsage.totalFiles : 0}
              </p>
              <p className="text-sm text-[#64748b]">Files</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1C1C1C]">Basic</p>
              <p className="text-sm text-[#64748b]">Support</p>
            </div>
          </div>

          {storageUsage && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1C1C1C]">
                  Storage Used
                </span>
                <span className="text-sm text-[#64748b]">
                  {formatFileSize(storageUsage.totalSize)} /{" "}
                  {formatFileSize(storageUsage.maxStorage)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#3DA9FC] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${storageUsage.usagePercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Available Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Plan */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative">
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2">Basic</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#3DA9FC]">$5</span>
                <span className="text-[#64748b]">/month</span>
              </div>
              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">50 GB Storage</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Unlimited Files</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Email Support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">File Sharing</span>
                </li>
              </ul>
              <div className="space-y-2">
                <Button
                  className="w-full bg-[#3DA9FC] hover:bg-[#0077C2] text-white"
                  onClick={() => handlePlanSelection("basic")}
                >
                  Choose Basic
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => handleStartTrial("basic")}
                >
                  Start 14-Day Trial
                </Button>
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-[#3DA9FC] p-6 relative transform scale-105">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-[#3DA9FC] text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2">Pro</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#3DA9FC]">$15</span>
                <span className="text-[#64748b]">/month</span>
              </div>
              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">1 TB Storage</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Unlimited Files</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Priority Support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Advanced Analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Team Collaboration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Version History</span>
                </li>
              </ul>
              <div className="space-y-2">
                <Button
                  className="w-full bg-[#3DA9FC] hover:bg-[#0077C2] text-white font-semibold"
                  onClick={() => handlePlanSelection("pro")}
                >
                  Choose Pro
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => handleStartTrial("pro")}
                >
                  Start 14-Day Trial
                </Button>
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative">
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2">
                Enterprise
              </h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#3DA9FC]">$50</span>
                <span className="text-[#64748b]">/month</span>
              </div>
              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">10 TB Storage</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Unlimited Files</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">24/7 Support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Advanced Security</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Custom Integrations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 text-[#29C393]" size={16} />
                  <span className="text-sm">Dedicated Manager</span>
                </li>
              </ul>
              <div className="space-y-2">
                <Button
                  className="w-full bg-[#3DA9FC] hover:bg-[#0077C2] text-white"
                  onClick={() => handlePlanSelection("enterprise")}
                >
                  Choose Enterprise
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => handleStartTrial("enterprise")}
                >
                  Start 14-Day Trial
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-12 bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-[#1C1C1C] mb-6 text-center">
            Plan Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-[#1C1C1C]">
                    Feature
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[#1C1C1C]">
                    Free
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[#3DA9FC]">
                    Basic
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[#3DA9FC]">
                    Pro
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[#3DA9FC]">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Storage</td>
                  <td className="py-3 px-4 text-center">10 GB</td>
                  <td className="py-3 px-4 text-center">50 GB</td>
                  <td className="py-3 px-4 text-center">1 TB</td>
                  <td className="py-3 px-4 text-center">10 TB</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">File Upload Limit</td>
                  <td className="py-3 px-4 text-center">100 MB</td>
                  <td className="py-3 px-4 text-center">2 GB</td>
                  <td className="py-3 px-4 text-center">10 GB</td>
                  <td className="py-3 px-4 text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Support</td>
                  <td className="py-3 px-4 text-center">Community</td>
                  <td className="py-3 px-4 text-center">Email</td>
                  <td className="py-3 px-4 text-center">Priority</td>
                  <td className="py-3 px-4 text-center">24/7</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Analytics</td>
                  <td className="py-3 px-4 text-center">
                    <XCircle className="mx-auto text-red-500" size={16} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <XCircle className="mx-auto text-red-500" size={16} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CheckCircle className="mx-auto text-[#29C393]" size={16} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CheckCircle className="mx-auto text-[#29C393]" size={16} />
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Team Collaboration</td>
                  <td className="py-3 px-4 text-center">
                    <XCircle className="mx-auto text-red-500" size={16} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <XCircle className="mx-auto text-red-500" size={16} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CheckCircle className="mx-auto text-[#29C393]" size={16} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CheckCircle className="mx-auto text-[#29C393]" size={16} />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Version History</td>
                  <td className="py-3 px-4 text-center">
                    <XCircle className="mx-auto text-red-500" size={16} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <XCircle className="mx-auto text-red-500" size={16} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CheckCircle className="mx-auto text-[#29C393]" size={16} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CheckCircle className="mx-auto text-[#29C393]" size={16} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-[#1C1C1C] mb-6 text-center">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <h4 className="font-medium text-[#1C1C1C] mb-2">
                Can I upgrade or downgrade my plan anytime?
              </h4>
              <p className="text-sm text-[#64748b]">
                Yes, you can change your plan at any time. Changes will be
                reflected in your next billing cycle.
              </p>
            </div>
            <div className="border-b border-gray-100 pb-4">
              <h4 className="font-medium text-[#1C1C1C] mb-2">
                What happens to my files if I downgrade?
              </h4>
              <p className="text-sm text-[#64748b]">
                Your files will remain safe. You&apos;ll need to free up space
                if you exceed your new storage limit.
              </p>
            </div>
            <div className="border-b border-gray-100 pb-4">
              <h4 className="font-medium text-[#1C1C1C] mb-2">
                Is there a free trial for paid plans?
              </h4>
              <p className="text-sm text-[#64748b]">
                Yes, all paid plans come with a 14-day free trial. No credit
                card required to start.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-[#1C1C1C] mb-2">
                How do I cancel my subscription?
              </h4>
              <p className="text-sm text-[#64748b]">
                You can cancel anytime from your account settings. Your plan
                will remain active until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  let mainContent;
  if (searchQuery && searchQuery.trim() !== "") {
    mainContent = (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">
          Search Results
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Showing results for{" "}
          <span className="font-semibold text-blue-600">
            &quot;{searchQuery}&quot;
          </span>
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size={20} className="animate-spin mr-2" />
            <span>Searching...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <File size={48} className="mx-auto mb-4 opacity-50" />
            <p>No files found matching your search.</p>
          </div>
        ) : (
          <FileList />
        )}
      </div>
    );
  } else {
    switch (activeSection) {
      case "home":
        mainContent = renderHomeContent();
        break;
      case "upload":
        mainContent = renderUploadContent();
        break;
      case "trash":
        mainContent = renderTrashContent();
        break;
      case "storage-usage":
        mainContent = renderStorageUsageContent();
        break;
      case "upgrade-plan":
        mainContent = renderUpgradePlanContent();
        break;
      case "recent-activity":
        mainContent = renderRecentActivityContent();
        break;
      case "favorites":
        mainContent = renderFavoritesContent();
        break;
      case "my-files":
      case "all-files":
      case "documents":
      case "photos":
      case "videos":
        mainContent = (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeSection === "my-files" && "My Files"}
                  {activeSection === "all-files" && "All Files"}
                  {activeSection === "documents" && "Documents"}
                  {activeSection === "photos" && "Photos"}
                  {activeSection === "videos" && "Videos"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {activeSection === "my-files" &&
                    "Your personal files and folders"}
                  {activeSection === "all-files" &&
                    "All your files and folders"}
                  {activeSection === "documents" &&
                    "Document files (PDF, DOC, etc.)"}
                  {activeSection === "photos" && "Image files (JPG, PNG, etc.)"}
                  {activeSection === "videos" && "Video files (MP4, AVI, etc.)"}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
            <FileList />
          </div>
        );
        break;
      default:
        mainContent = renderHomeContent();
    }
  }

  return (
    <div className="font-sans">
      {mainContent}

      {/* Move to Trash Confirmation Popup */}
      {trashPopoverFileId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="bg-transparent absolute inset-0"
            onClick={() => setTrashPopoverFileId(null)}
          />
          <div className="bg-white/95 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-2xl p-6 max-w-sm w-full mx-4 relative z-[10000]">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1C1C1C]">
                  Move to Trash
                </h3>
                <p className="text-sm text-[#64748b]">
                  This action can be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-[#64748b] mb-6">
              Are you sure you want to move this item to trash? You can restore
              it later from the trash section.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setTrashPopoverFileId(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#EF4444] text-white hover:bg-red-600"
                onClick={() => confirmMoveToTrash(trashPopoverFileId)}
              >
                Move to Trash
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Popup */}
      {permanentDeletePopoverFileId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="bg-transparent absolute inset-0"
            onClick={() => setPermanentDeletePopoverFileId(null)}
          />
          <div className="bg-white/95 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-2xl p-6 max-w-sm w-full mx-4 relative z-[10000]">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1C1C1C]">
                  Permanently Delete
                </h3>
                <p className="text-sm text-[#64748b]">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-[#64748b] mb-6">
              Are you sure you want to permanently delete this item? This action
              cannot be undone and the file will be lost forever.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setPermanentDeletePopoverFileId(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#EF4444] text-white hover:bg-red-600"
                onClick={() => {
                  handlePermanentDelete(permanentDeletePopoverFileId);
                  setPermanentDeletePopoverFileId(null);
                }}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Success Modal */}
      {showPermanentDeleteSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="bg-transparent absolute inset-0" />
          <div className="bg-white/95 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-2xl p-6 max-w-xs w-full mx-4 relative z-[10000] flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#1C1C1C] mb-1 text-center">
              File Deleted
            </h3>
            <p className="text-sm text-[#64748b] text-center">
              The file was permanently deleted.
            </p>
          </div>
        </div>
      )}

      {/* Bulk Permanent Delete Success Modal */}
      {showBulkPermanentDeleteSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="bg-transparent absolute inset-0" />
          <div className="bg-white/95 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-2xl p-6 max-w-xs w-full mx-4 relative z-[10000] flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#1C1C1C] mb-1 text-center">
              Files Deleted
            </h3>
            <p className="text-sm text-[#64748b] text-center">
              {deletedFilesCount} {deletedFilesCount === 1 ? "file" : "files"}{" "}
              permanently deleted.
            </p>
          </div>
        </div>
      )}

      {/* Bulk Permanent Delete Confirmation Popup */}
      {showBulkPermanentDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="bg-transparent absolute inset-0"
            onClick={() => setShowBulkPermanentDeleteModal(false)}
          />
          <div className="bg-white/95 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-2xl p-6 max-w-sm w-full mx-4 relative z-[10000]">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1C1C1C]">
                  Permanently Delete
                </h3>
                <p className="text-sm text-[#64748b]">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-[#64748b] mb-6">
              Are you sure you want to permanently delete {selectedFiles.length}{" "}
              selected {selectedFiles.length === 1 ? "file" : "files"}? This
              action cannot be undone and the files will be lost forever.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBulkPermanentDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#EF4444] text-white hover:bg-red-600"
                onClick={async () => {
                  setShowBulkPermanentDeleteModal(false);
                  await handleBulkAction("permanently-delete");
                }}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBulkMoveToTrashModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="bg-transparent absolute inset-0"
            onClick={() => setShowBulkMoveToTrashModal(false)}
          />
          <div className="bg-white/95 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-2xl p-6 max-w-sm w-full mx-4 relative z-[10000]">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <Trash2 className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1C1C1C]">
                  Move to Trash
                </h3>
                <p className="text-sm text-[#64748b]">
                  This action can be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-[#64748b] mb-6">
              Are you sure you want to move {selectedFiles.length} selected{" "}
              {selectedFiles.length === 1 ? "file" : "files"} to trash? You can
              restore them later from the trash section.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBulkMoveToTrashModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#F59E0B] text-white hover:bg-yellow-600"
                onClick={async () => {
                  setShowBulkMoveToTrashModal(false);
                  await handleBulkAction("move-to-trash");
                }}
              >
                Move to Trash
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Optimize Storage Modal */}
      {showOptimizeStorageModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="bg-transparent absolute inset-0"
            onClick={() => setShowOptimizeStorageModal(false)}
          />
          <div className="bg-white/95 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-2xl p-6 max-w-2xl w-full mx-4 relative z-[10000] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1C1C1C]">
                    Storage Optimization
                  </h3>
                  <p className="text-sm text-[#64748b]">
                    Top 10 largest files consuming space
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              {largestFiles.length > 0 ? (
                <div className="space-y-3">
                  {largestFiles.map((file, index) => (
                    <div
                      key={file.$id}
                      className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-200/30"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1C1C1C] truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-[#64748b]">
                            {formatFileSize(file.size || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileAction(file, "download")}
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileAction(file, "preview")}
                          className="text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleFileAction(file, "move-to-trash")
                          }
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No files found for analysis</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200/60 pt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-[#64748b]">
                  Consider deleting or compressing these files to save storage
                  space
                </p>
                <Button
                  onClick={() => setShowOptimizeStorageModal(false)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimize Storage Move to Trash Success Modal */}
      {showOptimizeStorageTrashSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="bg-transparent absolute inset-0" />
          <div className="bg-white/95 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-2xl p-6 max-w-xs w-full mx-4 relative z-[10000] flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#1C1C1C] mb-1 text-center">
              File Moved to Trash
            </h3>
            <p className="text-sm text-[#64748b] text-center">
              {optimizeStorageTrashFileName} was moved to trash.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
