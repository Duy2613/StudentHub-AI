"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import UniversalCinematicBackground from "@/components/providers/UniversalCinematicBackground";
import ReferenceAtmosphere from "@/components/providers/ReferenceAtmosphere";
import {
  getMediaAsset,
  getRouteMediaAsset,
  getRouteMediaPolicy,
  VERIFIED_MEDIA_POLICY,
} from "@/lib/media/vnextMediaRegistry";

/* Compatibility view for legacy cinema controls. Every media path below is
 * resolved from the verified VNext registry, never from the old film folder. */
const COMPATIBILITY_FILMS = Object.freeze([
  { id: "film01_campus_atlas", num: "01", title: "Prism Atmosphere", sourceAssetId: "VID-PRISM-01", targetRoutes: ["/"] },
  { id: "film02_trust_engine", num: "02", title: "Trust Inspection", sourceAssetId: "VID-OPTIC-01", targetRoutes: ["/trust"] },
  { id: "film03_collective_intelligence", num: "03", title: "Human Research", sourceAssetId: "VID-HUMAN-02", targetRoutes: ["/community"] },
  { id: "film04_expert_network", num: "04", title: "Expert Inspection", sourceAssetId: "VID-OPTIC-01", targetRoutes: ["/expert"] },
  { id: "film05_question_understanding", num: "05", title: "Human Evidence", sourceAssetId: "VID-HUMAN-01", targetRoutes: [] },
  { id: "film06_deep_work", num: "06", title: "Human Evidence", sourceAssetId: "VID-HUMAN-01", targetRoutes: [] },
  { id: "film07_knowledge_time", num: "07", title: "Trust Result", sourceAssetId: "VID-OPTIC-02", targetRoutes: [] },
  { id: "film08_knowledge_horizon", num: "08", title: "Prism Atmosphere", sourceAssetId: "VID-PRISM-01", targetRoutes: [] },
]);

function toCompatibilityFilm(definition) {
  const asset = getMediaAsset(definition.sourceAssetId);
  return Object.freeze({
    ...definition,
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 production derivative",
    glowColor: "rgba(139, 217, 195, 0.14)",
    accentColor: "#8BD9C3",
    mood: "Evidence first",
    safeZone: "Text-safe crop",
    mp4: asset?.video || "",
    webp: asset?.desktopPoster || "",
    poster: asset?.desktopPoster || "",
    mobilePoster: asset?.mobilePoster || "",
  });
}

export const ACADEMIC_CINEMA_FILMS = Object.freeze(COMPATIBILITY_FILMS.map(toCompatibilityFilm));

export function getFilmForPath(pathname = "") {
  const asset = getRouteMediaAsset(pathname);
  const film = ACADEMIC_CINEMA_FILMS.find((item) => item.sourceAssetId === asset?.id);
  return film || ACADEMIC_CINEMA_FILMS[0];
}

export const WALLPAPERS = Object.freeze(ACADEMIC_CINEMA_FILMS.map((film) => ({
  id: film.id,
  num: film.num,
  name: film.title,
  src: film.poster,
  tagline: film.mood,
  mood: film.mood,
  glowColor: film.glowColor,
  accentColor: film.accentColor,
  effect: "static",
})));

const BackgroundContext = createContext({
  activeFilm: ACADEMIC_CINEMA_FILMS[0],
  activeMedia: getMediaAsset("VID-PRISM-01"),
  routeMediaPolicy: getRouteMediaPolicy("/"),
  routeMediaTier: 2,
  setActiveFilm: () => {},
  setRouteMediaAsset: () => {},
  bgOpacity: 0.24,
  setBgOpacity: () => {},
  isBgPaused: false,
  setIsBgPaused: () => {},
  setScrollySection: () => {},
  isManualOverride: false,
  activeWallpaper: WALLPAPERS[0],
  setActiveWallpaper: () => {},
  activeEffect: "static",
  setActiveEffect: () => {},
});

export function getRouteMediaTier(pathname = "") {
  const policy = getRouteMediaPolicy(pathname);
  if (policy.presentation === "cinematic") return 2;
  if (policy.presentation === "instrument") return 1;
  return 0;
}

export function BackgroundProvider({ children }) {
  const pathname = usePathname() || "/";
  const [mediaSelection, setMediaSelection] = useState(() => ({
    pathname,
    manualFilm: null,
    routeMediaAssetId: null,
  }));
  const [bgOpacity, setBgOpacity] = useState(null);
  const [isBgPaused, setIsBgPaused] = useState(false);
  const routeMediaPolicy = useMemo(() => getRouteMediaPolicy(pathname), [pathname]);
  const selection = mediaSelection.pathname === pathname
    ? mediaSelection
    : { manualFilm: null, routeMediaAssetId: null };
  const { manualFilm, routeMediaAssetId } = selection;
  const routeDefaultMedia = routeMediaPolicy.assets[0] || null;
  const routeOverrideMedia = routeMediaAssetId ? getRouteMediaAsset(pathname, routeMediaAssetId) : null;
  const routeMediaAsset = routeOverrideMedia || routeDefaultMedia;
  const activeFilm = routeOverrideMedia
    ? ACADEMIC_CINEMA_FILMS.find((film) => film.sourceAssetId === routeOverrideMedia.id) || getFilmForPath(pathname)
    : manualFilm || getFilmForPath(pathname);
  const activeMedia = routeOverrideMedia || (manualFilm ? getMediaAsset(manualFilm.sourceAssetId) : routeMediaAsset);

  const effectiveOpacity = bgOpacity ?? routeMediaPolicy.opacity ?? 0;

  const setActiveFilm = (film) => {
    if (film?.sourceAssetId && getMediaAsset(film.sourceAssetId)) {
      setMediaSelection({ pathname, manualFilm: film, routeMediaAssetId: null });
    }
  };

  const setRouteMediaAsset = useCallback((assetId) => {
    if (!assetId) {
      setMediaSelection((current) => ({
        pathname,
        manualFilm: current.pathname === pathname ? current.manualFilm : null,
        routeMediaAssetId: null,
      }));
      return;
    }
    const asset = getRouteMediaAsset(pathname, assetId);
    if (asset) setMediaSelection({ pathname, manualFilm: null, routeMediaAssetId: asset.id });
  }, [pathname]);

  const setScrollySection = (filmIdOrSection) => {
    const film = ACADEMIC_CINEMA_FILMS.find((item) => item.id === filmIdOrSection || item.num === filmIdOrSection);
    if (film) setActiveFilm(film);
  };

  const setActiveWallpaper = (wallpaper) => setActiveFilm(ACADEMIC_CINEMA_FILMS.find((film) => film.id === wallpaper?.id));

  return (
    <BackgroundContext.Provider
      value={{
        activeFilm,
        activeMedia,
        routeMediaPolicy,
        routeMediaTier: getRouteMediaTier(pathname),
        setActiveFilm,
        setRouteMediaAsset,
        bgOpacity: effectiveOpacity,
        setBgOpacity,
        isBgPaused,
        setIsBgPaused,
        setScrollySection,
        isManualOverride: manualFilm !== null || routeOverrideMedia !== null,
        activeWallpaper: WALLPAPERS.find((item) => item.id === activeFilm?.id) || WALLPAPERS[0],
        setActiveWallpaper,
        activeEffect: "static",
        setActiveEffect: () => {},
        policy: VERIFIED_MEDIA_POLICY,
      }}
    >
      <UniversalCinematicBackground />
      <ReferenceAtmosphere routeMediaPolicy={routeMediaPolicy} />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </BackgroundContext.Provider>
  );
}

export const useBackground = () => useContext(BackgroundContext);
