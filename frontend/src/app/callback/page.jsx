"use client";

// frontend/src/app/callback/page.jsx
//
// Trình xử lý Callback OAuth (Google / GitHub qua Supabase Auth):
// - PKCE code được đổi bằng Supabase trước khi tạo application session.
// - Bearer proof chỉ tồn tại trong bộ nhớ của trang callback và được đổi một lần.
// - Đích return-to luôn đi qua allowlist nội bộ.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  exchangeApplicationSession,
  getApplicationSession,
  getAuthCapabilities,
  signOutSupabase,
  logAuthError,
  logAuthInfo,
} from "@/lib/auth/authService";
import {
  buildLoginErrorPath,
  normalizeAuthReturnPath,
  postAuthDestination,
} from "@/lib/auth/authRedirects";
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
      const searchParams = new URLSearchParams(window.location.search);
      const providerHint = String(searchParams.get("provider") || "").toLowerCase();
      const next = normalizeAuthReturnPath(searchParams.get("next") || searchParams.get("returnTo"));
      const goToLogin = (errorCode) => router.replace(buildLoginErrorPath(errorCode, next));

      // 0. Bắt lỗi trả về qua URL Query hoặc Hash Fragment từ OAuth Provider (ví dụ: validation_failed: Unsupported provider)
      if (typeof window !== "undefined") {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const rawError = searchParams.get("error") || hashParams.get("error") || "";
        const rawDesc = searchParams.get("error_description") || hashParams.get("error_description") || "";
        const combined = `${rawError} ${rawDesc}`.toLowerCase();

        if (combined.includes("unsupported provider") || combined.includes("validation_failed")) {
          logAuthError("OAuthCallback:unsupportedProvider", new Error(rawDesc || rawError));
          const provider = providerHint || (combined.includes("github") ? "github" : combined.includes("google") ? "google" : "");
          goToLogin(provider === "google" ? "google_unsupported_provider" : provider === "github" ? "github_unsupported_provider" : "oauth_failed");
          return;
        }

        if (rawError || rawDesc) {
          logAuthError("OAuthCallback:urlError", new Error(rawDesc || rawError));
          goToLogin("oauth_failed");
          return;
        }
      }

      try {
        if (!getAuthCapabilities().supabaseConfigured) {
          goToLogin("auth_misconfigured");
          return;
        }
        // 1. Complete the supported PKCE flow. Hash parsing remains a bounded
        // compatibility path for older links already in circulation.
        let session = null;
        let error = null;
        const code = searchParams.get("code");
        if (code) {
          const exchangedCode = await supabase.auth.exchangeCodeForSession(code);
          session = exchangedCode.data?.session || null;
          error = exchangedCode.error || null;
        } else {
          const current = await supabase.auth.getSession();
          session = current.data?.session || null;
          error = current.error || null;
        }

        if (error) {
          logAuthError("OAuthCallback:getSession", error);
          goToLogin("oauth_failed");
          return;
        }

        if (!session || !session.user) {
          logAuthInfo("OAuthCallback", "Không tìm thấy session tức thì, đợi onAuthStateChange...");
          
          // Fallback đợi onAuthStateChange nếu URL hash parsing đang diễn ra
          let timeoutId;
          let subscription;
          let settled = false;
          const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (newSession?.user && !settled) {
              settled = true;
              clearTimeout(timeoutId);
              subscription?.unsubscribe();
              await handleSuccessfulSession(newSession);
            }
          });
          subscription = authListener?.subscription;

          // Timeout an toàn 4 giây
          timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            subscription?.unsubscribe();
            goToLogin("oauth_failed");
          }, 4000);
          return;
        }

        await handleSuccessfulSession(session);
      } catch (err) {
        logAuthError("OAuthCallback:process", err);
        goToLogin("oauth_failed");
      }
    };

    const handleSuccessfulSession = async (currentSession) => {
      const accessToken = currentSession.access_token;
      logAuthInfo("OAuthCallback", "Xác thực OAuth thành công.");

      setStatusMessage("Đang tạo phiên đăng nhập an toàn...");

      // 4. Exchange the transient provider proof for the server-owned opaque
      // session. Failure is terminal: the UI must not claim authentication
      // when durable session persistence is unavailable.
      if (!accessToken) {
        goToLogin("oauth_failed");
        return;
      }
      setStatusMessage("Đang tạo phiên đăng nhập an toàn...");
      const exchanged = await exchangeApplicationSession(accessToken);
      if (!exchanged.success) {
        const exchangeError = new Error("Không thể tạo phiên đăng nhập an toàn.");
        exchangeError.code = exchanged.code;
        logAuthError("OAuthCallback:sessionExchange", exchangeError);
        await signOutSupabase();
        goToLogin("session_unavailable");
        return;
      }

      // 5. Read onboarding from the server-owned application session. Provider
      // metadata is never used to grant roles or access.
      const applicationState = await getApplicationSession();
      if (!applicationState.authenticated || !applicationState.user) {
        logAuthError("OAuthCallback:applicationSession", new Error(applicationState.code || "APPLICATION_SESSION_NOT_CONFIRMED"));
        await signOutSupabase();
        goToLogin("session_unavailable");
        return;
      }
      const isOnboarded = applicationState.user.onboarded === true;

      setStatusMessage("Hoàn tất! Đang chuyển hướng...");

      const destination = postAuthDestination({ next, onboarded: isOnboarded });
      logAuthInfo("OAuthCallback", `Hoàn tất OAuth -> ${destination.startsWith("/onboarding") ? "onboarding" : "return-to"}.`);
      router.replace(destination);
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
