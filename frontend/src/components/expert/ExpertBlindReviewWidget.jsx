"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Plus,
  Trash2,
  Lock,
  Save,
  Send,
  Sparkles,
  Award,
  AlertTriangle
} from "lucide-react";

export default function ExpertBlindReviewWidget({
  userRole = "student",
  apiBase = "",
  onSubmitted = null,
}) {
  const [reviews, setReviews] = useState([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form states for active review
  const [vote, setVote] = useState("");
  const [confidence, setConfidence] = useState(75);
  const [reasoning, setReasoning] = useState("");
  const [evidenceList, setEvidenceList] = useState([
    { url: "", sourceType: "PRIMARY", note: "" },
  ]);

  const activeReview = reviews[activeReviewIndex] || null;

  // 1. Fetch pending reviews for this expert
  const fetchReviews = useCallback(async () => {
    if (userRole !== "expert") {
      setReviews([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/expert/blind-reviews`, {
        credentials: "include",
      });
      if (!res.ok) {
        setReviews([]);
        return;
      }
      const data = await res.json();
      if (data?.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch {
      // Ephemeral network fallback
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, userRole]);

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 30_000); // 30s background poll
    return () => clearInterval(interval);
  }, [fetchReviews]);

  // When active review changes, populate draft if present
  useEffect(() => {
    if (!activeReview) return;
    setVote(activeReview.ownDraft?.vote || "");
    setConfidence(activeReview.ownDraft?.confidence ? Math.round(activeReview.ownDraft.confidence * 100) : 75);
    setReasoning(activeReview.ownDraft?.reasoning || "");
    if (Array.isArray(activeReview.ownDraft?.evidence) && activeReview.ownDraft.evidence.length > 0) {
      setEvidenceList(activeReview.ownDraft.evidence);
    } else {
      setEvidenceList([{ url: "", sourceType: "PRIMARY", note: "" }]);
    }
    setFeedback(null);
  }, [activeReview]);

  // Do not render anything for normal non-expert users, or if no pending reviews
  if (userRole !== "expert" || reviews.length === 0) {
    return null;
  }

  const handleAddEvidence = () => {
    if (evidenceList.length >= 5) return;
    setEvidenceList((prev) => [...prev, { url: "", sourceType: "PRIMARY", note: "" }]);
  };

  const handleRemoveEvidence = (index) => {
    if (evidenceList.length <= 1) return;
    setEvidenceList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEvidence = (index, field, value) => {
    setEvidenceList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveDraft = async () => {
    if (!activeReview) return;
    setSavingDraft(true);
    setFeedback(null);
    try {
      const res = await fetch(`${apiBase}/api/expert/blind-reviews/${activeReview.assignmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "draft",
          vote,
          confidence: confidence / 100,
          reasoning,
          evidence: evidenceList.filter((e) => e.url.trim()),
        }),
      });
      if (res.ok) {
        setFeedback({ type: "success", text: "Đã lưu bản nháp an toàn." });
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback({ type: "error", text: err?.error?.message || "Không thể lưu nháp." });
      }
    } catch {
      setFeedback({ type: "error", text: "Lỗi kết nối khi lưu nháp." });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    if (!vote) {
      setFeedback({ type: "error", text: "Vui lòng chọn nhận định chuyên môn." });
      return;
    }
    if (reasoning.trim().length < 10) {
      setFeedback({ type: "error", text: "Phân tích lập luận cần có ít nhất 10 ký tự." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`${apiBase}/api/expert/blind-reviews/${activeReview.assignmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "submit",
          vote,
          confidence: confidence / 100,
          reasoning: reasoning.trim(),
          evidence: evidenceList.filter((e) => e.url.trim()),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setFeedback({
          type: "success",
          text: data.message || "Đánh giá của bạn đã được khóa an toàn (LOCKED).",
          locked: true,
        });
        onSubmitted?.(data);
        // Refresh pending list after 2s
        setTimeout(fetchReviews, 2000);
      } else {
        setFeedback({ type: "error", text: data?.error?.message || "Không thể gửi đánh giá." });
      }
    } catch {
      setFeedback({ type: "error", text: "Lỗi mạng khi gửi đánh giá." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside
      className="expert-blind-widget-container fixed bottom-5 right-5 z-[9999] font-sans text-slate-100 transition-all duration-300 max-w-[calc(100vw-2.5rem)]"
      aria-label="Blind Parallel Expert Review Desk"
    >
      {/* COLLAPSED PILL */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="expert-blind-pill flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950/95 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold shadow-2xl backdrop-blur-md hover:bg-slate-900 hover:border-amber-400 cursor-pointer transition-all hover:scale-105 active:scale-95"
          aria-expanded="false"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="tracking-wide">
            🔎 {reviews.length} Blind Review{reviews.length > 1 ? "s" : ""}
          </span>
          <ChevronUp size={14} className="text-amber-400" />
        </button>
      ) : (
        /* EXPANDED DESK */
        <div
          className="expert-blind-expanded w-[380px] sm:w-[420px] max-h-[85vh] flex flex-col rounded-2xl bg-slate-950/95 border border-amber-500/30 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          role="region"
          aria-label="Đánh giá độc lập chuyên môn"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-300">
                ĐÁNH GIÁ ĐỘC LẬP
              </span>
            </div>
            <div className="flex items-center gap-2">
              {reviews.length > 1 && (
                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300">
                  <span>{activeReviewIndex + 1}/{reviews.length}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                title="Thu nhỏ"
                aria-label="Thu nhỏ widget"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* BODY (SCROLLABLE) */}
          <div className="p-4 overflow-y-auto space-y-4 text-xs">
            {/* DOMAIN & CLAIM */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span className="text-amber-400 font-semibold">{activeReview?.domain || "GENERAL"}</span>
                <span>Case #{activeReview?.caseId?.slice(0, 8)}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-slate-200 italic leading-relaxed">
                "{activeReview?.claim}"
              </div>
            </div>

            {/* AI HIDDEN NOTICE (ANTI-ANCHORING) */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed">
              <EyeOff size={15} className="text-amber-400 mt-0.5 shrink-0" />
              <span>
                <strong>Kết quả AI đang được ẩn</strong> để bảo đảm tính khách quan độc lập tuyệt đối.
              </span>
            </div>

            {/* VOTE CHOICES */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                Nhận định của bạn
              </label>
              <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Nhận định của bạn">
                {[
                  {
                    value: "TRUSTWORTHY",
                    label: "TRUSTWORTHY",
                    desc: "Có cơ sở xác thực, đáng tin cậy",
                    color: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/20",
                    active: "bg-emerald-950/40 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400",
                  },
                  {
                    value: "UNTRUSTWORTHY",
                    label: "UNTRUSTWORTHY",
                    desc: "Sai lệch, ngụy tạo, hoặc lừa đảo",
                    color: "border-rose-500/40 text-rose-300 hover:bg-rose-950/20",
                    active: "bg-rose-950/40 border-rose-400 text-rose-200 ring-1 ring-rose-400",
                  },
                  {
                    value: "INSUFFICIENT_EVIDENCE",
                    label: "INSUFFICIENT EVIDENCE",
                    desc: "Không đủ bằng chứng độc lập để kết luận",
                    color: "border-slate-500/40 text-slate-300 hover:bg-slate-900",
                    active: "bg-slate-900 border-slate-300 text-white ring-1 ring-slate-300",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={vote === opt.value}
                    onClick={() => setVote(opt.value)}
                    className={`flex flex-col text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      vote === opt.value ? opt.active : opt.color
                    }`}
                  >
                    <span className="font-mono font-bold text-xs">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CONFIDENCE SLIDER */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span>ĐỘ TỰ TIN ĐÁNH GIÁ</span>
                <span className="font-bold text-amber-300">{confidence}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                aria-label="Độ tự tin đánh giá"
              />
            </div>

            {/* EVIDENCE SOURCES */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span>BẰNG CHỨNG / NGUỒN ({evidenceList.length}/5)</span>
                {evidenceList.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddEvidence}
                    className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    <Plus size={12} /> Thêm nguồn
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {evidenceList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-white/5">
                    <select
                      value={item.sourceType}
                      onChange={(e) => handleUpdateEvidence(idx, "sourceType", e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-[10px] font-mono text-amber-300"
                      aria-label={`Loại nguồn bằng chứng số ${idx + 1}`}
                    >
                      <option value="PRIMARY">PRIMARY</option>
                      <option value="OFFICIAL">OFFICIAL</option>
                      <option value="ACADEMIC">ACADEMIC</option>
                      <option value="GOVERNMENT">GOVERNMENT</option>
                      <option value="INDEPENDENT_MEDIA">MEDIA</option>
                      <option value="COMMUNITY">COMMUNITY</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={item.url}
                      onChange={(e) => handleUpdateEvidence(idx, "url", e.target.value)}
                      className="flex-1 bg-transparent px-2 py-1 text-xs border-b border-white/10 focus:border-amber-400 outline-none text-slate-200"
                      aria-label={`URL bằng chứng số ${idx + 1}`}
                    />
                    {evidenceList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Xóa nguồn"
                        aria-label={`Xóa nguồn số ${idx + 1}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* REASONING */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                Phân tích & Lập luận chuyên môn
              </label>
              <textarea
                rows={3}
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Nêu rõ cơ sở thẩm định và các chi tiết kiểm chứng..."
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-400 outline-none resize-none leading-relaxed"
                aria-label="Phân tích và lập luận chuyên môn"
              />
            </div>

            {/* FEEDBACK MSG */}
            {feedback && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/40 border border-rose-500/30 text-rose-300"
                }`}
                role="status"
              >
                {feedback.locked ? <Lock size={14} /> : feedback.type === "success" ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                <span>{feedback.text}</span>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-900 border-t border-white/10">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft || submitting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Save size={13} />
              <span>{savingDraft ? "Đang lưu..." : "Lưu nháp"}</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitAssessment}
              disabled={submitting || savingDraft}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Send size={13} />
              <span>{submitting ? "Đang khóa..." : "Gửi đánh giá"}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
