"use client";

import React, { useRef, useState } from "react";

/**
 * HobroTiltCard
 * Inspired by hobro.digital & overworldaudio.com
 * Interactive 3D tilt card with specular spotlight tracking and brutalist corner crosshairs.
 */
export default function HobroTiltCard({
  children,
  className = "",
  spotlightColor = "rgba(16, 185, 129, 0.15)",
  maxTilt = 8,
  cursorText = "",
  onClick,
}) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [spotlightPos, setSpotlightPos] = useState({ x: -200, y: -200, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentage (-1 to +1)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    setRotateX(-normY * maxTilt);
    setRotateY(normX * maxTilt);
    setSpotlightPos({ x, y, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setSpotlightPos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      data-cursor={cursorText}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: rotateX === 0 && rotateY === 0 ? "transform 0.5s ease-out" : "none",
      }}
      className={`relative group rounded-2xl border border-white/10 bg-space-900/80 backdrop-blur-xl overflow-hidden transition-colors hover:border-emerald-500/40 ${className}`}
    >
      {/* Precision Brutalist Corner Crosshairs (+) */}
      <span className="absolute top-1.5 left-1.5 text-[10px] font-mono text-white/20 select-none pointer-events-none group-hover:text-emerald-400/60 transition-colors">
        +
      </span>
      <span className="absolute top-1.5 right-1.5 text-[10px] font-mono text-white/20 select-none pointer-events-none group-hover:text-emerald-400/60 transition-colors">
        +
      </span>
      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-mono text-white/20 select-none pointer-events-none group-hover:text-emerald-400/60 transition-colors">
        +
      </span>
      <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono text-white/20 select-none pointer-events-none group-hover:text-emerald-400/60 transition-colors">
        +
      </span>

      {/* Dynamic Specular Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: spotlightPos.opacity,
          background: `radial-gradient(450px circle at ${spotlightPos.x}px ${spotlightPos.y}px, ${spotlightColor}, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
