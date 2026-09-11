"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import {
  AuthCard,
  PasswordInput,
  Button,
  ErrorMessage,
} from "@/components/auth/AuthUI";
import { updateUserPassword, translateAuthError } from "@/lib/auth/authService";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Supabase tự động parse #access_token=...&type=recovery từ email link
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session) {
            setHasValidSession(true);
          }
          setCheckingSession(false);
        }
      } catch {
        if (mounted) setCheckingSession(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        if (mounted) {
          setHasValidSession(true);
          setCheckingSession(false);
        }
      }
    });

    checkInitialSession();

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Password criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isStrong = hasMinLength && (hasUpper || hasLower) && hasNumber;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      await updateUserPassword(password);
      router.push("/login?reset=success");
    } catch (err) {
      setError(translateAuthError(err));
      setIsLoading(false);
    }
  };

  return (
    <AuthCard mode="cosmic-wave">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-5 group/icon">
          <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/20 to-indigo-600/20 rounded-full blur-lg opacity-40 group-hover/icon:opacity-70 transition-opacity" />
          <div className="h-14 w-14 bg-gradient-to-tr from-emerald-500/30 to-indigo-600/30 border border-emerald-400/30 rounded-2xl flex items-center justify-center relative z-10 shadow-md">
            <ShieldCheck className="h-7 w-7 text-emerald-300" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold font-human text-white tracking-tight">
          Thiết lập mật khẩu mới
        </h2>
        <p className="mt-2 text-sm text-gray-400 font-medium font-human max-w-sm">
          Nhập mật khẩu mới an toàn cho tài khoản StudentHub AI của bạn.
        </p>
      </div>

      {checkingSession ? (
        <div className="py-8 text-center text-sm text-gray-400">
          Đang xác thực liên kết khôi phục...
        </div>
      ) : !hasValidSession ? (
        <div className="space-y-6 relative z-10">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Liên kết không hợp lệ hoặc đã hết hạn</p>
              <p className="mt-1 text-xs text-rose-300/90 leading-relaxed">
                Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng. Vui lòng gửi lại yêu cầu khôi phục mới.
              </p>
            </div>
          </div>

          <Link
            href="/forgot-password"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            Yêu cầu liên kết mới
          </Link>
        </div>
      ) : (
        <form className="space-y-4 relative z-10" onSubmit={handleSubmit} autoComplete="off">
          <PasswordInput
            id="password"
            name="password"
            label="Mật khẩu mới"
            autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          {/* Strength Indicators */}
          <div className="p-3 rounded-xl bg-space-900/60 border border-white/5 space-y-1.5 text-xs text-gray-400">
            <p className="font-semibold text-gray-300 mb-1">Yêu cầu bảo mật:</p>
            <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : "text-gray-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? "bg-emerald-400" : "bg-gray-500"}`} />
              Ít nhất 8 ký tự
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-400" : "text-gray-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? "bg-emerald-400" : "bg-gray-500"}`} />
              Bao gồm chữ số (0-9)
            </div>
            <div className={`flex items-center gap-1.5 ${passwordsMatch ? "text-emerald-400" : "text-gray-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? "bg-emerald-400" : "bg-gray-500"}`} />
              Mật khẩu xác nhận khớp nhau
            </div>
          </div>

          <ErrorMessage message={error} />

          <div className="pt-2">
            <Button type="submit" isLoading={isLoading} disabled={!hasMinLength || !passwordsMatch}>
              Đổi mật khẩu & Thu hồi các phiên cũ
            </Button>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Hủy và quay lại Đăng nhập
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
