"use client";

import React, { useState } from "react";
import { FileCheck, CheckCircle2, XCircle, Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import HobroTiltCard from "@/components/cinematic/HobroTiltCard";

const MANIFESTO_TENETS = [
  {
    num: "01",
    title: "SỰ THẬT KHÔNG TỰ NHIÊN ĐẾN",
    subtitle: "Mọi thông tin trên mạng xã hội đều là giả định cho tới khi được đối soát văn bản gốc.",
    quote: "Một triệu lượt chia sẻ không biến một tin đồn thành chân lý.",
  },
  {
    num: "02",
    title: "KHÔNG THỎA HIỆP ẢO GIÁC AI",
    subtitle: "Gemini chỉ tóm tắt bằng chứng theo structured DTO; Trust Policy và nguồn gốc mới giữ quyền quyết định.",
    quote: "AI có thể diễn giải nhanh, nhưng bằng chứng và policy mới là điểm tựa.",
  },
  {
    num: "03",
    title: "CON NGƯỜI LÀ ĐIỂM TỰA PHÁN QUYẾT",
    subtitle: "Khi dữ liệu mâu thuẫn, hồ sơ lập tức chuyển tiếp đến hội đồng giảng viên và chuyên gia độc lập.",
    quote: "Thuật toán xử lý quy mô, con người gánh vác trách nhiệm học thuật.",
  },
];

const FORENSIC_CASES = [
  {
    id: "tuition",
    badge: "HỌC PHÍ",
    claim: "Trường Đại học chuẩn bị tăng 30% học phí toàn khóa từ học kỳ 1 năm học tới.",
    status: "GIẢ MẠO // ĐÃ PHỦ ĐỊNH",
    verdictType: "fake",
    sourceDecree: "Quyết định 142/QĐ-ĐHQG (Điều 4: Cố định lộ trình)",
    evidenceStatus: "Cần đối soát nguồn chính thức",
  },
  {
    id: "scholarship",
    badge: "HỌC BỔNG",
    claim: "Học bổng Toàn phần Trao đổi Sinh viên Quốc tế không cần phỏng vấn chỉ cần nộp lệ phí 2 triệu VNĐ.",
    status: "CẢNH BÁO LỪA ĐẢO TÀI CHÍNH",
    verdictType: "fake",
    sourceDecree: "Thông báo Cảnh báo Phòng Công tác Sinh viên số 19/TB-CTSV",
    evidenceStatus: "Dấu hiệu rủi ro cao · cần review",
  },
  {
    id: "internship",
    badge: "ĐÀO TẠO",
    claim: "Chứng chỉ ngoại ngữ quốc tế nộp trước ngày 30/11 được đặc cách công nhận chuẩn đầu ra đợt 1.",
    status: "XÁC THỰC // CHÍNH THỐNG",
    verdictType: "verified",
    sourceDecree: "Công văn số 882/ĐT-ĐHQG ban hành ngày 15/10",
    evidenceStatus: "Nguồn chính thống đã được đối chiếu",
  },
];

export default function WhyZeroManifestoSection() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const activeCase = FORENSIC_CASES[selectedCaseIndex];

  return (
    <section className="relative w-full py-32 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      {/* Precision Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Giant Monolithic Headline (Why Zero University Aesthetic) */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase font-semibold">
              TUYÊN NGÔN MINH BẠCH // MANIFESTO
            </span>
            <span className="w-12 h-px bg-emerald-400/40" />
            <span className="text-xs font-mono text-slate-500 uppercase">ZERO SURRENDER</span>
          </div>

          <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black text-white font-sans uppercase tracking-tighter leading-[0.92]">
            CHẤM DỨT KỶ NGUYÊN{" "}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">
              TIN ĐỒN MÙ QUÁNG.
            </span>
          </h2>
        </div>

        {/* 3 Core Philosophical Tenets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {MANIFESTO_TENETS.map((tenet) => (
            <HobroTiltCard
              key={tenet.num}
              maxTilt={6}
              className="p-8 flex flex-col justify-between min-h-[300px]"
              cursorText="ĐỌC TUYÊN NGÔN"
            >
              <div>
                <span className="text-4xl font-mono font-black text-emerald-400/40 block mb-6">
                  {tenet.num}
                </span>
                <h3 className="text-xl font-black text-white font-sans tracking-tight uppercase mb-3">
                  {tenet.title}
                </h3>
                <p className="text-sm text-slate-300 font-serif leading-relaxed mb-6">
                  {tenet.subtitle}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <blockquote className="text-xs font-serif italic text-emerald-300/80">
                  &ldquo;{tenet.quote}&rdquo;
                </blockquote>
              </div>
            </HobroTiltCard>
          ))}
        </div>

        {/* Interactive Forensic Case Simulator (Overworld & Hobro Style) */}
        <div className="relative rounded-3xl border border-white/15 bg-space-900/90 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/10 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase font-semibold mb-1">
                <Sparkles size={14} />
                <span>PHÒNG THÍ NGHIỆM ĐỐI SOÁT THỰC ĐỊA // LIVE LAB</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white font-sans">
                Thử nghiệm quy trình bóc tách bằng chứng
              </h3>
            </div>

            {/* Case Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {FORENSIC_CASES.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCaseIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono uppercase font-semibold transition-all ${
                    idx === selectedCaseIndex
                      ? "bg-emerald-400 text-space-950 font-bold shadow-lg shadow-emerald-400/20"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                  }`}
                  data-cursor={`CASE ${c.badge}`}
                >
                  {c.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Active Case Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Rumor Claim */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <span className="text-xs font-mono text-slate-400 uppercase">
                MỆNH ĐỀ LAN TRUYỀN (RAW CLAIM)
              </span>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-lg sm:text-xl text-white font-serif leading-relaxed">
                  &ldquo;{activeCase.claim}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span>NGUỒN ĐẦU VÀO: MẠNG XÃ HỘI</span>
                <span>•</span>
                <span>TRẠNG THÁI: ĐÃ BÓC TÁCH</span>
              </div>
            </div>

            {/* Right: Forensic Verdict Certificate Card */}
            <div className="lg:col-span-6">
              <div
                className={`relative p-8 rounded-2xl border backdrop-blur-xl ${
                  activeCase.verdictType === "verified"
                    ? "bg-emerald-950/30 border-emerald-500/40"
                    : "bg-rose-950/30 border-rose-500/40"
                }`}
              >
                {/* Official Digital Seal Stamp */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    {activeCase.verdictType === "verified" ? (
                      <CheckCircle2 size={28} className="text-emerald-400" />
                    ) : (
                      <XCircle size={28} className="text-rose-400" />
                    )}
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block">
                        KẾT QUẢ THẨM ĐỊNH CHÍNH THỨC
                      </span>
                      <span
                        className={`text-base font-mono font-bold tracking-wider ${
                          activeCase.verdictType === "verified"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {activeCase.status}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right max-w-[210px]">
                    <span className="text-[10px] font-mono text-slate-400 block">TRẠNG THÁI BẰNG CHỨNG</span>
                    <span className="text-sm font-mono font-bold text-white">
                      {activeCase.evidenceStatus}
                    </span>
                  </div>
                </div>

                {/* Evidence Details */}
                <div className="space-y-3 mb-6">
                  <div className="p-3.5 rounded-xl bg-space-950/60 border border-white/5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      CÔNG VĂN / QUY CHẾ ĐỐI SOÁT
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-slate-200">
                      {activeCase.sourceDecree}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-space-950/60 border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      AI VERIFICATION — GEMINI
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      Gemini advisory · Trust Policy quyết định
                    </span>
                  </div>
                </div>

                {/* CTA to run full forensic audit */}
                <Link
                  href="/trust"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all"
                  data-cursor="MỞ BẰNG CHỨNG"
                >
                  <FileCheck size={16} />
                  <span>XEM CHI TIẾT HỒ SƠ BẰNG CHỨNG GỐC</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
