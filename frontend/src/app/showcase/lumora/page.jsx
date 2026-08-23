"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize2, ExternalLink, RefreshCw, Layers, Code2, Sparkles } from "lucide-react";

export default function LumoraShowcasePage() {
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Top Bar Controls */}
      <div className="h-14 bg-[#111111] border-b border-white/10 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/showcase"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lab Hub</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <h1 className="text-sm font-semibold text-white tracking-tight">Lumora Studio — Design & Engineering</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey(k => k + 1)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            title="Tải lại trải nghiệm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <a
            href="/showcases/lumora/index.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 transition-all shadow-md shadow-orange-600/20"
          >
            <span>Mở Tab Toàn Màn Hình</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Full-Bleed Embed */}
      <div className="flex-1 relative w-full h-full bg-[#0a0a0a]">
        <iframe
          key={iframeKey}
          src="/showcases/lumora/index.html"
          title="Lumora Studio Experience"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
