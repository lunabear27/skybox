"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { resetPassword } from "@/lib/actions/user.actions";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null); // null = loading, true = valid, false = invalid
  const [userId, setUserId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    // Add a small delay to ensure searchParams are fully loaded
    const timer = setTimeout(() => {
      const userIdParam = searchParams.get("userId");
      const secretParam = searchParams.get("secret");

      setUserId(userIdParam);
      setSecret(secretParam);

      if (userIdParam && secretParam) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
        setError("Invalid reset link. Please request a new one.");
      }
    }, 100); // Small delay to ensure params are loaded

    return () => clearTimeout(timer);
  }, [searchParams]);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!userId || !secret) return;

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      console.log("🔄 Calling resetPassword...");
      const result = await resetPassword(userId, secret, values.password);
      console.log("📦 resetPassword result:", result);

      if (result.success) {
        setMessage(result.message);
        console.log("✅ Password reset successful");
        // Redirect to sign-in after 2 seconds
        setTimeout(() => {
          window.location.href = "/sign-in";
        }, 2000);
      } else {
        setError(result.error);
        console.log("❌ Password reset error:", result.error);
      }
    } catch (err: unknown) {
      console.error("💥 Caught exception in onSubmit:", err);
      const error = err as { message?: string };
      setError(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking parameters
  if (isValidToken === null) {
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
                Verifying Reset Link
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your reset link...
              </p>
            </div>

            <div className="flex justify-center">
              <Spinner size={48} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show invalid token message
  if (isValidToken === false) {
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
                Invalid Reset Link
              </h1>
              <p className="text-gray-600">
                This reset link is invalid or has expired.
              </p>
            </div>

            {/* Error message */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <Link
                href="/forgot-password"
                className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/sign-in"
                className="block text-center text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the password reset form
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
              Set New Password
            </h1>
            <p className="text-gray-600">Enter your new password below</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-700">{message}</p>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Redirecting to sign in...
              </p>
            </div>
          )}

          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full h-12 px-4 text-base bg-white/50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full h-12 px-4 text-base bg-white/50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading || !!message}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Spinner size={20} className="text-white" />
                    <span>Updating password...</span>
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </Form>

          {/* Links */}
          <div className="mt-8 text-center">
            <Link
              href="/sign-in"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function ResetPasswordLoading() {
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
              Loading...
            </h1>
            <p className="text-gray-600">
              Please wait while we load the reset page...
            </p>
          </div>

          <div className="flex justify-center">
            <Spinner size={48} className="text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
