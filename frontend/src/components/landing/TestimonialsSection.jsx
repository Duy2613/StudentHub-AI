"use client";

import React from "react";
import { Star, Quote, CheckCircle2 } from "lucide-react";

export default function TestimonialsSection() {
  const TESTIMONIALS = [
    {
      name: "Trần Minh Quân",
      role: "Sinh viên năm 3 Khoa Học Máy Tính",
      university: "ĐH Bách Khoa TP.HCM",
      avatarInitials: "MQ",
      avatarGradient: "from-indigo-500 to-cyan-500",
      quote: "StudentHub AI đã cứu vãn kỳ thi Giải thuật nâng cao của mình. Thay vì trả lời chung chung, AI giải thích từng bước và sinh test case cực kỳ trực quan.",
      tag: "GPA 3.85 / 4.0",
    },
    {
      name: "Nguyễn Hoàng Phương Anh",
      role: "Thủ khoa khối ngành Kinh Tế Đối Ngoại",
      university: "ĐH Ngoại Thương Hà Nội (FTU)",
      avatarInitials: "PA",
      avatarGradient: "from-purple-500 to-rose-500",
      quote: "Tính năng tóm tắt đề cương và tạo sơ đồ kiến thức giúp mình giảm 60% thời gian ôn thi cuối kỳ mà vẫn nắm trọn vẹn bản chất từng chuyên đề.",
      tag: "Học bổng Xuất Sắc",
    },
    {
      name: "Lê Đăng Khoa",
      role: "AI Engineer Intern",
      university: "ĐH FPT TP.HCM",
      avatarInitials: "ĐK",
      avatarGradient: "from-emerald-500 to-indigo-500",
      quote: "Được TS. Nguyễn Minh Đức trực tiếp review đề tài đồ án tốt nghiệp trên nền tảng là bước ngoặt lớn giúp mình vượt qua vòng phỏng vấn thực tập.",
      tag: "Offer Tech Unicorn",
    },
  ];

  return (
    <section className="py-20 bg-space-900/30 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Được Tin Chọn Bởi Các Bạn{" "}
            <span className="text-gradient-gold">Thủ Khoa & Sinh Viên Ưu Tú</span>
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            Lắng nghe câu chuyện thực tế từ những bạn sinh viên đã bứt phá điểm số và chinh phục mục tiêu học thuật.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-space-950/80 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between shadow-glass-deep"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {item.tag}
                  </span>
                </div>

                <p className="text-sm text-gray-200 leading-relaxed mb-6 font-normal">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${item.avatarGradient} p-[2px] shrink-0`}>
                  <div className="w-full h-full bg-space-950 rounded-full flex items-center justify-center font-bold text-white text-xs">
                    {item.avatarInitials}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  <p className="text-[11px] text-gray-400">{item.role} · {item.university}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
