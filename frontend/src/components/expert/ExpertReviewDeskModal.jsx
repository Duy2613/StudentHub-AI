"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ShieldCheck, X } from "lucide-react";

/**
 * ExpertReviewDeskModal — Active Review Workbench.
 *
 * Uses public/media/v3/expert/live-review.mp4 with poster fallback.
 * Accessible dialog with Esc handler and focus boundary.
 */
export default function ExpertReviewDeskModal({
  isOpen = false,
  onClose,
  caseDossier = null,
  onSubmitAssessment,
}) {
  const [inScope, setInScope] = useState(true);
  const [verdict, setVerdict] = useState("AFFIRMED");
  const [confidence, setConfidence] = useState("HIGH");
  const [assessment, setAssessment] = useState("");
  const [limitations, setLimitations] = useState("");
  const [coiDeclared, setCoiDeclared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const claimText = caseDossier?.claim || caseDossier?.canonicalClaim || "";
  const caseId = caseDossier?.id || caseDossier?.caseId || "";
  const domain = caseDossier?.domain || caseDossier?.domainCode || "";
  const hasBoundAssignment = Boolean(caseDossier && caseId && claimText && caseDossier.assignmentId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const cleanAssessment = assessment.trim();
    const cleanLimitations = limitations.trim();
    if (!hasBoundAssignment) {
      setSubmitError("Chưa có assignment Trust được server bind; không thể tạo đánh giá giả.");
      return;
    }
    if (cleanAssessment.length < 20) {
      setSubmitError("Nhận định chuyên môn phải có ít nhất 20 ký tự.");
      return;
    }
    if (cleanAssessment.length > 20_000 || cleanLimitations.length > 20_000) {
      setSubmitError("Nội dung đánh giá vượt quá giới hạn lưu trữ.");
      return;
    }
    setSubmitting(true);
    try {
      if (typeof onSubmitAssessment !== "function") {
        throw new Error("Kênh lưu assessment chưa được cấu hình.");
      }
      await onSubmitAssessment({
        caseId,
        assignmentId: caseDossier.assignmentId,
        caseRevision: caseDossier.caseRevision,
        claimId: caseDossier.claimId || null,
        domainCode: caseDossier.domainCode || domain,
        evidenceRevisionIds: caseDossier.evidenceRevisionIds || [],
        assessment: { analysis: cleanAssessment, claimReviewed: claimText, limitations: cleanLimitations },
        reasoning: cleanAssessment,
        confidence: { LOW: 0.3, MEDIUM: 0.6, HIGH: 0.9 }[confidence],
        limitations: cleanLimitations,
        conclusionWithinScope: inScope ? verdict : "OUT_OF_SCOPE",
        coiDeclared,
        inScope,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error?.message || "Không thể lưu đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-desk-title"
    >
      <div className="expert-review-desk-modal relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Đóng bàn giám định"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: TRUST DOSSIER */}
        <div className="expert-review-desk-dossier">
          {/* Institutional Audit Environment — Zero-video policy: /media/v3/expert/live-review.mp4 disabled */}
          <div className="video-fallback-poster rounded-md p-3 mb-4 border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-300">
                  BÀN GIÁM ĐỊNH CHUYÊN MÔN CHÍNH THỨC
                </div>
                <div className="text-[11px] text-slate-400">
                  Môi trường giám định độc lập · Server-owned authority
                </div>
              </div>
            </div>
            <span
              className="text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0"
              data-poster="/media/v3/expert/live-review-poster.webp"
              data-media="/media/v3/expert/live-review.mp4"
            >
              LIVE AUDIT SESSION
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-0.5">
                {caseId ? `HỒ SƠ TRUST GỐC #${caseId}` : "CHƯA CÓ HỒ SƠ TRUST ĐƯỢC GÁN"}
              </span>
              <h4 className="text-sm font-semibold text-slate-100 font-serif">Mệnh đề cần thẩm định</h4>
              {claimText ? (
                <p className="text-xs text-slate-300 mt-1 italic p-2.5 rounded bg-[#0C0F14] border border-white/5">
                  “{claimText}”
                </p>
              ) : (
                <p className="text-xs text-amber-200 mt-1 p-2.5 rounded bg-amber-500/10 border border-amber-500/20" role="status">
                  Chưa có assignment thực tế. Không hiển thị mệnh đề mẫu.
                </p>
              )}
            </div>

            {Array.isArray(caseDossier?.evidence) && caseDossier.evidence.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  DỮ LIỆU ĐỐI SOÁT TỪ LAYER 03 TRUST
                </span>
                <ul className="text-[11px] text-slate-300 space-y-1.5 pl-4 list-disc">
                  {caseDossier.evidence.map((item, index) => (
                    <li key={`${item?.id || "evidence"}-${index}`}>
                      {item?.label || item?.title || item?.summary || String(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {caseDossier?.layer4Summary && (
              <div className="p-2.5 rounded bg-cyan-500/5 border border-cyan-500/20 text-[11px] text-cyan-200">
                <strong className="block font-mono text-[10px] text-cyan-300">CỐ VẤN LAYER 04 (GEMINI):</strong>
                {caseDossier.layer4Summary}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ASSESSMENT FORM */}
        <form onSubmit={handleSubmit} className="expert-review-desk-form flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
              <ShieldCheck size={18} className="text-emerald-400" />
              <div>
                <h3 id="review-desk-title" className="text-sm font-semibold text-slate-100">
                  Biểu Mẫu Giám Định Chuyên Môn
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  PHẠM VI THẨM QUYỀN: {domain ? domain.toUpperCase() : "CHƯA XÁC ĐỊNH"}
                </span>
              </div>
            </div>

            {!hasBoundAssignment && (
              <div className="mb-4 flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100" role="alert">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>Review Desk chỉ mở biểu mẫu khi có assignment, case revision và mệnh đề do server bind.</span>
              </div>
            )}

            {/* JURISDICTION CONFIRMATION */}
            <div className="mb-4">
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Xác nhận thẩm quyền chuyên môn:
              </label>
              <div className="flex gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={inScope}
                    onChange={() => setInScope(true)}
                  />
                  <span>Đúng thẩm quyền chuyên ngành</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={!inScope}
                    onChange={() => setInScope(false)}
                  />
                  <span>Ngoài phạm vi thẩm quyền</span>
                </label>
              </div>
            </div>

            {/* VERDICT SELECTOR */}
            <div className="mb-4">
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Kết luận chuyên môn chính thức:
              </label>
              <select
                value={verdict}
                onChange={(e) => setVerdict(e.target.value)}
                disabled={!inScope}
                className="w-full text-xs p-2 rounded bg-[#0C0F14] border border-white/10 text-slate-200 focus:border-emerald-400 outline-none"
              >
                <option value="AFFIRMED">Xác nhận có căn cứ pháp lý / quy chế (AFFIRMED)</option>
                <option value="REFUTED">Bác bỏ có dẫn chứng quy định (REFUTED)</option>
                <option value="INCONCLUSIVE">Chưa đủ căn cứ theo tài liệu hiện hành (INCONCLUSIVE)</option>
              </select>
            </div>

            {/* CONFIDENCE */}
            <div className="mb-4">
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Mức độ tự tin của Chuyên gia:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["LOW", "MEDIUM", "HIGH"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    disabled={!inScope}
                    onClick={() => setConfidence(level)}
                    className={`py-1.5 px-2 rounded text-xs font-mono font-medium border transition-all ${
                      confidence === level
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                        : "bg-[#0C0F14] border-white/10 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {level === "LOW" ? "Thấp" : level === "MEDIUM" ? "Trung bình" : "Cao"}
                  </button>
                ))}
              </div>
            </div>

            {/* FORMAL ASSESSMENT */}
            <div className="mb-4">
              <label htmlFor="formal-expert-assessment" className="text-xs text-slate-300 font-medium block mb-1.5">
                Nhận định chuyên môn chính thức <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="formal-expert-assessment"
                value={assessment}
                onChange={(e) => { setAssessment(e.target.value); setSubmitError(""); }}
                rows={6}
                required
                minLength={20}
                maxLength={20_000}
                disabled={!hasBoundAssignment || submitting || submitted}
                placeholder="Nêu kết luận độc lập, căn cứ trong phạm vi domain và mức độ bất định..."
                aria-describedby="formal-expert-assessment-help"
                className="w-full text-xs p-2.5 rounded bg-[#0C0F14] border border-white/10 text-slate-200 focus:border-emerald-400 outline-none resize-y leading-relaxed"
              />
              <p id="formal-expert-assessment-help" className="mt-1 text-[10px] text-slate-500">
                {assessment.length}/20.000 ký tự · Nội dung được lưu như assessment độc lập, không sửa Trust L1–L5.
              </p>
            </div>

            {/* LIMITATIONS & CONDITIONS */}
            <div className="mb-4">
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Giới hạn và điều kiện ngoại trừ (Bắt buộc):
              </label>
              <textarea
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                rows={3}
                required
                maxLength={20_000}
                disabled={!hasBoundAssignment || !inScope || submitting || submitted}
                placeholder="Nêu rõ điều kiện áp dụng, ví dụ: Áp dụng riêng cho sinh viên các khoa chất lượng cao..."
                className="w-full text-xs p-2.5 rounded bg-[#0C0F14] border border-white/10 text-slate-200 focus:border-emerald-400 outline-none resize-none leading-relaxed"
              />
            </div>

            <label className="mb-4 flex items-start gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={coiDeclared}
                onChange={(e) => setCoiDeclared(e.target.checked)}
                disabled={!hasBoundAssignment || submitting || submitted}
                required
                className="mt-0.5"
              />
              <span>Tôi xác nhận không có xung đột lợi ích với case này.</span>
            </label>
          </div>

          {submitError && <p className="mb-3 flex items-start gap-2 text-xs text-rose-200" role="alert"><AlertCircle size={15} className="mt-0.5 shrink-0" />{submitError}</p>}
          {submitted && <p className="mb-3 flex items-start gap-2 text-xs text-emerald-200" role="status"><CheckCircle2 size={15} className="mt-0.5 shrink-0" />Đánh giá đã được gửi qua kênh server và không thay đổi phán quyết Trust.</p>}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 font-mono"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!hasBoundAssignment || submitting || submitted || !assessment.trim() || !limitations.trim() || !coiDeclared}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              {submitting ? "Đang lưu..." : "Ký & Ban hành Giám định"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
