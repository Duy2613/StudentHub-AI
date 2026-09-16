"use client";

import React, { useState } from "react";
import { CheckCircle2, Radio } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import HobroTiltCard from "@/components/cinematic/HobroTiltCard";

const PIPELINE_FEEDS = [
  {
    id: "discovery",
    label: "CHẶNG 01 · DÒ QUÉT QUY CHẾ",
    title: "Truy Vết Công Văn Viện Trường",
    video: V3_MEDIA.trust.l2Discovery.video,
    poster: V3_MEDIA.trust.l2Discovery.poster,
    telemetry: "INDEX: 1,420 VĂN BẢN // ĐỘ PHỦ 99.4%",
    artifact: V3_MEDIA.trust.officialSource,
    tag: "QUY CHẾ GỐC",
  },
  {
    id: "ai-verification",
    label: "CHẶNG 02 · GEMINI ADVISORY",
    title: "AI Verification — Gemini",
    video: V3_MEDIA.trust.l4AiVerification.video,
    poster: V3_MEDIA.trust.l4AiVerification.poster,
    telemetry: "GEMINI STRUCTURED DTO // DETERMINISTIC POLICY AUTHORITY",
    artifact: V3_MEDIA.trust.l3Forensics,
    tag: "ĐỐI KHÁNG LOGIC",
  },
  {
    id: "human",
    label: "CHẶNG 03 · HỘI ĐỒNG CHUYÊN GIA",
    title: "Phê Duyệt Bảo Trợ Con Người",
    video: V3_MEDIA.trust.humanReview.video,
    poster: V3_MEDIA.trust.humanReview.poster,
    telemetry: "HỘI ĐỒNG: 12 CHUYÊN GIA // CHỮ KÝ SỐ MẬT MÃ",
    artifact: V3_MEDIA.trust.l5Decision,
    tag: "PHÁN QUYẾT CUỐI",
  },
];

const FORENSIC_ARTIFACTS = [
  {
    id: "input",
    title: "01. Tiếp Nhận Nghi Vấn",
    desc: "Mã hóa băm toàn vẹn SHA-256 đối với ảnh chụp màn hình và liên kết",
    image: V3_MEDIA.trust.input,
    badge: "MẬT MÃ ĐẦU VÀO",
  },
  {
    id: "claim",
    title: "02. Bóc Tách Mệnh Đề",
    desc: "Tách lọc từng thực thể độc lập: thời hạn, tỷ lệ tăng và đối tượng áp dụng",
    image: V3_MEDIA.trust.l1Claim,
    badge: "THỰC THỂ SỐ",
  },
  {
    id: "independence",
    title: "03. Lọc Nguồn Độc Lập",
    desc: "Nhận diện sao chép chéo giữa các hội nhóm MXH, loại bỏ nguồn phụ thuộc",
    image: V3_MEDIA.trust.sourceIndependence,
    badge: "ĐỘC LẬP THỰC",
  },
];

export default function TrustForensicPipelineVisualizer() {
  const [activeFeedIdx, setActiveFeedIdx] = useState(0);
  const activeFeed = PIPELINE_FEEDS[activeFeedIdx];

  return (
    <div className="w-full my-8 space-y-8">
      {/* Active Live Video Stage */}
      <div className="relative rounded-3xl border border-white/15 bg-space-900/95 overflow-hidden shadow-2xl">
        {/* Top Telemetry Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-space-950/80 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Radio size={13} className="animate-pulse" />
              <span>LIVE PIPELINE RADAR</span>
            </span>
            <span className="text-white/20">|</span>
            <span className="text-slate-300 font-semibold">{activeFeed.title}</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-cyan-300">
            <span>{activeFeed.telemetry}</span>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="relative aspect-[16/8] w-full bg-black overflow-hidden" data-cursor="STAGE FEED">
          <video
            key={activeFeed.video}
            src={activeFeed.video}
            poster={activeFeed.poster}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover filter contrast-110 brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-space-950/40 pointer-events-none" />

          {/* Precision Corner Marks */}
          <span className="absolute top-3 left-3 text-[10px] font-mono text-white/30 pointer-events-none">+</span>
          <span className="absolute top-3 right-3 text-[10px] font-mono text-white/30 pointer-events-none">+</span>
          <span className="absolute bottom-3 left-3 text-[10px] font-mono text-white/30 pointer-events-none">+</span>
          <span className="absolute bottom-3 right-3 text-[10px] font-mono text-white/30 pointer-events-none">+</span>

          {/* Overlay Info Badge */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div className="p-4 rounded-2xl bg-space-950/85 border border-white/15 backdrop-blur-xl max-w-md">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-2">
                {activeFeed.tag}
              </span>
              <h4 className="text-lg font-bold text-white font-sans">{activeFeed.title}</h4>
              <p className="text-xs text-slate-300 font-mono mt-1">{activeFeed.label}</p>
            </div>
          </div>
        </div>

        {/* Stage Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 bg-space-950/70 border-t border-white/10">
          {PIPELINE_FEEDS.map((feed, idx) => {
            const isSelected = idx === activeFeedIdx;
            return (
              <button
                key={feed.id}
                type="button"
                onClick={() => setActiveFeedIdx(idx)}
                className={`p-4 text-left transition-all relative ${
                  isSelected ? "bg-emerald-500/10 text-white" : "hover:bg-white/5 text-slate-400"
                }`}
                data-cursor={`CHẶNG ${idx + 1}`}
              >
                {isSelected && (
                  <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400" />
                )}
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">
                  CHẶNG 0{idx + 1}
                </span>
                <span className="text-xs font-bold font-sans text-white block">{feed.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Interactive Forensic Artifact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FORENSIC_ARTIFACTS.map((art) => (
          <HobroTiltCard
            key={art.id}
            maxTilt={6}
            className="p-5 flex flex-col justify-between"
            cursorText="HỒ SƠ GỐC"
          >
            <div>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 mb-4 group-hover:border-emerald-500/30 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 right-2 text-[9px] font-mono px-2 py-0.5 rounded bg-space-950/80 text-cyan-300 border border-white/10 backdrop-blur-sm">
                  {art.badge}
                </span>
              </div>
              <h5 className="text-sm font-bold text-white font-sans mb-1.5">{art.title}</h5>
              <p className="text-xs text-slate-300 font-serif leading-relaxed">{art.desc}</p>
            </div>

            <div className="pt-3 mt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-emerald-400">
              <span>ĐÃ ĐỐI SOÁT VĂN BẢN</span>
              <CheckCircle2 size={12} />
            </div>
          </HobroTiltCard>
        ))}
      </div>
    </div>
  );
}
