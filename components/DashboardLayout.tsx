"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  HomeIcon,
  ArrowUpTrayIcon,
  FolderOpenIcon,
  HeartIcon,
  TrashIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  ClockIcon,
  ChartPieIcon,
  ArrowUpCircleIcon,
  BellIcon,
  PlusIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DashboardContentFixed from "./DashboardContentFixed";
import { getStorageUsage } from "@/lib/actions/file.actions";
import { getUserSubscription } from "@/lib/actions/subscription.actions";
import { Spinner } from "@/components/ui/Spinner";
import { logger } from "@/lib/utils/logger";

interface User {
  $id: string;
  name: string;
  email: string;
}

interface DashboardLayoutProps {
  user: User | null;
  onSignOut: () => void;
}

function Logo() {
  return (
    <div className="flex items-center space-x-4">
      {/* Icon */}
      <div className="w-12 h-12 flex items-center justify-center">
        <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12">
          {/* Cloud shape - single smooth path with two bumps on top */}
          <path
            d="M12 40c0-6.627 5.373-12 12-12 1.5 0 2.9.276 4.2.764C30.8 25.2 35.4 22 41 22c7.732 0 14 6.268 14 14 0 1.5-.276 2.9-.764 4.2C56.8 42.8 60 47.4 60 53c0 6.627-5.373 12-12 12H24c-6.627 0-12-5.373-12-12z"
            fill="white"
          />

          {/* Cube - perfectly centered, isometric perspective */}
          {/* Top face - bright light sky blue */}
          <polygon points="32,24 44,30 32,36 20,30" fill="#87CEEB" />
          {/* Front-left face - medium blue */}
          <polygon points="20,30 32,36 32,42 20,36" fill="#4682B4" />
          {/* Front-right face - darker teal-blue */}
          <polygon points="44,30 32,36 32,42 44,36" fill="#008B8B" />
          {/* Cube outline - very thick dark navy */}
          <polygon
            points="32,24 44,30 44,36 32,42 20,36 20,30"
            fill="none"
            stroke="#0A1A2A"
            strokeWidth="4"
          />
        </svg>
      </div>
      {/* Text */}
      <span className="text-2xl font-bold text-white tracking-normal font-sans">
        SKYBOX
      </span>
    </div>
  );
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onSignOut,
}) => {
  const [activeSection, setActiveSection] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 });
  const [storageUpdateTrigger, setStorageUpdateTrigger] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  // Notification state
  const NOTIF_KEY = "skybox_notifications";
  const defaultNotifications = [
    { id: 1, message: "Welcome to SKYBOX!", read: false, date: "Just now" },
    {
      id: 2,
      message: "Your storage usage is healthy.",
      read: false,
      date: "Today",
    },
    // Add more mock notifications if desired
  ];
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(NOTIF_KEY);
      if (saved) return JSON.parse(saved);
    }
    return defaultNotifications;
  });
  const notifRef = useRef<HTMLDivElement>(null);

  // Persist notifications to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setIsMarkingAsRead(true);
    console.log("🔔 Marking all notifications as read");

    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    setNotifications((prev) => {
      const updatedNotifications = prev.map((n) => ({ ...n, read: true }));
      console.log("📊 Updated notifications:", updatedNotifications);
      console.log(`✅ Marked ${unreadCount} notifications as read`);
      return updatedNotifications;
    });

    setIsMarkingAsRead(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isUserMenuOpen && !target.closest(".user-menu-container")) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: "all-files",
      label: "All Files",
      icon: FolderOpenIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "documents",
      label: "Documents",
      icon: DocumentTextIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "photos",
      label: "Photos",
      icon: PhotoIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "videos",
      label: "Videos",
      icon: VideoCameraIcon,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const activityItems = [
    {
      id: "recent-activity",
      label: "Recent Activity",
      icon: ClockIcon,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      id: "storage-usage",
      label: "Storage Usage",
      icon: ChartPieIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      id: "upgrade-plan",
      label: "Upgrade Plan",
      icon: ArrowUpCircleIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  // Main navigation items
  const mainNavItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "upload", label: "Upload", icon: ArrowUpTrayIcon },
    { id: "my-files", label: "My Files", icon: FolderOpenIcon },
    { id: "favorites", label: "Favorites", icon: HeartIcon },
    { id: "trash", label: "Trash", icon: TrashIcon },
  ];

  const refreshStorageUsage = async () => {
    try {
      logger.loading("Fetching storage usage...");
      const result = await getStorageUsage();
      logger.storage("Storage result:", result);
      if (result.success) {
        logger.success("Setting storage usage:", {
          used: result.usage.totalSize,
          total: result.usage.maxStorage,
        });
        setStorageUsage({
          used: result.usage.totalSize,
          total: result.usage.maxStorage,
        });
        setStorageUpdateTrigger((prev) => prev + 1);
        console.log("✅ Storage usage state updated");
      } else {
        console.error("❌ Storage API failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error refreshing storage usage:", error);
    }
  };

  const loadUserSubscription = async () => {
    try {
      console.log("🔄 Fetching user subscription...");
      const result = await getUserSubscription();
      console.log("📊 Subscription result:", result);
      if (result.success) {
        setUserSubscription(result.subscription);
        console.log("✅ User subscription loaded:", result.subscription);
      } else {
        console.error("❌ Subscription API failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Error loading subscription:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([refreshStorageUsage(), loadUserSubscription()]);
    };
    loadData();
  }, []);

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + " " + sizes[i];
  };

  const usedPercentage =
    storageUsage.total > 0 ? (storageUsage.used / storageUsage.total) * 100 : 0;

  const getPlanDisplayName = () => {
    if (!userSubscription) return "Free User";

    const planId = userSubscription.planId;
    const isTrial = userSubscription.isTrial;

    switch (planId) {
      case "basic":
        return isTrial ? "Basic Trial" : "Basic User";
      case "pro":
        return isTrial ? "Pro Trial" : "Pro User";
      case "enterprise":
        return isTrial ? "Enterprise Trial" : "Enterprise User";
      default:
        return "Free User";
    }
  };

  const getPlanBadgeColor = () => {
    if (!userSubscription) return "text-gray-600 bg-gray-50";

    const planId = userSubscription.planId;
    const isTrial = userSubscription.isTrial;

    if (isTrial) {
      return "text-orange-600 bg-orange-50";
    }

    switch (planId) {
      case "basic":
        return "text-blue-600 bg-blue-50";
      case "pro":
        return "text-purple-600 bg-purple-50";
      case "enterprise":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow sticky top-0 z-50">
        <div className="flex items-center px-4 md:px-6 py-3 md:py-4">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>

          {/* Search Bar - Responsive positioning */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-8">
            <SearchBar
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-2 md:space-x-3 ml-auto">
            {/* Mobile Search Button */}
            <button className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-600" />
            </button>
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                className="relative p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setIsNotifOpen((v) => !v)}
                aria-label="Open notifications"
                aria-haspopup="menu"
                aria-expanded={isNotifOpen}
              >
                <BellIcon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></span>
                )}
              </button>
              {/* Notification Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in zoom-in-75">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-base">
                      Notifications
                    </span>
                    <button
                      className={`text-xs font-medium transition-colors ${
                        unreadCount === 0 || isMarkingAsRead
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:underline hover:text-blue-700"
                      }`}
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0 || isMarkingAsRead}
                    >
                      {isMarkingAsRead ? "Marking..." : "Mark all as read"}
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 flex items-start space-x-3 ${
                            !notif.read ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex-shrink-0 mt-1">
                            <BellIcon className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${
                                notif.read
                                  ? "text-gray-700"
                                  : "text-blue-700 font-semibold"
                              }`}
                            >
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notif.date}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* User Menu */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center space-x-3 p-2 rounded-xl bg-white border border-gray-200 hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm`}
                aria-label="Open user menu"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ring-2 ring-blue-100">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="hidden md:block text-sm font-semibold text-gray-900">
                  {user?.name || user?.email || "User"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                  className={`hidden md:block w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    isUserMenuOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-blue-100">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User Status */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Plan</span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${getPlanBadgeColor()}`}
                      >
                        {getPlanDisplayName()}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={async () => {
                        setIsSigningOut(true);
                        try {
                          await onSignOut();
                        } finally {
                          setIsSigningOut(false);
                        }
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? (
                        <Spinner size={16} className="mr-2" />
                      ) : (
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      )}
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-[88px] z-40 md:ml-64">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto scrollbar-hide">
            {mainNavItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center space-x-1 md:space-x-2 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl transition-all duration-200 font-medium relative group whitespace-nowrap ${
                    isActive
                      ? "text-white bg-blue-600 shadow"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-base md:text-lg">
                    <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </span>
                  <span className="text-sm md:text-base">{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl border-r border-gray-200 flex flex-col z-[995] transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          {/* Logo at the top */}
          <div className="flex flex-col items-center justify-center pt-8 pb-6">
            <img
              src="/logo1.png"
              alt="SKYBOX Logo"
              className="w-20 h-20 object-contain mb-4"
            />
            <span className="text-2xl font-bold text-gray-800 tracking-wide">
              SKYBOX
            </span>
          </div>

          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Navigation</h2>
            <p className="text-sm text-gray-500 mt-1">Organize your files</p>
          </div>

          {/* Categories Section */}
          <div className="flex-1 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
                      activeSection === item.id
                        ? `${item.bgColor} ${item.color} shadow-sm`
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        activeSection === item.id
                          ? item.bgColor
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity & Storage Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Activity & Storage
              </h3>
              <div className="space-y-2">
                {activityItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
                      activeSection === item.id
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        activeSection === item.id
                          ? "bg-blue-100"
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Storage Usage Footer */}
          <div className="p-6 border-t border-blue-100/50 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Storage Used
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatStorage(storageUsage.used)} /{" "}
                    {formatStorage(storageUsage.total)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              <Button
                onClick={() => {
                  setActiveSection("upgrade-plan");
                  setIsSidebarOpen(false);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
                size="sm"
              >
                Upgrade Storage
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <section className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto md:ml-64">
          {user && (
            <DashboardContentFixed
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              user={user}
              onSignOut={onSignOut}
              searchQuery={searchQuery}
              refreshStorageUsage={refreshStorageUsage}
              storageUsage={storageUsage}
            />
          )}
        </section>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setActiveSection("upload")}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-110 z-50 flex items-center justify-center"
      >
        <PlusIcon className="w-8 h-8" />
      </button>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[990] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Helper function to get icons
function getIcon(iconName: string) {
  switch (iconName) {
    case "house":
      return "🏠";
    case "upload":
      return "📤";
    case "folder":
      return "📁";
    case "star":
      return "⭐";
    case "trash-2":
      return "🗑️";
    default:
      return "📄";
  }
}

export default DashboardLayout;
