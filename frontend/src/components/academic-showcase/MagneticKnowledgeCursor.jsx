"use client";

import React, { useEffect, useState, useRef } from "react";

export default function MagneticKnowledgeCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorText, setCursorText] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animId;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setIsVisible(true);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseOver = (e) => {
      const target = e.target;
      const cursorTarget = target.closest("[data-cursor-text]");
      if (cursorTarget) {
        setCursorText(cursorTarget.getAttribute("data-cursor-text") || "");
        setIsHovered(true);
        return;
      }

      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest(".interactive-card")
      ) {
        setCursorText("Xem");
        setIsHovered(true);
      } else {
        setCursorText("");
        setIsHovered(false);
      }
    };

    const loop = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      animId = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    document.body.addEventListener("mouseleave", onMouseLeave);
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      document.body.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Precision Center Dot */}
      <div
        ref={dotRef}
        className={`pointer-events-none fixed top-0 left-0 z-[100] -ml-1 -mt-1 h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(52,231,196,0.9)] transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ willChange: "transform" }}
      />

      {/* Elastic Follower Ring with Context Text */}
      <div
        ref={ringRef}
        className={`pointer-events-none fixed top-0 left-0 z-[99] flex items-center justify-center rounded-full border transition-all duration-200 ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${
          isHovered
            ? "-ml-8 -mt-8 h-16 w-16 border-teal-400/80 bg-teal-400/20 backdrop-blur-xs scale-105 shadow-[0_0_25px_rgba(52,231,196,0.35)]"
            : "-ml-4 -mt-4 h-8 w-8 border-white/30 bg-transparent scale-100"
        }`}
        style={{ willChange: "transform" }}
      >
        {isHovered && cursorText && (
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-teal-200">
            {cursorText}
          </span>
        )}
      </div>
    </>
  );
}
