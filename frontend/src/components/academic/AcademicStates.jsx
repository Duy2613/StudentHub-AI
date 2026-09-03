"use client";

import React from "react";
import { AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";

export function AcademicLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-label="Đang tải dữ liệu học vụ">
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-md">
        <div className="h-8 w-64 rounded-lg bg-muted/60 mb-3" />
        <div className="h-4 w-96 rounded-md bg-muted/40" />
      </div>

      {/* Action Center Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 rounded bg-muted/60" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-44 rounded-xl border border-border/40 bg-card/30 p-5" />
          <div className="h-44 rounded-xl border border-border/40 bg-card/30 p-5" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-xl border border-border/40 bg-card/30 p-6" />
        <div className="h-80 rounded-xl border border-border/40 bg-card/30 p-6" />
      </div>
    </div>
  );
}

export function AcademicEmptyState({ message = "Hiện tại bạn không có thay đổi học vụ nào cần xử lý." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card/30 p-12 text-center backdrop-blur-md">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Tất Cả Đều Đã Ổn Định</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-1.5 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Đồng bộ trực tiếp từ Phòng Đào Tạo & CTSV HCMUTE
      </div>
    </div>
  );
}

export function AcademicErrorState({ error = "Không thể tải dữ liệu học vụ từ máy chủ.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/5 p-12 text-center backdrop-blur-md">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 mb-4 border border-rose-500/30">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Không Thể Tải Dữ Liệu Học Vụ</h3>
      <p className="text-sm text-rose-300/80 max-w-md mb-6">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại kết nối
        </button>
      )}
    </div>
  );
}
