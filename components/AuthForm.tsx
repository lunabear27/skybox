"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
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
import { createAccount, loginUser } from "@/lib/actions/user.actions";
import { useSearchParams } from "next/navigation";

type FormType = "sign-in" | "sign-up";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

const signUpSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

const AuthForm = ({ type }: { type: FormType }) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  // Check for verification parameter on sign-in page
  useEffect(() => {
    if (type === "sign-in") {
      const verification = searchParams.get("verification");
      if (verification === "sent") {
        setSuccess(
          "Email verification sent! Please check your inbox and verify your email before signing in."
        );
      }
    }
  }, [searchParams, type]);

  if (type === "sign-in") {
    return (
      <SignInForm
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    );
  } else {
    return (
      <SignUpForm
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    );
  }
};

const SignInForm = ({
  error,
  setError,
  success,
  setSuccess,
  isLoading,
  setIsLoading,
}: {
  error: string;
  setError: (error: string) => void;
  success: string;
  setSuccess: (success: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}) => {
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    console.log("🚀 SignIn onSubmit called with values:", values);
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      console.log("🔄 Calling loginUser...");
      const result = await loginUser({
        email: values.email,
        password: values.password,
      });
      console.log("📦 loginUser result:", result);

      if (result?.error) {
        console.log("❌ Login error:", result.error);
        setError(result.error);
      } else if (result?.sessionId) {
        console.log("✅ Login successful, redirecting...");
        window.location.href = "/dashboard";
      } else {
        console.log("⚠️ Unexpected result:", result);
        setError("Login failed - no session ID returned");
      }
    } catch (err: unknown) {
      console.error("💥 Caught exception in onSubmit:", err);
      const error = err as { message?: string };
      setError(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
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
              <Image
                src="/logo1.png"
                alt="SKYBOX"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600">Sign in to your SKYBOX account</p>
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
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[#3DA9FC] hover:bg-[#0077C2] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a
                href="/sign-up"
                className="text-[#3DA9FC] hover:text-[#0077C2] font-medium"
              >
                Sign up
              </a>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <a
                href="/forgot-password"
                className="text-[#3DA9FC] hover:text-[#0077C2]"
              >
                Forgot your password?
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignUpForm = ({
  error,
  setError,
  success,
  setSuccess,
  isLoading,
  setIsLoading,
}: {
  error: string;
  setError: (error: string) => void;
  success: string;
  setSuccess: (success: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}) => {
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    console.log("🚀 SignUp onSubmit called with values:", values);
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      console.log("🔄 Calling createAccount...");
      const result = await createAccount({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      console.log("📦 createAccount result:", result);

      if (result?.error) {
        console.log("❌ Account creation error:", result.error);
        setError(result.error);
      } else if (result?.success && result?.requiresVerification) {
        console.log(
          "✅ Account created successfully, showing verification message..."
        );
        setError("");
        setSuccess(
          "Account created successfully! Please check your email for verification."
        );
        setTimeout(() => {
          window.location.href = "/sign-in?verification=sent";
        }, 3000);
      } else if (
        result?.success &&
        result?.user &&
        !result?.requiresVerification
      ) {
        console.log(
          "✅ Account created successfully, redirecting to dashboard..."
        );
        window.location.href = "/dashboard";
      } else if (result?.accountId) {
        console.log(
          "✅ Account created successfully, showing verification message..."
        );
        setError("");
        setSuccess(
          "Account created successfully! Please check your email for verification."
        );
        setTimeout(() => {
          window.location.href = "/sign-in?verification=sent";
        }, 3000);
      } else {
        console.log("⚠️ Unexpected result:", result);
        setError("Account creation failed - unexpected response");
      }
    } catch (err: unknown) {
      console.error("💥 Caught exception in onSubmit:", err);
      const error = err as { message?: string };
      setError(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
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
              <Image
                src="/logo1.png"
                alt="SKYBOX"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create account
            </h1>
            <p className="text-gray-600">
              Join SKYBOX and start organizing your files
            </p>
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
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[#3DA9FC] hover:bg-[#0077C2] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a
                href="/sign-in"
                className="text-[#3DA9FC] hover:text-[#0077C2] font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
