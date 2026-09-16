"use client";

import React from "react";
import HeroCinematicPorch from "@/components/cinematic/HeroCinematicPorch";
import HobroTelemetryMarquee from "@/components/ui/HobroTelemetryMarquee";
import NoiseToSignalSection from "@/components/cinematic/NoiseToSignalSection";
import CinematicReelStage from "@/components/cinematic/CinematicReelStage";
import TrustCinematicJourney from "@/components/cinematic/TrustCinematicJourney";
import WhyZeroManifestoSection from "@/components/cinematic/WhyZeroManifestoSection";
import KnowledgeAtlasSection from "@/components/cinematic/KnowledgeAtlasSection";
import VerifiedHumanAiSection from "@/components/cinematic/VerifiedHumanAiSection";
import CollectiveCommunitySection from "@/components/cinematic/CollectiveCommunitySection";
import ExpertAuthoritySection from "@/components/cinematic/ExpertAuthoritySection";
import FinalClaritySection from "@/components/cinematic/FinalClaritySection";

export default function EvidenceWorldLanding() {
  return (
    <div className="relative w-full bg-space-950 text-slate-100 selection:bg-emerald-400 selection:text-space-950 overflow-x-clip">

      {/* 01. HIÊN TRI THỨC (Hero Cinematic Porch with 3D Evidence Prism) */}
      <HeroCinematicPorch />

      {/* Forensic Telemetry Marquee Ticker (Hobro Digital Ticker) */}
      <div className="w-full border-b border-white/10 bg-space-950/70 py-3 overflow-hidden backdrop-blur-md relative z-10">
        <HobroTelemetryMarquee />
      </div>

      {/* 02. NOISE → SIGNAL (Dual analytical refraction) */}
      <div className="relative z-10">
        <NoiseToSignalSection />
      </div>

      {/* 03. 4K CINEMATIC REEL STAGE (Showcasing all pre-rendered v3 video assets) */}
      <div className="relative z-10">
        <CinematicReelStage />
      </div>

      {/* 04. TRUST ENGINE (8-Stage Forensic Verification Journey) */}
      <div className="relative z-10">
        <TrustCinematicJourney />
      </div>

      {/* 05. WHY ZERO MANIFESTO & INTERACTIVE VERDICT LAB (Zero University Manifesto) */}
      <div className="relative z-10">
        <WhyZeroManifestoSection />
      </div>

      {/* 06. LIVING KNOWLEDGE ATLAS (3D Spatial Scene & Expanding Pillars) */}
      <div className="relative z-10">
        <KnowledgeAtlasSection />
      </div>

      {/* 07. VERIFIED HUMAN + AI FORENSICS */}
      <div className="relative z-10">
        <VerifiedHumanAiSection />
      </div>

      {/* 08. COLLECTIVE INTELLIGENCE (Community Fellowship) */}
      <div className="relative z-10" style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}>
        <CollectiveCommunitySection />
      </div>

      {/* 09. EXPERT TRUST NETWORK (Academic Authority) */}
      <div className="relative z-10" style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}>
        <ExpertAuthoritySection />
      </div>

      {/* 10. FINAL CLARITY & CLOSING OVERTURE */}
      <div className="relative z-10" style={{ contentVisibility: "auto", containIntrinsicSize: "750px" }}>
        <FinalClaritySection />
      </div>
    </div>
  );
}
