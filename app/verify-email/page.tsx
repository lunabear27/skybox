"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  verifyEmail,
  resendVerificationEmail,
} from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyUserEmail = async () => {
      const userId = searchParams.get("userId");
      const secret = searchParams.get("secret");

      if (!userId || !secret) {
        setStatus("error");
        setMessage(
          "Invalid verification link. Please check your email for the correct link."
        );
        return;
      }

      try {
        const result = await verifyEmail(userId, secret);

        if (result.success) {
          setStatus("success");
          setMessage(result.message || "Email verified successfully!");
          // Store the email for resend functionality
          if (result.email) {
            setUserEmail(result.email);
          }
        } else {
          setStatus("error");
          setMessage(result.error || "Verification failed. Please try again.");
          // Store the email for resend functionality even on error
          if (result.email) {
            setUserEmail(result.email);
          }
        }
      } catch (error) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verifyUserEmail();
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!userEmail) {
      setMessage(
        "Unable to resend verification email. Please try signing up again."
      );
      return;
    }

    setIsResending(true);
    setMessage("");

    try {
      const result = await resendVerificationEmail(userEmail);
      if (result.success) {
        setMessage("Verification email sent! Please check your inbox.");
      } else {
        setMessage(result.error || "Failed to send verification email.");
      }
    } catch (error) {
      setMessage("Failed to send verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

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

            {/* Loading State */}
            {status === "loading" && (
              <div>
                <div className="flex justify-center mb-4">
                  <Spinner size={48} className="text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Verifying Your Email
                </h1>
                <p className="text-gray-600">
                  Please wait while we verify your email address...
                </p>
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <div>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-600 text-4xl" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Email Verified!
                </h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <Link href="/sign-in">
                  <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                    Sign In to Your Account
                  </Button>
                </Link>
              </div>
            )}

            {/* Error State */}
            {status === "error" && (
              <div>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="text-red-600 text-4xl" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Verification Failed
                </h1>
                <p className="text-gray-600 mb-6">{message}</p>

                <div className="space-y-4">
                  <Button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {isResending ? (
                      <div className="flex items-center space-x-2">
                        <Spinner size={20} className="text-white" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>

                  <Link href="/sign-in">
                    <Button
                      variant="outline"
                      className="w-full h-12 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
                    >
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Need help? Contact support or try signing in again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
