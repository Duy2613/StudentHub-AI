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
import { useBackground } from "@/components/providers/BackgroundContext";
import { motion } from "motion/react";

export default function HeroSection() {
  const { activeWallpaper } = useBackground();

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      
      {/* Editorial Knowledge Orbit Background Motif */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] sm:w-[950px] sm:h-[950px] pointer-events-none opacity-40 z-0">
        <div className="w-full h-full orbital-knowledge-ring relative">
          <div className="orbital-node-dot top-0 left-1/2 -translate-x-1/2" />
          <div className="orbital-node-dot bottom-0 left-1/2 -translate-x-1/2" />
          <div className="orbital-node-dot top-1/2 left-0 -translate-y-1/2" />
          <div className="orbital-node-dot top-1/2 right-0 -translate-y-1/2" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Editorial Metadata Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-[11px] font-mono tracking-widest text-gray-400 uppercase border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-gray-300 font-bold">STUDENT HUB AI</span>
            <span className="text-gray-600">/</span>
            <span>DIGITAL CAMPUS 2026</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[10px] text-gray-400">
            <span>01 / XÁC THỰC AI</span>
            <span>02 / CỐ VẤN THỰC CHỨNG</span>
            <span>03 / DIỄN ĐÀN SINH VIÊN</span>
            <span>04 / TRUST NETWORK</span>
          </div>

          <div className="flex items-center gap-2 text-teal-300 bg-teal-500/10 border border-teal-500/30 px-3 py-1 rounded-full text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>BẢNG C • CUỘC THI QUỐC GIA AI 2026</span>
          </div>
        </div>

        {/* Hero Title & Editorial Statement */}
        <div className="max-w-5xl mx-auto text-center space-y-6 pt-4">
          
          <div className="space-y-2">
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-teal-300 font-mono font-bold">
              Human Technology × Cinematic Campus
            </p>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.08] font-normal text-white">
              <span className="font-serif-editorial italic font-normal text-gradient-primary">
                Your campus,
              </span>
              <br />
              <span className="font-sans font-black tracking-tighter">
                reimagined.
              </span>
            </h1>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Bảo vệ sinh viên Việt Nam trước bẫy lừa đảo việc làm, học bổng giả mạo, trọ ảo và deepfake bằng <strong>Động cơ AI 4 Lớp</strong> kết hợp <strong>Mạng lưới Chuyên gia Uy tín</strong>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <TactileButton
              variant="primary"
              size="lg"
              href="/scam-check"
              icon={ShieldAlert}
            >
              Kiểm Tra Nghi Vấn Ngay
            </TactileButton>

            <TactileButton
              variant="secondary"
              size="lg"
              href="/register"
              icon={ArrowRight}
            >
              Bắt Đầu Miễn Phí
            </TactileButton>
          </div>

          {/* Guarantee Academic Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> 100% Miễn phí cho sinh viên
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Phân tích link, text &amp; ảnh OCR
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <Users className="w-4 h-4 text-teal-400" /> Chuyên gia thẩm định thực chứng
            </span>
          </div>
        </div>

        {/* 3D Hologram Verification Core Visual */}
        <div className="mt-12 max-w-5xl mx-auto relative">
          <Hero3DCanvas />
        </div>

      </div>
    </section>
  );
}
