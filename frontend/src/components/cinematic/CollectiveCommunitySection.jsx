"use client";

import React from "react";
import Link from "next/link";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import SmartVideo from "@/components/media/SmartVideo";
import { Users, MessageSquare, ArrowRight } from "lucide-react";

export default function CollectiveCommunitySection() {
  return (
    <section className="relative w-full py-28 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-4">
              <Users size={14} />
              <span className="text-xs font-mono font-semibold tracking-wider uppercase">
                CHƯƠNG 07 // TRÍ TUỆ TẬP THỂ CỘNG ĐỒNG
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
              Diễn đàn phản biện,{" "}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300">
                không phải bãi rác tin đồn.
              </span>
            </h2>
          </div>
          <p className="text-slate-300 font-serif text-base sm:text-lg max-w-md">
            Không gian để chia sẻ bối cảnh, đặt câu hỏi và trao đổi. Bài viết cộng đồng là nội dung do thành viên tạo; bản thân bài viết không xác nhận một thông tin là đúng.
          </p>
        </div>

        {/* Asymmetric Editorial Grid (Hobro-Inspired Staggered Composition) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Main Community Film Card */}
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-white/15 bg-space-900 shadow-2xl group">
            <SmartVideo
              src={V3_MEDIA.community.hero.video}
              poster={V3_MEDIA.community.hero.poster}
              alt="Không gian cộng đồng dành cho trao đổi học vụ"
              className="w-full aspect-[16/10]"
              videoClassName="aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-700"
              posterClassName="aspect-[16/10] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <span className="text-xs font-mono text-cyan-300 uppercase block mb-1">
                  KHÔNG GIAN THẢO LUẬN
                </span>
                <p className="text-base text-white font-serif font-medium">
                  Chia sẻ góc nhìn và bối cảnh để cuộc trao đổi có thêm thông tin.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Stack of Staggered Evidence Cards */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:pt-8">
            {/* Community behavior card */}
            <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-xl hover:border-cyan-500/40 transition-all shadow-xl">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                  BÀI ĐĂNG & TRAO ĐỔI
                </span>
              </div>
              <h4 className="text-base font-bold text-white font-sans mb-2">
                Bắt đầu bằng câu hỏi rõ ràng
              </h4>
              <p className="text-xs text-slate-300 font-serif leading-relaxed mb-4">
                Nêu điều bạn muốn tìm hiểu và bổ sung bối cảnh cần thiết cho cuộc thảo luận.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-3 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <MessageSquare size={13} />
                  <span>Phản hồi theo bài đăng</span>
                </span>
                <span>Nội dung do thành viên tạo</span>
              </div>
            </div>

            {/* Source boundary card */}
            <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 backdrop-blur-xl hover:border-indigo-400 transition-all shadow-xl">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-mono text-indigo-300 font-semibold uppercase">
                  NGUỒN & THẢO LUẬN
                </span>
              </div>
              <p className="text-xs text-slate-200 font-serif leading-relaxed italic mb-3">
                Thành viên có thể chia sẻ liên kết hoặc tài liệu liên quan. Hãy mở nguồn và kiểm tra bối cảnh trước khi dựa vào nội dung.
              </p>
              <span className="text-[10px] font-mono text-slate-400 block">
                Trao đổi cộng đồng không thay thế kết quả Trust hoặc quyết định Expert.
              </span>
            </div>

            {/* Expert boundary card */}
            <div className="p-5 rounded-2xl bg-space-900/60 border border-white/10 backdrop-blur-md flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-cyan-400" />
                <span className="text-slate-300">THẨM ĐỊNH CHUYÊN MÔN THEO HỒ SƠ</span>
              </div>
              <span className="text-cyan-400 font-bold">EXPERT</span>
            </div>
          </div>
        </div>

        {/* Action Link */}
        <div className="flex justify-center">
          <Link
            href="/community"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 backdrop-blur-md font-semibold text-sm transition-all"
          >
            <span>Tham gia không gian thảo luận cộng đồng</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
