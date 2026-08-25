"use client";

// frontend/src/components/auth/SaffronAuthContainer.jsx
//
// Master Shell combining:
// - Saffron Finance Swiss Grid & Crosshairs (+)
// - Meer Mohsin Real-time Fluid Dynamics Canvas
// - uAvionix Aerospace Avionics Telemetry HUD

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, CheckCircle2, Zap } from "lucide-react";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import UAvionixTelemetryHUD from "@/components/auth/UAvionixTelemetryHUD";
import { saffronAudio } from "@/lib/audio/saffronAudio";

export default function SaffronAuthContainer({ children }) {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#0d0403] text-[#ece7e0] flex flex-col justify-between selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. Meer Mohsin 3D Interactive WebGL Fluid Canvas */}
      <MohsinFluidCanvas opacity={0.75} particleDensity={55} />

      {/* 2. Analog Scanline & Ambient Phosphor Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[2] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 2px)`,
          backgroundSize: "100% 2px",
        }}
      />

      {/* 3. Swiss Architectural Grid Lines with Crosshair Markers (+) */}
      <div className="fixed inset-0 pointer-events-none z-[3] overflow-hidden">
        {/* Corner Crosshairs */}
        <span className="absolute top-4 left-4 text-[#ffbc09]/60 font-mono text-sm select-none">+</span>
        <span className="absolute top-4 right-4 text-[#ffbc09]/60 font-mono text-sm select-none">+</span>
        <span className="absolute bottom-4 left-4 text-[#ffbc09]/60 font-mono text-sm select-none">+</span>
        <span className="absolute bottom-4 right-4 text-[#ffbc09]/60 font-mono text-sm select-none">+</span>

        {/* Outer Hairline Framing Border */}
        <div className="absolute inset-4 sm:inset-6 border border-[#47140b]/40 pointer-events-none" />

        {/* Ambient Warm Golden Ember Blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#ffbc09]/[0.06] blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#ca56ed]/[0.05] blur-[140px] pointer-events-none" />
      </div>

      {/* 4. Top Header & uAvionix Telemetry Stream */}
      <header className="relative z-30 w-full">
        {/* Navigation Bar */}
        <div className="px-4 sm:px-8 pt-5 pb-3 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => saffronAudio.playClick(600)}
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#150604]/80 hover:bg-[#210a07] border border-[#47140b] hover:border-[#ffbc09]/50 text-xs font-mono text-[#ece7e0] transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#ffbc09] group-hover:-translate-x-1 transition-transform" />
            <span className="tracking-wider">[ ← VỀ TRANG CHỦ ]</span>
          </Link>

          {/* Saffron Brand Marker */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2f0e09] border border-[#ffbc09]/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,188,9,0.2)]">
              <ShieldCheck className="w-4 h-4 text-[#ffbc09]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1 leading-tight font-sans">
                StudentHub <span className="text-[#ffbc09] text-[10px] font-mono px-1 rounded bg-[#ffbc09]/15 border border-[#ffbc09]/30">AI</span>
              </span>
              <span className="text-[9px] font-mono text-[#ece7e0]/60 uppercase tracking-widest hidden sm:inline">
                TSO-C199 SECURED HUB
              </span>
            </div>
          </div>
        </div>

        {/* uAvionix Telemetry HUD */}
        <UAvionixTelemetryHUD />
      </header>

      {/* 5. Main Central Auth Card Experience */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-[500px]">{children}</div>
      </main>

      {/* 6. Footer Security & Compliance Strip */}
      <footer className="relative z-30 w-full py-4 px-4 text-center font-mono text-[11px] text-[#ece7e0]/60 border-t border-[#47140b]/60 bg-[#150604]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#ffbc09]" />
            <span>Mã hóa AES-256 Quân Sự</span>
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xác thực Edu SSO &amp; OAuth 2.0</span>
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Phát hiện rủi ro 4 lớp</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
