"use client";

import React from "react";
import Link from "next/link";
import { Monitor, Tablet, Smartphone, Sparkles, Film } from "lucide-react";
import { useRealtime } from "@/components/providers/RealtimeContext";
import { useBackground } from "@/components/providers/BackgroundContext";

export default function DeviceSwitcherDock({ currentView, onViewChange, onOpenAdvisory }) {
  const { latency, connectionStatus } = useRealtime();
  const { activeFilm } = useBackground();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#060813]/90 backdrop-blur-2xl transition-all">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Mode Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
            </div>
            <span className="font-mono text-xs font-black tracking-wider text-white">STUDENTHUB AI</span>
          </div>
          <span className="hidden sm:inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-teal-300">
            CINEMATIC REALITY OS
          </span>

          {activeFilm && (
            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-mono font-medium text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>REALTIME BG: FILM {activeFilm.num}</span>
            </span>
          )}
        </div>

        {/* Viewport Switcher Controls (Chonweb style elevated to Awwwards) */}
        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-inner backdrop-blur-md">
          <button
            onClick={() => onViewChange("desktop")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono transition-all duration-200 ${
              currentView === "desktop"
                ? "bg-teal-400 text-black font-bold shadow-[0_0_15px_rgba(52,231,196,0.4)]"
                : "text-gray-400 hover:text-white"
            }`}
            title="Xem chuẩn Desktop toàn cảnh (100%)"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>

          <button
            onClick={() => onViewChange("tablet")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono transition-all duration-200 ${
              currentView === "tablet"
                ? "bg-teal-400 text-black font-bold shadow-[0_0_15px_rgba(52,231,196,0.4)]"
                : "text-gray-400 hover:text-white"
            }`}
            title="Mô phỏng khung hiển thị Tablet (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Tablet</span>
          </button>

          <button
            onClick={() => onViewChange("mobile")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono transition-all duration-200 ${
              currentView === "mobile"
                ? "bg-teal-400 text-black font-bold shadow-[0_0_15px_rgba(52,231,196,0.4)]"
                : "text-gray-400 hover:text-white"
            }`}
            title="Mô phỏng khung điện thoại Mobile (390px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Action Button & Live Resolution Tag */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] text-gray-400">
            <span className={`h-1.5 w-1.5 rounded-full ${connectionStatus === "CONNECTED" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}></span>
            <span>60 FPS</span>
            <span>·</span>
            <span>LATENCY {latency}ms</span>
          </div>

          <Link
            href="/cinema"
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-400"
            title="Mở Rạp Chiếu 8 Tác Phẩm Phim Điện Ảnh Học Thuật"
          >
            <Film className="h-3.5 w-3.5" />
            <span>8 Films Cinema</span>
          </Link>

          <button
            onClick={onOpenAdvisory}
            className="flex items-center gap-2 rounded-full border border-teal-400/50 bg-gradient-to-r from-teal-400 to-emerald-400 px-3.5 py-1.5 text-xs font-bold text-black shadow-[0_0_20px_rgba(52,231,196,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tư Vấn Lộ Trình</span>
          </button>
        </div>
      </div>
    </header>
  );
}
