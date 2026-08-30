"use client";

import React, { useState } from "react";
import { AcademicCommandCenterViewModel } from "@/lib/intelligence/academic/academicCommandCenterViewModel.js";
import { safeExternalUrl, safeInternalPath } from "@/lib/security/safeExternalUrl.js";
import { AlertOctagon, Calendar, FileText, ArrowRight, Check, ListChecks, ChevronRight } from "lucide-react";

export function ActionCenter({
  insights = [],
  academicTasks = [],
  onOpenEvidence,
  onOpenWorkflow
}) {
  const [executingActionId, setExecutingActionId] = useState(null);
  const [completedActionIds, setCompletedActionIds] = useState(new Set());

  // Filter high-priority insights (CRITICAL & HIGH)
  const urgentInsights = insights.filter(
    (i) => i.impact === "CRITICAL" || i.impact === "HIGH" || i.urgency === "CRITICAL" || i.urgency === "HIGH"
  );

  if (urgentInsights.length === 0) {
    return null;
  }

  // Map task by insightId for quick progress resolution
  const taskMap = new Map();
  for (const t of academicTasks) {
    if (t.insightId) {
      taskMap.set(t.insightId, t);
    }
  }

  const handleExecuteAction = (insightId, action, task) => {
    if (executingActionId || completedActionIds.has(insightId)) return;

    if (task && onOpenWorkflow) {
      onOpenWorkflow(task);
      return;
    }

    setExecutingActionId(insightId);
    setTimeout(() => {
      setExecutingActionId(null);
      setCompletedActionIds((prev) => new Set([...prev, insightId]));

      if (action?.targetUrl) {
        const externalUrl = safeExternalUrl(action.targetUrl);
        const internalPath = safeInternalPath(action.targetUrl);

        if (externalUrl) window.open(externalUrl, "_blank", "noopener,noreferrer");
        else if (internalPath) window.location.assign(internalPath);
      }
    }, 600);
  };

  return (
    <section aria-labelledby="action-center-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="h-4 w-4" />
          </span>
          <h2 id="action-center-heading" className="text-lg font-bold text-foreground tracking-tight">
            Việc Cần Xử Lý ({urgentInsights.length})
          </h2>
        </div>
        <span className="text-xs font-medium text-rose-400/90 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
          Ưu tiên cao nhất
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {urgentInsights.map((insight) => {
          const badge = AcademicCommandCenterViewModel.getImpactBadge(insight.impact);
          const deadlineFormatted = AcademicCommandCenterViewModel.formatDate(insight.deadline);
          const countdown = AcademicCommandCenterViewModel.formatRelativeDeadline(insight.deadline);
          const isDone = completedActionIds.has(insight.insightId);
          const isExecuting = executingActionId === insight.insightId;
          const task = taskMap.get(insight.insightId);
          const progress = task?.progress || { completedSteps: 0, totalSteps: 0, percentage: 0 };
          const nextAction = task?.nextAction;
          const primaryAction = insight.actions?.[1] || insight.actions?.[0];

          return (
            <div
              key={insight.insightId}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-b from-card/90 to-card/50 p-5 md:p-6 backdrop-blur-md shadow-lg transition-all hover:border-rose-500/50 hover:shadow-rose-500/5"
            >
              {/* Top Row: Impact & Deadline */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.colorClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                    {badge.label}
                  </span>

                  {deadlineFormatted !== "N/A" && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20">
                      <Calendar className="h-3.5 w-3.5" />
                      {deadlineFormatted} {countdown && `• ${countdown}`}
                    </span>
                  )}
                </div>

                {/* Title & What Changed */}
                <h3 className="text-base md:text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                  {insight.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">
                  {insight.whatChanged}
                </p>

                {/* Why You Are Affected Callout */}
                {insight.whyItMatters && (
                  <div className="mt-3 rounded-xl border border-border/60 bg-background/50 p-3 text-xs text-foreground/90 leading-relaxed">
                    <span className="font-semibold text-rose-400">Ảnh hưởng đến bạn: </span>
                    {insight.whyItMatters}
                  </div>
                )}

                {/* Multi-Step Workflow Progress Bar */}
                {task && progress.totalSteps > 0 && (
                  <div className="mt-4 rounded-xl border border-border/50 bg-background/60 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5 text-primary" />
                        Tiến độ thực hiện
                      </span>
                      <span className="font-bold text-primary font-mono">
                        {progress.completedSteps}/{progress.totalSteps} bước ({progress.percentage}%)
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-sky-400 transition-all duration-500"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>

                    {nextAction && (
                      <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
                        <span className="font-medium text-foreground">Bước tiếp theo:</span> {nextAction.title}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-border/40">
                {task ? (
                  <button
                    onClick={() => onOpenWorkflow && onOpenWorkflow(task)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95"
                  >
                    <span>{progress.percentage === 100 ? "Xem kết quả" : "Tiếp tục quy trình"}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : primaryAction ? (
                  <button
                    onClick={() => handleExecuteAction(insight.insightId, primaryAction)}
                    disabled={isExecuting || isDone}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-all active:scale-95 ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isDone ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Đã thực hiện
                      </>
                    ) : isExecuting ? (
                      "Đang xử lý..."
                    ) : (
                      <>
                        {primaryAction.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                ) : null}

                <button
                  onClick={() => onOpenEvidence && onOpenEvidence(insight)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/60 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/90 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Xem văn bản gốc
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
