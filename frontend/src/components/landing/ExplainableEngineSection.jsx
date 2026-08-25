"use client";

import React, { useState } from "react";
import { 
  Layers, 
  Zap, 
  Search, 
  Database, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Calendar,
  FileCheck2,
  ShieldAlert,
  Navigation,
  Radar,
  ArrowRight,
  Sparkles
} from "lucide-react";
import TextScramble from "@/components/ui/TextScramble";

export default function ExplainableEngineSection() {
  const [selectedDomain, setSelectedDomain] = useState("academic");

  const DOMAINS = [
    {
      id: "academic",
      title: "1. AI Xếp Thời Khóa Biểu",
      icon: Calendar,
      myth: "LLM tự nghĩ lịch (Ảo giác)",
      reality: "Official curriculum + Prerequisite graph + Semester constraints + Actual course availability + Student state + Constraint solver + LLM explanation",
      formula: "CSP(C, P, S, A) → Solved(0% Conflict) → Explain",
      metrics: "0ms Overlap • Backtracking Search • 100% Solved",
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "contract",
      title: "2. Bóc Tách Hợp Đồng",
      icon: FileCheck2,
      myth: "Upload PDF → GPT summary sơ sài",
      reality: "PDF → OCR → layout → clause extraction → legal-source retrieval → version check → conflict check → risk analysis → cited explanation",
      formula: "PDF → OCR(vie) → AST_Diff(v1, v2) → Law2019/2023",
      metrics: "Điều 17 Luật LĐ • Điều 472 Luật Nhà ở • AST Diff",
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "fraud",
      title: "3. Phòng Vệ Lừa Đảo",
      icon: ShieldAlert,
      myth: "AI cảm tính đoán 'câu này có vẻ scam'",
      reality: "Text + OCR + Document + URL + QR + Threat Intel + Psychology + Conversation + Campaign Graph + Evidence → calibrated risk",
      formula: "Inputs(10) → Layer1(0ms) → Layer2(Psy) → URLhaus → CalibratedRisk",
      metrics: "Live URLhaus API • NCSC IOCs • APWG Quishing • FTC 2024",
      color: "from-rose-500 to-amber-500",
    },
    {
      id: "gps",
      title: "4. Bản Đồ An Ninh & GPS",
      icon: Navigation,
      myth: "GPS thô → Ghim điểm lên Google Maps",
      reality: "GPS → accuracy → map matching → road segment → traffic → weather → camera → incidents → safety evidence → route risk",
      formula: "GPS(raw) → EMA_Smooth → Snapped(Road) → SegmentRisk(Flood)",
      metrics: "Quality Gate ±10m • Teleport Filter • Segment Breakdown",
      color: "from-amber-500 to-yellow-500",
    },
    {
      id: "radar",
      title: "5. Student Radar",
      icon: Radar,
      myth: "AI tự nghĩ 'có vẻ quan trọng'",
      reality: "New real source → change detection → importance → relevance to student → freshness → confidence → notification",
      formula: "Source(New) → AST_Change → Match(Major, Year) → ExpDecay(t)",
      metrics: "7-Head Streams • Exponential Decay • Actionable Alert",
      color: "from-purple-500 to-indigo-500",
    },
  ];

  const active = DOMAINS.find((d) => d.id === selectedDomain) || DOMAINS[0];
  const ActiveIcon = active.icon;

  return (
    <section className="py-24 relative z-10" id="engine">
      <div className="layout-safe-container space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="dg-badge-machine">
            <Layers className="w-3.5 h-3.5" />
            04 // KIẾN TRÚC TOÁN HỌC & ĐỒ THỊ THỰC CHỨNG
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            <span className="font-serif-editorial italic font-normal text-gradient-primary">
              Xác Thực Đa Lớp,
            </span>
            <br />
            <TextScramble
              text="Minh Bạch Tuyệt Đối."
              tag="span"
              className="font-human font-black tracking-tight text-white"
              duration={900}
              delay={200}
              speed={30}
            />
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 font-human leading-relaxed max-w-xl mx-auto">
            Không còn hiện tượng hộp đen (Black-box AI). Mỗi quyết định của StudentHub AI đều có công thức giải trình chi tiết từng bước.
          </p>
        </div>

        {/* 5-Domain Horizontal Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {DOMAINS.map((dom) => {
            const Icon = dom.icon;
            const isSelected = selectedDomain === dom.id;
            return (
              <button
                key={dom.id}
                type="button"
                onClick={() => setSelectedDomain(dom.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#ffbc09] text-[#150604] shadow-lg shadow-[#ffbc09]/20"
                    : "bg-black/60 text-[#ece7e0]/60 hover:text-white border border-[#2d0d08]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{dom.title}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Architecture Deep Dive Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#150604] border border-[#ffbc09]/40 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2d0d08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ffbc09]/20 border border-[#ffbc09]/40 flex items-center justify-center text-[#ffbc09]">
                <ActiveIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">{active.title}</h3>
                <span className="text-xs font-mono text-[#ffd15c]">{active.metrics}</span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
              ✓ ZERO-FABRICATION VERIFIED
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Mathematical / Algorithmic Reality */}
            <div className="p-6 rounded-2xl bg-black/60 border border-[#47140b] space-y-3">
              <div className="text-xs font-mono text-[#ffbc09] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ĐƯỜNG ỐNG THỰC THI THỰC ĐỊA:</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/80 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold leading-relaxed">
                {active.reality}
              </div>
              <div className="text-[11px] font-mono text-[#ece7e0]/60">
                Formula: <code className="text-[#ffd15c]">{active.formula}</code>
              </div>
            </div>

            {/* Right: The Dangerous Myth Rejected */}
            <div className="p-6 rounded-2xl bg-black/60 border border-[#47140b] space-y-3">
              <div className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ẢO TƯỞNG DEMO BỊ BÃI BỎ:</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/80 border border-rose-500/30 text-rose-300/80 font-mono text-xs line-through leading-relaxed">
                {active.myth}
              </div>
              <div className="text-[11px] font-mono text-[#ece7e0]/60">
                Lý do bãi bỏ: <span className="text-white">LLM tạo ra xác suất hallucination cao, không thể chịu trách nhiệm trước quy chế đào tạo và pháp luật thực.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
