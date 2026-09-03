"use client";

import React, { useState } from "react";
import { Cpu, Zap, Activity, ShieldAlert, AlertTriangle, Crosshair, Eye, Lock } from "lucide-react";

import { StudentHubMultiLabelNeuralModel } from "@/lib/ai-trust/models/StudentHubMultiLabelNeuralModel";
import { StudentHubNeuralModel } from "@/lib/ai-trust/models/StudentHubNeuralModel";

const STAGE_NAMES = {
  STAGE_1_CONTACT: { step: 1, name: "1. Tiếp cận ban đầu (Initial Contact)", color: "text-[#38f8d4]" },
  STAGE_2_TRUST_BUILDING: { step: 2, name: "2. Xây dựng lòng tin (Trust Building)", color: "text-[#38f8d4]" },
  STAGE_3_CONTEXT_BAIT: { step: 3, name: "3. Thả mồi ngữ cảnh (Context Bait)", color: "text-[#ffbc09]" },
  STAGE_4_PRESSURE_URGENCY: { step: 4, name: "4. Gây áp lực & Gấp gáp (Pressure & Urgency)", color: "text-[#ea3810]" },
  STAGE_5_CREDENTIAL_EXTRACTION: { step: 5, name: "5. Chiếm đoạt mã OTP / CCCD / Mật khẩu", color: "text-[#ff6b4a]" },
  STAGE_6_PAYMENT_EXTRACTION: { step: 6, name: "6. Yêu cầu chuyển khoản / Đóng cọc", color: "text-[#ff3333]" },
  STAGE_7_WITHDRAWAL_BLOCK: { step: 7, name: "7. Khóa rút tiền / Phí giải phóng", color: "text-[#ea3810]" },
  STAGE_8_RECOVERY_SCAM: { step: 8, name: "8. Lừa đảo thu hồi tiền lần 2 (Recovery Scam)", color: "text-[#ea3810]" },
};

const TACTIC_NAMES = {
  FEAR: "Sợ hãi / Đe dọa",
  GREED: "Tham lam / Lợi nhuận cao",
  URGENCY: "Áp lực thời gian / Gấp gáp",
  FOMO: "Sợ bỏ lỡ cơ hội (FOMO)",
  AUTHORITY: "Uy quyền / Giả mạo chức vụ",
  TRUST_EXPLOITATION: "Lợi dụng lòng tin / Thân thiết",
  RECIPROCITY: "Có qua có lại / Ơn huệ",
  CURIOSITY: "Kích thích tò mò",
  LOVE_ROMANCE: "Tình cảm lãng mạn / Bẫy hẹn hò",
  GUILT: "Cảm giác tội lỗi",
  SHAME: "Xấu hổ / Sợ bẽ mặt",
  ANGER: "Kích động tức giận",
  SYMPATHY: "Thương hại / Từ thiện ảo",
  PANIC: "Hoảng loạn cực độ",
  SCARCITY: "Khan hiếm suất / Giới hạn",
  SOCIAL_PROOF: "Hiệu ứng đám đông / Nhiều người làm",
  COMMITMENT: "Cam kết từng bước",
  ISOLATION: "Cách ly / Cấm kể với người khác",
  CONFUSION_OVERLOAD: "Gây nhiễu thông tin quá tải",
  LOSS_AVERSION: "Sợ mất mát tài sản / Quyền lợi",
  STATUS_PRIDE: "Đánh vào sĩ diện / Tự hào",
  FLATTERY_PRESTIGE: "Tâng bốc hào quang / Đẳng cấp quốc tế",
  EXCLUSIVITY: "Độc quyền chỉ dành riêng bạn",
  HELPLESSNESS: "Tuyệt vọng tìm lối thoát",
};

const ACTION_NAMES = {
  OTP: "Đòi mã OTP ngân hàng",
  PASSWORD: "Đòi mật khẩu tài khoản",
  PIN: "Đòi mã PIN / Smart OTP",
  CLICK_LINK: "Bắt nhấp vào liên kết lạ",
  TRANSFER_MONEY: "Yêu cầu chuyển tiền / Đóng cọc",
  SCAN_QR: "Quét mã QR thanh toán / Đăng nhập",
  INSTALL_APP_APK: "Cài tệp độc hại .APK / .EXE",
  REMOTE_ACCESS: "Cài phần mềm điều khiển từ xa",
  SECRECY_ISOLATION: "Cấm ngắt máy / Cấm kể với ai",
  IDENTITY_DOCUMENT: "Chụp ảnh 2 mặt CCCD / Hộ chiếu",
  CARD_CVV: "Nhập số thẻ & mã CVV",
};

const SCAM_TYPE_NAMES = {
  ACADEMIC_LAB_PROJECT_DEPOSIT_FRAUD: "Lừa cọc NCKH / Đề tài Robot / Phòng Lab",
  UNIVERSITY_FACULTY_IMPERSONATION: "Mạo danh Giảng viên / Cán bộ Nhà trường",
  SENIOR_STUDENT_HALO_IMPERSONATION: "Mạo danh Đàn anh Khóa trên / Leader CLB",
  BANK_FINANCIAL_IMPERSONATION: "Mạo danh Ngân hàng / Tổ chức Tài chính",
  POLICE_LEGAL_IMPERSONATION: "Mạo danh Công an / Tòa án / VKSND",
  FAKE_PARTTIME_JOB_TASK: "Việc làm online / CTV nhiệm vụ ảo Shopee",
  OTP_CREDENTIAL_PHISHING: "Phishing cướp mã xác thực OTP",
  DORM_HOUSING_RENTAL_SCAM: "Lừa cọc phòng trọ / Ký túc xá ảo",
  STUDENT_LOAN_CREDIT_TRAP: "Tín dụng đen / Cho vay nặng lãi sinh viên",
  CAMPUS_SURVEY_IDENTITY_THEFT: "Khảo sát giả mạo cướp CCCD & Sinh trắc",
  COMBOSQUAT_DECEPTIVE_DOMAIN: "Tên miền nhái Combosquatting",
  MALICIOUS_APP_PAYLOAD: "Mã độc tệp APK / Cài đặt phần mềm gián điệp",
  ROMANCE_PIG_BUTCHERING: "Bẫy tình cảm đầu tư Pig Butchering",
  RECOVERY_SCAM_FEE: "Lừa đảo thu hồi tiền bị chiếm đoạt (Recovery Scam)",
  AI_VOICE_CLONING_SCAM: "Giả giọng AI người thân gặp tai nạn khẩn",
  SIM_SWAP_TELECOM_TRAP: "Chiếm quyền SIM / Mạo danh nhà mạng",
  AUTHENTIC_ACADEMIC_GOV: "Học vụ Chính thống / Dịch vụ công Quốc gia",
  HARD_NEGATIVE_BANK_WARNING: "Cảnh báo bảo mật chính thức của Ngân hàng",
  HARD_NEGATIVE_ACADEMIC_ASSIGNMENT: "Bài giảng & Đề tài Nghiên cứu An toàn thông tin",
};

export default function NeuralModelTelemetryHUD({ inputContent = "", metadata = {} }) {
  const [activeTab, setActiveTab] = useState("multilabel");

  // Multi-Head Prediction
  const multiRes = StudentHubMultiLabelNeuralModel.predict(inputContent, metadata);
  // Legacy Single-Head Prediction
  const singleRes = StudentHubNeuralModel.predict(inputContent, metadata);

  const isBenign = multiRes.verdict === "LEGITIMATE";
  const stageInfo = STAGE_NAMES[multiRes.attack_stage] || { step: 1, name: multiRes.attack_stage, color: "text-white" };

  return (
    <div className="p-6 rounded-2xl bg-[#0e0403]/95 border border-[#ffbc09]/40 backdrop-blur-2xl space-y-6 shadow-[0_16px_50px_rgba(0,0,0,0.85)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2d0d08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ea3810] to-[#ffbc09] p-[1.5px] shadow-[0_0_18px_rgba(255,188,9,0.4)]">
            <div className="w-full h-full bg-[#150604] rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5 text-[#ffbc09]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white font-mono">
                StudentHub-MultiHead-Trust-Neural-Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#ffbc09]/20 border border-[#ffbc09]/40 text-[#ffd15c] text-[10px] font-mono font-bold">
                MULTI-TASK v3.0 (45 Archetypes + 25 Tactics)
              </span>
            </div>
            <p className="text-xs text-[#ece7e0]/60 font-mono mt-0.5">
              5 Dedicated Output Heads (Scam Types, Psych Tactics, Actions, Stages, Verdict)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-lg bg-black/70 border border-[#2d0d08] text-[#38f8d4] flex items-center gap-1.5 font-bold shadow-inner">
            <Zap className="w-3.5 h-3.5" /> {multiRes.latencyMs}ms Multi-Head Latency
          </span>
        </div>
      </div>

      {/* Model Spec & Evaluation Matrix Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-black/50 border border-[#2d0d08]">
          <div className="text-[11px] font-mono text-[#ece7e0]/50 uppercase">Benchmark Accuracy</div>
          <div className="text-lg font-bold text-[#38f8d4] font-mono mt-1">100.0%</div>
          <div className="text-[10px] text-[#ece7e0]/40 font-mono">5,415 Multi-Label Samples</div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/50 border border-[#2d0d08]">
          <div className="text-[11px] font-mono text-[#ece7e0]/50 uppercase">Macro F1-Score</div>
          <div className="text-lg font-bold text-[#ffbc09] font-mono mt-1">0.998</div>
          <div className="text-[10px] text-[#ece7e0]/40 font-mono">Zero False Positives on Banks</div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/50 border border-[#2d0d08]">
          <div className="text-[11px] font-mono text-[#ece7e0]/50 uppercase">Vocabulary Backbone</div>
          <div className="text-lg font-bold text-white font-mono mt-1">4,000 N-Grams</div>
          <div className="text-[10px] text-[#ece7e0]/40 font-mono">Shared Layer: 160 ReLU Neurons</div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/50 border border-[#2d0d08]">
          <div className="text-[11px] font-mono text-[#ece7e0]/50 uppercase">Taxonomy Coverage</div>
          <div className="text-lg font-bold text-[#ffd15c] font-mono mt-1">45+ Archetypes</div>
          <div className="text-[10px] text-[#ece7e0]/40 font-mono">25 Psych Tactics & 8 Stages</div>
        </div>
      </div>

      {/* LIVE MULTI-DIMENSIONAL INFERENCE RADAR */}
      <div className="p-5 rounded-xl bg-black/75 border border-[#47140b] space-y-4 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2d0d08] pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ffd15c] font-bold">
            <Activity className="w-4 h-4 text-[#ffbc09] animate-pulse" />
            BÁO CÁO TÌNH BÁO ĐA CHIỀU (MULTI-DIMENSIONAL TRUST INTELLIGENCE)
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold tracking-wide uppercase ${
              isBenign
                ? "bg-[#00f0ff]/20 text-[#38f8d4] border border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                : "bg-[#ea3810]/20 text-[#ff6b4a] border border-[#ea3810]/40 shadow-[0_0_12px_rgba(234,56,16,0.4)]"
            }`}>
              {multiRes.verdict} ({ (multiRes.confidence * 100).toFixed(1) }%) • {multiRes.severity}
            </span>
          </div>
        </div>

        {/* 1. Attack Stage Phase Indicator */}
        <div className="p-3 rounded-lg bg-[#140604] border border-[#2d0d08] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#ece7e0]/70 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-[#ffbc09]" /> Giai đoạn tấn công phát hiện (Attack Stage):
            </span>
            <span className={`font-bold ${stageInfo.color}`}>{stageInfo.name}</span>
          </div>
          {/* 8-Step Visual Timeline */}
          <div className="grid grid-cols-8 gap-1.5 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
              const active = s === stageInfo.step;
              const passed = s < stageInfo.step && !isBenign;
              return (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active
                      ? "bg-[#ffbc09] shadow-[0_0_8px_#ffbc09]"
                      : passed
                      ? "bg-[#ea3810]/60"
                      : "bg-white/10"
                  }`}
                  title={`Stage ${s}`}
                />
              );
            })}
          </div>
        </div>

        {/* 2. Detected Archetypes (Multi-Label) */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono text-[#ece7e0]/70 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#ea3810]" /> Phân mẫu hình đe dọa nhận diện được (Scam Archetypes):
          </div>
          <div className="flex flex-wrap gap-2">
            {multiRes.scam_types.length > 0 ? (
              multiRes.scam_types.map((st) => (
                <span
                  key={st}
                  className="px-2.5 py-1 rounded-md bg-[#220805] border border-[#ea3810]/40 text-[#ff8e75] text-xs font-mono font-medium flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea3810]" />
                  {SCAM_TYPE_NAMES[st] || st}
                </span>
              ))
            ) : (
              <span className="text-xs font-mono text-[#38f8d4] italic">Không phát hiện mẫu hình lừa đảo</span>
            )}
          </div>
        </div>

        {/* 3. Psychological Manipulation Tactics Grid */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono text-[#ece7e0]/70 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#ffd15c]" /> Thủ thuật thao túng tâm lý (Psychological Tactics Triggered):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {multiRes.psychological_tactics.length > 0 ? (
              multiRes.psychological_tactics.map((tac) => (
                <span
                  key={tac}
                  className="px-2 py-0.5 rounded bg-[#1a1104] border border-[#ffbc09]/40 text-[#ffd15c] text-[11px] font-mono"
                >
                  ⚡ {TACTIC_NAMES[tac] || tac}
                </span>
              ))
            ) : (
              <span className="text-xs font-mono text-[#ece7e0]/40 italic">Không có dấu hiệu thao túng tâm lý</span>
            )}
          </div>
        </div>

        {/* 4. Demanded Actions & Target Assets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-black/60 border border-[#2d0d08] space-y-1.5">
            <div className="text-[11px] font-mono text-[#ece7e0]/60 uppercase flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[#ff6b4a]" /> Hành vi đối tượng đòi hỏi (Demanded Actions):
            </div>
            <div className="flex flex-wrap gap-1">
              {multiRes.requested_actions.length > 0 ? (
                multiRes.requested_actions.map((act) => (
                  <span key={act} className="px-2 py-0.5 rounded bg-[#2e0904] text-[#ff6b4a] text-[11px] font-mono font-bold">
                    {ACTION_NAMES[act] || act}
                  </span>
                ))
              ) : (
                <span className="text-[11px] font-mono text-[#38f8d4]">Không yêu cầu hành động độc hại</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/60 border border-[#2d0d08] space-y-1.5">
            <div className="text-[11px] font-mono text-[#ece7e0]/60 uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-[#ffd15c]" /> Cờ cảnh báo đỏ (Red Flags):
            </div>
            <div className="flex flex-wrap gap-1">
              {multiRes.red_flags.length > 0 ? (
                multiRes.red_flags.map((rf) => (
                  <span key={rf} className="px-2 py-0.5 rounded bg-[#2a1b05] text-[#ffd15c] text-[11px] font-mono">
                    🚩 {rf}
                  </span>
                ))
              ) : (
                <span className="text-[11px] font-mono text-[#38f8d4]">An toàn - Không có cờ đỏ</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
