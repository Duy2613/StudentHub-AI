"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * ArstraumurAtmosphereCanvas
 * Inspired by arstraumur.music
 * Atmospheric particle and harmonic wave canvas that ripples dynamically with pointer coordinates.
 */
export default function ArstraumurAtmosphereCanvas() {
  const pathname = usePathname();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (pathname?.startsWith("/academic")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Interactive mouse coordinates with smooth lerping
    const mouse = { x: width * 0.5, y: height * 0.5, targetX: width * 0.5, targetY: height * 0.5 };
    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Initialize 60 ambient stardust nodes
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
      baseAlpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.4 ? "52, 211, 153" : "56, 189, 248", // Emerald or Cyan
    }));

    let time = 0;

    const render = () => {
      time += 0.008;
      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle harmonic background glow following mouse
      const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        Math.min(width, 700)
      );
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.035)");
      gradient.addColorStop(0.5, "rgba(56, 189, 248, 0.015)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Update & Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around bounds
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Gravitational displacement from cursor
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 1) {
          const force = (180 - dist) / 180;
          p.x -= (dx / dist) * force * 0.8;
          p.y -= (dy / dist) * force * 0.8;
        }

        // Breathing alpha
        const currentAlpha = p.baseAlpha + Math.sin(time * 2 + p.x) * 0.15;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${Math.max(0.05, currentAlpha)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${p.color}, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pathname]);

  if (pathname?.startsWith("/academic")) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      aria-hidden="true"
    />
  );
}
