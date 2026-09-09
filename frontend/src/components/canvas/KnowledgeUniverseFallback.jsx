"use client";

import React from "react";
import { OBSERVATORY_LAYERS, OBSERVATORY_RELATIONS } from "./knowledgeUniverseData";

function handleNodeKeyDown(event, nodeId, onSelectNode) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onSelectNode(nodeId);
  }
}

/**
 * KnowledgeUniverseFallback: Canonical Static Knowledge Observatory
 * StudentHub Visual System VNext — "Khai Minh"
 * - High-contrast editorial SVG presentation
 * - Calm, stable relationship geometry without flickering or layout shift
 * - Full WCAG keyboard traversal & screen-reader aria metadata
 */
export default function KnowledgeUniverseFallback({
  activeNodeId = "van-ban-phap-quy",
  onSelectNode = () => {},
  className = "",
}) {
  return (
    <div
      role="region"
      aria-label="Knowledge Observatory — Không gian hội tụ nguồn thông tin học thuật"
      className={`relative w-full h-full min-h-[420px] lg:min-h-[560px] flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Subtle Khai Minh Ambient Radial Aura */}
        <div className="absolute w-80 h-80 lg:w-[460px] lg:h-[460px] rounded-full bg-[#7BE0B2]/[0.06] blur-3xl" />
        <div className="absolute w-60 h-60 lg:w-80 lg:h-80 rounded-full bg-[#8EC5FF]/[0.05] blur-2xl" />

        <svg
          className="w-full h-full max-w-[580px] max-h-[520px] p-6"
          viewBox="-3 -2.5 6 5"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Sơ đồ quan hệ các tầng thông tin học thuật"
        >
          {/* Concentric Calibration Orbits (Observatory Grid) */}
          <circle cx="0" cy="0" r="1.4" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="0.04, 0.08" strokeWidth="0.015" />
          <circle cx="0" cy="0" r="2.2" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="0.04, 0.08" strokeWidth="0.015" />

          {/* Converging Relationship Lines */}
          {OBSERVATORY_RELATIONS.map(([fromId, toId], index) => {
            const from = OBSERVATORY_LAYERS.find((item) => item.id === fromId);
            const to = OBSERVATORY_LAYERS.find((item) => item.id === toId);
            if (!from || !to) return null;
            const highlighted = from.id === activeNodeId || to.id === activeNodeId;
            return (
              <line
                key={`edge-${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={highlighted ? "#7BE0B2" : "rgba(123, 224, 178, 0.18)"}
                strokeWidth={highlighted ? "0.035" : "0.018"}
                strokeDasharray={highlighted ? "none" : "0.06, 0.06"}
              />
            );
          })}

          {/* Information Layer Nodes */}
          {OBSERVATORY_LAYERS.map((domain) => {
            const selected = domain.id === activeNodeId;
            return (
              <g
                key={domain.id}
                role="button"
                tabIndex={0}
                aria-label={`${domain.label} — ${domain.domain}`}
                className="pointer-events-auto cursor-pointer outline-none transition-transform"
                onClick={() => onSelectNode(domain.id)}
                onKeyDown={(event) => handleNodeKeyDown(event, domain.id, onSelectNode)}
              >
                {/* Outer halo */}
                <circle
                  cx={domain.x}
                  cy={domain.y}
                  r={selected ? 0.32 : 0.2}
                  fill={domain.color}
                  fillOpacity={selected ? 0.28 : 0.08}
                />
                {/* Inner solid node */}
                <circle
                  cx={domain.x}
                  cy={domain.y}
                  r={selected ? 0.13 : 0.09}
                  fill={domain.color}
                  stroke="#08110F"
                  strokeWidth="0.03"
                />
                {/* Node Label (High-contrast Khai Minh Primary Text) */}
                <text
                  x={domain.x}
                  y={domain.y + 0.32}
                  textAnchor="middle"
                  fill="#F4F0E6"
                  fontSize="0.135"
                  fontWeight={selected ? "600" : "500"}
                  className="select-none drop-shadow-md"
                  style={{ fontFamily: "var(--font-be-vietnam-pro), system-ui, sans-serif" }}
                >
                  {domain.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
