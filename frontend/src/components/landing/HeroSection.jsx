"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Search,
  Users,
  AlertTriangle,
  Lock,
  Layers,
  Palette
} from "lucide-react";
import Hero3DCanvas from "@/components/canvas/Hero3DCanvas";
import TactileButton from "@/components/ui/TactileButton";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import { useBackground } from "@/components/providers/BackgroundContext";
import { motion } from "motion/react";

export default function HeroSection() {
  const { activeWallpaper } = useBackground();

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden" id="hero">
      
      {/* Editorial Knowledge Orbit Background Motif */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] sm:w-[950px] sm:h-[950px] pointer-events-none opacity-30 z-0">
        <div className="w-full h-full orbital-knowledge-ring relative">
          <div className="orbital-node-dot top-0 left-1/2 -translate-x-1/2" />
          <div className="orbital-node-dot bottom-0 left-1/2 -translate-x-1/2" />
          <div className="orbital-node-dot top-1/2 left-0 -translate-y-1/2" />
          <div className="orbital-node-dot top-1/2 right-0 -translate-y-1/2" />
        </div>
      </div>

      <div className="layout-safe-container relative z-10">
        
        {/* Top Editorial Metadata Bar — Machine Interface typography & Igloo Sound Pill */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 text-[11px] tracking-widest text-gray-400 uppercase border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 font-machine">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-gray-200 font-bold">STUDENT HUB AI</span>
            <span className="text-gray-600">/</span>
            <span>DIGITAL CAMPUS 2026</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[10px] text-gray-400 font-machine">
            <span>01 / XÁC THỰC AI</span>
            <span>02 / CỐ VẤN THỰC CHỨNG</span>
            <span>03 / DIỄN ĐÀN SINH VIÊN</span>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
            {/* Machine Interface badge */}
            <span className="dg-badge-machine">
              <Sparkles className="w-3 h-3 text-teal-400" />
              BẢNG C • AI 2026
            </span>
          </div>
        </div>

        {/* 2-Column Balanced Asymmetric Layout (Hero Text Left + 3D Hologram Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & Action CTAs (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Human Interface badge — platform label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold font-human tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              <span>NỀN TẢNG XÁC THỰC &amp; PHÒNG VỆ SỐ CHO SINH VIÊN</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl tracking-tight leading-[1.06] font-normal text-white">
              <span className="font-serif-editorial italic font-normal text-gradient-primary">
                Your campus,
              </span>
              <br />
              <span className="font-human font-black tracking-tighter">
                reimagined.
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed font-human max-w-xl">
              Bảo vệ sinh viên Việt Nam trước bẫy lừa đảo việc làm, học bổng giả mạo, trọ ảo và deepfake bằng <strong className="text-white">Động cơ AI 4 Lớp</strong> kết hợp <strong className="text-teal-300">Mạng lưới Chuyên gia Uy tín</strong>.
            </p>

            {/* Action CTAs with Inter + JetBrains Mono Tech Suffixes */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <TactileButton
                variant="primary"
                size="lg"
                href="/scam-check"
                icon={ShieldAlert}
                techSuffix="[AI SCAN 0.1s]"
              >
                Kiểm Tra Nghi Vấn Ngay
              </TactileButton>

              <TactileButton
                variant="secondary"
                size="lg"
                href="/register"
                icon={ArrowRight}
                techSuffix="[FREE .EDU]"
              >
                Bắt Đầu Miễn Phí
              </TactileButton>
            </div>

            {/* Guarantee Academic Badges */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-8 pt-4 text-xs text-gray-400 font-medium">
              <span className="flex items-center gap-1.5 text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> 100% Miễn phí
              </span>
              <span className="flex items-center gap-1.5 text-gray-300">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" /> Phân tích link, text &amp; OCR
              </span>
              <span className="flex items-center gap-1.5 text-gray-300">
                <Users className="w-4 h-4 text-teal-400 shrink-0" /> Cố vấn thực chứng
              </span>
            </div>
          </div>

          {/* Right Column: 3D Hologram Verification Core (5 Cols) */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="w-full h-[400px] sm:h-[480px] relative">
              <Hero3DCanvas />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
