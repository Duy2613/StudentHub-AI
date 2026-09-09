"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ScanSearch, ShieldCheck } from "lucide-react";
import VNextButton from "@/components/ui/VNextButton";
import VerifiedPoster from "@/components/media/VerifiedPoster";
import ReferenceBirdStamp from "@/components/media/ReferenceBirdStamp";

export default function VNextLandingHero() {
  return (
    <section className="vnext-landing-hero pt-8 pb-16 lg:py-24" aria-labelledby="hero-title">
      <div className="vnext-landing-hero-grid max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 7 Columns Editorial Copy */}
        <div className="vnext-landing-hero-copy space-y-6">
          {/* Micro Telemetry HUD Kicker */}
          <div className="vnext-hero-kicker" aria-label="StudentHub forensic audit">
            <span className="vnext-hero-kicker-dot" aria-hidden="true" />
            <span className="type-micro-label-v3">
              STU-ENGINE-V3 // FORENSIC AUDIT
            </span>
            <span className="vnext-hero-kicker-divider" aria-hidden="true" />
            <span className="vnext-hero-kicker-detail">ZERO-TRUST</span>
          </div>

          {/* Monumental Typographic Collision */}
          <h1 id="hero-title" className="vnext-landing-title">
            Hiểu đúng.
            <em className="type-editorial">Đi xa.</em>
          </h1>

          <p className="type-body-editorial text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
            Kiểm tra nguồn tin, đối chiếu bối cảnh quy chế và thấy rõ điều còn thiếu trước khi bạn đưa ra quyết định học thuật.
          </p>

          {/* High-Affordance Actions */}
          <div className="vnext-landing-actions flex flex-wrap items-center gap-4 pt-2">
            <VNextButton href="/trust" size="lg" className="shadow-lg shadow-cyan-500/10">
              <ScanSearch size={18} aria-hidden="true" />
              Kiểm tra trước khi tin
              <ArrowRight size={17} aria-hidden="true" />
            </VNextButton>
            <Link 
              href="#trust-chapter" 
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Xem cách hoạt động <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {/* Principles Row */}
          <div className="vnext-landing-principles pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400" aria-label="Ba nguyên tắc của StudentHub">
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
        </div>

        {/* 5 Columns Asymmetric Media Box Collision (Hobro Style) */}
        <div className="vnext-landing-hero-art">
          <figure className="vnext-landing-hero-media" aria-label="Lăng kính bằng chứng, poster không gian">
            <div className="vnext-hero-art-frame group">
            <VerifiedPoster
              assetId="VID-PRISM-01"
              priority
              alt="Lăng kính khúc xạ tri thức, không gian kiểm chứng"
              className="w-full h-full"
            />
              <ReferenceBirdStamp className="vnext-hero-bird" />
              <span className="vnext-hero-art-sheen" aria-hidden="true" />
            </div>

            <figcaption className="vnext-hero-media-caption">
              <span className="vnext-hero-media-caption-primary">
                <ShieldCheck size={14} className="text-cyan-400" />
                <span className="type-micro-label-v3">
                  LĂNG KÍNH KHAI MINH · VID-PRISM-01
                </span>
              </span>
              <span className="vnext-hero-media-caption-detail">
                POSTER FIRST // REFRACTION
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
