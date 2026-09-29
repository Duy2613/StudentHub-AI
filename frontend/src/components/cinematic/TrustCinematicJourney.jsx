"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, FileText, Search, UserRound, MessageSquare } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import SmartVideo from "@/components/media/SmartVideo";

const TRUST_STAGES = [
  {
    id: "input",
    step: "01",
    name: "Nội dung gửi lên",
    headline: "Bắt đầu từ điều bạn muốn kiểm tra.",
    description: "Trust nhận nội dung theo các định dạng được hỗ trợ. Phạm vi xử lý và kết quả phụ thuộc vào dữ liệu của hồ sơ.",
    media: V3_MEDIA.trust.input,
    icon: Search,
    pill: "ĐẦU VÀO",
  },
  {
    id: "claims",
    step: "02",
    name: "Mệnh đề",
    headline: "Xem nội dung cụ thể cần đối chiếu.",
    description: "Các mệnh đề được hiển thị khi có trong phản hồi. Không suy diễn chi tiết còn thiếu thành dữ kiện đã xác nhận.",
    media: V3_MEDIA.trust.l1Claim,
    icon: FileText,
    pill: "MỆNH ĐỀ",
  },
  {
    id: "sources",
    step: "03",
    name: "Nguồn và trích dẫn",
    headline: "Kiểm tra nguồn thực sự được trả về.",
    description: "Trust có thể cung cấp trích dẫn có cấu trúc gắn với phiên bản nguồn. Chỉ những căn cứ hiện diện trong phản hồi mới được trình bày.",
    media: V3_MEDIA.trust.l2Discovery.video,
    poster: V3_MEDIA.trust.l2Discovery.poster,
    type: "video",
    icon: ShieldCheck,
    pill: "CĂN CỨ",
  },
  {
    id: "result",
    step: "04",
    name: "Kết quả và giới hạn",
    headline: "Đọc kết luận cùng căn cứ và phần chưa rõ.",
    description: "Kết quả thay đổi theo dữ liệu và phản hồi của dịch vụ. Thiếu nguồn hoặc thông tin thì cần giữ rõ giới hạn đó.",
    media: V3_MEDIA.trust.l5Decision,
    icon: FileText,
    pill: "KẾT QUẢ",
  },
  {
    id: "expert",
    step: "05",
    name: "Thẩm định Expert",
    headline: "Chuyển sang chuyên môn theo hồ sơ được giao.",
    description: "Expert xử lý nhiệm vụ trong phạm vi quyền hạn được hệ thống xác nhận. Việc thẩm định không tự động xảy ra cho mọi hồ sơ.",
    media: V3_MEDIA.trust.humanReview.video,
    poster: V3_MEDIA.trust.humanReview.poster,
    type: "video",
    icon: UserRound,
    pill: "THEO PHẠM VI",
  },
];

export default function TrustCinematicJourney() {
  const [activeIdx, setActiveIdx] = useState(0);
  const currentStage = TRUST_STAGES[activeIdx];

  return (
    <section className="relative w-full py-28 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-br from-emerald-600/10 via-teal-600/10 to-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 mb-4">
            <ShieldCheck size={14} />
            <span className="text-xs font-mono font-semibold tracking-wider uppercase">
              TRUST · KẾT QUẢ GẮN VỚI PHẢN HỒI
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans mb-6">
            Xem xét nội dung,{" "}
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300">
              nguồn và giới hạn.
            </span>
          </h2>
          <p className="text-slate-300 font-serif text-base sm:text-lg leading-relaxed">
            Các bước và thông tin hiển thị tùy dữ liệu hồ sơ cùng phản hồi của dịch vụ. Phần minh họa bên dưới không phải trạng thái trực tiếp hay kết quả của hồ sơ cụ thể.
          </p>
        </div>

        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 mb-12 scrollbar-none" role="group" aria-label="Chọn nội dung giới thiệu Trust">
          {TRUST_STAGES.map((stage, idx) => {
            const isSelected = activeIdx === idx;
            return (
              <button
                key={stage.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setActiveIdx(idx)}
                className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono tracking-wide transition-all whitespace-nowrap " + (
                  isSelected
                    ? "bg-emerald-400 text-space-950 font-bold shadow-lg shadow-emerald-500/25"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                )}
              >
                <span>{stage.step}</span>
                <span>{stage.name}</span>
              </button>
            );
          })}
        </div>

        <div
          id="trust-stage-panel"
          aria-live="polite"
          className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-white/15 bg-space-900/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl overflow-hidden"
        >
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="px-2.5 py-1 rounded bg-white/10 text-[11px] font-mono text-cyan-300 font-semibold border border-white/10">
                  {currentStage.pill}
                </span>
                <span className="text-xs font-mono text-slate-400">PHẦN {currentStage.step}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white font-sans mb-4">
                {currentStage.headline}
              </h3>
              <p className="text-slate-300 font-serif text-base sm:text-lg leading-relaxed mb-8">
                {currentStage.description}
              </p>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-white/10">
              <Link
                href="/trust"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Mở luồng Trust</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <MessageSquare size={15} />
                <span>Thảo luận</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-space-950 shadow-inner group">
            {currentStage.type === "video" ? (
              <SmartVideo
                key={currentStage.media}
                src={currentStage.media}
                poster={currentStage.poster}
                alt="Video giới thiệu giao diện Trust"
                className="w-full h-full"
                videoClassName="object-cover group-hover:scale-105 transition-transform duration-700"
                posterClassName="object-cover"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentStage.media}
                alt="Hình ảnh giới thiệu giao diện Trust"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-space-950/80 via-transparent to-space-950/20 pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="text-[11px] font-mono text-slate-300 bg-space-950/80 px-2.5 py-1 rounded border border-white/10 backdrop-blur-sm">
                HÌNH ẢNH GIỚI THIỆU
              </span>
              <span className="text-[11px] font-mono text-slate-300 bg-space-950/80 px-2 py-0.5 rounded border border-white/10">
                KHÔNG PHẢI HỒ SƠ THẬT
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
