"use client";

/**
 * StudentHub AI — Grounded AI Studio
 * Multi-mode AI research, semester planning, and provenance explainability.
 */

import React, { useState } from "react";
import {
  Sparkles,
  Search,
  Calendar,
  Info,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  FileText
} from "lucide-react";

export default function GroundedAIStudio() {
  const [selectedMode, setSelectedMode] = useState("RESEARCH");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState({
    title: "Tư Vấn Lộ Trình Môn Tiên Quyết: Kiến Trúc Máy Tính & Hệ Điều Hành",
    mode: "RESEARCH",
    confidenceBand: "HIGH_CONFIDENCE",
    confidenceScore: 0.94,
    answer: "Theo khung chương trình đào tạo Kỹ Sư CNTT khóa K24 (ban hành theo QĐ 1422/QĐ-ĐHSPKT), học phần 'Kiến Trúc Máy Tính (INCO2301)' là điều kiện tiên quyết bắt buộc để đăng ký học phần 'Hệ Điều Hành (OPER3301)' trong học kỳ 1 năm thứ 3. Bạn nên ưu tiên hoàn tất INCO2301 ngay trong HK1 2025–2026 để tránh bị chậm tiến độ 1 học kỳ.",
    uncertainty: "Nếu trường mở lớp học phần song hành trong học kỳ hè, sinh viên có thể làm đơn xin học vượt với điều kiện GPA >= 7.5.",
    alternatives: [
      "Đăng ký học phần INCO2301 vào học kỳ chính HK1 2025–2026 (Khuyến nghị cao nhất)",
      "Đăng ký học ghép với khóa K23 trong đợt bổ sung tại bàn tiếp sinh viên nhà A1"
    ],
    supportingEvidences: [
      { id: "EVID_01", text: "Quyết định 1422/QĐ-ĐHSPKT quy định sơ đồ cây môn học tiên quyết ngành CNTT.", authority: "Phòng Đào Tạo" },
      { id: "EVID_02", text: "Kinh nghiệm đăng ký môn từ 12 sinh viên khóa K23 đã vượt qua môn Hệ Điều Hành.", authority: "Cộng đồng K23" }
    ]
  });

  const handleAsk = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResult({
        title: `Phân Tích Grounded Cho Câu Hỏi: "${query}"`,
        mode: selectedMode,
        confidenceBand: "HIGH_CONFIDENCE",
        confidenceScore: 0.92,
        answer: `Căn cứ theo quy chế học vụ K24 và dữ liệu thực tế: ${query}. Hệ thống xác nhận bạn đủ điều kiện thực hiện theo quy trình chuẩn của nhà trường.`,
        uncertainty: "Cần chú ý lịch thông báo nộp đơn của khoa trước tuần thứ 10.",
        alternatives: ["Thực hiện trực tuyến qua portal", "Nộp đơn trực tiếp tại văn phòng khoa CNTT"],
        supportingEvidences: [
          { id: "EVID_CUSTOM", text: "Văn bản hướng dẫn học vụ học kỳ 2 năm học 2025-2026", authority: "Khoa CNTT" }
        ]
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <section className="p-6 rounded-3xl bg-[#120704] border border-[#3d1910] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Grounded AI Advisor Studio</h1>
            <p className="text-xs text-gray-400">Trí tuệ nhân tạo cố vấn học vụ dựa trên bằng chứng và quy chế thực chứng</p>
          </div>
        </div>
      </section>

      {/* 2. Mode Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2d120a] pb-2">
        {[
          { id: "RESEARCH", label: "Nghiên Cứu Học Vụ (Research)", icon: Search },
          { id: "PLAN", label: "Lập Kế Hoạch Tín Chỉ (Plan)", icon: Calendar },
          { id: "EXPLAIN", label: "Giải Thích Căn Cứ (Explain)", icon: Info }
        ].map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                selectedMode === m.id
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "text-gray-400 hover:text-white bg-[#120704]"
              }`}
            >
              <Icon size={14} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Interactive Grounded Ask Input */}
      <form onSubmit={handleAsk} className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập câu hỏi hoặc vấn đề học vụ cần phân tích..."
            className="flex-1 bg-[#1a0b07] border border-[#2d120a] focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
            <span>Phân Tích Grounded</span>
          </button>
        </div>
      </form>

      {/* 4. Structured Grounded Result */}
      {result && (
        <div className="p-6 rounded-2xl bg-[#120704] border border-[#2d120a] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#200e08]">
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">KẾT QUẢ PHÂN TÍCH GROUNDED // {result.mode}</span>
              <h3 className="text-base font-bold text-white mt-0.5">{result.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>{result.confidenceBand} ({(result.confidenceScore * 100).toFixed(0)}%)</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed bg-[#180905] p-4 rounded-xl border border-[#2d120a]">
              {result.answer}
            </p>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-[10px] uppercase">
                <AlertTriangle size={12} />
                <span>Giới Hạn & Bất Định (Uncertainty Boundaries):</span>
              </div>
              <p className="text-gray-300 text-[11px]">{result.uncertainty}</p>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">Lộ Trình / Phương Án Thay Thế (Alternatives):</span>
              <div className="space-y-1.5">
                {result.alternatives.map((alt, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300 p-2 rounded-lg bg-[#180905] border border-[#2d120a]">
                    <span className="w-4 h-4 rounded-full bg-[#250e08] text-amber-400 font-mono text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                    <span>{alt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#200e08]">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">Bằng Chứng Trích Dẫn (Supporting Evidences):</span>
              <div className="space-y-2">
                {result.supportingEvidences.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl bg-[#140805] border border-[#2d120a] flex items-center justify-between text-xs">
                    <span className="text-gray-200">📜 {ev.text}</span>
                    <span className="text-[10px] font-mono text-amber-400 font-semibold">{ev.authority}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
