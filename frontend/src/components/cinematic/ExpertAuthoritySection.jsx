"use client";

import React from "react";
import Link from "next/link";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import SmartVideo from "@/components/media/SmartVideo";
import { GraduationCap, Award, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ExpertAuthoritySection() {
  return (
    <section className="relative w-full py-28 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 mb-4">
              <GraduationCap size={14} />
              <span className="text-xs font-mono font-semibold tracking-wider uppercase">
                CHƯƠNG 08 // HỘI ĐỒNG PHẢN BIỆN CHUYÊN GIA
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
              Uy tín học thuật đích thực,{" "}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300">
                không danh xưng ảo.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-slate-300 font-serif text-base sm:text-lg leading-relaxed">
              Mọi chuyên gia trong mạng lưới đều trải qua quy trình xác minh học vị nghiêm ngặt, cam kết minh bạch xung đột lợi ích (COI) và chịu trách nhiệm với từng nhận định.
            </p>
          </div>
        </div>

        {/* Dynamic Dual Media Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          {/* Left: Live Review Video Loop */}
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-white/15 bg-space-900 shadow-2xl group">
            <SmartVideo
              src={V3_MEDIA.expert.liveReview.video}
              poster={V3_MEDIA.expert.liveReview.poster}
              alt="Hội đồng phản biện chuyên gia - Live Expert Audit"
              className="w-full aspect-[16/10]"
              videoClassName="aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-700"
              posterClassName="aspect-[16/10] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <span className="text-xs font-mono text-amber-300 bg-space-950/80 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                LIVE EXPERT AUDIT // HỘI THẢO PHẢN BIỆN ÁN LỆ
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded border border-emerald-500/30">
                BLIND REVIEW ACTIVE
              </span>
            </div>
          </div>

          {/* Right: Qualification & Reputation Credentials */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-3 mb-3 text-amber-400">
                <Award size={22} />
                <h3 className="text-lg font-bold text-white font-sans">
                  Quy Trình Sát Hạch 4 Tầng
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 font-serif">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>Xác thực bằng cấp và đơn vị công tác trực tiếp qua cổng thông tin trường.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>Vượt qua bài sát hạch 10 tình huống pháp lý học vụ phức tạp.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>Kiểm tra ẩn danh chéo (Double-blind peer review) bởi 2 chuyên gia độc lập.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>Cam kết minh bạch xung đột lợi ích (COI) trước mỗi phiên phản biện.</span>
                </li>
              </ul>
            </div>

            {/* Reputation Highlight */}
            <div className="p-6 rounded-2xl bg-space-900/60 border border-white/10 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-1">Chỉ số tin cậy trung bình</span>
                <span className="text-2xl font-extrabold text-amber-300 font-sans">4.9 / 5.0</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block mb-1">Án lệ đã phản biện</span>
                <span className="text-2xl font-extrabold text-white font-sans">320+ Hồ sơ</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Stage Human Qualification Progression */}
        <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-space-900/60 border border-white/10 backdrop-blur-xl">
          <div className="text-center mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-semibold">
              QUY CHUẨN THẨM QUYỀN HỌC THUẬT // NARRATIVE PIPELINE
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { step: "01", title: "XÁC MINH DANH TÍNH", desc: "Xác thực cán bộ giảng dạy qua cổng .edu" },
              { step: "02", title: "SÁT HẠCH QUY CHẾ", desc: "10 kịch bản tình huống pháp lý học vụ" },
              { step: "03", title: "PHẢN BIỆN MÙ", desc: "Đánh giá chéo độc lập không định kiến" },
              { step: "04", title: "ĐỐI THOẠI TRỰC TIẾP", desc: "Phản hồi giải trình có trách nhiệm" },
              { step: "05", title: "UY TÍN ĐỊNH LƯỢNG", desc: "Bảo chứng bằng điểm tín nhiệm công khai" }
            ].map((stg, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-space-950/80 border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold block mb-1">
                    GIAI ĐOẠN {stg.step}
                  </span>
                  <span className="text-xs font-mono font-bold text-white block mb-1">
                    {stg.title}
                  </span>
                </div>
                <span className="text-[11px] font-serif text-slate-400">
                  {stg.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Link */}
        <div className="flex justify-center">
          <Link
            href="/expert"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-space-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <ShieldCheck size={18} />
            <span>Xem danh bạ chuyên gia & Đăng ký gia nhập</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
