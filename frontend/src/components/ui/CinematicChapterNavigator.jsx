"use client";

import React from "react";
import { useBackground, WALLPAPERS } from "@/components/providers/BackgroundContext";
import { motion } from "framer-motion";

export default function CinematicChapterNavigator() {
  const { activeWallpaper, setScrollySection } = useBackground();

  const scrollToSection = (sectionId, wpId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setScrollySection(wpId);
    }
  };

  return (
    <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-3 select-none">
      {WALLPAPERS.map((wp) => {
        const isActive = activeWallpaper.id === wp.id;
        return (
          <button
            key={wp.id}
            onClick={() => scrollToSection(wp.sectionId, wp.id)}
            className="group flex items-center gap-2.5 py-1 px-1 text-right focus:outline-none"
          >
            {/* Hover/Active Label */}
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300 ${
                isActive
                  ? "opacity-100 text-white translate-x-0"
                  : "opacity-0 group-hover:opacity-80 text-gray-400 translate-x-2"
              }`}
            >
              {wp.num} • {wp.name}
            </span>

            {/* Glowing Indicator Dot / Bar */}
            <div
              className={`transition-all duration-500 rounded-full ${
                isActive
                  ? "w-7 h-2 bg-teal-400 shadow-[0_0_15px_rgba(52,231,196,0.9)]"
                  : "w-2 h-2 bg-white/20 group-hover:bg-white/50 group-hover:scale-125"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
