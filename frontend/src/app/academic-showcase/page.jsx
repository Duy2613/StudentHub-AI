"use client";

import React, { useState } from "react";
import DeviceSwitcherDock from "@/components/academic-showcase/DeviceSwitcherDock";
import AcademicTelemetryHud from "@/components/academic-showcase/AcademicTelemetryHud";
import MagneticKnowledgeCursor from "@/components/academic-showcase/MagneticKnowledgeCursor";
import AcademicAudioEngine from "@/components/academic-showcase/AcademicAudioEngine";
import CinematicAtmosphereVideo from "@/components/academic-showcase/CinematicAtmosphereVideo";
import CinematicHeroSection from "@/components/academic-showcase/CinematicHeroSection";
import AcademicFeatureBackgroundMatrix from "@/components/academic-showcase/AcademicFeatureBackgroundMatrix";
import AcademicTrustBar from "@/components/academic-showcase/AcademicTrustBar";
import AcademicMissionBento from "@/components/academic-showcase/AcademicMissionBento";
import FourStepLearningFlow from "@/components/academic-showcase/FourStepLearningFlow";
import KnowledgeDomainsCatalog from "@/components/academic-showcase/KnowledgeDomainsCatalog";
import SmartCampusTour from "@/components/academic-showcase/SmartCampusTour";
import ExpertCollective from "@/components/academic-showcase/ExpertCollective";
import VerifiedOutcomes from "@/components/academic-showcase/VerifiedOutcomes";
import AcademicAdvisoryDrawer from "@/components/academic-showcase/AcademicAdvisoryDrawer";
import AcademicShowcaseFooter from "@/components/academic-showcase/AcademicShowcaseFooter";

export default function AcademicShowcasePage() {
  const [currentView, setCurrentView] = useState("desktop"); // 'desktop' | 'tablet' | 'mobile'
  const [isAdvisoryOpen, setIsAdvisoryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-teal-400 selection:text-black flex flex-col antialiased relative">
      
      {/* 1. Procedural 60fps Video Atmosphere Canvas */}
      <CinematicAtmosphereVideo />

      {/* 2. Magnetic Knowledge Cursor (Raben Rifaie style) */}
      <MagneticKnowledgeCursor />

      {/* 3. Web Audio Engine (432Hz Ambient & Haptic Sound) */}
      <AcademicAudioEngine />

      {/* 4. Top Device Switcher Dock (Chonweb style preview dock) */}
      <DeviceSwitcherDock
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenAdvisory={() => setIsAdvisoryOpen(true)}
      />

      {/* 5. Telemetry Sensor HUD (USAvionix style live ticker) */}
      <AcademicTelemetryHud />

      {/* 6. Main Interactive Frame Wrapper with Responsive Device Simulation */}
      <div className={`w-full flex-1 flex justify-center transition-all duration-500 ${
        currentView === "desktop"
          ? "p-0"
          : currentView === "tablet"
          ? "py-10 px-4"
          : "py-10 px-4"
      }`}>
        <main
          className={`w-full relative transition-all duration-500 ${
            currentView === "desktop"
              ? "max-w-none bg-transparent"
              : currentView === "tablet"
              ? "max-w-[820px] bg-[#060813]/90 rounded-[44px] border-[14px] border-[#181d36] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-white/20 backdrop-blur-xl"
              : "max-w-[420px] bg-[#060813]/90 rounded-[52px] border-[14px] border-[#181d36] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-white/20 backdrop-blur-xl"
          }`}
        >
          {/* Mobile/Tablet Virtual Bezel Island */}
          {currentView === "mobile" && (
            <div className="w-full bg-[#181d36] py-1 flex items-center justify-center">
              <div className="h-4 w-28 rounded-full bg-black flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-neutral-800 mr-2"></span>
                <span className="h-2 w-2 rounded-full bg-teal-900/60"></span>
              </div>
            </div>
          )}

          {/* Section 1: Cinematic Hero */}
          <CinematicHeroSection onOpenAdvisory={() => setIsAdvisoryOpen(true)} />

          {/* Section 2: 4 Core Trust Commitments */}
          <AcademicTrustBar />

          {/* Section 3: 8 Core Dashboards × 8 Realtime Looping Backgrounds Matrix */}
          <AcademicFeatureBackgroundMatrix />

          {/* Section 3: USAvionix-style Mission Bento Grid */}
          <AcademicMissionBento />

          {/* Section 4: 4-Step Academic Mastery Protocol */}
          <FourStepLearningFlow />

          {/* Section 5: Knowledge Domains & Course Catalog */}
          <KnowledgeDomainsCatalog onOpenAdvisory={() => setIsAdvisoryOpen(true)} />

          {/* Section 6: Smart Campus & Facilities Visual Tour */}
          <SmartCampusTour />

          {/* Section 7: Verified Expert Mentors Collective */}
          <ExpertCollective onOpenAdvisory={() => setIsAdvisoryOpen(true)} />

          {/* Section 8: Measurable Scientific Outcomes & Testimonials */}
          <VerifiedOutcomes />

          {/* Section 9: Academic rich footer */}
          <AcademicShowcaseFooter />
        </main>
      </div>

      {/* Interactive 4-Year Roadmap Advisory Modal */}
      <AcademicAdvisoryDrawer
        isOpen={isAdvisoryOpen}
        onClose={() => setIsAdvisoryOpen(false)}
      />

    </div>
  );
}
