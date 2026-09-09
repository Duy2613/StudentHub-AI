"use client";

import React, { useState } from "react";
import { 
  ExternalLink, 
  Lock, 
  Radio, 
} from "lucide-react";

export default function EvidenceConstellationStage({
  claims = [],
  sources = [],
  onSelectSource,
}) {
  const [viewMode, setViewMode] = useState("constellation"); // 'constellation' | 'list'

  const displayClaims = Array.isArray(claims) ? claims : [];
  const displaySources = Array.isArray(sources) ? sources : [];

  if (!displayClaims.length && !displaySources.length) {
    return <div className="w-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden my-6">
      <div className="flex items-center gap-2.5 p-4 border-b border-white/10 bg-white/[0.02]">
        <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400"><Radio size={16} /></span>
        <div><span className="type-micro-label-v3 text-cyan-400 block">EVIDENCE CONSTELLATION & RELATIONAL MAP</span><span className="text-xs text-slate-300 font-medium">Không gian liên kết mệnh đề và bằng chứng đối soát</span></div>
      </div>
      <div className="p-6 empty-state">Trust Engine chưa công bố claim hoặc evidence record cho lần phân tích này. StudentHub không dựng dữ liệu minh họa thay thế.</div>
    </div>;
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden my-6">
      {/* Stage Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Radio size={16} className="animate-pulse" />
          </span>
          <div>
            <span className="type-micro-label-v3 text-cyan-400 block">
              EVIDENCE CONSTELLATION & RELATIONAL MAP
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Không gian liên kết mệnh đề và bằng chứng đối soát
            </span>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("constellation")}
            className={`px-3 py-1 rounded-lg transition-all ${viewMode === "constellation" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold" : "text-slate-400 hover:text-white"}`}
          >
            Sơ đồ liên kết
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded-lg transition-all ${viewMode === "list" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold" : "text-slate-400 hover:text-white"}`}
          >
            Danh sách đối chiếu
          </button>
        </div>
      </div>

      {/* Constellation Canvas View */}
      {viewMode === "constellation" ? (
        <div className="relative min-h-[380px] p-6 flex flex-col justify-between overflow-hidden">
          {/* Background Ambient Grid */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: "radial-gradient(rgba(56, 189, 248, 0.25) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Top Layer: Claims Row */}
          <div className="relative z-10 space-y-2 mb-6">
            <span className="type-micro-label-v3 text-slate-400 block">
              CÁC MỆNH ĐỀ ĐÃ TÁCH TỪ NỘI DUNG (CLAIMS):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayClaims.map((claim, idx) => {
                const status = String(claim.status || "UNKNOWN").toUpperCase();
                const isConflict = status.includes("CONTRAD");
                const statusLabel = isConflict ? "PHÁT HIỆN MÂU THUẪN" : ["VERIFIED", "SUPPORTED", "SUPPORTING", "CONFIRMED"].includes(status) ? "ĐƯỢC HỖ TRỢ" : "CHƯA KẾT LUẬN";
                return <div
                  key={claim.id}
                  className={`p-3.5 rounded-xl border transition-all ${isConflict ? "border-rose-500/40 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]" : "border-white/10 bg-white/[0.02]"}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="type-micro-label-v3 font-mono text-cyan-300">
                      MỆNH ĐỀ #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isConflict ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-white/5 text-slate-300 border border-white/10"}`}>
                      {statusLabel}
                    </span>
                  </div>
                    <p className="text-xs font-medium text-slate-200">
                    &ldquo;{claim.text}&rdquo;
                  </p>
                </div>;
              })}
            </div>
          </div>

          {/* Dynamic Relational Tension Center */}
          <div className="relative z-10 py-3 flex items-center justify-center">
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Tương hỗ (Corroboration)
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" /> Mâu thuẫn thời hạn (Conflict)
              </span>
            </div>
          </div>

          {/* Bottom Layer: Evidence Sources Orbit */}
          <div className="relative z-10 space-y-2 mt-4">
            <span className="type-micro-label-v3 text-slate-400 block">
              NGUỒN BẰNG CHỨNG THỰC TẾ (CLICK ĐỂ MỞ BẢNG KIỂM TRA):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {displaySources.map((source) => {
                const isConflict = String(source.relationship || "").toLowerCase().includes("contradict");
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => onSelectSource?.(source)}
                    className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer group ${isConflict ? "border-rose-500/30 bg-rose-950/10 hover:border-rose-400" : "border-cyan-500/30 bg-cyan-950/10 hover:border-cyan-400"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
                        <Lock size={10} /> {source.domain || "domain chưa công bố"}
                      </span>
                      <ExternalLink size={12} className="text-slate-500 group-hover:text-cyan-300 transition-colors" />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 group-hover:text-white line-clamp-1 mb-1">
                      {source.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic mb-2">
                      &ldquo;{source.snippet || "Không có đoạn trích được công bố."}&rdquo;
                    </p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">{source.publishedAt}</span>
                      <span className={`font-semibold ${isConflict ? "text-rose-400" : "text-slate-300"}`}>
                        {isConflict ? "Mâu thuẫn" : String(source.relationship || "context").replaceAll("_", " ")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Semantic List Fallback */
        <div className="p-6 divide-y divide-white/5 constellation-accessible-fallback">
          {displaySources.map((source, index) => (
            <article key={source.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="type-micro-label-v3 font-mono text-cyan-400">
                      [{index + 1}] {source.publisher}
                    </span>
                    {source.domain && <span className="text-xs text-slate-400">• {source.domain}</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${String(source.relationship || "").toLowerCase().includes("contradict") ? "bg-rose-500/20 text-rose-300" : "bg-white/5 text-slate-300"}`}>
                      {String(source.relationship || "context").replaceAll("_", " ")}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 mb-1">
                    {source.title}
                  </h4>
                  <p className="text-xs text-slate-300 italic mb-2">
                    &ldquo;{source.snippet || "Không có đoạn trích được công bố."}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Ban hành: {source.publishedAt}</span>
                    <span>Thu thập: {source.retrievedAt}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectSource?.(source)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium inline-flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Chi tiết</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
