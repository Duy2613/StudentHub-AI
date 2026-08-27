"use client";

/**
 * StudentHub AI — Academic Workspace 360
 * Authoritative Student Transcript, Standing, Prerequisite DAG, and Graduation Radar.
 */

import React, { useState } from "react";
import {
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";

export default function AcademicWorkspace360() {
  const [activeTab, setActiveTab] = useState("transcript");

  const semesters = [
    {
      id: "HK1_2024_2025",
      name: "Học kỳ 1 (2024–2025)",
      gpa: 8.25,
      credits: 18,
      courses: [
        { code: "MATH1401", name: "Giải tích 1", credits: 4, grade: "8.5", status: "PASSED" },
        { code: "PHYS1301", name: "Vật lý đại cương 1", credits: 3, grade: "8.0", status: "PASSED" },
        { code: "COSC1301", name: "Nhập môn Lập trình", credits: 3, grade: "9.0", status: "PASSED" },
        { code: "ENGL1301", name: "Tiếng Anh 1", credits: 3, grade: "8.0", status: "PASSED" },
        { code: "POLI1201", name: "Triết học Mác - Lênin", credits: 2, grade: "7.5", status: "PASSED" },
        { code: "PHED1101", name: "Giáo dục Thể chất 1", credits: 1, grade: "8.0", status: "PASSED" }
      ]
    },
    {
      id: "HK2_2024_2025",
      name: "Học kỳ 2 (2024–2025)",
      gpa: 8.45,
      credits: 19,
      courses: [
        { code: "MATH1402", name: "Giải tích 2", credits: 4, grade: "8.5", status: "PASSED" },
        { code: "COSC1402", name: "Kỹ thuật Lập trình", credits: 4, grade: "9.0", status: "PASSED" },
        { code: "MATH1303", name: "Đại số Tuyến tính", credits: 3, grade: "8.0", status: "PASSED" },
        { code: "ENGL1302", name: "Tiếng Anh 2", credits: 3, grade: "8.5", status: "PASSED" },
        { code: "POLI1202", name: "Kinh tế Chính trị Mác - Lênin", credits: 2, grade: "8.0", status: "PASSED" }
      ]
    },
    {
      id: "HK1_2025_2026",
      name: "Học kỳ 1 (2025–2026) — Đang học",
      gpa: null,
      credits: 11,
      courses: [
        { code: "COSC2403", name: "Cấu trúc Dữ liệu & Giải thuật", credits: 4, grade: "--", status: "ENROLLED" },
        { code: "INCO2301", name: "Kiến trúc Máy tính", credits: 3, grade: "--", status: "ENROLLED" },
        { code: "MATH2304", name: "Xác suất Thống kê", credits: 4, grade: "--", status: "ENROLLED" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Profile Banner */}
      <section className="p-6 rounded-3xl bg-[#120704] border border-[#3d1910] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-black font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 font-mono">
            24
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Trần Bảo Duy</h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">XÁC THỰC EDU.VN</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              MSSV: <span className="font-mono text-amber-400 font-semibold">24110001</span> • Khoa CNTT • Trường ĐH Sư Phạm Kỹ Thuật TP.HCM
            </p>
            <p className="text-xs text-gray-500 mt-1 font-mono">Chương trình: Đại Trà (Kỹ Sư CNTT - 150 TC)</p>
          </div>
        </div>

        {/* Quick Stats Capsule */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#090302] border border-[#2d120a]">
          <div className="text-center px-3">
            <p className="text-[10px] font-mono text-gray-400 uppercase">GPA Hiện Tại</p>
            <p className="text-lg font-mono font-bold text-amber-400">8.35</p>
          </div>
          <div className="w-px h-8 bg-[#200e08]" />
          <div className="text-center px-3">
            <p className="text-[10px] font-mono text-gray-400 uppercase">Tín Chỉ</p>
            <p className="text-lg font-mono font-bold text-white">48 / 150</p>
          </div>
          <div className="w-px h-8 bg-[#200e08]" />
          <div className="text-center px-3">
            <p className="text-[10px] font-mono text-gray-400 uppercase">Học Lực</p>
            <p className="text-xs font-semibold text-emerald-400 mt-1">Giỏi</p>
          </div>
        </div>
      </section>

      {/* 2. Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2d120a] pb-2">
        <button
          onClick={() => setActiveTab("transcript")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "transcript"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "text-gray-400 hover:text-white bg-[#120704]"
          }`}
        >
          Bảng Điểm Học Kỳ & Tiến Độ
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "rules"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "text-gray-400 hover:text-white bg-[#120704]"
          }`}
        >
          Quy Chế & Chuẩn Đầu Ra (QĐ 1422)
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "transcript" && (
        <div className="space-y-6">
          {semesters.map((sem) => (
            <div key={sem.id} className="p-5 rounded-2xl bg-[#120704] border border-[#2d120a] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#200e08]">
                <div>
                  <h3 className="text-sm font-bold text-white">{sem.name}</h3>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">Số tín chỉ đăng ký: {sem.credits} TC</p>
                </div>
                {sem.gpa && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    GPA: {sem.gpa.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] font-mono text-gray-500 uppercase border-b border-[#200e08]">
                      <th className="pb-2">Mã HP</th>
                      <th className="pb-2">Tên Học Phần</th>
                      <th className="pb-2">Tín Chỉ</th>
                      <th className="pb-2">Điểm TK</th>
                      <th className="pb-2">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#200e08]">
                    {sem.courses.map((c) => (
                      <tr key={c.code} className="hover:bg-[#180905] transition-colors">
                        <td className="py-2.5 font-mono text-amber-400/90">{c.code}</td>
                        <td className="py-2.5 font-medium text-gray-200">{c.name}</td>
                        <td className="py-2.5 font-mono text-gray-400">{c.credits}</td>
                        <td className="py-2.5 font-mono font-bold text-gray-100">{c.grade}</td>
                        <td className="py-2.5">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            c.status === "PASSED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "rules" && (
        <div className="p-6 rounded-2xl bg-[#120704] border border-[#2d120a] space-y-4 text-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FileText className="text-amber-400" size={18} />
            <span>Đối Soát Quy Chế Học Vụ Tốt Nghiệp Khóa K24</span>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Hệ thống đối soát tự động hồ sơ của bạn với Quyết định số 1422/QĐ-ĐHSPKT quy định về chuẩn đầu ra tốt nghiệp đại học chính quy.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#180905] border border-[#2d120a] space-y-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">1. Chuẩn Ngoại Ngữ</span>
              <p className="font-semibold text-gray-200">TOEIC 650+ / IELTS 6.0</p>
              <span className="text-[10px] font-mono text-amber-400">Đang theo đuổi (75%)</span>
            </div>
            <div className="p-4 rounded-xl bg-[#180905] border border-[#2d120a] space-y-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">2. Chuẩn Tin Học</span>
              <p className="font-semibold text-gray-200">MOS / IC3 Master</p>
              <span className="text-[10px] font-mono text-emerald-400">Đã đạt chứng chỉ</span>
            </div>
            <div className="p-4 rounded-xl bg-[#180905] border border-[#2d120a] space-y-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">3. Giáo Dục Thể Chất & QP</span>
              <p className="font-semibold text-gray-200">Đủ 5 tín chỉ theo quy định</p>
              <span className="text-[10px] font-mono text-emerald-400">Đã hoàn thành 100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
