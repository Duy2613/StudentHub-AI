"use client";

import React from "react";

import { ShieldCheck, ArrowRight, CheckCircle2, Award } from "lucide-react";
import TactileButton from "@/components/ui/TactileButton";

export default function CallToActionSection() {
  return (
    <section className="py-24 relative z-10 overflow-hidden" id="cta">
      <div className="layout-safe-container text-center space-y-8 relative">
        
        {/* Glowing Ambient Core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-teal-500/15 via-indigo-500/15 to-rose-500/15 filter blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2">
          <span className="igloo-pill-badge">
            <Award className="w-3.5 h-3.5 text-teal-400" />
            <span>SÁNG TẠO TRẺ QUỐC GIA AI 2026 • BẢNG C</span>
          </span>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            <span className="font-serif-editorial italic font-normal text-gradient-primary">
              Bảo vệ hành trình học tập,
            </span>
            <br />
            <span className="font-human font-black tracking-tight">
              hoàn toàn miễn phí.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-gray-300 font-human max-w-xl mx-auto leading-relaxed">
            Tham gia cùng hàng nghìn sinh viên Việt Nam bảo vệ không gian mạng học tập trước các thủ đoạn lừa đảo tinh vi.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <TactileButton
            variant="primary"
            size="lg"
            href="/register"
            icon={ArrowRight}
            techSuffix="[FREE .EDU]"
          >
            Tạo Tài Khoản Sinh Viên Ngay
          </TactileButton>

          <TactileButton
            variant="secondary"
            size="lg"
            href="/scam-check"
            icon={ShieldCheck}
            techSuffix="[AI SCAN 0.1s]"
          >
            Thử Nghiệm AI Scam Checker
          </TactileButton>
        </div>

        {/* Reassurance */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Không thu bất kỳ khoản phí nào
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Xác thực email trường nhận ngay +30đ Uy Tín
          </span>
        </div>

      </div>
    </section>
  );
}
