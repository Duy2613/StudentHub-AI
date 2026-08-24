"use client";

// app/page.jsx
// Trang chủ (Landing Page) chính thức của StudentHub AI:
// - Nghệ thuật chỉ đạo: Editorial Academic × Human Technology × Cinematic Campus
// - Typography: Instrument Serif / Cormorant Garamond kết hợp Geist Sans
// - Visual Motif: The Knowledge Orbit System & Backgrounds & Effects Studio
// - 3 Trụ Cột: AI Scam Checker 4 Lớp, Chuyên gia Uy tín & Diễn đàn Sinh viên

import React from "react";
import ModernNavbar from "@/components/layout/ModernNavbar";
import HeroSection from "@/components/landing/HeroSection";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
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
      <main className="flex-1 w-full relative z-10 space-y-12">
        <HeroSection />
        <BackgroundsAndEffectsStudio isInline={true} />
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
