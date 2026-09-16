"use client";

import React, { useRef, useState, useEffect, useId } from "react";
import cinematicMediaCoordinator from "./CinematicMediaCoordinator";

/**
 * SmartVideo — Production Performance Video Abstraction
 *
 * Implements:
 * 1. SINGLE_ACTIVE_MEDIA_PLAYBACK: Enforces max 1 cinematic playback stream.
 * 2. POSTER_FIRST: WebP poster renders immediately. Smooth crossfade once video decodes. Zero black frames.
 * 3. PRELOAD_POLICY: Priority videos use preload="metadata". Below-the-fold videos use preload="none"
 *    and only attach their src when near viewport (IntersectionObserver rootMargin: 300px).
 * 4. OFFSCREEN_PAUSE: Automatically pauses when scrolled out of viewport.
 * 5. VISIBILITY_HANDLING: Pauses on tab switch; resumes only the active visible scene.
 * 6. ACCESSIBILITY / REDUCED_MOTION: Honors prefers-reduced-motion by keeping the high-quality poster.
 */
export default function SmartVideo({
  src,
  poster,
  alt = "Minh họa hệ thống",
  priority = false,
  className = "",
  videoClassName = "",
  posterClassName = "",
  loop = true,
  muted = true,
  playsInline = true,
  id: customId,
  onCanPlay,
  children,
}) {
  const generatedId = useId();
  const videoId = customId || `smart-video-${generatedId}`;

  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const [isNearViewport, setIsNearViewport] = useState(priority);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(() => (
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  ));
  const [hasError, setHasError] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // IntersectionObserver for prewarming & viewport detection
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // Observer 1: Near viewport (prewarm / attach src)
    let prewarmObserver = null;
    if (!priority) {
      prewarmObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsNearViewport(true);
            prewarmObserver?.disconnect();
          }
        },
        { rootMargin: "350px 0px" }
      );
      prewarmObserver.observe(containerRef.current);
    }

    // Observer 2: In viewport (coordinate active playback)
    const viewportObserver = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInViewport(visible);
        cinematicMediaCoordinator.updateVisibility(videoId, visible);
      },
      { threshold: 0.15 }
    );
    viewportObserver.observe(containerRef.current);

    return () => {
      prewarmObserver?.disconnect();
      viewportObserver?.disconnect();
      cinematicMediaCoordinator.releasePlayback(videoId);
      cinematicMediaCoordinator.unregister(videoId);
    };
  }, [priority, videoId]);

  // Register with coordinator once video element is available
  useEffect(() => {
    if (!videoRef.current) return;

    cinematicMediaCoordinator.register(videoId, {
      videoEl: videoRef.current,
      onPause: () => {},
      onResume: () => {},
      isVisible: isInViewport,
      isReducedMotion,
    });

    if (isInViewport && !isReducedMotion) {
      cinematicMediaCoordinator.requestPlayback(videoId);
    }

    return () => {
      cinematicMediaCoordinator.unregister(videoId);
    };
  }, [videoId, isInViewport, isReducedMotion]);

  const handleCanPlay = (e) => {
    setIsVideoReady(true);
    if (onCanPlay) onCanPlay(e);
    if (isInViewport && !isReducedMotion) {
      cinematicMediaCoordinator.requestPlayback(videoId);
    }
  };

  const handleError = () => {
    setHasError(true);
    cinematicMediaCoordinator.releasePlayback(videoId);
  };

  const shouldRenderVideoSource = isNearViewport && !isReducedMotion && !hasError && Boolean(src);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`.trim()}
      data-smart-video-id={videoId}
      data-video-ready={isVideoReady}
      data-near-viewport={isNearViewport}
    >
      {/* 1. Poster-First Foundation (always present, guarantees zero blank frame) */}
      {poster && (
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <img
            src={poster}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${
              isVideoReady ? "opacity-0" : "opacity-100"
            } ${posterClassName}`.trim()}
          />
        </picture>
      )}

      {/* 2. Video Element with intelligent deferred loading */}
      {!isReducedMotion && !hasError && (
        <video
          ref={videoRef}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload={priority ? "metadata" : "none"}
          onCanPlay={handleCanPlay}
          onPlaying={() => setIsVideoReady(true)}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${
            isVideoReady ? "opacity-100" : "opacity-0"
          } ${videoClassName}`.trim()}
          aria-hidden="true"
        >
          {shouldRenderVideoSource && <source src={src} type="video/mp4" />}
        </video>
      )}

      {/* 3. Slot for architectural gradient overlays, telemetry tags, or borders */}
      {children}
    </div>
  );
}
