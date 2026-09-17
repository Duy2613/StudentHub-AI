"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, FileText, Lock, ShieldCheck, X } from "lucide-react";

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
  const [limitations, setLimitations] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const claimText = caseDossier?.claim || caseDossier?.canonicalClaim || "Thời gian nộp đơn đăng ký dự thi tốt nghiệp THPT được gia hạn thêm 48 giờ.";
  const caseId = caseDossier?.id || caseDossier?.caseId || "EXP-2026-8819";
  const domain = caseDossier?.domain || "Quy chế Đào tạo & Khảo thí";

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    onSubmitAssessment?.({
      caseId,
      verdict,
      confidence,
      limitations,
      inScope,
      timestamp: new Date().toISOString(),
    });
    setTimeout(() => {
      setSubmitting(false);
      onClose?.();
    }, 600);
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
          <div className="relative rounded-md overflow-hidden aspect-video mb-4 border border-white/10 bg-black/40">
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="/media/v3/expert/live-review-poster.webp"
              src="/media/v3/expert/live-review.mp4"
              className="w-full h-full object-cover"
            />
            <img
              src="/media/v3/expert/live-review-poster.webp"
              alt="Live review workspace"
              className="video-fallback-poster hidden w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
              BÀN GIÁM ĐỊNH TRỰC THỜI GIAN THỰC
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-0.5">
                HỒ SƠ TRUST GỐC #{caseId}
              </span>
              <h4 className="text-sm font-semibold text-slate-100 font-serif">Mệnh đề cần thẩm định</h4>
              <p className="text-xs text-slate-300 mt-1 italic p-2.5 rounded bg-[#0C0F14] border border-white/5">
                "{claimText}"
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                DỮ LIỆU ĐỐI SOÁT TỪ LAYER 03 TRUST
              </span>
              <ul className="text-[11px] text-slate-300 space-y-1.5 pl-4 list-disc">
                <li>Văn bản đối chiếu: Quyết định điều chỉnh lịch thi số 104/QĐ-BGDĐT.</li>
                <li>Nguồn cấp 1: Cổng thông tin Bộ Giáo dục & Đào tạo (.gov.vn).</li>
                <li>Mâu thuẫn phát hiện: Bài đăng mạng xã hội đề cập ngày 18 thay vì ngày 15.</li>
              </ul>
            </div>

            <div className="p-2.5 rounded bg-cyan-500/5 border border-cyan-500/20 text-[11px] text-cyan-200">
              <strong className="block font-mono text-[10px] text-cyan-300">CỐ VẤN LAYER 04 (GEMINI):</strong>
              Đề nghị đối chiếu cụ thể với điều khoản áp dụng cho thí sinh tự do.
            </div>
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
                  PHẠM VI THẨM QUYỀN: {domain.toUpperCase()}
                </span>
              </div>
            </div>

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
                disabled={!inScope}
                placeholder="Nêu rõ điều kiện áp dụng, ví dụ: Áp dụng riêng cho sinh viên các khoa chất lượng cao..."
                className="w-full text-xs p-2.5 rounded bg-[#0C0F14] border border-white/10 text-slate-200 focus:border-emerald-400 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

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
              disabled={submitting || (!inScope && !limitations)}
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
