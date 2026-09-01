"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Keep diagnostics out of the rendered surface. Providers may include
    // internal details or identifiers that are not safe to expose to users.
    if (process.env.NODE_ENV !== "production") console.error("[StudentHub Error Boundary]", error?.name || "unknown_error");
  }, [error]);

  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col items-center justify-center relative px-4 overflow-hidden selection:bg-indigo-500 selection:text-white">
      <AmbientBackground />
      <NoiseOverlay />

      <div className="relative z-10 max-w-lg w-full text-center p-8 rounded-3xl bg-space-900/80 backdrop-blur-2xl border border-white/10 shadow-glass-deep">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-6">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Đã xảy ra lỗi tải trang
        </h1>

        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          Hệ thống gặp sự cố tạm thời khi đồng bộ dữ liệu. Bạn có thể nhấn nút thử lại hoặc quay về Trang Chủ.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white shadow-neon-primary hover:brightness-110 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Đăng Nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
