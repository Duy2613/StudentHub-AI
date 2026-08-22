"use client";

import React, { useState } from "react";
import { 
  XCircle, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Zap, 
  Sliders,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function InteractiveComparison() {
  const [studyHours, setStudyHours] = useState(20);

  const hoursSaved = Math.round(studyHours * 0.62);
  const potentialGpaBoost = (0.4 + (studyHours / 40) * 0.5).toFixed(1);

  const COMPARISON_ROWS = [
    {
      aspect: "Tra cứu tài liệu & Giải đáp học thuật",
      traditional: "Mất 2-4 tiếng tìm kiếm rời rạc trên diễn đàn, độ chính xác không được kiểm chứng.",
      studenthub: "Trích xuất kiến thức trọng tâm trong 5 giây kèm dẫn nguồn giáo trình chuẩn mực.",
    },
    {
      aspect: "Khi gặp bài toán khó / Bế tắc đồ án",
      traditional: "Dễ chán nản khi không có người hướng dẫn, mất hàng tuần để tìm giải pháp.",
      studenthub: "AI Socratic gợi ý tư duy từng bước + Cố vấn Tiến sĩ/Tech Lead đồng hành giải đáp.",
    },
    {
      aspect: "Ôn tập thi cử & Ghi nhớ kiến thức",
      traditional: "Học vẹt nhồi nhét thâu đêm, quên hơn 80% kiến thức chỉ sau 2 tuần thi xong.",
      studenthub: "Hệ thống Flashcards & Spaced Repetition thông minh giúp duy trì trí nhớ dài hạn.",
    },
    {
      aspect: "Chuẩn bị CV & Thực tập doanh nghiệp",
      traditional: "Hồ sơ xin việc chung chung, mù mờ về yêu cầu tuyển dụng thực tế của thị trường.",
      studenthub: "AI quét đối chiếu kỹ năng với JD thực tế và nhận đánh giá 1:1 từ Senior Tech Lead.",
    },
  ];

  return (
    <section id="comparison" className="py-20 md:py-28 bg-space-900/30 border-y border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Cách Học Truyền Thống vs{" "}
            <span className="text-gradient-cyan">Bứt Phá Với StudentHub AI</span>
          </h2>
          <p className="mt-4 text-base text-gray-400 leading-relaxed">
            Chứng kiến sự khác biệt rõ rệt khi bạn trang bị trợ lý trí tuệ nhân tạo và mạng lưới cố vấn học thuật đồng hành.
          </p>
        </div>

        {/* Comparison Table / Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          
          {/* Traditional Way */}
          <div className="p-6 sm:p-8 rounded-3xl bg-space-950/80 border border-rose-500/20 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-200">Cách Học Truyền Thống</h3>
                <span className="text-xs text-rose-400/90 font-medium">Tốn thời gian & Dễ quá tải</span>
              </div>
            </div>

            <div className="space-y-4">
              {COMPARISON_ROWS.map((row, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-xs font-semibold text-gray-400 block">{row.aspect}</span>
                  <p className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-rose-400 text-base leading-none">✕</span>
                    <span>{row.traditional}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* StudentHub AI Way */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-space-950 to-space-950 border border-indigo-500/30 shadow-neon-primary space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">StudentHub AI Platform</h3>
                  <span className="text-xs text-indigo-400 font-semibold">Tối ưu hoá & Đột phá hiệu suất</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Hiệu quả x3
              </span>
            </div>

            <div className="space-y-4">
              {COMPARISON_ROWS.map((row, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1">
                  <span className="text-xs font-semibold text-indigo-300 block">{row.aspect}</span>
                  <p className="text-sm text-gray-200 flex items-start gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{row.studenthub}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Interactive ROI / Study Efficiency Calculator */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-space-950 via-space-900 to-space-950 border border-white/10 shadow-glass-deep">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Slider Input */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Ước Tính Hiệu Suất Của Bạn</h3>
              </div>
              <p className="text-xs text-gray-400">
                Kéo thanh trượt để xem bạn sẽ tiết kiệm được bao nhiêu thời gian mỗi tuần:
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300 font-medium">Thời gian tự học hàng tuần:</span>
                  <span className="text-lg font-extrabold text-indigo-400 font-mono">{studyHours} giờ/tuần</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>5 giờ</span>
                  <span>20 giờ</span>
                  <span>40 giờ</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Result */}
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-indigo-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold">Tiết kiệm được</span>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  ~{hoursSaved} <span className="text-sm font-sans font-medium text-gray-300">giờ/tuần</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Dành cho nghỉ ngơi & phát triển dự án</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-semibold">Tiềm năng tăng</span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-300 font-mono">
                  +{potentialGpaBoost} <span className="text-sm font-sans font-medium text-gray-300">GPA</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Dựa trên kết quả khảo sát sinh viên</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
