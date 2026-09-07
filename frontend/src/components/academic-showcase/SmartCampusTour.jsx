"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";

export default function SmartCampusTour() {
  const [activeFacility, setActiveFacility] = useState(0);

  const facilities = [
    {
      id: "library",
      title: "Thư Viện Nghiên Cứu Số & Giảng Đường Đa Tầng",
      tagline: "RESEARCH COMMONS",
      image: "/images/academic/academic_library_commons.jpg",
      desc: "Không gian đọc sách và nghiên cứu hiện đại đa tầng, vách kính cách âm chuẩn studio, hệ thống máy tra cứu tài liệu IEEE/ACM không giới hạn.",
      stats: [
        { label: "Độ ồn môi trường", val: "< 28 dB (Tối ưu tập trung)" },
        { label: "Băng thông mạng", val: "100 Gbps Academic Grid" },
        { label: "Không khí tinh khiết", val: "HEPA H14 · 99.97%" },
      ],
    },
    {
      id: "copilot-studio",
      title: "Studio Tự Học Cùng AI Copilot Đêm Sâu",
      tagline: "AI FOCUS SANCTUARY",
      image: "/images/academic/academic_ai_copilot.jpg",
      desc: "Phòng tự học cá nhân hóa với trợ lý ảo AI Tutor chiếu đồ thị thuật toán, phân tích bài toán logic, kiểm thử mã nguồn và gợi ý bài tập tương thích.",
      stats: [
        { label: "Thời gian phục vụ", val: "24/7 Không gián đoạn" },
        { label: "Độ trễ suy luận", val: "< 25ms Real-time" },
        { label: "Chống ảo giác", val: "OOD Abstention 96.2%" },
      ],
    },
    {
      id: "smart-campus",
      title: "Khuôn Viên Đại Học Xanh Bền Vững & Tương Lai",
      tagline: "SUSTAINABLE LIVING CAMPUS",
      image: "/images/academic/academic_campus_sanctuary.jpg",
      desc: "Kiến trúc tương lai với cầu đi bộ kính nối liền các tháp nghiên cứu, hồ điều hòa sinh thái, năng lượng mặt trời và hệ thống kén tự học ngoài trời.",
      stats: [
        { label: "Năng lượng xanh", val: "100% Năng lượng tái tạo" },
        { label: "Diện tích cây xanh", val: "68% Không gian mở" },
        { label: "Trạm kết nối IoT", val: "1,200 Điểm cảm biến" },
      ],
    },
    {
      id: "robotics-lab",
      title: "Phòng Thí Nghiệm Robot, AI & Kỹ Thuật Mô Phỏng",
      tagline: "ROBOTICS & EMBEDDED LAB",
      image: "/images/academic/academic_quantum_lab.jpg",
      desc: "Trung tâm chế tạo thực chiến với cánh tay robot 6 bậc tự do, trạm máy tính xử lý đồ họa GPU kép, môi trường mô phỏng vật lý chuyên sâu.",
      stats: [
        { label: "Trang thiết bị", val: "Chuẩn Quốc tế ABET" },
        { label: "Công suất tính toán", val: "Dual GPU RTX Workstations" },
        { label: "Dự án thực tế", val: "100% Sinh viên có sản phẩm" },
      ],
    },
  ];

  return (
    <section className="relative py-24 border-t border-white/10 bg-[#070a14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-xs font-semibold text-teal-300">
              <Building2 className="h-3 w-3" />
              <span>KHÔNG GIAN HỌC THUẬT &amp; CƠ SỞ VẬT CHẤT</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Hệ Thống Không Gian <br />
              <span className="font-serif italic font-normal text-teal-300">
                Truyền Cảm Hứng Nghiên Cứu Đỉnh Cao
              </span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-gray-400 font-mono">
            Mỗi không gian được thiết kế theo chuẩn mực cao nhất để sinh viên phát huy 100% tiềm năng trí tuệ.
          </p>
        </div>

        {/* Facility Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {facilities.map((fac, idx) => (
            <button
              key={fac.id}
              onClick={() => setActiveFacility(idx)}
              data-cursor-text="Xem ảnh"
              className={`flex flex-col rounded-2xl border p-4 text-left transition-all duration-300 ${
                activeFacility === idx
                  ? "border-teal-400 bg-teal-500/15 shadow-[0_0_20px_rgba(52,231,196,0.2)]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${activeFacility === idx ? "text-teal-300" : "text-gray-500"}`}>
                {fac.tagline}
              </span>
              <span className={`mt-1 text-xs font-bold truncate ${activeFacility === idx ? "text-white" : "text-gray-400"}`}>
                {fac.title}
              </span>
            </button>
          ))}
        </div>

        {/* Active Facility Hero Feature Box */}
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/60 shadow-2xl backdrop-blur-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Image Viewport with Telemetry Overlay */}
            <div className="lg:col-span-8 relative aspect-[16/10] overflow-hidden bg-black">
              <Image
                src={facilities[activeFacility].image}
                alt={facilities[activeFacility].title}
                width={900}
                height={560}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

              {/* Top Floating Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-black/50 bg-black/75 px-3 py-1 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping"></span>
                <span className="font-mono text-[10px] font-bold text-teal-300 uppercase">
                  {facilities[activeFacility].tagline}
                </span>
              </div>
            </div>

            {/* Right Meta & Telemetry Panel */}
            <div className="lg:col-span-4 p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 bg-[#080d20]">
              <div className="space-y-4">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400">
                  SANCTUARY SPECIFICATION
                </span>
                <h3 className="text-xl font-black text-white">
                  {facilities[activeFacility].title}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {facilities[activeFacility].desc}
                </p>

                {/* Telemetry Metrics List */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  {facilities[activeFacility].stats.map((st, sIdx) => (
                    <div key={sIdx} className="flex flex-col font-mono text-[11px]">
                      <span className="text-gray-500 uppercase">{st.label}</span>
                      <span className="text-teal-300 font-bold mt-0.5">{st.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-gray-500">
                <span>CAMPUS TOUR ID: #HC-2026</span>
                <span className="text-emerald-400 font-semibold">● ACTIVE RUNTIME</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
