"use client";

import React, { useEffect, useRef, useState } from "react";
import { Film } from "lucide-react";

export default function CinematicAtmosphereVideo() {
  const canvasRef = useRef(null);
  const [activeMode, setActiveMode] = useState("quantum"); // 'quantum' | 'neural' | 'aurora'

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle nodes for procedural video simulation
    const particleCount = 80;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2.2 + 0.8,
        color: i % 3 === 0 ? "rgba(52, 231, 196, " : i % 3 === 1 ? "rgba(99, 102, 241, " : "rgba(6, 182, 212, ",
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Soft Dynamic Gradient Atmosphere
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        50,
        width * 0.5,
        height * 0.45,
        width * 0.85
      );
      if (activeMode === "quantum") {
        gradient.addColorStop(0, "rgba(20, 35, 60, 0.45)");
        gradient.addColorStop(0.5, "rgba(10, 16, 32, 0.6)");
        gradient.addColorStop(1, "rgba(6, 8, 19, 0.95)");
      } else if (activeMode === "neural") {
        gradient.addColorStop(0, "rgba(35, 20, 65, 0.45)");
        gradient.addColorStop(0.5, "rgba(15, 10, 32, 0.6)");
        gradient.addColorStop(1, "rgba(6, 8, 19, 0.95)");
      } else {
        gradient.addColorStop(0, "rgba(10, 45, 45, 0.45)");
        gradient.addColorStop(0.5, "rgba(8, 25, 30, 0.6)");
        gradient.addColorStop(1, "rgba(6, 8, 19, 0.95)");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Anamorphic Light Flare Sweep
      const sweepX = (Math.sin(frame * 0.006) * 0.5 + 0.5) * width;
      const flareGrad = ctx.createRadialGradient(sweepX, height * 0.3, 10, sweepX, height * 0.3, width * 0.4);
      flareGrad.addColorStop(0, "rgba(52, 231, 196, 0.08)");
      flareGrad.addColorStop(1, "transparent");
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Connective Neural Mesh / Particle Web
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(52, 231, 196, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [activeMode]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 60fps Procedural Canvas Video Atmosphere */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" />

      {/* Grid Pattern Overlay for High-Tech USAvionix Precision */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "64px 64px"
        }}
      />

      {/* Floating Video Mode Selector (Bottom Right) */}
      <div className="pointer-events-auto fixed bottom-6 right-6 z-40 hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-[#060813]/85 px-3 py-1.5 backdrop-blur-xl shadow-xl">
        <Film className="h-3.5 w-3.5 text-teal-400" />
        <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">VIDEO ATMOSPHERE:</span>
        <div className="flex items-center gap-1">
          {["quantum", "neural", "aurora"].map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase transition-all ${
                activeMode === mode
                  ? "bg-teal-400/20 text-teal-300 font-bold border border-teal-400/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
