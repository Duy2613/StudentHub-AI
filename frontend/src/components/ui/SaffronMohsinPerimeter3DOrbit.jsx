"use client";

// frontend/src/components/ui/SaffronMohsinPerimeter3DOrbit.jsx
//
// 3D Gyroscopic Astrolabe & Perimeter Orbiting Satellites
// (Inspired by Meer Mohsin 3D Canvas Dynamics & Saffron Swiss Geometry)
// - Concentric 3D orbital rings revolving around the screen perimeter & hero section
// - Orbiting satellite nodes: Crystalline Polyhedra, Saffron Gold Stars, Trust Badges, AI Radar Beacons
// - Smooth mouse parallax tracking + 60fps hardware-accelerated CSS/SVG 3D transforms

import React, { useEffect, useState } from "react";
import { ShieldCheck, Sparkles, Radio, Star, Lock, Zap } from "lucide-react";

export default function SaffronMohsinPerimeter3DOrbit({ className = "" }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 20;
      const y = (e.clientY / innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none z-[1] overflow-hidden ${className}`}>
      {/* Container with 3D Mouse Parallax Tilt */}
      <div
        className="w-full h-full relative transition-transform duration-700 ease-out"
        style={{
          transform: `perspective(1000px) rotateX(${-mousePos.y * 0.4}deg) rotateY(${mousePos.x * 0.4}deg)`,
        }}
      >
        {/* =========================================================================
            1. OUTER MASTER 3D ASTROLABE ORBIT (1200px)
            ========================================================================= */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] sm:w-[1250px] sm:h-[1250px]">
          <svg
            className="w-full h-full opacity-35 animate-[spin_120s_linear_infinite]"
            viewBox="0 0 1200 1200"
            fill="none"
          >
            {/* Master Golden Outer Ring */}
            <circle
              cx="600"
              cy="600"
              r="580"
              stroke="#ffbc09"
              strokeWidth="1.2"
              strokeDasharray="4 16"
              className="opacity-70"
            />
            {/* Orbiting Satellite Node Dots */}
            <circle cx="600" cy="20" r="5.5" fill="#ffbc09" className="animate-pulse shadow-[0_0_12px_#ffbc09]" />
            <circle cx="1180" cy="600" r="4.5" fill="#38bdf8" />
            <circle cx="20" cy="600" r="4.5" fill="#34e7c4" />
            <circle cx="600" cy="1180" r="5" fill="#ca56ed" />
            <circle cx="1010" cy="190" r="3.5" fill="#ffd15c" />
            <circle cx="190" cy="1010" r="3.5" fill="#38bdf8" />
          </svg>
        </div>

        {/* =========================================================================
            2. MIDDLE COUNTER-ROTATING GYRO RING (880px)
            ========================================================================= */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] sm:w-[920px] sm:h-[920px]">
          <svg
            className="w-full h-full opacity-40 animate-[spin_75s_linear_infinite_reverse]"
            viewBox="0 0 900 900"
            fill="none"
          >
            {/* Cyan / Saffron Hybrid Orbit */}
            <circle
              cx="450"
              cy="450"
              r="430"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="8 24"
            />
            <circle cx="450" cy="20" r="5" fill="#38bdf8" className="shadow-[0_0_15px_#38bdf8]" />
            <circle cx="880" cy="450" r="4" fill="#ffbc09" />
            <circle cx="20" cy="450" r="4" fill="#34e7c4" />
            <circle cx="450" cy="880" r="4" fill="#ca56ed" />
            <circle cx="750" cy="150" r="3" fill="#ffbc09" />
            <circle cx="150" cy="750" r="3" fill="#ffd15c" />
          </svg>
        </div>

        {/* =========================================================================
            3. INNER HIGH-SPEED QUANTUM CORE ORBIT (600px)
            ========================================================================= */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] sm:w-[620px] sm:h-[620px]">
          <div className="w-full h-full rounded-full border border-[#ffbc09]/25 opacity-50 shadow-[0_0_50px_rgba(255,188,9,0.1)] animate-[spin_40s_linear_infinite] relative">
            {/* Orbiting Satellite Chip 1: Anti-Scam Shield */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#150604]/90 border border-[#ffbc09]/60 shadow-[0_0_15px_rgba(255,188,9,0.4)] text-[9px] font-mono text-[#ffbc09]">
              <ShieldCheck className="w-3 h-3 text-[#ffbc09]" />
              <span>AI SHIELD // 4-LAYER</span>
            </div>

            {/* Orbiting Satellite Chip 2: Academic Transponder */}
            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#150604]/90 border border-[#38bdf8]/60 shadow-[0_0_15px_rgba(56,189,248,0.4)] text-[9px] font-mono text-[#38bdf8]">
              <Radio className="w-3 h-3 text-[#38bdf8] animate-pulse" />
              <span>EDU TRANSPONDER // +30 PTS</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. FLOATING 3D CORNER BEACONS ON PERIMETER (Four Corners)
            ========================================================================= */}
        {/* Top-Left 3D Hologram Beacon */}
        <div className="absolute top-28 left-6 sm:left-12 hidden lg:flex items-center gap-3 p-3 rounded-2xl bg-[#150604]/85 border border-[#47140b] shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-float">
          <div className="w-8 h-8 rounded-xl bg-[#2f0e09] border border-[#ffbc09]/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,188,9,0.25)]">
            <Sparkles className="w-4 h-4 text-[#ffbc09]" />
          </div>
          <div className="font-mono text-[10px]">
            <div className="text-[#ffbc09] font-bold tracking-wider">[ 01 // AIRSPACE_RADAR ]</div>
            <div className="text-[#ece7e0]/60">14,280 Nodes Online</div>
          </div>
        </div>

        {/* Top-Right 3D Security Beacon */}
        <div
          className="absolute top-28 right-6 sm:right-12 hidden lg:flex items-center gap-3 p-3 rounded-2xl bg-[#150604]/85 border border-[#47140b] shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-float"
          style={{ animationDelay: "1.5s" }}
        >
          <div className="w-8 h-8 rounded-xl bg-[#210a07] border border-[#38bdf8]/40 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <Lock className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="font-mono text-[10px]">
            <div className="text-[#38bdf8] font-bold tracking-wider">[ 02 // AES-256 CIPHER ]</div>
            <div className="text-[#ece7e0]/60">Zero Data Leakage</div>
          </div>
        </div>

        {/* Bottom-Left SQUAWK Status Pill */}
        <div
          className="absolute bottom-24 left-6 sm:left-12 hidden lg:flex items-center gap-3 p-3 rounded-2xl bg-[#150604]/85 border border-[#47140b] shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-float"
          style={{ animationDelay: "3s" }}
        >
          <div className="w-8 h-8 rounded-xl bg-[#2f0e09] border border-[#10b981]/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Zap className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="font-mono text-[10px]">
            <div className="text-[#10b981] font-bold tracking-wider">[ 03 // 0.1s RESPONSE ]</div>
            <div className="text-[#ece7e0]/60">Instant Scam Warning</div>
          </div>
        </div>

        {/* Bottom-Right Verified Student Transponder */}
        <div
          className="absolute bottom-24 right-6 sm:right-12 hidden lg:flex items-center gap-3 p-3 rounded-2xl bg-[#150604]/85 border border-[#47140b] shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-float"
          style={{ animationDelay: "2.2s" }}
        >
          <div className="w-8 h-8 rounded-xl bg-[#210a07] border border-[#ffbc09]/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,188,9,0.25)]">
            <Star className="w-4 h-4 text-[#ffbc09] fill-[#ffbc09]" />
          </div>
          <div className="font-mono text-[10px]">
            <div className="text-[#ffbc09] font-bold tracking-wider">[ 04 // TSO-C199 VERIFIED ]</div>
            <div className="text-[#ece7e0]/60">Reputation 0-100 pts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
