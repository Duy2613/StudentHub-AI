"use client";

import React, { useEffect, useState, useRef } from "react";

export default function KnowledgeCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    // Only enable on desktop with fine pointer
    if (
      typeof window === "undefined" ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.location.pathname.startsWith("/ultra")
    ) {
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animId;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setIsVisible(true);

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${mouseX - 150}px, ${mouseY - 150}px, 0)`;
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const checkInteractive = (e) => {
      const target = e.target;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest(".interactive-target") ||
        target.closest("[role='button']")
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const loop = () => {
      // Smooth interpolation for orbital ring
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;

      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      animId = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", checkInteractive, { passive: true });
    document.body.addEventListener("mouseleave", onMouseLeave);
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", checkInteractive);
      document.body.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Soft Ambient Cursor Glow */}
      <div
        ref={glowRef}
        className={`fixed top-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none z-40 transition-opacity duration-500 bg-radial from-teal-400/[0.07] via-indigo-500/[0.03] to-transparent blur-2xl ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ willChange: "transform" }}
      />

      {/* Tiny Center Dot */}
      <div
        ref={cursorDotRef}
        className={`fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-teal-400 pointer-events-none z-50 transition-opacity duration-300 shadow-[0_0_10px_rgba(52,231,196,0.8)] ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ willChange: "transform" }}
      />

      {/* Orbital Ring with Inertia */}
      <div
        ref={cursorRingRef}
        className={`fixed top-0 left-0 pointer-events-none z-50 transition-all duration-200 ease-out border rounded-full ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${
          isHovered
            ? "-ml-5 -mt-5 w-10 h-10 border-teal-400/80 bg-teal-400/10 scale-110 shadow-[0_0_15px_rgba(52,231,196,0.3)]"
            : "-ml-3 -mt-3 w-6 h-6 border-white/20 scale-100"
        }`}
        style={{ willChange: "transform" }}
      />
    </>
  );
}
