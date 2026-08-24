"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Layers, 
  Check, 
  Palette, 
  Eye, 
  X, 
  ChevronRight,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useBackground, WALLPAPERS } from "@/components/providers/BackgroundContext";
import { motion, AnimatePresence } from "motion/react";

const EFFECTS = [
  {
    id: "aurora",
    name: "Aurora Gradient",
    desc: "Làn sóng cực quang chuyển sắc mượt mà",
    previewType: "aurora",
  },
  {
    id: "particles",
    name: "Particles Flow",
    desc: "Mạng lưới hạt bụi vũ trụ chuyển động lơ lửng",
    previewType: "particles",
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism Glow",
    desc: "Kính mờ đa tầng với viền phát quang quang phổ",
    previewType: "glass",
  },
  {
    id: "blob",
    name: "Morphing Blob",
    desc: "Khối lỏng hữu cơ biến đổi hình học",
    previewType: "blob",
  },
  {
    id: "lightsweep",
    name: "Light Sweep",
    desc: "Tia quét laser và vệt sáng quang học",
    previewType: "sweep",
  },
  {
    id: "mouseglow",
    name: "Mouse Follow Glow",
    desc: "Con trỏ tri thức Knowledge Cursor phản hồi đa điểm",
    previewType: "cursor",
  },
  {
    id: "textreveal",
    name: "Text Reveal",
    desc: "Hiệu ứng trượt chữ phân đoạn Editorial Serif",
    previewType: "text",
  },
  {
    id: "orbs",
    name: "3D Floating Orbs",
    desc: "Hệ thống quỹ đạo Knowledge Orbit 3D",
    previewType: "orbs",
  },
];

export default function BackgroundsAndEffectsStudio({ isInline = false }) {
  const { 
    activeWallpaper, 
    setActiveWallpaper, 
    isStudioOpen, 
    setIsStudioOpen,
    activeEffect,
    setActiveEffect
  } = useBackground();

  const [hoveredEffect, setHoveredEffect] = useState(null);
  const [isExpanded, setIsExpanded] = useState(!isInline);

  return (
    <section className="w-full relative z-20 py-12 px-4 sm:px-6 lg:px-8 border-y border-white/10 bg-space-950/90 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Top Title Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-teal-500/15 via-indigo-500/15 to-purple-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Visual Atmosphere Studio</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            STUDENT HUB AI – <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-300">BACKGROUNDS &amp; EFFECTS</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide">
            Futuristic • Smart • Academic • Inspiring
          </p>
        </div>

        {/* SECTION 1: BACKGROUNDS (wallpapers) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <ImageIcon className="w-4 h-4 text-teal-400" />
              <span>BACKGROUNDS (wallpapers)</span>
            </div>
            <span className="text-[11px] text-gray-400">
              Nhấp vào hình nền để áp dụng toàn trang ngay lập tức
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {WALLPAPERS.map((wp) => {
              const isSelected = activeWallpaper.id === wp.id;
              return (
                <div
                  key={wp.id}
                  onClick={() => setActiveWallpaper(wp)}
                  className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 relative flex flex-col bg-space-900 ${
                    isSelected
                      ? "border-teal-400 ring-2 ring-teal-400/50 shadow-[0_0_25px_rgba(52,231,196,0.35)] scale-[1.02]"
                      : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
                  }`}
                >
                  {/* Thumbnail Image */}
                  <div className="aspect-[16/10] w-full relative overflow-hidden bg-space-950">
                    <img
                      src={wp.src}
                      alt={wp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-60" />
                    
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-400 text-space-950 flex items-center justify-center font-bold text-xs shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div className="p-2.5 bg-space-900/95 border-t border-white/5 flex flex-col">
                    <span className="text-[11px] font-bold text-white group-hover:text-teal-300 transition-colors truncate">
                      {wp.num}. {wp.name}
                    </span>
                    <span className="text-[9px] text-gray-400 truncate mt-0.5">
                      {wp.mood}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: EFFECTS PREVIEW (like in the video) */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>EFFECTS PREVIEW (interactive gallery)</span>
            </div>
            <span className="text-[11px] text-gray-400">
              Di chuột hoặc nhấp để kích hoạt tương tác micro-animations
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {EFFECTS.map((eff) => {
              const isActive = activeEffect === eff.id;
              return (
                <div
                  key={eff.id}
                  onClick={() => setActiveEffect(eff.id)}
                  onMouseEnter={() => setHoveredEffect(eff.id)}
                  onMouseLeave={() => setHoveredEffect(null)}
                  className={`cursor-pointer rounded-2xl border p-3 flex flex-col items-center justify-between text-center transition-all duration-300 group min-h-[140px] relative overflow-hidden ${
                    isActive
                      ? "bg-space-900/90 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400"
                      : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Dynamic Interactive Effect Visual */}
                  <div className="w-full h-16 rounded-xl overflow-hidden relative flex items-center justify-center bg-black/40 border border-white/5 mb-2">
                    
                    {/* 1. Aurora Gradient */}
                    {eff.previewType === "aurora" && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/40 via-indigo-600/40 to-pink-500/40 animate-blob-slow filter blur-sm" />
                    )}

                    {/* 2. Particles Flow */}
                    {eff.previewType === "particles" && (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping absolute" />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse absolute top-2 left-3" />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse absolute bottom-2 right-4" />
                        <div className="w-1 h-1 rounded-full bg-purple-400 absolute top-4 right-2" />
                      </div>
                    )}

                    {/* 3. Glassmorphism Glow */}
                    {eff.previewType === "glass" && (
                      <div className="w-10 h-7 rounded-lg bg-white/10 backdrop-blur-md border border-white/30 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center">
                        <span className="text-[8px] font-mono text-teal-300">01 / AI</span>
                      </div>
                    )}

                    {/* 4. Morphing Blob */}
                    {eff.previewType === "blob" && (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-blob-medium filter blur-xs shadow-lg" />
                    )}

                    {/* 5. Light Sweep */}
                    {eff.previewType === "sweep" && (
                      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent animate-pulse" />
                        <div className="absolute -inset-x-10 h-6 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent rotate-45 transform translate-x-[-50%] group-hover:translate-x-[150%] transition-transform duration-700" />
                      </div>
                    )}

                    {/* 6. Mouse Follow Glow (Knowledge Cursor) */}
                    {eff.previewType === "cursor" && (
                      <div className="relative flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border border-teal-400/80 bg-teal-400/10 flex items-center justify-center animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        </div>
                      </div>
                    )}

                    {/* 7. Text Reveal */}
                    {eff.previewType === "text" && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-serif-editorial font-bold text-white tracking-wider leading-none">
                          STUDENT
                        </span>
                        <span className="text-[9px] font-sans font-extrabold text-teal-300 leading-none mt-0.5">
                          HUB AI
                        </span>
                      </div>
                    )}

                    {/* 8. 3D Floating Orbs */}
                    {eff.previewType === "orbs" && (
                      <div className="relative flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 shadow-[0_0_12px_rgba(52,231,196,0.5)] animate-float" />
                        <div className="absolute w-3 h-3 rounded-full bg-purple-400/80 -top-1 -right-1 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Effect Name */}
                  <span className="text-[11px] font-bold text-gray-200 group-hover:text-teal-300 transition-colors line-clamp-1">
                    {eff.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
