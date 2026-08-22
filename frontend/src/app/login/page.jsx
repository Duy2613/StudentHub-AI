"use client";

// app/login/page.jsx
//
// Đăng nhập StudentHub AI:
// - Đăng nhập nhanh 1 chạm bằng GitHub OAuth (Khuyên dùng)
// - Đăng nhập bằng Google OAuth
// - Trải nghiệm Demo Sinh viên & Chuyên gia uy tín tức thì

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Sparkles, GraduationCap, Star } from "lucide-react";
import {
  AuthCard,
  InputField,
  PasswordInput,
  Button,
  GitHubButton,
  GoogleButton,
  ErrorMessage,
} from "@/components/auth/AuthUI";
import {
  signInWithPassword,
  signInWithGoogle,
  signInWithGitHub,
  translateAuthError,
} from "@/lib/auth/authService";
import { useAuth } from "@/lib/auth/AuthContext";

const LoginPage = () => {
  const router = useRouter();
  const { session, profile, ensureSynced, loginAsDemo } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  // Kiểm tra lỗi truyền từ OAuth callback hoặc redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError === "github_login_failed") {
        setError("Đăng nhập bằng GitHub không thành công hoặc đã bị hủy. Vui lòng thử lại.");
      } else if (urlError === "google_login_failed") {
        setError("Đăng nhập bằng Google không thành công hoặc đã bị hủy. Vui lòng thử lại.");
      } else if (urlError === "email_registered_use_password") {
        setError(
          "Tài khoản này đã được đăng ký bằng Email & Mật khẩu từ trước. Theo chính sách bảo mật, bạn không thể đăng nhập bằng OAuth cho tài khoản này. Vui lòng nhập Mật khẩu để đăng nhập."
        );
      }
    }
  }, []);

  // Nếu đã có session thì chuyển hướng
  useEffect(() => {
    if (session) {
      if (profile && !profile.onboarded) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [session, profile, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { user } = await signInWithPassword(email, password);
      await ensureSynced();
      
      const isOnboarded = user?.user_metadata?.onboarded;
      if (!isOnboarded) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = useCallback(async () => {
    if (isOAuthLoading || isLoading) return;
    setError(null);
    setIsOAuthLoading(true);
    try {
      await signInWithGitHub();
    } catch (err) {
      setError(translateAuthError(err));
      setIsOAuthLoading(false);
    }
  }, [isOAuthLoading, isLoading]);

  const handleGoogleLogin = useCallback(async () => {
    if (isOAuthLoading || isLoading) return;
    setError(null);
    setIsOAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(translateAuthError(err));
      setIsOAuthLoading(false);
    }
  }, [isOAuthLoading, isLoading]);

  const isAnyLoading = isLoading || isOAuthLoading;

  return (
    <AuthCard>
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-5 group/icon">
          <div className="absolute -inset-3 bg-gradient-to-tr from-indigo-600/50 to-purple-600/50 rounded-full blur-xl opacity-50 animate-pulse-slow group-hover/icon:opacity-80 transition-opacity"></div>
          <div className="h-14 w-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center relative z-10 shadow-lg ring-1 ring-white/20">
            <Sparkles className="h-7 w-7 text-white fill-white/20" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-indigo-200 tracking-tight drop-shadow-sm">
          Welcome Back
        </h2>
        <p className="mt-2.5 text-sm text-gray-400 font-medium">
          Đăng nhập StudentHub AI để tiếp tục
        </p>
      </div>

      {/* GitHub OAuth Primary Action */}
      <div className="space-y-3 relative z-10">
        <GitHubButton isLoading={isOAuthLoading} isDisabled={isLoading} onClick={handleGitHubLogin} />
        <GoogleButton isLoading={isOAuthLoading} isDisabled={isLoading} onClick={handleGoogleLogin} />
      </div>

      <div className="my-6 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="px-4 bg-transparent backdrop-blur-xl text-gray-500 font-medium">Hoặc đăng nhập mật khẩu</span>
          </div>
        </div>
      </div>

      <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
        <InputField
          id="email"
          label="Email"
          type="email"
          placeholder="you@school.edu"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isAnyLoading}
        />
        <PasswordInput
          id="password"
          label="Mật khẩu"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isAnyLoading}
        />
        <ErrorMessage message={error} />
        <div className="pt-2">
          <Button type="submit" isLoading={isLoading} disabled={isOAuthLoading}>
            Đăng nhập
          </Button>
        </div>
      </form>

      {/* Quick Demo Options */}
      <div className="mt-6 pt-6 border-t border-white/10 relative z-10 space-y-3">
        <p className="text-xs text-center text-gray-400 font-medium">
          ⚡ Trải nghiệm nhanh giao diện (Demo Mode):
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              loginAsDemo("student");
              router.push("/dashboard");
            }}
            className="py-2.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-102"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" /> Demo Sinh viên
          </button>
          <button
            type="button"
            onClick={() => {
              loginAsDemo("expert");
              router.push("/dashboard");
            }}
            className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-102"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Demo Chuyên gia
          </button>
        </div>
      </div>

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
