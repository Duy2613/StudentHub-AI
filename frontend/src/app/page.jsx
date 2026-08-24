"use client";

// app/page.jsx
// Trang chủ (Landing Page) chính thức của StudentHub AI:
// - Đỉnh cao sáng tạo: Kết hợp tinh hoa Robin Payot (WebGL Liquid Mesh & 3D Tilt Perspective) & Controleur.ca (Interactive Dialogue & 3-Step Protocol)
// - Typography: Instrument Serif / Cormorant Garamond kết hợp Geist Sans
// - Scrollytelling Background Morphing: Tự động chuyển đổi 6 hình nền điện ảnh độ nét cao và luồng ánh sáng khí quyển khi cuộn
// - Interactive 3D Perspective Blocks: Khối ảnh 3D, thẻ nghiêng đa trục và sóng WebGL phản xạ theo chuột

import React from "react";
import ModernNavbar from "@/components/layout/ModernNavbar";
import HeroSection from "@/components/landing/HeroSection";
import StudentDilemmaChatCarousel from "@/components/landing/StudentDilemmaChatCarousel";
import ThreeStepTrustFlowSection from "@/components/landing/ThreeStepTrustFlowSection";
import CoreFeaturesSection from "@/components/landing/CoreFeaturesSection";
import InteractiveScamDemo from "@/components/landing/InteractiveScamDemo";
import ExplainableEngineSection from "@/components/landing/ExplainableEngineSection";
import CommunityShowcaseSection from "@/components/landing/CommunityShowcaseSection";
import CallToActionSection from "@/components/landing/CallToActionSection";
import LandingFooter from "@/components/landing/LandingFooter";
import FloatingDock from "@/components/ui/floating-dock";
import CinematicScrollytellingObserver from "@/components/ui/CinematicScrollytellingObserver";
import CinematicChapterNavigator from "@/components/ui/CinematicChapterNavigator";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import RobinPayotFluidCanvas from "@/components/canvas/RobinPayotFluidCanvas";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col relative overflow-x-hidden">
      {/* Robin Payot 3D WebGL Liquid Mesh & Ripple Shader Background */}
      <RobinPayotFluidCanvas opacity={0.65} />

      {/* Film Grain & Noise Texture */}
      <NoiseOverlay />

      {/* Scrollytelling Master Background Observer & Fixed Chapter Morph Navigator */}
      <CinematicScrollytellingObserver />
      <CinematicChapterNavigator />

      {/* Floating Island Navbar */}
      <ModernNavbar />

      {/* Main Scrollytelling Sections with Pure Cinematic Flow */}
      <main className="flex-1 w-full relative z-10 space-y-24 sm:space-y-32">
        {/* Section 01: Hero (01. AI Knowledge Portal) */}
        <section id="hero" className="min-h-[90vh] flex flex-col justify-center">
          <HeroSection />
          {/* Controleur Style Live Student Dilemma Dialogue */}
          <StudentDilemmaChatCarousel />
        </section>

        {/* 3-Step Trust Protocol (Controleur Style) */}
        <section id="workflow" className="min-h-[75vh] flex flex-col justify-center">
          <ThreeStepTrustFlowSection />
        </section>

        {/* Section 02: 3 Core Pillars (02. Smart Campus Future) */}
        <section id="features" className="min-h-[85vh] flex flex-col justify-center">
          <CoreFeaturesSection />
        </section>

        {/* Section 03: Interactive Scam Simulation (03. AI Study Room) */}
        <section id="demo" className="min-h-[85vh] flex flex-col justify-center">
          <InteractiveScamDemo />
        </section>

        {/* Section 04: 4-Layer Explainable Engine (04. Neural Network) */}
        <section id="engine" className="min-h-[85vh] flex flex-col justify-center">
          <ExplainableEngineSection />
        </section>

        {/* Section 05: Community & Trust Network (05. Data Flow) */}
        <section id="community" className="min-h-[85vh] flex flex-col justify-center">
          <CommunityShowcaseSection />
        </section>

        {/* Section 06: Call To Action & Contest (06. Focus Mode) */}
        <section id="cta" className="min-h-[75vh] flex flex-col justify-center">
          <CallToActionSection />
        </section>
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Floating Visual Studio Trigger Drawer */}
      <BackgroundsAndEffectsStudio />

      {/* Floating Quick Action Dock */}
      <FloatingDock />
    </div>
  );
}
