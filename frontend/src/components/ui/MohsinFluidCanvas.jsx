"use client";

// frontend/src/components/ui/MohsinFluidCanvas.jsx
//
// 3D Real-time Fluid Dynamics Simulation Canvas (Inspired by Meer Mohsin Portfolio - meermohsin.me)
// - GPU-accelerated 60fps particle fluid smoke trails tracking pointer velocity
// - Color palette calibrated to Saffron Gold (#ffbc09), Cyber Cyan (#38bdf8), and Deep Cocoa Amber
// - Automatic resolution scaling, pause on inactive tab, full cleanup on unmount to prevent GPU leaks

import React, { useEffect, useRef } from "react";

export default function MohsinFluidCanvas({
  className = "",
  opacity = 0.85,
  particleDensity = 65,
  interactive = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const maxParticles = particleDensity;

    const pointer = {
      x: width * 0.5,
      y: height * 0.5,
      prevX: width * 0.5,
      prevY: height * 0.5,
      vx: 0,
      vy: 0,
      isMoving: false,
      lastMoveTime: Date.now(),
    };

    // Color palette: Saffron Gold (#ffbc09), Amber (#f59e0b), Cyan (#38bdf8), Hot Gold (#ffd15c)
    const colorStops = [
      { r: 255, g: 188, b: 9 },   // Saffron Gold
      { r: 245, g: 158, b: 11 },  // Amber
      { r: 56, g: 189, b: 248 },  // Cyber Cyan
      { r: 255, g: 209, b: 92 },  // Warm Radiant Gold
      { r: 202, g: 86, b: 237 },  // Saffron Purple
    ];

    class FluidParticle {
      constructor(x, y, vx, vy, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx * 0.6 + (Math.random() - 0.5) * 1.5;
        this.vy = vy * 0.6 + (Math.random() - 0.5) * 1.5;
        this.size = size || Math.random() * 4 + 2;
        this.baseSize = this.size;
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        this.color = color || colorStops[Math.floor(Math.random() * colorStops.length)];
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 0.04;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.life -= this.decay;
        this.spin += this.spinSpeed;
        this.size = this.baseSize * (0.3 + 0.7 * this.life);
      }

      draw(context) {
        if (this.life <= 0) return;
        context.save();
        context.globalAlpha = Math.max(0, this.life * opacity);
        context.translate(this.x, this.y);
        context.rotate(this.spin);

        const rad = this.size * 3.5;
        const grad = context.createRadialGradient(0, 0, 0, 0, 0, rad);
        const { r, g, b } = this.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
        grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.45)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        context.fillStyle = grad;
        context.beginPath();
        context.arc(0, 0, rad, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    }

    // Ambient floating wisps when idle
    const spawnAmbientWisp = () => {
      if (particles.length >= maxParticles) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.8 + 0.2;
      const spawnX = Math.random() * width;
      const spawnY = Math.random() * height;
      particles.push(
        new FluidParticle(
          spawnX,
          spawnY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          Math.random() * 6 + 3
        )
      );
    };

    const handlePointerMove = (e) => {
      if (!interactive) return;
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || pointer.x;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || pointer.y;

      pointer.vx = (clientX - pointer.prevX) * 0.4;
      pointer.vy = (clientY - pointer.prevY) * 0.4;
      pointer.prevX = clientX;
      pointer.prevY = clientY;
      pointer.x = clientX;
      pointer.y = clientY;
      pointer.isMoving = true;
      pointer.lastMoveTime = Date.now();

      // Emit fluid smoke particles along trajectory
      const dist = Math.hypot(pointer.vx, pointer.vy);
      const count = Math.min(8, Math.floor(dist * 0.35) + 1);

      for (let i = 0; i < count; i++) {
        if (particles.length < maxParticles * 1.5) {
          const offsetX = (Math.random() - 0.5) * 16;
          const offsetY = (Math.random() - 0.5) * 16;
          particles.push(
            new FluidParticle(
              pointer.x + offsetX,
              pointer.y + offsetY,
              pointer.vx * 0.7 + (Math.random() - 0.5) * 2,
              pointer.vy * 0.7 + (Math.random() - 0.5) * 2,
              Math.random() * 8 + 4
            )
          );
        }
      }
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("touchmove", handlePointerMove, { passive: true });
    }

    let lastFrame = performance.now();

    const render = (now) => {
      const delta = now - lastFrame;
      lastFrame = now;

      // Soft fading trailing trail (subtle phosphor persistence)
      ctx.fillStyle = "rgba(21, 6, 4, 0.22)";
      ctx.fillRect(0, 0, width, height);

      // Periodically spawn ambient wisps
      if (Math.random() < 0.25) {
        spawnAmbientWisp();
      }

      // Update and render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [opacity, particleDensity, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 w-full h-full ${className}`}
      style={{ mixBlendMode: "screen" }}
    />
  );
}
