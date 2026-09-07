"use client";

import React, { useState } from "react";
import { CheckCircle2, UserCheck, ShieldAlert, Cpu, Award } from "lucide-react";

export default function FourStepLearningFlow() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: "01",
      title: "Khởi Tạo Digital Twin & Đồng Bộ Bảng Điểm",
      shortTitle: "Khởi tạo hồ sơ số",
      icon: UserCheck,
      desc: "Nạp bảng điểm chính thức theo từng học kỳ, tự động quy đổi GPA hệ 10 sang hệ 4, đối soát chuẩn tín chỉ theo khung CTĐT K23 - K26.",
      checklist: [
        "Đồng bộ email @student.hcmute.edu.vn",
        "Phân rã bảng điểm môn đã học & điểm F nợ",
        "Khởi tạo Bản sao số bất biến chống xung đột",
      ],
      checkpoint: "INTEGRITY_CHECK: 100% REHYDRATED",
    },
    {
      step: "02",
      title: "Đối Soát Quy Chế & Quét Nút Thắt Học Vụ",
      shortTitle: "Quét nút thắt học vụ",
      icon: ShieldAlert,
      desc: "Động cơ AcademicRuleEngine đối soát với Quyết định 3116 mới nhất, tính toán thuật toán BFS phát hiện môn tiên quyết nghẽn mạch.",
      checklist: [
        "Kiểm tra điều kiện cảnh báo học vụ (GPA < 1.00)",
        "Xác định môn nút thắt (PROG130103, SWEN330103)",
        "Tính toán phương án trả nợ môn kỳ hè",
      ],
      checkpoint: "RULESET_VERIFIED: QD_3116_LOCKED",
    },
    {
      step: "03",
      title: "Đồng Hành Cùng AI Copilot & Phòng Thí Nghiệm",
      shortTitle: "Học tập cùng AI Copilot",
      icon: Cpu,
      desc: "Trợ lý AI giải thích bài tập, thuật toán, kiến trúc phần mềm với cam kết trích dẫn rõ nguồn, không bao giờ bịa đặt chứng cứ.",
      checklist: [
        "Hỗ trợ giải thuật toán Dijkstra, Dynamic Programming",
        "Tóm tắt tài liệu khoa học chuẩn IEEE / ACM",
        "Phản biện lập luận với 5-Pass Self-Critique",
      ],
      checkpoint: "OOD_FIREWALL: ZERO_HALLUCINATION",
    },
    {
      step: "04",
      title: "Bứt Phá Tốt Nghiệp & Living Evidence Passport",
      shortTitle: "Tốt nghiệp & Chứng thực",
      icon: Award,
      desc: "Đạt điều kiện làm Khóa luận tốt nghiệp (>= 110 tín chỉ, GPA >= 2.50), chuẩn ngoại ngữ TOEIC 500-550 và xuất bản Passport năng lực số.",
      checklist: [
        "Xét duyệt đủ điều kiện Khóa luận tốt nghiệp",
        "Xác minh chứng chỉ ngoại ngữ quốc tế",
        "Xuất bản hồ sơ năng lực SHA-256 tuyển dụng",
      ],
      checkpoint: "PASSPORT_STATE: GRADUATION_READY",
    },
  ];

  return (
    <section className="relative py-24 border-t border-white/10 bg-[#070a14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-xs font-semibold text-teal-300">
            <span>✿ QUY TRÌNH 4 BƯỚC CHUẨN MỰC</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Quy Trình Đồng Hành Học Thuật <br />
            <span className="font-serif italic font-normal text-teal-300">
              Từ Năm Nhất Đến Ngày Tốt Nghiệp
            </span>
          </h2>
          <p className="text-sm text-gray-400 font-mono">
            Mỗi bước đều có chốt chặn kiểm định tự động, bảo vệ quyền lợi sinh viên trên từng tín chỉ.
          </p>
        </div>

        {/* Step Navigation Pills */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              data-cursor-text={`Bước ${s.step}`}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
                activeStep === idx
                  ? "border-teal-400 bg-teal-500/15 shadow-[0_0_25px_rgba(52,231,196,0.25)]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              <span className={`font-mono text-xl font-black ${activeStep === idx ? "text-teal-300" : "text-gray-500"}`}>
                {s.step}
              </span>
              <div className="overflow-hidden">
                <span className={`block text-xs font-bold truncate ${activeStep === idx ? "text-white" : "text-gray-400"}`}>
                  {s.shortTitle}
                </span>
                <span className="block font-mono text-[9px] text-gray-500 uppercase">
                  Giai đoạn {idx + 1}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Active Step Showcase Card */}
        <div className="overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-[#0b1026] via-[#080d20] to-[#04060f] p-8 lg:p-12 shadow-2xl backdrop-blur-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-black text-teal-400">
                  {steps[activeStep].step}
                </span>
                <span className="rounded-full border border-teal-400/40 bg-teal-400/10 px-3 py-1 font-mono text-[10px] font-bold text-teal-300 uppercase tracking-widest">
                  {steps[activeStep].checkpoint}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {steps[activeStep].title}
              </h3>

              <p className="text-base text-gray-300 leading-relaxed">
                {steps[activeStep].desc}
              </p>

              {/* Checklist Items */}
              <div className="space-y-3 pt-2">
                {steps[activeStep].checklist.map((item, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-3 text-sm text-gray-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual Box with Technical Terminal Look */}
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/60 p-6 font-mono text-xs text-gray-300 space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400"></span>
                  <span>PROTOCOL EXECUTION LOG</span>
                </span>
                <span>STEP_{steps[activeStep].step}.RUN</span>
              </div>

              <div className="space-y-2 text-[11px] leading-relaxed">
                <p className="text-teal-400">&gt; INITIALIZING PROTOCOL SEQUENCE...</p>
                <p className="text-gray-400">&gt; STUDENT_ID: 23110098 · COHORT: K24_HCMUTE</p>
                <p className="text-gray-400">&gt; CURRICULUM: SOFTWARE_ENGINEERING_V2</p>
                <p className="text-emerald-400">&gt; STATUS: {steps[activeStep].checkpoint}</p>
                <p className="text-indigo-400">&gt; PROVENANCE SHA-256: 3699775a9b... LOCKED</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500">
                <span>EXECUTION TIME: 18ms</span>
                <span className="text-teal-400 font-bold">100% DETERMINISTIC</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
