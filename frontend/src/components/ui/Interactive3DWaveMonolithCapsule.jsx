"use client";

// frontend/src/components/ui/Interactive3DWaveMonolithCapsule.jsx
//
// 3D Wave Monolith Holographic Capsule (Awwwards-tier Reveal Trigger)
// - Minimalist magnetic Black Cocoa & Saffron Gold HUD Monolith
// - Displays a single cinematic telemetry title line with live radar pulse
// - Expands into full A-Z workspace upon click with Web Audio haptics

import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Radio, ShieldCheck, Zap, Maximize2 } from "lucide-react";
import { saffronAudio } from "@/lib/audio/saffronAudio";

export default function Interactive3DWaveMonolithCapsule({
  badge = "01 // SÓNG HẠT 3D • DIGITAL GUARDIAN",
  title = "StudentHub AI — Trạm Phòng Vệ Số & Học Thuật",
  subtitle = "Không gian sóng hạt 3D vô tận. Chạm vào viên nang để bung mở toàn bộ hệ thống từ A đến Z.",
  actionText = "CHẠM ĐỂ MỞ BẢNG ĐIỀU KHIỂN TOÀN DIỆN [A → Z]",
  onExpand,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    saffronAudio.playSuccessChime();
    if (onExpand) onExpand();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 select-none relative z-20 font-human">
      {/* Central Holographic Capsule Monolith */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
        onMouseEnter={() => {
          setIsHovered(true);
          saffronAudio.playClick(800);
        }}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        className="group relative w-full max-w-2xl p-7 sm:p-9 rounded-3xl bg-[#150604]/85 hover:bg-[#1f0906]/95 border border-[#47140b] hover:border-[#ffbc09]/80 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(255,188,9,0.15)] transition-all duration-500 cursor-pointer overflow-hidden text-center hover:scale-[1.02] active:scale-[0.98]"
      >
        {/* Corner Crosshair Markers (+) */}
        <span className="absolute top-3 left-3 text-[#ffbc09]/50 font-mono text-xs select-none">+</span>
        <span className="absolute top-3 right-3 text-[#ffbc09]/50 font-mono text-xs select-none">+</span>
        <span className="absolute bottom-3 left-3 text-[#ffbc09]/50 font-mono text-xs select-none">+</span>
        <span className="absolute bottom-3 right-3 text-[#ffbc09]/50 font-mono text-xs select-none">+</span>

        {/* Top Laser Accent Line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffbc09] to-transparent animate-pulse" />

        {/* Floating Halo Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#ffbc09]/10 via-[#38bdf8]/10 to-[#ca56ed]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* 1. Telemetry Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#210a07] border border-[#ffbc09]/40 text-[#ffbc09] text-[11px] font-mono font-bold uppercase tracking-wider mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
          <span>[ {badge} ]</span>
        </div>

        {/* 2. Headline Title */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
          {title}
        </h2>

        {/* 3. Subtitle Description */}
        <p className="mt-2.5 text-xs sm:text-sm text-[#ece7e0]/80 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        {/* 4. Interactive Glowing Expand Button */}
        <div className="mt-6 pt-5 border-t border-[#47140b] flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="py-3 px-6 rounded-2xl bg-gradient-to-r from-[#ffbc09] via-[#f59e0b] to-[#ffd15c] text-[#150604] font-mono font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(255,188,9,0.4)] group-hover:shadow-[0_0_35px_rgba(255,188,9,0.6)] transition-all flex items-center gap-2.5">
            <Maximize2 className="w-4 h-4 text-[#150604]" />
            <span>{actionText}</span>
            <ArrowRight className="w-4 h-4 text-[#150604] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Footer Micro-Key Hint */}
        <div className="mt-3 text-[10px] font-mono text-[#ece7e0]/40 uppercase tracking-widest">
          [ NHẤN VÀO HỘP HOẶC BẤM PHÍM SPACE ĐỂ BUNG MỞ ]
        </div>
      </motion.div>
    </div>
  );
}
