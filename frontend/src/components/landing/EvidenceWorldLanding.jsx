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

      {/* Product principles ticker */}
      <div className="w-full border-b border-white/10 bg-space-950/70 py-3 overflow-hidden backdrop-blur-md relative z-10">
        <HobroTelemetryMarquee />
      </div>

      {/* 02. NOISE → SIGNAL (Dual analytical refraction) */}
      <div className="relative z-10">
        <NoiseToSignalSection />
      </div>

      {/* 03. Product introduction reel; it does not show live case data */}
      <div className="relative z-10">
        <CinematicReelStage />
      </div>

      {/* 04. Trust response, sources, and limits */}
      <div className="relative z-10">
        <TrustCinematicJourney />
      </div>

      {/* 05. Data-honesty principles */}
      <div className="relative z-10">
        <WhyZeroManifestoSection />
      </div>

      {/* 06. Conceptual map of the three product spaces */}
      <div className="relative z-10">
        <KnowledgeAtlasSection />
      </div>

      {/* 07. AI output and provenance boundaries */}
      <div className="relative z-10">
        <VerifiedHumanAiSection />
      </div>

      {/* 08. Community discussion boundaries */}
      <div className="relative z-10" style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}>
        <CollectiveCommunitySection />
      </div>

      {/* 09. Expert authority boundaries */}
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
