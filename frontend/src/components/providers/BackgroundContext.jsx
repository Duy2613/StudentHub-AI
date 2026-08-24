"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export const WALLPAPERS = [
  {
    id: "portal",
    num: "01",
    name: "AI Knowledge Portal",
    src: "/wallpapers/01-ai-knowledge-portal.jpg",
    tagline: "Cosmic & Academic Synthesis",
    mood: "Mystic & Inspiring",
  },
  {
    id: "campus",
    num: "02",
    name: "Smart Campus Future",
    src: "/wallpapers/02-smart-campus-future.jpg",
    tagline: "Modern Architectural Dawn",
    mood: "Optimistic & Grand",
  },
  {
    id: "study",
    num: "03",
    name: "AI Study Room",
    src: "/wallpapers/03-ai-study-room.jpg",
    tagline: "Night Rain & Warm Lamp",
    mood: "Focused & Intimate",
  },
  {
    id: "network",
    num: "04",
    name: "Neural Network",
    src: "/wallpapers/04-neural-network.jpg",
    tagline: "Mathematical Knowledge Graph",
    mood: "Precise & Intelligent",
  },
  {
    id: "dataflow",
    num: "05",
    name: "Data Flow",
    src: "/wallpapers/05-data-flow.jpg",
    tagline: "Ethereal Particle Waves",
    mood: "Dynamic & Fluid",
  },
  {
    id: "focus",
    num: "06",
    name: "Focus Mode",
    src: "/wallpapers/06-focus-mode.jpg",
    tagline: "Sunset Dusk Study Space",
    mood: "Calm & Reflective",
  },
];

const BackgroundContext = createContext({
  activeWallpaper: WALLPAPERS[1], // Default: Smart Campus Future
  setActiveWallpaper: () => {},
  isStudioOpen: false,
  setIsStudioOpen: () => {},
  activeEffect: null,
  setActiveEffect: () => {},
});

export function BackgroundProvider({ children }) {
  const [activeWallpaper, setActiveWallpaper] = useState(WALLPAPERS[1]);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [activeEffect, setActiveEffect] = useState("aurora");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("studenthub_active_wallpaper");
      if (saved) {
        const found = WALLPAPERS.find((w) => w.id === saved);
        if (found) setActiveWallpaper(found);
      }
    }
  }, []);

  const changeWallpaper = (wallpaper) => {
    setActiveWallpaper(wallpaper);
    if (typeof window !== "undefined") {
      localStorage.setItem("studenthub_active_wallpaper", wallpaper.id);
    }
  };

  return (
    <BackgroundContext.Provider
      value={{
        activeWallpaper,
        setActiveWallpaper: changeWallpaper,
        isStudioOpen,
        setIsStudioOpen,
        activeEffect,
        setActiveEffect,
      }}
    >
      {/* Global Background Layer with Smooth Fade Transition */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {WALLPAPERS.map((wp) => (
          <div
            key={wp.id}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              activeWallpaper.id === wp.id ? "opacity-25 scale-100" : "opacity-0 scale-105"
            }`}
            style={{
              backgroundImage: `url(${wp.src})`,
              transitionProperty: "opacity, transform",
            }}
          />
        ))}

        {/* Cinematic Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/80 to-space-950/50" />
        <div className="absolute inset-0 bg-radial from-transparent via-space-950/40 to-space-950/90" />
      </div>

      {children}
    </BackgroundContext.Provider>
  );
}

export const useBackground = () => useContext(BackgroundContext);
