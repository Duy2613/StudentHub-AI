"use client";

import React from "react";
import { AlertCircle, CheckCircle2, FileQuestion, HelpCircle, Shield, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";

/**
 * TrustVsExpertComparisonMatrix — Dedicated Dialectic Comparison State.
 *
 * LEFT: MAIN TRUST (Deterministic Engine V5)
 * RIGHT: EXPERT ASSESSMENT (Academic Council Reviewer)
 *
 * CRITICAL SAFETY RULES:
 * - Never average the two perspectives.
 * - Never generate a combined truth score or synthetic composite confidence.
 * - If no formal expert assessment exists in the real data, display truthful unavailable state.
 */
export default function TrustVsExpertComparisonMatrix({
  trustResult = null,
  expertAssessment = null,
}) {
  const truthVerdict = trustResult?.verdict || trustResult?.truthStatus || "CHƯA CÓ KẾT LUẬN";
  const sufficiency = trustResult?.evidenceSufficiency || trustResult?.metrics?.evidenceCoverage || "Chưa xác định";
  const risk = trustResult?.riskLevel || trustResult?.risk || "Chưa xác định";
  const action = trustResult?.nextAction || trustResult?.recommendedAction || "Chờ đối chiếu thêm";

  return (
    <section className="trust-dialectic-matrix my-8" aria-labelledby="dialectic-matrix-title">
      <div className="trust-dialectic-header">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-cyan-500/10 text-cyan-400">
              <Shield size={16} />
            </span>
            <h3 id="dialectic-matrix-title" className="font-serif text-lg text-slate-100 font-normal">
              Đối chiếu song song: Hệ thống Tất định vs Giám định Chuyên gia
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold tracking-wider">
            KHÔNG GỘP ĐIỂM · ĐỐI CHIẾU ĐỘC LẬP
          </span>
        </div>
        <p className="trust-dialectic-notice">
          Cảnh báo phương pháp: Hệ thống không tự động tính điểm trung bình. Hai kết quả thể hiện hai góc nhìn độc lập giữa thuật toán đối soát chứng cứ và hội đồng học thuật con người.
        </p>
      </div>

      {/* LEFT COLUMN: MAIN TRUST */}
      <div className="trust-dialectic-col is-trust">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-cyan-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300">
              KẾT QUẢ TỰ ĐỘNG (MAIN TRUST V5)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            DETERMINISTIC
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-slate-400 font-mono text-[11px] block">Kết luận tất định:</span>
            <strong className="text-sm font-medium text-slate-100 mt-0.5 block">
              {truthVerdict}
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded bg-[#0C0F14] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Mức đủ bằng chứng</span>
              <strong className="text-slate-200 mt-0.5 block">{String(sufficiency)}</strong>
            </div>
            <div className="p-2 rounded bg-[#0C0F14] border border-white/5">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Mức độ rủi ro</span>
              <strong className="text-slate-200 mt-0.5 block">{String(risk)}</strong>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-mono text-[11px] block">Khuyến nghị hành động:</span>
            <p className="text-slate-300 mt-0.5 leading-relaxed">{action}</p>
          </div>

          <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400">
            <span className="font-mono">Cơ sở: </span>
            {trustResult?.sources?.length
              ? `Đối soát qua ${trustResult.sources.length} nguồn tài liệu độc lập.`
              : "Dữ liệu đối chiếu theo bộ quy tắc tất định V5."}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: EXPERT ASSESSMENT */}
      <div className="trust-dialectic-col is-expert">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-emerald-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-300">
              ĐÁNH GIÁ CỦA CHUYÊN GIA (EXPERT COUNCIL)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            HUMAN AUTHORITY
          </span>
        </div>

        {expertAssessment ? (
          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 font-mono text-[11px] block">Kết luận chuyên môn:</span>
              <strong className="text-sm font-medium text-slate-100 mt-0.5 block">
                {expertAssessment.verdict || expertAssessment.finding || "Đang xem xét"}
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded bg-[#0C0F14] border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Phân ngành xác thực</span>
                <strong className="text-slate-200 mt-0.5 block truncate">
                  {expertAssessment.domain || expertAssessment.jurisdiction || "Đúng thẩm quyền"}
                </strong>
              </div>
              <div className="p-2 rounded bg-[#0C0F14] border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Mức độ tự tin</span>
                <strong className="text-slate-200 mt-0.5 block">
                  {expertAssessment.confidence || "Trung bình"}
                </strong>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-mono text-[11px] block">Chuyên gia giám định:</span>
              <p className="text-slate-200 font-medium mt-0.5">
                {expertAssessment.expertName || "Chuyên gia Hội đồng"}
                {expertAssessment.institution ? ` · ${expertAssessment.institution}` : ""}
              </p>
            </div>

            {expertAssessment.limitations && (
              <div className="p-2 rounded bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-[11px]">
                <strong className="font-mono uppercase text-[10px] block text-amber-300">Giới hạn & điều kiện ngoại trừ:</strong>
                {expertAssessment.limitations}
              </div>
            )}
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-slate-400">
            <FileQuestion size={24} className="text-slate-500 mb-2" />
            <strong className="text-xs text-slate-300">Chưa có đánh giá chuyên môn chính thức</strong>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Ca này chưa được chuyển giao hoặc đang chờ chuyên gia thẩm định theo phân ngành phù hợp.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
