"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import {
  AuthCard,
  InputField,
  Button,
  ErrorMessage,
} from "@/components/auth/AuthUI";
import { resetPasswordForEmail, translateAuthError } from "@/lib/auth/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldown > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      await resetPasswordForEmail(email);
      setIsSuccess(true);
      setCooldown(60);
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard mode="cosmic-wave">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-5 group/icon">
          <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500/20 to-indigo-600/20 rounded-full blur-lg opacity-40 group-hover/icon:opacity-70 transition-opacity" />
          <div className="h-14 w-14 bg-gradient-to-tr from-amber-500/30 to-indigo-600/30 border border-amber-400/30 rounded-2xl flex items-center justify-center relative z-10 shadow-md">
            <KeyRound className="h-7 w-7 text-amber-300" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold font-human text-white tracking-tight">
          Khôi phục mật khẩu
        </h2>
        <p className="mt-2 text-sm text-gray-400 font-medium font-human max-w-sm">
          Nhập địa chỉ email đăng ký để nhận liên kết đặt lại mật khẩu bảo mật qua hệ thống Supabase.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-6 relative z-10">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">Đã gửi liên kết thành công!</p>
              <p className="mt-1 text-xs text-emerald-300/90 leading-relaxed">
                Vui lòng kiểm tra hộp thư đến của <strong>{email}</strong> (kể cả thư mục Spam hoặc Junk). Bấm vào liên kết trong email để đặt lại mật khẩu mới.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={cooldown > 0 || isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all disabled:opacity-50"
            >
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại email xác thực"}
            </button>

            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại trang đăng nhập
            </Link>
          </div>
        </div>
      ) : (
        <form className="space-y-4 relative z-10" onSubmit={handleSubmit} autoComplete="off">
          <InputField
            id="email"
            name="email"
            label="Email tài khoản"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <ErrorMessage message={error} />

          <div className="pt-2">
            <Button type="submit" isLoading={isLoading}>
              Gửi liên kết khôi phục
            </Button>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
