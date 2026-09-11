"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Users,
  Flag,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function ExpertTrustNetworkV3Workbench() {
  const [workbenchData, setWorkbenchData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [moderationCases, setModerationCases] = useState([]);
  const [activeTab, setActiveTab] = useState("missions");
  const [loading, setLoading] = useState(true);
  const [votingCaseId, setVotingCaseId] = useState(null);
  const [modMessage, setModMessage] = useState(null);

  const fetchWorkbench = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/expert/workbench", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setWorkbenchData(data);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/expert/progression?leaderboard=true&limit=10");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch {
      // Ignored
    }
  }, []);

  const fetchModeration = useCallback(async () => {
    try {
      const res = await fetch("/api/moderation/cases?status=OPEN", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setModerationCases(data.cases || []);
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    fetchWorkbench();
    fetchLeaderboard();
  }, [fetchWorkbench, fetchLeaderboard]);

  useEffect(() => {
    if (activeTab === "moderation") {
      fetchModeration();
    }
  }, [activeTab, fetchModeration]);

  const handleModerationVote = async (caseId, action) => {
    try {
      setVotingCaseId(caseId);
      setModMessage(null);
      const res = await fetch("/api/moderation/vote", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, action }),
      });
      if (res.ok) {
        setModMessage(`Đã ghi nhận biểu quyết: ${action}`);
        await fetchModeration();
      } else {
        const err = await res.json().catch(() => ({}));
        setModMessage(`Lỗi: ${err.error || "Không thể gửi biểu quyết"}`);
      }
    } catch {
      setModMessage("Lỗi kết nối khi gửi biểu quyết.");
    } finally {
      setVotingCaseId(null);
    }
  };

  const progression = workbenchData?.progression || {
    starLevel: 1,
    rawQualityScore: 0,
    sufficiencyState: "INSUFFICIENT_DATA",
    adjudicatedCount: 0,
    upheldCount: 0,
    overturnedCount: 0,
    missionsCompletedCount: 0,
  };

  const daily = workbenchData?.dailyMissions || {
    missions: [],
    completedCount: 0,
    totalCount: 0,
    progressPct: 0,
  };

  const isSufficient = progression.sufficiencyState === "SUFFICIENT";
  const starAccessibleLabel = `${progression.starLevel} trên 5 sao (${Math.round(
    progression.rawQualityScore * 100
  )}% độ tin cậy, ${isSufficient ? "Đã đủ dữ liệu kiểm chứng" : "Chưa đủ 20 lượt đánh giá tối thiểu"})`;

  return (
    <div className="mb-8 space-y-6">
      {/* 1. Expert Progression Card (Stars & Invariant Disclosures) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-space-900/90 via-space-950 to-indigo-950/40 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                EXPERT TRUST NETWORK V3
              </span>
              {isSufficient ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ĐỦ DỮ LIỆU ĐỘ TIN CẬY (≥20)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> TẬP MẪU TẠM THỜI ({progression.adjudicatedCount}/20)
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {workbenchData?.fullName || "Chuyên gia Thẩm định"}
              <ShieldCheck className="w-6 h-6 text-teal-400 inline" />
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Hệ thống cấp bậc uy tín phái sinh độc lập từ lịch sử thẩm định đối soát bằng chứng.
            </p>
          </div>

          {/* Star Projection Display */}
          <div className="flex flex-col items-start md:items-end">
            <div className="flex items-center gap-1.5" aria-label={starAccessibleLabel} role="img">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-6 h-6 transition-all ${
                    s <= progression.starLevel
                      ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      : "text-gray-600 fill-gray-800"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-amber-300 mt-1">
              Cấp độ {progression.starLevel}★ · {Math.round(progression.rawQualityScore * 100)}% chất lượng
            </span>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-gray-400 font-medium">Lượt thẩm định</p>
            <p className="text-lg font-bold text-white font-mono mt-0.5">
              {progression.adjudicatedCount}{" "}
              <span className="text-xs text-gray-400 font-normal">/ 20 mục tiêu</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-gray-400 font-medium">Thẩm định chuẩn xác</p>
            <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {progression.upheldCount}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-gray-400 font-medium">Bị đảo ngược</p>
            <p className="text-lg font-bold text-rose-400 font-mono mt-0.5">
              {progression.overturnedCount}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-gray-400 font-medium">Nhiệm vụ hoàn tất</p>
            <p className="text-lg font-bold text-indigo-300 font-mono mt-0.5">
              {progression.missionsCompletedCount}
            </p>
          </div>
        </div>

        {/* Binding Invariant Callout */}
        <div className="mt-4 p-2.5 rounded-xl bg-space-950/60 border border-white/5 flex items-center gap-2 text-[11px] text-gray-400">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Bảo toàn thẩm quyền:</strong> Số sao là hình ảnh đại diện phái sinh từ{" "}
            <code className="text-gray-300">expert_quality_events</code>. Ngôi sao 5★ không tự động
            cấp thẩm quyền ban hành quy chế hay thay đổi kết luận của Trust Engine.
          </span>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("missions")}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "missions"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Nhiệm vụ hôm nay ({daily.completedCount}/{daily.totalCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "leaderboard"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Bảng xếp hạng Chuyên gia
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("moderation")}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "moderation"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Flag className="w-4 h-4" />
          Kiểm duyệt Cộng đồng ({moderationCases.length})
        </button>
      </div>

      {/* Tab 1: Daily Missions */}
      {activeTab === "missions" && (
        <div className="space-y-4">
          {/* Daily Progress */}
          <div className="p-4 rounded-2xl bg-space-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <h4 className="text-sm font-semibold text-white">Tiến độ nhiệm vụ chuyên môn</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Hoàn thành nhiệm vụ giúp cải thiện chất lượng đối soát và tích lũy điểm thẩm định.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-64">
              <div className="h-2.5 w-full bg-space-950 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${daily.progressPct}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300 whitespace-nowrap">
                {daily.progressPct}%
              </span>
            </div>
          </div>

          {/* Mission Cards */}
          {daily.missions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {daily.missions.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-space-900/80 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white/5 text-indigo-300 border border-white/10">
                        {m.badge}
                      </span>
                      <span className="text-xs font-mono text-amber-300 font-bold">
                        +{m.points} pts
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {m.title}
                    </h5>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 font-mono">
                      Ưu tiên: {m.priority}
                    </span>
                    {m.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành
                      </span>
                    ) : (
                      <Link
                        href={m.actionUrl}
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        Thực hiện <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-space-900/40 border border-white/5 text-center text-gray-400 text-xs">
              Hiện tại không có nhiệm vụ mới đang chờ. Bạn đã hoàn thành toàn bộ nhiệm vụ được giao!
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Leaderboard */}
      {activeTab === "leaderboard" && (
        <div className="p-4 rounded-2xl bg-space-900/60 border border-white/10">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white">Bảng danh dự Chuyên gia Uy tín</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Chỉ xếp hạng các chuyên gia đạt chuẩn kiểm chứng tối thiểu (≥20 lượt đối soát độc lập).
            </p>
          </div>

          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="py-2.5 px-3">Hạng</th>
                    <th className="py-2.5 px-3">Chuyên gia</th>
                    <th className="py-2.5 px-3">Cấp bậc</th>
                    <th className="py-2.5 px-3">Chất lượng</th>
                    <th className="py-2.5 px-3">Lượt đối soát</th>
                    <th className="py-2.5 px-3">Nhiệm vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboard.map((item, idx) => (
                    <tr key={item.userId} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-gray-400">#{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-white">{item.fullName}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-amber-400 font-mono">
                          {item.starLevel}★
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-400">
                        {Math.round(item.rawQualityScore * 100)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-300">{item.adjudicatedCount}</td>
                      <td className="py-3 px-3 font-mono text-indigo-300">
                        {item.missionsCompletedCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-500">
              Chưa có chuyên gia nào đạt đủ ngưỡng kiểm chứng tối thiểu 20 lượt đánh giá độc lập.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Moderation Queue */}
      {activeTab === "moderation" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-space-900/60 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-white">Hàng đợi Kiểm duyệt Cộng đồng</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Kiểm duyệt nội dung bài đăng và phản hồi từ sinh viên theo chuẩn mực học thuật.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                PHASE-F MODERATION
              </span>
            </div>

            {modMessage && (
              <div className="mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                {modMessage}
              </div>
            )}
          </div>

          {moderationCases.length > 0 ? (
            <div className="space-y-3">
              {moderationCases.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-space-900/80 border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                      {c.reasonCategory}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Mục tiêu: {c.targetType}
                    </span>
                  </div>

                  {c.details && (
                    <p className="text-xs text-gray-300 bg-space-950 p-2.5 rounded-xl border border-white/5">
                      {c.details}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      disabled={votingCaseId === c.id}
                      onClick={() => handleModerationVote(c.id, "KEEP")}
                      className="py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
                    >
                      Giữ nguyên (KEEP)
                    </button>
                    <button
                      type="button"
                      disabled={votingCaseId === c.id}
                      onClick={() => handleModerationVote(c.id, "LIMIT")}
                      className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
                    >
                      Hạn chế (LIMIT)
                    </button>
                    <button
                      type="button"
                      disabled={votingCaseId === c.id}
                      onClick={() => handleModerationVote(c.id, "REMOVE_FROM_PUBLIC_PROJECTION")}
                      className="py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
                    >
                      Ẩn khỏi hiển thị (REMOVE)
                    </button>
                    <button
                      type="button"
                      disabled={votingCaseId === c.id}
                      onClick={() => handleModerationVote(c.id, "ESCALATE")}
                      className="py-1.5 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors"
                    >
                      Chuyển tiếp (ESCALATE)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-space-900/40 border border-white/5 text-center text-xs text-gray-500">
              Không có báo cáo cộng đồng nào đang chờ kiểm duyệt.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
