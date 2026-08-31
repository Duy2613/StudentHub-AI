"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Lock, CheckCircle2 } from "lucide-react";
import LiveStudioClock from "@/components/ui/live-studio-clock";

/**
 * Concentric Sparkling Astrolabe Orbital Rings behind the Central Card
 */
function CosmicAstrolabeRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden">
      {/* Outer Rotating Dashed Ring with Twinkling Star Nodes */}
      <svg
        className="w-[780px] h-[780px] sm:w-[960px] sm:h-[960px] opacity-25 animate-[spin_80s_linear_infinite]"
        viewBox="0 0 800 800"
        fill="none"
      >
        <circle
          cx="400"
          cy="400"
          r="370"
          stroke="#6366f1"
          strokeWidth="1.2"
          strokeDasharray="6 16"
        />
        <circle cx="400" cy="30" r="4" fill="#34e7c4" className="animate-pulse" />
        <circle cx="770" cy="400" r="3.5" fill="#818cf8" />
        <circle cx="30" cy="400" r="3.5" fill="#38bdf8" />
        <circle cx="660" cy="660" r="3" fill="#a78bfa" />
        <circle cx="140" cy="140" r="3" fill="#34d399" />
      </svg>

      {/* Middle Counter-Rotating Ring with Shimmering Cyan Accents */}
      <svg
        className="absolute w-[620px] h-[620px] sm:w-[780px] sm:h-[780px] opacity-30 animate-[spin_50s_linear_infinite_reverse]"
        viewBox="0 0 600 600"
        fill="none"
      >
        <circle
          cx="300"
          cy="300"
          r="280"
          stroke="#38bdf8"
          strokeWidth="1"
          strokeDasharray="4 12"
        />
        <circle cx="300" cy="20" r="3.5" fill="#38bdf8" />
        <circle cx="580" cy="300" r="3.5" fill="#818cf8" />
        <circle cx="90" cy="510" r="3" fill="#60a5fa" />
        <circle cx="510" cy="90" r="3" fill="#34d399" />
      </svg>

      {/* Inner Glowing Orbit Circle with Subtle Pulsing Core */}
      <div className="absolute w-[500px] h-[500px] sm:w-[620px] sm:h-[620px] rounded-full border border-teal-500/20 opacity-40 shadow-[0_0_60px_rgba(45,212,191,0.12)]" />

      {/* Soft Ambient Backlight Flare behind the central card (Comfortable Deep Polar Tones) */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-900/25 via-slate-900/30 to-teal-900/20 blur-[130px] pointer-events-none" />
    </div>
  );
}

/**
 * AuthSurroundings: Clean, cinematic atmosphere with radiant orbital rings,
 * top navigation bar, and bottom security guarantee. All cluttering side text boxes removed.
 */
export default function AuthSurroundings({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* 1. Top Bar: Back to Home + Live Clock + Verified Badge */}
      <header className="relative z-30 w-full px-4 sm:px-8 pt-6 pb-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-space-900/80 hover:bg-space-850 border border-white/15 text-xs font-semibold text-gray-200 hover:text-white backdrop-blur-xl shadow-glass-deep transition-all hover:scale-105 active:scale-95 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-teal-400" />
          <span>Về Trang Chủ</span>
        </Link>

        <div className="flex items-center gap-3">
          <LiveStudioClock />
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-[11px] font-mono text-teal-200 backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>StudentHub AI • Verified Hub</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area with Astrolabe Rings & Central Focused Card */}
      <div className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
        {/* Astrolabe Orbital Rings */}
        <CosmicAstrolabeRings />

        {/* Central Auth Form Card (Clean & Focused) */}
        <div className="relative z-10 w-full flex justify-center">
          {children}
        </div>
      </div>

      {/* 3. Bottom Security Guarantee Bar */}
      <footer className="relative z-30 w-full px-4 py-5 text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-6 py-2.5 rounded-full bg-space-950/85 border border-white/10 backdrop-blur-md text-[11px] text-gray-300 shadow-glass-deep">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span>Mã hóa End-to-End 256-bit</span>
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xác thực Edu SSO &amp; OAuth 2.0</span>
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Bảo vệ quyền riêng tư 100%</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
