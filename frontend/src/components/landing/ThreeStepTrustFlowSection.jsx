"use client";

import React from "react";
import { Search, ShieldCheck, Zap, ArrowRight, Sparkles } from "lucide-react";
import Interactive3DBlockCard from "@/components/ui/Interactive3DBlockCard";

export default function ThreeStepTrustFlowSection() {
  const steps = [
    {
      num: "01",
      title: "Đối Soát Tức Thì",
      badge: "0.1 Giây",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      icon: Zap,
      glowColor: "rgba(52, 231, 196, 0.35)",
      description:
        "Tự động quét nhanh link, text và ảnh OCR qua cơ sở dữ liệu Regex, Blacklist/Whitelist tên miền giáo dục quốc gia (.edu.vn) và tài khoản rác.",
    },
    {
      num: "02",
      title: "Phân Tích Ngữ Cảnh",
      badge: "1.5 Giây",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      icon: Search,
      glowColor: "rgba(99, 102, 241, 0.35)",
      description:
        "Vector RAG đối sánh ngữ nghĩa với hơn 1.000 mẫu kịch bản lừa đảo thực tế nhắm vào sinh viên: cọc việc làm, trọ ảo, học bổng giả, đa cấp trá hình.",
    },
    {
      num: "03",
      title: "Thẩm Định Thực Chứng",
      badge: "Đa Chiều",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: ShieldCheck,
      glowColor: "rgba(245, 158, 11, 0.35)",
      description:
        "Đội ngũ cố vấn chuyên môn (Luật, An ninh mạng, Bất động sản) kết hợp cơ chế Vote Uy Tín của cộng đồng để đưa ra nhận định khách quan nhất.",
    },
  ];

  return (
    <section className="py-24 relative z-10 overflow-hidden" id="workflow">
      
      {/* Kinetic Floating Geometric Shapes (Controleur style) */}
      <div className="absolute top-10 left-5 w-24 h-24 rounded-full border border-teal-500/20 animate-float pointer-events-none opacity-40 -z-10" />
      <div className="absolute bottom-10 right-10 w-32 h-32 border border-indigo-500/20 rotate-45 animate-pulse-slow pointer-events-none opacity-30 -z-10" />

      <div className="layout-safe-container space-y-16">
        
        {/* Section Title with Editorial Serif */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="igloo-pill-badge">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>QUY TRÌNH XÁC THỰC 3 BƯỚC</span>
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            <span className="font-serif-editorial italic font-normal text-gradient-primary">
              Biến mọi nghi vấn,
            </span>
            <br />
            <span className="font-human font-black tracking-tight">
              thành quyết định an toàn.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 font-human leading-relaxed max-w-xl mx-auto">
            Hệ thống hóa tiến trình phòng vệ từ kiểm tra kỹ thuật số tự động đến chứng thực con người có chuyên môn.
          </p>
        </div>

        {/* 3 Step 3D Interactive Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Interactive3DBlockCard
                key={step.num}
                glowColor={step.glowColor}
                maxTilt={12}
                depth={40}
                className="w-full h-full"
              >
                <div className="p-8 rounded-3xl bg-space-900/85 border border-white/12 backdrop-blur-3xl transition-all duration-300 flex flex-col justify-between shadow-glass-deep group relative overflow-hidden h-full min-h-[340px]">
                  
                  {/* Big Step Number in Background */}
                  <div className="absolute top-4 right-6 text-6xl font-mono font-black text-white/[0.04] group-hover:text-teal-400/[0.08] transition-colors pointer-events-none select-none">
                    {step.num}
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="p-3.5 rounded-2xl bg-white/5 text-teal-300 border border-white/10 group-hover:scale-110 transition-transform shadow-md" style={{ transform: "translateZ(30px)" }}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border font-mono tracking-wider ${step.badgeColor}`} style={{ transform: "translateZ(20px)" }}>
                        {step.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors leading-snug" style={{ transform: "translateZ(25px)" }}>
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed" style={{ transform: "translateZ(15px)" }}>
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-teal-300 font-bold relative z-10" style={{ transform: "translateZ(20px)" }}>
                    <span>Bước {step.num}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Interactive3DBlockCard>
            );
          })}
        </div>

      </div>
    </section>
  );
}
