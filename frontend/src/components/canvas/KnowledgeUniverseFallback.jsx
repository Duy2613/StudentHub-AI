"use client";

import React from "react";
import { KNOWLEDGE_DOMAINS, KNOWLEDGE_RELATIONS } from "./knowledgeUniverseData";

function handleNodeKeyDown(event, nodeId, onSelectNode) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onSelectNode(nodeId);
  }
}

/**
 * Intentional, lightweight first paint for the knowledge universe. It keeps
 * the semantic graph visible while the optional Three.js enhancement waits
 * for idle time or viewport demand.
 */
export default function KnowledgeUniverseFallback({
  activeNodeId = null,
  onSelectNode = () => {},
  className = "",
}) {
  return (
    <div
      role="region"
      aria-label="Không gian tri thức liên kết (Knowledge Universe)"
      className={`relative w-full h-full min-h-[420px] lg:min-h-[560px] flex items-center justify-center overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-80 h-80 lg:w-[460px] lg:h-[460px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute w-60 h-60 lg:w-80 lg:h-80 rounded-full bg-cyan-500/10 blur-2xl" />
        <svg
          className="w-full h-full max-w-[580px] max-h-[520px] p-6"
          viewBox="-3 -2.5 6 5"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Sơ đồ quan hệ các lĩnh vực tri thức"
        >
          {KNOWLEDGE_RELATIONS.map(([fromId, toId], index) => {
            const from = KNOWLEDGE_DOMAINS.find((item) => item.id === fromId);
            const to = KNOWLEDGE_DOMAINS.find((item) => item.id === toId);
            if (!from || !to) return null;
            const highlighted = from.id === activeNodeId || to.id === activeNodeId;
            return (
              <line
                key={`edge-${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={highlighted ? "#65D8FF" : "rgba(117, 107, 255, 0.28)"}
                strokeWidth={highlighted ? "0.04" : "0.02"}
                strokeDasharray={highlighted ? "none" : "0.05, 0.05"}
              />
            );
          })}
          {KNOWLEDGE_DOMAINS.map((domain) => {
            const selected = domain.id === activeNodeId;
            return (
              <g
                key={domain.id}
                role="button"
                tabIndex={0}
                aria-label={`${domain.label} (${domain.domain})`}
                className="pointer-events-auto cursor-pointer outline-none"
                onClick={() => onSelectNode(domain.id)}
                onKeyDown={(event) => handleNodeKeyDown(event, domain.id, onSelectNode)}
              >
                <circle cx={domain.x} cy={domain.y} r={selected ? 0.32 : 0.22} fill={domain.color} fillOpacity={selected ? 0.3 : 0.12} />
                <circle cx={domain.x} cy={domain.y} r={selected ? 0.14 : 0.1} fill={domain.color} stroke="#070A12" strokeWidth="0.03" />
                <text x={domain.x} y={domain.y + 0.32} textAnchor="middle" fill="#F6F7FB" fontSize="0.14" fontWeight={selected ? "600" : "500"} className="select-none drop-shadow-md">
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
