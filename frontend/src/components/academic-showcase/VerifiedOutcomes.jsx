"use client";

import React from "react";
import { CheckCircle2, TrendingUp, ShieldAlert, Award, Star } from "lucide-react";

export default function VerifiedOutcomes() {
  const stats = [
    {
      metric: "98.5%",
      label: "Bảo Toàn Chuẩn Đầu Ra",
      desc: "Sinh viên tuân thủ lộ trình Digital Twin hoàn thành Khóa luận và tốt nghiệp đúng kỳ vọng.",
      icon: Award,
    },
    {
      metric: "0.9412",
      label: "F1 Score TEVV Benchmark",
      desc: "Kiểm chuẩn khoa học độc quyền phát hiện chiêu trò bẫy lừa đảo học bổng và thực tập.",
      icon: TrendingUp,
    },
    {
      metric: "96.2%",
      label: "Độ Chính Xác Từ Chối Bịa Đặt",
      desc: "Hệ thống OOD dám từ chối các câu hỏi nằm ngoài thẩm quyền và tài liệu được kiểm chứng.",
      icon: ShieldAlert,
    },
    {
      metric: "100%",
      label: "Truy Xuất Nguồn Gốc Bằng Chứng",
      desc: "Mọi thông báo hạn chót, học phí đều đính kèm mã SHA-256 đối soát trực tiếp từ cổng nhà trường.",
      icon: CheckCircle2,
    },
  ];

  const stories = [
    {
      quote: "Nhờ What-If Engine phát hiện trước môn SWEN3301 là nút thắt tiên quyết cho Khóa luận, mình đã kịp đăng ký học kỳ hè và rút ngắn thời gian ra trường được hẳn 1 học kỳ!",
      author: "Trần Bảo Long",
      cohort: "Sinh viên K24 · Kỹ thuật Phần mềm",
      achievement: "Tốt nghiệp sớm 3.5 năm · GPA 3.72",
    },
    {
      quote: "Hồi đầu năm 3 mình nhận được email tuyển thực tập lương cao yêu cầu nộp cọc. Đưa link vào Trust Engine, hệ thống báo đỏ ngay lập tức do domain giả mạo và phát hiện lừa đảo!",
      author: "Nguyễn Hoàng Mai",
      cohort: "Sinh viên K25 · Hệ thống Thông tin",
      achievement: "Tránh bẫy lừa đảo 15 triệu VNĐ",
    },
  ];

  return (
    <section className="relative py-24 border-t border-white/10 bg-[#070a14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-xs font-semibold text-teal-300">
            <Star className="h-3 w-3 fill-teal-300" />
            <span>KẾT QUẢ THỰC TẾ &amp; ĐO LƯỜNG KHOA HỌC</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Bảo Chứng Năng Lực Bằng <br />
            <span className="font-serif italic font-normal text-teal-300">
              Số Liệu Khoa Học &amp; Minh Chứng Thực Tế
            </span>
          </h2>
          <p className="text-sm text-gray-400 font-mono">
            Tuân thủ hiến pháp Zero Fabrication — Không bao giờ dùng số liệu thống kê ngụy tạo.
          </p>
        </div>

        {/* 4 Pillars Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="interactive-card flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 backdrop-blur-xl"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 border border-teal-400/30 text-teal-300 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-mono text-3xl font-black text-white">{st.metric}</div>
                  <h4 className="mt-2 text-sm font-bold text-teal-300">{st.label}</h4>
                  <p className="mt-1 text-xs text-gray-400 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Student Testimonials Stories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map((s, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-[#0c1129] to-[#060815] p-8 space-y-4 backdrop-blur-2xl shadow-xl"
            >
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-200 italic leading-relaxed">
                &ldquo;{s.quote}&rdquo;
              </p>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{s.author}</div>
                  <div className="font-mono text-xs text-teal-400">{s.cohort}</div>
                </div>
                <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 font-mono text-[10px] font-bold text-teal-300">
                  {s.achievement}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
