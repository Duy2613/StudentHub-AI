/**
 * TextScramble — Igloo.inc signature character decode/unscramble reveal effect.
 *
 * When the element enters the viewport, characters rapidly cycle through
 * random glyphs then "settle" into their correct values — like a cipher
 * being broken in real-time. Inspired by igloo.inc's data-interface aesthetic.
 *
 * @example
 * <TextScramble
 *   text="Bảo vệ sinh viên số"
 *   className="text-5xl font-black text-white"
 *   speed={35}
 *   delay={200}
 * />
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// Igloo-flavored character pool: mix Latin + symbols for cipher look
const IGLOO_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>/\\|[]{}";

function scrambleFrame(target, progress, chars) {
  return target
    .split("")
    .map((char, i) => {
      if (char === " " || char === "\n") return char;
      // Characters reveal left-to-right as progress increases
      if (i < Math.floor(progress * target.length)) return char;
      return chars[Math.floor(Math.random() * chars.length)];
    })
    .join("");
}

export default function TextScramble({
  text,
  className = "",
  speed = 40,       // ms per frame
  duration = 800,   // total animation duration ms
  delay = 0,        // ms before starting
  once = true,      // only animate once on first intersection
  tag: Tag = "span",
  charPool = IGLOO_CHARS,
}) {
  const [displayed, setDisplayed] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const hasAnimated = useRef(false);
  const rafRef = useRef(null);      // requestAnimationFrame handle
  const timeoutRef = useRef(null);  // setTimeout handle

  const runScramble = useCallback(() => {
    if (once && hasAnimated.current) return;

    // Clear any leftover animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const startTime = performance.now() + delay;
    setIsAnimating(true);
    hasAnimated.current = true;

    const animate = (now) => {
      if (now < startTime) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setDisplayed(scrambleFrame(text, progress, charPool));

      if (progress < 1) {
        // Variable speed: faster at end for snap-to-settle feel
        timeoutRef.current = setTimeout(() => {
          rafRef.current = requestAnimationFrame(animate);
        }, speed * (1 - progress * 0.6));
      } else {
        setDisplayed(text);
        setIsAnimating(false);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [text, speed, duration, delay, once, charPool]); // removed isAnimating: stale closure risk

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runScramble();
          if (once) observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [runScramble, once]);

  return (
    <Tag
      ref={containerRef}
      className={`igloo-scramble ${className}`}
      aria-label={text}
      style={{
        // Machine-Interface feel: monospace when scrambling, normal when settled
        fontVariantNumeric: "tabular-nums",
        letterSpacing: isAnimating ? "0.02em" : undefined,
      }}
    >
      {displayed}
    </Tag>
  );
}
