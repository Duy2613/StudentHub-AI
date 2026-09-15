"use client";

// app/login/page.jsx
//
// Đăng nhập StudentHub AI:
// - Đăng nhập bằng Google OAuth & GitHub OAuth
// - "Ghi nhớ đăng nhập" chỉ điều khiển preference; phiên thật dùng HttpOnly cookie
// - Tích hợp CreativeShaderCanvas & Double-Bezel Cyber Glassmorphism

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Sparkles } from "lucide-react";
import {
  AuthCard,
  InputField,
  PasswordInput,
  CheckboxField,
  Button,
  GoogleButton,
  GithubButton,
  ErrorMessage,
} from "@/components/auth/AuthUI";
import {
  signInWithPassword,
  signInWithGoogle,
  signInWithGitHub,
  translateAuthError,
  setRememberMePreference,
} from "@/lib/auth/authService";
import { getAuthCapabilities } from "@/lib/auth/authCapabilities";
import { useAuth } from "@/lib/auth/AuthContext";
import { normalizeAuthReturnPath, postAuthDestination } from "@/lib/auth/authRedirects";

const LoginPage = () => {
  const router = useRouter();
  const { isAuthenticated, profile, ready, status } = useAuth();
  const capabilities = getAuthCapabilities();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  // /login is a public entry point, not a second authenticated surface. Once
  // the root provider has resolved the canonical session, an existing user is
  // returned to the validated in-app destination instead of seeing login
  // again while another page is still waiting for auth bootstrap.
  useEffect(() => {
    if (!ready || status !== "READY" || !isAuthenticated) return;
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const next = normalizeAuthReturnPath(params?.get("next") || params?.get("returnPath"));
    router.replace(postAuthDestination({ next, onboarded: profile?.onboarded === true }));
  }, [isAuthenticated, profile?.onboarded, ready, router, status]);

  // Kiểm tra lỗi truyền từ OAuth callback hoặc redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError === "auth_misconfigured") {
        setError(capabilities.emailPasswordMessage);
      } else if (urlError === "google_unsupported_provider") {
        setError(capabilities.googleMessage);
      } else if (urlError === "github_unsupported_provider") {
        setError(capabilities.githubMessage);
      } else if (urlError === "google_login_failed" || urlError === "oauth_failed") {
        setError("Đăng nhập bằng OAuth không thành công hoặc đã bị hủy. Vui lòng thử lại.");
      } else if (urlError === "session_unavailable") {
        setError("Dịch vụ phiên đăng nhập an toàn đang tạm thời không khả dụng. Vui lòng thử lại sau.");
      } else if (urlError === "email_registered_use_password") {
        setError(
          "Tài khoản này đã được đăng ký bằng Email & Mật khẩu từ trước. Theo chính sách bảo mật, bạn không thể đăng nhập bằng OAuth cho tài khoản này. Vui lòng nhập Mật khẩu để đăng nhập."
        );
      }
    }
  }, [capabilities.googleMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { applicationUser } = await signInWithPassword(email, password, rememberMe);

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const returnUrl = params?.get("next") || params?.get("returnPath");
      const safeNext = postAuthDestination({
        next: normalizeAuthReturnPath(returnUrl),
        onboarded: applicationUser?.onboarded === true,
      });

      router.push(safeNext);
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(async () => {
    if (isOAuthLoading || isLoading) return;
    setError(null);
    if (capabilities.google !== "READY") {
      setError(capabilities.googleMessage);
      return;
    }
    setIsOAuthLoading(true);
    setRememberMePreference(rememberMe);
    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      await signInWithGoogle(normalizeAuthReturnPath(params?.get("next") || params?.get("returnPath")));
    } catch (err) {
      setError(translateAuthError(err));
      setIsOAuthLoading(false);
    }
  }, [isOAuthLoading, isLoading, rememberMe, capabilities]);

  const handleGitHubLogin = useCallback(async () => {
    if (isOAuthLoading || isLoading) return;
    setError(null);
    setIsOAuthLoading(true);
    setRememberMePreference(rememberMe);
    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      await signInWithGitHub(normalizeAuthReturnPath(params?.get("next") || params?.get("returnPath")));
    } catch (err) {
      setError(translateAuthError(err));
      setIsOAuthLoading(false);
    }
  }, [isOAuthLoading, isLoading, rememberMe, capabilities.github]);

  const isAnyLoading = isLoading || isOAuthLoading;

  return (
    <AuthCard mode="cosmic-wave">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-5 group/icon">
          <div className="absolute -inset-2 bg-gradient-to-tr from-teal-500/20 to-indigo-600/20 rounded-full blur-lg opacity-40 group-hover/icon:opacity-70 transition-opacity" />
          <div className="h-14 w-14 bg-gradient-to-tr from-teal-500/30 to-indigo-600/30 border border-teal-400/30 rounded-2xl flex items-center justify-center relative z-10 shadow-md">
            <Sparkles className="h-7 w-7 text-teal-300" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold font-human text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-2 text-sm text-gray-400 font-medium font-human">
          Đăng nhập StudentHub AI để tiếp tục
        </p>
      </div>

      {/* Social OAuth Actions (Google & GitHub) */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <GoogleButton
          isLoading={isOAuthLoading}
          isDisabled={isLoading}
          onClick={handleGoogleLogin}
          capability={capabilities}
        />
        <GithubButton isLoading={isOAuthLoading} isDisabled={isLoading} onClick={handleGitHubLogin} capability={capabilities} />
      </div>

      <div className="my-6 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="px-4 bg-space-950/80 backdrop-blur-xl text-gray-400 font-medium">Hoặc đăng nhập mật khẩu</span>
          </div>
        </div>
      </div>

      <form className="space-y-4 relative z-10" onSubmit={handleSubmit} autoComplete="off">
        <InputField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="you@school.edu"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isAnyLoading}
        />
        <PasswordInput
          id="password"
          name="password"
          label="Mật khẩu"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isAnyLoading}
        />

        {/* Remember Me Checkbox */}
        <div className="py-0.5">
          <CheckboxField
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            label="Ghi nhớ đăng nhập"
            helperText={rememberMe ? "Lưu lâu dài" : "Xóa khi tắt tab"}
            disabled={isAnyLoading}
          />
        </div>

        <ErrorMessage message={error} />
        <div className="pt-2">
          <Button type="submit" isLoading={isLoading} disabled={isOAuthLoading}>
            Đăng nhập
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 relative z-10">
        Chưa có tài khoản?{" "}
        <a href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          Đăng ký ngay
        </a>
      </p>
    </AuthCard>
  );
};

export default LoginPage;
