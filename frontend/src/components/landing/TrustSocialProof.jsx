"use client";

import React from "react";
import { Users, Award, ShieldCheck, Star, Sparkles, School } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";

export default function TrustSocialProof() {
  const UNIVERSITIES = [
    { name: "ĐHQG TP.HCM", short: "VNU-HCM", badge: "Đại học Quốc gia" },
    { name: "ĐH Bách Khoa", short: "HCMUT / HUST", badge: "Kỹ thuật & Công nghệ" },
    { name: "ĐH Kinh Tế Quốc Dân", short: "NEU", badge: "Kinh tế & Quản trị" },
    { name: "ĐH Ngoại Thương", short: "FTU", badge: "Kinh tế Đối ngoại" },
    { name: "FPT University", short: "FPTU", badge: "Công nghệ thông tin" },
    { name: "RMIT Vietnam", short: "RMIT", badge: "Quốc tế & Sáng tạo" },
  ];

  const STATS = [
    {
      icon: Users,
      num: 50000,
      suffix: "+",
      label: "Sinh viên tích cực",
      desc: "Từ hơn 60 trường Đại học & Học viện toàn quốc",
      color: "text-indigo-400",
      decimalPlaces: 0,
    },
    {
      icon: Award,
      num: 1200,
      suffix: "+",
      label: "Cố vấn & Chuyên gia",
      desc: "Tiến sĩ, Thạc sĩ, Tech Lead và Giảng viên uy tín",
      color: "text-purple-400",
      decimalPlaces: 0,
    },
    {
      icon: ShieldCheck,
      num: 99.4,
      suffix: "%",
      label: "Độ chính xác học thuật",
      desc: "Trích dẫn nguồn chuẩn hoá và đối soát kiến thức",
      color: "text-cyan-400",
      decimalPlaces: 1,
    },
    {
      icon: Star,
      num: 4.95,
      suffix: " / 5.0",
      label: "Mức độ hài lòng",
      desc: "Hơn 18,000 lượt phản hồi 5 sao từ cộng đồng",
      color: "text-amber-400",
      decimalPlaces: 2,
    },
  ];

  return (
    <section className="py-12 border-y border-white/5 bg-space-900/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trusted Universities Strip */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Được tin dùng bởi sinh viên và giảng viên từ các trường đại học hàng đầu
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {UNIVERSITIES.map((uni, idx) => (
              <div
                key={idx}
                className="group flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-300"
              >
                <School className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors mb-1.5" />
                <span className="text-xs font-bold text-gray-200 text-center tracking-tight">
                  {uni.name}
                </span>
                <span className="text-[10px] text-gray-400 text-center mt-0.5">
                  {uni.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Core Quantitative Metrics with Magic UI NumberTicker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-white/5">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative p-5 rounded-2xl bg-space-950/60 border border-white/5 hover:border-white/15 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${stat.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline">
                    <NumberTicker value={stat.num} decimalPlaces={stat.decimalPlaces} />
                    <span>{stat.suffix}</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-200 mb-1">
                  {stat.label}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {stat.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
