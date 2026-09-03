"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function GsapTextReveal({
  children,
  className = "",
  stagger = 0.05,
  delay = 0,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const el = containerRef.current;
    if (!el) return;

    const words = el.querySelectorAll(".gsap-word");

    gsap.fromTo(
      words,
      {
        opacity: 0,
        y: 24,
        rotateX: -40,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.8,
        stagger: stagger,
        delay: delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, [stagger, delay]);

  const text = typeof children === "string" ? children : "";
  const words = text.split(" ");

  return (
    <div ref={containerRef} className={`perspective-1000 ${className}`}>
      {words.map((w, idx) => (
        <span
          key={idx}
          className="gsap-word inline-block mr-[0.25em] will-change-transform"
        >
          {w}
        </span>
      ))}
    </div>
  );
}

export function GsapStaggerCards({ children, className = "", stagger = 0.15 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const el = containerRef.current;
    if (!el) return;

    const cards = el.children;

    gsap.fromTo(
      cards,
      {
        opacity: 0,
        y: 35,
        scale: 0.96,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: stagger,
        ease: "cubic-bezier(0.16, 1, 0.3, 1)",
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, [stagger]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

export default GsapTextReveal;
