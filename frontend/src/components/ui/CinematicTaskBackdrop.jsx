"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ACADEMIC_CINEMA_FILMS } from "@/components/providers/BackgroundContext";

/**
 * CinematicTaskBackdrop: Ambient 3D Animated Video Texture for Individual Cards, Tasks & Tools
 * - Renders dedicated looping 3D animation (WebP/MP4) with glassmorphism blending
 * - Subdued ambient mode (opacity-20 to opacity-30) that blooms gracefully on hover
 * - Zero impact on WCAG AAA text contrast
 * - Hardware accelerated with CSS GPU transforms
 */
export default function CinematicTaskBackdrop({
  filmId = "film02_trust_engine",
  filmIndex = null,
  opacity = 0.28,
  hoverOpacity = 0.52,
  blur = "blur-[1.5px]",
  rounded = "rounded-2xl",
  className = "",
  showBadge = false,
  badgeText = null,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  // These textures are decorative card chrome. Delay their network and decode
  // work until the primary task UI has had time to paint, especially on the
  // Trust route where several cards sit in the initial viewport.
  useEffect(() => {
    const timer = window.setTimeout(() => setMediaReady(true), 4_000);
    return () => window.clearTimeout(timer);
  }, []);

  const film = filmIndex !== null && filmIndex >= 0 && filmIndex < ACADEMIC_CINEMA_FILMS.length
    ? ACADEMIC_CINEMA_FILMS[filmIndex]
    : ACADEMIC_CINEMA_FILMS.find((f) => f.id === filmId) || ACADEMIC_CINEMA_FILMS[1];

  if (!film) return null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`absolute inset-0 overflow-hidden pointer-events-none transition-all duration-700 ease-out select-none ${rounded} ${className}`}
      style={{
        opacity: isHovered ? hoverOpacity : opacity,
      }}
      aria-hidden="true"
    >
      {/* 3D Animation Video WebP Frame */}
      <div className={`relative w-full h-full scale-110 transition-transform duration-1000 ease-out ${blur} ${isHovered ? "scale-105" : "scale-115"}`}>
        {mediaReady && (
          <Image
            src={film.webp}
            alt=""
            fill
            unoptimized
            loading="lazy"
            fetchPriority="low"
            className="object-cover object-center"
          />
        )}
      </div>

      {/* Multi-Tier Architectural Tint for 100% WCAG AAA Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#060813]/92 via-[#060813]/65 to-[#060813]/40" />
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${film.glowColor || "rgba(56, 189, 218, 0.2)"}, transparent 70%)`,
          opacity: isHovered ? 0.45 : 0.25,
        }}
      />

      {/* Optional Editorial Micro-Badge */}
      {showBadge && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider bg-black/60 border border-white/10 text-white/80 backdrop-blur-md z-10">
          {badgeText || `${film.num} · ${film.title}`}
        </div>
      )}
    </div>
  );
}
