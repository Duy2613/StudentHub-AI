"use client";

// app/callback/page.jsx
//
// OAuth Callback Handler (Google OAuth qua Supabase Auth)
// Quy trình:
// 1. Nhận session OAuth sau khi redirect từ Google
// 2. Kiểm tra trạng thái Onboarding / Role
// 3. Điều hướng: nếu chưa chọn Role -> /onboarding, nếu đã hoàn tất -> /dashboard

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { signOutSupabase } from "@/lib/auth/authService";
import { Loader2, Sparkles } from "lucide-react";

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
    const user = session.user;
    const identities = user?.identities || [];
    const appProvider = user?.app_metadata?.provider;
    const providers = user?.app_metadata?.providers || [];

    // Kiểm tra xem tài khoản này ban đầu có được tạo bằng Email & Mật khẩu hay không
    const emailIdentity = identities.find((i) => i.provider === "email");
    const oauthIdentity = identities.find((i) => i.provider === "google");

    const isOriginallyEmail =
      (emailIdentity && !oauthIdentity) ||
      (emailIdentity && oauthIdentity && new Date(emailIdentity.created_at) < new Date(oauthIdentity.created_at)) ||
      (appProvider === "email" && providers.length === 1 && providers[0] === "email");

    if (isOriginallyEmail) {
      // Đăng ký bằng Email/Mật khẩu từ trước -> Không cho phép đăng nhập qua OAuth
      signOutSupabase().finally(() => {
        router.replace("/login?error=email_registered_use_password");
      });
      return;
    }

    const fullName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.user_metadata?.user_name ||
      "";

    ensureSynced(fullName).finally(() => {
      const isOnboarded = user?.user_metadata?.onboarded === true;
      const role = user?.user_metadata?.role;

      if (!isOnboarded || !role) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    });
  }, [session, isLoading, ensureSynced, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-space-950 text-gray-300">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
      <p className="text-sm sm:text-base text-gray-400 font-medium">Đang hoàn tất xác thực OAuth...</p>
    </div>
  );
}
