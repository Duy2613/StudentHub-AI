"use client";

import React, { useState } from "react";
import { useReducedMotionState } from "./ReducedMotionBoundary";

export interface AtlasDomain {
  id: string;
  name: string;
  category: string;
  verifiedCount?: number;
}

const DEFAULT_DOMAINS: AtlasDomain[] = [
  { id: "tech", name: "Quy chế đào tạo & Học vụ", category: "Học vụ" },
  { id: "law", name: "Chính sách học bổng & Miễn giảm", category: "Tài chính" },
  { id: "econ", name: "Điều kiện tốt nghiệp & Chứng chỉ chuẩn đầu ra", category: "Chuẩn đầu ra" },
  { id: "med", name: "Bảo lưu & Chuyển ngành chuyển trường", category: "Thủ tục" },
  { id: "env", name: "Đăng ký tín chỉ & Kế hoạch học tập", category: "Kế hoạch" },
];

export function KnowledgeAtlas({ domains = DEFAULT_DOMAINS }: { domains?: AtlasDomain[] }) {
  const [selected, setSelected] = useState<AtlasDomain>(domains[0]);
  const reducedMotion = useReducedMotionState();

  return (
    <div className="km-knowledge-glass p-6 rounded-2xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* 2.5D Constellation SVG */}
        <div className="relative w-64 h-64 flex items-center justify-center bg-slate-950/80 rounded-xl border border-slate-800">
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
            {/* Center Knowledge Prism Sun */}
            <circle cx="100" cy="100" r="16" fill="url(#sunGrad)" />
            <defs>
              <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </radialGradient>
            </defs>

            {/* Orbit paths */}
            <circle cx="100" cy="100" r="45" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="4 4" />

            {/* Constellation lines */}
            <line x1="100" y1="100" x2="135" y2="70" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
            <line x1="100" y1="100" x2="60" y2="130" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
            <line x1="100" y1="100" x2="150" y2="140" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />

            {/* Orbiting nodes */}
            <circle
              cx="135"
              cy="70"
              r="7"
              fill="#38bdf8"
              className={reducedMotion ? "" : "animate-pulse"}
            />
            <circle cx="60" cy="130" r="6" fill="#a855f7" />
            <circle cx="150" cy="140" r="5" fill="#34d399" />
          </svg>
        </div>

        {/* Semantic Topic Selector & Fallback List */}
        <div className="flex-1 w-full">
          <h4 className="text-xs font-mono uppercase tracking-wider text-sky-400 mb-2">
            Bản đồ Chòm sao Tri thức (2.5D SVG)
          </h4>
          <ul className="space-y-2" role="list" aria-label="Danh sách lĩnh vực chòm sao tri thức">
            {domains.map((dom) => {
              const isSel = dom.id === selected.id;
              return (
                <li key={dom.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(dom)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors flex items-center justify-between text-xs ${
                      isSel
                        ? "bg-sky-500/10 border-sky-500 text-sky-200 font-medium"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{dom.name}</span>
                    <span className="font-mono text-[11px] text-slate-300">
                      {dom.category}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeAtlas;
