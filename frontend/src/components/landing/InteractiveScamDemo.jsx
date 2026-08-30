"use client";

import React, { useState } from "react";

import { ShieldAlert, Sparkles, ArrowRight, CheckCircle2, Users } from "lucide-react";
import TactileButton from "@/components/ui/TactileButton";
import Interactive3DBlockCard from "@/components/ui/Interactive3DBlockCard";


const DEMO_CASES = [
  {
    id: "scam-task",
    label: "Tuyển CTV làm nhiệm vụ nạp cọc",
    input: "Tuyển sinh viên làm CTV duyệt đơn Shopee tại nhà. Lương 300k - 500k/ngày, nạp cọc 200k kích hoạt tài khoản và nhận hoa hồng 20% ngay sau 5 phút.",
    risk: 94,
    status: "scam",
    riskLabel: "Nghi vấn lừa đảo (Rất cao)",
    aiNotice: "Yêu cầu nạp cọc kích hoạt nhiệm vụ là bẫy tài chính ponzi chiếm đoạt tiền cọc điển hình.",
    expertQuote: "Thủ đoạn đánh vào tâm lý sinh viên cần việc làm thêm. Tuyệt đối không chuyển tiền vào số tài khoản cá nhân.",
  },
  {
    id: "scam-house",
    label: "Phòng trọ giá rẻ bắt cọc giữ chỗ qua mạng",
    input: "Cho thuê phòng trọ cao cấp ngõ 27 Tạ Quang Bửu giá 1.5 triệu full nội thất, chuyển khoản cọc 1 triệu để giữ phòng trước vì nhiều người hỏi.",
    risk: 88,
    status: "scam",
    riskLabel: "Nghi vấn lừa đảo (Cao)",
    aiNotice: "Hình ảnh phòng sang trọng không tương xứng giá tiền, ép cọc trước khi xem thực tế.",
    expertQuote: "Nguyên tắc: Không chuyển tiền cọc khi chưa đến xem nhà trực tiếp và ký biên bản cọc chính chủ.",
  },
  {
    id: "safe-edu",
    label: "Thông báo học bổng chính thống từ trường (.edu.vn)",
    input: "Thông báo từ Phòng CTSV ĐH Bách Khoa (sis.hust.edu.vn): Danh sách sinh viên nhận học bổng KKHT Học kỳ 1. Không thu bất kỳ khoản phí nào.",
    risk: 12,
    status: "safe",
    riskLabel: "Nghi vấn an toàn (Độ tin cậy cao)",
    aiNotice: "Trùng khớp Whitelist tên miền giáo dục quốc gia (.edu.vn), không có yêu cầu nộp lệ phí.",
    expertQuote: "Thông báo chính thống. Sinh viên chỉ cần theo dõi tài khoản ngân hàng liên kết với nhà trường.",
  },
];

export default function InteractiveScamDemo() {
  const [selectedCase, setSelectedCase] = useState(DEMO_CASES[0]);

  return (
    <section className="py-24 relative z-10" id="demo">
      <div className="layout-safe-container space-y-12">
        
        {/* Section Title with Inter (Human) + Serif */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="igloo-pill-badge warn">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>03 / TRẢI NGHIỆM TRỰC QUAN</span>
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            <span className="font-serif-editorial italic font-normal text-gradient-primary">
              Mô phỏng phân tích,
            </span>
            <br />
            <span className="font-human font-black tracking-tight">
              thực chứng cùng AI.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 font-human leading-relaxed max-w-xl mx-auto">
            Chọn 1 trong các tình huống thực tế dưới đây để xem cách hệ thống đưa ra Thước đo rủi ro và nhận định kép giữa AI Engine và Cố vấn.
          </p>
        </div>

        {/* Interactive 3D Perspective Workspace */}
        <Interactive3DBlockCard
          glowColor="rgba(245, 158, 11, 0.35)"
          maxTilt={6}
          depth={30}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-space-950/90 border border-white/12 rounded-3xl p-6 sm:p-10 shadow-[0_12px_50px_rgba(0,0,0,0.7)] space-y-8 backdrop-blur-3xl">
            
            {/* Preset Selection Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3" style={{ transform: "translateZ(30px)" }}>
              {DEMO_CASES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCase(c)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-human font-bold transition-all ${
                    selectedCase.id === c.id
                      ? "bg-teal-400 text-space-950 shadow-[0_0_20px_rgba(52,231,196,0.4)] scale-105"
                      : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Input Simulation Preview */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5" style={{ transform: "translateZ(20px)" }}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-machine">
                NỘI DUNG MÔ PHỎNG ĐẦU VÀO (OCR / LINK / TEXT):
              </p>
              <p className="text-xs sm:text-sm text-gray-200 font-machine italic leading-relaxed">
                "{selectedCase.input}"
              </p>
            </div>

            {/* Machine Interface Lookbook Component: .ai-analysis-box */}
            <div
              style={{ transform: "translateZ(25px)" }}
              className={`ai-analysis-box ${
                selectedCase.status === "scam" ? "danger" : "safe"
              }`}
            >
              <div className="ai-header font-machine">
                {selectedCase.status === "scam" ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>AI SECURITY SCANNER v2.8</span>
                <span className="ml-auto text-[10px] font-bold font-machine">
                  {selectedCase.status === "scam" ? (
                    <span className="status-danger">[THREAT: {selectedCase.risk}%]</span>
                  ) : (
                    <span className="status-safe">[SAFE: {100 - selectedCase.risk}% CONFIDENCE]</span>
                  )}
                </span>
              </div>

              <div className="ai-content font-machine text-xs space-y-2">
                <p><span className="label">Target:</span> {selectedCase.label}</p>
                <p>
                  <span className="label">Status:</span>{" "}
                  <span className={selectedCase.status === "scam" ? "status-danger" : "status-safe"}>
                    {selectedCase.riskLabel}
                  </span>
                </p>
                <div className="details">
                  &gt;&gt; Phân tích AI 4 Lớp: {selectedCase.aiNotice}
                  <span className="dg-cursor" />
                </div>
              </div>
            </div>

            {/* Dual Outputs: Expert Verification Quote (Human Interface) */}
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2" style={{ transform: "translateZ(20px)" }}>
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-human">
                <Users className="w-4 h-4 text-amber-400" /> 👨‍⚕️ Cố Vấn Chuyên Gia Uy Tín (Thẩm Định Thực Chứng):
              </p>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed italic font-human">
                "{selectedCase.expertQuote}"
              </p>
            </div>

            {/* Full Checker CTA */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2" style={{ transform: "translateZ(20px)" }}>
              <p className="text-xs text-gray-400 font-human">
                Bạn có đường link hoặc đoạn tin nhắn nghi vấn cụ thể cần quét thực tế?
              </p>
              <TactileButton
                variant="primary"
                size="md"
                href="/scam-check"
                icon={ArrowRight}
                techSuffix="[OCR ENGINE]"
              >
                Mở Công Cụ Kiểm Tra Đầy Đủ
              </TactileButton>
            </div>

          </div>
        </Interactive3DBlockCard>

      </div>
    </section>
  );
}
