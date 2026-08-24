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
    <section className="py-20 relative z-10" id="engine">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-teal-400" /> Kiến Trúc Động Cơ
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Động Cơ Xác Thực Đa Tầng (4-Layer Engine)
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Tối ưu hóa độ trễ và độ chính xác với cơ chế dừng sớm, mang lại trải nghiệm phân tích minh bạch (Explainable AI).
          </p>
        </div>

        {/* 4 Layers Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {layers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.step}
                className="p-6 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-teal-400/40 backdrop-blur-xl transition-all flex flex-col justify-between space-y-4 shadow-glass-deep group hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-white/20 group-hover:text-teal-400/40 transition-colors font-mono">
                      {layer.step}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-teal-300">
                      <Clock className="w-3 h-3" /> {layer.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                      {layer.name}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {layer.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <p className="text-[11px] text-teal-300/90 font-medium">
                    🎯 {layer.outcome}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner: Early Exit */}
        <div className="mt-10 p-6 rounded-3xl bg-teal-950/30 border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-teal-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">
                Cơ Chế Dừng Sớm (Early Exit Optimization)
              </h4>
              <p className="text-xs text-gray-300 mt-0.5">
                Khi lớp 1 hoặc lớp 2 đạt độ tin cậy trên 85%, hệ thống lập tức xuất kết quả mà không cần đợi chạy hết 4 lớp, tiết kiệm 90% độ trễ xử lý.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
