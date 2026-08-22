"use client";

// app/callback/page.jsx
//
// Google redirect về đây sau khi Supabase xử lý OAuth xong.
// QUY TẮC BẢO MẬT:
// Nếu tài khoản này ban đầu được đăng ký bằng Email & Mật khẩu -> Chặn đăng nhập Google và yêu cầu dùng Mật khẩu.

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { signOutSupabase } from "@/lib/auth/authService";
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
    const user = session.user;
    const identities = user?.identities || [];
    const appProvider = user?.app_metadata?.provider;
    const providers = user?.app_metadata?.providers || [];

    // Kiểm tra xem tài khoản này ban đầu có được tạo bằng Email & Mật khẩu hay không
    const emailIdentity = identities.find((i) => i.provider === "email");
    const googleIdentity = identities.find((i) => i.provider === "google");

    const isOriginallyEmail =
      (emailIdentity && !googleIdentity) ||
      (emailIdentity && googleIdentity && new Date(emailIdentity.created_at) < new Date(googleIdentity.created_at)) ||
      (appProvider === "email" && providers.length === 1 && providers[0] === "email");

    if (isOriginallyEmail) {
      // Đăng ký bằng Email/Mật khẩu từ trước -> Không cho phép đăng nhập Google
      signOutSupabase().finally(() => {
        router.replace("/login?error=email_registered_use_password");
      });
      return;
    }

    const fullName =
      user?.user_metadata?.full_name || user?.user_metadata?.name || "";

    ensureSynced(fullName).finally(() => {
      const isOnboarded = user?.user_metadata?.onboarded;
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
      <p className="text-base text-gray-400 font-medium">Đang kiểm tra và hoàn tất đăng nhập...</p>
    </div>
  );
}
