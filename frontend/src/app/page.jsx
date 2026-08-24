"use client";

// app/page.jsx
// Trang chủ (Landing Page) chính thức của StudentHub AI:
// - Nghệ thuật chỉ đạo: Editorial Academic × Human Technology × Cinematic Campus
// - Typography: Instrument Serif / Cormorant Garamond kết hợp Geist Sans
// - Scrollytelling Background Transition: Cuộn trang tự động chuyển đổi 6 hình nền & hiệu ứng điện ảnh
// - 6 Phân đoạn: Hero (01. Portal) -> 3 Trụ Cột (02. Campus) -> Demo (03. Study Room) -> Engine (04. Neural Network) -> Community (05. Data Flow) -> CTA (06. Focus Mode)

import React from "react";
import ModernNavbar from "@/components/layout/ModernNavbar";
import HeroSection from "@/components/landing/HeroSection";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import CoreFeaturesSection from "@/components/landing/CoreFeaturesSection";
import InteractiveScamDemo from "@/components/landing/InteractiveScamDemo";
import ExplainableEngineSection from "@/components/landing/ExplainableEngineSection";
import CommunityShowcaseSection from "@/components/landing/CommunityShowcaseSection";
import CallToActionSection from "@/components/landing/CallToActionSection";
import LandingFooter from "@/components/landing/LandingFooter";
import FloatingDock from "@/components/ui/floating-dock";
import CinematicScrollytellingObserver from "@/components/ui/CinematicScrollytellingObserver";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col relative overflow-x-hidden">
      {/* Dynamic Backgrounds & Film Grain */}
      <AmbientBackground />
      <NoiseOverlay />

      {/* Scrollytelling Master Background Observer */}
      <CinematicScrollytellingObserver />

      {/* Floating Island Navbar */}
      <ModernNavbar />

      {/* Main Scrollytelling Sections */}
      <main className="flex-1 w-full relative z-10 space-y-16">
        {/* Section 01: Hero (01. AI Knowledge Portal) */}
        <div id="hero">
          <HeroSection />
        </div>

        {/* Live Visual Atmosphere & Wallpapers Studio */}
        <BackgroundsAndEffectsStudio isInline={true} />

        {/* Section 02: 3 Core Pillars (02. Smart Campus Future) */}
        <div id="features">
          <CoreFeaturesSection />
        </div>

        {/* Section 03: Interactive Scam Simulation (03. AI Study Room) */}
        <div id="demo">
          <InteractiveScamDemo />
        </div>

        {/* Section 04: 4-Layer Explainable Engine (04. Neural Network) */}
        <div id="engine">
          <ExplainableEngineSection />
        </div>

        {/* Section 05: Community & Trust Network (05. Data Flow) */}
        <div id="community">
          <CommunityShowcaseSection />
        </div>

        {/* Section 06: Call To Action & Contest (06. Focus Mode) */}
        <div id="cta">
          <CallToActionSection />
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Floating Quick Action Dock */}
      <FloatingDock />
    </div>
  );
}
