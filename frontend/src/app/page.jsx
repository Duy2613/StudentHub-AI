"use client";

// app/page.jsx
//
// Trang chủ (Landing Page) chính thức của StudentHub AI (3D Highway Flight & 3D Black Billboards):
// - Trải nghiệm ban đầu: Màn hình không bị che lấp bởi các khối text tĩnh, chỉ có không gian sóng hạt 3D và đường bay
// - Khi lướt (scroll): Camera 3D lướt qua 5 BẢNG ĐEN (3D Obsidian Black Billboards) đặt dọc theo con đường:
//     1. [ 01 // XÁC THỰC AI ] — AI Scam Engine 4 Lớp (/scam-check)
//     2. [ 02 // CỐ VẤN & HỒ SƠ UY TÍN ] — Mạng Lưới Chuyên Gia & Điểm Uy Tín (/profile)
//     3. [ 03 // DIỄN ĐÀN SINH VIÊN ] — Diễn Đàn Xác Thực & Vote Tín Nhiệm (/forum)
//     4. [ 04 // BẢNG ĐIỀU KHIỂN MISSION CONTROL ] — Dashboard (/dashboard)
//     5. [ 05 // ĐĂNG KÝ & BẢO VỆ SỐ ] — Saffron Academic Register (/register)
// - Khi click vào bất kỳ bảng đen nào -> Mở toàn bộ thông tin chi tiết từ A tới Z kèm phím chức năng và nút QUAY LẠI 3D ROAD

import React from "react";
import ModernNavbar from "@/components/layout/ModernNavbar";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMohsinPerimeter3DOrbit from "@/components/ui/SaffronMohsinPerimeter3DOrbit";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";
import { NoiseOverlay } from "@/components/auth/AuthUI";

export default function HomePage() {
  return (
    <div className="min-h-[500vh] bg-[#070403] text-gray-100 flex flex-col relative selection:bg-[#ffbc09] selection:text-[#150604] font-human">
      {/* 1. 3D Infinite Curving Highway Canvas with Interactive 3D Black Billboards */}
      <RobinPayotRoadCanvas showHud={true} />

      {/* 2. Meer Mohsin Real-time WebGL Fluid Smoke Cursor Canvas */}
      <MohsinFluidCanvas opacity={0.65} particleDensity={50} />

      {/* 3. 3D Astrolabe & Perimeter Orbiting Satellites (Quay quanh chu vi) */}
      <SaffronMohsinPerimeter3DOrbit />

      {/* 4. Film Grain Texture */}
      <NoiseOverlay />

      {/* 5. Floating Studios & Dock */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* Floating Island Navbar */}
      <header className="overlay-nav-layer">
        <ModernNavbar />
      </header>

      {/* Top Fixed Telemetry Marquee Ticker */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-4 pointer-events-none">
        <SaffronMarqueeTicker className="rounded-2xl border border-[#47140b] shadow-2xl backdrop-blur-xl" />
      </div>

      {/* Sleek Bottom-Docked Quick Flight & Access Bar (Non-intrusive, 100% unobstructed 3D view) */}
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 sm:p-2 rounded-full bg-[#120604]/90 border border-[#ffbc09]/40 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] max-w-full overflow-x-auto select-none pointer-events-auto">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 text-[#ffbc09] text-[11px] font-mono font-bold uppercase tracking-wider shrink-0 border-r border-[#47140b]">
          <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
          <span>LƯỚT 3D / TRUY CẬP NHANH:</span>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2">
          <a
            href="/scam-check"
            className="px-3.5 py-1.5 rounded-full bg-[#ffbc09] hover:bg-[#ffd15c] text-[#150604] font-mono font-extrabold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(255,188,9,0.35)] transition-all hover:scale-105 shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>🛡️</span>
            <span>Quét Lừa Đảo AI</span>
          </a>
          <a
            href="/credit-scheduler"
            className="px-3.5 py-1.5 rounded-full bg-[#1a0906] hover:bg-[#250d09] border border-[#ffbc09]/40 text-[#ffd15c] font-mono font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>🎓</span>
            <span>Xếp Lịch Tín Chỉ</span>
          </a>
          <a
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-full bg-[#1a0906] hover:bg-[#250d09] border border-[#47140b] hover:border-white/30 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚡</span>
            <span>Mission Control</span>
          </a>
        </div>
      </div>

      {/* Bottom Right Scroll Progress Indicator */}
      <div className="fixed bottom-6 right-8 z-30 pointer-events-none select-none font-mono text-[11px] text-[#ffbc09] font-bold">
        [ 01 → 05 // 3D HIGHWAY ARCHITECTURE ]
      </div>
    </div>
  );
}
