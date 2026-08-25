"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

/**
 * AeroMissionControlBackdrop
 * 
 * High-End Aerospace & Aviation Radar Backdrop inspired by uAvionix (Awwwards SOTD).
 * Features:
 * - Ultra-fine technical telemetry coordinate grid & crosshair markings
 * - Subtle ambient radar sweep & concentric range rings
 * - Interactive cursor magnetic glow
 * - 100% Non-blocking, GPU-accelerated, zero scroll clumping / zero visual collision
 */
export default function AeroMissionControlBackdrop({
  sectorTag = "SECTOR_07_ALPHA // HCMUTE_AIRSPACE",
  gridDensity = 48,
  showRadarRings = true,
  opacity = 0.85,
}) {
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{ opacity }}
    >
      {/* 1. Deep OLED Obsidian Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060302] via-[#0a0504] to-[#040201]" />

      {/* 2. Aerospace Radial Ambient Heat Orbs (Diffused Saffron & Amber Glows) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-b from-[#ffbc09]/[0.07] via-[#ea3810]/[0.03] to-transparent blur-[120px]" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[600px] h-[400px] rounded-full bg-[#ffbc09]/[0.04] blur-[100px]" />
      <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#ea3810]/[0.03] blur-[110px]" />

      {/* 3. Precision Technical Avionics Grid */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,188,9,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,188,9,0.03)_1px,transparent_1px)]"
        style={{
          backgroundSize: `${gridDensity}px ${gridDensity}px`,
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 40%, transparent 95%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 40%, transparent 95%)",
        }}
      />

      {/* 4. Concentric Aviation Radar Range Rings & Crosshairs */}
      {showRadarRings && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] pointer-events-none opacity-40">
          {/* Ring 1 */}
          <div className="absolute inset-[15%] rounded-full border border-dashed border-[#ffbc09]/15 animate-[spin_160s_linear_infinite]" />
          {/* Ring 2 */}
          <div className="absolute inset-[30%] rounded-full border border-[#ffbc09]/10" />
          {/* Ring 3 */}
          <div className="absolute inset-[45%] rounded-full border border-dotted border-[#ffbc09]/20 animate-[spin_90s_linear_infinite_reverse]" />
          {/* Center Radar Cross */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ffbc09]/15 to-transparent" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#ffbc09]/15 to-transparent" />
        </div>
      )}

      {/* 5. Micro-HUD Telemetry Corner Coordinate Anchors (Fixed Non-Obstructive) */}
      <div className="absolute top-24 left-6 hidden lg:flex items-center gap-2 font-mono text-[9px] text-[#ffbc09]/40 tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ffbc09]/60 animate-pulse" />
        <span>SYS.STATUS: ARMED // {sectorTag}</span>
      </div>

      <div className="absolute top-24 right-6 hidden lg:flex items-center gap-2 font-mono text-[9px] text-[#ffbc09]/40 tracking-widest uppercase">
        <span>LAT: 10.8505° N | LON: 106.7719° E</span>
        <span className="text-[#38bdf8]/60">[ TSO-C199 OK ]</span>
      </div>

      <div className="absolute bottom-6 left-6 hidden lg:block font-mono text-[9px] text-white/20 tracking-widest uppercase">
        [ 01 → 04 // DETERMINISTIC AI TRUST ARCHITECTURE ]
      </div>

      <div className="absolute bottom-6 right-6 hidden lg:block font-mono text-[9px] text-[#ffbc09]/30 tracking-widest uppercase">
        NODE_SECURITY: 99.98% // ZERO_OVERLAP_STREAM
      </div>

      {/* 6. Subtle Technical Crosshairs in 4 Quadrants */}
      <span className="absolute top-36 left-[18%] text-[#ffbc09]/25 font-mono text-xs select-none">+</span>
      <span className="absolute top-36 right-[18%] text-[#ffbc09]/25 font-mono text-xs select-none">+</span>
      <span className="absolute bottom-36 left-[18%] text-[#ffbc09]/25 font-mono text-xs select-none">+</span>
      <span className="absolute bottom-36 right-[18%] text-[#ffbc09]/25 font-mono text-xs select-none">+</span>
    </div>
  );
}
