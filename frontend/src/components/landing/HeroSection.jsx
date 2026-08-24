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
  Lock
} from "lucide-react";
import Hero3DCanvas from "@/components/canvas/Hero3DCanvas";
import TactileButton from "@/components/ui/TactileButton";
import { GsapTextReveal } from "@/components/animations/GsapTimeline";
import { motion } from "motion/react";

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Contest Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 backdrop-blur-xl shadow-[0_0_20px_rgba(52,231,196,0.15)] text-teal-300 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Dự án dự thi Sáng tạo trẻ Quốc gia AI 2026 • Bảng C</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Nền Tảng Phòng Chống Lừa Đảo &amp;{" "}
            <span className="text-gradient-teal">
              Xác Thực Cho Sinh Viên
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Bảo vệ sinh viên Việt Nam trước bẫy lừa đảo việc làm, học bổng giả mạo, trọ ảo và deepfake bằng <strong>Động cơ AI 4 Lớp</strong> kết hợp <strong>Mạng lưới Chuyên gia Uy tín</strong>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
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

          {/* Guarantee Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-6 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> Hoàn toàn miễn phí cho sinh viên
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Phân tích link, text &amp; ảnh OCR
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <Users className="w-4 h-4 text-teal-400" /> Mạng lưới chuyên gia thực chứng
            </span>
          </div>
        </div>

        {/* 3D Hologram Verification Core Visual */}
        <div className="mt-10 max-w-5xl mx-auto">
          <Hero3DCanvas />
        </div>

      </div>
    </section>
  );
}
