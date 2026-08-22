"use client";

// frontend/src/app/callback/page.jsx
//
// Trình xử lý Callback OAuth (Google / GitHub qua Supabase Auth):
// - Loại bỏ hoàn toàn lệch pha đồng bộ (Async Mismatch) bằng chuỗi thực thi tuần tự:
//   1. Trực tiếp giải mã Session từ URL qua supabase.auth.getSession()
//   2. Lưu Bearer Token vào Storage tức thì
//   3. Gọi POST /api/auth/sync sang ASP.NET Core Backend
//   4. Phân luồng an toàn: Chưa Onboarded -> /onboarding | Đã Onboarded -> /dashboard

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  setStoredToken,
  syncBackendUser,
  signOutSupabase,
  logAuthError,
  logAuthInfo,
} from "@/lib/auth/authService";
import { Loader2, Sparkles } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Đang phân giải phiên đăng nhập OAuth...");
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const processOAuthCallback = async () => {
      logAuthInfo("OAuthCallback", "Bắt đầu phân giải OAuth callback.");

      try {
        // 1. Lấy session từ Supabase (tự động phân giải hash fragment / code)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logAuthError("OAuthCallback:getSession", error);
          router.replace("/login?error=oauth_failed");
          return;
        }

        if (!session || !session.user) {
          logAuthInfo("OAuthCallback", "Không tìm thấy session tức thì, đợi onAuthStateChange...");
          
          // Fallback đợi onAuthStateChange nếu URL hash parsing đang diễn ra
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession?.user) {
              authListener.subscription.unsubscribe();
              await handleSuccessfulSession(newSession);
            }
          });

          // Timeout an toàn 4 giây
          setTimeout(() => {
            authListener.subscription.unsubscribe();
            router.replace("/login?error=oauth_failed");
          }, 4000);
          return;
        }

        await handleSuccessfulSession(session);
      } catch (err) {
        logAuthError("OAuthCallback:process", err);
        router.replace("/login?error=oauth_failed");
      }
    };

    const handleSuccessfulSession = async (currentSession) => {
      const user = currentSession.user;
      const accessToken = currentSession.access_token;
      logAuthInfo("OAuthCallback", `Xác thực thành công cho user: ${user.email}`);

      // 2. Lưu token vào Storage
      setStoredToken(accessToken, true);
      setStatusMessage("Đang đồng bộ dữ liệu với máy chủ ASP.NET Core...");

      // 3. Kiểm tra xem tài khoản có bị xung đột (ban đầu đăng ký email/mật khẩu)
      const identities = user.identities || [];
      const emailIdentity = identities.find((i) => i.provider === "email");
      const oauthIdentity = identities.find((i) => i.provider === "google" || i.provider === "github");

      const isOriginallyEmail =
        emailIdentity && oauthIdentity && new Date(emailIdentity.created_at) < new Date(oauthIdentity.created_at);

      if (isOriginallyEmail) {
        logAuthInfo("OAuthCallback", "Tài khoản đăng ký ban đầu bằng mật khẩu. Yêu cầu đăng nhập mật khẩu.");
        await signOutSupabase();
        router.replace("/login?error=email_registered_use_password");
        return;
      }

      // 4. Đồng bộ Bearer Token sang ASP.NET Core Backend
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.user_name ||
        user.email?.split("@")[0] ||
        "";

      await syncBackendUser(
        {
          id: user.id,
          email: user.email,
          fullName: fullName,
          role: user.user_metadata?.role || "student",
          avatarUrl: user.user_metadata?.avatar_url,
          githubUsername: user.user_metadata?.user_name || user.user_metadata?.preferred_username,
        },
        accessToken
      );

      // 5. Kiểm tra Onboarding và điều hướng
      const isOnboarded = user.user_metadata?.onboarded === true;
      const role = user.user_metadata?.role;

      setStatusMessage("Hoàn tất! Đang chuyển hướng...");

      if (!isOnboarded || !role) {
        logAuthInfo("OAuthCallback", "Chưa hoàn tất onboarding -> Chuyển về /onboarding");
        router.replace("/onboarding");
      } else {
        logAuthInfo("OAuthCallback", "Đã hoàn tất hồ sơ -> Chuyển về /dashboard");
        router.replace("/dashboard");
      }
    };

    processOAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-space-950 text-gray-300 px-4">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
      <p className="text-sm sm:text-base text-gray-300 font-medium text-center">{statusMessage}</p>
    </div>
  );
}
