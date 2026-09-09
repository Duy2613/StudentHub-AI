"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBackground, ACADEMIC_CINEMA_FILMS } from "@/components/providers/BackgroundContext";
import { Film, Pause, Play, ChevronUp, ChevronDown, Maximize2, X } from "lucide-react";

export default function CinematicAmbientDock() {
  const {
    activeFilm,
    setActiveFilm,
    bgOpacity,
    setBgOpacity,
    isBgPaused,
    setIsBgPaused,
  } = useBackground();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!activeFilm) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-30 hidden sm:block">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-10 h-10 rounded-full bg-[#0e1118]/90 border border-amber-400/40 text-amber-300 shadow-xl shadow-black/80 flex items-center justify-center hover:scale-110 transition-all backdrop-blur-md"
          title="Mở Ambient Background Controller"
        >
          <Film className="w-4 h-4 animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Bộ điều khiển hình nền điện ảnh" className="fixed bottom-4 right-4 z-30 hidden sm:flex flex-col items-end gap-2 pointer-events-auto">
      {/* Expanded Film Picker & Setting Tray */}
      {isExpanded && (
        <div className="w-80 rounded-2xl bg-[#0e1118]/95 border border-white/15 p-4 shadow-2xl shadow-black/90 backdrop-blur-xl text-white mb-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
              <Film className="w-3.5 h-3.5" />
              <span>CINEMATIC BACKGROUND ENGINE</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10"
              title="Đóng bảng điều khiển"
              aria-label="Đóng bảng điều khiển"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Opacity Presets */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
              <span>HÌNH NỀN OPACITY:</span>
              <span className="text-amber-400 font-bold">{Math.round(bgOpacity * 100)}%</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.25, 0.45, 0.65, 0.85].map((op) => (
                <button
                  key={op}
                  onClick={() => setBgOpacity(op)}
                  className={`py-1 rounded-lg text-xs font-mono transition-all ${
                    bgOpacity === op
                      ? "bg-amber-500/20 border border-amber-400 text-amber-300 font-bold"
                      : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {Math.round(op * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* 8-Film Quick Selector */}
          <div className="mb-3">
            <div className="text-[11px] font-mono text-zinc-400 mb-1.5">
              CHỌN TÁC PHẨM ĐIỆN ẢNH (8 FILMS):
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 select-none">
              {ACADEMIC_CINEMA_FILMS.map((film) => {
                const isSelected = activeFilm.id === film.id;
                return (
                  <button
                    key={film.id}
                    onClick={() => setActiveFilm(film)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all ${
                      isSelected
                        ? "bg-amber-500/15 border border-amber-400/60 text-amber-200 font-semibold"
                        : "bg-white/5 border border-white/5 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] text-zinc-400">
                        {film.num}
                      </span>
                      <span className="truncate">{film.title}</span>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fullscreen Theater Link */}
          <Link
            href="/cinema"
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-mono flex items-center justify-center gap-2 text-zinc-200 hover:text-white transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Mở Rạp Chiếu 4K Cinema</span>
          </Link>
        </div>
      )}

      {/* Main Bottom Floating Pill */}
      <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#0e1118]/90 border border-white/15 shadow-2xl shadow-black/80 backdrop-blur-md">
        {/* Active Film Indicator Pill */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-200 transition-all group"
          title="Bấm để đổi tác phẩm nền"
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-300 font-bold">{activeFilm.num}</span>
          <span className="max-w-[140px] truncate hidden sm:inline text-zinc-300 group-hover:text-white">
            {activeFilm.title}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>

        {/* Play / Pause Video Motion */}
        <button
          onClick={() => setIsBgPaused(!isBgPaused)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all"
          title={isBgPaused ? "Phát lại video nền" : "Tạm dừng video nền"}
          aria-label={isBgPaused ? "Phát lại video nền" : "Tạm dừng video nền"}
        >
          {isBgPaused ? <Play className="w-3.5 h-3.5 translate-x-0.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* Minimize Button */}
        <button
          onClick={() => setIsMinimized(true)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
          title="Thu nhỏ thanh điều khiển"
          aria-label="Thu nhỏ thanh điều khiển"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
}
