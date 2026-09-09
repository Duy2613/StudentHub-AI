"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Lock, CheckCircle } from "lucide-react";

/**
 * AcademicSafeActionSection — Nhịp Tĩnh Lặng Nhất
 * StudentHub Visual System VNext — "Khai Minh"
 * - No giant gradient spectacle. Pure calm, dignified assurance.
 * - Headline: "Kiểm chứng trước. Quyết định sau."
 * - Primary Action + Trust Statement + Privacy Statement.
 */
export default function AcademicSafeActionSection() {
  return (
    <section
      className="py-24 lg:py-32 bg-[#08110F] text-center relative overflow-hidden"
      aria-labelledby="safe-action-title"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Subtitle */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest text-[#7BE0B2] bg-[#0F1B18] border border-white/[0.1] uppercase mb-6">
          06 / Điểm Tựa An Toàn
        </div>

        {/* Master Dignified Closing Headline */}
        <h2
          id="safe-action-title"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E6] leading-[1.2]"
        >
          Kiểm chứng trước. <br />
          <span className="font-serif italic font-medium text-[#7BE0B2]">
            Quyết định sau.
          </span>
        </h2>

        {/* Reassuring copy */}
        <p className="mt-5 text-base sm:text-lg text-[#C3CCC6] max-w-xl mx-auto leading-relaxed">
          Đừng để các thông tin mập mờ làm gián đoạn lộ trình học tập của bạn.
          Bắt đầu với một công cụ biết bảo vệ và tôn trọng sự thật.
        </p>

        {/* Action Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/trust"
            className="btn-primary-action group"
            aria-label="Bắt đầu khảo chứng ngay tại Trust Engine"
          >
            <ShieldCheck size={18} className="text-[#08110F]" aria-hidden="true" />
            <span>Bắt đầu khảo chứng ngay</span>
            <span className="btn-icon-bubble" aria-hidden="true">
              <ArrowRight size={15} />
            </span>
          </Link>

          <Link
            href="/register"
            className="px-5 py-3.5 rounded-full bg-[#0F1B18] hover:bg-[#13221E] text-[#F4F0E6] border border-white/[0.12] hover:border-[#7BE0B2]/40 font-medium text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-[#7BE0B2]"
          >
            Tạo tài khoản sinh viên
          </Link>
        </div>

        {/* Quiet Trust & Privacy Commitments */}
        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-center gap-8 text-xs font-mono text-[#8A9891]">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-[#7BE0B2]" />
            <span>Mọi kết luận đều có trích dẫn nguồn gốc</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-[#7BE0B2]" />
            <span>Không thu thập dữ liệu cá nhân trái phép</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-[#7BE0B2]" />
            <span>Chuẩn học thuật & Kiểm định độc lập</span>
          </div>
        </div>
      </div>
    </section>
  );
}
