"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, GraduationCap } from "lucide-react";
import { apiRequest } from "@/lib/api/runtimeClient";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AcademicSummaryWidget() {
  const { session, isLoading } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    if (isLoading || !session) return undefined;
    let cancelled = false;
    apiRequest("/api/academic/timetable")
      .then((payload) => {
        if (!cancelled) {
          setWorkspace(payload);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => { cancelled = true; };
  }, [isLoading, session]);

  if (!session || state === "error") return null;
  const timetable = workspace?.timetable;
  const todayCount = workspace?.today?.classes?.length || 0;
  const nextClass = workspace?.nextClass;

  return (
    <section className="surface-card border-teal-300/15 p-5" aria-labelledby="academic-summary-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3"><span className="stat-icon teal"><GraduationCap size={17} /></span><div><p className="eyebrow">Học vụ</p><h2 id="academic-summary-title" className="mt-1 text-lg font-black text-white">Thời khóa biểu của bạn</h2></div></div>
        <Link href="/academic" className="text-link">Mở học vụ <ArrowRight size={14} /></Link>
      </div>
      {state === "loading" ? <p className="mt-4 text-sm text-slate-500">Đang nạp dữ liệu đã xác nhận…</p> : timetable ? <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-black/15 p-3"><div className="flex items-center gap-2 text-xs text-slate-400"><CalendarDays size={14} className="text-teal-200" /> Hôm nay</div><p className="mt-2 text-xl font-black text-white">{todayCount} tiết</p><p className="mt-1 text-xs text-slate-500">{workspace.today?.dayLabel}</p></div><div className="rounded-xl border border-white/10 bg-black/15 p-3"><div className="flex items-center gap-2 text-xs text-slate-400"><Clock3 size={14} className="text-teal-200" /> Tiết tiếp theo</div><p className="mt-2 truncate text-sm font-bold text-white">{nextClass?.courseName || "Không có"}</p><p className="mt-1 text-xs text-slate-500">{nextClass ? `${nextClass.startTime || ""}${nextClass.room ? ` · ${nextClass.room}` : ""}` : "Chưa xác định"}</p></div></div> : <div className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-400">Bạn chưa có thời khóa biểu.</p><Link href="/academic" className="secondary-action justify-center">Tạo lịch <ArrowRight size={14} /></Link></div>}
    </section>
  );
}
