"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Users, 
  MessageSquare, 
  ArrowRight, 
  Check, 
  Sparkles,
  Layers,
  Star,
  ShieldCheck,
  Building,
  Home,
  Utensils
} from "lucide-react";
import TactileButton from "@/components/ui/TactileButton";

export default function CoreFeaturesSection() {
  const features = [
    {
      id: "scam-checker",
      num: "01",
      title: "AI Scam Checker — Động Cơ 4 Lớp",
      tag: "Xác thực tức thì",
      tagColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      icon: ShieldAlert,
      href: "/scam-check",
      description:
        "Nhận diện chính xác thủ đoạn lừa đảo qua 3 phương thức: Link, Tin nhắn văn bản hoặc Ảnh chụp màn hình tự động OCR. Cơ chế dừng sớm giúp phản hồi chỉ trong 0.1s đến 1.5s.",
      highlights: [
        "Phân tích qua 4 tầng: Local Pattern -> Aggregator API -> Vector RAG -> Multi-LLM",
        "Thước đo rủi ro trực quan (Risk Meter 0–100%)",
        "Minh bạch tiến trình Explainable AI (XAI) giải trình vì sao nghi vấn",
      ],
      badge: "Engine 4 Lớp",
    },
    {
      id: "trust-network",
      num: "02",
      title: "Mạng Lưới Chuyên Gia & Trust Score",
      tag: "Thẩm định thực chứng",
      tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      icon: Users,
      href: "/profile",
      description:
        "Hệ thống điểm uy tín 0–100 điểm với cơ chế chấm điểm chặt chẽ: +1/+2đ khi được cộng đồng xác nhận, -1/-2đ khi spam. Tự động mở khóa danh hiệu Chuyên gia tại 80–100 điểm.",
      highlights: [
        "Xác thực danh tính sinh viên bằng Email trường (.edu = +30 điểm)",
        "Đội ngũ chuyên gia đa lĩnh vực: An ninh mạng, Pháp lý, Tài chính, Nhà trọ",
        "Vinh danh Top 5 bảng xếp hạng người dùng đóng góp tích cực",
      ],
      badge: "0–100 Điểm",
    },
    {
      id: "forum-community",
      num: "03",
      title: "Diễn Đàn Cộng Đồng Sinh Viên",
      tag: "Cảnh báo & Review",
      tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      icon: MessageSquare,
      href: "/forum",
      description:
        "Không gian chia sẻ thực tế về Nhà trọ, Quán ăn, Trường học, CLB. Cơ chế vote 'Uy tín' đẩy các bài viết có độ tin cậy cao lên đầu, tách biệt hoàn toàn với lượt like 'Hữu ích'.",
      highlights: [
        "Lọc nhanh theo vị trí trường học & từ khóa mà không cần thuật toán phức tạp",
        "Bình luận chuyên sâu có gắn nhãn thẩm định chuyên gia",
        "Dễ dàng chia sẻ ngay kết quả sau khi kiểm tra từ AI Scam Checker",
      ],
      badge: "Vote Uy Tín",
    },
  ];

  return (
    <section className="py-20 relative z-10" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Editorial Serif Typography */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-widest font-mono">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>02 / 3 TRỤ CỘT NỀN TẢNG</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
            <span className="font-serif-editorial italic text-gradient-primary">
              Giải pháp toàn diện,
            </span>
            <br />
            <span className="font-sans font-black tracking-tight">
              bảo vệ sinh viên số.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl mx-auto">
            Kết hợp trí tuệ nhân tạo tốc độ cao và mạng lưới xác thực thực chứng từ cộng đồng sinh viên và cố vấn uy tín.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="p-8 rounded-3xl bg-space-900/80 hover:bg-space-900/95 border border-white/10 hover:border-teal-400/40 backdrop-blur-3xl transition-all duration-300 flex flex-col justify-between shadow-glass-deep group hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Subtle Background Chapter Number */}
                <div className="absolute top-4 right-6 text-5xl font-mono font-black text-white/[0.03] group-hover:text-teal-400/[0.06] transition-colors pointer-events-none select-none">
                  {feat.num}
                </div>

                <div className="space-y-5 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-3.5 rounded-2xl bg-teal-500/15 text-teal-300 border border-teal-500/30 group-hover:scale-110 transition-transform shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border font-mono tracking-wider ${feat.tagColor}`}>
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors leading-snug">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {feat.description}
                  </p>

                  <ul className="space-y-2.5 pt-3 border-t border-white/5 text-xs text-gray-300">
                    {feat.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-teal-400/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                          ✓
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 relative z-10">
                  <Link
                    href={feat.href}
                    className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 hover:text-teal-200 group-hover:translate-x-1 transition-all"
                  >
                    <span>Khám phá tính năng</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
