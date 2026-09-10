"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useBackground } from "@/components/providers/BackgroundContext";

/**
 * Route-aware enhancement layer.
 * Static poster is the first render. Video is a desktop-only enhancement for
 * the landing policy and pauses when hidden/offscreen. Static product routes
 * return null so the shell owns the reading surface.
 */
export default function UniversalCinematicBackground() {
  const { activeMedia, routeMediaPolicy, bgOpacity = 0, isBgPaused = false } = useBackground();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const sync = () => {
      setReducedMotion(reducedQuery.matches);
      setIsMobile(mobileQuery.matches);
    };
    sync();
    reducedQuery.addEventListener("change", sync);
    mobileQuery.addEventListener("change", sync);
    return () => {
      reducedQuery.removeEventListener("change", sync);
      mobileQuery.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !routeMediaPolicy.videoEligible || reducedMotion || isMobile) return undefined;
    let idleId;
    let timeoutId;
    const enable = () => setMediaReady(true);
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(enable, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(enable, 1200);
    }
    return () => {
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [isMobile, reducedMotion, routeMediaPolicy.videoEligible]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.01 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const [isSaveData, setIsSaveData] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.connection?.saveData) {
      setIsSaveData(true);
    }
  }, []);

  const shouldRenderVideo = Boolean(
    activeMedia?.video &&
    routeMediaPolicy.videoEligible &&
    mediaReady &&
    isVisible &&
    !isMobile &&
    !reducedMotion &&
    !isSaveData &&
    !videoError &&
    !isBgPaused,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    if (shouldRenderVideo && !document.hidden) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    return undefined;
  }, [shouldRenderVideo, activeMedia?.id]);

  useEffect(() => {
    const onVisibilityChange = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden || !shouldRenderVideo) video.pause();
      else video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [shouldRenderVideo]);

  if (!activeMedia || routeMediaPolicy.presentation === "static" || !activeMedia.desktopPoster) return null;

  const opacity = Math.max(0, Math.min(0.3, Number(bgOpacity) || routeMediaPolicy.opacity || 0));

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="vnext-media-atmosphere"
      data-media-route={routeMediaPolicy.id}
      data-media-mode={shouldRenderVideo ? "video" : "poster"}
      style={{ opacity }}
    >
      <picture className="vnext-media-poster">
        <source media="(prefers-reduced-motion: reduce)" srcSet={activeMedia.reducedMotionAsset} />
        <source media="(max-width: 768px)" srcSet={activeMedia.mobilePoster} />
        <Image
          src={activeMedia.desktopPoster}
          alt=""
          fill
          unoptimized
          priority={routeMediaPolicy.load === "INITIAL"}
          sizes="100vw"
          className="vnext-media-poster"
        />
      </picture>
      {shouldRenderVideo && (
        <video
          ref={videoRef}
          key={activeMedia.id}
          src={isMobile && activeMedia.mobileVideo ? activeMedia.mobileVideo : activeMedia.video}
          poster={activeMedia.desktopPoster}
          autoPlay
          preload="none"
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className="vnext-media-video"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <div className="vnext-media-veil" />
    </div>
  );
}
