"use client";

import React from "react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import SmartVideo from "@/components/media/SmartVideo";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import HobroTiltCard from "@/components/cinematic/HobroTiltCard";

export default function NoiseToSignalSection() {
  return (
    <section className="relative w-full py-28 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Editorial Chapter Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-cyan-400 font-semibold tracking-widest uppercase">
                CHƯƠNG 02 // LĂNG KÍNH PHẢN CHIẾU
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans leading-tight">
              Thông tin rất nhiều.{" "}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-indigo-300 block sm:inline">
                Bằng chứng đáng tin thì không.
              </span>
            </h2>
          </div>
          <p className="text-slate-400 font-serif text-base sm:text-lg max-w-md leading-relaxed">
            Khi tin đồn học vụ và học bổng lừa đảo lan truyền trên mạng xã hội, Evidence Prism bóc tách từng thực thể, truy xuất văn bản gốc và dập tắt nhiễu loạn trước khi rủi ro xảy ra.
          </p>
        </div>

        {/* Video Transformation Canvas with Side-by-Side Architectural Contrast */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Video transformation loop */}
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-white/15 bg-space-900 shadow-2xl group">
            <SmartVideo
              src={V3_MEDIA.landing.trustTransform.video}
              poster={V3_MEDIA.landing.prism}
              alt="Lăng kính phản chiếu - Chuyển hóa nhiễu loạn thành tín hiệu"
              className="w-full aspect-video"
              videoClassName="aspect-video object-cover group-hover:scale-105 transition-transform duration-700"
              posterClassName="aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
              <span className="text-xs font-mono text-cyan-300 bg-space-950/80 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                EVIDENCE PRISM REFRACTION PROCESS
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30">
                STABLE SIGNAL
              </span>
            </div>
          </div>

          {/* Right: Analytical Duality Comparison */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Unstructured Noise Card */}
            <HobroTiltCard
              maxTilt={7}
              spotlightColor="rgba(244, 63, 94, 0.18)"
              className="p-6 bg-rose-950/20 border-rose-500/25"
              cursorText="NOISE"
            >
              <div className="flex items-center gap-3 text-rose-400 mb-3">
                <AlertTriangle size={20} />
                <span className="text-xs font-mono font-bold tracking-wider uppercase">
                  THÔNG TIN CHƯA QUA KIỂM CHỨNG
                </span>
              </div>
              <p className="text-sm text-slate-300 font-serif leading-relaxed mb-4">
                &ldquo;Nghe bảo trường chuẩn bị tăng 30% học phí kỳ tới và hủy toàn bộ môn thực tập doanh nghiệp...&rdquo;
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-rose-300/80">
                <span className="px-2 py-0.5 rounded bg-rose-900/30 border border-rose-500/20">Ảnh chụp vô danh</span>
                <span className="px-2 py-0.5 rounded bg-rose-900/30 border border-rose-500/20">Zero nguồn dẫn</span>
                <span className="px-2 py-0.5 rounded bg-rose-900/30 border border-rose-500/20">Thời hạn mù</span>
              </div>
            </HobroTiltCard>

            {/* Transform Arrow */}
            <div className="flex justify-center -my-2 text-cyan-400/60">
              <ArrowRight size={24} className="rotate-90 lg:rotate-0" />
            </div>

            {/* Structured Verified Signal Card */}
            <HobroTiltCard
              maxTilt={7}
              spotlightColor="rgba(16, 185, 129, 0.2)"
              className="p-6 bg-emerald-950/25 border-emerald-500/35"
              cursorText="SIGNAL"
            >
              <div className="flex items-center gap-3 text-emerald-400 mb-3">
                <CheckCircle2 size={20} />
                <span className="text-xs font-mono font-bold tracking-wider uppercase">
                  BẰNG CHỨNG HỘI TỤ (VERIFIED)
                </span>
              </div>
              <p className="text-sm text-slate-200 font-serif leading-relaxed mb-4">
                Đối soát Quyết định số 142/QĐ-ĐHQG: Học phí áp dụng lộ trình cố định không đổi cho khóa 2024-2028. Thông tin tăng 30% là giả mạo.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-emerald-300">
                <span className="px-2 py-0.5 rounded bg-emerald-900/30 border border-emerald-500/30">Văn bản gốc .PDF</span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/30 border border-emerald-500/30">3 Nguồn đối soát</span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/30 border border-emerald-500/30">Chuyên gia phê duyệt</span>
              </div>
            </HobroTiltCard>
          </div>
        </div>
      </div>
    </section>
  );
}
