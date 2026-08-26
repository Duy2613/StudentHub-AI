"use client";

import React from "react";
import { AcademicCommandCenterViewModel } from "@/lib/intelligence/academic/academicCommandCenterViewModel.js";
import { ShieldCheck, BookOpen, Award, CheckCircle, Clock } from "lucide-react";

export function AcademicHeader({ studentProfile = {}, digitalTwinState = {}, syncStatus = {} }) {
  const {
    fullName = "Sinh Viên",
    cohort = 2024,
    programName = "Kỹ thuật Phần mềm",
    studentId = "24110001"
  } = studentProfile;

  const {
    earnedCredits = 115,
    totalRequiredCredits = 150,
    cgpa = 2.85,
    isThesisEligible = true
  } = digitalTwinState;

  const isLive = syncStatus.isLive !== false;
  const lastSyncFormatted = AcademicCommandCenterViewModel.formatDate(syncStatus.lastSyncedAt || new Date().toISOString());

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-background/60 p-6 md:p-8 backdrop-blur-xl shadow-xl">
      {/* Subtle Glow Backdrop */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Greeting & Scope */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Academic Command Center
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              MSSV: {studentId} • Khóa K{String(cohort).slice(-2)}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Xin chào, {fullName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ngành {programName} — Bản sao số học vụ được đồng bộ theo thời gian thực.
          </p>
        </div>

        {/* Right: Sync Status & Twin Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Digital Twin Snapshot Pill */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border/50 bg-background/60 p-3 shadow-inner text-center">
            <div className="px-2">
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                <BookOpen className="h-3 w-3 text-sky-400" /> Tín chỉ
              </div>
              <div className="text-sm font-extrabold text-foreground mt-0.5">
                {earnedCredits}/{totalRequiredCredits}
              </div>
            </div>

            <div className="border-x border-border/50 px-2">
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                <Award className="h-3 w-3 text-amber-400" /> GPA
              </div>
              <div className="text-sm font-extrabold text-foreground mt-0.5">
                {typeof cgpa === "number" ? cgpa.toFixed(2) : cgpa}
              </div>
            </div>

            <div className="px-2">
              <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" /> Khóa luận
              </div>
              <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                {isThesisEligible ? "Đủ ĐK" : "Chưa đủ"}
              </div>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className="flex flex-col items-start sm:items-end text-xs">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold border ${
              isLive 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}>
              <span className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {isLive ? "LIVE — Đồng Bộ Trực Tuyến" : "STALE — Bản Xác Minh Gần Nhất"}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Cập nhật: {lastSyncFormatted}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
