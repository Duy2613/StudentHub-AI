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
  GithubButton,
  ErrorMessage,
  NoticeMessage,
  StudentBenefitBanner,
  ACADEMIC_EMAIL_REGEX,
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
import OtpVerificationOrbit from "@/components/ui/otp-verification-orbit";

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
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isSuccessVerified, setIsSuccessVerified] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
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

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

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
      setResendCountdown(60);
      setNotice(`Đã gửi mã xác nhận 6 chữ số tới ${email}. Vui lòng kiểm tra hộp thư.`);
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 2: Xác thực mã OTP 6 số (hỗ trợ cả auto-submit từ OtpVerificationOrbit)
  const handleVerifyOtp = async (codeToVerify) => {
    const targetOtp = typeof codeToVerify === "string" ? codeToVerify : otp;
    if (!targetOtp || targetOtp.length !== 6) return;

    setError(null);
    setIsVerifying(true);
    try {
      await verifySignupOtp(email, targetOtp);
      setIsSuccessVerified(true);
      // Hiển thị trạng thái Verified trong 1s trước khi sang Onboarding
      setTimeout(() => {
        router.push("/onboarding");
      }, 1000);
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (isResending || resendCountdown > 0) return;
    setError(null);
    setIsResending(true);
    try {
      await resendSignupOtp(email);
      setResendCountdown(60);
      setNotice("Đã gửi lại mã xác nhận 6 số mới tới email của bạn.");
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsResending(false);
    }
  };

  // Đăng ký nhanh qua Google OAuth
  const handleGoogleSignUp = async () => {
    if (isOAuthLoading || isLoading) return;
    setError(null);
    setIsOAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(translateAuthError(err));
      setIsOAuthLoading(false);
    }
  };

  // Đăng ký nhanh qua GitHub OAuth
  const handleGitHubSignUp = async () => {
    if (isOAuthLoading || isLoading) return;
    setError(null);
    setIsOAuthLoading(true);
    try {
      await signInWithGitHub();
    } catch (err) {
      setError(translateAuthError(err));
      setIsOAuthLoading(false);
    }
  };


  const isStudentEmail = ACADEMIC_EMAIL_REGEX.test(email);

  return (
    <AuthCard mode={isStudentEmail ? "emerald-wave" : "cosmic-wave"}>
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
              name="name"
              label="Họ và tên"
              type="text"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading || isOAuthLoading}
            />
            <InputField
              id="email"
              name="email"
              label="Email (Khuyên dùng email trường .edu)"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || isOAuthLoading}
            />
            <PasswordInput

              id="password"
              name="password"
              label="Mật khẩu"
              autoComplete="new-password"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading || isOAuthLoading}
            />

            <ErrorMessage message={error} />
            <div className="pt-2">
              <Button type="submit" isLoading={isLoading} disabled={isOAuthLoading}>
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
                <span className="px-4 bg-transparent backdrop-blur-xl text-gray-500 font-medium">Hoặc đăng ký nhanh</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <GoogleButton isLoading={isOAuthLoading} isDisabled={isLoading} onClick={handleGoogleSignUp} />
              <GithubButton isLoading={isOAuthLoading} isDisabled={isLoading} onClick={handleGitHubSignUp} />
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
        /* BƯỚC 2: NHẬP MÃ OTP VỚI HIỆU ỨNG SETTIGATION ORBIT V3 */
        <div className="space-y-4 relative z-10">
          <NoticeMessage message={notice} />

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

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => handleVerifyOtp(otp)}
              isLoading={isVerifying}
              disabled={otp.length !== 6 || isSuccessVerified}
            >
              {isSuccessVerified ? "Đã xác thực thành công!" : "Xác thực & Vào ứng dụng"}
            </Button>
          </div>

          <div className="flex items-center justify-center pt-3 border-t border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep(STEP_FORM);
                setOtp("");
                setError(null);
                setNotice(null);
                setIsSuccessVerified(false);
              }}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Thay đổi thông tin / Email khác
            </button>
          </div>
        </div>
      )}
    </AuthCard>
  );
};

export default RegisterPage;
