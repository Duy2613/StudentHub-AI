"use client";

// frontend/src/components/auth/SaffronAcademicRadar.jsx
//
// Saffron x uAvionix Academic Email Transponder & Trust Radar
// - Nhận diện định dạng tên miền thường dùng bởi một số tổ chức học thuật
// - Không xác nhận hộp thư, tư cách sinh viên, hoặc cấp điểm uy tín
// - Typography: Kết hợp font-human tự nhiên, chữ nghiêng tinh tế và nhãn in hoa chuẩn xác

import React, { useEffect, useRef } from "react";
import { GraduationCap, Radio } from "lucide-react";
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
  return "Tên miền tổ chức chưa xác định";
}

export default function SaffronAcademicRadar({ email = "" }) {
  const hasInstitutionalEmailShape = ACADEMIC_EMAIL_REGEX.test((email || "").trim().toLowerCase());
  const previousShapeRef = useRef(false);

  useEffect(() => {
    if (hasInstitutionalEmailShape && !previousShapeRef.current) {
      saffronAudio.playRadarPing();
    }
    previousShapeRef.current = hasInstitutionalEmailShape;
  }, [hasInstitutionalEmailShape]);

  const schoolName = hasInstitutionalEmailShape ? resolveSchoolName(email) : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ease-out select-none ${
        hasInstitutionalEmailShape
          ? "bg-[#210a07] border-[#ffbc09]/60 shadow-[0_0_25px_rgba(255,188,9,0.15)]"
          : "bg-[#150604]/80 border-[#47140b]/80"
      }`}
    >
      {/* Laser Top Accent Line */}
      <div
        className={`absolute inset-x-0 top-0 h-[1.5px] transition-all duration-500 ${
        hasInstitutionalEmailShape
            ? "bg-gradient-to-r from-transparent via-[#ffbc09] to-transparent opacity-100"
            : "bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40"
        }`}
      />

      <div className="p-4 flex items-start gap-3.5 relative z-10">
        {/* Radar Icon Chip */}
        <div
          className={`flex-shrink-0 p-2.5 rounded-xl border transition-all duration-500 ${
            hasInstitutionalEmailShape
              ? "bg-[#ffbc09] text-[#150604] border-[#ffbc09] shadow-[0_0_15px_rgba(255,188,9,0.4)]"
              : "bg-[#2f0e09] text-[#ece7e0]/60 border-[#47140b]"
          }`}
        >
          {hasInstitutionalEmailShape ? (
            <GraduationCap className="w-5 h-5 animate-bounce-short" />
          ) : (
            <Radio className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 min-w-0 font-human">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold tracking-tight ${hasInstitutionalEmailShape ? "text-[#ffbc09]" : "text-white"}`}>
                {hasInstitutionalEmailShape ? "Định dạng email có thể thuộc tổ chức" : "Email tổ chức chưa được xác minh"}
              </span>
              <span className="text-[10px] font-mono text-[#ece7e0]/40 uppercase tracking-widest">
                [ {hasInstitutionalEmailShape ? "NEEDS VERIFICATION" : "NOT VERIFIED"} ]
              </span>
            </div>
          </div>

          <p className="mt-1 text-xs text-[#ece7e0]/75 leading-relaxed">
            {hasInstitutionalEmailShape ? (
              <span className="text-[#38bdf8] flex items-center gap-1.5 font-medium">
                <GraduationCap className="w-4 h-4 text-[#38bdf8] inline shrink-0" />
                <span>Tên miền gợi ý <strong className="text-white font-semibold">{schoolName}</strong>; cần xác minh hộp thư để xác nhận tư cách.</span>
              </span>
            ) : (
              <span>
                Định dạng email không xác nhận danh tính hoặc tư cách sinh viên. Hoàn tất bước xác minh riêng nếu bạn dùng email tổ chức.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
