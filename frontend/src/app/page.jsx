"use client";

// app/page.jsx
// Trang chủ (Landing Page) chính thức của StudentHub AI:
// - Nền tảng Phòng chống Lừa đảo & Mạng lưới Xác thực thông tin dành cho sinh viên Việt Nam
// - Dự án dự thi "Cuộc thi Sáng tạo trẻ Quốc gia trong lĩnh vực Trí tuệ nhân tạo năm 2026", Bảng C (sinh viên)
// - Floating Glassmorphic Island Navbar, 3D WebGL Hologram Core, 3 Trụ Cột, Live Scam Demo & 4-Layer Engine

import React from "react";
import ModernNavbar from "@/components/layout/ModernNavbar";
import HeroSection from "@/components/landing/HeroSection";
import CoreFeaturesSection from "@/components/landing/CoreFeaturesSection";
import InteractiveScamDemo from "@/components/landing/InteractiveScamDemo";
import ExplainableEngineSection from "@/components/landing/ExplainableEngineSection";
import LandingFooter from "@/components/landing/LandingFooter";
import FloatingDock from "@/components/ui/floating-dock";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col relative overflow-x-hidden">
      {/* Dynamic Backgrounds & Film Grain */}
      <AmbientBackground />
      <NoiseOverlay />

      {/* Floating Island Navbar */}
      <ModernNavbar />

      {/* Main Sections */}
      <main className="flex-1 w-full relative z-10">
        <HeroSection />
        <CoreFeaturesSection />
        <InteractiveScamDemo />
        <ExplainableEngineSection />
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Floating Quick Action Dock */}
      <FloatingDock />
    </div>
  );
}
