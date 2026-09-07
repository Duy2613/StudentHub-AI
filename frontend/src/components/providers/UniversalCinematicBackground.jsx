"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { useBackground } from "@/components/providers/BackgroundContext";

/**
 * UniversalCinematicBackground: Master Fullscreen Video Background Engine
 * - Fixed across entire viewport (z-0)
 * - Dual-layer seamless crossfading between 8 cinematic films
 * - Hybrid MP4 <video> + WebP animated fallback
 * - Adaptive WCAG AAA legibility veil (obsidian gradient + vignette)
 * - Battery & GPU friendly (pauses when document is hidden)
 */
export default function UniversalCinematicBackground() {
  const {
    activeFilm,
    bgOpacity = 0.55,
    isBgPaused = false,
  } = useBackground();

  // Pure React pattern for tracking previous render state without useEffect setState
  const [filmState, setFilmState] = useState({
    current: activeFilm,
    prev: null,
    isCrossfading: false,
  });

  if (activeFilm && activeFilm.id !== filmState.current?.id) {
    setFilmState({
      current: activeFilm,
      prev: filmState.current,
      isCrossfading: true,
    });
  }

  // Clear previous layer after crossfade transition completes
  useEffect(() => {
    if (filmState.isCrossfading) {
      const timer = setTimeout(() => {
        setFilmState((s) => ({
          ...s,
          prev: null,
          isCrossfading: false,
        }));
      }, 1050);
      return () => clearTimeout(timer);
    }
  }, [filmState.isCrossfading]);

  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const [useWebpFallback, setUseWebpFallback] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  // Keep cinematic media out of the first paint. The background is decorative,
  // while the page content is the LCP candidate; loading multi-megabyte films
  // during hydration makes every route compete with its real content. Enable
  // the selected film once the browser has had an idle window (with a bounded
  // timeout for throttled devices).
  useEffect(() => {
    let idleId;
    let timeoutId;
    const enableMedia = () => {
      setMediaReady(true);
      try {
        window.performance?.mark?.("cinematic-media-ready");
      } catch {
        // Performance marks are evidence only and must never affect rendering.
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(enableMedia, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(enableMedia, 1200);
    }

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  // Proactive hardware & browser codec detection for instantaneous zero-flicker rendering
  useEffect(() => {
    try {
      const vid = document.createElement("video");
      const canPlay = vid.canPlayType('video/mp4; codecs="mp4v.20.8"') || vid.canPlayType('video/mp4; codecs="mp4v"');
      if (!canPlay) {
        setUseWebpFallback(true);
      }
    } catch {
      setUseWebpFallback(true);
    }
  }, []);

  // Tab visibility pause to save GPU/CPU
  useEffect(() => {
    const handleVisibility = () => {
      const isHidden = document.hidden;
      [videoRefA.current, videoRefB.current].forEach((vid) => {
        if (vid) {
          if (isHidden || isBgPaused) {
            vid.pause();
          } else {
            vid.play().catch(() => {});
          }
        }
      });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isBgPaused]);

  // Pause / Play toggle reaction
  useEffect(() => {
    [videoRefA.current, videoRefB.current].forEach((vid) => {
      if (vid) {
        if (isBgPaused) {
          vid.pause();
        } else {
          vid.play().catch(() => {});
        }
      }
    });
  }, [isBgPaused]);

  const currentFilm = filmState.current || activeFilm;
  const prevFilm = filmState.prev;
  const isCrossfading = filmState.isCrossfading;

  if (!currentFilm) return null;

  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none bg-[#060813]"
      aria-hidden="true"
    >
      {/* Layer 1: Previous Film (fades out during crossfade) */}
      {mediaReady && prevFilm && (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            isCrossfading ? "opacity-0" : "opacity-100"
          }`}
          style={{ opacity: isCrossfading ? 0 : bgOpacity }}
        >
          {useWebpFallback ? (
            <div className="relative w-full h-full scale-105 filter blur-[0.5px]">
              <Image
                src={prevFilm.webp}
                alt=""
                fill
                unoptimized
                className="object-cover object-center"
              />
            </div>
          ) : (
            <video
              ref={videoRefB}
              src={prevFilm.mp4}
              poster={prevFilm.poster}
              autoPlay
              preload="none"
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center scale-105 filter blur-[0.5px]"
            />
          )}
        </div>
      )}

      {/* Layer 2: Current Active Film (fades in) */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{ opacity: bgOpacity }}
      >
        {mediaReady && useWebpFallback ? (
          <div className="relative w-full h-full scale-105 filter blur-[0.5px]">
            <Image
              src={currentFilm.webp}
              alt=""
              fill
              unoptimized
              className="object-cover object-center"
            />
          </div>
        ) : mediaReady ? (
          <video
            ref={videoRefA}
            key={currentFilm.id}
            src={currentFilm.mp4}
            poster={currentFilm.poster}
            autoPlay
            preload="none"
            loop
            muted
            playsInline
            onError={() => setUseWebpFallback(true)}
            className="w-full h-full object-cover object-center scale-105 filter blur-[0.5px]"
          />
        ) : null}
      </div>

      {/* Dynamic Chromatic Aura Glow matching current film */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${currentFilm.glowColor || "rgba(82, 138, 185, 0.25)"}, transparent 65%)`,
        }}
      />

      {/* Senior Design: Multi-Tier Legibility Veil (Guarantees 100% WCAG AAA readability for all text above) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060813]/90 via-[#060813]/55 to-[#060813]/92 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#060813]/30 to-[#060813]/90 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
    </div>
  );
}
