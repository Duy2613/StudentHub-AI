"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

/**
 * HobroPrecisionCursor
 * Inspired by hobro.digital & arstraumur.music
 * Precision magnetic cursor follower with interactive context labels,
 * dot center, glowing ring, and spring physics.
 */
export default function HobroPrecisionCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorText, setCursorText] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const ringSpringConfig = { damping: 20, stiffness: 180, mass: 0.8 };
  const ringX = useSpring(mouseX, ringSpringConfig);
  const ringY = useSpring(mouseY, ringSpringConfig);

  useEffect(() => {
    // Only activate on devices with fine pointer (mouse/trackpad), not touch
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check if hovering interactive elements with custom data-cursor
      const target = e.target;
      if (!target) return;

      const cursorTarget = target.closest?.("[data-cursor]");
      if (cursorTarget) {
        setCursorText(cursorTarget.getAttribute("data-cursor") || "");
        setIsHovered(true);
      } else {
        const interactive = target.closest?.("a, button, input, textarea, [role='button']");
        if (interactive) {
          setCursorText("");
          setIsHovered(true);
        } else {
          setCursorText("");
          setIsHovered(false);
        }
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseX, mouseY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Outer Smooth Lagging Ring */}
      <motion.div
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/40 flex items-center justify-center pointer-events-none backdrop-blur-[1px]"
        style={{
          x: ringX,
          y: ringY,
        }}
        animate={{
          width: cursorText ? 84 : isHovered ? 48 : 28,
          height: cursorText ? 84 : isHovered ? 48 : 28,
          scale: isClicking ? 0.85 : 1,
          backgroundColor: cursorText
            ? "rgba(6, 8, 19, 0.85)"
            : isHovered
            ? "rgba(16, 185, 129, 0.12)"
            : "rgba(16, 185, 129, 0.04)",
          borderColor: cursorText
            ? "rgba(16, 185, 129, 0.8)"
            : isHovered
            ? "rgba(52, 211, 153, 0.6)"
            : "rgba(52, 211, 153, 0.3)",
          boxShadow: isHovered
            ? "0 0 25px rgba(16, 185, 129, 0.35)"
            : "0 0 10px rgba(16, 185, 129, 0.15)",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      >
        {cursorText && (
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-300 uppercase select-none text-center px-1">
            {cursorText}
          </span>
        )}
      </motion.div>

      {/* Inner High-Precision Center Dot */}
      <motion.div
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 pointer-events-none shadow-[0_0_8px_rgba(52,211,153,0.9)]"
        style={{
          x: smoothX,
          y: smoothY,
        }}
        animate={{
          scale: cursorText ? 0 : isClicking ? 1.8 : 1,
          opacity: cursorText ? 0 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
    </div>
  );
}
