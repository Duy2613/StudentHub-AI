"use client";

// frontend/src/components/auth/SaffronAcademicRadar.jsx
//
// Saffron x uAvionix Academic Email Transponder & Trust Radar
// - Tự động phát hiện email trường học (.edu, .edu.vn, .ac.uk, v.v.)
// - Kích hoạt hiệu ứng quét radar âm thanh Web Audio và cấp ngay +30 Điểm Uy Tín
// - Typography: Kết hợp font-human tự nhiên, chữ nghiêng tinh tế và nhãn in hoa chuẩn xác

import React, { useEffect, useRef } from "react";
import { GraduationCap, Radio, CheckCircle2, Sparkles } from "lucide-react";
import { saffronAudio } from "@/lib/audio/saffronAudio";

export const ACADEMIC_EMAIL_REGEX = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i;

// Nhận diện một số trường đại học tiêu biểu tại Việt Nam
function resolveSchoolName(email) {
  const clean = (email || "").toLowerCase();
  if (clean.includes("hcmut.edu.vn") || clean.includes("bk.edu.vn")) return "Đại học Bách Khoa TP.HCM";
  if (clean.includes("hust.edu.vn")) return "Đại học Bách Khoa Hà Nội";
  if (clean.includes("vnu.edu.vn")) return "Đại học Quốc Gia";
  if (clean.includes("uit.edu.vn")) return "Đại học Công Nghệ Thông Tin (UIT)";
  if (clean.includes("fpt.edu.vn")) return "Đại học FPT";
  if (clean.includes("neu.edu.vn")) return "Đại học Kinh Tế Quốc Dân";
  if (clean.includes("ueh.edu.vn")) return "Đại học Kinh Tế TP.HCM (UEH)";
  if (clean.includes("utc.edu.vn")) return "Đại học Giao Thông Vận Tải (UTC)";
  if (clean.includes("hutech.edu.vn")) return "Đại học HUTECH";
  if (clean.includes("ftu.edu.vn")) return "Đại học Ngoại Thương (FTU)";
  if (clean.includes("tdtu.edu.vn")) return "Đại học Tôn Đức Thắng";
  return "Học Viện / Trường Đại Học Chính Quy";
}

export default function SaffronAcademicRadar({ email = "" }) {
  const isStudent = ACADEMIC_EMAIL_REGEX.test((email || "").trim().toLowerCase());
  const prevStudentRef = useRef(false);

  useEffect(() => {
    // Phát âm thanh radar ping khi chuyển từ email thường sang email học thuật
    if (isStudent && !prevStudentRef.current) {
      saffronAudio.playRadarPing();
    }
    prevStudentRef.current = isStudent;
  }, [isStudent]);

  const schoolName = isStudent ? resolveSchoolName(email) : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ease-out select-none ${
        isStudent
          ? "bg-[#210a07] border-[#ffbc09]/60 shadow-[0_0_25px_rgba(255,188,9,0.15)]"
          : "bg-[#150604]/80 border-[#47140b]/80"
      }`}
    >
      {/* Laser Top Accent Line */}
      <div
        className={`absolute inset-x-0 top-0 h-[1.5px] transition-all duration-500 ${
          isStudent
            ? "bg-gradient-to-r from-transparent via-[#ffbc09] to-transparent opacity-100"
            : "bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40"
        }`}
      />

      <div className="p-4 flex items-start gap-3.5 relative z-10">
        {/* Radar Icon Chip */}
        <div
          className={`flex-shrink-0 p-2.5 rounded-xl border transition-all duration-500 ${
            isStudent
              ? "bg-[#ffbc09] text-[#150604] border-[#ffbc09] shadow-[0_0_15px_rgba(255,188,9,0.4)]"
              : "bg-[#2f0e09] text-[#ece7e0]/60 border-[#47140b]"
          }`}
        >
          {isStudent ? (
            <GraduationCap className="w-5 h-5 animate-bounce-short" />
          ) : (
            <Radio className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 min-w-0 font-human">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold tracking-tight ${isStudent ? "text-[#ffbc09]" : "text-white"}`}>
                {isStudent ? "Đã phát hiện Email Học thuật" : "Radar Quét Email Sinh Viên"}
              </span>
              <span className="text-[10px] font-mono text-[#ece7e0]/40 uppercase tracking-widest">
                [ {isStudent ? "VERIFIED" : "STANDBY"} ]
              </span>
            </div>

            {isStudent && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#ffbc09]/20 border border-[#ffbc09]/40 text-[#ffbc09] text-[10px] font-mono font-extrabold tracking-wider animate-pulse flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#ffbc09]" />
                +30 PTS UY TÍN
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-[#ece7e0]/75 leading-relaxed">
            {isStudent ? (
              <span className="text-[#38bdf8] flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] inline shrink-0" />
                <span><strong className="text-white font-semibold">{schoolName}</strong> • Tự động gắn nhãn <em className="italic text-[#ffbc09]">Sinh viên Xác thực</em></span>
              </span>
            ) : (
              <span>
                Nhập email trường đuôi <span className="font-mono text-[#ffbc09] font-bold">.edu</span> hoặc <span className="font-mono text-[#ffbc09] font-bold">.edu.vn</span> để nhận ngay <strong className="text-white font-semibold">+30 điểm uy tín khởi đầu</strong>.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
