"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Bot, FileText, Sliders, LayoutDashboard, Sparkles } from "lucide-react";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col items-center justify-center relative px-4 overflow-hidden selection:bg-indigo-500 selection:text-white">
      <AmbientBackground />
      <NoiseOverlay />

      <div className="relative z-10 max-w-xl w-full text-center p-8 rounded-3xl bg-space-900/80 backdrop-blur-2xl border border-white/10 shadow-glass-deep">
        {/* Glowing 404 Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>HTTP 404 // KHÔNG TÌM THẤY TRANG</span>
        </div>

        {/* 404 Giant Number */}
        <h1 className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 tracking-tighter mb-4">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
          Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển
        </h2>

        <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-md mx-auto">
          Đường dẫn có thể đã thay đổi. Hãy chọn một trong các không gian học thuật bên dưới để tiếp tục trải nghiệm StudentHub AI:
        </p>

        {/* Quick Jump Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-8 text-left">
          <Link
            href="/"
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 transition-all flex flex-col gap-1 text-xs"
          >
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <Home className="w-3.5 h-3.5 text-indigo-400" />
              <span>Trang Chủ</span>
            </div>
            <span className="text-[11px] text-gray-400">Giới thiệu & Tổng quan</span>
          </Link>

          <Link
            href="/ai"
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/10 transition-all flex flex-col gap-1 text-xs"
          >
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Mentor</span>
            </div>
            <span className="text-[11px] text-gray-400">Hỏi đáp đa ngành 24/7</span>
          </Link>

          <Link
            href="/academic"
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-white/10 transition-all flex flex-col gap-1 text-xs"
          >
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Workspace</span>
            </div>
            <span className="text-[11px] text-gray-400">Ghi chú & Soạn thảo</span>
          </Link>

          <Link
            href="/academic/planner"
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 hover:bg-white/10 transition-all flex flex-col gap-1 text-xs"
          >
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Whiteboard</span>
            </div>
            <span className="text-[11px] text-gray-400">Bảng vẽ kỹ thuật số</span>
          </Link>

          <Link
            href="/dashboard"
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 transition-all flex flex-col gap-1 text-xs"
          >
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dashboard</span>
            </div>
            <span className="text-[11px] text-gray-400">Bảng điều khiển cá nhân</span>
          </Link>

          <Link
            href="/login"
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 transition-all flex flex-col gap-1 text-xs"
          >
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
              <span>Đăng Nhập</span>
            </div>
            <span className="text-[11px] text-gray-400">Truy cập tài khoản</span>
          </Link>
        </div>

        {/* Primary Action Button */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white shadow-neon-primary hover:brightness-110 active:scale-95 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Quay Về Trang Chủ</span>
        </Link>
      </div>
    </div>
  );
}
