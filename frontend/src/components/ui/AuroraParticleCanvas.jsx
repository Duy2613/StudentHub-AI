/**
 * AuroraParticleCanvas — Igloo.inc inspired reactive particle aurora system.
 *
 * 100 arctic-palette particles drift slowly with subtle mouse-repel physics.
 * Uses Canvas 2D (no WebGL) for broad compatibility.
 * Pauses via IntersectionObserver when not visible (performance-safe).
 *
 * Arctic palette: indigo #6366f1, purple #a855f7, cyan #06b6d4, teal #34e7c4
 */

"use client";

import React, { useRef, useEffect, useCallback } from "react";

// Igloo arctic particle color palette
const ARCTIC_COLORS = [
  { r: 99,  g: 102, b: 241, a: 0.55 },  // indigo
  { r: 168, g: 85,  b: 247, a: 0.45 },  // purple
  { r: 6,   g: 182, b: 212, a: 0.5  },  // cyan
  { r: 52,  g: 231, b: 196, a: 0.6  },  // teal
  { r: 139, g: 92,  b: 246, a: 0.4  },  // violet
  { r: 14,  g: 165, b: 233, a: 0.5  },  // sky
];

function createParticles(count, W, H) {
  return Array.from({ length: count }, () => {
    const color = ARCTIC_COLORS[Math.floor(Math.random() * ARCTIC_COLORS.length)];
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.2 + 0.6,
      color,
      phase: Math.random() * Math.PI * 2, // for pulsing
    };
  });
}

export default function AuroraParticleCanvas({
  count = 100,
  repelRadius = 90,
  repelStrength = 1.8,
  className = "",
  height = 200,
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef(null);
  const isVisibleRef = useRef(false);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    particlesRef.current = createParticles(count, canvas.width, canvas.height);
  }, [count]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Mouse tracking
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio;
      mouseRef.current = {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    canvas.addEventListener("mousemove", handleMouseMove, { passive: true });
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // IntersectionObserver: pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    let t = 0;
    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      if (!isVisibleRef.current) return;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      t += 0.012;

      const particles = particlesRef.current;
      const { x: mx, y: my } = mouseRef.current;
      const repelR2 = repelRadius * repelRadius * window.devicePixelRatio * window.devicePixelRatio;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repel
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < repelR2 && dist2 > 0) {
          const dist = Math.sqrt(dist2);
          const force = (repelRadius * window.devicePixelRatio - dist) / (repelRadius * window.devicePixelRatio);
          p.vx += (dx / dist) * force * repelStrength * 0.06;
          p.vy += (dy / dist) * force * repelStrength * 0.06;
        }

        // Velocity damping + drift
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        // Pulsing alpha
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.8 + p.phase);
        const { r, g, b, a } = p.color;

        // Draw particle with soft radial glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        grad.addColorStop(0, `rgba(${r},${g},${b},${(a * pulse).toFixed(2)})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${(a * pulse * 0.3).toFixed(2)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw connections between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b2 = particles[j];
          const dx = a.x - b2.x;
          const dy = a.y - b2.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 4000 * window.devicePixelRatio) {
            const alpha = (1 - d2 / (4000 * window.devicePixelRatio)) * 0.12;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.strokeStyle = `rgba(99,102,241,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      observer.disconnect();
    };
  }, [resize, repelRadius, repelStrength]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full ${className}`}
      style={{
        height,
        willChange: "transform",
        pointerEvents: "auto",
      }}
      aria-hidden="true"
    />
  );
}
