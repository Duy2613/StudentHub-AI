"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Check, Layers, Cpu, Users2, FileText, Search } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import SmartVideo from "@/components/media/SmartVideo";

const TRUST_STAGES = [
  {
    id: "input",
    step: "01",
    name: "Tiếp Nhận Nghi Vấn",
    headline: "Bắt đầu từ điều bạn đang băn khoăn.",
    description: "Dán liên kết bài viết, tải ảnh chụp màn hình tin đồn hoặc nội dung email học bổng nghi vấn. Hệ thống khởi tạo hồ sơ bằng chứng số với mã băm an toàn.",
    type: "image",
    media: V3_MEDIA.trust.input,
    icon: Search,
    pill: "KHỞI TẠO HỒ SƠ",
    telemetry: [
      { label: "MÃ BĂM DỮ LIỆU", value: "Băm toàn vẹn (Demo SHA-256)" },
      { label: "ĐỊNH DẠNG ĐẦU VÀO", value: "URL · Ảnh chụp · Email" }
    ]
  },
  {
    id: "claim",
    step: "02",
    name: "Bóc Tách Mệnh Đề",
    headline: "Biến văn bản mơ hồ thành các tuyên bố cụ thể.",
    description: "Hệ thống tự động phân tách bài viết thành các thực thể độc lập: Trường đại học, Học kỳ, Tỷ lệ phần trăm, Thời hạn nộp hồ sơ và Điều kiện tiên quyết.",
    type: "image",
    media: V3_MEDIA.trust.l1Claim,
    icon: FileText,
    pill: "PHÂN TÍCH THỰC THỂ",
    telemetry: [
      { label: "THỰC THỂ BÓC TÁCH", value: "5 Thực thể độc lập (Demo)" },
      { label: "MỆNH ĐỀ CỐT LÕI", value: "Tăng học phí +30%" }
    ]
  },
  {
    id: "discovery",
    step: "03",
    name: "Dò Quét Nguồn Gốc",
    headline: "Tìm kiếm văn bản pháp lý và quy chế trường.",
    description: "Dò quét đối chiếu kho lưu trữ công văn và cổng thông tin văn bản quy chế viện trường cùng cơ sở dữ liệu học bổng chính thức.",
    type: "video",
    media: V3_MEDIA.trust.l2Discovery.video,
    poster: V3_MEDIA.trust.l2Discovery.poster,
    icon: Layers,
    pill: "ĐỐI CHIẾU NGUỒN GỐC",
    telemetry: [
      { label: "CƠ SỞ TRA CỨU", value: "Cổng thông tin quy chế viện trường" },
      { label: "TÀI LIỆU ĐỐI SOÁT", value: "Hồ sơ công văn đào tạo" }
    ]
  },
  {
    id: "independence",
    step: "04",
    name: "Nguồn Độc Lập",
    headline: "7 bài viết không nhất thiết là 7 nguồn độc lập.",
    description: "Nhận diện hiện tượng sao chép thông tin chéo giữa các hội nhóm mạng xã hội. Lọc bỏ các nguồn phụ thuộc để tìm ra nguồn phát tán nguyên bản.",
    type: "image",
    media: V3_MEDIA.trust.sourceIndependence,
    icon: ShieldCheck,
    pill: "LỌC NGUỒN SAO CHÉP",
    telemetry: [
      { label: "BÀI ĐĂNG MXH", value: "7 Bài viết lan truyền (Demo)" },
      { label: "GỐC PHÁT TÁN THẬT", value: "1 Nguồn duy nhất (Sao chép)" }
    ]
  },
  {
    id: "forensics",
    step: "05",
    name: "Pháp Y Bằng Chứng",
    headline: "Đặt bằng chứng ủng hộ và mâu thuẫn lên bàn cân.",
    description: "Mỗi mệnh đề được đối chiếu đa diện: trích dẫn trực tiếp Điều & Khoản quy chế, đối chiếu mốc thời gian và chỉ ra các điểm mâu thuẫn logic.",
    type: "image",
    media: V3_MEDIA.trust.l3Forensics,
    icon: Cpu,
    pill: "ĐỐI KHÁNG LOGIC",
    telemetry: [
      { label: "BẰNG CHỨNG ỦNG HỘ", value: "0 Văn bản hợp lệ" },
      { label: "BẰNG CHỨNG MÂU THUẪN", value: "Điều 14 QĐ Đào tạo (Demo)" }
    ]
  },
  {
    id: "ai-verification",
    step: "06",
    name: "AI Verification — Gemini",
    headline: "Gemini diễn giải có kiểm soát; policy quyết định.",
    description: "Gemini chỉ tóm tắt bằng chứng và nêu bất định theo structured DTO. Trust Policy quyết định security, truth, enforcement và confidence.",
    type: "video",
    media: V3_MEDIA.trust.l4AiVerification.video,
    poster: V3_MEDIA.trust.l4AiVerification.poster,
    icon: Cpu,
    pill: "GEMINI ADVISORY",
    telemetry: [
      { label: "PROVIDER", value: "Gemini" },
      { label: "QUYỀN QUYẾT ĐỊNH", value: "Deterministic Trust Policy" }
    ]
  },
  {
    id: "decision",
    step: "07",
    name: "Phán Quyết Rõ Ràng",
    headline: "Kết luận minh bạch đi kèm lý do và chứng từ.",
    description: "Không đưa ra con số phần trăm mơ hồ. Trình bày rõ ràng: Xác thực (Verified), Cần thận trọng (Caution) hoặc Giả mạo (Unverified) cùng khuyến nghị hành động.",
    type: "image",
    media: V3_MEDIA.trust.l5Decision,
    icon: Check,
    pill: "PHÁN QUYẾT ĐỊNH TÍNH",
    telemetry: [
      { label: "KẾT LUẬN CUỐI", value: "GIẢ MẠO (UNVERIFIED)" },
      { label: "HÀNH ĐỘNG ĐỀ XUẤT", value: "Bỏ qua & Cảnh báo" }
    ]
  },
  {
    id: "human",
    step: "08",
    name: "Thẩm Định Chuyên Gia",
    headline: "Con người luôn là mắt xích phán đoán cuối cùng.",
    description: "Khi phát sinh tình huống phức tạp hoặc chưa có tiền lệ quy chế, hồ sơ được chuyển tiếp đến hội đồng giảng viên và cố vấn học vụ chuyên trách.",
    type: "video",
    media: V3_MEDIA.trust.humanReview.video,
    poster: V3_MEDIA.trust.humanReview.poster,
    icon: Users2,
    pill: "HỘI ĐỒNG PHẢN BIỆN",
    telemetry: [
      { label: "CHUYÊN GIA THẨM ĐỊNH", value: "Cố vấn Học vụ Chuyên trách" },
      { label: "TRÁCH NHIỆM GIẢI TRÌNH", value: "Đánh giá chuyên môn độc lập" }
    ]
  }
];

export default function TrustCinematicJourney() {
  const [activeIdx, setActiveIdx] = useState(0);
  const currentStage = TRUST_STAGES[activeIdx];

  return (
    <section className="relative w-full py-28 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      {/* Dynamic atmospheric aura */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-br from-emerald-600/10 via-teal-600/10 to-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Editorial Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 mb-4">
            <ShieldCheck size={14} />
            <span className="text-xs font-mono font-semibold tracking-wider uppercase">
              TIẾN TRÌNH THẨM ĐỊNH ĐỘC QUYỀN
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans mb-6">
            Hành trình 8 chặng{" "}
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300">
              làm sáng tỏ sự thật.
            </span>
          </h2>
          <p className="text-slate-300 font-serif text-base sm:text-lg leading-relaxed">
            Mỗi kết luận đều trải qua quy trình pháp y nghiêm ngặt, minh bạch đến từng câu chữ của văn bản ban hành.
          </p>
        </div>

        {/* Stage Navigation Pills */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 mb-12 scrollbar-none">
          {TRUST_STAGES.map((stg, idx) => {
            const isSelected = activeIdx === idx;
            return (
              <button
                key={stg.id}
                onClick={() => setActiveIdx(idx)}
                data-cursor={`CHẶNG ${stg.step}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-emerald-400 text-space-950 font-bold shadow-lg shadow-emerald-500/25 scale-105"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                }`}
              >
                <span>{stg.step}</span>
                <span>{stg.name}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Spotlight Stage Card */}
        <div
          className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-white/15 bg-space-900/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl overflow-hidden"
          data-cursor="STAGE INSPECT"
        >
          {/* Corner Crosshairs */}
          <span className="absolute top-2 left-2 text-[10px] font-mono text-white/30 pointer-events-none">+</span>
          <span className="absolute top-2 right-2 text-[10px] font-mono text-white/30 pointer-events-none">+</span>
          <span className="absolute bottom-2 left-2 text-[10px] font-mono text-white/30 pointer-events-none">+</span>
          <span className="absolute bottom-2 right-2 text-[10px] font-mono text-white/30 pointer-events-none">+</span>

          {/* Left Narrative Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="px-2.5 py-1 rounded bg-white/10 text-[11px] font-mono text-cyan-300 font-semibold border border-white/10">
                  {currentStage.pill}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  CHẶNG {currentStage.step} / 08
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans mb-4">
                {currentStage.headline}
              </h3>

              <p className="text-slate-300 font-serif text-base sm:text-lg leading-relaxed mb-6">
                {currentStage.description}
              </p>

              {/* Forensic Epistemic Indicators */}
              {currentStage.telemetry && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {currentStage.telemetry.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-space-950/70 border border-white/10 backdrop-blur-sm"
                    >
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">
                        {t.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300 block">
                        {t.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-white/10">
              <Link
                href="/trust"
                data-cursor="MỞ THẨM ĐỊNH"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Trải nghiệm luồng thẩm định thực tế</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right Media Frame */}
          <div className="lg:col-span-7 relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-space-950 shadow-inner group">
            {currentStage.type === "video" ? (
              <SmartVideo
                key={currentStage.media}
                src={currentStage.media}
                poster={currentStage.poster}
                alt={currentStage.headline}
                className="w-full h-full"
                videoClassName="object-cover group-hover:scale-105 transition-transform duration-700"
                posterClassName="object-cover"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentStage.media}
                alt={currentStage.headline}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-space-950/80 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="text-[11px] font-mono text-slate-300 bg-space-950/80 px-2.5 py-1 rounded border border-white/10 backdrop-blur-sm">
                STAGE ARTIFACT // {currentStage.id.toUpperCase()}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/20">
                KIỂM ĐỊNH TOÀN VẸN
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
