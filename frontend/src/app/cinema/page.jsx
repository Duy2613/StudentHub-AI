"use client";

import React, { useState } from "react";
import Link from "next/link";
import AcademicCinemaTheater from "@/components/academic-showcase/AcademicCinemaTheater";
import MagneticKnowledgeCursor from "@/components/academic-showcase/MagneticKnowledgeCursor";
import AcademicAudioEngine from "@/components/academic-showcase/AcademicAudioEngine";
import { ArrowLeft, Film, Shield, Sparkles } from "lucide-react";

export default function CinemaPage() {
  return (
    <div className="min-h-screen bg-[#060813] text-white selection:bg-teal-400 selection:text-black flex flex-col antialiased relative">
      <MagneticKnowledgeCursor />
      <AcademicAudioEngine />

      {/* Top Header Bar */}
      <header className="w-full border-b border-white/10 bg-[#060813]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/academic-showcase"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO SHOWCASE</span>
          </Link>
          <div className="h-4 w-px bg-white/15" />
          <div className="flex items-center gap-2 font-serif text-sm text-zinc-200">
            <Film className="w-4 h-4 text-amber-400" />
            <span>StudentHub AI • Academic Cinema Archive</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-zinc-400">
          <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">8 FILMS • 8.00s EXACT DURATION</span>
          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">24.00 FPS • 16:9</span>
        </div>
      </header>

      {/* Main Theater */}
      <main className="flex-1">
        <AcademicCinemaTheater />
      </main>

      {/* Footer Note */}
      <footer className="w-full py-8 border-t border-white/10 text-center text-xs font-mono text-zinc-500 bg-[#080a0f]">
        STUDENTHUB AI • ACADEMIC CINEMATIC MASTER COLLECTION • 100% INDEPENDENT ORIGINAL VISUALS
      </footer>
    </div>
  );
}
