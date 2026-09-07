"use client";

import React, { useEffect } from "react";

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    // Không chạy Lenis nếu người dùng bật chế độ giảm chuyển động (prefers-reduced-motion)
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let disposed = false;
    let rafId;
    let lenis;

    const initialize = async () => {
      try {
        // Lenis is an enhancement; keep it out of the initial route bundle
        // and initialize it only after the first client paint.
        const { default: Lenis } = await import("lenis");
        if (disposed) return;
        lenis = new Lenis({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.8,
          infinite: false,
        });

        const raf = (time) => {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
      } catch {
        // Smooth scrolling is optional; native scrolling remains available.
      }
    };
    initialize();

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
