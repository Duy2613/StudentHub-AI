"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Calendar,
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Zap
} from "lucide-react";

export function PersonalAcademicBriefing() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBriefing() {
      try {
        setLoading(true);
        const res = await fetch("/api/personalization/briefing");
        const json = await res.json();
        if (json.success) {
          setBriefing(json.data);
        }
      } catch (err) {
        console.error("Failed loading briefing:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBriefing();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 animate-pulse text-xs text-neutral-500 text-center">
        Đang biên dịch Bản Tin Học Vụ Cá Nhân Hóa (My Academic Briefing)...
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900/90 via-neutral-900/60 to-neutral-950/80 border border-neutral-800/80 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center space-x-3 text-cyan-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <div>
            <h2 className="text-base font-bold text-neutral-100">Bản Tin Học Vụ Cá Nhân Hôm Nay</h2>
            <p className="text-[11px] text-neutral-400">
              Chào {briefing.studentName} • GPA: <strong className="text-emerald-400">{briefing.academicSummary?.cgpa}</strong> • Đã tích lũy: <strong className="text-cyan-400">{briefing.academicSummary?.earnedCredits} TC</strong>
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 self-start sm:self-center">
          HYPER-PERSONALIZED V1
        </span>
      </div>

      {/* Grid: Changes & Deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Important Changes */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
          <h3 className="text-xs font-bold text-neutral-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Thay Đổi Quy Chế & Lịch Học ({briefing.importantChanges?.length || 0})</span>
          </h3>
          <div className="space-y-2">
            {briefing.importantChanges?.map((ch) => (
              <div key={ch.id} className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-1">
                <div className="font-bold text-neutral-200">{ch.title}</div>
                <div className="text-[11px] text-neutral-400">{ch.detail}</div>
                <div className="text-[10px] text-cyan-400 font-medium">Nguồn: {ch.source}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
          <h3 className="text-xs font-bold text-neutral-200 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Hạn Chót Sắp Đến (Deadlines)</span>
          </h3>
          <div className="space-y-2">
            {briefing.upcomingDeadlines?.map((dl) => (
              <div key={dl.id} className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-neutral-200">{dl.title}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Hạn nộp: {new Date(dl.dueDate).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Còn {dl.daysRemaining} ngày
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matched Expert & Unresolved Contradiction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommended Expert */}
        {briefing.recommendedExpert && (
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200 flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Chuyên Gia Phù Hợp Cho Bạn</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {briefing.recommendedExpert.verificationStatus}
              </span>
            </div>
            <div className="font-bold text-neutral-100">{briefing.recommendedExpert.fullName}</div>
            <p className="text-[11px] text-neutral-400">
              Độ tương thích lĩnh vực: <strong>{Math.round(briefing.recommendedExpert.relevanceScore * 100)}%</strong> • Độ tin cậy lịch sử: <strong>{Math.round(briefing.recommendedExpert.reliabilityScore * 100)}%</strong>
            </p>
          </div>
        )}

        {/* Unresolved Contradiction / Operational Risk */}
        {briefing.unresolvedContradiction && (
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span className="flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Rủi Ro Vận Hành / Xung Đột Thực Tế</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {briefing.unresolvedContradiction.status}
              </span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              {briefing.unresolvedContradiction.note}
            </p>
          </div>
        )}
      </div>

      {/* Grounded Recommended Actions */}
      <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
        <h3 className="text-xs font-bold text-neutral-200 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Hành Động Khuyến Nghị Tối Ưu Tiếp Theo (Grounded Next Best Actions)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {briefing.recommendedActions?.map((act) => (
            <div key={act.id} className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1.5 text-xs">
              <div className="font-bold text-neutral-200">{act.title}</div>
              <div className="text-[11px] text-cyan-300">
                <strong>Tại sao tôi thấy điều này?</strong> {act.whyAmISeeingThis}
              </div>
              <div className="text-[10px] text-neutral-400">
                <strong>Căn cứ:</strong> {act.supportingEvidence} (Độ tin cậy: {Math.round(act.confidence * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
