"use client";

import React from "react";
import { UserCheck, CheckCircle2, ChevronRight } from "lucide-react";

export function WhyAffectedSection({ insights = [], studentProfile = {} }) {
  const activeInsightsWithReasons = insights.filter(
    (i) => i.whyItMatters && i.impact !== "NONE"
  );

  if (activeInsightsWithReasons.length === 0) {
    return null;
  }

  const { cohort = 2024, programName = "Kỹ thuật Phần mềm" } = studentProfile;

  return (
    <section aria-labelledby="why-affected-heading" className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <UserCheck className="h-4 w-4" />
        </span>
        <h2 id="why-affected-heading" className="text-lg font-bold text-foreground tracking-tight">
          Tại Sao Bạn Bị Ảnh Hưởng?
        </h2>
      </div>

      <div className="grid gap-4">
        {activeInsightsWithReasons.map((insight) => (
          <div
            key={insight.insightId}
            className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-md shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {insight.title}
              </h3>
              <span className="text-xs text-muted-foreground">
                Khóa K{String(cohort).slice(-2)} • {programName}
              </span>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/60 p-3.5 space-y-2">
              <div className="text-xs font-semibold text-amber-400">
                Căn cứ phân tích tác động cá nhân:
              </div>
              <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
                {insight.whyItMatters}
              </p>
            </div>

            {insight.deadline && (
              <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
                <ChevronRight className="h-3.5 w-3.5" />
                <span>Hạn chót cần hoàn tất: <strong>{insight.deadline}</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
