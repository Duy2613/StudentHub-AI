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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-space-900/90 to-space-950/90 border border-white/10 hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between shadow-glass-deep"
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
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${item.avatarGradient} p-[2px] shrink-0 shadow-md`}>
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

        {/* Academic Excellence Banner with 3D Trophy Artifact */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-space-950 via-space-900 to-space-950 border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.08)] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-amber-500/40 shadow-xl shrink-0">
              <img
                src="/images/studio/studio_academic_achievement.jpg"
                alt="Academic Excellence Trophy"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                ⭐ Học Bổng & Giải Thưởng NCKH 2026
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Hơn 12,500+ sinh viên đã cải thiện điểm số GPA trên 3.2/4.0
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Được bảo chứng bởi hội đồng chuyên môn và hơn 50+ trường đại học hàng đầu trên toàn quốc.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 relative z-10">
            <div className="text-center">
              <span className="text-2xl font-black text-amber-300 font-mono">98.4%</span>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Hài Lòng</p>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="text-center">
              <span className="text-2xl font-black text-indigo-300 font-mono">3.8x</span>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Tốc Độ Ôn Tập</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

