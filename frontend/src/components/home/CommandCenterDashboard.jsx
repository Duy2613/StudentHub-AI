"use client";

/**
 * StudentHub AI — Personal Command Center Dashboard
 * Grounded Academic Intelligence, "What Changed?", Explainable Next Actions, and Early Warnings.
 */

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Info,
  ChevronRight,
  BookOpen,
  Calendar,
  ExternalLink
} from "lucide-react";

export default function CommandCenterDashboard() {
  const [askPrompt, setAskPrompt] = useState("");
  const [selectedActionWhy, setSelectedActionWhy] = useState(null);

  const nextActions = [
    {
      id: "act_1",
      title: "Nộp hồ sơ miễn chuẩn đầu ra tiếng Anh TOEIC 650+",
      deadline: "30/06/2026",
      priority: "HIGH",
      category: "GRADUATION_REQUIREMENT",
      confidence: 0.96,
      whyMe: "Bạn thuộc khóa K24 Khoa CNTT. Theo lộ trình chuẩn, hoàn tất ngoại ngữ trước năm 3 giúp giảm 15% áp lực đồ án chuyên ngành.",
      whyNow: "Đợt nhận hồ sơ xét miễn chuẩn đợt 1 mở đến hết tháng 6.",
      evidence: "Quyết định 1422/QĐ-ĐHSPKT ban hành ngày 15/08/2024"
    },
    {
      id: "act_2",
      title: "Xác nhận lịch học phòng mới Giải tích 1 (MATH1401)",
      deadline: "Hôm nay 13:00",
      priority: "URGENT",
      category: "SCHEDULE_ADJUSTMENT",
      confidence: 0.99,
      whyMe: "Môn MATH1401 lớp thứ 3 nhóm 02 của bạn có quyết định dời phòng từ D301 sang A1-204.",
      whyNow: "Thông báo từ Phòng Đào Tạo có hiệu lực từ buổi học hôm nay.",
      evidence: "Thông báo PDT.2026.0215 phát hành sáng nay"
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Adaptive Command Briefing Header */}
      <section className="p-6 rounded-3xl bg-gradient-to-r from-[#180a06] via-[#120704] to-[#0d0503] border border-[#3d1910] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>MY ACADEMIC BRIEFING // HK2 2025–2026</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Xin chào, Trần Bảo Duy 👋
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                MSSV: <span className="font-mono text-amber-400 font-semibold">24110001</span> • Ngành: Công Nghệ Thông Tin • Khóa: K24
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/academic"
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
              >
                <span>Hồ Sơ 360</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* "What Changed?" Indicator Capsule */}
          <div className="p-3.5 rounded-2xl bg-[#0a0402]/80 border border-[#2d120a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">⚡</span>
              <div>
                <span className="font-bold text-gray-200">Từ lần truy cập gần nhất của bạn: </span>
                <span className="text-gray-400">1 thông báo đổi phòng học mới, 1 cảnh báo nghẽn cổng đăng ký học phần đợt 2.</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-400/90 whitespace-nowrap">Đồng bộ lúc 13:40</span>
          </div>
        </div>
      </section>

      {/* 2. Urgent Early Warning Banner */}
      <section className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-xs">
        <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-amber-300">CẢNH BÁO VẬN HÀNH: Nghẽn mạng cổng đăng ký học phần (online.hcmute.edu.vn)</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">EMERGING</span>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Hệ thống ghi nhận 14 phản ánh từ sinh viên K22 & K23 về lỗi timeout khi lưu thời khóa biểu lúc 20h00.
          </p>
          <div className="text-[11px] text-amber-400/90 font-mono pt-1">
            💡 Khuyến nghị: Lưu lịch trước vào file nháp, tránh refresh liên tục gây nghẽn thêm gateway.
          </div>
        </div>
      </section>

      {/* 3. Two-Column Workspace: Next Best Actions & Academic Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Next Best Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="text-amber-400" size={18} />
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase font-mono">Hành Động Khuyến Nghị Tiếp Theo</h3>
            </div>
            <span className="text-xs text-gray-500 font-mono">2 hành động cần xử lý</span>
          </div>

          <div className="space-y-3">
            {nextActions.map((action) => (
              <div
                key={action.id}
                className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] hover:border-amber-500/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        action.priority === "URGENT" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {action.priority}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">Hạn: {action.deadline}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-100">{action.title}</h4>
                  </div>
                  <button
                    onClick={() => setSelectedActionWhy(selectedActionWhy === action.id ? null : action.id)}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#1c0c08] border border-[#3d1910] text-amber-400 hover:bg-amber-500/10 flex items-center gap-1 shrink-0"
                  >
                    <Info size={12} />
                    <span>Tại sao?</span>
                  </button>
                </div>

                {/* Explainable Drawer */}
                {selectedActionWhy === action.id && (
                  <div className="p-3 rounded-xl bg-[#090302] border border-[#2d120a] space-y-2 text-xs animate-in fade-in">
                    <div>
                      <span className="text-amber-400 font-bold font-mono text-[10px] uppercase">Tại sao là tôi: </span>
                      <span className="text-gray-300">{action.whyMe}</span>
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold font-mono text-[10px] uppercase">Tại sao lúc này: </span>
                      <span className="text-gray-300">{action.whyNow}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono pt-1 border-t border-[#200e08]">
                      <span>📜 Căn cứ: {action.evidence}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Fast Grounded Ask AI Box */}
          <div className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase">
              <Sparkles size={15} />
              <span>Hỏi Nhanh AI Cố Vấn Học Vụ Grounded</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={askPrompt}
                onChange={(e) => setAskPrompt(e.target.value)}
                placeholder="VD: Điều kiện xét đồ án tốt nghiệp K24 gồm những gì?"
                className="flex-1 bg-[#1a0b07] border border-[#2d120a] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none"
              />
              <Link
                href={`/ai?q=${encodeURIComponent(askPrompt || "Tổng quan quy chế học vụ K24")}`}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1"
              >
                <span>Hỏi</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Key Academic Metrics & Goals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase font-mono">Tiến Độ Học Vụ</h3>
            <Link href="/academic" className="text-xs text-amber-400 hover:underline font-mono">Chi tiết →</Link>
          </div>

          <div className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Tín chỉ Tích lũy</span>
                <span className="font-mono font-bold text-white">48 / 150</span>
              </div>
              <div className="w-full bg-[#200e08] h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full w-[32%]" />
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Đạt 32.0% chương trình đào tạo</span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#200e08]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">GPA Tích lũy</span>
                <span className="font-mono font-bold text-amber-400">8.35 / 10.0</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">Xếp loại: Giỏi (Học bổng KKHT)</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#200e08]">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">Mục tiêu Đang Theo Đuổi</span>
              <div className="p-2.5 rounded-xl bg-[#180905] border border-[#2d120a] space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-200">TOEIC 650+</span>
                  <span className="text-amber-400 font-mono font-bold">75%</span>
                </div>
                <div className="w-full bg-[#200e08] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[75%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
