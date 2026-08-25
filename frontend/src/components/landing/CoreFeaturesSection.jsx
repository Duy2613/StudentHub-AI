"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calendar,
  FileCheck2,
  ShieldAlert,
  Navigation,
  Radar,
  ArrowRight, 
  Check, 
  Sparkles,
  Layers,
  Zap,
  CheckCircle2,
  XCircle,
  Cpu,
  ChevronRight,
  Database,
  Search,
  Scale,
  Activity,
  Compass
} from "lucide-react";
import TactileButton from "@/components/ui/TactileButton";
import Interactive3DBlockCard from "@/components/ui/Interactive3DBlockCard";

export default function CoreFeaturesSection() {
  const [activePipeline, setActivePipeline] = useState(0);

  const REALITY_PIPELINES = [
    {
      id: "academic-scheduler",
      num: "01",
      name: "AI Xếp Thời Khóa Biểu",
      tag: "Toán học ràng buộc CSP (Constraint Satisfaction)",
      tagColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      icon: Calendar,
      href: "/credit-scheduler",
      glowColor: "rgba(6, 182, 212, 0.4)",
      myth: "LLM tự 'nghĩ' ra lịch học (Dễ ảo giác & trùng tiết)",
      reality: "Official curriculum + Prerequisite graph + Semester constraints + Actual course availability + Student state + Constraint solver + LLM explanation",
      steps: [
        { label: "1. Khung CTĐT Chính Thức", desc: "Curriculum chuẩn trường" },
        { label: "2. Đồ Thị Tiên Quyết", desc: "Prerequisite DAG graph" },
        { label: "3. Ràng Buộc Tín Chỉ", desc: "Max/Min credits & semester rules" },
        { label: "4. Lớp Học Phần Thực", desc: "Actual section availability" },
        { label: "5. Trạng Thái Sinh Viên", desc: "Lịch rảnh & điểm số hiện tại" },
        { label: "6. Bộ Giải CSP Backtrack", desc: "100% không trùng tiết học" },
        { label: "7. Giải Trình Lý Do", desc: "LLM explanation minh bạch" },
      ],
      badge: "Zero Conflict CSP",
    },
    {
      id: "contract-intelligence",
      num: "02",
      name: "Bóc Tách Hợp Đồng & Công Văn",
      tag: "Giám định pháp lý chuẩn Luật 2019/2023",
      tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: FileCheck2,
      href: "/contract-check",
      glowColor: "rgba(16, 185, 129, 0.4)",
      myth: "Upload PDF → GPT tóm tắt sơ sài (Bỏ sót bẫy pháp lý)",
      reality: "PDF → OCR → layout → clause extraction → legal-source retrieval → version check → conflict check → risk analysis → cited explanation",
      steps: [
        { label: "1. Tệp PDF / Ảnh Chụp", desc: "Raw document ingest" },
        { label: "2. OCR Đa Phương Thức", desc: "Vietnamese diacritics" },
        { label: "3. Phân Tích Layout", desc: "Căn lề, con dấu, chữ ký" },
        { label: "4. Trích Xuất Điều Khoản", desc: "Clause level extraction" },
        { label: "5. Đối Soát Luật Thực", desc: "Luật LĐ 2019 & Luật Nhà ở 2023" },
        { label: "6. Kiểm Tra Phiên Bản", desc: "AST version diff (v1 vs v2)" },
        { label: "7. Xung Đột & Rủi Ro", desc: "Conflict & risk detection" },
        { label: "8. Giải Trình Trích Dẫn", desc: "Cited legal explanation" },
      ],
      badge: "Legal AST Diff",
    },
    {
      id: "fraud-intelligence",
      num: "03",
      name: "Phòng Vệ Lừa Đảo & Đánh Giá Rủi Ro",
      tag: "Tình báo đe dọa đa nguồn & 4 Lớp Thẩm Định",
      tagColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      icon: ShieldAlert,
      href: "/scam-check",
      glowColor: "rgba(244, 63, 94, 0.4)",
      myth: "AI cảm tính đoán 'câu này có vẻ là scam'",
      reality: "Text + OCR + Document + URL + QR + Threat Intel + Psychology + Conversation + Campaign Graph + Evidence → calibrated risk",
      steps: [
        { label: "1. Đa Đầu Vào", desc: "Text, ảnh, link, mã QR" },
        { label: "2. Tình Báo URLhaus & NCSC", desc: "Live threat IOC feeds" },
        { label: "3. Vector APWG & FTC", desc: "Quishing & Impersonation" },
        { label: "4. 24 Đòn Thao Túng Tâm Lý", desc: "Fear, Urgency, Authority" },
        { label: "5. Đồ Thị Chiến Dịch", desc: "Entity & Campaign Graph" },
        { label: "6. Hợp Nhất Bằng Chứng", desc: "Cross-modal DAG fusion" },
        { label: "7. Điểm Rủi Ro Hiệu Chuẩn", desc: "Calibrated risk score" },
      ],
      badge: "4-Layer Sentinel",
    },
    {
      id: "geospatial-safety",
      num: "04",
      name: "Bản Đồ An Ninh & Định Vị GPS",
      tag: "Khử nhiễu EMA & Phân đoạn rủi ro đường",
      tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      icon: Navigation,
      href: "/safety-map",
      glowColor: "rgba(245, 158, 11, 0.4)",
      myth: "GPS thô → Ghim điểm thẳng lên Google Maps",
      reality: "GPS → accuracy → map matching → road segment → traffic → weather → camera → incidents → safety evidence → route risk",
      steps: [
        { label: "1. Tọa Độ GPS Cảm Biến", desc: "Raw observation data" },
        { label: "2. Cổng Chất Lượng (11 bậc)", desc: "Spike & jump filter (<10m)" },
        { label: "3. Làm Mượt EMA", desc: "Exponential moving average" },
        { label: "4. Map Matching", desc: "Khớp vào tim đường thật" },
        { label: "5. Phân Đoạn Rủi Ro", desc: "Cô lập dốc ngập Võ Văn Ngân" },
        { label: "6. Camera & Thời Tiết", desc: "Quan trắc thực chứng" },
        { label: "7. Lộ Trình An Toàn", desc: "Evidence-based route risk" },
      ],
      badge: "Sub-10m Snapping",
    },
    {
      id: "student-radar",
      num: "05",
      name: "Student Radar Đa Nguồn",
      tag: "Độ tươi dữ liệu thời gian thực & Decay Engine",
      tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      icon: Radar,
      href: "/tuition-radar",
      glowColor: "rgba(168, 85, 247, 0.4)",
      myth: "AI tự bịa thông báo và cho là 'có vẻ quan trọng'",
      reality: "New real source → change detection → importance → relevance to student → freshness → confidence → notification",
      steps: [
        { label: "1. Nguồn Dữ Liệu Thực Mới", desc: "New authoritative source" },
        { label: "2. Phát Hiện Thay Đổi", desc: "AST change detection" },
        { label: "3. Đánh Giá Tầm Quan Trọng", desc: "Critical policy impact" },
        { label: "4. Mức Độ Phù Hợp", desc: "Khớp đúng ngành & niên khóa" },
        { label: "5. Độ Tươi Dữ Liệu", desc: "Exponential freshness decay" },
        { label: "6. Điểm Tin Cậy", desc: "Calibrated confidence" },
        { label: "7. Thông Báo Trực Tiếp", desc: "Actionable alert notification" },
      ],
      badge: "7-Head Radar",
    },
  ];

  const current = REALITY_PIPELINES[activePipeline];
  const CurrentIcon = current.icon;

  return (
    <section className="py-24 relative z-10" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="dg-badge-machine igloo-magnetic">
            <Layers className="w-3.5 h-3.5" />
            02 // 5 ĐƯỜNG ỐNG TRÍ TUỆ THỰC ĐỊA (ZERO-FABRICATION PIPELINES)
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            <span className="font-serif-editorial italic font-normal text-gradient-primary">
              Không Phải Demo Ảo,
            </span>
            <br />
            <span className="font-human font-black">
              Mà Là Kỹ Thuật Thực Tế.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 font-human leading-relaxed max-w-2xl mx-auto">
            Mọi tính năng trong StudentHub AI đều được xây dựng trên toán học tất định, đồ thị thực thể, quy phạm pháp luật và chuỗi bằng chứng xác thực.
          </p>
        </div>

        {/* 5-Pipeline Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {REALITY_PIPELINES.map((pipe, idx) => {
            const Icon = pipe.icon;
            const isSelected = activePipeline === idx;
            return (
              <button
                key={pipe.id}
                type="button"
                onClick={() => setActivePipeline(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#ffbc09] text-[#150604] shadow-[0_0_20px_rgba(255,188,9,0.35)] scale-105"
                    : "bg-[#150604]/80 text-[#ece7e0]/70 hover:text-white border border-[#2d0d08] hover:border-[#ffbc09]/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{pipe.num}. {pipe.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Pipeline Deep Reality Card */}
        <div className="relative">
          <Interactive3DBlockCard
            glowColor={current.glowColor}
            maxTilt={6}
            depth={30}
            className="w-full"
          >
            <div className="p-7 sm:p-10 rounded-3xl bg-[#150604]/90 border border-[#ffbc09]/40 backdrop-blur-2xl shadow-2xl space-y-8 relative overflow-hidden">
              
              {/* Background Crosshair & Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(255,188,9,0.1)_0,transparent_70%)] pointer-events-none" />

              {/* Card Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#2d0d08]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#ffbc09]/20 border border-[#ffbc09]/40 flex items-center justify-center text-[#ffbc09]">
                    <CurrentIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#ffbc09] font-bold">PIPELINE {current.num}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold border ${current.tagColor}`}>
                        {current.badge}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">{current.name}</h3>
                  </div>
                </div>

                <Link href={current.href}>
                  <TactileButton variant="saffron" size="sm" techSuffix="GO">
                    <span>Mở Tính Năng Này</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 text-[#150604]" />
                  </TactileButton>
                </Link>
              </div>

              {/* Contrast Matrix: KHÔNG PHẢI vs MÀ LÀ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* The Myth (Không Phải) */}
                <div className="p-5 rounded-2xl bg-[#ea3810]/10 border border-[#ea3810]/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase">
                    <XCircle className="w-4 h-4" />
                    <span>KHÔNG PHẢI (ẢO GIÁC DEMO):</span>
                  </div>
                  <p className="text-sm font-mono text-white/80 line-through decoration-rose-500/80">
                    {current.myth}
                  </p>
                </div>

                {/* The Reality (Mà Là) */}
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>MÀ LÀ (KỸ THUẬT THỰC ĐỊA):</span>
                  </div>
                  <p className="text-sm font-mono text-emerald-300 font-bold leading-relaxed">
                    {current.reality}
                  </p>
                </div>
              </div>

              {/* Step-by-Step Mathematical & Engineering Execution Chain */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#ffbc09] uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>CHUỖI ĐƯỜNG ỐNG THỰC THI (END-TO-END EXECUTION GRAPH):</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                  {current.steps.map((st, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-black/60 border border-[#47140b] hover:border-[#ffbc09]/60 transition-colors space-y-1 relative"
                    >
                      <div className="text-[11px] font-mono text-[#ffd15c] font-bold">
                        {st.label}
                      </div>
                      <div className="text-[10px] text-[#ece7e0]/60 font-mono">
                        {st.desc}
                      </div>
                      {i < current.steps.length - 1 && (
                        <ChevronRight className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#ffbc09]/50 z-10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Interactive3DBlockCard>
        </div>

      </div>
    </section>
  );
}
