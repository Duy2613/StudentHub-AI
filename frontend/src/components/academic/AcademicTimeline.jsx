"use client";

import React, { useState } from "react";
import { AcademicCommandCenterViewModel } from "@/lib/intelligence/academic/academicCommandCenterViewModel.js";
import { History, Calendar, FileText, ChevronRight } from "lucide-react";

const TIMELINE_FILTERS = [
  { id: "ALL", label: "Tất cả" },
  { id: "DEADLINE", label: "Hạn chót" },
  { id: "FEE", label: "Học phí" },
  { id: "REQUIREMENT", label: "Chuẩn đầu ra" },
  { id: "POLICY", label: "Quy chế" }
];

export function AcademicTimeline({ timelineEvents = [], onSelectEvent }) {
  const [activeFilter, setActiveFilter] = useState("ALL");

  if (!timelineEvents || timelineEvents.length === 0) {
    return null;
  }

  // Filter events
  const filteredEvents = timelineEvents.filter((ev) => {
    if (activeFilter === "ALL") return true;
    const cat = (ev.category || "").toUpperCase();
    if (activeFilter === "DEADLINE") return cat.includes("DEADLINE") || cat.includes("DATE");
    if (activeFilter === "FEE") return cat.includes("FEE") || cat.includes("TUITION");
    if (activeFilter === "REQUIREMENT") return cat.includes("REQUIREMENT") || cat.includes("ENGLISH");
    if (activeFilter === "POLICY") return cat.includes("POLICY") || cat.includes("REGULATION");
    return true;
  });

  return (
    <section aria-labelledby="timeline-heading" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30">
            <History className="h-4 w-4" />
          </span>
          <h2 id="timeline-heading" className="text-lg font-bold text-foreground tracking-tight">
            Dòng Thời Gian Học Vụ ({filteredEvents.length})
          </h2>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Bộ lọc dòng thời gian">
          {TIMELINE_FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/70 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card/80"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
        {filteredEvents.map((ev, idx) => {
          const dateFormatted = AcademicCommandCenterViewModel.formatDate(ev.date);
          const badge = AcademicCommandCenterViewModel.getImpactBadge(ev.severity || "MEDIUM");

          return (
            <div key={ev.timelineId || idx} className="relative group">
              {/* Timeline Node Dot */}
              <div className="absolute -left-[27px] sm:-left-[35px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary shadow-sm group-hover:scale-125 transition-transform" />

              {/* Event Card */}
              <div className="rounded-2xl border border-border/60 bg-card/40 p-4 md:p-5 backdrop-blur-md transition-all hover:border-border hover:bg-card/70 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary font-mono">
                    <Calendar className="h-3.5 w-3.5" />
                    {dateFormatted}
                  </span>

                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.colorClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                    {badge.label}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {ev.milestoneTitle}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {ev.summary}
                </p>

                {ev.whyItMatters && (
                  <div className="mt-2.5 rounded-lg bg-background/50 border border-border/40 px-3 py-2 text-xs text-foreground/80">
                    <span className="font-semibold text-primary">Ảnh hưởng: </span>
                    {ev.whyItMatters}
                  </div>
                )}

                {onSelectEvent && (
                  <div className="mt-3 pt-3 border-t border-border/40 flex justify-end">
                    <button
                      onClick={() => onSelectEvent(ev)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Xem chứng cứ quy định
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
