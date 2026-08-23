"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

export default function CosmicDustShowcasePage() {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#000000] text-white overflow-hidden">
      {/* Top Bar Controls */}
      <div className="h-14 bg-[#1a0a04]/90 border-b border-amber-500/20 px-4 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/showcase"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lab Hub</span>
          </Link>
          <div className="h-4 w-px bg-amber-500/20" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-sm font-semibold text-amber-100 tracking-tight">Cosmic Dust — Three.js Floating Particle Universe</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey(k => k + 1)}
            className="flex items-center gap-1.5 text-xs text-amber-200 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            title="Tải lại trải nghiệm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <a
            href="/showcases/cosmic-dust/index.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-amber-950 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 font-semibold"
          >
            <span>Mở Tab Toàn Màn Hình</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Full-Bleed Embed */}
      <div className="flex-1 relative w-full h-full bg-[#000000]">
        <iframe
          key={iframeKey}
          src="/showcases/cosmic-dust/index.html"
          title="Cosmic Dust Three.js Scene"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
