"use client";

// app/register/page.jsx
//
// Đăng ký tài khoản 2 bước bảo mật cao:
//   Bước 1: Nhập Họ tên + Email + Mật khẩu -> signUpWithEmail() gửi mã OTP 6 số về email.
//   Bước 2: Bắt buộc nhập mã OTP 6 số -> verifySignupOtp() -> Điều hướng sang /onboarding.
//   Hỗ trợ trải nghiệm nhanh Demo Sinh viên & Chuyên gia uy tín.

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Sparkles, User, GraduationCap, Star, KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  AuthCard,
  InputField,
  PasswordInput,
  Button,
  GoogleButton,
  ErrorMessage,
  NoticeMessage,
  StudentBenefitBanner,
  GitHubButton,
} from "@/components/auth/AuthUI";
import {
  signUpWithEmail,
  verifySignupOtp,
  resendSignupOtp,
  signInWithGoogle,
  signInWithGitHub,
  translateAuthError,
} from "@/lib/auth/authService";
import { useAuth } from "@/lib/auth/AuthContext";

const STEP_FORM = "FORM";
const STEP_OTP = "OTP";

const RegisterPage = () => {
  const router = useRouter();
  const { session, profile, loginAsDemo } = useAuth();

  const [step, setStep] = useState(STEP_FORM);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Nếu đã có session và hoàn tất profile -> /dashboard, chưa -> /onboarding
  useEffect(() => {
    if (session) {
      if (profile && profile.onboarded) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [session, profile, router]);

  // Bước 1: Gửi thông tin đăng ký & nhận mã OTP qua email
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, fullName);

      // Chuyển sang bước bắt buộc nhập mã OTP 6 số
      setStep(STEP_OTP);
      setNotice(`Đã gửi mã xác nhận 6 chữ số tới ${email}. Vui lòng kiểm tra hộp thư (kể cả thư mục Spam/Rác).`);
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 2: Xác thực mã OTP 6 số
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);
    try {
      await verifySignupOtp(email, otp);
      // Xác thực thành công -> Vào thẳng màn hình chọn Avatar & Vai trò
      router.push("/onboarding");
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (isResending) return;
    setError(null);
    setIsResending(true);
    try {
      await resendSignupOtp(email);
      setNotice("Đã gửi lại mã xác nhận 6 số mới tới email của bạn.");
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsResending(false);
    }
  };

  // Đăng ký nhanh qua GitHub OAuth
  const handleGitHubSignUp = async () => {
    if (isGoogleLoading || isLoading) return;
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGitHub();
    } catch (err) {
      setError(translateAuthError(err));
      setIsGoogleLoading(false);
    }
  };

  // Đăng ký nhanh qua Google OAuth
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
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-5 group/icon">
          <div className="absolute -inset-3 bg-gradient-to-tr from-indigo-600/50 to-purple-600/50 rounded-full blur-xl opacity-50 animate-pulse-slow group-hover/icon:opacity-80 transition-opacity"></div>
          <div className="h-14 w-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center relative z-10 shadow-lg ring-1 ring-white/20">
            {step === STEP_FORM ? (
              <Sparkles className="h-7 w-7 text-white fill-white/20" />
            ) : (
              <KeyRound className="h-7 w-7 text-white" />
            )}
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-indigo-200 tracking-tight drop-shadow-sm">
          {step === STEP_FORM ? "Tạo tài khoản" : "Xác nhận mã OTP"}
        </h2>
        <p className="mt-2.5 text-sm text-gray-400 font-medium max-w-xs">
          {step === STEP_FORM
            ? "Tham gia cộng đồng StudentHub AI"
            : `Nhập mã xác nhận 6 số đã gửi tới ${email}`}
        </p>
      </div>

      {step === STEP_FORM ? (
        <>
          <StudentBenefitBanner email={email} />
          <form className="space-y-5 relative z-10" onSubmit={handleSignUp}>
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
                Đăng ký & Nhận mã OTP
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
            <div className="mt-6 space-y-3">
              <GitHubButton isLoading={isGoogleLoading} isDisabled={isLoading} onClick={handleGitHubSignUp} />
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
        </>
      ) : (
        /* BƯỚC 2: NHẬP MÃ OTP */
        <div className="space-y-6 relative z-10">
          <NoticeMessage message={notice} />

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-300 pl-1">
                Mã xác thực OTP (6 chữ số)
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3.5 px-4 bg-white/5 backdrop-blur-xl border border-white/15 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
              <p className="text-xs text-gray-400 pl-1 text-center">
                Kiểm tra hộp thư đến hoặc mục thư rác (Spam) của <span className="text-indigo-300">{email}</span>
              </p>
            </div>

            <ErrorMessage message={error} />

            <Button type="submit" isLoading={isVerifying} disabled={otp.length !== 6}>
              Xác thực & Hoàn tất
            </Button>
          </form>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep(STEP_FORM);
                setError(null);
                setNotice(null);
              }}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Đổi email khác
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} /> Gửi lại mã OTP
            </button>
          </div>
        </div>
      )}
    </AuthCard>
  );
};

export default RegisterPage;
