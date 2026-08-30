"use client";

import React from "react";
import { FileText, ExternalLink, ShieldCheck, HelpCircle, Clock, Scale, Network, ArrowRight } from "lucide-react";
import { LAYER_3_STATUS } from "@/lib/ai-trust/layer3/types";
import { safeExternalUrl } from "@/lib/security/safeExternalUrl";

export default function Layer3EvidenceHUD({ result, className = "" }) {
  if (!result) return null;

  const {
    status,
    claims = [],
    claimStatuses = {},
    sources = [],
    evidence = [],
    sourceIndependence = {},
    crossSourceAgreement = {},
    conflicts = [],
    temporalAssessment = {},
    verificationCompleteness = 0,
    evidenceConfidence = 0.5,
    limitations = [],
    metrics = {},
  } = result;

  // Status Styling Configuration
  const getStatusBadge = () => {
    switch (status) {
      case LAYER_3_STATUS.VERIFIED:
        return {
          bg: "bg-[#00f0ff]/10 border-[#00f0ff]/40 text-[#38f8d4]",
          icon: <ShieldCheck className="w-5 h-5 text-[#38f8d4]" />,
          title: "BẰNG CHỨNG XÁC THỰC (VERIFIED)",
          desc: "Đã thu thập bằng chứng từ các nguồn tin chính thống độc lập xác thực nội dung.",
        };
      case LAYER_3_STATUS.CONTESTED:
        return {
          bg: "bg-[#ffbc09]/15 border-[#ffbc09]/40 text-[#ffd15c]",
          icon: <Scale className="w-5 h-5 text-[#ffd15c]" />,
          title: "TRANH CHẤP NGUỒN TIN (CONTESTED)",
          desc: "Tồn tại thông tin mâu thuẫn hoặc đính chính giữa các nguồn tin chính thống.",
        };
      case LAYER_3_STATUS.INSUFFICIENT_EVIDENCE:
        return {
          bg: "bg-[#ff9900]/15 border-[#ff9900]/40 text-[#ffaa44]",
          icon: <Clock className="w-5 h-5 text-[#ffaa44]" />,
          title: "BẰNG CHỨNG HẾT HẠN (OUTDATED / INSUFFICIENT)",
          desc: "Bằng chứng thu thập được đã cũ hoặc không còn hiệu lực cho sự kiện hiện tại.",
        };
      case LAYER_3_STATUS.UNVERIFIED:
      default:
        return {
          bg: "bg-[#888888]/15 border-[#888888]/40 text-[#cccccc]",
          icon: <HelpCircle className="w-5 h-5 text-[#cccccc]" />,
          title: "CHƯA XÁC MINH NGUỒN TIN (UNVERIFIED)",
          desc: "Chưa tìm thấy nguồn tin chính thống bên ngoài công bố về sự kiện này (Không đồng nghĩa là sai sự thật).",
        };
    }
  };

  const statusConfig = getStatusBadge();

  return (
    <div className={`p-5 sm:p-7 rounded-2xl bg-[#090302]/95 border border-[#38f8d4]/30 backdrop-blur-xl shadow-[0_0_40px_rgba(56,248,212,0.1)] space-y-6 ${className}`}>
      {/* 1. Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1b0805]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#38f8d4] tracking-widest uppercase">
              AI TRUST PIPELINE // LAYER 03
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
              {metrics.retrievalProvider || "evidence_engine"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-human tracking-tight">
            External Evidence & Source Verification
          </h2>
        </div>

        {/* Status Pill */}
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 ${statusConfig.bg}`}>
          {statusConfig.icon}
          <div>
            <div className="text-xs font-bold font-mono leading-none">{statusConfig.title}</div>
            <div className="text-[10px] opacity-75 font-mono mt-0.5">
              Độ hoàn thiện: {(verificationCompleteness * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-black/60 border border-[#2d0d08]">
          <div className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Nguồn Độc Lập</div>
          <div className="text-lg font-bold font-mono text-[#38f8d4] mt-0.5">
            {sourceIndependence.independentSourcesCount || sources.length} cụm lineage
          </div>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-[#2d0d08]">
          <div className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Đồng Thuận Nguồn</div>
          <div className="text-lg font-bold font-mono text-[#ffbc09] mt-0.5">
            {((crossSourceAgreement.agreementScore || 1) * 100).toFixed(0)}% ({crossSourceAgreement.supportingSourcesCount || 0} ủng hộ / {crossSourceAgreement.contradictingSourcesCount || 0} bác bỏ)
          </div>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-[#2d0d08]">
          <div className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Độ Tin Cậy Bằng Chứng</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            {(evidenceConfidence * 100).toFixed(0)}%
          </div>
        </div>
        <div className="p-3 rounded-xl bg-black/60 border border-[#2d0d08]">
          <div className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Độ Trễ Đối Soát</div>
          <div className="text-lg font-bold font-mono text-[#38f8d4] mt-0.5">
            {metrics.executionTimeMs} ms
          </div>
        </div>
      </div>

      {/* 3. Discovered Source Conflicts (if any) */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-[#ffbc09]/10 border border-[#ffbc09]/40 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-[#ffd15c] font-mono">
            <Scale className="w-4 h-4 text-[#ffd15c]" />
            PHÁT HIỆN TRANH CHẤP / MÂU THUẪN GIỮA CÁC NGUỒN TIN CHÍNH THỐNG
          </div>
          {conflicts.map((conf, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-black/60 border border-[#ffbc09]/20 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-mono uppercase">{conf.conflictType}</span>
                <span className="text-[10px] font-mono text-[#ffd15c]">
                  {conf.supportingSourcesCount} nguồn xác nhận vs {conf.contradictingSourcesCount} nguồn đính chính
                </span>
              </div>
              <p className="text-[11px] text-[#ece7e0]/80 font-human leading-relaxed">
                {conf.resolutionRecommendation}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 4. Claim - Evidence Matrix */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white font-mono uppercase">
          <FileText className="w-4 h-4 text-[#38f8d4]" />
          Ma Trận Bằng Chứng Đối Soát (Claim-Evidence Matrix)
        </div>

        <div className="space-y-2.5">
          {claims.map((claim, idx) => {
            const claimStatus = claimStatuses[claim.claimId] || "UNVERIFIED";
            const claimEvs = evidence.filter((e) => e.claimId === claim.claimId);

            const isSupported = claimStatus === "SUPPORTED";
            const isContradicted = claimStatus === "CONTRADICTED";
            const isPartial = claimStatus === "PARTIALLY_SUPPORTED";
            const isContested = claimStatus === "CONTESTED";
            const isOutdated = claimStatus === "OUTDATED_EVIDENCE";

            const badgeBg = isSupported
              ? "bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#38f8d4]"
              : isContradicted
              ? "bg-[#ea3810]/15 border-[#ea3810]/40 text-[#ff6b4a]"
              : isPartial
              ? "bg-[#ffbc09]/15 border-[#ffbc09]/40 text-[#ffd15c]"
              : isContested
              ? "bg-[#ff9900]/15 border-[#ff9900]/40 text-[#ffaa44]"
              : isOutdated
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
              : "bg-white/10 border-white/20 text-[#ece7e0]/70";

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-black/40 border border-[#2d0d08] space-y-2.5 hover:border-[#38f8d4]/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-white/70">
                      CLAIM #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white font-human">
                      {claim.subject} • {claim.predicate}
                    </span>
                  </div>

                  <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded border self-start sm:self-auto ${badgeBg}`}>
                    {claimStatus}
                  </span>
                </div>

                <p className="text-xs text-[#ece7e0]/80 font-human italic leading-relaxed">
                  &ldquo;{claim.rawText}&rdquo;
                </p>

                {/* Evidence Passages */}
                {claimEvs.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {claimEvs.map((ev, evIdx) => (
                      <div
                        key={evIdx}
                        className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                          <a
                            href={safeExternalUrl(ev.sourceUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#38f8d4] hover:underline flex items-center gap-1 truncate max-w-[280px]"
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            {ev.sourceTitle || ev.sourceUrl}
                          </a>
                          <span className="text-white/60 shrink-0 font-bold">
                            {ev.relation} ({ev.freshness})
                          </span>
                        </div>
                        <p className="text-[#ece7e0]/90 font-human leading-relaxed">
                          &ldquo;{ev.excerpt}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-[#ece7e0]/50 pt-1">
                    ⚠️ Không tìm thấy nguồn tin chính thống nào xác nhận phát ngôn này.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Hand-off to Layer 4 Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#00f0ff]/10 via-[#38f8d4]/5 to-transparent border border-[#38f8d4]/30 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-white">
          <Network className="w-4 h-4 text-[#38f8d4]" />
          <span>Gói bằng chứng sẵn sàng chuyển tiếp sang Layer 4 (Final Trust Reasoning).</span>
        </div>
        <div className="text-[#38f8d4] font-bold flex items-center gap-1 shrink-0">
          NEXT: LAYER 04 <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
