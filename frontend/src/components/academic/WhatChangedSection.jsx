"use client";

import React from "react";
import { AcademicCommandCenterViewModel } from "@/lib/intelligence/academic/academicCommandCenterViewModel.js";
import { Sparkles, ArrowRight, ShieldCheck, FileSearch } from "lucide-react";

export function WhatChangedSection({ changes = [], onSelectChange }) {
  if (!changes || changes.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="what-changed-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 id="what-changed-heading" className="text-lg font-bold text-foreground tracking-tight">
            Thay Đổi Mới Nhất ({changes.length})
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          So sánh tự động với bản chụp gần nhất
        </span>
      </div>

      <div className="grid gap-3">
        {changes.map((change, idx) => {
          const categoryLabel = AcademicCommandCenterViewModel.getCategoryLabel(change.category || change.field);

          return (
            <div
              key={change.changeId || idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/40 p-4 md:p-5 backdrop-blur-md transition-all hover:border-sky-500/40 hover:bg-card/60 shadow-sm"
            >
              {/* Left Column: Category & Description */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400">
                    {categoryLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    <ShieldCheck className="h-3 w-3" /> Nguồn chính thức
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {change.description}
                </p>
              </div>

              {/* Middle / Right Column: Delta comparison */}
              <div className="flex items-center gap-3 self-start sm:self-center">
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs">
                  <span className="line-through text-muted-foreground font-mono">
                    {change.oldValue || "N/A"}
                  </span>
                  <ArrowRight className="h-3 w-3 text-sky-400" />
                  <span className="font-bold text-sky-400 font-mono">
                    {change.newValue || "Mới"}
                  </span>
                </div>

                {onSelectChange && (
                  <button
                    onClick={() => onSelectChange(change)}
                    title="Xem chi tiết biến thiên"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/50 text-muted-foreground hover:text-foreground hover:bg-background/90 transition-colors"
                  >
                    <FileSearch className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
