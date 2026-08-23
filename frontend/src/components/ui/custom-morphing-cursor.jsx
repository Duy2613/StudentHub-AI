"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * CustomMorphingCursor: Agency-grade magnetic morphing cursor.
 * - Center precision dot + elastic follower halo
 * - Expands & morphs blend mode over clickable elements
 * - Displays context badges (data-cursor-text)
 * - Automatically disabled on touch screens / mobile
 */
export default function CustomMorphingCursor() {
  const [enabled, setEnabled] = useState(false);
  const [cursorState, setCursorState] = useState("default");
  const [cursorText, setCursorText] = useState("");
  const [isClicking, setIsClicking] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring physics for outer ring
  const springX = useSpring(mouseX, { damping: 28, stiffness: 320, mass: 0.5 });
  const springY = useSpring(mouseY, { damping: 28, stiffness: 320, mass: 0.5 });

  useEffect(() => {
    // Only enable on desktop devices with fine pointer (mouse)
    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isFinePointer) return;

    setEnabled(true);

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      // Check hovered element
      const target = e.target;
      if (!target) return;

      const interactiveEl = target.closest("button, a, input, [role='button'], [data-cursor]");
      if (interactiveEl) {
        const text = interactiveEl.getAttribute("data-cursor-text");
        if (text) {
          setCursorState("text");
          setCursorText(text);
        } else {
          setCursorState("hover");
          setCursorText("");
        }
      } else {
        setCursorState("default");
        setCursorText("");
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* 1. Outer Elastic Morphing Ring */}
      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: cursorState === "text" ? 54 : cursorState === "hover" ? 44 : isClicking ? 20 : 28,
          height: cursorState === "text" ? 54 : cursorState === "hover" ? 44 : isClicking ? 20 : 28,
          backgroundColor:
            cursorState === "text"
              ? "rgba(99, 102, 241, 0.25)"
              : cursorState === "hover"
              ? "rgba(52, 231, 196, 0.15)"
              : "rgba(255, 255, 255, 0.04)",
          borderColor:
            cursorState === "text"
              ? "rgba(99, 102, 241, 0.6)"
              : cursorState === "hover"
              ? "rgba(52, 231, 196, 0.6)"
              : "rgba(255, 255, 255, 0.25)",
          scale: isClicking ? 0.85 : 1,
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed top-0 left-0 rounded-full border backdrop-blur-[1px] flex items-center justify-center shadow-sm"
      >
        {cursorText && (
          <span className="text-[9px] font-bold text-white tracking-wider uppercase drop-shadow-md">
            {cursorText}
          </span>
        )}
      </motion.div>

      {/* 2. Inner Precision Dot */}
      <motion.div
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: cursorState === "hover" || cursorState === "text" ? 0 : isClicking ? 1.5 : 1,
          opacity: cursorState === "hover" || cursorState === "text" ? 0 : 1,
        }}
        transition={{ duration: 0.1 }}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
      />
    </div>
  );
}
