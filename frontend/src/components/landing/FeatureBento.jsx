"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Brain, 
  ShieldCheck, 
  Compass, 
  Layers, 
  CheckCircle2, 
  ArrowUpRight, 
  FileText, 
  Activity, 
  Cpu, 
  BookOpenCheck,
  TrendingUp,
  Share2,
  Workflow
} from "lucide-react";

export default function FeatureBento() {
  const [activeSubject, setActiveSubject] = useState("cs");

  const SUBJECTS = {
    cs: {
      name: "Khoa Học Máy Tính & AI",
      formula: "T(n) = 2T(n/2) + O(n) \\Rightarrow \\Theta(n \\log n)",
      desc: "Áp dụng định lý thợ (Master Theorem) giải độ phức tạp thuật toán chia để trị.",
    },
    econ: {
      name: "Kinh Tế & Tài Chính",
      formula: "MR = MC \\Rightarrow \\max \\pi(Q) = TR(Q) - TC(Q)",
      desc: "Tối ưu hoá lợi nhuận doanh nghiệp trong thị trường cạnh tranh hoàn hảo.",
    },
    med: {
      name: "Y - Dược & Sinh Học",
      formula: "C_m = \\frac{D}{V_d \\times (1 - e^{-k_e \\tau})}",
      desc: "Tính toán nồng độ thuốc cực đại trạng thái ổn định trong dược động học.",
    },
  };

  return (
    <section id="features" className="py-20 md:py-28 relative">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Kiến Trúc Học Tập Toàn Diện Được Thiết Kế Cho{" "}
            <span className="text-gradient-primary">Sinh Viên Thế Hệ Mới</span>
          </h2>
          <p className="mt-4 text-base text-gray-400 leading-relaxed">
            Không chỉ là một chatbot thông thường. StudentHub AI kết hợp sức mạnh suy luận đa thể thức và chuyên môn học thuật thực chứng từ các chuyên gia hàng đầu.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Bento Tile 1: 2-Columns Span (AI Socratic Study Engine) */}
          <div className="md:col-span-2 relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-space-900/90 via-space-950/90 to-space-900/60 border border-white/10 hover:border-indigo-500/30 transition-all duration-300 group overflow-hidden shadow-glass-deep">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col h-full justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Brain className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Socratic Method 2.0
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
                  Trợ Lý Học Thuật AI Đa Ngành & Giải Trình Toán Học
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                  Hướng dẫn sinh viên tự tư duy qua từng bước suy luận, tự động chuyển đổi giáo trình PDF thành bản đồ tri thức (Mindmap) và diễn giải công thức chuẩn LaTeX.
                </p>
              </div>

              {/* Interactive Subject Switcher Preview */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <span className="text-xs text-gray-400 font-medium">Chọn chuyên ngành để xem ví dụ suy luận:</span>
                  <div className="flex gap-1.5">
                    {Object.keys(SUBJECTS).map((key) => (
                      <button
                        key={key}
                        onClick={() => setActiveSubject(key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          activeSubject === key
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {key === "cs" ? "CNTT" : key === "econ" ? "Kinh Tế" : "Y Dược"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-space-950/80 border border-indigo-500/20 font-mono">
                  <div className="text-[11px] text-indigo-400 font-semibold mb-1">
                    {SUBJECTS[activeSubject].name}
                  </div>
                  <div className="text-xs text-white bg-white/5 p-2 rounded-lg my-1.5 overflow-x-auto text-center border border-white/5 text-gradient-cyan font-bold">
                    {SUBJECTS[activeSubject].formula}
                  </div>
                  <div className="text-xs text-gray-300 font-sans mt-1.5">
                    {SUBJECTS[activeSubject].desc}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Tile 2: 1-Column Span (Verified Expert Network) */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-space-900/90 via-space-950/90 to-space-900/60 border border-white/10 hover:border-purple-500/30 transition-all duration-300 group overflow-hidden shadow-glass-deep">
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-purple-500/15 rounded-full blur-[70px] pointer-events-none" />

            <div className="flex flex-col h-full justify-between gap-6 relative z-10">
              <div>
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                  Cố Vấn Chuyên Gia Xác Thực
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Được cố vấn trực tiếp bởi các Tiến sĩ, Thạc sĩ, Giảng viên và Tech Lead đầu ngành với Trust Score minh bạch.
                </p>
              </div>

              {/* Verified Mentor Badge Card */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                    ĐN
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">TS. Nguyễn Minh Đức</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-[10px] text-gray-400">Trưởng Lab AI & Hệ thống Thông minh</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                  <span className="text-gray-400">Trust Score</span>
                  <span className="text-emerald-400 font-bold font-mono">99.8 / 100 ⭐</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Tile 3: 1-Column Span (Smart Knowledge Graph & Retention) */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-space-900/90 via-space-950/90 to-space-900/60 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group overflow-hidden shadow-glass-deep">
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-[70px] pointer-events-none" />

            <div className="flex flex-col h-full justify-between gap-6 relative z-10">
              <div>
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit mb-4">
                  <Layers className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                  Ghi Nhớ Spaced Repetition
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Thuật toán ngắt quãng thời gian ôn tập tự động nhắc lại kiến thức đúng điểm rơi của đường cong lãng quên (Ebbinghaus).
                </p>
              </div>

              {/* Retention Graph Metric */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-400 font-medium">Khả năng ghi nhớ sau 30 ngày:</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-cyan-400 font-bold">Học cùng StudentHub AI</span>
                      <span className="text-cyan-300 font-mono font-bold">88%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="w-[88%] h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-400">Cách học nhồi nhét cũ</span>
                      <span className="text-gray-400 font-mono">18%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="w-[18%] h-full bg-gray-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Tile 4: 2-Columns Span (Career & Thesis Launchpad) */}
          <div className="md:col-span-2 relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-space-900/90 via-space-950/90 to-space-900/60 border border-white/10 hover:border-amber-500/30 transition-all duration-300 group overflow-hidden shadow-glass-deep">
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex flex-col h-full justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Career Launchpad
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
                  Định Hướng Sự Nghiệp, Review CV & Đề Tài Khóa Luận
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                  AI đối chiếu hồ sơ năng lực của bạn với hàng ngàn bản mô tả công việc (JD) thực tế, đề xuất các dự án capstone trọng tâm và chuẩn bị phỏng vấn kỹ thuật sát sườn.
                </p>
              </div>

              {/* Match Scoreboard Simulation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="p-3 rounded-xl bg-space-950/80 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">Độ tương thích JD</span>
                    <span className="text-sm font-bold text-white">Software Engineer Intern</span>
                  </div>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">94%</span>
                </div>

                <div className="p-3 rounded-xl bg-space-950/80 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">Đồ Án / Luận Văn</span>
                    <span className="text-sm font-bold text-white">Xác thực Đề tài NCKH</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    Đã duyệt
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
