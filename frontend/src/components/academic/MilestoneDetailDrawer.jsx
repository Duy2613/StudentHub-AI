"use client";

import React from "react";

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

const MILESTONE_TYPE_LABELS = {
  ACADEMIC_PROGRESS: { label: "Tín chỉ tích lũy", icon: "📚" },
  GPA_STANDING: { label: "Điểm trung bình tích lũy", icon: "📊" },
  LANGUAGE_REQUIREMENT: { label: "Chuẩn đầu ra Ngoại ngữ", icon: "🌍" },
  TUITION_CLEARANCE: { label: "Nghĩa vụ Tài chính", icon: "💳" },
  THESIS_ELIGIBILITY: { label: "Đủ điều kiện Khóa luận", icon: "📝" },
  GRADUATION_APPLICATION: { label: "Nộp hồ sơ Tốt nghiệp", icon: "📋" },
  GRADUATION: { label: "Tốt nghiệp", icon: "🎓" }
};

export function MilestoneDetailDrawer({ milestone, isOpen, onClose }) {
  if (!isOpen || !milestone) return null;

  const stateConfig = MILESTONE_STATE_CONFIG[milestone.state] || MILESTONE_STATE_CONFIG.NOT_STARTED;
  const typeLabel = MILESTONE_TYPE_LABELS[milestone.type] || { label: milestone.type, icon: "📌" };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border/60 z-50 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">{typeLabel.icon}</span>
            <div className="min-w-0">
              <h2 className="font-bold text-base text-foreground truncate">{milestone.title}</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{typeLabel.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            id="milestone-drawer-close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${stateConfig.bg} ${stateConfig.text} border ${stateConfig.border}`}>
              {stateConfig.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Trạng thái</p>
              <p className={`text-xs ${stateConfig.text}`}>{stateConfig.label}</p>
            </div>
          </div>

          {/* Explanation */}
          {milestone.studentFacingExplanation && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Giải thích</p>
              <p className="text-sm text-foreground">{milestone.studentFacingExplanation}</p>
            </div>
          )}

          {/* Progress Bar */}
          {milestone.requiredValue !== null && milestone.currentValue !== null && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Tiến độ</p>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {milestone.currentValue} / {milestone.requiredValue}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.min(100, Math.round((milestone.currentValue / milestone.requiredValue) * 100))}%
                </span>
              </div>
              <div className="h-2 bg-zinc-800/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    milestone.isSatisfied ? "bg-emerald-400" : "bg-blue-400"
                  }`}
                  style={{ width: `${Math.min(100, (milestone.currentValue / milestone.requiredValue) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Blocker Reason */}
          {milestone.blockerReason && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-xs text-red-400 mb-1 uppercase tracking-wider">Yếu tố chặn</p>
              <p className="text-sm text-red-300">{milestone.blockerReason}</p>
            </div>
          )}

          {/* Dependencies */}
          {milestone.dependsOn && milestone.dependsOn.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Phụ thuộc vào</p>
              <ul className="space-y-1.5">
                {milestone.dependsOn.map(dep => {
                  const depLabel = MILESTONE_TYPE_LABELS[dep] || { label: dep, icon: "📌" };
                  return (
                    <li key={dep} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{depLabel.icon}</span>
                      <span>{depLabel.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Source Revision */}
          {milestone.sourceRevision && (
            <div className="text-[10px] text-muted-foreground/60 pt-2 border-t border-border/30">
              <p>Revision: r{milestone.sourceRevision} | ID: {milestone.milestoneId}</p>
              <p>Yêu cầu: {milestone.requirementId || "—"}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
