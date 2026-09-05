"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

export default function CommunityExpertsSection() {
  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 border-b border-border-subtle"
      aria-labelledby="pillars-title"
    >
      <div className="max-w-3xl mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
          <ShieldCheck size={13} />
          <span>Core Verification Pillars</span>
        </div>
        <h2
          id="pillars-title"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary"
        >
          Trụ Cột Bằng Chứng, Cộng Đồng & Chuyên Gia
        </h2>
        <p className="mt-3 text-base sm:text-lg text-text-secondary leading-relaxed">
          Nền tảng học tập không tách rời thực tế xã hội. StudentHub AI kết nối ba nguồn lực độc lập:
          Văn bản quy định gốc, Trải nghiệm thật của sinh viên và Diễn giải từ giảng viên có thẩm
          quyền.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Trust Engine Pillar */}
        <div className="bg-surface-primary border border-border-subtle hover:border-border-strong rounded-2xl p-7 flex flex-col justify-between shadow-xl transition-all hover:bg-surface-elevated/30 group">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-status-success">
              <ShieldCheck size={22} />
            </div>

            <h3 className="text-xl font-bold text-text-primary group-hover:text-status-success transition-colors">
              Trust Engine V5
            </h3>

            <p className="text-sm text-text-secondary leading-relaxed">
              Quy trình đối soát 4 tầng: Tách lọc tín hiệu, đặt vào ngữ cảnh đào tạo, đối chiếu văn
              bản quy định gốc và đưa ra phán quyết độc lập.
            </p>

            <div className="pt-4 border-t border-border-subtle text-xs font-mono text-text-muted space-y-1">
              <div>· Chống tin đồn học bổng ảo</div>
              <div>· Kiểm tra tính pháp lý văn bản</div>
              <div>· Evidence Passport bất biến</div>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <Link
              href="/trust"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-status-success hover:underline"
            >
              <span>Mở Trust Engine</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Community Intelligence Pillar */}
        <div className="bg-surface-primary border border-border-subtle hover:border-border-strong rounded-2xl p-7 flex flex-col justify-between shadow-xl transition-all hover:bg-surface-elevated/30 group">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-accent-knowledge">
              <Users size={22} />
            </div>

            <h3 className="text-xl font-bold text-text-primary group-hover:text-accent-knowledge transition-colors">
              Community Intelligence
            </h3>

            <p className="text-sm text-text-secondary leading-relaxed">
              Trí tuệ tập thể của hàng nghìn sinh viên: Báo cáo ma sát thực tế, thời gian hoàn thành
              thủ tục thật và phát hiện các chiến dịch thao túng dư luận.
            </p>

            <div className="pt-4 border-t border-border-subtle text-xs font-mono text-text-muted space-y-1">
              <div>· Ma trận nhiệt ma sát học vụ</div>
              <div>· Loại bỏ bài viết nhân bản tự động</div>
              <div>· Phân tách tin đồn và thực tế</div>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-knowledge hover:underline"
            >
              <span>Khám phá cộng đồng</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Expert Network Pillar */}
        <div className="bg-surface-primary border border-border-subtle hover:border-border-strong rounded-2xl p-7 flex flex-col justify-between shadow-xl transition-all hover:bg-surface-elevated/30 group">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-accent-human">
              <UserCheck size={22} />
            </div>

            <h3 className="text-xl font-bold text-text-primary group-hover:text-accent-human transition-colors">
              Verified Expert Network
            </h3>

            <p className="text-sm text-text-secondary leading-relaxed">
              Mạng lưới giảng viên và cố vấn học tập có xác thực danh tính, minh bạch phạm vi thẩm
              quyền và công khai các trường hợp có xung đột lợi ích (COI).
            </p>

            <div className="pt-4 border-t border-border-subtle text-xs font-mono text-text-muted space-y-1">
              <div>· Chuyên môn ≠ Thẩm quyền pháp lý</div>
              <div>· Xác thực qua email @hcmute.edu.vn</div>
              <div>· Biểu đồ quan điểm và phản biện</div>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <Link
              href="/expert"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-human hover:underline"
            >
              <span>Kết nối chuyên gia</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
