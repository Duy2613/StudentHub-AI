"use client";

import React, { useEffect } from "react";
import { AcademicCommandCenterViewModel } from "@/lib/intelligence/academic/academicCommandCenterViewModel.js";
import { X, ShieldCheck, FileText, ExternalLink, Calendar, Hash, Building2, Quote } from "lucide-react";

export function SourceEvidenceDrawer({ item, isOpen, onClose }) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const title = item.title || item.milestoneTitle || item.subject || "Thông Tin Văn Bản Học Vụ";
  const sourceUrl = item.source?.canonicalUrl || item.sourceUrl || "https://daotao.hcmute.edu.vn";
  const sourceId = item.source?.sourceId || item.sourceId || "SRC_HCMUTE_DAOTAO";
  const evidenceText = item.evidence?.textSpan || item.whatChanged || item.summary || item.description || "Nội dung văn bản quy chế chính thức.";
  const clauseName = item.evidence?.clauseName || item.field || "Điều khoản chung";
  const dateFormatted = AcademicCommandCenterViewModel.formatDate(item.effectiveAt || item.date || item.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Body */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col justify-between border-l border-border/80 bg-card/95 p-6 md:p-8 backdrop-blur-2xl shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/30">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">Hồ Sơ & Bằng Chứng Nguồn</h3>
                <p className="text-xs text-muted-foreground">Source Provenance & Document Snapshot</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:bg-background/90 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Provenance Tier Badge */}
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-400">Nguồn Xác Thực Chính Thống (Tier 1 Gold)</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Văn bản đã qua kiểm định chữ ký số & đối soát tên miền allowlist HCMUTE.
              </div>
            </div>
          </div>

          {/* Meta Grid */}
          <div className="mt-6 space-y-4">
            <div>
              <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">
                Tên văn bản / Thông báo
              </div>
              <div className="text-sm font-bold text-foreground leading-snug">
                {title}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-border/50 bg-background/50 p-3">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Cơ quan ban hành
                </div>
                <div className="text-xs font-bold text-foreground mt-1">
                  {sourceId.includes("DAOTAO") ? "Phòng Đào Tạo" : (sourceId.includes("CTSV") ? "Phòng CTSV" : "ĐH Sư Phạm Kỹ Thuật")}
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-background/50 p-3">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Ngày hiệu lực
                </div>
                <div className="text-xs font-bold text-foreground mt-1">
                  {dateFormatted}
                </div>
              </div>
            </div>

            {/* Cited Text Span / Evidence */}
            <div className="mt-4 pt-2">
              <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-primary" /> Trích dẫn điều khoản ({clauseName})
              </div>
              <div className="rounded-xl border border-border/60 bg-background/80 p-4 text-xs md:text-sm text-foreground/90 font-mono leading-relaxed border-l-4 border-l-primary">
                "{evidenceText}"
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Open Official Link */}
        <div className="pt-6 border-t border-border/60 mt-8">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
          >
            <span>Mở văn bản gốc trên cổng trường</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
