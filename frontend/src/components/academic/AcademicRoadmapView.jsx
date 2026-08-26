"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MilestoneDetailDrawer } from "./MilestoneDetailDrawer.jsx";

// ─── Journey Stage Labels ───
const STAGE_LABELS = {
  FOUNDATION: { label: "Nền tảng", emoji: "🌱", color: "text-emerald-400" },
  CORE_STUDY: { label: "Chuyên ngành Cơ sở", emoji: "📚", color: "text-blue-400" },
  SPECIALIZATION: { label: "Chuyên sâu", emoji: "🔬", color: "text-violet-400" },
  LANGUAGE_REQUIREMENT: { label: "Ngoại ngữ", emoji: "🌍", color: "text-amber-400" },
  THESIS_PREPARATION: { label: "Chuẩn bị Khóa luận", emoji: "📝", color: "text-cyan-400" },
  GRADUATION_PREPARATION: { label: "Chuẩn bị Tốt nghiệp", emoji: "🎯", color: "text-orange-400" },
  GRADUATION: { label: "Tốt nghiệp", emoji: "🎓", color: "text-yellow-400" },
  COMPLETED: { label: "Hoàn thành", emoji: "✅", color: "text-green-400" },
  UNKNOWN: { label: "Đang xác định", emoji: "❓", color: "text-gray-400" }
};

// ─── Milestone State Visual Config ───
const MILESTONE_STATE_CONFIG = {
  COMPLETED: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400", icon: "✓", label: "Hoàn thành" },
  WAIVED: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300", icon: "✓", label: "Miễn" },
  IN_PROGRESS: { bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-400", icon: "◉", label: "Đang thực hiện" },
  BLOCKED: { bg: "bg-red-500/15", border: "border-red-500/40", text: "text-red-400", icon: "✕", label: "Bị chặn" },
  READY: { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400", icon: "→", label: "Sẵn sàng" },
  NOT_STARTED: { bg: "bg-zinc-500/10", border: "border-zinc-500/30", text: "text-zinc-400", icon: "○", label: "Chưa bắt đầu" },
  REVIEW_REQUIRED: { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-400", icon: "!", label: "Cần xem xét" },
  NOT_APPLICABLE: { bg: "bg-zinc-500/5", border: "border-zinc-500/20", text: "text-zinc-500", icon: "—", label: "Không áp dụng" }
};

// ─── Freshness Badge ───
function FreshnessBadge({ freshness }) {
  const config = {
    FRESH: { label: "Đồng bộ", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    STALE: { label: "⚠ Cần đồng bộ lại", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    CONFLICTED: { label: "⚠ Xung đột dữ liệu", className: "bg-red-500/15 text-red-400 border-red-500/30" },
    REBUILDING: { label: "Đang cập nhật...", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    UNKNOWN: { label: "Không rõ", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" }
  };
  const c = config[freshness] || config.UNKNOWN;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.className}`}>
      {c.label}
    </span>
  );
}

// ─── Progress Ring ───
function ProgressRing({ percentage, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const displayPct = Math.min(100, Math.max(0, percentage));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-zinc-800/60" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="text-emerald-400 transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-foreground tabular-nums">{displayPct}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hoàn thành</span>
      </div>
    </div>
  );
}

// ─── Milestone Card ───
function MilestoneCard({ milestone, onClick }) {
  const config = MILESTONE_STATE_CONFIG[milestone.state] || MILESTONE_STATE_CONFIG.NOT_STARTED;

  return (
    <button
      onClick={() => onClick(milestone)}
      className={`w-full text-left rounded-2xl border ${config.border} ${config.bg} p-4 md:p-5
        backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer group`}
      id={`milestone-${milestone.milestoneId}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${config.bg} ${config.text} border ${config.border}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-foreground truncate">{milestone.title}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.bg} ${config.text} border ${config.border} font-medium flex-shrink-0`}>
              {config.label}
            </span>
          </div>
          {milestone.studentFacingExplanation && (
            <p className="text-xs text-muted-foreground line-clamp-2">{milestone.studentFacingExplanation}</p>
          )}
          {milestone.requiredValue !== null && milestone.currentValue !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>{milestone.currentValue} / {milestone.requiredValue}</span>
                <span>{Math.min(100, Math.round((milestone.currentValue / milestone.requiredValue) * 100))}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    milestone.isSatisfied ? "bg-emerald-400" : "bg-blue-400"
                  }`}
                  style={{ width: `${Math.min(100, (milestone.currentValue / milestone.requiredValue) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <span className="text-muted-foreground/50 group-hover:text-foreground/60 transition-colors text-xs">→</span>
      </div>
    </button>
  );
}

// ─── Zone Section ───
function ZoneSection({ title, subtitle, icon, milestones = [], onSelectMilestone, className = "" }) {
  if (milestones.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <div>
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-2">
        {milestones.map(ms => (
          <MilestoneCard key={ms.milestoneId} milestone={ms} onClick={onSelectMilestone} />
        ))}
      </div>
    </div>
  );
}

// ─── Blocker Alert ───
function BlockerAlert({ blockers }) {
  if (!blockers || blockers.length === 0) return null;

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="text-red-400 text-lg">⚠</span>
        <div>
          <h4 className="font-semibold text-sm text-red-400 mb-1">Yếu tố cần giải quyết</h4>
          <ul className="space-y-1">
            {blockers.map((b, i) => (
              <li key={b.blockerId || i} className="text-xs text-red-300/80">
                • {b.reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Goal Card ───
function GoalCard({ goal, progress }) {
  if (!goal) return null;

  const statusConfig = {
    ACHIEVED: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400", label: "Đã đạt" },
    ON_TRACK: { bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-400", label: "Đúng tiến độ" },
    PENDING: { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400", label: "Đang tiến hành" }
  };
  const sc = statusConfig[goal.status] || statusConfig.PENDING;

  return (
    <div className={`rounded-2xl border ${sc.border} ${sc.bg} p-5 md:p-6 backdrop-blur-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <div>
            <h3 className="font-bold text-base text-foreground">Mục tiêu Tốt nghiệp</h3>
            <p className="text-xs text-muted-foreground">{goal.studentFacingLabel}</p>
          </div>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full ${sc.bg} ${sc.text} border ${sc.border} font-semibold`}>
          {sc.label}
        </span>
      </div>
      <div className="flex items-center gap-6">
        <ProgressRing percentage={progress.percentage} size={88} strokeWidth={6} />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Yêu cầu đạt</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{progress.completed}/{progress.total}</span>
          </div>
          {goal.blockerCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Yếu tố chặn</span>
              <span className="text-sm font-semibold text-red-400 tabular-nums">{goal.blockerCount}</span>
            </div>
          )}
          {goal.isEstimated && (
            <p className="text-[10px] text-muted-foreground italic">
              * Dự kiến — chưa được cơ sở đào tạo xác nhận chính thức.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Next Action Banner ───
function NextActionBanner({ nextAction }) {
  if (!nextAction) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary text-sm font-bold">→</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground">Việc cần làm tiếp theo</h4>
          <p className="text-xs text-muted-foreground truncate">{nextAction.label}</p>
        </div>
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider flex-shrink-0">
          {nextAction.source === "WORKFLOW" ? "Quy trình" : "Cột mốc"}
        </span>
      </div>
    </div>
  );
}

// ─── Main Roadmap View ───
export function AcademicRoadmapView({ initialData = null }) {
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const roadmap = initialData?.roadmap;
  const profile = initialData?.studentProfile;

  if (!roadmap) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl border border-border/60 bg-card/30 p-8 text-center backdrop-blur-xl">
          <span className="text-4xl mb-4 block">📍</span>
          <h2 className="text-lg font-semibold text-foreground mb-2">Chưa có dữ liệu lộ trình</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Hệ thống cần dữ liệu hồ sơ học vụ để xây dựng lộ trình cá nhân của bạn.
          </p>
          <Link href="/academic" className="text-sm text-primary hover:underline">
            ← Quay lại Trung tâm Điều phối
          </Link>
        </div>
      </div>
    );
  }

  const stageInfo = STAGE_LABELS[roadmap.currentStage] || STAGE_LABELS.UNKNOWN;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/academic" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              ← Trung tâm Điều phối
            </Link>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Lộ trình Học vụ
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {profile?.fullName} — {profile?.studentId} — K{profile?.cohort}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FreshnessBadge freshness={roadmap.freshness} />
        </div>
      </div>

      {/* Current Stage Banner */}
      <div className="rounded-2xl border border-border/60 bg-card/30 p-4 md:p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{stageInfo.emoji}</span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Giai đoạn hiện tại</p>
            <h2 className={`text-base font-bold ${stageInfo.color}`}>{stageInfo.label}</h2>
          </div>
          <div className="ml-auto">
            <ProgressRing percentage={roadmap.progress.percentage} size={56} strokeWidth={4} />
          </div>
        </div>
      </div>

      {/* Blockers */}
      <BlockerAlert blockers={roadmap.blockers} />

      {/* Next Action */}
      <NextActionBanner nextAction={roadmap.nextAction} />

      {/* Goal */}
      <GoalCard goal={roadmap.goal} progress={roadmap.progress} />

      {/* Milestone Zones */}
      <div className="rounded-3xl border border-border/60 bg-card/30 p-5 md:p-7 backdrop-blur-xl space-y-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Cột mốc Hành trình</h3>

        {/* Completed */}
        <ZoneSection
          title="Đã hoàn thành"
          subtitle={`${roadmap.completedMilestones.length} cột mốc`}
          icon="✅"
          milestones={roadmap.completedMilestones}
          onSelectMilestone={setSelectedMilestone}
        />

        {/* NOW — Active */}
        <ZoneSection
          title="Đang thực hiện"
          subtitle="Cần giải quyết ngay"
          icon="🔥"
          milestones={roadmap.activeMilestones}
          onSelectMilestone={setSelectedMilestone}
          className="border-t border-border/40 pt-5"
        />

        {/* NEXT — Ready */}
        <ZoneSection
          title="Tiếp theo"
          subtitle="Sẵn sàng bắt đầu"
          icon="➡️"
          milestones={roadmap.nextMilestones}
          onSelectMilestone={setSelectedMilestone}
          className="border-t border-border/40 pt-5"
        />

        {/* UPCOMING — Future */}
        <ZoneSection
          title="Sắp tới"
          subtitle="Cần hoàn tất các cột mốc trước"
          icon="🔮"
          milestones={roadmap.upcomingMilestones}
          onSelectMilestone={setSelectedMilestone}
          className="border-t border-border/40 pt-5"
        />
      </div>

      {/* Source Revisions Footer */}
      <div className="text-[10px] text-muted-foreground/60 text-center space-y-0.5">
        <p>Roadmap ID: {roadmap.roadmapId} | CTĐT: {roadmap.curriculum?.versionId}</p>
        <p>Cập nhật: {new Date(roadmap.asOf).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p>
      </div>

      {/* Milestone Detail Drawer */}
      <MilestoneDetailDrawer
        milestone={selectedMilestone}
        isOpen={Boolean(selectedMilestone)}
        onClose={() => setSelectedMilestone(null)}
      />
    </div>
  );
}
