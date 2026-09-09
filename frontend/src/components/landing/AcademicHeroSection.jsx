"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  ScanSearch,
  ShieldCheck,
  FileCheck,
  Building2,
} from "lucide-react";
import ProgressiveKnowledgeUniverse from "../canvas/ProgressiveKnowledgeUniverse";
import { OBSERVATORY_LAYERS } from "../canvas/knowledgeUniverseData";

/**
 * AcademicHeroSection — "Hiên Tri Thức"
 * StudentHub Visual System VNext — "Khai Minh"
 * - 70% Editorial Calm + 20% Product Precision + 10% Cinematic Wonder
 * - Master Headline: "HIỂU ĐÚNG. Đi xa." (Be Vietnam Pro 700 + Lora Italic Serif)
 * - Signature Button-in-Button Primary Action
 * - Knowledge Observatory with converging academic trust layers
 * - Body copy ≥16px, principles ≥14px, zero clipped diacritics
 */
export default function AcademicHeroSection() {
  const [activeNode, setActiveNode] = useState("van-ban-phap-quy");

  const currentNode =
    OBSERVATORY_LAYERS.find((d) => d.id === activeNode) || OBSERVATORY_LAYERS[0];

  return (
    <section
      className="relative min-h-[calc(100dvh-4rem)] flex items-center justify-center overflow-hidden border-b border-white/[0.08] bg-[#08110F]"
      aria-labelledby="hero-title"
    >
      {/* Calm Mineral Ambient Aura (No neon, gentle jade & ivory glow) */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#7BE0B2]/[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[420px] h-[420px] rounded-full bg-[#8EC5FF]/[0.04] blur-[140px] pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
        {/* Left Column: 70% Editorial Calm Narrative */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center text-left space-y-7 z-10">
          {/* Eyebrow Chip */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider bg-[#0F1B18] border border-white/[0.12] text-[#7BE0B2] w-fit shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#7BE0B2] animate-pulse" />
            <span className="font-medium uppercase tracking-widest text-[11px]">
              Hệ điều hành học thuật & Khảo chứng số
            </span>
          </div>

          {/* Master Hero Headline */}
          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#F4F0E6] leading-[1.18] py-1"
          >
            HIỂU ĐÚNG. <br />
            <span className="font-serif italic font-medium text-[#7BE0B2] tracking-normal">
              Đi xa.
            </span>
          </h1>

          {/* Supporting Copy (Max 2-3 lines, 17px body, relaxed spacing) */}
          <p className="text-base sm:text-lg text-[#C3CCC6] leading-relaxed max-w-xl font-normal">
            Trước khi học, ký, trả tiền hoặc chia sẻ, hãy biết nội dung đang dựa
            trên nguồn nào, còn thiếu điều gì và bước tiếp theo an toàn là gì.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {/* Primary Action: Signature Button-in-Button */}
            <Link
              href="/trust"
              className="btn-primary-action group"
            >
              <ScanSearch size={18} className="text-[#08110F]" aria-hidden="true" />
              <span>Kiểm tra trước khi tin</span>
              <span className="btn-icon-bubble" aria-hidden="true">
                <ArrowRight size={15} />
              </span>
            </Link>

            {/* Secondary Action: Calm Outline */}
            <Link
              href="/learn"
              className="px-5 py-3.5 rounded-full bg-[#0F1B18] hover:bg-[#13221E] text-[#F4F0E6] border border-white/[0.12] hover:border-[#7BE0B2]/40 font-medium text-sm sm:text-base flex items-center gap-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#7BE0B2]"
            >
              <Compass size={17} className="text-[#7BE0B2]" aria-hidden="true" />
              <span>Khám phá cách hoạt động</span>
            </Link>
          </div>

          {/* 3 Core Academic Principles (≥14px readable, generous rhythm) */}
          <div className="pt-8 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#7BE0B2]">01</span>
                <span className="text-sm font-semibold text-[#F4F0E6]">Nguồn chuẩn</span>
              </div>
              <p className="text-sm text-[#C3CCC6] leading-relaxed">
                Đối chiếu quy chế ĐH & văn bản Bộ GD&ĐT.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#F3C56B]">02</span>
                <span className="text-sm font-semibold text-[#F4F0E6]">Bối cảnh thực</span>
              </div>
              <p className="text-sm text-[#C3CCC6] leading-relaxed">
                Đọc đúng thời điểm và phạm vi áp dụng.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#8EC5FF]">03</span>
                <span className="text-sm font-semibold text-[#F4F0E6]">Hành động</span>
              </div>
              <p className="text-sm text-[#C3CCC6] leading-relaxed">
                Ra quyết định học vụ trên căn cứ vững vàng.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 20% Precision — Knowledge Observatory Spatial View */}
        <div className="lg:col-span-6 xl:col-span-6 relative w-full h-[420px] sm:h-[480px] lg:h-[580px] flex items-center justify-center">
          {/* Double-Bezel Outer Shell for the Instrument */}
          <div className="w-full h-full rounded-2xl bg-white/[0.02] border border-white/[0.08] p-2.5 shadow-2xl relative">
            <div className="w-full h-full rounded-xl bg-[#0B1412] border border-white/[0.06] overflow-hidden relative flex items-center justify-center">
              {/* Progressive Knowledge Observatory (SVG Fallback + WebGL Enhancement) */}
              <ProgressiveKnowledgeUniverse
                activeNodeId={activeNode}
                onSelectNode={(id) => setActiveNode(id)}
                className="w-full h-full"
              />

              {/* Active Layer Inspector Pill */}
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-20 flex flex-col gap-1 p-3.5 rounded-xl bg-[#0F1B18]/95 border border-white/[0.14] backdrop-blur-md max-w-sm text-left shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentNode.color || "#7BE0B2" }}
                    />
                    <span className="text-xs font-mono uppercase tracking-wider text-[#8A9891]">
                      {currentNode.domain}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#7BE0B2]">
                    Hội tụ tri thức
                  </span>
                </div>
                <div className="text-sm font-bold text-[#F4F0E6]">
                  {currentNode.label}
                </div>
                <p className="text-sm text-[#C3CCC6] leading-snug line-clamp-2">
                  {currentNode.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
