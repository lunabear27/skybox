"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/session.actions";
import {
  signOutUser,
  resendVerificationEmail,
} from "@/lib/actions/user.actions";
import DashboardLayout from "@/components/DashboardLayout";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { Mail, Shield, CheckCircle } from "lucide-react";

interface User {
  $id: string;
  email: string;
  name: string;
  $createdAt: string;
  emailVerification: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch {
        router.push("/sign-in");
      } finally {
        setIsLoading(false);
      }
    };

    if (isMounted) {
      checkSession();
    }
  }, [router, isMounted]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);
    setResendMessage("");

    try {
      const result = await resendVerificationEmail(user.email);
      if (result.success) {
        setResendMessage("Verification email sent! Please check your inbox.");
      } else {
        setResendMessage(result.error || "Failed to send verification email.");
      }
    } catch (error) {
      setResendMessage("Failed to send verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleRefreshVerification = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Main card */}
        <div className="relative w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            {/* Logo and header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img
                  src="/logo1.png"
                  alt="SKYBOX"
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to SKYBOX
              </h1>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>

            {/* Loading spinner */}
            <div className="flex justify-center">
              <Spinner size={48} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show email verification required screen
  if (!user.emailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Main card */}
        <div className="relative w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            {/* Logo and header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img
                  src="/logo1.png"
                  alt="SKYBOX"
                  className="w-20 h-20 object-contain"
                />
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Shield className="text-orange-600" size={32} />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Email Verification Required
              </h1>
              <p className="text-gray-600">
                Please verify your email address to access SKYBOX
              </p>
            </div>

            {/* Verification info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <Mail className="text-blue-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Verification Email Sent
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    We sent a verification email to{" "}
                    <strong>{user.email}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Success message */}
            {resendMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-600" size={16} />
                  <p className="text-sm text-green-700">{resendMessage}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isResending ? (
                  <div className="flex items-center space-x-2">
                    <Spinner size={20} className="text-white" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Mail size={20} />
                    <span>Resend Verification Email</span>
                  </div>
                )}
              </Button>

              <Button
                onClick={handleRefreshVerification}
                variant="outline"
                className="w-full h-12 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle size={20} />
                  <span>I&apos;ve Verified My Email</span>
                </div>
              </Button>

              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full h-12 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                Sign Out
              </Button>
            </div>

            {/* Help text */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Can&apos;t find the email? Check your spam folder or contact
                support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardLayout user={user} onSignOut={handleSignOut} />;
}
