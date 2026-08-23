"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ExternalLink, 
  Layers, 
  Code2, 
  Compass, 
  Monitor, 
  Maximize2,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Flame,
  Waves,
  Eye,
  Box
} from "lucide-react";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";

const SHOWCASES = [
  {
    id: "lumora",
    title: "Lumora — Design & Engineering Studio",
    subtitle: "Adaptive Rem Grid • Liquid Brush Reveal • Lenis",
    category: "Studio Landing",
    tags: ["Adaptive Grid", "Canvas Masking", "Lenis Smooth Scroll", "PageLoader"],
    color: "from-amber-500/20 via-orange-500/10 to-transparent",
    borderColor: "border-orange-500/30",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    src: "/showcases/lumora/index.html",
    directUrl: "/showcase/lumora",
    icon: <Compass className="w-5 h-5 text-orange-400" />,
    description: "Tái tạo trọn vẹn website studio cao cấp với kiến trúc Adaptive Grid co giãn theo rem, thanh đếm số mở đầu 000-100, hiệu ứng cọ quét LiquidReveal hai lớp ảnh và giao diện thẻ danh mục chuyển động mượt mà."
  },
  {
    id: "soda",
    title: "Soda — Pure Zero 3D Beverage Landing",
    subtitle: "Google Model-Viewer • GSAP • Cursor Force Field",
    category: "3D Product Experience",
    tags: ["Model Viewer", "GSAP 3", "Repel Physics", "Color Morphing"],
    color: "from-emerald-500/20 via-teal-500/10 to-transparent",
    borderColor: "border-emerald-500/30",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    src: "/showcases/soda/index.html",
    directUrl: "/showcase/soda",
    icon: <Box className="w-5 h-5 text-emerald-400" />,
    description: "Trải nghiệm 3D sản phẩm không cuộn với lon nước nghiêng theo con trỏ chuột, trường lực đẩy quả mọng và lá trôi dạt theo quỹ đạo chuột, bong bóng nổi và vũ điệu đổi hương vị xoay 720 độ."
  },
  {
    id: "flow-wave",
    title: "Flow Wave — Three.js Procedural Shader Sea",
    subtitle: "Simplex Noise GLSL • UnrealBloom • 620vh Camera Dive",
    category: "WebGL Shader Simulation",
    tags: ["Three.js r0.143", "Simplex Noise", "UnrealBloom", "Camera Flight"],
    color: "from-teal-500/20 via-emerald-500/10 to-transparent",
    borderColor: "border-teal-500/30",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    src: "/showcases/flow-wave/index.html",
    directUrl: "/showcase/flow-wave",
    icon: <Waves className="w-5 h-5 text-teal-400" />,
    description: "Biển sóng hạt màu ngọc lục bảo phát sáng additive được tính toán qua thuật toán 3D Simplex Noise, camera lượn sâu 620vh, bộ 3 composer UnrealBloom và ngọn lửa viền góc warp3d."
  },
  {
    id: "cosmic-dust",
    title: "Cosmic Dust — Three.js Particle Universe",
    subtitle: "Amber & Ember Motes • Warp3D Topology • Fract Stream",
    category: "Visual Computing",
    tags: ["Three.js Shaders", "Warp3D", "Particle Stream", "Bloom Postprocessing"],
    color: "from-amber-600/20 via-rose-500/10 to-transparent",
    borderColor: "border-amber-600/30",
    badgeColor: "bg-amber-600/10 text-amber-400 border-amber-600/30",
    src: "/showcases/cosmic-dust/index.html",
    directUrl: "/showcase/cosmic-dust",
    icon: <Flame className="w-5 h-5 text-amber-400" />,
    description: "Vũ trụ 940 hạt bụi than hồng và hổ phách lướt vô tận về phía camera với cơ chế fract-wrapping, hiệu ứng khói viền góc ấm áp và bộ lọc phát sáng đa tầng."
  }
];

export default function ShowcaseHubPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [previewItem, setPreviewItem] = useState(SHOWCASES[0]);

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white pb-24">
      <AmbientBackground />
      <NoiseOverlay />

      {/* Top Navigation */}
      <header className="relative z-20 border-b border-white/10 bg-[#05070f]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-semibold text-white tracking-tight">Creative Engineering Lab</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              4 Live Interactive Engines
            </span>
          </div>
        </div>
      </header>

      {/* Main Header Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>WebGL & Advanced Frontend Showcases</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Showcase Đồ Họa 3D & Sáng Tạo Trực Quan
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Bộ sưu tập các tác phẩm đồ họa WebGL tương tác, Three.js shaders, mô hình 3D real-time và giao diện studio Adaptive Grid được tích hợp đồng bộ vào hệ sinh thái StudentHub AI.
          </p>
        </div>

        {/* Master Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {SHOWCASES.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-3xl bg-[#090d1a]/80 border border-white/10 hover:border-indigo-500/40 transition-all duration-500 overflow-hidden flex flex-col backdrop-blur-xl shadow-2xl hover:shadow-indigo-500/10"
            >
              {/* Top Banner & Live Preview */}
              <div className="relative h-72 w-full bg-[#020409] overflow-hidden border-b border-white/10">
                <iframe
                  src={item.src}
                  title={item.title}
                  className="w-full h-full border-0 pointer-events-none transform scale-95 origin-center group-hover:scale-100 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d1a] via-transparent to-transparent opacity-60 pointer-events-none" />
                
                {/* Floating Category Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border backdrop-blur-md ${item.badgeColor}`}>
                    {item.category}
                  </span>
                </div>

                {/* Direct Fullscreen Button */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <a
                    href={item.src}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 backdrop-blur-md transition-all shadow-lg"
                    title="Mở toàn màn hình độc lập (Standalone HTML)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-6 sm:p-8 flex flex-col flex-1">
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white shrink-0 mt-1">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-1">{item.subtitle}</p>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-1">
                  {item.description}
                </p>

                {/* Tech Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                  <Link
                    href={item.directUrl}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <span>Khám Phá Chi Tiết</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <a
                    href={item.src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    <span>Standalone File</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
