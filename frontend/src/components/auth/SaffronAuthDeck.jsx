"use client";

// frontend/src/components/auth/SaffronAuthDeck.jsx
//
// Master Editorial Saffron Auth Deck (Login + Register + Settigation Orbit OTP)
// - Typography: Nghệ thuật kết hợp Editorial Serif Nghiêng + Human Sans tinh tế + In hoa kỹ thuật
// - Loại bỏ hoàn toàn sự khô cứng kiểu AI tự tạo font robot
// - Tích hợp Radar phát hiện email trường học (.edu), Thước đo Entropy mật khẩu, Settigation Orbit OTP v3

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Sparkles, ShieldCheck, GraduationCap, Star, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import {
  signInWithPassword,
  signUpWithEmail,
  getOwnProfile,
  verifySignupOtp,
  resendSignupOtp,
  signInWithGoogle,
  signInWithGitHub,
  translateAuthError,
  setRememberMePreference,
} from "@/lib/auth/authService";
import { useAuth } from "@/lib/auth/AuthContext";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import MohsinCurtainTransition from "@/components/ui/MohsinCurtainTransition";
import SaffronAcademicRadar from "@/components/auth/SaffronAcademicRadar";
import SaffronPasswordEntropy from "@/components/auth/SaffronPasswordEntropy";
import OtpVerificationOrbit from "@/components/ui/otp-verification-orbit";

export default function SaffronAuthDeck({ initialMode = "register" }) {
  const router = useRouter();
  const { loginAsDemo } = useAuth();

  // Mode: "login" | "register"
  const [mode, setMode] = useState(initialMode);
  // Register Steps: "FORM" | "OTP"
  const [regStep, setRegStep] = useState("FORM");

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [otp, setOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccessVerified, setIsSuccessVerified] = useState(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Curtain Transition Trigger
  const [isCurtainActive, setIsCurtainActive] = useState(false);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (regStep === "OTP" && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [regStep, resendCountdown]);

  // Check URL parameters for OAuth errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError === "google_login_failed" || urlError === "oauth_failed") {
        setError("Đăng nhập bằng tài khoản liên kết không thành công hoặc đã bị hủy. Vui lòng thử lại.");
      } else if (urlError === "email_registered_use_password") {
        setError(
          "Tài khoản này đã được đăng ký bằng Email & Mật khẩu từ trước. Vui lòng nhập Mật khẩu để đăng nhập."
        );
      }
    }
  }, []);

  // Switch between Login & Register with 5-Bar Shutter Curtain
  const handleSwitchMode = (targetMode) => {
    if (targetMode === mode) return;
    saffronAudio.playTabSwitch();
    setIsCurtainActive(true);
    setTimeout(() => {
      setMode(targetMode);
      setRegStep("FORM");
      setError(null);
      setNotice(null);
      setIsCurtainActive(false);
    }, 450);
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    saffronAudio.playClick(800);
    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      await signInWithPassword(email, password, rememberMe);
      saffronAudio.playSuccessChime();
      const ownProfile = await getOwnProfile();
      const isOnboarded = ownProfile.success && ownProfile.profile?.onboardingCompleted === true;
      if (!isOnboarded) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      saffronAudio.playAlertBuzz();
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Register Step 1
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    saffronAudio.playClick(900);
    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      await signUpWithEmail(email, password, fullName);
      saffronAudio.playSuccessChime();
      setRegStep("OTP");
      setResendCountdown(60);
      setNotice(`Đã gửi mã xác nhận 6 chữ số tới ${email}. Vui lòng kiểm tra hộp thư.`);
    } catch (err) {
      saffronAudio.playAlertBuzz();
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Verify OTP
  const handleVerifyOtp = async (codeToVerify) => {
    const targetOtp = typeof codeToVerify === "string" ? codeToVerify : otp;
    if (!targetOtp || targetOtp.length !== 6) return;

    saffronAudio.playClick(1100);
    setError(null);
    setIsVerifying(true);

    try {
      await verifySignupOtp(email, targetOtp);
      saffronAudio.playSuccessChime();
      setIsSuccessVerified(true);
      setTimeout(() => {
        router.push("/onboarding");
      }, 1000);
    } catch (err) {
      saffronAudio.playAlertBuzz();
      setError(translateAuthError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  // 4. Handle Resend OTP
  const handleResendOtp = async () => {
    if (isResending || resendCountdown > 0) return;
    saffronAudio.playClick(750);
    setError(null);
    setIsResending(true);

    try {
      await resendSignupOtp(email);
      setResendCountdown(60);
      setNotice("Đã gửi lại mã xác nhận 6 số mới tới email của bạn.");
    } catch (err) {
      saffronAudio.playAlertBuzz();
      setError(translateAuthError(err));
    } finally {
      setIsResending(false);
    }
  };

  // 5. OAuth Logins
  const handleGoogleOAuth = useCallback(async () => {
    if (isLoading || isOAuthLoading) return;
    saffronAudio.playHardwareKey();
    setError(null);
    setIsOAuthLoading(true);
    setRememberMePreference(rememberMe);
    try {
      await signInWithGoogle();
    } catch (err) {
      saffronAudio.playAlertBuzz();
      setError(translateAuthError(err));
      setIsOAuthLoading(false);
    }
  }, [isLoading, isOAuthLoading, rememberMe]);

  const handleGitHubOAuth = useCallback(async () => {
    if (isLoading || isOAuthLoading) return;
    saffronAudio.playHardwareKey();
    setError(null);
    setIsOAuthLoading(true);
    setRememberMePreference(rememberMe);
    try {
      await signInWithGitHub();
    } catch (err) {
      saffronAudio.playAlertBuzz();
      setError(translateAuthError(err));
      setIsOAuthLoading(false);
    }
  }, [isLoading, isOAuthLoading, rememberMe]);

  const isAnyLoading = isLoading || isOAuthLoading || isVerifying;

  return (
    <MohsinCurtainTransition
      isActive={isCurtainActive}
      label={`CHUYỂN MÀN // ${mode === "login" ? "ĐĂNG NHẬP" : "ĐĂNG KÝ THÀNH VIÊN"}`}
    >
      {/* Saffron Master Frame: Swiss Architectural Card with Golden Bevel */}
      <div className="relative rounded-3xl bg-[#150604]/90 border border-[#47140b] shadow-[0_25px_70px_rgba(0,0,0,0.9)] backdrop-blur-3xl p-6 sm:p-9 overflow-hidden font-human">
        
        {/* Corner Crosshair Ticks (+) on Deck Card */}
        <span className="absolute top-3 left-3 text-[#ffbc09]/50 font-mono text-xs select-none">+</span>
        <span className="absolute top-3 right-3 text-[#ffbc09]/50 font-mono text-xs select-none">+</span>
        <span className="absolute bottom-3 left-3 text-[#ffbc09]/50 font-mono text-xs select-none">+</span>
        <span className="absolute bottom-3 right-3 text-[#ffbc09]/50 font-mono text-xs select-none">+</span>

        {/* Top Gold Accent Laser Line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#ffbc09] to-transparent" />

        {/* 1. Header Editorial Typography (Nghệ thuật chữ nghiêng + Chữ in hoa/thường) */}
        <div className="mb-6 text-left">
          {mode === "register" ? (
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09] text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BƯỚC 01 • KHỞI TẠO TÀI KHOẢN SINH VIÊN</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug font-human">
                <span className="text-[#ffd15c]">Tạo tài khoản</span> <span>bảo vệ số</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#ece7e0]/80 font-normal leading-relaxed">
                Tham gia mạng lưới sinh viên <span className="text-[#ffbc09] font-semibold">chống lừa đảo</span> và kết nối cùng đội ngũ cố vấn thực chứng.
              </p>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CỔNG XÁC THỰC AN TOÀN // DIGITAL GUARDIAN</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug font-human">
                <span className="text-[#ffd15c]">Chào mừng</span> <span>quay trở lại</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#ece7e0]/80 font-normal leading-relaxed">
                Đăng nhập để tiếp tục tra cứu <span className="text-[#ffbc09] font-semibold">nguy cơ lừa đảo</span> và quản lý điểm uy tín.
              </p>
            </div>
          )}
        </div>

        {/* 2. Saffron Segmented Tab Switcher */}
        <div className="relative mb-6 p-1 rounded-2xl bg-[#210a07] border border-[#47140b] grid grid-cols-2 gap-1.5 select-none">
          <button
            type="button"
            onClick={() => handleSwitchMode("login")}
            className={`relative py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              mode === "login"
                ? "bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] shadow-[0_0_20px_rgba(255,188,9,0.35)]"
                : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="font-mono text-[10px] opacity-75">01</span>
            <span>Đăng Nhập</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode("register")}
            className={`relative py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              mode === "register"
                ? "bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] shadow-[0_0_20px_rgba(255,188,9,0.35)]"
                : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="font-mono text-[10px] opacity-75">02</span>
            <span>Đăng Ký Mới</span>
          </button>
        </div>

        {/* 3. Fast OAuth Login Keys (Google & GitHub) */}
        {regStep === "FORM" && (
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {/* Google Hardware Key */}
              <button
                type="button"
                onClick={handleGoogleOAuth}
                disabled={isAnyLoading}
                className="group relative py-3 px-3.5 rounded-xl bg-[#210a07]/90 hover:bg-[#2f0e09] border border-[#47140b] hover:border-[#ffbc09]/60 text-xs font-semibold text-[#ece7e0] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50 font-human"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span className="truncate">Google Account</span>
              </button>

              {/* GitHub Hardware Key */}
              <button
                type="button"
                onClick={handleGitHubOAuth}
                disabled={isAnyLoading}
                className="group relative py-3 px-3.5 rounded-xl bg-[#210a07]/90 hover:bg-[#2f0e09] border border-[#47140b] hover:border-[#ffbc09]/60 text-xs font-semibold text-[#ece7e0] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50 font-human"
              >
                <svg className="w-4 h-4 fill-current text-[#ece7e0] shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span className="truncate">GitHub Account</span>
              </button>
            </div>

            {/* Hairline Divider with Human Text */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-[#47140b]" />
              <span className="absolute px-3 bg-[#150604] text-[11px] text-[#ece7e0]/60 font-human">
                Hoặc nhập thông tin trực tiếp
              </span>
            </div>
          </div>
        )}

        {/* 4. Error & Notice Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-300 font-human">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}
        {notice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-300 font-human">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{notice}</span>
          </div>
        )}

        {/* 5. Form Content Area */}
        {mode === "login" ? (
          /* =========================================================================
             LOGIN FORM
             ========================================================================= */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Field: Email */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[#ece7e0] font-human">
                Địa chỉ Email <span className="text-[10px] font-mono text-[#ffbc09] font-normal ml-1">[ CHÍNH ]</span>
              </label>
              <input
                type="email"
                required
                disabled={isAnyLoading}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="you@school.edu.vn"
                className="w-full py-3 px-3.5 bg-[#210a07]/80 border border-[#47140b] rounded-xl text-sm font-human text-[#ece7e0] placeholder-[#ece7e0]/30 focus:outline-none focus:border-[#ffbc09] focus:bg-[#2f0e09] focus:ring-1 focus:ring-[#ffbc09]/50 transition-all"
              />
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[#ece7e0] font-human">
                Mật khẩu bảo vệ <span className="text-[10px] font-mono text-[#ca56ed] font-normal ml-1">[ BẢO MẬT ]</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isAnyLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full py-3 px-3.5 pr-10 bg-[#210a07]/80 border border-[#47140b] rounded-xl text-sm font-human text-[#ece7e0] placeholder-[#ece7e0]/30 focus:outline-none focus:border-[#ffbc09] focus:bg-[#2f0e09] focus:ring-1 focus:ring-[#ffbc09]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ece7e0]/50 hover:text-[#ffbc09] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs py-1 select-none font-human">
              <label className="flex items-center gap-2 cursor-pointer text-[#ece7e0]/85 hover:text-[#ffbc09] transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#47140b] bg-[#210a07] text-[#ffbc09] accent-[#ffbc09] cursor-pointer"
                />
                <span className="text-xs">Ghi nhớ đăng nhập trên thiết bị này</span>
              </label>
              <span className="text-[11px] text-[#ece7e0]/50">
                {rememberMe ? "Lưu lâu dài" : "Xóa khi tắt tab"}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ffbc09] via-[#f59e0b] to-[#ffd15c] text-[#150604] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,188,9,0.35)] hover:shadow-[0_0_35px_rgba(255,188,9,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 font-human"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#150604]" />
              ) : (
                <>
                  <span>Đăng Nhập Vào Hệ Thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : regStep === "FORM" ? (
          /* =========================================================================
             REGISTER STEP 1 (FORM)
             ========================================================================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Academic Transponder Radar */}
            <SaffronAcademicRadar email={email} />

            {/* Field: Full Name */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[#ece7e0] font-human">
                Họ và tên của bạn <span className="text-[10px] font-mono text-[#ffbc09] font-normal ml-1">[ ĐẦY ĐỦ ]</span>
              </label>
              <input
                type="text"
                required
                disabled={isAnyLoading}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError(null);
                }}
                placeholder="Nguyễn Văn A"
                className="w-full py-3 px-3.5 bg-[#210a07]/80 border border-[#47140b] rounded-xl text-sm font-human text-[#ece7e0] placeholder-[#ece7e0]/30 focus:outline-none focus:border-[#ffbc09] focus:bg-[#2f0e09] focus:ring-1 focus:ring-[#ffbc09]/50 transition-all"
              />
            </div>

            {/* Field: Email */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[#ece7e0] font-human">
                Email trường hoặc cá nhân <span className="text-[10px] font-mono text-[#38bdf8] font-normal ml-1">[ KHUYÊN DÙNG .EDU ]</span>
              </label>
              <input
                type="email"
                required
                disabled={isAnyLoading}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="you@school.edu.vn"
                className="w-full py-3 px-3.5 bg-[#210a07]/80 border border-[#47140b] rounded-xl text-sm font-human text-[#ece7e0] placeholder-[#ece7e0]/30 focus:outline-none focus:border-[#ffbc09] focus:bg-[#2f0e09] focus:ring-1 focus:ring-[#ffbc09]/50 transition-all"
              />
            </div>

            {/* Field: Password & Entropy */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[#ece7e0] font-human">
                Mật khẩu bảo vệ <span className="text-[10px] font-mono text-[#ca56ed] font-normal ml-1">[ TỐI THIỂU 6 KÝ TỰ ]</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  disabled={isAnyLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full py-3 px-3.5 pr-10 bg-[#210a07]/80 border border-[#47140b] rounded-xl text-sm font-human text-[#ece7e0] placeholder-[#ece7e0]/30 focus:outline-none focus:border-[#ffbc09] focus:bg-[#2f0e09] focus:ring-1 focus:ring-[#ffbc09]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ece7e0]/50 hover:text-[#ffbc09] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <SaffronPasswordEntropy password={password} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ffbc09] via-[#f59e0b] to-[#ffd15c] text-[#150604] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,188,9,0.35)] hover:shadow-[0_0_35px_rgba(255,188,9,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 font-human"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#150604]" />
              ) : (
                <>
                  <span>Tiếp Tục &amp; Nhận Mã OTP Xác Thực</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* =========================================================================
             REGISTER STEP 2 (SETTIGATION ORBIT OTP)
             ========================================================================= */
          <div className="space-y-4">
            <div className="text-center pb-2">
              <span className="text-[10px] font-mono font-bold text-[#ffbc09] tracking-widest uppercase">
                [ BƯỚC 02 // XÁC THỰC MÃ OTP 6 CHỮ SỐ ]
              </span>
              <h2 className="text-xl font-extrabold text-white font-human mt-1">
                <span className="text-[#ffd15c]">Kiểm tra</span> <span>hộp thư của bạn</span>
              </h2>
              <p className="text-xs text-[#ece7e0]/80 font-human mt-1 leading-relaxed">
                Mã xác thực đã được gửi tới <strong className="text-[#38bdf8] font-semibold">{email}</strong>
              </p>
            </div>

            <OtpVerificationOrbit
              length={6}
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setError(null);
              }}
              onComplete={(fullCode) => {
                handleVerifyOtp(fullCode);
              }}
              isVerifying={isVerifying}
              isSuccess={isSuccessVerified}
              isError={Boolean(error)}
              errorMessage={error}
              email={email}
              resendCountdown={resendCountdown}
              onResend={handleResendOtp}
              isResending={isResending}
            />

            <button
              type="button"
              onClick={() => handleVerifyOtp(otp)}
              disabled={otp.length !== 6 || isSuccessVerified || isVerifying}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs uppercase tracking-wider shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-human"
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#150604]" />
              ) : isSuccessVerified ? (
                "Đã Xác Thực Thành Công!"
              ) : (
                "Xác Thực & Vào Ứng Dụng"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setRegStep("FORM");
                setOtp("");
                setError(null);
                setNotice(null);
              }}
              className="w-full py-2 text-center text-xs text-[#ece7e0]/70 hover:text-[#ffbc09] transition-colors flex items-center justify-center gap-1.5 font-human"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại sửa thông tin email
            </button>
          </div>
        )}

        {/* 6. Demo Access Passes */}
        {regStep === "FORM" && (
          <div className="mt-6 pt-5 border-t border-[#47140b] space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#ece7e0]/70 font-human font-medium">
              <span>⚡ Trải nghiệm nhanh (Demo Mode):</span>
              <span className="text-[10px] font-mono text-[#ffbc09] uppercase tracking-wider">[ MIỄN PHÍ ]</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-human">
              {/* Demo Sinh viên Pass */}
              <button
                type="button"
                onClick={() => {
                  saffronAudio.playHardwareKey();
                  loginAsDemo("student", rememberMe);
                  router.push("/dashboard");
                }}
                className="group p-2.5 rounded-xl bg-[#210a07] hover:bg-[#2f0e09] border border-[#ffbc09]/30 hover:border-[#ffbc09] text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#ffbc09]">
                  <GraduationCap className="w-4 h-4" />
                  <span>Demo Sinh Viên</span>
                </div>
                <div className="text-[10px] text-[#ece7e0]/60 mt-0.5">
                  Điểm uy tín: 80 pts • Đầy đủ tính năng
                </div>
              </button>

              {/* Demo Chuyên gia Pass */}
              <button
                type="button"
                onClick={() => {
                  saffronAudio.playHardwareKey();
                  loginAsDemo("expert", rememberMe);
                  router.push("/dashboard");
                }}
                className="group p-2.5 rounded-xl bg-[#210a07] hover:bg-[#2f0e09] border border-amber-500/30 hover:border-amber-400 text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>Demo Cố Vấn</span>
                </div>
                <div className="text-[10px] text-[#ece7e0]/60 mt-0.5">
                  Điểm uy tín: 100 pts • Quyền xác thực
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </MohsinCurtainTransition>
  );
}
