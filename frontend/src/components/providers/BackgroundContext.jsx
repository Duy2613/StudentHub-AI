"use client";

import React, { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import UniversalCinematicBackground from "@/components/providers/UniversalCinematicBackground";
import CinematicAmbientDock from "@/components/providers/CinematicAmbientDock";

/**
 * 8 Master Academic Cinematic Films (8.00s @ 24FPS Loops)
 * Academic Cinematic × Editorial Technology × Human Intelligence × Trust
 */
export const ACADEMIC_CINEMA_FILMS = [
  {
    id: "film01_campus_atlas",
    num: "01",
    title: "The Living Campus Atlas",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "35mm Anamorphic Prime",
    cameraMove: "Slow Dolly-Out with Subtle Parallax",
    glowColor: "rgba(82, 138, 185, 0.35)",
    accentColor: "#528ab9",
    mood: "Discovery • Global Learning • Quiet Awe",
    safeZone: "Upper-Left & Center-Left",
    assignedFeature: "Trang Chủ & Cổng Không Gian Tri Thức",
    targetRoutes: ["/", "/academic-showcase", "/c9"],
    mp4: "/videos/academic/film01_campus_atlas.mp4",
    webp: "/videos/academic/film01_campus_atlas.webp",
    poster: "/images/academic/film01_campus_atlas.jpg",
  },
  {
    id: "film02_trust_engine",
    num: "02",
    title: "The Trust Engine",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "50mm T1.5 Macro Cine",
    cameraMove: "Forward Glide & Spatial Layering",
    glowColor: "rgba(56, 189, 218, 0.35)",
    accentColor: "#38bdda",
    mood: "Trust • Verification • Evidence • Precision",
    safeZone: "Right-Third",
    assignedFeature: "Thẩm Định Bằng Chứng & Chống Gian Lận",
    targetRoutes: ["/trust", "/scam-check", "/cases", "/contract-check"],
    mp4: "/videos/academic/film02_trust_engine.mp4",
    webp: "/videos/academic/film02_trust_engine.webp",
    poster: "/images/academic/film02_trust_engine.jpg",
  },
  {
    id: "film03_collective_intelligence",
    num: "03",
    title: "Collective Intelligence",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "40mm Cine Lens",
    cameraMove: "Slow Continuous Forward Travel",
    glowColor: "rgba(99, 102, 241, 0.35)",
    accentColor: "#6366f1",
    mood: "Community • Shared Intelligence • Flocking",
    safeZone: "Center-Left",
    assignedFeature: "Diễn Đàn & Cộng Đồng Chia Sẻ Tri Thức",
    targetRoutes: ["/forum", "/community"],
    mp4: "/videos/academic/film03_collective_intelligence.mp4",
    webp: "/videos/academic/film03_collective_intelligence.webp",
    poster: "/images/academic/film03_collective_intelligence.jpg",
  },
  {
    id: "film04_expert_network",
    num: "04",
    title: "Expert Trust Network",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "65mm Portrait Cine",
    cameraMove: "Slow Lateral Tracking Dolly",
    glowColor: "rgba(232, 176, 85, 0.35)",
    accentColor: "#e8b055",
    mood: "Authority • Mentorship • Scholarship",
    safeZone: "Upper-Right",
    assignedFeature: "Mạng Lưới Chuyên Gia & Đánh Giá Giảng Viên",
    targetRoutes: ["/expert", "/prof-rating"],
    mp4: "/videos/academic/film04_expert_network.mp4",
    webp: "/videos/academic/film04_expert_network.webp",
    poster: "/images/academic/film04_expert_network.jpg",
  },
  {
    id: "film05_question_understanding",
    num: "05",
    title: "From Question to Understanding",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "35mm Spherical",
    cameraMove: "360-Degree Continuous Gentle Orbit",
    glowColor: "rgba(46, 175, 136, 0.35)",
    accentColor: "#2eaf88",
    mood: "Curiosity • Reasoning • Breakthrough",
    safeZone: "Left Half",
    assignedFeature: "Trung Tâm Luyện Tập, Học Tập & Quests",
    targetRoutes: ["/learn", "/practice", "/quests"],
    mp4: "/videos/academic/film05_question_understanding.mp4",
    webp: "/videos/academic/film05_question_understanding.webp",
    poster: "/images/academic/film05_question_understanding.jpg",
  },
  {
    id: "film06_deep_work",
    num: "06",
    title: "Academic Deep Work",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "85mm Macro Cine T1.8",
    cameraMove: "Intimate Surface Glide & Subtle Breeze",
    glowColor: "rgba(232, 176, 85, 0.3)",
    accentColor: "#e8b055",
    mood: "Focus • Discipline • Calm Intelligence",
    safeZone: "Upper Half / Top-Left",
    assignedFeature: "Kế Hoạch Học Tập 4 Năm & Deep Work",
    targetRoutes: ["/academic", "/academic/execution", "/academic/planner", "/academic/profile", "/academic/roadmap", "/roadmap", "/credit-scheduler"],
    mp4: "/videos/academic/film06_deep_work.mp4",
    webp: "/videos/academic/film06_deep_work.webp",
    poster: "/images/academic/film06_deep_work.jpg",
  },
  {
    id: "film07_knowledge_time",
    num: "07",
    title: "Knowledge Through Time",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "28mm Anamorphic Ultra-Wide",
    cameraMove: "Continuous Seamless Strata Track",
    glowColor: "rgba(168, 85, 247, 0.35)",
    accentColor: "#a855f7",
    mood: "Legacy • Civilization • Future Intelligence",
    safeZone: "Generous Upper-Third",
    assignedFeature: "Kho Dữ Liệu Học Thuật & Radar Học Phí",
    targetRoutes: ["/intelligence", "/intelligence/ai-trust", "/intelligence/community", "/intelligence/evidence", "/intelligence/experts", "/intelligence/knowledge", "/intelligence/trust", "/tuition-radar", "/scholarships", "/marketplace", "/safety-map"],
    mp4: "/videos/academic/film07_knowledge_time.mp4",
    webp: "/videos/academic/film07_knowledge_time.webp",
    poster: "/images/academic/film07_knowledge_time.jpg",
  },
  {
    id: "film08_knowledge_horizon",
    num: "08",
    title: "The Knowledge Horizon",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "24mm Architectural Cine",
    cameraMove: "Outward Column Reveal & Horizon Glide",
    glowColor: "rgba(56, 189, 218, 0.35)",
    accentColor: "#38bdda",
    mood: "Ambition • Boundless Progress • Quiet Optimism",
    safeZone: "Vast Open Sky",
    assignedFeature: "Bảng Điều Khiển Cá Nhân (Command Center)",
    targetRoutes: ["/dashboard", "/onboarding", "/profile", "/settings", "/cinema"],
    mp4: "/videos/academic/film08_knowledge_horizon.mp4",
    webp: "/videos/academic/film08_knowledge_horizon.webp",
    poster: "/images/academic/film08_knowledge_horizon.jpg",
  },
];

/**
 * Intelligent Route to Film Context Resolver with Prefix Matching
 */
export function getFilmForPath(pathname) {
  if (!pathname) return ACADEMIC_CINEMA_FILMS[0];

  // 1. Exact match against targetRoutes
  for (const film of ACADEMIC_CINEMA_FILMS) {
    if (film.targetRoutes.includes(pathname)) {
      return film;
    }
  }

  // 2. Prefix matching for feature hierarchies & sidebar tools
  if (
    pathname.startsWith("/trust") ||
    pathname.startsWith("/scam-check") ||
    pathname.startsWith("/contract-check")
  ) {
    return ACADEMIC_CINEMA_FILMS[1]; // Film 02: The Trust Engine
  }
  if (
    pathname.startsWith("/forum") ||
    pathname.startsWith("/community")
  ) {
    return ACADEMIC_CINEMA_FILMS[2]; // Film 03: Collective Intelligence
  }
  if (
    pathname.startsWith("/expert") ||
    pathname.startsWith("/prof-rating")
  ) {
    return ACADEMIC_CINEMA_FILMS[3]; // Film 04: Expert Trust Network
  }
  if (
    pathname.startsWith("/learn") ||
    pathname.startsWith("/practice") ||
    pathname.startsWith("/quests")
  ) {
    return ACADEMIC_CINEMA_FILMS[4]; // Film 05: Question to Understanding
  }
  if (
    pathname.startsWith("/academic") ||
    pathname.startsWith("/roadmap") ||
    pathname.startsWith("/credit-scheduler")
  ) {
    return ACADEMIC_CINEMA_FILMS[5]; // Film 06: Academic Deep Work
  }
  if (
    pathname.startsWith("/cases") ||
    pathname.startsWith("/intelligence") ||
    pathname.startsWith("/tuition-radar") ||
    pathname.startsWith("/scholarships") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/safety-map")
  ) {
    return ACADEMIC_CINEMA_FILMS[6]; // Film 07: Knowledge Through Time (Evidence Case Lab & Intelligence Archive)
  }
  if (
    pathname.startsWith("/projects")
  ) {
    return ACADEMIC_CINEMA_FILMS[0]; // Film 01: The Living Campus Atlas (Projects & Model Atlas)
  }
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/cinema") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings")
  ) {
    return ACADEMIC_CINEMA_FILMS[7]; // Film 08: The Knowledge Horizon
  }

  // Default fallback: Film 01: The Living Campus Atlas
  return ACADEMIC_CINEMA_FILMS[0];
}

// Legacy Wallpaper array preserved for backwards compatibility
export const WALLPAPERS = ACADEMIC_CINEMA_FILMS.map((f) => ({
  id: f.id,
  num: f.num,
  name: f.title,
  src: f.poster,
  tagline: f.mood,
  mood: f.mood,
  glowColor: f.glowColor,
  accentColor: f.accentColor,
  effect: "aurora",
}));

const BackgroundContext = createContext({
  activeFilm: ACADEMIC_CINEMA_FILMS[0],
  setActiveFilm: () => {},
  bgOpacity: 0.65,
  setBgOpacity: () => {},
  isBgPaused: false,
  setIsBgPaused: () => {},
  setScrollySection: () => {},
  isManualOverride: false,
  activeWallpaper: WALLPAPERS[0],
  setActiveWallpaper: () => {},
  activeEffect: "aurora",
  setActiveEffect: () => {},
});

export function BackgroundProvider({ children }) {
  const pathname = usePathname();
  const [manualFilm, setManualFilm] = useState(null);
  const [bgOpacity, setBgOpacity] = useState(0.65);
  const [isBgPaused, setIsBgPaused] = useState(false);

  // Pure Derived State: Resolves active film automatically for current dashboard/feature
  const defaultFilm = getFilmForPath(pathname);
  const activeFilm = manualFilm || defaultFilm;

  const setActiveFilm = (film) => {
    setManualFilm(film);
  };

  const setScrollySection = (filmIdOrSection) => {
    if (manualFilm) return;
    const found = ACADEMIC_CINEMA_FILMS.find(
      (f) => f.id === filmIdOrSection || f.num === filmIdOrSection
    );
    if (found) {
      setManualFilm(found);
    }
  };

  return (
    <BackgroundContext.Provider
      value={{
        activeFilm,
        setActiveFilm,
        bgOpacity,
        setBgOpacity,
        isBgPaused,
        setIsBgPaused,
        setScrollySection,
        isManualOverride: manualFilm !== null,
        activeWallpaper: activeFilm,
        setActiveWallpaper: setActiveFilm,
        activeEffect: "aurora",
        setActiveEffect: () => {},
      }}
    >
      {/* 1. Universal Fullscreen Cinematic Video Background (z-0) */}
      <UniversalCinematicBackground />

      {/* 2. Floating Ambient Controller Dock (Bottom Right, z-40) */}
      <CinematicAmbientDock />

      {/* 3. Page Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </BackgroundContext.Provider>
  );
}

export const useBackground = () => useContext(BackgroundContext);
