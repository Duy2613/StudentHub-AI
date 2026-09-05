"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  FolderKanban,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function PracticeProjectLabSection() {
  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 border-b border-border-subtle"
      aria-labelledby="practice-projects-title"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <BrainCircuit size={13} />
            <span>Applied Mastery</span>
          </div>
          <h2
            id="practice-projects-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary"
          >
            Luyện Tư Duy & Đồ Án Thực Chiến
          </h2>
          <p className="mt-3 text-base sm:text-lg text-text-secondary max-w-2xl">
            Từ việc đối mặt với các cạm bẫy bảo mật đến xây dựng hệ thống hoàn chỉnh có chứng thực.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Practice Lab Card */}
        <div className="bg-surface-primary border border-border-strong rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Code2 size={24} />
            </div>

            <h3 className="text-2xl font-bold text-text-primary group-hover:text-accent-knowledge transition-colors">
              Phòng Luyện Tập Tư Duy Kỹ Sư
            </h3>

            <p className="text-sm text-text-secondary leading-relaxed">
              Các thử thách tình huống thực tế: sửa lỗi BOLA, xử lý tranh chấp deadlock trong
              PostgreSQL, ngăn ngừa cache stampede và tối ưu hóa chi phí điện toán.
            </p>

            <div className="pt-4 border-t border-border-subtle space-y-2 text-xs font-mono text-text-muted">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                <span>Quy trình 5 bước: Đề bài → Tự suy luận → Triển khai → Gợi ý → Đối chiếu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-knowledge" />
                <span>Không sinh sẵn lời giải cho đến khi bạn thực sự nỗ lực</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6">
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-white font-medium text-sm shadow-md shadow-accent-primary/20 hover:bg-accent-primary/90 transition-all"
            >
              <span>Vào phòng thực hành</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Projects Showcase Card */}
        <div className="bg-surface-primary border border-border-strong rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-accent-knowledge">
              <FolderKanban size={24} />
            </div>

            <h3 className="text-2xl font-bold text-text-primary group-hover:text-accent-knowledge transition-colors">
              Bộ Sưu Tập Đồ Án & Capstone
            </h3>

            <p className="text-sm text-text-secondary leading-relaxed">
              Các công trình sản xuất thực thụ với mã nguồn mở, tài liệu kiến trúc (ADR), bộ kiểm chuẩn
              hiệu năng và bằng chứng xác thực từ hội đồng học vụ.
            </p>

            <div className="pt-4 border-t border-border-subtle space-y-2 text-xs font-mono text-text-muted">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                <span>Living Evidence Passport tích hợp chữ ký mật mã</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-human" />
                <span>Được sinh viên và giảng viên bình duyệt độc lập</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-strong text-text-primary font-medium text-sm transition-all"
            >
              <span>Khám phá đồ án mẫu</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
