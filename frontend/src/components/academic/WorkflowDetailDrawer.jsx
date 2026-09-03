"use client";

import React, { useState, useEffect } from "react";
import { AcademicCommandCenterViewModel } from "@/lib/intelligence/academic/academicCommandCenterViewModel.js";
import { X, CheckCircle2, Circle, Lock, ArrowRight, FileText, Calendar, History } from "lucide-react";

export function WorkflowDetailDrawer({
  task,
  isOpen,
  onClose,
  onCompleteStep,
  isMutating = false
}) {
  const [activeStepId, setActiveStepId] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const steps = task.steps || [];
  const progress = task.progress || { completedSteps: 0, totalSteps: steps.length, percentage: 0 };
  const deadlineFormatted = AcademicCommandCenterViewModel.formatDate(task.dueAt);
  const countdown = AcademicCommandCenterViewModel.formatRelativeDeadline(task.dueAt);
  const badge = AcademicCommandCenterViewModel.getImpactBadge(task.priority || "MEDIUM");
  const history = task.history || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col justify-between border-l border-border/80 bg-card/95 p-6 md:p-8 backdrop-blur-2xl shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">Chi Tiết Quy Trình Học Vụ</h3>
                <p className="text-xs text-muted-foreground">Workflow Detail & Step Progress</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-background/90 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Task Status & Deadline Card */}
          <div className="rounded-2xl border border-border/60 bg-background/60 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.colorClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                {badge.label}
              </span>

              {deadlineFormatted !== "N/A" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20">
                  <Calendar className="h-3.5 w-3.5" />
                  Hạn chót: {deadlineFormatted} {countdown && `• ${countdown}`}
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-foreground leading-snug">
              {task.title}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {task.description}
            </p>

            {/* Progress Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-foreground">Tiến độ quy trình</span>
                <span className="text-primary font-mono">{progress.completedSteps}/{progress.totalSteps} bước ({progress.percentage}%)</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full bg-gradient-to-r from-primary to-sky-400 transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Steps Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Các bước thực hiện
            </h4>

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isCompleted = step.status === "COMPLETED";
                const isPreviousDone = idx === 0 || steps[idx - 1].status === "COMPLETED";
                const isLocked = !isCompleted && !isPreviousDone;
                const isCurrent = !isCompleted && isPreviousDone;

                return (
                  <div
                    key={step.stepId || idx}
                    className={`rounded-2xl border p-4 transition-all ${
                      isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/5 text-foreground/90"
                        : isCurrent
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border/40 bg-card/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                          ) : isLocked ? (
                            <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-foreground">
                            {idx + 1}. {step.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {step.description}
                          </div>
                        </div>
                      </div>

                      {/* Action Button for Current Step */}
                      {isCurrent && (
                        <button
                          onClick={() => onCompleteStep && onCompleteStep(task.taskId, step.stepId)}
                          disabled={isMutating}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <span>{isMutating ? "Đang ghi nhận..." : "Hoàn thành bước"}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit History Log */}
          {history.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-primary" />
                Nhật ký tiến trình (Audit History)
              </h4>

              <div className="rounded-2xl border border-border/40 bg-background/50 p-4 space-y-2.5 max-h-48 overflow-y-auto text-xs">
                {history.map((ev, idx) => (
                  <div key={ev.eventId || idx} className="flex items-start justify-between gap-2 border-b border-border/30 pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <span className="font-bold text-foreground">{ev.type}</span>
                      <p className="text-muted-foreground mt-0.5">{ev.reason || "Cập nhật trạng thái"}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString("vi-VN") : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-border/60 mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-border/80 bg-background/60 py-2.5 text-xs font-semibold text-foreground hover:bg-background/90 transition-colors"
          >
            Đóng bảng chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
