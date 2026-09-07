"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, Play } from "lucide-react";

export default function CinematicHeroSection({ onOpenAdvisory }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Monumental Editorial Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            
            {/* Top Badge: Reality-First OS */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-teal-400/30 bg-teal-400/10 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-80"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal-300">
                AI TRUST CONSTITUTION · V9 REALITY-FIRST
              </span>
            </div>

            {/* Main Headline: Editorial Contrast */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08]">
              Hệ Điều Hành <br />
              <span className="font-serif italic font-normal bg-gradient-to-r from-teal-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                Học Thuật Tự Thẩm Định
              </span>
            </h1>

            {/* Subheading */}
            <p className="max-w-2xl text-base sm:text-lg text-gray-300 leading-relaxed font-normal">
              Nền tảng trí tuệ nhân tạo đầu tiên biết <strong className="text-white font-semibold">tự kiểm chứng căn cứ văn bản</strong> trước khi đưa ra lời khuyên. Loại bỏ hoàn toàn ảo giác, bảo vệ sinh viên trước thông tin sai lệch, tối ưu hóa toàn diện lộ trình tốt nghiệp.
            </p>

            {/* Magnetic CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenAdvisory}
                data-cursor-text="Bắt đầu"
                className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 px-7 py-3.5 text-sm font-black text-black shadow-[0_0_30px_rgba(52,231,196,0.35)] transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Thiết Lập Lộ Trình Học</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <Link
                href="/trust"
                data-cursor-text="Kiểm chứng"
                className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.05] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-teal-400/50 hover:bg-white/[0.1]"
              >
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <span>Trải Nghiệm AI Trust V2</span>
              </Link>
            </div>

            {/* Quick Trust Credentials */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 w-full max-w-lg">
              <div>
                <div className="font-mono text-2xl font-black text-white">14,890+</div>
                <div className="font-mono text-[11px] text-gray-400 uppercase mt-0.5">Sinh viên hoạt động</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-black text-teal-400">100%</div>
                <div className="font-mono text-[11px] text-gray-400 uppercase mt-0.5">Nguồn thực HCMUTE</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-black text-indigo-400">0.9412</div>
                <div className="font-mono text-[11px] text-gray-400 uppercase mt-0.5">F1 TEVV Benchmark</div>
              </div>
            </div>

          </div>

          {/* Right Column: Double-Bezel Holographic Media Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Glow Halo */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-teal-500/30 to-indigo-500/30 blur-2xl opacity-70"></div>

              {/* High-Tech Card Container */}
              <div 
                data-cursor-text="Chi tiết"
                className="interactive-card relative overflow-hidden rounded-3xl border border-white/15 bg-black/60 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-teal-400/40 group"
              >
                {/* Visual Image with Ken Burns Zoom */}
                <div className="aspect-[16/11] w-full overflow-hidden relative">
                  <Image
                    src="/images/academic/academic_hero_portal.jpg"
                    alt="Khám phá quả cầu tri thức holographic tại thư viện số đại học"
                    width={800}
                    height={550}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                  
                  {/* Floating Telemetry Badge on Image */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-black/40 bg-black/70 px-3 py-1 backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping"></span>
                    <span className="font-mono text-[10px] font-bold text-teal-300">
                      LIVE · 3D KNOWLEDGE SPHERE
                    </span>
                  </div>

                  {/* Play Video / Ambient Action Button */}
                  <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110 shadow-lg">
                    <Play className="h-4 w-4 fill-white translate-x-0.5" />
                  </div>
                </div>

                {/* Card Sub-Banner */}
                <div className="p-5 border-t border-white/10 bg-[#090d1f]/90 flex items-center justify-between">
                  <div>
                    <h4 className="font-mono text-xs font-black uppercase text-white tracking-wider">
                      HCMUTE CURRICULUM GRAPH
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Đồ thị tiên quyết K23 - K26 & Cảnh báo học vụ QĐ 3116
                    </p>
                  </div>
                  <span className="rounded bg-teal-400/10 border border-teal-400/30 px-2 py-1 font-mono text-[10px] font-bold text-teal-300">
                    VERIFIED
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
