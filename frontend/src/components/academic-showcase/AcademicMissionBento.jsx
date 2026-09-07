"use client";

import React from "react";
import { ShieldCheck, Network, Cpu, FileCheck2, ArrowUpRight, Zap } from "lucide-react";

export default function AcademicMissionBento() {

  const missions = [
    {
      id: "trust-engine",
      title: "AI Trust Engine V2 — Thẩm Định Nhận Thức",
      tagline: "EPISTEMIC INTELLIGENCE",
      desc: "Kiểm chứng 13 trạng thái nhận thức, bóc tách mệnh đề Claim Graph DAG, phát hiện nói quá và ngăn chặn rủi ro nguồn rửa.",
      stats: ["13 Epistemic States", "DAG Cycle Guard", "Overclaim Check"],
      icon: ShieldCheck,
      color: "from-teal-500/20 to-emerald-500/5",
      borderColor: "border-teal-500/30",
      accent: "text-teal-400",
      colSpan: "lg:col-span-8",
    },
    {
      id: "digital-twin",
      title: "Academic Digital Twin — Bản Sao Số Sinh Viên",
      tagline: "DETERMINISTIC TWIN",
      desc: "Mô phỏng chính xác lộ trình tích lũy tín chỉ K23-K26, cảnh báo điều kiện Khóa luận tốt nghiệp và học kỳ hè.",
      stats: ["QĐ 3116 Compliance", "BFS Bottleneck", "What-If Engine"],
      icon: Cpu,
      color: "from-indigo-500/20 to-purple-500/5",
      borderColor: "border-indigo-500/30",
      accent: "text-indigo-400",
      colSpan: "lg:col-span-4",
    },
    {
      id: "evidence-passport",
      title: "Living Evidence Passport — Hộ Chiếu Bằng Chứng Bất Biến",
      tagline: "IMMUTABLE AUDIT",
      desc: "Bảo vệ sinh viên trước học bổng giả, thực tập đa cấp bằng chuỗi bằng chứng băm SHA-256 đối soát đa nguồn.",
      stats: ["SHA-256 Provenance", "3 Superflows", "Zero Fraud Risk"],
      icon: FileCheck2,
      color: "from-cyan-500/20 to-blue-500/5",
      borderColor: "border-cyan-500/30",
      accent: "text-cyan-400",
      colSpan: "lg:col-span-4",
    },
    {
      id: "knowledge-universe",
      title: "Knowledge Universe 3D — Đồ Thị Tri Thức Học Thuật",
      tagline: "INTERACTIVE DAG",
      desc: "Khám phá mối liên hệ giữa các môn tiên quyết, học phần bổ trợ và chuẩn đầu ra thị trường tuyển dụng công nghệ cao.",
      stats: ["Prerequisite DAG", "Industry Snapping", "Interactive WebGL"],
      icon: Network,
      color: "from-purple-500/20 to-pink-500/5",
      borderColor: "border-purple-500/30",
      accent: "text-purple-400",
      colSpan: "lg:col-span-8",
    },
  ];

  return (
    <section className="relative py-24 border-t border-white/10 bg-[#060813]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-mono font-semibold text-teal-300">
              <Zap className="h-3 w-3" />
              <span>CORE ARCHITECTURE · USAVIONIX PRECISION</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Một Nền Tảng. <br />
              <span className="font-serif italic font-normal text-teal-300">
                Bốn Trụ Cột Trí Tuệ Học Vụ.
              </span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-gray-400 leading-relaxed font-mono">
            Kết hợp độ tin cậy tuyệt đối của quy chế nhà trường với sức mạnh xử lý ngôn ngữ thế hệ mới.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {missions.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                data-cursor-text="Khám phá"
                className={`interactive-card group relative overflow-hidden rounded-3xl border ${m.borderColor} bg-gradient-to-b ${m.color} p-8 backdrop-blur-xl transition-all duration-500 hover:scale-[1.01] hover:border-white/40 ${m.colSpan}`}
              >
                {/* Background Tech Line Accent */}
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon className="h-40 w-40 text-white stroke-1" />
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-black uppercase tracking-widest text-teal-300 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full">
                        {m.tagline}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white group-hover:bg-teal-400 group-hover:text-black transition-colors">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>

                    <h3 className="mt-5 text-xl sm:text-2xl font-black text-white group-hover:text-teal-200 transition-colors">
                      {m.title}
                    </h3>
                    <p className="mt-3 text-sm text-gray-300 leading-relaxed max-w-xl">
                      {m.desc}
                    </p>
                  </div>

                  {/* Technical Tags / Parameters */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                    {m.stats.map((stat, sIdx) => (
                      <span
                        key={sIdx}
                        className="rounded-lg border border-white/10 bg-black/50 px-3 py-1 font-mono text-[11px] font-medium text-gray-300"
                      >
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
