"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ThumbsUp, AlertCircle, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

/**
 * CommunityPerceptionWidget
 *
 * Implements Community Perception Voting (BELIEVE / DOUBT) for Expert Trust Network V3.
 *
 * CORE INVARIANT: Community perception represents subjective peer viewpoints and
 * does NOT alter or substitute for the authoritative Trust Engine verdict.
 */
export default function CommunityPerceptionWidget({
  caseId,
  caseRevision = 1,
  claimId = null,
  contributionId = null,
  targetType = "CASE",
  className = "",
}) {
  const [summary, setSummary] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        caseId,
        caseRevision: String(caseRevision),
        targetType,
      });
      if (claimId) params.set("claimId", claimId);
      if (contributionId) params.set("contributionId", contributionId);

      const res = await fetch(`/api/community/perception?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setUserVote(data.userVote?.vote || null);
      }
    } catch (err) {
      setError("Không thể tải ý kiến cộng đồng.");
    } finally {
      setLoading(false);
    }
  }, [caseId, caseRevision, claimId, contributionId, targetType]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleVote = async (voteType) => {
    if (!caseId || submitting) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/community/perception", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          caseRevision,
          claimId,
          contributionId,
          targetType,
          vote: voteType,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Vui lòng đăng nhập để gửi nhận định cộng đồng.");
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || "Gửi nhận định không thành công.");
        }
        return;
      }

      const data = await res.json();
      setUserVote(data.vote);
      if (data.summary) {
        setSummary(data.summary);
      } else {
        await fetchSummary();
      }
    } catch (err) {
      setError("Lỗi kết nối khi gửi nhận định.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalVotes = summary?.totalVotes || 0;
  const totalBelieve = summary?.totalBelieve || 0;
  const totalDoubt = summary?.totalDoubt || 0;
  const believePct = totalVotes > 0 ? Math.round((totalBelieve / totalVotes) * 100) : 50;
  const doubtPct = totalVotes > 0 ? Math.round((totalDoubt / totalVotes) * 100) : 50;
  const expertBelieve = summary?.expertBelieve || 0;
  const expertDoubt = summary?.expertDoubt || 0;

  return (
    <div className={`p-4 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-white">Góc nhìn & Niềm tin Cộng đồng</h4>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {totalVotes} lượt nhận định
        </span>
      </div>

      {/* Vote Bar */}
      {totalVotes > 0 ? (
        <div className="mb-3">
          <div className="h-2 w-full bg-space-950 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${believePct}%` }}
              title={`Đáng tin: ${believePct}%`}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${doubtPct}%` }}
              title={`Nghi ngờ: ${doubtPct}%`}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400 font-mono">
            <span className="text-emerald-400">{believePct}% Đáng tin ({totalBelieve})</span>
            <span className="text-rose-400">{doubtPct}% Nghi ngờ ({totalDoubt})</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic mb-3">Chưa có nhận định nào cho phiên bản này. Hãy là người đầu tiên!</p>
      )}

      {/* Expert breakdown if present */}
      {(expertBelieve > 0 || expertDoubt > 0) && (
        <div className="mb-3 p-2 rounded-lg bg-white/5 border border-white/5 text-[11px] text-gray-300 flex items-center justify-between">
          <span className="text-indigo-300 font-medium">⭐ Nhận định từ Chuyên gia xác minh:</span>
          <span>{expertBelieve} Đáng tin · {expertDoubt} Nghi ngờ</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleVote("BELIEVE")}
          disabled={submitting}
          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            userVote === "BELIEVE"
              ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20"
              : "bg-white/5 hover:bg-emerald-500/10 border-white/10 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-300"
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${userVote === "BELIEVE" ? "text-emerald-400 fill-emerald-400" : ""}`} />
          <span>Đáng tin</span>
          {userVote === "BELIEVE" && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />}
        </button>

        <button
          type="button"
          onClick={() => handleVote("DOUBT")}
          disabled={submitting}
          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            userVote === "DOUBT"
              ? "bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-sm shadow-rose-500/20"
              : "bg-white/5 hover:bg-rose-500/10 border-white/10 hover:border-rose-500/30 text-gray-300 hover:text-rose-300"
          }`}
        >
          <AlertCircle className={`w-3.5 h-3.5 ${userVote === "DOUBT" ? "text-rose-400" : ""}`} />
          <span>Nghi ngờ</span>
          {userVote === "DOUBT" && <CheckCircle2 className="w-3 h-3 text-rose-400 ml-auto" />}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-rose-400">{error}</p>
      )}

      {/* Mandatory Non-Authoritative Invariant Disclaimer */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-start gap-1.5 text-[10px] text-gray-500 leading-tight">
        <ShieldAlert className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
        <span>
          Ý kiến cộng đồng phản ánh nhận định của sinh viên và không thay thế hoặc làm sai lệch kết luận kiểm chứng của Trust Engine.
        </span>
      </div>
    </div>
  );
}
