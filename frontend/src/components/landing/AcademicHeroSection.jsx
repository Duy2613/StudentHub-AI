"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  FileCheck2,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import KnowledgeUniverse3D, { KNOWLEDGE_DOMAINS } from "../canvas/KnowledgeUniverse3D";

export default function AcademicHeroSection() {
  const [activeNode, setActiveNode] = useState("backend");

  return (
    <section
      className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden border-b border-border-subtle bg-bg-primary"
      aria-labelledby="hero-title"
    >
      {/* Background ambient gradient aura */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[420px] h-[420px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Editorial Headline & Copy (45-50%) */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center text-left space-y-6 lg:pr-6 z-10">
          {/* Canonical Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider bg-surface-primary border border-border-strong text-accent-knowledge w-fit">
            <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
            <span>Academic Operating System</span>
          </div>

          {/* Canonical Hero Headline */}
          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-text-primary leading-[1.08]"
          >
            LEARN BEYOND <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-accent-knowledge">
              THE CLASSROOM.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg lg:text-xl text-text-secondary leading-relaxed max-w-xl">
            An intelligent learning environment that turns knowledge, practice, projects and
            people into one connected journey.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/learn"
              className="px-6 py-3.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-medium text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-lg shadow-accent-primary/25 hover:shadow-accent-primary/40 focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <span>Start Learning</span>
              <ArrowRight size={17} />
            </Link>

            <a
              href="#knowledge-atlas"
              className="px-6 py-3.5 rounded-xl bg-surface-primary hover:bg-surface-elevated text-text-primary border border-border-strong font-medium text-sm sm:text-base flex items-center gap-2.5 transition-all hover:border-accent-knowledge/40 focus:outline-none focus:ring-2 focus:ring-accent-knowledge"
            >
              <Compass size={17} className="text-accent-knowledge" />
              <span>Explore the Atlas</span>
            </a>
          </div>

          {/* Architectural Trust Pillars metadata chips */}
          <div className="pt-6 border-t border-border-subtle grid grid-cols-3 gap-4 text-left">
            <div>
              <div className="text-lg sm:text-xl font-mono font-bold text-text-primary">13</div>
              <div className="text-xs text-text-muted mt-0.5">Full-Stack Layers</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-mono font-bold text-accent-knowledge">100%</div>
              <div className="text-xs text-text-muted mt-0.5">Verified Evidence</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-mono font-bold text-status-success">4-Layer</div>
              <div className="text-xs text-text-muted mt-0.5">Reality Alignment</div>
            </div>
          </div>
        </div>

        {/* Right Column: Knowledge Universe Spatial View (50-55%) */}
        <div className="lg:col-span-6 xl:col-span-6 relative w-full h-[400px] sm:h-[480px] lg:h-[580px] flex items-center justify-center">
          <div className="w-full h-full rounded-2xl bg-surface-primary/40 border border-border-subtle/50 backdrop-blur-sm overflow-hidden relative shadow-2xl">
            {/* 3D Knowledge Universe with progressive enhancement and fallback */}
            <KnowledgeUniverse3D
              activeNodeId={activeNode}
              onSelectNode={(id) => setActiveNode(id)}
              className="w-full h-full"
            />

            {/* Subtle active domain indicator pill */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-20 flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-surface-primary/80 border border-border-strong backdrop-blur-md text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-knowledge" />
                <span className="text-text-muted">Node đang kích hoạt:</span>
                <span className="text-text-primary font-semibold uppercase">
                  {KNOWLEDGE_DOMAINS.find((d) => d.id === activeNode)?.label || activeNode}
                </span>
              </div>
              <span className="text-text-muted text-[11px] hidden sm:inline">Tương tác 3D / Chạm</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
