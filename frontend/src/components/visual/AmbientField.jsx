"use client";

import React from "react";

/**
 * AmbientField: High-performance architectural lighting background.
 * Uses zero JavaScript requestAnimationFrame loops or heavy GPU filters on mobile.
 */
export function AmbientField({
  variant = "mint", // "mint" | "institutional" | "amber" | "rose"
  grid = true,
  className = "",
}) {
  const tint = {
    mint: "from-[#79d8bd]/10 to-transparent",
    institutional: "from-[#6ea8fe]/08 to-transparent",
    amber: "from-[#e8b45a]/08 to-transparent",
    rose: "from-[#f27d8d]/08 to-transparent",
  }[variant] || "from-[#79d8bd]/10 to-transparent";

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none -z-10 ${className}`}
      aria-hidden="true"
    >
      <div
        className={`absolute -top-[15%] left-1/2 -translate-x-1/2 w-[65vw] h-[45vh] rounded-full bg-gradient-to-b ${tint} blur-[120px]`}
      />
      {grid && (
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(241, 238, 230, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(241, 238, 230, 0.4) 1px, transparent 1px)",
            backgroundSize: "4rem 4rem",
          }}
        />
      )}
    </div>
  );
}

export default AmbientField;
