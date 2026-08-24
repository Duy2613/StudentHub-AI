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

export default function BackgroundsAndEffectsStudio() {
  const { 
    activeWallpaper, 
    setActiveWallpaper, 
    isStudioOpen, 
    setIsStudioOpen,
    activeEffect,
    setActiveEffect
  } = useBackground();

  const [hoveredEffect, setHoveredEffect] = useState(null);

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <button
        onClick={() => setIsStudioOpen(!isStudioOpen)}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-space-900/90 border border-teal-400/40 text-teal-300 shadow-[0_0_25px_rgba(52,231,196,0.35)] backdrop-blur-2xl hover:scale-110 active:scale-95 transition-all duration-300 group focus:outline-none"
        title="Mở Visual Studio & Chọn Hình Nền / Hiệu Ứng"
      >
        <Palette className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
      </button>

      {/* Fullscreen Studio Modal Drawer */}
      <AnimatePresence>
        {isStudioOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="w-full max-w-5xl bg-space-950/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-8 my-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsStudioOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Visual Atmosphere Studio</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  STUDENT HUB AI – <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-300">BACKGROUNDS &amp; EFFECTS</span>
                </h2>
                <p className="text-xs text-gray-400 font-medium">
                  Chọn hình nền điện ảnh hoặc kích hoạt tương tác micro-animations theo ý bạn
                </p>
              </div>

              {/* SECTION 1: BACKGROUNDS (wallpapers) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-teal-400" />
                    <span>BACKGROUNDS (wallpapers)</span>
                  </div>
                  <span className="text-[11px] text-gray-400 normal-case">
                    Click để áp dụng toàn trang ngay
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

              {/* SECTION 2: EFFECTS PREVIEW */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>EFFECTS PREVIEW (interactive gallery)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {EFFECTS.map((eff) => {
                    const isActive = activeEffect === eff.id;
                    return (
                      <div
                        key={eff.id}
                        onClick={() => setActiveEffect(eff.id)}
                        className={`cursor-pointer rounded-2xl border p-2.5 flex flex-col items-center justify-between text-center transition-all duration-300 group min-h-[120px] relative overflow-hidden ${
                          isActive
                            ? "bg-space-900/90 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400"
                            : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-full h-14 rounded-xl overflow-hidden relative flex items-center justify-center bg-black/40 border border-white/5 mb-1.5">
                          {eff.previewType === "aurora" && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/40 via-indigo-600/40 to-pink-500/40 animate-blob-slow filter blur-sm" />
                          )}
                          {eff.previewType === "particles" && (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping absolute" />
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse absolute top-2 left-3" />
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse absolute bottom-2 right-4" />
                            </div>
                          )}
                          {eff.previewType === "glass" && (
                            <div className="w-10 h-6 rounded-lg bg-white/10 backdrop-blur-md border border-white/30 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center">
                              <span className="text-[8px] font-mono text-teal-300">01 / AI</span>
                            </div>
                          )}
                          {eff.previewType === "blob" && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-blob-medium filter blur-xs shadow-lg" />
                          )}
                          {eff.previewType === "sweep" && (
                            <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent animate-pulse" />
                            </div>
                          )}
                          {eff.previewType === "cursor" && (
                            <div className="relative flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full border border-teal-400/80 bg-teal-400/10 flex items-center justify-center animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                              </div>
                            </div>
                          )}
                          {eff.previewType === "text" && (
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-serif-editorial font-bold text-white tracking-wider leading-none">
                                STUDENT
                              </span>
                              <span className="text-[8px] font-sans font-extrabold text-teal-300 leading-none mt-0.5">
                                HUB AI
                              </span>
                            </div>
                          )}
                          {eff.previewType === "orbs" && (
                            <div className="relative flex items-center justify-center">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 shadow-[0_0_12px_rgba(52,231,196,0.5)] animate-float" />
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-gray-200 group-hover:text-teal-300 transition-colors truncate w-full">
                          {eff.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
