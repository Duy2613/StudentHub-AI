"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FolderKanban,
  Layers,
  Sparkles,
  Star,
} from "lucide-react";

export default function FeaturedCoursesSection() {
  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 border-b border-border-subtle"
      aria-labelledby="featured-courses-heading"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
            <BookOpen size={13} />
            <span>Curated Learning Pathways</span>
          </div>
          <h2
            id="featured-courses-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary"
          >
            Chương Trình Tiêu Biểu
          </h2>
          <p className="mt-3 text-base sm:text-lg text-text-secondary max-w-2xl">
            Thiết kế theo cấu trúc phân tầng biên tập: 1 chuyên đề trọng tâm, 2 chuyên đề bổ trợ, 1
            khóa chuyên sâu dọc và 1 đồ án thực thi thực tế.
          </p>
        </div>

        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm font-medium text-accent-knowledge hover:underline self-start md:self-auto"
        >
          <span>Xem tất cả khóa học</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Editorial Course Hierarchy: 1 Dominant, 2 Supporting, 1 Vertical, 1 Project */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* 1 Dominant Course (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-surface-primary border border-border-strong rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-accent-primary px-3 py-1 rounded-full bg-accent-primary/15 border border-accent-primary/30">
                Chuyên Đề Trọng Tâm · Dominant
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> 100% Chuẩn Enterprise
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary group-hover:text-accent-knowledge transition-colors leading-tight">
              Full-Stack Web Systems & High-Scale Architecture
            </h3>
            <p className="mt-4 text-base text-text-secondary leading-relaxed max-w-2xl">
              Từ kiến trúc render đồng thời của React 19, tối ưu hóa Turbopack đến thiết kế cơ sở
              dữ liệu quan hệ PostgreSQL với Row Level Security và mô hình Outbox Transactional an
              toàn.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-border-subtle text-xs font-mono">
              <div>
                <span className="text-text-muted block">Thời lượng:</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">14 tuần</span>
              </div>
              <div>
                <span className="text-text-muted block">Bài giảng:</span>
                <span className="text-sm font-bold text-accent-knowledge mt-0.5 block">24 bài học</span>
              </div>
              <div>
                <span className="text-text-muted block">Đồ án tích hợp:</span>
                <span className="text-sm font-bold text-status-success mt-0.5 block">3 đồ án thực</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6">
            <Link
              href="/learn/full-stack/lesson-1"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-accent-primary text-white font-medium text-sm shadow-lg shadow-accent-primary/25 hover:bg-accent-primary/90 transition-all"
            >
              <span>Bắt đầu học chuyên đề này</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right 5 Cols: 2 Supporting Courses & 1 Visual Project */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          {/* Supporting Course 1 */}
          <div className="bg-surface-primary border border-border-subtle hover:border-border-strong rounded-2xl p-6 transition-all hover:bg-surface-elevated/40 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-accent-human">Bổ trợ 1 · Intelligence</span>
              <span className="text-text-muted">18 bài</span>
            </div>
            <h4 className="font-semibold text-text-primary text-lg hover:text-accent-knowledge">
              <Link href="/learn">AI Systems Engineering & Grounded Truth</Link>
            </h4>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Mô hình RAG có căn cứ nguồn, đối chiếu văn bản quy chuẩn và phát hiện mâu thuẫn thông tin.
            </p>
          </div>

          {/* Supporting Course 2 */}
          <div className="bg-surface-primary border border-border-subtle hover:border-border-strong rounded-2xl p-6 transition-all hover:bg-surface-elevated/40 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-accent-knowledge">Bổ trợ 2 · Reliability</span>
              <span className="text-text-muted">14 bài</span>
            </div>
            <h4 className="font-semibold text-text-primary text-lg hover:text-accent-knowledge">
              <Link href="/learn">Security Engineering, RLS & Zero-Trust Auth</Link>
            </h4>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Phòng chống BOLA/IDOR, session durability, bảo mật mã hóa JWT/JWKS và phân quyền thực thể.
            </p>
          </div>

          {/* 1 Visual Capstone Project */}
          <div className="bg-gradient-to-br from-surface-primary to-surface-elevated border border-accent-knowledge/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-status-success flex items-center gap-1">
                <Sparkles size={12} /> Đồ án thực chiến
              </span>
              <span className="text-text-muted">Level 4 Verified</span>
            </div>
            <h4 className="font-semibold text-text-primary text-lg">
              <Link href="/cases" className="hover:text-accent-knowledge">
                Evidence Case Lab & Digital Twin
              </Link>
            </h4>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Xây dựng hệ thống giải quyết tranh chấp thông tin học vụ giữa quy chuẩn chính thức và
              thực tế vận hành của sinh viên.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
