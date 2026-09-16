"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";

export default function FinalClaritySection() {
  return (
    <section className="relative w-full py-32 px-6 lg:px-12 bg-space-950 overflow-hidden">
      {/* Subtle spectral refraction gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-emerald-600/10 via-cyan-600/15 to-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
          <Sparkles size={14} className="text-cyan-400" />
          <span className="text-xs font-mono tracking-widest text-slate-300 uppercase font-semibold">
            CHƯƠNG 09 // ĐÍCH ĐẾN CỦA SỰ MINH BẠCH
          </span>
        </div>

        {/* Monumental Editorial Headline */}
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight font-sans leading-[1.05] mb-4">
          HIỂU ĐÚNG. <br />
          <span className="text-3xl sm:text-5xl lg:text-6xl font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 font-serif block mt-2">
            Đi xa.
          </span>
        </h2>

        <div className="mb-8">
          <span className="text-sm sm:text-base font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            TRUST KHÔNG PHẢI LÀ THÊM DỮ LIỆU · MÀ LÀ BẰNG CHỨNG TỐT HƠN
          </span>
        </div>

        <p className="text-slate-300 font-serif text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
          Hành trang đại học của bạn không nên xây dựng trên những lời đồn thổi vô căn cứ. Hãy để lăng kính bằng chứng bảo vệ mọi quyết định học tập của bạn.
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/trust"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-space-950 font-bold text-sm tracking-wide shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <ShieldCheck size={18} />
            <span>Bắt đầu kiểm chứng miễn phí</span>
            <ArrowUpRight size={16} />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 backdrop-blur-md font-semibold text-sm transition-all"
          >
            <span>Vào tổng quan học vụ</span>
          </Link>
        </div>

        {/* Final Brand Seal */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <span>STUDENTHUB AI · KHAI MINH EDITION 2026</span>
          <span>HIỂU ĐÚNG. ĐI XA.</span>
        </div>
      </div>
    </section>
  );
}
