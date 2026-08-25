"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Bot,
  UserCheck,
  CheckCircle2,
  Share2,
  ExternalLink,
  Info,
  Layers,
  ArrowRight,
  Flame,
  Lock,
} from "lucide-react";
import { LAYER_1_STATUS } from "@/lib/ai-trust/layer1/types";
import { saffronAudio } from "@/lib/audio/saffronAudio";

/**
 * RiskMeterSplitVerdict:
 * - Đồng hồ đo rủi ro trực quan (Risk Meter 0-100%)
 * - Bố cục tách biệt 2 cột: [🤖 Phân Tích Tự Động AI] vs [👨‍⚕️ Góc Nhìn Chuyên Gia Cộng Đồng]
 * - Bảng giải trình minh bạch Explainable AI Breakdown
 */
export default function RiskMeterSplitVerdict({ result, currentInput = {}, onShareToForum }) {
  if (!result) return null;

  const { status, confidence = 0.9, reasons = [], signals = [], details = {} } = result;

  const isBlock = status === LAYER_1_STATUS.BLOCK;
  const isSuspicious = status === LAYER_1_STATUS.SUSPICIOUS;
  const isPass = status === LAYER_1_STATUS.PASS;

  // Calculate Risk Percentage (0 - 100%)
  const riskPercentage = isBlock
    ? Math.round(Math.max(85, confidence * 100))
    : isSuspicious
    ? Math.round(Math.max(45, Math.min(75, confidence * 70)))
    : Math.round(Math.max(5, (1 - confidence) * 20));

  // Visual Theme Config
  const theme = isBlock
    ? {
        border: "border-[#ea3810]/50",
        bg: "bg-[#150604]/90",
        badgeBg: "bg-[#ea3810]/20 border-[#ea3810]/60 text-[#ff6b4a]",
        meterGrad: "from-[#ffbc09] via-[#ea3810] to-[#ff2a00]",
        meterText: "text-[#ea3810]",
        title: "CẢNH BÁO NGUY HIỂM (BLOCK)",
        desc: "Phát hiện dấu hiệu lừa đảo / mạo danh hoặc mã độc chắc chắn.",
        statusTag: "RỦI RO CAO",
      }
    : isSuspicious
    ? {
        border: "border-[#ffbc09]/50",
        bg: "bg-[#150a04]/90",
        badgeBg: "bg-[#ffbc09]/20 border-[#ffbc09]/60 text-[#ffd15c]",
        meterGrad: "from-[#38bdf8] via-[#ffd15c] to-[#ffbc09]",
        meterText: "text-[#ffbc09]",
        title: "NGHI VẤN BẤT THƯỜNG (SUSPICIOUS)",
        desc: "Có tín hiệu đáng ngờ cần kiểm chứng thêm nguồn tin chính thức.",
        statusTag: "CẦN LƯU Ý",
      }
    : {
        border: "border-teal-500/50",
        bg: "bg-[#041512]/90",
        badgeBg: "bg-teal-500/20 border-teal-500/60 text-teal-300",
        meterGrad: "from-teal-600 via-teal-400 to-emerald-300",
        meterText: "text-teal-400",
        title: "CHƯA PHÁT HIỆN DẤU HIỆU ĐÁNG NGỜ (PASS)",
        desc: "Không phát hiện dấu hiệu lừa đảo rõ ràng ở Layer 1.",
        statusTag: "AN TOÀN",
      };

  return (
    <div className={`p-6 sm:p-8 rounded-3xl ${theme.bg} border ${theme.border} backdrop-blur-2xl space-y-8 shadow-2xl transition-all`}>
      
      {/* 1. TOP HEADER: RISK METER 0-100% */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#47140b]">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className={`p-3.5 rounded-2xl border ${theme.badgeBg}`}>
            {isBlock ? (
              <ShieldAlert className="w-8 h-8 text-[#ea3810]" />
            ) : isSuspicious ? (
              <AlertTriangle className="w-8 h-8 text-[#ffbc09]" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-teal-400" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <span className={`font-mono text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
                {theme.statusTag}
              </span>
              <span className="font-mono text-xs text-[#ece7e0]/60">
                Layer 1 Deterministic Screening
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              {theme.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-0.5 font-human">
              {details.decisionRationale || theme.desc}
            </p>
          </div>
        </div>

        {/* Risk Meter Visual Gauge */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/50 border border-[#2d0d08] min-w-[240px] justify-between">
          <div>
            <span className="font-mono text-[10px] text-[#ece7e0]/50 uppercase tracking-wider block">
              CHỈ SỐ RỦI RO (RISK METER)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`font-mono text-3xl font-black ${theme.meterText}`}>
                {riskPercentage}%
              </span>
              <span className="font-mono text-xs text-[#ece7e0]/60">
                / 100
              </span>
            </div>
          </div>

          <div className="w-24">
            <div className="h-3 w-full bg-black/80 rounded-full overflow-hidden border border-[#47140b] p-0.5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${theme.meterGrad} transition-all duration-700`}
                style={{ width: `${Math.min(100, Math.max(8, riskPercentage))}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-[#ece7e0]/40 text-right block mt-1">
              Độ tin cậy: {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. SPLIT VIEW: 🤖 KẾT LUẬN AI vs 👨‍⚕️ CHUYÊN GIA CỘNG ĐỒNG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMN A: 🤖 KẾT LUẬN TỰ ĐỘNG CỦA AI */}
        <div className="p-6 rounded-2xl bg-black/40 border border-[#2d0d08] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#38bdf8] flex items-center gap-2">
                <Bot className="w-4 h-4" />
                [01] PHÂN TÍCH TỰ ĐỘNG CỦA AI
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
                Hệ Thống Phán Quyết
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/60 border border-[#47140b] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#ece7e0]/60 font-mono">Loại dữ liệu quét:</span>
                <span className="font-mono font-bold text-white uppercase">{currentInput.type || "Text/URL"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#ece7e0]/60 font-mono">Trạng thái Layer 1:</span>
                <span className={`font-mono font-bold ${theme.meterText}`}>{status}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#ece7e0]/60 font-mono">Độ tin cậy thuật toán:</span>
                <span className="font-mono font-bold text-white">{(confidence * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Reasons / Signals */}
            {reasons.length > 0 && (
              <div>
                <span className="font-mono text-[10px] text-[#ece7e0]/50 uppercase tracking-wider block mb-1.5">
                  Dấu hiệu / Lý do phát hiện ({reasons.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#ea3810]/15 text-[#ff6b4a] border border-[#ea3810]/30 font-mono text-[10px]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#2d0d08] text-[11px] text-[#ece7e0]/70 font-human leading-relaxed">
            {isBlock ? (
              <p className="text-[#ff6b4a]">
                ⚠️ Khuyến cáo AI: <strong>Dừng ngay mọi tương tác</strong>. Tuyệt đối không nhập thông tin mật khẩu, mã OTP, CCCD hoặc chuyển tiền đặt cọc.
              </p>
            ) : isSuspicious ? (
              <p className="text-[#ffd15c]">
                ⚠️ Khuyến cáo AI: Nội dung có điểm bất thường. Hãy đối chiếu với website hoặc hotline chính thức trước khi thực hiện giao dịch.
              </p>
            ) : (
              <p className="text-teal-300">
                ✓ Khuyến cáo AI: Không phát hiện bẫy lừa đảo trực diện. Vẫn nên duy trì cảnh giác với các yêu cầu giao dịch bất thường.
              </p>
            )}
          </div>
        </div>

        {/* COLUMN B: 👨‍⚕️ GÓC NHÌN & KHUYẾN NGHỊ CHUYÊN GIA */}
        <div className="p-6 rounded-2xl bg-black/40 border border-[#2d0d08] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#ffbc09] flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                [02] GÓC NHÌN CHUYÊN GIA CỘNG ĐỒNG
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ffbc09]/10 text-[#ffbc09] border border-[#ffbc09]/30">
                Thẩm Định Thực Chứng
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/60 border border-[#47140b] space-y-2 text-xs font-human text-[#ece7e0]/90 leading-relaxed">
              {isBlock ? (
                <div className="space-y-1.5">
                  <p className="font-bold text-white">👨‍🏫 Lời khuyên từ Chuyên gia An toàn Mạng:</p>
                  <p>
                    1. Nhà trường và Ngân hàng <strong>không bao giờ yêu cầu gửi OTP hoặc mật khẩu</strong> qua tin nhắn hay biểu mẫu lạ.
                  </p>
                  <p>
                    2. Nếu đã lỡ nhập thông tin, hãy liên hệ ngay với ngân hàng để <strong>khóa tài khoản tạm thời</strong>.
                  </p>
                </div>
              ) : isSuspicious ? (
                <div className="space-y-1.5">
                  <p className="font-bold text-white">👨‍🏫 Lời khuyên từ Cố vấn Sinh viên:</p>
                  <p>
                    1. Kiểm tra kỹ địa chỉ tên miền xem có đuôi <code>.edu.vn</code> hoặc <code>.gov.vn</code> hay không.
                  </p>
                  <p>
                    2. Tham khảo ý kiến các bạn sinh viên cùng trường trên Diễn đàn trước khi đóng bất kỳ khoản phí nào.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="font-bold text-white">👨‍🏫 Lời khuyên từ Cố vấn Đời sống:</p>
                  <p>
                    Nội dung bước đầu an toàn. Nếu là thông tin thuê trọ hoặc việc làm, hãy luôn yêu cầu hợp đồng rõ ràng và biên lai thanh toán.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-3 border-t border-[#2d0d08] flex items-center justify-between">
            <span className="text-[11px] text-[#ece7e0]/60 font-mono">
              Bạn muốn hỏi ý kiến cộng đồng?
            </span>
            {onShareToForum && (
              <button
                type="button"
                onClick={() => {
                  saffronAudio.playSuccessChime();
                  onShareToForum();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ffbc09] text-[#150604] font-mono text-xs font-bold hover:scale-105 transition-all shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Đăng lên Diễn đàn</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 3. EXPLAINABLE AI BREAKDOWN CHECKLIST */}
      <div className="p-5 rounded-2xl bg-black/50 border border-[#2d0d08] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#ffbc09]" />
            Bảng Giải Trình Minh Bạch (Explainable AI Breakdown)
          </h3>
          <span className="font-mono text-[10px] text-[#ece7e0]/50">
            Audit Checkpoints: 4/4
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-[#47140b] space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 font-mono font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1. Normalization</span>
            </div>
            <p className="text-[#ece7e0]/70 text-[11px]">
              Bóc tách cấu trúc URL, văn bản thô &amp; khử ký tự lẩn tránh.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-[#47140b] space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 font-mono font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>2. Brand &amp; Keyword</span>
            </div>
            <p className="text-[#ece7e0]/70 text-[11px]">
              Đối soát 70+ danh mục thương hiệu ngân hàng &amp; đại học.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-[#47140b] space-y-1">
            <div className={`flex items-center gap-1.5 font-mono font-bold text-[11px] ${isBlock ? "text-[#ea3810]" : "text-teal-400"}`}>
              {isBlock ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>3. Threat Evaluation</span>
            </div>
            <p className="text-[#ece7e0]/70 text-[11px]">
              Đánh giá bẫy OTP, lừa cọc, mạo danh &amp; file nguy hiểm.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-[#47140b] space-y-1">
            <div className={`flex items-center gap-1.5 font-mono font-bold text-[11px] ${theme.meterText}`}>
              <Info className="w-3.5 h-3.5" />
              <span>4. Final Output</span>
            </div>
            <p className="text-[#ece7e0]/70 text-[11px]">
              Kết luận {status} ({riskPercentage}% Rủi ro) với thời gian thực thi tức thì.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
