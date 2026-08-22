"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Award, 
  ArrowRight,
  Sparkles,
  Building,
  GraduationCap
} from "lucide-react";

export default function ExpertShowcase() {
  const [activeCategory, setActiveCategory] = useState("all");

  const CATEGORIES = [
    { id: "all", label: "Tất Cả Lĩnh Vực" },
    { id: "tech", label: "Công Nghệ & AI" },
    { id: "business", label: "Kinh Tế & Quản Trị" },
    { id: "science", label: "Khoa Học & Y Học" },
  ];

  const EXPERTS = [
    {
      id: "expert-1",
      name: "TS. Nguyễn Minh Đức",
      title: "Chuyên gia AI & Học máy",
      affiliation: "Trưởng Lab AI - ĐHQG TP.HCM",
      category: "tech",
      rating: 4.98,
      reviewsCount: 184,
      answersCount: 420,
      trustScore: 99,
      badge: "⭐ Chuyên Gia Đầu Ngành",
      avatarInitials: "MĐ",
      avatarGradient: "from-indigo-500 to-purple-600",
      skills: ["Deep Learning", "LLM", "Computer Vision", "Khóa luận AI"],
    },
    {
      id: "expert-2",
      name: "ThS. Trần Hoàng Nam",
      title: "Kiến trúc sư Phần mềm (Tech Lead)",
      affiliation: "Senior Cloud Architect · Cựu Kỹ sư FPT/Grab",
      category: "tech",
      rating: 4.95,
      reviewsCount: 142,
      answersCount: 310,
      trustScore: 98,
      badge: "⭐ Mentor Thực Chiến",
      avatarInitials: "HN",
      avatarGradient: "from-blue-500 to-cyan-500",
      skills: ["System Design", "Microservices", "DevOps", "Review CV"],
    },
    {
      id: "expert-3",
      name: "PGS. TS. Lê Thu Hà",
      title: "Giảng viên Cao cấp / Cố vấn NCKH",
      affiliation: "Khoa CNTT - ĐH Bách Khoa",
      category: "science",
      rating: 4.96,
      reviewsCount: 165,
      answersCount: 380,
      trustScore: 99,
      badge: "⭐ Cố Vấn Nghiên Cứu",
      avatarInitials: "TH",
      avatarGradient: "from-purple-500 to-pink-500",
      skills: ["Data Science", "Giải thuật Nâng cao", "Bài báo Quốc tế", "Thống kê"],
    },
    {
      id: "expert-4",
      name: "TS. Vũ Thanh Mai",
      title: "Chuyên gia Kinh tế & Thẩm định Dự án",
      affiliation: "Viện Kinh tế Quốc tế - ĐH Ngoại Thương",
      category: "business",
      rating: 4.92,
      reviewsCount: 98,
      answersCount: 220,
      trustScore: 97,
      badge: "⭐ Cố Vấn Tài Chính",
      avatarInitials: "TM",
      avatarGradient: "from-amber-500 to-orange-500",
      skills: ["Kinh tế lượng", "Tài chính Doanh nghiệp", "Đề án Khởi nghiệp"],
    },
    {
      id: "expert-5",
      name: "ThS. BS. Phan Quốc Bảo",
      title: "Giảng viên Y Khoa & Dược lý",
      affiliation: "Bộ môn Dược lý Lâm sàng - ĐH Y Dược",
      category: "science",
      rating: 4.97,
      reviewsCount: 110,
      answersCount: 290,
      trustScore: 99,
      badge: "⭐ Chuyên Gia Y Khoa",
      avatarInitials: "QB",
      avatarGradient: "from-emerald-500 to-teal-500",
      skills: ["Dược lý", "Sinh lý học", "Bệnh học", "Luận văn Y học"],
    },
    {
      id: "expert-6",
      name: "ThS. Đỗ Thảo Linh",
      title: "Product Design Lead & Mentor UI/UX",
      affiliation: "Senior Designer tại Fintech Unicorn",
      category: "tech",
      rating: 4.94,
      reviewsCount: 88,
      answersCount: 195,
      trustScore: 96,
      badge: "⭐ Design Mentor",
      avatarInitials: "TL",
      avatarGradient: "from-rose-500 to-indigo-500",
      skills: ["UI/UX Design", "Design System", "Product Thinking", "Portfolio Review"],
    },
  ];

  const filteredExperts = activeCategory === "all"
    ? EXPERTS
    : EXPERTS.filter((exp) => exp.category === activeCategory);

  return (
    <section id="experts" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Mạng Lưới Cố Vấn & Chuyên Gia{" "}
              <span className="text-gradient-primary">Được Xác Thực Uy Tín</span>
            </h2>
            <p className="mt-3 text-base text-gray-400">
              Không còn lo lắng về độ tin cậy. Mọi câu hỏi chuyên sâu, đồ án và định hướng của bạn đều có thể được phản biện bởi các chuyên gia đầu ngành.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-neon-primary"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expert Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((exp) => (
            <div
              key={exp.id}
              className="p-6 rounded-3xl bg-space-950/80 border border-white/10 hover:border-indigo-500/40 transition-all duration-300 group shadow-glass-deep flex flex-col justify-between"
            >
              <div>
                {/* Header with Avatar & Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${exp.avatarGradient} p-[2px] shadow-md group-hover:scale-105 transition-transform`}>
                      <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center font-bold text-white text-sm">
                        {exp.avatarInitials}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {exp.name}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1">{exp.title}</p>
                    </div>
                  </div>
                </div>

                {/* Affiliation */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{exp.affiliation}</span>
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {exp.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer Metrics & Action */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold font-mono">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{exp.rating}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="font-semibold text-gray-300">{exp.answersCount}</span> lời giải
                  </div>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 group/btn"
                >
                  <span>Kết nối</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action for Mentors */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-space-950 via-indigo-950/20 to-space-950 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-indigo-400 shrink-0 hidden sm:block" />
            <div>
              <h4 className="text-sm font-bold text-white">Bạn là Giảng viên, Nghiên cứu sinh hoặc Tech Lead?</h4>
              <p className="text-xs text-gray-400">Gia nhập mạng lưới Chuyên gia StudentHub AI để lan tỏa tri thức và nhận thù lao cố vấn xứng đáng.</p>
            </div>
          </div>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all shrink-0"
          >
            Đăng Ký Làm Cố Vấn
          </Link>
        </div>

      </div>
    </section>
  );
}
