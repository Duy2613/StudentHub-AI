"use client";

import React from "react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import { Bot, UserCheck, ShieldAlert, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function VerifiedHumanAiSection() {
  return (
    <section className="relative w-full py-28 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Art & Architectural Visual */}
          <div className="lg:col-span-6 relative rounded-3xl overflow-hidden border border-white/15 bg-space-900 shadow-2xl group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={V3_MEDIA.landing.humanAi}
              alt="Bàn nghiên cứu học thuật giữa người và AI"
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700 filter saturate-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent pointer-events-none" />

            {/* Float badge */}
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-space-950/90 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Bot size={18} />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-white block">
                    AI KHÔNG TẠO RA CHÂN LÝ
                  </span>
                  <span className="text-xs text-slate-400 font-serif">
                    AI đối chiếu văn bản, con người đưa ra quyết định độc lập.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Narrative & Research Desk UI */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 mb-4 w-fit">
              <UserCheck size={14} />
              <span className="text-xs font-mono font-semibold tracking-wider uppercase">
                CHƯƠNG 06 // HỢP TÁC HỌC THUẬT NGƯỜI & AI
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans mb-6">
              Không phải hộp đen AI,{" "}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">
                đây là bàn làm việc minh bạch.
              </span>
            </h2>

            <p className="text-slate-300 font-serif text-base sm:text-lg leading-relaxed mb-8">
              Thay vì một câu trả lời ngắn gọn không rõ nguồn gốc, StudentHub phân tích từng câu hỏi theo cấu trúc khoa học: mệnh đề giả thuyết, dẫn chứng trang văn bản, công khai độ bất định và sẵn sàng chuyển tiếp tới chuyên gia.
            </p>

            {/* Research Desk Specimen Blueprint */}
            <div className="p-5 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-md flex flex-col gap-3.5 mb-8">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10">
                <span className="text-xs font-mono text-cyan-300 uppercase font-semibold">
                  1. GIẢ THUYẾT & DẪN CHỨNG
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  ĐỘ TIN CẬY 94%
                </span>
              </div>

              <div className="text-sm text-slate-300 font-serif leading-relaxed">
                Trích lục Điều 8, Khoản 2 Quy chế Đào tạo ĐHQG: Sinh viên đạt GPA $\ge$ 3.6 được đăng ký tối đa 24 tín chỉ mà không cần phê duyệt ngoại lệ của Trưởng khoa.
              </div>

              <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-amber-300/90">
                  <ShieldAlert size={14} />
                  <span>Điểm bất định: Chưa tính tín chỉ môn Giáo dục thể chất</span>
                </span>
                <span className="text-indigo-400 hover:underline cursor-pointer">
                  Mở công văn gốc .PDF
                </span>
              </div>
            </div>

            <Link
              href="/ai"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors w-fit"
            >
              <span>Khám phá không gian trí tuệ nhân tạo học thuật</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
