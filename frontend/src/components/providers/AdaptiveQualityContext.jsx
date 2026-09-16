"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export const QUALITY_LEVELS = Object.freeze({
  ULTRA: "ULTRA",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  STATIC: "STATIC",
});

const QUALITY_CONFIGS = Object.freeze({
  [QUALITY_LEVELS.ULTRA]: {
    name: "ULTRA",
    maxDPR: 1.5,
    particlesMultiplier: 1.0,
    videoEnabled: true,
    threeDEnabled: true,
    blurEnabled: true,
  },
  [QUALITY_LEVELS.HIGH]: {
    name: "HIGH",
    maxDPR: 1.25,
    particlesMultiplier: 0.8,
    videoEnabled: true,
    threeDEnabled: true,
    blurEnabled: true,
  },
  [QUALITY_LEVELS.MEDIUM]: {
    name: "MEDIUM",
    maxDPR: 1.0,
    particlesMultiplier: 0.5,
    videoEnabled: true,
    threeDEnabled: true,
    blurEnabled: false,
  },
  [QUALITY_LEVELS.LOW]: {
    name: "LOW",
    maxDPR: 1.0,
    particlesMultiplier: 0.25,
    videoEnabled: false,
    threeDEnabled: false,
    blurEnabled: false,
  },
  [QUALITY_LEVELS.STATIC]: {
    name: "STATIC",
    maxDPR: 1.0,
    particlesMultiplier: 0,
    videoEnabled: false,
    threeDEnabled: false,
    blurEnabled: false,
  },
});

const AdaptiveQualityContext = createContext({
  quality: QUALITY_LEVELS.HIGH,
  config: QUALITY_CONFIGS[QUALITY_LEVELS.HIGH],
  setQuality: () => {},
  recordFrameSample: () => {},
});

function detectInitialQuality() {
  if (typeof window === "undefined") return QUALITY_LEVELS.HIGH;
  const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSaveData = Boolean(typeof navigator !== "undefined" && navigator.connection?.saveData);
  if (reducedMotion || isSaveData) return QUALITY_LEVELS.STATIC;

  const concurrency = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
  const memory = (typeof navigator !== "undefined" && navigator.deviceMemory) || 4;
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    return concurrency >= 4 ? QUALITY_LEVELS.MEDIUM : QUALITY_LEVELS.LOW;
  }
  if (concurrency >= 8 && memory >= 8 && window.innerWidth >= 1280) {
    return QUALITY_LEVELS.ULTRA;
  }
  if (concurrency >= 4) {
    return QUALITY_LEVELS.HIGH;
  }
  return QUALITY_LEVELS.MEDIUM;
}

export function AdaptiveQualityProvider({ children }) {
  // Keep the first render deterministic for SSR/hydration. Device capability
  // detection is browser-only and is applied immediately after hydration.
  const [quality, setQuality] = useState(QUALITY_LEVELS.HIGH);
  const lastDowngradeRef = useRef(0);
  const recentFramesRef = useRef([]);

  useEffect(() => {
    setQuality(detectInitialQuality());
  }, []);

  // Listen to prefers-reduced-motion dynamic changes
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e) => {
      if (e.matches) {
        setQuality(QUALITY_LEVELS.STATIC);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Frame-time Downgrade Guard (prevents rapid oscillation)
  const recordFrameSample = useCallback((frameMs) => {
    recentFramesRef.current.push(frameMs);
    if (recentFramesRef.current.length > 30) {
      recentFramesRef.current.shift();
    }

    const now = performance.now();
    // Enforce 6-second cooldown between downgrades
    if (now - lastDowngradeRef.current < 6000) return;

    if (recentFramesRef.current.length >= 25) {
      const avg =
        recentFramesRef.current.reduce((a, b) => a + b, 0) / recentFramesRef.current.length;

      // If average frame duration > 36ms (~<27 FPS) over 25 continuous samples, downgrade by 1 tier
      if (avg > 36) {
        setQuality((curr) => {
          let next = curr;
          if (curr === QUALITY_LEVELS.ULTRA) next = QUALITY_LEVELS.HIGH;
          else if (curr === QUALITY_LEVELS.HIGH) next = QUALITY_LEVELS.MEDIUM;
          else if (curr === QUALITY_LEVELS.MEDIUM) next = QUALITY_LEVELS.LOW;

          if (next !== curr) {
            lastDowngradeRef.current = now;
            recentFramesRef.current = [];
          }
          return next;
        });
      }
    }
  }, []);

  const config = QUALITY_CONFIGS[quality] || QUALITY_CONFIGS[QUALITY_LEVELS.HIGH];

  return (
    <AdaptiveQualityContext.Provider
      value={{
        quality,
        config,
        setQuality,
        recordFrameSample,
      }}
    >
      <div data-quality-tier={quality} className="contents">
        {children}
      </div>
    </AdaptiveQualityContext.Provider>
  );
}

export function useAdaptiveQuality() {
  return useContext(AdaptiveQualityContext);
}

export default AdaptiveQualityContext;
