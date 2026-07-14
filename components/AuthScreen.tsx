"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginWithGoogle } from "@/lib/firebase";
import {
  BookmarkIcon,
  CloudLightningIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useState } from "react";

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              Antigravity Bookmarks
            </CardTitle>
            <CardDescription className="text-balance text-zinc-500 dark:text-zinc-400">
              A premium, synchronized space for all your bookmarks.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white shadow-md hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
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
            {isLoading ? "Signing in..." : "Continue with Google"}
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
