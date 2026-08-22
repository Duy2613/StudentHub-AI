"use client";

import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  Globe, 
  Share2, 
  Mail, 
  MessageSquare,
  ShieldCheck,
  Heart
} from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="relative bg-space-950 border-t border-white/10 pt-16 pb-12 overflow-hidden">
      {/* High-Converting Pre-Footer CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-indigo-950 via-purple-950 to-space-950 border border-indigo-500/30 overflow-hidden shadow-glass-deep text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Sẵn Sàng Chinh Phục Mọi Kỳ Thi & Bứt Phá Điểm Số?
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              Gia nhập cộng đồng hơn 50,000 sinh viên xuất sắc đang sử dụng StudentHub AI mỗi ngày.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-white text-space-950 hover:bg-gray-100 active:scale-95 transition-all shadow-lg"
            >
              <span>Đăng Ký Miễn Phí Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Info Column */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
                <div className="w-full h-full bg-space-950 rounded-[7px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                StudentHub <span className="text-indigo-400 text-xs px-1 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">AI</span>
              </span>
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Hệ sinh thái Trí tuệ Nhân tạo & Mạng lưới Cố vấn Học thuật xác thực dành riêng cho sinh viên các trường Đại học tại Việt Nam.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Website">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Community">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Share">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="mailto:support@studenthub.ai" className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Mail">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 1: Tính Năng */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Tính Năng</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#copilot" className="hover:text-indigo-400 transition-colors">AI Academic Copilot</a></li>
              <li><a href="#experts" className="hover:text-indigo-400 transition-colors">Mạng lưới Cố vấn 1:1</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Sơ đồ Tư duy & Flashcards</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Review CV & Khóa luận</a></li>
            </ul>
          </div>

          {/* Column 2: Học Thuật & Chuyên Gia */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Chuyên Gia</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="/register" className="hover:text-indigo-400 transition-colors">Đăng ký làm Cố vấn</Link></li>
              <li><a href="#experts" className="hover:text-indigo-400 transition-colors">Tiêu chí Trust Score</a></li>
              <li><a href="#faq" className="hover:text-indigo-400 transition-colors">Quy trình Phản biện</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Diễn đàn Khoa học</a></li>
            </ul>
          </div>

          {/* Column 3: Pháp Lý & Bảo Mật */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Pháp Lý</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Đạo đức học thuật AI</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Liên hệ hỗ trợ</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Status Indicator */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 StudentHub AI Inc. Bản quyền được bảo lưu.</p>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium font-mono">All AI Copilot Engines Operational</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
