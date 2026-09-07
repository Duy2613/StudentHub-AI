"use client";

import React from "react";
import { ShieldCheck, BookOpen, UserCheck, Milestone } from "lucide-react";

export default function AcademicTrustBar() {
  const trustItems = [
    {
      icon: ShieldCheck,
      title: "100% Nguồn Thực Minh Bạch",
      desc: "Trích dẫn nguyên văn điều khoản và số quyết định (QĐ 3116/QĐ-ĐHSPKT), không bao giờ dùng nguồn ẩn danh.",
      badge: "PROVENANCE",
      color: "text-teal-400",
      bg: "border-teal-500/30 bg-teal-500/5",
    },
    {
      icon: BookOpen,
      title: "Hiến Pháp Zero Bịa Đặt",
      desc: "Cơ chế OOD Abstention dám trả lời 'Chưa đủ căn cứ' thay vì phỏng đoán liều lĩnh với xác suất cao.",
      badge: "CONSTITUTION",
      color: "text-indigo-400",
      bg: "border-indigo-500/30 bg-indigo-500/5",
    },
    {
      icon: UserCheck,
      title: "Đúng Phạm Vi Chuyên Gia",
      desc: "Phân biệt rạch ròi 'Năng lực chuyên môn ≠ Thẩm quyền ban hành' theo đồ thị thẩm quyền Authority Matrix.",
      badge: "SCOPE LOCKED",
      color: "text-cyan-400",
      bg: "border-cyan-500/30 bg-cyan-500/5",
    },
    {
      icon: Milestone,
      title: "Bảo Vệ Lộ Trình Tốt Nghiệp",
      desc: "Digital Twin cá nhân hóa tự động đối soát tín chỉ, chứng chỉ ngoại ngữ và cảnh báo sớm nút thắt học vụ.",
      badge: "DIGITAL TWIN",
      color: "text-emerald-400",
      bg: "border-emerald-500/30 bg-emerald-500/5",
    },
  ];

  return (
    <div className="w-full border-y border-white/10 bg-[#060813]/60 py-10 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`interactive-card group relative rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:border-white/30 ${item.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    {item.badge}
                  </span>
                </div>

                <h3 className="mt-4 text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
