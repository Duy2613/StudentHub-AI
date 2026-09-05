"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck, Sparkles } from "lucide-react";

export default function FinalCtaSection() {
  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Ambient background light orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/10 to-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Sparkles size={13} />
          <span>Bắt đầu hôm nay</span>
        </div>

        <h2
          id="cta-heading"
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-tight"
        >
          Sẵn Sàng Làm Chủ <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-accent-knowledge">
            Hành Trình Học Thuật?
          </span>
        </h2>

        <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
          Bước vào không gian tri thức liên kết, rèn luyện kỹ năng giải quyết vấn đề và xây dựng hồ
          sơ năng lực có bằng chứng xác thực.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/learn"
            className="px-8 py-4 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-medium text-base flex items-center gap-2.5 shadow-xl shadow-accent-primary/25 transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <span>Bắt đầu học ngay</span>
            <ArrowRight size={17} />
          </Link>

          <Link
            href="/trust"
            className="px-8 py-4 rounded-xl bg-surface-primary hover:bg-surface-elevated text-text-primary border border-border-strong font-medium text-base flex items-center gap-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-accent-knowledge"
          >
            <ShieldCheck size={18} className="text-accent-knowledge" />
            <span>Mở Trust Engine</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
