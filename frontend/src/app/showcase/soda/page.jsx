"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

export default function SodaShowcasePage() {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#011411] text-white overflow-hidden">
      {/* Top Bar Controls */}
      <div className="h-14 bg-[#04291f]/80 border-b border-emerald-500/20 px-4 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/showcase"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lab Hub</span>
          </Link>
          <div className="h-4 w-px bg-emerald-500/20" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-semibold text-emerald-100 tracking-tight">Soda — Pure Zero 3D Interactive Landing</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey(k => k + 1)}
            className="flex items-center gap-1.5 text-xs text-emerald-200 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            title="Tải lại trải nghiệm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <a
            href="/showcases/soda/index.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-950 px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md shadow-emerald-400/20 font-semibold"
          >
            <span>Mở Tab Toàn Màn Hình</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Full-Bleed Embed */}
      <div className="flex-1 relative w-full h-full bg-[#011411]">
        <iframe
          key={iframeKey}
          src="/showcases/soda/index.html"
          title="Soda 3D Beverage Landing"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
