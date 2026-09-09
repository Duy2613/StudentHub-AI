"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Award,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MessageSquareCheck,
  GraduationCap,
  Scale,
} from "lucide-react";

/**
 * CommunityExpertCouncilSection — Hai Luồng Tín Hiệu Hội Tụ Thành Tri Thức
 * StudentHub Visual System VNext — "Khai Minh"
 * - Visual metaphor: Community Signal \ + Expert Review / → Knowledge Consensus
 * - Collective intelligence + Authority / Expertise
 */

export default function CommunityExpertCouncilSection() {
  return (
    <section
      className="py-24 lg:py-32 border-b border-white/[0.08] bg-[#08110F] relative overflow-hidden"
      aria-labelledby="community-expert-title"
    >
      {/* Background Subtle Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#7BE0B2]/[0.02] blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header: Editorial Framing */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest text-[#7BE0B2] bg-[#0F1B18] border border-white/[0.1] uppercase mb-4">
            05 / Đồng Thuận Tri Thức
          </div>
          <h2
            id="community-expert-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E6] leading-[1.15]"
          >
            Trí tuệ tập thể gặp <span className="font-serif italic text-[#7BE0B2]">thẩm quyền chuyên môn.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#C3CCC6] leading-relaxed max-w-2xl mx-auto">
            Một nguồn tin đơn lẻ rất dễ sai lệch. StudentHub kết nối hai luồng minh chứng:
            trải nghiệm thực tế từ sinh viên và thẩm định phạm vi từ hội đồng giảng viên.
          </p>
        </div>

        {/* Visual Metaphor: Dual Streams Converging into Knowledge Consensus */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Stream 1: Community Signal (Left 4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-2xl bg-[#0D1614] border border-white/[0.08] flex flex-col justify-between text-left space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#7BE0B2]/10 border border-[#7BE0B2]/20 flex items-center justify-center text-[#7BE0B2]">
                <Users size={20} />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#8A9891] uppercase tracking-wider">Luồng 01</div>
                <h3 className="text-xl font-bold text-[#F4F0E6]">Tín hiệu Cộng đồng</h3>
              </div>
              <p className="text-sm text-[#C3CCC6] leading-relaxed">
                Minh chứng thực tế từ hàng nghìn sinh viên: phản hồi học phần, đề thi các năm, cảnh báo chủ trọ và chia sẻ tài liệu học tập có kiểm duyệt.
              </p>

              <div className="space-y-2.5 pt-2 border-t border-white/[0.06] text-xs font-mono">
                <div className="flex items-center justify-between text-[#8A9891]">
                  <span>Minh chứng đã gửi</span>
                  <span className="text-[#F4F0E6] font-bold">14,280+</span>
                </div>
                <div className="flex items-center justify-between text-[#8A9891]">
                  <span>Điểm phản biện cộng đồng</span>
                  <span className="text-[#7BE0B2] font-bold">96.8%</span>
                </div>
                <div className="flex items-center justify-between text-[#8A9891]">
                  <span>Kiểm duyệt chống spam</span>
                  <span className="text-[#F4F0E6]">Tự động & thủ công</span>
                </div>
              </div>
            </div>

            <Link
              href="/community"
              className="inline-flex items-center gap-2 text-xs font-mono text-[#7BE0B2] hover:text-[#8EF0C2] font-semibold transition-colors"
            >
              <span>Khám phá Diễn đàn Sinh viên</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Convergence Center: Knowledge Consensus (Center 4 cols) */}
          <div className="lg:col-span-4 double-bezel-wrapper flex flex-col justify-between text-center">
            <div className="double-bezel-inner h-full flex flex-col justify-between p-6 sm:p-8 text-center space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#7BE0B2]/15 border border-[#7BE0B2]/30 flex items-center justify-center text-[#7BE0B2] shadow-lg shadow-[#7BE0B2]/10">
                  <ShieldCheck size={26} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono text-[#7BE0B2] uppercase tracking-widest font-bold">Điểm Hội Tụ</div>
                  <h3 className="text-2xl font-bold text-[#F4F0E6]">Đồng Thuận Tri Thức</h3>
                </div>
                <p className="text-sm text-[#C3CCC6] leading-relaxed">
                  Khi tiếng nói sinh viên gặp sự chứng thực của cố vấn, thông tin trở thành <strong>sự thật học thuật</strong> được lưu trữ an toàn trong kho lưu trữ StudentHub.
                </p>

                <div className="p-4 rounded-xl bg-[#08110F] border border-white/[0.08] text-left space-y-2">
                  <div className="flex items-center gap-2 text-[#7BE0B2] font-bold font-mono text-xs">
                    <Scale size={14} />
                    <span>NGUYÊN TẮC ĐỐI SOÁT</span>
                  </div>
                  <p className="text-sm text-[#C3CCC6] leading-relaxed">
                    Không thiên vị cá nhân, không xóa phản ánh trung thực, đối chiếu văn bản quy phạm làm thước đo cao nhất.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <span className="text-xs font-mono text-[#8A9891]">
                  Chuẩn hóa bởi StudentHub Evidence Protocol
                </span>
              </div>
            </div>
          </div>

          {/* Stream 2: Expert Review (Right 4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-2xl bg-[#0D1614] border border-white/[0.08] flex flex-col justify-between text-left space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#F3C56B]/10 border border-[#F3C56B]/20 flex items-center justify-center text-[#F3C56B]">
                <GraduationCap size={20} />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#8A9891] uppercase tracking-wider">Luồng 02</div>
                <h3 className="text-xl font-bold text-[#F4F0E6]">Hội đồng Chuyên gia</h3>
              </div>
              <p className="text-sm text-[#C3CCC6] leading-relaxed">
                Giảng viên đại học, cố vấn đào tạo và cựu sinh viên ưu tú có thẩm quyền được xác thực. Khảo chứng nội dung trong đúng phạm vi chuyên môn được ủy quyền.
              </p>

              <div className="space-y-2.5 pt-2 border-t border-white/[0.06] text-xs font-mono">
                <div className="flex items-center justify-between text-[#8A9891]">
                  <span>Chuyên gia xác thực</span>
                  <span className="text-[#F4F0E6] font-bold">180+ Giảng viên</span>
                </div>
                <div className="flex items-center justify-between text-[#8A9891]">
                  <span>Phạm vi thẩm định</span>
                  <span className="text-[#F3C56B] font-bold">Đúng ngành & đúng khoa</span>
                </div>
                <div className="flex items-center justify-between text-[#8A9891]">
                  <span>Chứng thực danh tính</span>
                  <span className="text-[#F4F0E6]">Ký số & email trường</span>
                </div>
              </div>
            </div>

            <Link
              href="/expert"
              className="inline-flex items-center gap-2 text-xs font-mono text-[#F3C56B] hover:text-[#f8d99c] font-semibold transition-colors"
            >
              <span>Xem Mạng lưới Chuyên gia</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
