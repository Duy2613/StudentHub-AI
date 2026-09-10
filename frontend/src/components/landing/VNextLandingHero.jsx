"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ScanSearch, ShieldCheck } from "lucide-react";
import VNextButton from "@/components/ui/VNextButton";
import KhaiMinhMedia from "@/components/visual/KhaiMinhMedia";
import EditorialMediaFrame from "@/components/visual/EditorialMediaFrame";
import PrismSweep from "@/components/visual/PrismSweep";
import Reveal from "@/components/visual/Reveal";
import MagneticTarget from "@/components/visual/MagneticTarget";

export default function VNextLandingHero() {
  return (
    <section
      className="vnext-landing-hero pt-8 pb-16 lg:py-24 relative overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* FX07: Bounded Ambient Field (Landing Hero Only, Max 3 Nodes, Desktop Only) */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block overflow-hidden" aria-hidden="true">
        <div className="fx07-node fx07-node-1" style={{ width: 40, height: 40, top: "15%", left: "60%" }} />
        <div className="fx07-node fx07-node-2" style={{ width: 28, height: 28, top: "65%", left: "85%" }} />
        <div className="fx07-node fx07-node-3" style={{ width: 20, height: 20, top: "40%", left: "40%" }} />
      </div>

      <div className="vnext-landing-hero-grid max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* FX01: Editorial Hero Copy Reveal */}
        <Reveal className="vnext-landing-hero-copy space-y-6">
          {/* Micro Telemetry HUD Kicker */}
          <div className="vnext-hero-kicker" aria-label="StudentHub Khai Minh Forensic Engine">
            <span className="vnext-hero-kicker-dot" aria-hidden="true" />
            <span className="type-micro-label-v3">
              KHAI MINH // EVIDENCE PRISM
            </span>
            <span className="vnext-hero-kicker-divider" aria-hidden="true" />
            <span className="vnext-hero-kicker-detail">KIỂM CHỨNG TRI THỨC</span>
          </div>

          {/* Monumental Typographic Headline */}
          <h1 id="hero-title" className="vnext-landing-title">
            Hiểu đúng.
            <em className="type-editorial block sm:inline sm:ml-3 text-cyan-300">Đi xa.</em>
          </h1>

          <p className="type-body-editorial text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
            Kiểm tra nguồn tin, đối chiếu bối cảnh quy chế và thấy rõ căn cứ xác thực trước khi bạn đưa ra quyết định học thuật.
          </p>

          {/* FX08: Magnetic Primary CTA Button */}
          <div className="vnext-landing-actions flex flex-wrap items-center gap-4 pt-2">
            <MagneticTarget radius={24} maxDistance={6}>
              <VNextButton href="/trust" size="lg" className="shadow-lg shadow-cyan-500/10">
                <ScanSearch size={18} aria-hidden="true" />
                Kiểm tra trước khi tin
                <ArrowRight size={17} aria-hidden="true" />
              </VNextButton>
            </MagneticTarget>
            <Link
              href="#trust-chapter"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Xem cách hoạt động <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {/* Three Foundational Principles */}
          <div
            className="vnext-landing-principles pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400"
            aria-label="Ba nguyên tắc của StudentHub Khai Minh"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400 font-semibold">01</span>
              <span>Nguồn trước lời khuyên</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400 font-semibold">02</span>
              <span>Bối cảnh trước kết luận</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400 font-semibold">03</span>
              <span>Bước tiếp theo rõ ràng</span>
            </div>
          </div>
        </Reveal>

        {/* FX03 + FX09: Hero Media Frame with Prism Light Sweep & Canonical KM-PRISM-001 Asset */}
        <div className="vnext-landing-hero-art">
          <PrismSweep className="rounded-2xl">
            <EditorialMediaFrame
              aspectRatio="16 / 10"
              caption="LĂNG KÍNH KHAI MINH // PHẢN QUANG TRI THỨC ĐA CHIỀU"
              className="shadow-2xl shadow-cyan-950/30"
            >
              <div className="hidden md:block w-full h-full">
                <KhaiMinhMedia
                  assetId="KM-PRISM-001"
                  priority
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
              <div className="block md:hidden w-full h-full">
                <KhaiMinhMedia
                  assetId="KM-EDITORIAL-001"
                  priority
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover"
                />
              </div>
            </EditorialMediaFrame>
          </PrismSweep>
        </div>
      </div>
    </section>
  );
}
