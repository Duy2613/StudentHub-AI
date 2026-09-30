"use client";

import React from "react";
import Link from "next/link";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import SmartVideo from "@/components/media/SmartVideo";
import { GraduationCap, Award, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

const EXPERT_BOUNDARIES = [
  "Một vai trò được chọn trong giao diện không tự xác minh danh tính hoặc chuyên môn.",
  "Quyền Expert đến từ hồ sơ do máy chủ xác nhận và nhiệm vụ được giao.",
  "Nhận xét cần được đọc trong phạm vi dữ liệu và hồ sơ liên quan.",
];

const REVIEW_CONTEXT = [
  { title: "Hồ sơ được giao", desc: "Nhiệm vụ và phạm vi xác định theo hệ thống." },
  { title: "Thông tin khả dụng", desc: "Chỉ xem xét nội dung và căn cứ thực sự hiện diện." },
  { title: "Nhận xét theo hồ sơ", desc: "Không suy ra thẩm quyền chung từ một nhiệm vụ." },
];

export default function ExpertAuthoritySection() {
  return (
    <section className="relative w-full py-28 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 mb-4">
              <GraduationCap size={14} />
              <span className="text-xs font-mono font-semibold tracking-wider uppercase">
                EXPERT · HỒ SƠ VÀ PHẠM VI THẨM ĐỊNH
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
              Thẩm định theo phạm vi,{" "}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300">
                quyền hạn được xác nhận.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-slate-300 font-serif text-base sm:text-lg leading-relaxed">
              Danh tính, vai trò và nhiệm vụ Expert phụ thuộc hồ sơ do máy chủ xác nhận. Giao diện không tự chứng minh bằng cấp, kinh nghiệm hay kết quả thẩm định.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-white/15 bg-space-900 shadow-2xl group">
            <SmartVideo
              src={V3_MEDIA.expert.liveReview.video}
              poster={V3_MEDIA.expert.liveReview.poster}
              alt="Video giới thiệu không gian Expert"
              className="w-full aspect-[16/10]"
              videoClassName="aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-700"
              posterClassName="aspect-[16/10] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-amber-300 bg-space-950/80 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                VIDEO GIỚI THIỆU KHÔNG GIAN EXPERT
              </span>
              <span className="text-xs font-mono text-slate-300 bg-space-950/80 px-2.5 py-1 rounded border border-white/10">
                KHÔNG PHẢI PHIÊN LIVE
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-3 mb-4 text-amber-400">
                <Award size={22} />
                <h3 className="text-lg font-bold text-white font-sans">
                  Ranh giới thẩm quyền
                </h3>
              </div>
              <ul className="space-y-4 text-sm text-slate-300 font-serif">
                {EXPERT_BOUNDARIES.map((boundary) => (
                  <li key={boundary} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <span>{boundary}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-space-900/60 border border-white/10 backdrop-blur-md">
              <span className="text-xs font-mono text-slate-400 block mb-2">
                ĐIỂM TIN CẬY TOÀN CỤC
              </span>
              <p className="text-sm text-slate-200 font-serif leading-relaxed">
                Không dùng một điểm số chung để xác nhận năng lực. Hãy xem thông tin và thẩm quyền được hiển thị cho đúng hồ sơ.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-space-900/60 border border-white/10 backdrop-blur-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {REVIEW_CONTEXT.map((item, index) => (
              <div key={item.title} className="p-4 rounded-2xl bg-space-950/80 border border-white/10 min-h-32">
                <span className="text-[10px] font-mono text-amber-400 font-bold block mb-2">
                  PHẠM VI 0{index + 1}
                </span>
                <span className="text-sm font-mono font-bold text-white block mb-2">{item.title}</span>
                <span className="text-xs font-serif text-slate-400 leading-relaxed">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            href="/expert"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-space-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <ShieldCheck size={18} />
            <span>Mở không gian Expert</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
