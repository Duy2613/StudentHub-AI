"use client";

// frontend/src/components/ui/SaffronSwissCrosshairGrid.jsx
//
// Saffron Finance Swiss Architectural Grid & Crosshair Junctions (+)
// - Renders subtle corner crosshairs and hairline frame boundaries for landing sections

import React from "react";

export default function SaffronSwissCrosshairGrid({
  children,
  sectionTag = "01 // SECTION",
  className = "",
}) {
  return (
    <div className={`relative border border-[#47140b]/50 rounded-3xl p-6 sm:p-10 my-8 bg-[#150604]/60 backdrop-blur-md overflow-hidden ${className}`}>
      {/* 4 Corner Crosshair Markers (+) */}
      <span className="absolute top-2.5 left-3 text-[#ffbc09]/60 font-mono text-xs select-none">+</span>
      <span className="absolute top-2.5 right-3 text-[#ffbc09]/60 font-mono text-xs select-none">+</span>
      <span className="absolute bottom-2.5 left-3 text-[#ffbc09]/60 font-mono text-xs select-none">+</span>
      <span className="absolute bottom-2.5 right-3 text-[#ffbc09]/60 font-mono text-xs select-none">+</span>

      {/* Top Hairline Tag */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-b-lg bg-[#210a07] border-x border-b border-[#47140b] text-[10px] font-mono text-[#ffbc09] tracking-widest uppercase select-none">
        [ {sectionTag} ]
      </div>

      {children}
    </div>
  );
}
