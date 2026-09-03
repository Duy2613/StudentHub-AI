"use client";

import React from "react";
import { useBackground, WALLPAPERS } from "@/components/providers/BackgroundContext";


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
    <div className="fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-2.5 select-none">
      {WALLPAPERS.map((wp) => {
        const isActive = activeWallpaper.id === wp.id;
        return (
          <button
            key={wp.id}
            onClick={() => scrollToSection(wp.sectionId, wp.id)}
            className="group relative flex items-center gap-2 py-1 px-1 text-right focus:outline-none"
          >
            {/* Tooltip Label (Shows on hover only, preventing permanent horizontal overlap) */}
            <span className="absolute right-6 px-2.5 py-1 rounded-lg bg-space-950/90 border border-white/15 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl">
              {wp.num} • {wp.name}
            </span>

            {/* Glowing Indicator Dot / Bar */}
            <div
              className={`transition-all duration-300 rounded-full ${
                isActive
                  ? "w-6 h-2 bg-teal-400 shadow-[0_0_12px_rgba(52,231,196,0.9)]"
                  : "w-2 h-2 bg-white/25 group-hover:bg-white/60 group-hover:scale-125"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
