"use client";

// app/(auth)/login/page.jsx
//
// Đăng nhập bằng Email/Mật khẩu hoặc Google, qua Supabase Auth.

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mail, Sparkles } from "lucide-react";
import {
  AuthCard,
  InputField,
  PasswordInput,
  Button,
  GoogleButton,
  ErrorMessage,
} from "@/components/auth/AuthUI";
import { signInWithPassword, signInWithGoogle } from "@/lib/auth/authService";
import { useAuth } from "@/lib/auth/AuthContext";

const LoginPage = () => {
  const router = useRouter();
  const { ensureSynced } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signInWithPassword(email, password);
      // fullName để trống vì đây là đăng nhập lại, không phải lần đăng ký
      // đầu — xem TODO trong authService.js về việc backend xử lý ra sao.
      await ensureSynced();
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(async () => {
    if (isGoogleLoading || isLoading) return;
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle(); // redirect toàn trang sang Google
    } catch (err) {
      setError(err.message || "Không thể bắt đầu đăng nhập Google.");
      setIsGoogleLoading(false);
    }
  }, [isGoogleLoading, isLoading]);

  const isAnyLoading = isLoading || isGoogleLoading;

  return (
    <AuthCard>
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="relative mb-6 group/icon">
          <div className="absolute -inset-3 bg-gradient-to-tr from-indigo-600/50 to-purple-600/50 rounded-full blur-xl opacity-50 animate-pulse-slow group-hover/icon:opacity-80 transition-opacity"></div>
          <div className="h-14 w-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center relative z-10 shadow-lg ring-1 ring-white/20">
            <Sparkles className="h-7 w-7 text-white fill-white/20" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-indigo-200 tracking-tight drop-shadow-sm">
          Welcome Back
        </h2>
        <p className="mt-3 text-base text-gray-400 font-medium">Đăng nhập StudentHub AI</p>
      </div>

      <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
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
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isAnyLoading}
        />
        <ErrorMessage message={error} />
        <div className="pt-2">
          <Button type="submit" isLoading={isLoading} disabled={isGoogleLoading}>
            Sign In
          </Button>
        </div>
      </form>

      <div className="mt-8 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="px-4 bg-transparent backdrop-blur-xl text-gray-500 font-medium">Hoặc</span>
          </div>
        </div>
        <div className="mt-6">
          <GoogleButton isLoading={isGoogleLoading} isDisabled={isLoading} onClick={handleGoogleLogin} />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500 relative z-10">
        Chưa có tài khoản?{" "}
        <a href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          Đăng ký ngay
        </a>
      </p>
    </AuthCard>
  );
};

export default LoginPage;
