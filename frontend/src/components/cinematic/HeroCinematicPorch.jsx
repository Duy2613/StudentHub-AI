"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import SmartVideo from "@/components/media/SmartVideo";
import { ReducedMotionBoundary } from "@/components/visual/ReducedMotionBoundary";

const EvidencePrism3D = dynamic(
  () => import("@/components/spatial/EvidencePrism3D"),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-full min-h-[360px] flex items-center justify-center overflow-hidden pointer-events-none" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={V3_MEDIA.landing.prism}
          alt=""
          className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_0_40px_rgba(117,107,255,0.35)]"
        />
      </div>
    ),
  }
);

export default function HeroCinematicPorch() {
  return (
    <section className="relative w-full min-h-[92vh] flex flex-col justify-between overflow-hidden border-b border-white/10 bg-space-950 pt-24 pb-16 px-6 lg:px-12">
      {/* 1. Ambient Cinematic Video Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <SmartVideo
          priority={true}
          src={V3_MEDIA.landing.hero.video}
          poster={V3_MEDIA.landing.hero.poster}
          alt="Hiên Tri Thức - StudentHub AI Khai Minh"
          className="w-full h-full"
          videoClassName="opacity-45 filter contrast-110 saturate-125 scale-105 transition-transform duration-1000"
          posterClassName="opacity-45 filter contrast-110 saturate-125 scale-105"
        >
          {/* Layered Architectural Gradient Masks for WCAG AAA Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/70 to-space-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(117,107,255,0.18),rgba(6,8,19,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(101,216,255,0.12),transparent_50%)]" />
        </SmartVideo>
      </div>

      {/* 2. Top Kicker & Forensic Telemetry */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between pt-4">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-wider text-slate-300 uppercase font-semibold">
            KHAI MINH // HỆ THỐNG THẨM ĐỊNH BẰNG CHỨNG HỌC ĐƯỜNG
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <span>BẢO MẬT DỮ LIỆU ĐẦU VÀO</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>QUY TRÌNH THẨM ĐỊNH ĐA TẦNG</span>
        </div>
      </div>

      {/* 3. Main Stage: Asymmetric Monumental Typography + 3D Evidence Prism */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-12">
        {/* Left Column: Monumental Hobro-Style Typography */}
        <div className="lg:col-span-7 flex flex-col justify-center relative">
          {/* Subtle Watermark Coordinate */}
          <div className="absolute -left-6 -top-8 text-[120px] font-mono font-black text-white/[0.02] select-none pointer-events-none tracking-widest -z-10 leading-none hidden sm:block" aria-hidden="true">
            VERIFY
          </div>

          <div className="relative mb-6">
            {/* Tiny Editorial Notation */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase font-semibold">
                ĐỒNG THUẬN TRI THỨC SỐ
              </span>
              <span className="w-8 h-px bg-gradient-to-r from-emerald-400 to-transparent" />
              <span className="text-xs font-serif italic text-slate-400">
                Khởi tạo từ hoài nghi khoa học
              </span>
            </div>

            {/* Monumental Asymmetric Editorial Headline */}
            <h1 className="select-none leading-[0.96] tracking-tight">
              <span className="block text-display-2xl font-black text-white font-sans uppercase">
                HIỂU
              </span>
              <span className="block text-display-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 font-sans pl-4 sm:pl-10 uppercase -mt-2">
                ĐÚNG.
              </span>
              <span className="block text-display-lg font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 font-serif pl-8 sm:pl-24 mt-1">
                Đi xa.
              </span>
            </h1>
          </div>

          <p className="text-lg sm:text-xl text-slate-300 font-serif leading-relaxed max-w-xl mb-8">
            Thông tin không thiếu. Điều thiếu là bằng chứng đã được thẩm định độc lập. StudentHub bóc tách mệnh đề, đối chiếu quy chế gốc và kết nối hội đồng chuyên gia phản biện.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/trust"
              data-cursor="KIỂM CHỨNG"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-space-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Kiểm chứng tin đồn ngay</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>

            <Link
              href="/community"
              data-cursor="DIỄN ĐÀN"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 backdrop-blur-md font-medium text-sm transition-all"
            >
              <span>Diễn đàn phản biện</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Interactive 3D Prism + Floating Evidence Fragments */}
        <div
          className="lg:col-span-5 relative w-full aspect-square max-w-[480px] mx-auto lg:max-w-none flex items-center justify-center"
          data-cursor="3D PRISM"
        >
          {/* Spatial WebGL Scene */}
          <div className="absolute inset-0 w-full h-full z-10">
            <ReducedMotionBoundary>
              <EvidencePrism3D />
            </ReducedMotionBoundary>
          </div>

          {/* Floating Forensic Badges in Depth */}
          <div className="absolute -top-2 right-4 z-20 px-3.5 py-2 rounded-xl bg-space-900/90 border border-emerald-500/30 backdrop-blur-xl shadow-xl animate-float-slow">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-300 font-semibold tracking-wide">
                NGUỒN GỐC CHÍNH THỐNG
              </span>
            </div>
          </div>

          <div className="absolute bottom-6 -left-2 z-20 px-3.5 py-2 rounded-xl bg-space-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl animate-float-delayed">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-cyan-400" />
              <span className="text-[11px] font-mono text-cyan-300 font-semibold tracking-wide">
                ĐỐI CHIẾU NGUỒN ĐỘC LẬP
              </span>
            </div>
          </div>

          <div className="absolute bottom-2 right-6 z-20 px-3 py-1.5 rounded-lg bg-space-900/85 border border-indigo-500/30 backdrop-blur-md shadow-lg">
            <span className="text-[10px] font-mono text-indigo-300">
              [MINH HỌA DEMO] AI VERIFICATION — GEMINI
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Metric Strip (Authentic Product Capabilities) */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/10">
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase block mb-1">Tiếp nhận đa nguồn</span>
          <span className="text-sm font-semibold text-white font-sans">Văn bản, liên kết &amp; ảnh chụp</span>
        </div>
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase block mb-1">Đối chiếu quy chế</span>
          <span className="text-sm font-semibold text-white font-sans">Hệ thống quy định viện trường</span>
        </div>
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase block mb-1">AI VERIFICATION</span>
          <span className="text-sm font-semibold text-emerald-400 font-sans">Gemini advisory · policy quyết định</span>
        </div>
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase block mb-1">Hội đồng chuyên gia</span>
          <span className="text-sm font-semibold text-cyan-400 font-sans">Chuyển tiếp thẩm định khi cần</span>
        </div>
      </div>
    </section>
  );
}
