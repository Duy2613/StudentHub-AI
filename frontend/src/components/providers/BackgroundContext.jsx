"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export const WALLPAPERS = [
  {
    id: "portal",
    num: "01",
    name: "AI Knowledge Portal",
    src: "/wallpapers/01-ai-knowledge-portal.jpg",
    tagline: "Cosmic & Academic Synthesis",
    mood: "Mystic & Inspiring",
    glowColor: "rgba(99, 102, 241, 0.4)",
    accentColor: "#818cf8",
    sectionId: "hero",
    effect: "aurora",
  },
  {
    id: "campus",
    num: "02",
    name: "Smart Campus Future",
    src: "/wallpapers/02-smart-campus-future.jpg",
    tagline: "Modern Architectural Dawn",
    mood: "Optimistic & Grand",
    glowColor: "rgba(52, 231, 196, 0.4)",
    accentColor: "#34e7c4",
    sectionId: "features",
    effect: "glassmorphism",
  },
  {
    id: "study",
    num: "03",
    name: "AI Study Room",
    src: "/wallpapers/03-ai-study-room.jpg",
    tagline: "Night Rain & Warm Lamp",
    mood: "Focused & Intimate",
    glowColor: "rgba(245, 158, 11, 0.35)",
    accentColor: "#f59e0b",
    sectionId: "demo",
    effect: "lightsweep",
  },
  {
    id: "network",
    num: "04",
    name: "Neural Network",
    src: "/wallpapers/04-neural-network.jpg",
    tagline: "Mathematical Knowledge Graph",
    mood: "Precise & Intelligent",
    glowColor: "rgba(6, 182, 212, 0.4)",
    accentColor: "#06b6d4",
    sectionId: "engine",
    effect: "blob",
  },
  {
    id: "dataflow",
    num: "05",
    name: "Data Flow",
    src: "/wallpapers/05-data-flow.jpg",
    tagline: "Ethereal Particle Waves",
    mood: "Dynamic & Fluid",
    glowColor: "rgba(168, 85, 247, 0.4)",
    accentColor: "#a855f7",
    sectionId: "community",
    effect: "particles",
  },
  {
    id: "focus",
    num: "06",
    name: "Focus Mode",
    src: "/wallpapers/06-focus-mode.jpg",
    tagline: "Sunset Dusk Study Space",
    mood: "Calm & Reflective",
    glowColor: "rgba(244, 63, 94, 0.35)",
    accentColor: "#f43f5e",
    sectionId: "cta",
    effect: "orbs",
  },
];

const ROUTE_WALLPAPERS = {
  "/scam-check": "network",
  "/forum": "dataflow",
  "/dashboard": "campus",
  "/profile": "study",
  "/onboarding": "portal",
  "/login": "focus",
  "/register": "focus",
};

const BackgroundContext = createContext({
  activeWallpaper: WALLPAPERS[0],
  setActiveWallpaper: () => {},
  activeEffect: "aurora",
  setActiveEffect: () => {},
  setScrollySection: () => {},
  isManualOverride: false,
  isStudioOpen: false,
  setIsStudioOpen: () => {},
});

export function BackgroundProvider({ children }) {
  const pathname = usePathname();
  const [activeWallpaper, setActiveWallpaper] = useState(WALLPAPERS[0]);
  const [activeEffect, setActiveEffect] = useState("aurora");
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);

  // Auto assign wallpaper based on current route
  useEffect(() => {
    if (!isManualOverride) {
      if (pathname === "/") {
        // Landing page starts with portal
        setActiveWallpaper(WALLPAPERS[0]);
        setActiveEffect("aurora");
      } else if (ROUTE_WALLPAPERS[pathname]) {
        const targetId = ROUTE_WALLPAPERS[pathname];
        const found = WALLPAPERS.find((w) => w.id === targetId);
        if (found) {
          setActiveWallpaper(found);
          setActiveEffect(found.effect);
        }
      }
    }
  }, [pathname, isManualOverride]);

  // Set wallpaper via scroll triggers with morph pulse
  const setScrollySection = (wallpaperId) => {
    if (isManualOverride) return;
    const found = WALLPAPERS.find((w) => w.id === wallpaperId);
    if (found && found.id !== activeWallpaper.id) {
      setIsMorphing(true);
      setActiveWallpaper(found);
      setActiveEffect(found.effect);
      setTimeout(() => setIsMorphing(false), 900);
    }
  };

  const manualSetWallpaper = (wp) => {
    setIsManualOverride(true);
    setIsMorphing(true);
    setActiveWallpaper(wp);
    setActiveEffect(wp.effect);
    setTimeout(() => setIsMorphing(false), 900);
  };

  return (
    <BackgroundContext.Provider
      value={{
        activeWallpaper,
        setActiveWallpaper: manualSetWallpaper,
        activeEffect,
        setActiveEffect,
        setScrollySection,
        isManualOverride,
        isStudioOpen,
        setIsStudioOpen,
      }}
    >
      {/* Fixed Fullscreen Background Crossfader with Vibrant Visibility & Cinematic Morph */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {WALLPAPERS.map((wp) => {
          const isCurrent = activeWallpaper.id === wp.id;
          return (
            <div
              key={wp.id}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
                isCurrent
                  ? "opacity-65 sm:opacity-75 scale-100 filter blur-0"
                  : "opacity-0 scale-105 filter blur-sm"
              }`}
              style={{
                backgroundImage: `url(${wp.src})`,
              }}
            />
          );
        })}

        {/* Morph Shockwave Pulse on Scene Switch */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            isMorphing ? "opacity-40" : "opacity-0"
          }`}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${activeWallpaper.glowColor}, transparent 60%)`,
          }}
        />

        {/* Dynamic Atmospheric Radial Light Glow matching active wallpaper */}
        <div
          className="absolute inset-0 transition-colors duration-1000 ease-in-out pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${activeWallpaper.glowColor}, transparent 70%)`,
          }}
        />

        {/* Subtle Dark Vignette & Legibility Veil (Preserves image beauty while keeping text crystal clear) */}
        <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/60 to-space-950/40" />
        <div className="absolute inset-0 bg-radial from-transparent via-space-950/20 to-space-950/85" />
      </div>

      {children}
    </BackgroundContext.Provider>
  );
}

export const useBackground = () => useContext(BackgroundContext);
