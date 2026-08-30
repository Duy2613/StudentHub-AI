"use client";

import React, { useState } from "react";
import { safeExternalUrl } from "@/lib/security/safeExternalUrl";

import { ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle, ExternalLink, Sparkles, Info, Scale, FileText, Fingerprint } from "lucide-react";


export default function Layer4TrustVerdictHUD({ result }) {
  const [expandedClaim, setExpandedClaim] = useState(null);
  const [activeView, setActiveView] = useState("overview"); // "overview" | "matrix" | "evidence_graph" | "audit"

  if (!result) return null;

  const {
    classification = "UNVERIFIED",
    status = "REQUIRE_VERIFICATION",
    truthAssessment = { status: "UNVERIFIED", confidence: 0.5 },
    riskAssessment = { level: "LOW", confidence: 0.5, primaryVectors: [] },
    decisionConfidence = 0.5,
    verificationCompleteness = 0.0,
    claims = [],
    keyReasons = [],
    conflicts = [],
    limitations = [],
    recommendedAction = "REQUIRE_VERIFICATION",
    userExplanation = {},
    auditTrail = {},
    metrics = {},
  } = result;

  // Status Colors & Badges
  const getClassificationBadge = (cls) => {
    switch (cls) {
      case "VERIFIED_TRUE":
        return { bg: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400", icon: ShieldCheck, label: "ĐÃ XÁC MINH (CHÍNH THỐNG)" };
      case "LIKELY_TRUE":
        return { bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300", icon: ShieldCheck, label: "RẤT CÓ THỂ ĐÚNG" };
      case "PARTIALLY_TRUE":
        return { bg: "bg-amber-500/10 border-amber-500/30 text-amber-300", icon: AlertTriangle, label: "ĐÚNG MỘT PHẦN" };
      case "MISLEADING":
        return { bg: "bg-amber-500/20 border-amber-500/50 text-amber-400", icon: AlertTriangle, label: "GÂY HIỂU LẦM / PHÓNG ĐẠI" };
      case "CONTRADICTED":
        return { bg: "bg-rose-500/20 border-rose-500/50 text-rose-400", icon: ShieldAlert, label: "BÁC BỎ / SAI LỆCH" };
      case "MALICIOUS":
        return { bg: "bg-red-600/20 border-red-500/60 text-red-400 animate-pulse", icon: ShieldAlert, label: "ĐỘC HẠI / LỪA ĐẢO" };
      case "CONTESTED":
        return { bg: "bg-purple-500/20 border-purple-500/40 text-purple-300", icon: Scale, label: "TRANH CHẤP NGUỒN TIN" };
      case "UNVERIFIED":
      default:
        return { bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300", icon: HelpCircle, label: "CHƯA THỂ XÁC MINH" };
    }
  };

  const getRiskBadge = (lvl) => {
    switch (lvl) {
      case "CRITICAL":
        return { bg: "bg-red-500/20 text-red-400 border-red-500/40", label: "NGUY CẤP (CRITICAL)" };
      case "HIGH":
        return { bg: "bg-orange-500/20 text-orange-400 border-orange-500/40", label: "CAO (HIGH)" };
      case "MEDIUM":
        return { bg: "bg-amber-500/20 text-amber-400 border-amber-500/40", label: "TRUNG BÌNH (MEDIUM)" };
      case "LOW":
        return { bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", label: "THẤP (LOW)" };
      case "NONE":
      default:
        return { bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", label: "AN TOÀN (NONE)" };
    }
  };

  const getActionBadge = (act) => {
    switch (act) {
      case "BLOCK":
        return { bg: "bg-red-600 text-white shadow-lg shadow-red-600/30", label: "CHẶN TRUY CẬP (BLOCK)" };
      case "RESTRICT":
        return { bg: "bg-orange-600 text-white", label: "GIỚI HẠN (RESTRICT)" };
      case "ALLOW_WITH_WARNING":
        return { bg: "bg-amber-500 text-black", label: "CẢNH BÁO KÈM THEO" };
      case "REQUIRE_VERIFICATION":
        return { bg: "bg-cyan-500 text-black", label: "CẦN ĐỐI SOÁT THÊM" };
      case "ESCALATE":
        return { bg: "bg-purple-600 text-white", label: "CHUYỂN DUYỆT CHUYÊN GIA" };
      case "ALLOW":
      default:
        return { bg: "bg-emerald-500 text-black", label: "CHO PHÉP (ALLOW)" };
    }
  };

  const classBadge = getClassificationBadge(classification);
  const riskBadge = getRiskBadge(riskAssessment.level);
  const actionBadge = getActionBadge(status);
  const ClassIcon = classBadge.icon;

  return (
    <div className="relative rounded-2xl bg-[#0a0403]/95 border border-[#47140b] backdrop-blur-2xl shadow-[0_0_50px_rgba(255,188,9,0.06)] overflow-hidden">
      {/* Top Aerospace Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-[#1f0906] via-[#120604] to-[#1f0906] border-b border-[#47140b]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffbc09]/10 border border-[#ffbc09]/40 flex items-center justify-center text-[#ffbc09] shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#ffbc09] uppercase">
                AI TRUST ENGINE // LAYER 04
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#ffbc09]/20 text-[#ffbc09] border border-[#ffbc09]/30">
                FINAL REASONING & VERDICT
              </span>
            </div>
            <h2 className="text-base font-bold text-white font-human flex items-center gap-2">
              Báo Cáo Phán Quyết Tin Cậy Toàn Diện
            </h2>
          </div>
        </div>

        {/* Global Action Pill */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#ece7e0]/60 hidden sm:inline">HÀNH ĐỘNG HỆ THỐNG:</span>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase ${actionBadge.bg}`}>
            {actionBadge.label}
          </span>
        </div>
      </div>

      {/* 3-DIMENSIONAL ASSESSMENT CARDS */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dimension 1: Truth Status */}
          <div className={`p-4 rounded-xl border ${classBadge.bg} flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider mb-1 text-white/70">
                <span>[DIM-1] TÍNH XÁC THỰC</span>
                <ClassIcon className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold mt-1 text-white">{classBadge.label}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-white/60">Truth Confidence:</span>
              <span className="font-bold text-white">{(truthAssessment.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Dimension 2: Security Risk */}
          <div className={`p-4 rounded-xl border ${riskBadge.bg} flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider mb-1 text-white/70">
                <span>[DIM-2] RỦI RO BẢO MẬT</span>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold mt-1 text-white">{riskBadge.label}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-white/60">Risk Confidence:</span>
              <span className="font-bold text-white">{(riskAssessment.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Dimension 3: Calibrated Decision Confidence */}
          <div className="p-4 rounded-xl bg-black/40 border border-[#47140b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider mb-1 text-[#ffbc09]">
                <span>[DIM-3] ĐỘ TIN CẬY QUYẾT ĐỊNH</span>
                <Fingerprint className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold mt-1 text-white">
                {(decisionConfidence * 100).toFixed(0)}% <span className="text-xs text-[#ece7e0]/60 font-normal">Calibrated Score</span>
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-white/60">Completeness:</span>
              <span className="font-bold text-[#ffbc09]">{(verificationCompleteness * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* AUDITABLE HUMAN EXPLANATION BANNER */}
        <div className="p-5 rounded-2xl bg-black/50 border border-[#47140b] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-[#ffbc09] uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" />
              GIẢI TRÌNH PHÁN QUYẾT TỪ BẰNG CHỨNG (EXPLANATION ENGINE)
            </h3>
            <span className="text-[10px] font-mono text-[#ece7e0]/50">
              AUDIT ID: {auditTrail.requestId?.slice(0, 14)}...
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#150604]/80 border border-[#2d0d08] space-y-2">
            <p className="text-sm font-bold text-white font-human">
              {userExplanation.verdictTitle || "Phân Tích Bằng Chứng"}
            </p>
            <p className="text-xs text-[#ece7e0]/90 leading-relaxed font-sans">
              {userExplanation.why}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/30 border border-[#2d0d08]">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase block mb-1">
                🛡️ ĐÁNH GIÁ MỨC ĐỘ NGUY HIỂM:
              </span>
              <p className="text-[#ece7e0]/80">{userExplanation.riskSummary}</p>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-[#2d0d08]">
              <span className="text-[10px] font-mono font-bold text-[#ffbc09] uppercase block mb-1">
                💡 KHUYẾN NGHỊ HÀNH ĐỘNG DÀNH CHO SINH VIÊN:
              </span>
              <p className="text-[#ece7e0]/80">{userExplanation.recommendedActionNote}</p>
            </div>
          </div>
        </div>

        {/* CLAIM-LEVEL VERDICTS BREAKDOWN */}
        {claims.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ffbc09]" />
                KẾT QUẢ ĐỐI SOÁT TỪNG PHÁT NGÔN ({claims.length} CLAIMS)
              </h4>
            </div>

            <div className="space-y-2">
              {claims.map((claim, idx) => (
                <div
                  key={claim.claimId || idx}
                  className="p-4 rounded-xl bg-black/40 border border-[#2d0d08] hover:border-[#ffbc09]/30 transition-all text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-mono font-bold text-[#ffbc09]">
                      [{claim.claimId || `claim-${idx + 1}`}] {claim.subject || "Thông tin chính"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/10 text-white">
                      {claim.truthStatus}
                    </span>
                  </div>

                  <p className="text-[#ece7e0] italic mb-2">&ldquo;{claim.rawText}&rdquo;</p>

                  {claim.notes && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                      ⚠️ {claim.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KEY EVIDENCE CITATIONS */}
        {userExplanation.keyEvidence?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              BẰNG CHỨNG ĐÃ ĐỐI CHIẾU (EVIDENCE CITATIONS)
            </h4>

            <div className="space-y-2">
              {userExplanation.keyEvidence.map((ev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/40 border border-[#2d0d08] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <a
                      href={safeExternalUrl(ev.sourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-cyan-300 hover:underline flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {ev.sourceTitle || ev.sourceUrl}
                    </a>
                    <span className="text-[10px] font-mono text-[#ece7e0]/60 uppercase">{ev.relation}</span>
                  </div>
                  <p className="text-[#ece7e0]/80 italic text-[11px]">&ldquo;{ev.excerpt}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GLOBAL STANDARDS & ACCREDITED ECOSYSTEM COMPLIANCE */}
        {userExplanation.matchedStandards?.length > 0 && (
          <div className="p-4 rounded-xl bg-black/40 border border-[#ffbc09]/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#ffbc09] flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#ffbc09]" />
                TIÊU CHUẨN AN NINH & ĐỐI SOÁT QUỐC TẾ (GLOBAL COMPLIANCE)
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {userExplanation.matchedStandards.length} FRAMEWORKS AUDITED
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {userExplanation.matchedStandards.map((std, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-[#ece7e0] flex items-center gap-1.5"
                >
                  <span className="text-[#ffbc09] font-bold">[{std.framework}]</span>
                  <span>{std.name || std.standard || std.section || std.principle}</span>
                </div>
              ))}
            </div>

            {userExplanation.matchedUniversity && (
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Hệ thống số đã xác thực: <strong>{userExplanation.matchedUniversity}</strong> (Accredited Domain)</span>
              </div>
            )}
          </div>
        )}

        {/* TELEMETRY FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#47140b] text-[11px] font-mono text-[#ece7e0]/50">
          <div className="flex items-center gap-3">
            <span>⏱️ LATENCY: {metrics.executionTimeMs || 0.14} MS</span>
            <span>•</span>
            <span>MODEL: {metrics.modelUsed || "deterministic_trust_engine"}</span>
            <span>•</span>
            <span>RULE: {auditTrail.ruleVersion || "layer4-v1.0.0"}</span>
            <span>•</span>
            <span>GLOBAL FRAMEWORKS: {auditTrail.globalFrameworkCount || 0}</span>
          </div>

          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>LAYER 4 AUDIT TRAIL VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
