"use client";

import React from "react";
import { 
  Layers, 
  Zap, 
  Search, 
  Database, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  ShieldCheck 
} from "lucide-react";
import TextScramble from "@/components/ui/TextScramble";

export default function ExplainableEngineSection() {
  const layers = [
    {
      step: "01",
      name: "Lớp 1: Local Pattern & Filter",
      time: "0.1 giây",
      icon: Zap,
      color: "from-teal-500 to-emerald-500",
      description:
        "Quét nhanh các biểu thức chính quy (Regex), từ khóa bẫy lừa cọc, cú pháp tài khoản ngân hàng rác và đuôi tên miền bất thường.",
      outcome: "Phát hiện ngay 40% thủ đoạn lừa cọc phổ biến mà không cần gọi API.",
    },
    {
      step: "02",
      name: "Lớp 2: Aggregator API",
      time: "0.5 giây",
      icon: Search,
      color: "from-cyan-500 to-blue-500",
      description:
        "Đối soát danh sách đen (Blacklist) và danh sách trắng (Whitelist) cơ sở dữ liệu an toàn thông tin quốc gia và các cổng thông tin Đại học (.edu.vn).",
      outcome: "Xác thực danh tính tổ chức và nhận diện website giả mạo.",
    },
    {
      step: "03",
      name: "Lớp 3: Local AI + Vector RAG",
      time: "1.5 giây",
      icon: Database,
      color: "from-indigo-500 to-purple-500",
      description:
        "Mô hình nhúng Vector RAG đối sánh với kho dữ liệu hơn 1.000 mẫu kịch bản lừa đảo nhắm vào sinh viên (tuyển dụng, trọ ảo, học bổng giả, đa cấp).",
      outcome: "Đo lường độ tương đồng ngữ nghĩa và kịch bản thao túng.",
    },
    {
      step: "04",
      name: "Lớp 4: Multi-LLM Ensemble",
      time: "3–5 giây (Nếu cần)",
      icon: Cpu,
      color: "from-rose-500 to-amber-500",
      description:
        "Chỉ kích hoạt khi 3 tầng trước chưa đủ độ tin cậy. Tổng hợp mô hình ngôn ngữ lớn phân tích tâm lý, ngữ cảnh sâu và đưa ra giải trình chi tiết.",
      outcome: "Cơ chế Dừng Sớm (Early Exit) giúp 85% vụ việc có kết quả dưới 1.5s.",
    },
  ];

  return (
    <section className="py-24 relative z-10" id="engine">
      <div className="layout-safe-container">
        
        {/* Section Header with Editorial Serif Typography */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          {/* Machine Interface badge for section metadata */}
          <span className="dg-badge-machine">
            <Layers className="w-3 h-3" />
            04 / KIẾN TRÚC ĐỘNG CƠ ĐA TẦNG
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight igloo-halo-hover">
            <span className="font-serif-editorial italic font-normal text-gradient-primary">
              Xác thực 4 lớp,
            </span>
            <br />
            <TextScramble
              text="minh bạch tuyệt đối."
              tag="span"
              className="font-human font-black tracking-tight text-white"
              duration={900}
              delay={200}
              speed={30}
            />
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 font-human leading-relaxed max-w-xl mx-auto">
            Tối ưu hóa độ trễ và độ chính xác với cơ chế dừng sớm (Early Exit), mang lại trải nghiệm giải trình minh bạch (Explainable AI).
          </p>
        </div>

        {/* 4 Layers Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {layers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.step}
                className="p-6 rounded-3xl bg-space-900/80 hover:bg-space-900/95 border border-white/10 hover:border-cyan-400/40 backdrop-blur-3xl transition-all duration-300 flex flex-col justify-between space-y-4 shadow-glass-deep group hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    {/* Step number — Machine Interface: pure numeric data */}
                    <span className="text-2xl font-black text-white/20 group-hover:text-cyan-400/40 transition-colors font-machine">
                      {layer.step}
                    </span>
                    {/* Time badge — Machine Interface: performance metric */}
                    <span className="dg-badge-machine">
                      <Clock className="w-3 h-3" /> {layer.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {layer.name}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {layer.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 relative z-10">
                  <p className="text-[11px] text-cyan-300 font-medium">
                    🎯 {layer.outcome}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner: Early Exit — Igloo Stat Card */}
        <div className="mt-10 igloo-stat-card igloo-border-pulse flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/25 shrink-0">
              <ShieldCheck className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Cơ Chế Dừng Sớm (Early Exit Optimization)
              </h4>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed max-w-lg">
                Khi lớp 1 hoặc lớp 2 đạt độ tin cậy trên 85%, hệ thống lập tức xuất kết quả
                mà không cần đợi chạy hết 4 lớp, tiết kiệm 90% độ trễ xử lý.
              </p>
            </div>
          </div>

          {/* Igloo metric display */}
          <div className="shrink-0 text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <div className="igloo-stat-number">85%</div>
            <div className="igloo-stat-label">Cases resolved &lt; 1.5s</div>
          </div>
        </div>

      </div>
    </section>
  );
}
