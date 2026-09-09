"use client";

import React, { useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
  FileText,
  Quote,
  Clock,
  ArrowRight,
  Shield,
  HelpCircle,
} from "lucide-react";

/**
 * AcademicAiVerificationSection — AI Phải Giải Thích Chứ Không Biểu Diễn
 * StudentHub Visual System VNext — "Khai Minh"
 * - Hierarchy: KẾT LUẬN → TẠI SAO → BẰNG CHỨNG → ĐIỂM CHƯA CHẮC CHẮN → BẠN NÊN LÀM GÌ TIẾP
 * - Reasoning > Confidence percentage
 * - Zero hallucination, strict citation-first policy
 */

const VERIFICATION_CASES = [
  {
    id: "case-1",
    label: "Học phí & Tín chỉ",
    question: "Đăng ký quá 24 tín chỉ một học kỳ có bị hủy kết quả tự động không?",
    conclusion: "Có căn cứ quy định rõ ràng: Giới hạn tối đa là 22 tín chỉ",
    conclusionType: "RULE_LIMIT",
    conclusionBadge: "GIỚI HẠN QUY CHẾ",
    why: "Theo Khoản 3 Điều 7 Quy chế đào tạo đại học chính quy (QĐ 428/QĐ-ĐH), sinh viên chỉ được đăng ký tối đa 22 tín chỉ trong học kỳ chính, trừ trường hợp có quyết định đặc cách của Trưởng khoa (GPA ≥ 3.6).",
    evidenceCount: "2 văn bản pháp quy + 1 công văn hướng dẫn năm học 2025–2026",
    uncertainty: "Quy chế từng trường thành viên có thể có khung ngoại lệ 24 tín chỉ cho sinh viên năm cuối chuẩn bị tốt nghiệp (cần nộp đơn riêng).",
    nextAction: "Nộp đơn xin tăng tải tín chỉ kèm bảng điểm kỳ trước về Văn phòng Khoa trước hạn chót 10/09.",
    citations: [
      {
        source: "Điều 7 Khoản 3 · Quy chế Đào tạo ĐH Chính quy",
        docId: "VB-2024-ĐT-03",
        snippet: "Khối lượng học tập tối đa trong một học kỳ chính là 22 tín chỉ đối với sinh viên có học lực khá trở lên...",
      },
      {
        source: "Thông báo hướng dẫn đăng ký tín chỉ HK1 2026",
        docId: "TB-89/PĐT",
        snippet: "Hệ thống tự động từ chối xác nhận đăng ký vượt quá 22 tín chỉ khi không có mã phê duyệt đặc cách.",
      },
    ],
  },
  {
    id: "case-2",
    label: "Chứng chỉ & Ngoại ngữ",
    question: "Có thể nộp chứng chỉ IELTS photo công chứng thay cho bản gốc đối soát không?",
    conclusion: "Không hợp lệ: Bắt buộc đối soát bản gốc hoặc cấp quyền tra cứu online",
    conclusionType: "CRITICAL_REQUIREMENT",
    conclusionBadge: "BẮT BUỘC ĐỐI SOÁT",
    why: "Quy định hậu kiểm chuẩn đầu ra yêu cầu nhà trường tra cứu trực tiếp qua hệ thống xác thực của IDP/British Council hoặc kiểm tra bản gốc có đóng dấu nổi.",
    evidenceCount: "1 quy định hậu kiểm chứng chỉ + 1 thông báo phòng Khảo thí",
    uncertainty: "Thời gian hệ thống đối soát điện tử phản hồi từ 3 đến 7 ngày làm việc tùy đợt tải.",
    nextAction: "Cung cấp mã TRF (Test Report Form) trên cổng trực tuyến của trường hoặc mang bản gốc đến phòng Khảo thí.",
    citations: [
      {
        source: "Quy trình hậu kiểm chứng chỉ quốc tế số 12/HD-KT",
        docId: "QT-KT-2025",
        snippet: "Không chấp nhận bản sao công chứng không đi kèm mã xác thực điện tử hoặc đối chiếu bản gốc...",
      },
    ],
  },
];

export default function AcademicAiVerificationSection() {
  const [activeCase, setActiveCase] = useState(VERIFICATION_CASES[0]);

  return (
    <section
      className="py-24 lg:py-32 border-b border-white/[0.08] bg-[#08110F] relative overflow-hidden"
      aria-labelledby="ai-verification-title"
    >
      {/* Background Calm Atmosphere */}
      <div className="absolute top-1/3 left-1/4 w-[460px] h-[460px] rounded-full bg-[#7BE0B2]/[0.03] blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header: 70% Editorial Calm */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest text-[#7BE0B2] bg-[#0F1B18] border border-white/[0.1] uppercase mb-4">
            04 / Khảo Chứng Thông Minh
          </div>
          <h2
            id="ai-verification-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E6] leading-[1.15]"
          >
            AI phải giải thích, <span className="font-serif italic text-[#7BE0B2]">không biểu diễn.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#C3CCC6] leading-relaxed max-w-2xl">
            Không tự đưa ra con số khẳng định giả tạo. Hệ thống bóc tách cơ sở lý luận,
            trích dẫn điều khoản chính quy và chỉ rõ những gì còn chưa thể chắc chắn.
          </p>
        </div>

        {/* Query Switcher Buttons */}
        <div className="flex flex-wrap gap-2.5 mb-8" role="tablist" aria-label="Mẫu khảo chứng AI">
          {VERIFICATION_CASES.map((item) => {
            const active = item.id === activeCase.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCase(item)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  active
                    ? "bg-[#0F1B18] text-[#F4F0E6] border border-[#7BE0B2]/40 shadow-sm"
                    : "bg-[#0B1412] text-[#8A9891] hover:text-[#C3CCC6] border border-white/[0.06]"
                } focus:outline-none focus:ring-2 focus:ring-[#7BE0B2]`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* The 5-Step Explanation Terminal */}
        <div className="double-bezel-wrapper text-left">
          <div className="double-bezel-inner space-y-7">
            {/* Student Inquiry Bar */}
            <div className="p-4 rounded-xl bg-[#08110F] border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-[#7BE0B2]/10 text-[#7BE0B2] text-xs font-mono font-bold">
                  CÂU HỎI
                </span>
                <span className="text-sm sm:text-base font-medium text-[#F4F0E6]">
                  "{activeCase.question}"
                </span>
              </div>
              <div className="text-xs font-mono text-[#8A9891]">
                Khảo chứng đối chiếu
              </div>
            </div>

            {/* 1. KẾT LUẬN (Conclusion) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#7BE0B2]" />
                <span className="text-xs font-mono font-bold tracking-wider text-[#7BE0B2] uppercase">
                  1. KẾT LUẬN
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0F1B18] border border-white/[0.1] text-[#F4F0E6]">
                  {activeCase.conclusionBadge}
                </span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-[#F4F0E6] pl-6">
                {activeCase.conclusion}
              </div>
            </div>

            {/* 2. TẠI SAO? (Reasoning) */}
            <div className="space-y-2 pl-6 border-l-2 border-[#7BE0B2]/30">
              <div className="text-xs font-mono font-bold tracking-wider text-[#F4F0E6] uppercase">
                2. TẠI SAO? (CƠ SỞ QUY CHẾ)
              </div>
              <p className="text-sm sm:text-base text-[#C3CCC6] leading-relaxed">
                {activeCase.why}
              </p>
              <div className="text-xs font-mono text-[#8A9891]">
                Đồng thuận: {activeCase.evidenceCount}
              </div>
            </div>

            {/* 3. BẰNG CHỨNG (Citations) */}
            <div className="space-y-3 pl-6">
              <div className="text-xs font-mono font-bold tracking-wider text-[#8EC5FF] uppercase">
                3. BẰNG CHỨNG TRÍCH DẪN NGUỒN GỐC
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCase.citations.map((cite, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#091210] border border-white/[0.06] text-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[#8EC5FF] font-mono text-xs">
                      <span className="font-semibold truncate">{cite.source}</span>
                      <span className="shrink-0 ml-2">[{cite.docId}]</span>
                    </div>
                    <p className="text-sm text-[#C3CCC6] leading-relaxed italic">
                      "{cite.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. ĐIỂM CHƯA CHẮC CHẮN (Uncertainties) */}
            <div className="p-4 rounded-xl bg-[#0F1B18] border border-white/[0.08] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono text-[#F3C56B] font-bold">
                <Clock size={14} />
                <span>4. ĐIỂM CHƯA CHẮC CHẮN & GIỚI HẠN PHẠM VI</span>
              </div>
              <p className="text-sm sm:text-base text-[#C3CCC6] leading-relaxed">
                {activeCase.uncertainty}
              </p>
            </div>

            {/* 5. BẠN NÊN LÀM GÌ TIẾP (Next Action) */}
            <div className="p-4 rounded-xl bg-[#0B1412] border border-[#7BE0B2]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-bold text-[#7BE0B2] uppercase">
                  5. BẠN NÊN LÀM GÌ TIẾP THEO?
                </div>
                <div className="text-sm font-semibold text-[#F4F0E6] mt-1">
                  {activeCase.nextAction}
                </div>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#7BE0B2]">
                  <span>Đọc văn bản gốc</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
