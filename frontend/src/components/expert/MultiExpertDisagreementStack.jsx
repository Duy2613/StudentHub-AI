"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, FileQuestion, HelpCircle, Scale, ShieldAlert, UserCheck } from "lucide-react";

/**
 * MultiExpertDisagreementStack — Transparent Dialectic Multi-Expert Disagreement.
 *
 * CRITICAL SAFETY RULES:
 * - When two vetted scholars reach divergent conclusions, never average them or fabricate consensus.
 * - Stack both assessments side-by-side so students and observers can read competing evidence interpretations.
 */
export default function MultiExpertDisagreementStack({
  assessments = [],
  claim = "",
}) {
  if (!Array.isArray(assessments) || assessments.length < 2) {
    return null;
  }

  return (
    <section className="expert-disagreement-stack my-6" aria-labelledby="expert-disagreement-title">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <span className="p-1 rounded bg-amber-500/10 text-amber-400">
          <Scale size={16} />
        </span>
        <div>
          <h3 id="expert-disagreement-title" className="font-serif text-base text-slate-100 font-normal">
            Bất đồng Chuyên môn Đa chiều (Multi-Expert Disagreement)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hội đồng ghi nhận các quan điểm độc lập có bằng chứng khác biệt. Không tính điểm trung bình; người đọc tự đối chiếu lập luận gốc.
          </p>
        </div>
      </div>

      {claim && (
        <div className="my-3 p-2.5 rounded bg-[#0C0F14] border border-white/5 text-xs text-slate-300">
          <span className="text-[10px] font-mono text-slate-500 block mb-0.5">MỆNH ĐỀ TRANH LUẬN:</span>
          <p className="italic">"{claim}"</p>
        </div>
      )}

      <div className="expert-disagreement-grid">
        {assessments.slice(0, 2).map((item, index) => {
          const isAffirm = item.verdict === "AFFIRMED" || String(item.verdictLabel || "").includes("CĂN CỨ");
          return (
            <article key={item.expertId || index} className="expert-disagreement-item">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-semibold text-slate-300">
                    {index + 1}
                  </div>
                  <div>
                    <strong className="text-xs text-slate-200 block">{item.expertName || `Chuyên gia ${index + 1}`}</strong>
                    <span className="text-[10px] text-slate-400 font-mono block">{item.institution || "Hội đồng Học thuật"}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isAffirm
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {item.verdictLabel || item.verdict || "Chưa kết luận"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Lập luận chính:</span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px]">
                    {item.rationale || item.summary || item.finding || "Xem chi tiết hồ sơ đối soát."}
                  </p>
                </div>

                {item.limitations && (
                  <div className="p-2 rounded bg-amber-500/5 border border-amber-500/15 text-[10px] text-amber-200/90 leading-relaxed">
                    <strong className="block text-amber-300 font-mono">Giới hạn:</strong>
                    {item.limitations}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
