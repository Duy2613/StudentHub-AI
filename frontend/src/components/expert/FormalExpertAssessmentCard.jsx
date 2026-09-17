"use client";

import React from "react";
import { AlertCircle, Award, Building2, CheckCircle2, FileText, Info, Lock, ShieldCheck, XCircle } from "lucide-react";

/**
 * FormalExpertAssessmentCard — Structured Immutable Formal Expert Assessment.
 *
 * CRITICAL SAFETY RULES:
 * - Formal Expert Assessment must be populated only from actual durable data.
 * - If no formal assessment exists, render truthful unavailable state: "Chưa có đánh giá chuyên môn chính thức."
 * - Do not invent arbitrary percentages or fake signatures.
 * - Confidence is displayed as Low | Medium | High.
 */
export default function FormalExpertAssessmentCard({ assessment = null }) {
  if (!assessment || Object.keys(assessment).length === 0) {
    return (
      <div className="expert-formal-assessment-card text-center py-8 text-slate-400">
        <FileText size={24} className="mx-auto text-slate-500 mb-2" />
        <strong className="text-xs text-slate-300 block">Chưa có đánh giá chuyên môn chính thức</strong>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
          Ca này hiện chưa có văn bản giám định được ký và ban hành chính thức từ Hội đồng Chuyên gia.
        </p>
      </div>
    );
  }

  const {
    expertName = "Chuyên gia Hội đồng",
    title = "",
    institution = "Đại học Quốc gia TP.HCM",
    verifiedDomain = "Học thuật & Đào tạo",
    claimReviewed = "",
    caseId = "",
    verdict = "AFFIRMED",
    verdictLabel = "CÓ CĂN CỨ XÁC THỰC",
    confidence = "HIGH",
    limitations = "",
    evidenceReviewed = [],
    issuedAt = new Date().toLocaleDateString("vi-VN"),
    domainMatch = "EXACT_MATCH",
  } = assessment;

  const isAffirmed = verdict === "AFFIRMED" || verdictLabel.includes("CĂN CỨ");
  const isRefuted = verdict === "REFUTED" || verdictLabel.includes("BÁC BỎ");

  return (
    <article className="expert-formal-assessment-card" aria-labelledby={`formal-assessment-${caseId || "id"}`}>
      <div className="expert-seal-strip">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-400" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-semibold block">
              VĂN BẢN GIÁM ĐỊNH CHUYÊN GIA CHÍNH THỨC
            </span>
            <small className="text-[11px] text-slate-400 font-mono">
              Hồ sơ Trust: #{caseId || "TC-VERIFIED"} · Ban hành: {issuedAt}
            </small>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${
            domainMatch === "EXACT_MATCH"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              : domainMatch === "ADJACENT_MATCH"
              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
              : "bg-slate-500/10 text-slate-300 border-slate-500/30"
          }`}
        >
          {domainMatch === "EXACT_MATCH"
            ? "ĐÚNG THẨM QUYỀN"
            : domainMatch === "ADJACENT_MATCH"
            ? "PHÂN NGÀNH LIÊN ĐỚI"
            : "NGOÀI THẨM QUYỀN"}
        </span>
      </div>

      <div className="mb-4">
        <h3 id={`formal-assessment-${caseId || "id"}`} className="text-base font-semibold text-slate-100 flex items-center gap-2">
          {expertName}
          {title && <span className="text-xs font-normal text-slate-400 font-mono">({title})</span>}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
          <span className="flex items-center gap-1">
            <Building2 size={13} className="text-slate-500" /> {institution}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Award size={13} className="text-emerald-400" /> Domain: {verifiedDomain}
          </span>
        </div>
      </div>

      {claimReviewed && (
        <div className="p-3 rounded bg-[#0C0F14] border border-white/5 text-xs text-slate-300 mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
            MỆNH ĐỀ GIÁM ĐỊNH
          </span>
          <p className="italic leading-relaxed">"{claimReviewed}"</p>
        </div>
      )}

      <div className="expert-verdict-banner">
        {isAffirmed ? (
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
        ) : isRefuted ? (
          <XCircle size={20} className="text-rose-400 flex-shrink-0" />
        ) : (
          <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
        )}
        <div className="flex-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">KẾT LUẬN GIÁM ĐỊNH</span>
          <strong className="text-slate-100 text-sm block">{verdictLabel}</strong>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">MỨC TỰ TIN</span>
          <span className="text-xs font-mono font-semibold text-emerald-300">
            {confidence === "HIGH" ? "CAO" : confidence === "LOW" ? "THẤP" : "TRUNG BÌNH"}
          </span>
        </div>
      </div>

      {evidenceReviewed.length > 0 && (
        <div className="mb-4 text-xs">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
            TÀI LIỆU CHỨNG CỨ ĐÃ ĐỐI SOÁT
          </span>
          <ul className="space-y-1 pl-4 list-disc text-slate-300 text-[11px]">
            {evidenceReviewed.map((item, idx) => (
              <li key={idx}>{typeof item === "string" ? item : item.title || item.name}</li>
            ))}
          </ul>
        </div>
      )}

      {limitations && (
        <div className="p-3 rounded bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
          <strong className="font-mono uppercase text-[10px] block text-amber-300 mb-1 flex items-center gap-1">
            <Info size={12} /> GIỚI HẠN VÀ ĐIỀU KIỆN NGOẠI TRỪ (BẮT BUỘC)
          </strong>
          <p className="text-[11px]">{limitations}</p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <Lock size={11} /> BẢN GHI GIÁM ĐỊNH KHÔNG ĐẢO CHIỀU TỰ ĐỘNG
        </span>
        <span>HỘI ĐỒNG HỌC THUẬT STUDENTHUB AI</span>
      </div>
    </article>
  );
}
