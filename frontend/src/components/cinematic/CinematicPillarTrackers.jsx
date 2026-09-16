"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Network, Users2, ArrowRight } from "lucide-react";
import Link from "next/link";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

const PILLARS = [
  {
    id: "trust",
    title: "Khởi Đầu Từ Bằng Chứng",
    label: "PHÁP Y TRI THỨC",
    icon: ShieldCheck,
    color: "from-emerald-400 to-teal-400",
    shadow: "shadow-emerald-500/20",
    bgAccent: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    description: "Đừng tin vội. Dán một bài đăng mạng xã hội hoặc hình chụp công văn vào Trust Engine. Hệ thống đối chiếu hàng trăm trang quy chế để xác thực.",
    href: "/trust",
    image: V3_MEDIA.landing.prism
  },
  {
    id: "community",
    title: "Cộng Đồng Giám Sát",
    label: "KHÔNG GIAN MỞ",
    icon: Network,
    color: "from-cyan-400 to-indigo-400",
    shadow: "shadow-cyan-500/20",
    bgAccent: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    iconColor: "text-cyan-400",
    description: "Mạng lưới đối soát thông tin đám đông. Khi một tin đồn thất thiệt xuất hiện, cộng đồng sẽ khoanh vùng cảnh báo trước khi sự việc lan rộng.",
    href: "/community",
    image: V3_MEDIA.landing.atlas
  },
  {
    id: "expert",
    title: "Quyết Định Của Chuyên Gia",
    label: "THẨM ĐỊNH CON NGƯỜI",
    icon: Users2,
    color: "from-indigo-400 to-purple-400",
    shadow: "shadow-indigo-500/20",
    bgAccent: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    iconColor: "text-indigo-400",
    description: "Với những quy chế mập mờ, hội đồng cố vấn học vụ sẽ can thiệp và cung cấp diễn giải chính thức cuối cùng, khép lại vòng lặp nghi vấn.",
    href: "/expert",
    image: V3_MEDIA.landing.humanAi
  }
];

export default function CinematicPillarTrackers() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 h-auto md:h-[420px]">
      {PILLARS.map((pillar) => {
        const isHovered = hoveredId === pillar.id;
        const isOtherHovered = hoveredId !== null && hoveredId !== pillar.id;
        const Icon = pillar.icon;

        return (
          <motion.div
            key={pillar.id}
            onHoverStart={() => setHoveredId(pillar.id)}
            onHoverEnd={() => setHoveredId(null)}
            layout
            initial={false}
            animate={{
              flex: isHovered ? 2.5 : isOtherHovered ? 0.75 : 1,
              opacity: isOtherHovered ? 0.6 : 1,
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            data-cursor={pillar.id.toUpperCase()}
            className={`relative rounded-3xl overflow-hidden border border-white/10 ${pillar.bgAccent} backdrop-blur-md cursor-pointer group flex-shrink-0 min-w-[200px] h-[360px] md:h-full`}
          >
            {/* Background Image Parallax effect */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pillar.image}
                alt=""
                className={`w-full h-full object-cover transition-transform duration-1000 ${isHovered ? "scale-110" : "scale-100"} opacity-20`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/80 to-transparent" />
            </div>

            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between">
              {/* Top Meta */}
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl ${pillar.bgAccent} border ${pillar.borderColor} flex items-center justify-center ${pillar.iconColor} transition-transform duration-500 ${isHovered ? "scale-110" : ""}`}>
                  <Icon size={24} />
                </div>

                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                      className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase font-semibold ${pillar.bgAccent} border ${pillar.borderColor} ${pillar.iconColor}`}
                    >
                      {pillar.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Content */}
              <div className="relative">
                <h3 className={`text-2xl font-bold font-sans text-white mb-2 transition-all duration-300 ${!isHovered && !isMobile() ? "line-clamp-2 md:truncate" : ""}`}>
                  {pillar.title}
                </h3>

                <div className={`overflow-hidden transition-all duration-500 ${isHovered ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0 md:max-h-0 md:opacity-0 max-h-40 opacity-100 mt-4 md:mt-0"}`}>
                  <p className="text-sm font-serif text-slate-300 leading-relaxed mb-6">
                    {pillar.description}
                  </p>

                  <Link
                    href={pillar.href}
                    className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${pillar.iconColor} hover:text-white transition-colors`}
                  >
                    Mở không gian <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Simple helper for default responsive behavior when not hovered
function isMobile() {
  if (typeof window !== "undefined") {
    return window.innerWidth < 768;
  }
  return false;
}
