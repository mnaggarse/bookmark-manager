"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginWithEmail,
  loginWithGoogle,
  signupWithEmail,
} from "@/lib/firebase";
import { cn } from "@/lib/utils";
import {
  BookmarkIcon,
  CloudLightningIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useState } from "react";

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code;
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please log in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Your password is too weak. It must be at least 6 characters.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/network-request-failed":
        return "Network connection failed. Please check your internet connection.";
      case "auth/too-many-requests":
        return "Too many failed login attempts. Please try again later.";
      default:
        return (
          err?.message || "An unexpected error occurred. Please try again."
        );
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      // Suppress popup-closed errors since they are just user cancellations
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(
          err.message || "Failed to sign in with Google. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email.trim(), password);
      } else {
        await signupWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      console.error(`${mode === "login" ? "Login" : "Sign Up"} Error:`, err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      {/* Background decorative blobs */}
      <div className="absolute top-1/4 left-1/4 -z-10 size-96 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/10" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 size-96 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-600/10" />

      <Card className="w-full max-w-md border-zinc-200/80 bg-white/80 shadow-2xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg dark:bg-white dark:text-zinc-950">
            <BookmarkIcon className="size-7" />
          </div>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Bookmark Manager
            </CardTitle>
            <CardDescription className="text-balance text-zinc-500 dark:text-zinc-400">
              A premium, synchronized space for all your bookmarks.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Tab Control */}
          <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed",
                mode === "login"
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              Login
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed",
                mode === "signup"
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:focus:border-white dark:focus:ring-white"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:focus:border-white dark:focus:ring-white"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:focus:border-white dark:focus:ring-white"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-11 w-full rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="size-4 animate-spin text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>
                    {mode === "login" ? "Logging in..." : "Creating account..."}
                  </span>
                </>
              ) : (
                <span>{mode === "login" ? "Login" : "Sign Up"}</span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 px-2 text-zinc-400 dark:bg-zinc-900/80 dark:text-zinc-500">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 cursor-pointer disabled:cursor-not-allowed"
          >
            <svg
              className="size-5"
              aria-hidden="true"
              focusable="false"
              role="img"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google</span>
          </Button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheckIcon className="size-4 shrink-0 text-emerald-500" />
              <span>
                Private & secure: data stays synced to your personal Firebase.
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <CloudLightningIcon className="size-4 shrink-0 text-violet-500" />
              <span>
                Real-time updates: bookmarks stay in sync across all your
                devices.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
