/**
 * IglooAuroraDivider — Igloo.inc signature aurora beam section separator.
 *
 * A thin horizontal line with a sweeping iridescent aurora glow that traverses
 * left-to-right continuously, inspired by igloo.inc's arctic/iridescent palette.
 * Zero layout impact — purely decorative, pointer-events-none.
 *
 * Palette: indigo → purple → cyan → teal (igloo arctic cold spectrum)
 */

"use client";

import React from "react";

export default function IglooAuroraDivider({ className = "", intensity = "normal" }) {
  const opacities = {
    subtle: { line: 0.06, beam: 0.5, halo: 0.15 },
    normal: { line: 0.1, beam: 0.7, halo: 0.25 },
    vivid: { line: 0.15, beam: 1, halo: 0.4 },
  };
  const o = opacities[intensity] ?? opacities.normal;

  return (
    <div
      aria-hidden="true"
      className={`relative w-full h-[1px] overflow-hidden pointer-events-none select-none ${className}`}
      style={{ isolation: "isolate" }}
    >
      {/* Base hairline */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(99,102,241,${o.line}) 20%,
            rgba(168,85,247,${o.line}) 40%,
            rgba(6,182,212,${o.line}) 60%,
            rgba(52,231,196,${o.line}) 80%,
            transparent 100%
          )`,
        }}
      />

      {/* Sweeping aurora beam */}
      <div
        className="absolute inset-0 igloo-aurora-sweep"
        style={{
          background: `linear-gradient(90deg,
            transparent 0%,
            transparent 30%,
            rgba(99,102,241,${o.beam}) 40%,
            rgba(168,85,247,${o.beam}) 48%,
            rgba(6,182,212,${o.beam}) 54%,
            rgba(52,231,196,${o.beam}) 60%,
            transparent 70%,
            transparent 100%
          )`,
          width: "200%",
        }}
      />

      {/* Vertical halo bloom (top/bottom glow spread) */}
      <div
        className="absolute left-0 right-0 igloo-aurora-sweep"
        style={{
          top: "-3px",
          height: "7px",
          background: `linear-gradient(90deg,
            transparent 0%,
            transparent 30%,
            rgba(168,85,247,${o.halo}) 42%,
            rgba(6,182,212,${o.halo * 1.2}) 54%,
            rgba(52,231,196,${o.halo}) 62%,
            transparent 70%,
            transparent 100%
          )`,
          width: "200%",
          filter: "blur(3px)",
        }}
      />
    </div>
  );
}
