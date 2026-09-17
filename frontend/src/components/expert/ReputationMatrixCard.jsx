"use client";

import React from "react";
import { CheckCircle2, FileCheck, Info, Shield, ShieldCheck, Star } from "lucide-react";

/**
 * ReputationMatrixCard — Explainability surface for Expert Reputation signals.
 *
 * Uses public/media/v3/expert/reputation.webp.
 *
 * CRITICAL SAFETY RULES:
 * - Never calculate a new client-side reputation score.
 * - Only display actual returned metrics or truthful unpopulated state.
 * - Explicitly state: Reputation reflects evidence quality, NOT authority to censor.
 */
export default function ReputationMatrixCard({
  reputationData = null,
}) {
  const reviewsCount = reputationData?.reviewsCompleted ?? reputationData?.assessmentCount ?? null;
  const citationRate = reputationData?.primaryCitationAccuracy ?? null;
  const peerAgreement = reputationData?.peerAgreementRate ?? null;
  const activeDomains = reputationData?.verifiedDomains ?? [];

  return (
    <article className="optical-reticle-box p-5 border border-emerald-500/20 bg-[#121720] rounded-lg">
      <div className="crosshair-corner crosshair-tl" />
      <div className="crosshair-corner crosshair-tr" />
      <div className="crosshair-corner crosshair-bl" />
      <div className="crosshair-corner crosshair-br" />

      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
            <ShieldCheck size={16} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Chỉ số Đóng góp & Uy tín Chuyên môn
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              DỰA TRÊN CHẤT LƯỢNG BẰNG CHỨNG SƠ CẤP
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          REPUTATION SIGNALS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center mb-4">
        <div className="md:col-span-4 rounded-md overflow-hidden border border-white/10 aspect-video bg-black/40">
          <img
            src="/media/v3/expert/reputation.webp"
            alt="Minh họa cách đọc chỉ số uy tín chuyên môn"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded bg-[#0C0F14] border border-white/5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Ca giám định đã thực hiện</span>
            <strong className="text-sm font-semibold text-slate-100 mt-1 block">
              {reviewsCount != null ? reviewsCount : "Chưa có dữ liệu"}
            </strong>
          </div>

          <div className="p-2.5 rounded bg-[#0C0F14] border border-white/5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Dẫn chứng hợp lệ</span>
            <strong className="text-sm font-semibold text-slate-100 mt-1 block">
              {citationRate != null ? `${citationRate}%` : "Chưa công bố"}
            </strong>
          </div>

          <div className="p-2.5 rounded bg-[#0C0F14] border border-white/5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Độ tương đồng bình duyệt</span>
            <strong className="text-sm font-semibold text-slate-100 mt-1 block">
              {peerAgreement != null ? `${peerAgreement}%` : "Chưa công bố"}
            </strong>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
        <Info size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Nguyên tắc hệ thống:</strong> Điểm uy tín phản ánh sự chuẩn xác của trích dẫn văn bản quy chế và lịch sử đóng góp khách quan. Uy tín cao không trao quyền kiểm duyệt bài viết hay tự động quyết định chân lý.
        </p>
      </div>
    </article>
  );
}
