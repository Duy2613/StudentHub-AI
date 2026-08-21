"use client";

// app/callback/page.jsx
//
// Google redirect về đây sau khi Supabase xử lý OAuth xong.
// Đợi AuthContext nhận được session, gọi sync và điều hướng sang /onboarding hoặc /dashboard.

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { session, isLoading, ensureSynced } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    if (isLoading) return;

    if (!session) {
      const timeout = setTimeout(() => {
        if (!handledRef.current) {
          router.replace("/login?error=google_login_failed");
        }
      }, 3500);
      return () => clearTimeout(timeout);
    }

    handledRef.current = true;
    const fullName =
      session.user?.user_metadata?.full_name || session.user?.user_metadata?.name || "";

    ensureSynced(fullName).finally(() => {
      const isOnboarded = session.user?.user_metadata?.onboarded;
      if (!isOnboarded) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    });
  }, [session, isLoading, ensureSynced, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-space-950 text-gray-300">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
      <p className="text-base text-gray-400 font-medium">Đang hoàn tất đăng nhập Google...</p>
    </div>
  );
}
