import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Profile360View } from "@/components/academic/Profile360View.jsx";
import { StudentProfile360Service } from "@/lib/intelligence/academic/studentProfile360Service.js";

export const metadata = {
  title: "Authoritative Student Profile 360 | StudentHub AI",
  description: "Hồ sơ học vụ chuẩn tắc 360 độ: Danh tính, Bảng điểm, Chuẩn tốt nghiệp, Chứng chỉ xác thực và Nguồn gốc dữ liệu Đào tạo HCMUTE."
};

export default function AcademicProfilePage() {
  // Server-First authoritative data fetching directly in RSC
  const profile = StudentProfile360Service.getProfile360("24110001");

  return (
    <main className="w-full min-w-0 min-h-screen bg-slate-950 text-slate-100 antialiased p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/academic"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Quay lại Academic Command Center
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Trạng thái xác minh: AUTHORITATIVE
        </span>
      </div>

      <Profile360View profile={profile} />
    </main>
  );
}
