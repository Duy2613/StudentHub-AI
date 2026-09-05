"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function ContinueLearningBar() {
  const { session, profile } = useAuth();
  const isAuthenticated = Boolean(session);

  return (
    <div className="w-full bg-surface-primary/70 border-b border-border-subtle py-4 px-4 sm:px-6 lg:px-8 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-knowledge animate-pulse" />
            <span className="text-text-secondary">Tiếp tục học phần:</span>
            <strong className="text-text-primary font-medium">
              Full-Stack Web Systems & High-Scale Architecture
            </strong>
            <span className="text-text-muted font-mono hidden md:inline">· 68% hoàn thành</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Sparkles size={16} className="text-accent-human" />
            <span className="text-text-secondary">
              Khám phá hệ thống học tập tích hợp đầu tiên dành cho sinh viên kỹ thuật.
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-accent-primary hover:text-white border border-border-subtle text-xs font-mono font-medium text-text-primary transition-all"
          >
            <span>{isAuthenticated ? "Vào bài học tiếp theo" : "Bắt đầu ngay"}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
