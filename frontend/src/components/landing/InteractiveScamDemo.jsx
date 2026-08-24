"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Sparkles, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Bot, 
  Users,
  Layers,
  ChevronRight
} from "lucide-react";
import TactileButton from "@/components/ui/TactileButton";
import { motion, AnimatePresence } from "motion/react";

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
    <section className="py-20 relative z-10" id="demo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title with Editorial Serif Typography */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>03 / TRẢI NGHIỆM TRỰC QUAN</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
            <span className="font-serif-editorial italic text-gradient-primary">
              Mô phỏng phân tích,
            </span>
            <br />
            <span className="font-sans font-black tracking-tight">
              thực chứng cùng AI.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl mx-auto">
            Chọn 1 trong các tình huống phổ biến dưới đây để xem cách hệ thống đưa ra Thước đo rủi ro và nhận định kép.
          </p>
        </div>

        {/* Interactive Workspace */}
        <div className="max-w-5xl mx-auto bg-space-950/90 border border-white/12 rounded-3xl p-6 sm:p-10 shadow-glass-deep space-y-8 backdrop-blur-3xl">
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {DEMO_CASES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCase(c)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  selectedCase.id === c.id
                    ? "bg-teal-400 text-space-950 shadow-[0_0_20px_rgba(52,231,196,0.4)] scale-105"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Sample Input Preview */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
              Nội dung mô phỏng đầu vào:
            </p>
            <p className="text-xs sm:text-sm text-gray-200 font-mono italic">
              "{selectedCase.input}"
            </p>
          </div>

          {/* Output Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border transition-all ${
              selectedCase.status === "scam"
                ? "bg-rose-950/30 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
                : "bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 font-mono ${
                      selectedCase.status === "scam"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}
                  >
                    {selectedCase.status === "scam" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {selectedCase.riskLabel}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Đánh giá rủi ro: {selectedCase.risk}%
                </h3>
              </div>

              {/* Gauge */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-mono tracking-widest">Thước đo</p>
                  <p
                    className={`text-4xl font-mono font-black ${
                      selectedCase.status === "scam" ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {selectedCase.risk}%
                  </p>
                </div>
              </div>
            </div>

            {/* Dual Outputs: AI + Expert */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6">
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                <p className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-teal-400" /> 🤖 Phân tích từ AI Engine 4 Lớp:
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {selectedCase.aiNotice}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/20 space-y-2">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" /> 👨‍⚕️ Cố vấn Chuyên gia Uy tín:
                </p>
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{selectedCase.expertQuote}"
                </p>
              </div>
            </div>
          </div>

          {/* Full Checker CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="text-xs text-gray-400">
              Bạn có đường link hoặc đoạn tin nhắn nghi vấn cụ thể?
            </p>
            <TactileButton
              variant="primary"
              size="md"
              href="/scam-check"
              icon={ArrowRight}
            >
              Mở Công Cụ Kiểm Tra Đầy Đủ
            </TactileButton>
          </div>

        </div>

      </div>
    </section>
  );
}
