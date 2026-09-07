"use client";

import React, { useState } from "react";
import { BookOpen, Sparkles, ArrowRight, Clock } from "lucide-react";

export default function KnowledgeDomainsCatalog({ onOpenAdvisory }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "Tất cả lĩnh vực" },
    { id: "cs", label: "Khoa học Máy tính & AI" },
    { id: "robotics", label: "Robot & Hệ thống Nhúng" },
    { id: "finance", label: "Tài chính Định lượng" },
    { id: "bio", label: "Khoa học Dữ liệu & Bio" },
  ];

  const courses = [
    {
      id: "cs-ai",
      category: "cs",
      code: "AINT3308",
      title: "Trí Tuệ Nhân Tạo & Deep Learning V2",
      credits: "4 Tín chỉ",
      semester: "HK1 / Năm 3",
      prereq: "PROG1301 (Nhập môn Lập trình)",
      desc: "Kiến trúc Transformer, Huấn luyện mô hình suy luận, Phản biện nhận thức Epistemic DAG và phòng chống Adversarial Attacks.",
      badge: "HOT 2026",
      badgeColor: "bg-teal-400 text-black",
      difficulty: "Chuyên sâu",
      aiTutor: "Hỗ trợ 24/7",
    },
    {
      id: "cs-swen",
      category: "cs",
      code: "SWEN3301",
      title: "Kiến Trúc Phần Mềm & MLOps Tiên Tiến",
      credits: "3 Tín chỉ",
      semester: "HK2 / Năm 3",
      prereq: "OOP2302 (Lập trình Hướng đối tượng)",
      desc: "Quy trình CI/CD tự động, Triển khai mô hình AI trên Kubernetes, Bảo mật OWASP GenAI 2025 và kiểm thử đột biến.",
      badge: "CORE GATEWAY",
      badgeColor: "bg-indigo-400 text-black",
      difficulty: "Trung bình khá",
      aiTutor: "Hỗ trợ 24/7",
    },
    {
      id: "robo-auto",
      category: "robotics",
      code: "ROBO3302",
      title: "Điều Khiển Robot & Thị Giác Máy Tính",
      credits: "4 Tín chỉ",
      semester: "HK1 / Năm 4",
      prereq: "MATH2301 (Đại số Tuyến tính)",
      desc: "Thuật toán SLAM định vị không gian, Lập trình cánh tay Robot 6 bậc tự do và nhận diện vật thể thời gian thực.",
      badge: "LAB INTENSIVE",
      badgeColor: "bg-cyan-400 text-black",
      difficulty: "Nâng cao",
      aiTutor: "Hỗ trợ 24/7",
    },
    {
      id: "fin-quant",
      category: "finance",
      code: "QFIN4301",
      title: "Mô Hình Tài Chính Định Lượng & Rủi Ro",
      credits: "3 Tín chỉ",
      semester: "HK2 / Năm 3",
      prereq: "STAT2301 (Xác suất Thống kê)",
      desc: "Mô phỏng Monte Carlo dự báo dòng tiền, Thuật toán tối ưu danh mục đầu tư Markowitz và phát hiện gian lận thanh toán.",
      badge: "HIGH SALARY",
      badgeColor: "bg-amber-400 text-black",
      difficulty: "Chuyên sâu",
      aiTutor: "Hỗ trợ 24/7",
    },
    {
      id: "data-bio",
      category: "bio",
      code: "BDAT3305",
      title: "Khoa Học Dữ Liệu Sinh Học & Gen AI",
      credits: "4 Tín chỉ",
      semester: "HK1 / Năm 4",
      prereq: "GENE2301 (Sinh học Phân tử)",
      desc: "Dự đoán cấu trúc protein 3D bằng AlphaFold, Phân tích biến dị di truyền SNP và khớp nối dữ liệu y khoa bảo mật.",
      badge: "RESEARCH GATE",
      badgeColor: "bg-purple-400 text-black",
      difficulty: "Chuyên sâu",
      aiTutor: "Hỗ trợ 24/7",
    },
    {
      id: "cs-cloud",
      category: "cs",
      code: "CLOD3304",
      title: "Điện Toán Đám Mây & Phân Tán Toàn Cầu",
      credits: "3 Tín chỉ",
      semester: "HK2 / Năm 3",
      prereq: "NWEN2301 (Mạng Máy tính)",
      desc: "Thiết kế hệ thống chịu lỗi cao, Cơ chế đồng thuận Raft/Paxos, Tối ưu hóa bộ nhớ đệm phân tán Redis và Edge CDN.",
      badge: "INDUSTRY READY",
      badgeColor: "bg-emerald-400 text-black",
      difficulty: "Trung bình",
      aiTutor: "Hỗ trợ 24/7",
    },
  ];

  const filteredCourses = activeCategory === "all" 
    ? courses 
    : courses.filter(c => c.category === activeCategory);

  return (
    <section className="relative py-24 border-t border-white/10 bg-[#060813]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-xs font-semibold text-teal-300">
              <BookOpen className="h-3 w-3" />
              <span>DANH MỤC HỌC THUẬT &amp; CHUẨN ĐẦU RA</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Học Phần Trọng Điểm &amp; <br />
              <span className="font-serif italic font-normal text-teal-300">
                Đồ Thị Tri Thức Tiên Quyết
              </span>
            </h2>
          </div>
          <button
            onClick={onOpenAdvisory}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-5 py-2.5 font-mono text-xs font-bold text-white hover:bg-white/10 transition-all self-start md:self-auto"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>Tự Động Lập Kế Hoạch Học Kỳ</span>
          </button>
        </div>

        {/* Category Filter Tabs (Chonweb style) */}
        <div className="flex flex-wrap gap-2 mb-10 border-b border-white/10 pb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-4 py-2 font-mono text-xs transition-all duration-200 ${
                activeCategory === cat.id
                  ? "bg-teal-400 text-black font-black shadow-[0_0_20px_rgba(52,231,196,0.35)]"
                  : "border border-white/10 bg-white/[0.03] text-gray-400 hover:text-white hover:border-white/20"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              data-cursor-text="Học thử"
              className="interactive-card group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e1329]/80 to-[#070a16]/95 p-6 backdrop-blur-xl transition-all duration-300 hover:border-teal-400/50 hover:scale-[1.01]"
            >
              <div>
                {/* Header with code and badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-teal-300">
                    {c.code} · {c.credits}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-black uppercase ${c.badgeColor}`}>
                    {c.badge}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-black text-white group-hover:text-teal-200 transition-colors">
                  {c.title}
                </h3>

                <p className="mt-2.5 text-xs text-gray-300 leading-relaxed">
                  {c.desc}
                </p>
              </div>

              {/* Course Meta Footprint */}
              <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-teal-400" />
                    <span>{c.semester}</span>
                  </span>
                  <span className="text-teal-400 font-semibold">{c.aiTutor}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span className="text-gray-500 truncate max-w-[200px]" title={c.prereq}>
                    Tiên quyết: {c.prereq}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-gray-300">
                    {c.difficulty}
                  </span>
                </div>

                <button
                  onClick={onOpenAdvisory}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-teal-400/30 bg-teal-400/10 py-2.5 font-mono text-xs font-bold text-teal-300 transition-all group-hover:bg-teal-400 group-hover:text-black shadow-sm"
                >
                  <span>Mở Trợ Lý AI Học Phần Này</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
