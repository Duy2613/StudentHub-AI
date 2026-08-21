"use client";

// app/register/page.jsx
//
// Đăng ký tài khoản trực tiếp qua Backend ASP.NET Core API của StudentHub:
// - Gọi POST /api/auth/register (mã hóa mật khẩu bằng PasswordHasher, lưu DB)
// - Tự động nhận JWT Token và chuyển thẳng vào màn hình Chọn Avatar & Vai trò (/onboarding)

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Sparkles, User, GraduationCap, Star } from "lucide-react";
import {
  AuthCard,
  InputField,
  PasswordInput,
  Button,
  GoogleButton,
  ErrorMessage,
  StudentBenefitBanner,
} from "@/components/auth/AuthUI";
import {
  signUpWithEmail,
  signInWithGoogle,
  translateAuthError,
} from "@/lib/auth/authService";
import { useAuth } from "@/lib/auth/AuthContext";

const RegisterPage = () => {
  const router = useRouter();
  const { session, profile, loginAsDemo } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  // Nếu đã đăng nhập và đã hoàn tất profile -> /dashboard, chưa -> /onboarding
  useEffect(() => {
    if (session) {
      if (profile && profile.onboarded) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [session, profile, router]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, fullName);
      // Đăng ký thành công -> Vào thẳng màn hình chọn Avatar & Vai trò
      router.push("/onboarding");
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (isGoogleLoading || isLoading) return;
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(translateAuthError(err));
      setIsGoogleLoading(false);
    }
  };

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
          Tạo tài khoản
        </h2>
        <p className="mt-3 text-base text-gray-400 font-medium">
          Tham gia StudentHub AI
        </p>
      </div>

      <StudentBenefitBanner email={email} />
      <form className="space-y-6 relative z-10" onSubmit={handleSignUp}>
        <InputField
          id="fullName"
          label="Họ và tên"
          type="text"
          placeholder="Nguyễn Văn A"
          icon={User}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={isLoading || isGoogleLoading}
        />
        <InputField
          id="email"
          label="Email (Khuyên dùng email trường .edu)"
          type="email"
          placeholder="you@school.edu"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading || isGoogleLoading}
        />
        <PasswordInput
          id="password"
          label="Mật khẩu"
          placeholder="Tối thiểu 6 ký tự"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={isLoading || isGoogleLoading}
        />
        <ErrorMessage message={error} />
        <div className="pt-2">
          <Button type="submit" isLoading={isLoading} disabled={isGoogleLoading}>
            Đăng ký
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
          <GoogleButton isLoading={isGoogleLoading} isDisabled={isLoading} onClick={handleGoogleSignUp} />
        </div>
      </div>

      {/* Demo Mode Options */}
      <div className="mt-6 pt-6 border-t border-white/10 relative z-10 space-y-3">
        <p className="text-xs text-center text-gray-400 font-medium">
          ⚡ Trải nghiệm nhanh giao diện:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              loginAsDemo("student");
              router.push("/onboarding");
            }}
            className="py-2.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-102"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" /> Demo Sinh viên
          </button>
          <button
            type="button"
            onClick={() => {
              loginAsDemo("expert");
              router.push("/onboarding");
            }}
            className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-102"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Demo Chuyên gia
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500 relative z-10">
        Đã có tài khoản?{" "}
        <a href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          Đăng nhập
        </a>
      </p>
    </AuthCard>
  );
};

export default RegisterPage;
