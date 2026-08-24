"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Heart, ExternalLink } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-space-950/80 backdrop-blur-2xl text-gray-400 text-xs py-12 px-4 sm:px-8 z-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Contest */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 p-[1.5px]">
                <div className="w-full h-full bg-space-950 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                </div>
              </div>
              <span className="text-base font-extrabold text-white">
                StudentHub <span className="text-teal-300 text-xs px-1.5 py-0.5 rounded bg-teal-400/20">AI</span>
              </span>
            </div>

            <p className="text-xs text-gray-300 max-w-md leading-relaxed">
              Nền tảng phòng chống lừa đảo &amp; mạng lưới xác thực thông tin dành cho sinh viên Việt Nam. Kết hợp AI phân tích 4 lớp, chuyên gia uy tín và diễn đàn cộng đồng.
            </p>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 inline-block text-[11px] text-teal-300 font-semibold">
              🏆 Dự án dự thi <strong>Cuộc thi Sáng tạo trẻ Quốc gia trong lĩnh vực Trí tuệ nhân tạo năm 2026</strong> • Bảng C (sinh viên).
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Tính Năng Cốt Lõi</p>
            <ul className="space-y-2">
              <li>
                <Link href="/scam-check" className="hover:text-teal-300 transition-colors">
                  AI Scam Checker (4 Lớp)
                </Link>
              </li>
              <li>
                <Link href="/forum" className="hover:text-teal-300 transition-colors">
                  Diễn Đàn Cộng Đồng Sinh Viên
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-teal-300 transition-colors">
                  Bảng Điều Khiển &amp; Cảnh Báo
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-teal-300 transition-colors">
                  Mạng Lưới Chuyên Gia &amp; Uy Tín
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Principles */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Nguyên Tắc Nền Tảng</p>
            <ul className="space-y-2 text-[11px] text-gray-400">
              <li>✓ 100% Miễn phí cho sinh viên</li>
              <li>✓ Không thương mại hóa dịch vụ</li>
              <li>✓ Động cơ Explainable AI minh bạch</li>
              <li>✓ Bảo mật &amp; an toàn dữ liệu cá nhân</li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <p>© 2026 StudentHub AI. Tất cả quyền được bảo lưu.</p>
          <p className="flex items-center gap-1">
            Xây dựng với tâm huyết dành cho cộng đồng sinh viên Việt Nam <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>

      </div>
    </footer>
  );
}
