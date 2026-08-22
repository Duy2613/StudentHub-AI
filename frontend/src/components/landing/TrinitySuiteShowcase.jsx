"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Bot, 
  FileText, 
  Sliders, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Cpu, 
  GraduationCap,
  ShieldCheck,
  Star
} from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { motion, AnimatePresence } from "motion/react";

export default function TrinitySuiteShowcase() {
  const [activeTab, setActiveTab] = useState("workspace");

  const SUITES = {
    workspace: {
      id: "workspace",
      title: "Notion-Style Study Workspace",
      tag: "EDITOR PRO VIP",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      icon: FileText,
      iconColor: "text-purple-400",
      heroImage: "/images/studio/studio_ai_workspace.jpg",
      headline: "Không Gian Soạn Thảo Ghi Chú & Tổng Hợp Luận Văn Chuẩn Học Thuật",
      description:
        "Tích hợp Markdown engine toàn năng, thanh công cụ định dạng trực quan (Headings, Checklist, Code Block, Table), cơ chế tự động lưu tức thì và xuất file .md về máy chỉ với 1 click.",
      highlights: [
        "Tự động lưu bản nháp (Autosave Engine) chống mất dữ liệu",
        "Bộ thanh công cụ chuẩn Notion (Checklist, Code, LaTeX)",
        "Xuất định dạng Markdown (.md) chuẩn quốc tế",
        "Đồng bộ liên thông với AI Mentor để tóm tắt tài liệu",
      ],
      href: "/workspace",
      ctaText: "Mở Notion Workspace",
    },
    mentor: {
      id: "mentor",
      title: "AI Mentor Space (Socratic 2.0)",
      tag: "SOCRATIC AI CORE",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      icon: Bot,
      iconColor: "text-indigo-400",
      heroImage: "/images/studio/hero_academic_hologram.jpg",
      headline: "Trợ Lý Cố Vấn Học Thuật Đa Ngành & Giải Trình Suy Luận",
      description:
        "Không giải bài tập hộ mà hướng dẫn sinh viên tư duy logic từng bước qua phương pháp Socratic. Hỗ trợ 5 chuyên ngành trọng điểm với hiển thị công thức chuẩn LaTeX sắc nét.",
      highlights: [
        "5 Chuyên ngành chuyên sâu: CNTT/AI, Toán học, Kinh Tế, Y Dược",
        "Hiển thị công thức toán học & vật lý chuẩn định dạng LaTeX",
        "Cơ chế Socratic Reasoning kích thích tư duy phản biện",
        "Lưu lịch sử đàm thoại và sao chép câu trả lời tức thì",
      ],
      href: "/ai-mentor",
      ctaText: "Trò Chuyện Với AI Mentor",
    },
    whiteboard: {
      id: "whiteboard",
      title: "Digital Whiteboard Infinite Canvas",
      tag: "TLDRAW 2D/3D ENGINE",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      icon: Sliders,
      iconColor: "text-cyan-400",
      heroImage: "/images/studio/studio_whiteboard_canvas.jpg",
      headline: "Bảng Vẽ Kỹ Thuật Số & Bản Đồ Tư Duy Không Giới Hạn",
      description:
        "Phát triển ý tưởng nghiên cứu, vẽ sơ đồ kiến trúc hệ thống, mindmap đồ án và phác thảo thuật toán trên không gian canvas toàn màn hình mượt mà không độ trễ.",
      highlights: [
        "Canvas vẽ vô cực Dark Mode chuyên nghiệp",
        "Hệ thống công cụ vẽ hình khối, vector, text và laser",
        "Hỗ trợ phím tắt tiêu chuẩn và xoay lật đa chiều",
        "Tích hợp chia sẻ bảng vẽ phục vụ học nhóm",
      ],
      href: "/whiteboard",
      ctaText: "Khám Phá Digital Whiteboard",
    },
    mentors: {
      id: "mentors",
      title: "Mạng Lưới Cố Vấn Chuyên Gia 1:1",
      tag: "VERIFIED EXPERTS",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: ShieldCheck,
      iconColor: "text-amber-400",
      heroImage: "/images/studio/studio_expert_mentorship.jpg",
      headline: "Kết Nối Trực Tiếp Cố Vấn Đầu Ngành & Thẩm Định Đề Tài",
      description:
        "Mạng lưới các Tiến sĩ, Thạc sĩ, Giảng viên và Tech Lead uy tín với Trust Score công khai, đồng hành giải đáp thắc mắc chuyên sâu và định hướng sự nghiệp.",
      highlights: [
        "Hệ thống Trust Score minh bạch từ 95 - 100 điểm",
        "Xác thực danh tính học thuật & bằng cấp chuyên ngành",
        "Review CV, định hướng khóa luận và đồ án tốt nghiệp",
        "Diễn đàn hỏi đáp chuyên môn có gắn tag lời giải chuyên gia",
      ],
      href: "/dashboard",
      ctaText: "Xem Mạng Lưới Cố Vấn",
    },
  };

  const current = SUITES[activeTab];
  const IconComponent = current.icon;

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>THE TRINITY ACADEMIC SUITE 2026</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Bộ Công Cụ Học Thuật{" "}
            <span className="text-gradient-primary">Đột Phá Điểm Số</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
            Trải nghiệm hệ sinh thái 3 công cụ cốt lõi được thiết kế theo tiêu chuẩn studio hiện đại, tối ưu hóa năng suất học tập và nghiên cứu lên gấp 3 lần.
          </p>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {Object.values(SUITES).map((item) => {
            const ItemIcon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-neon-primary scale-102 border border-white/20"
                    : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                <ItemIcon className={`w-4 h-4 ${isActive ? "text-white" : item.iconColor}`} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main 3D Glass Feature Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-space-900/95 via-space-950/90 to-space-900/80 border border-white/15 backdrop-blur-2xl shadow-glass-deep overflow-hidden"
          >
            <BorderBeam size={350} duration={14} colorFrom="#6366f1" colorTo="#a855f7" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
              
              {/* Left Column: Information & Highlights (7 cols) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${current.badgeColor}`}>
                    {current.tag}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">StudentHub Core 2.0</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                  {current.headline}
                </h3>

                <p className="text-sm text-gray-300 leading-relaxed">
                  {current.description}
                </p>

                {/* Highlights List */}
                <div className="space-y-3 pt-2">
                  {current.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-200 font-medium leading-tight">
                        {h}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Direct Action Link */}
                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    href={current.href}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white shadow-neon-primary hover:brightness-110 active:scale-95 transition-all"
                  >
                    <span>{current.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sẵn sàng trải nghiệm
                  </span>
                </div>
              </div>

              {/* Right Column: 3D Artwork Studio Showcase (5 cols) */}
              <div className="lg:col-span-6 relative">
                <div className="relative rounded-2xl overflow-hidden border border-white/15 aspect-[16/10] sm:aspect-[16/9] shadow-2xl group">
                  <img
                    src={current.heroImage}
                    alt={current.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  
                  {/* Floating 3D Badge Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-space-950/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{current.title}</p>
                        <p className="text-[10px] text-gray-400 font-mono">3D Cinematic Artifact</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10">
                      8K Octane Render
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
