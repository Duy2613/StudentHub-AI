"use client";

import React, { useEffect, useRef } from "react";

export default function SparklingStardustCanvas({ count = 75, speed = 0.6 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", onResize);

    const colors = ["#34e7c4", "#818cf8", "#fde047", "#a78bfa", "#38bdf8", "#ffffff"];

    // Initialize twinkling particles & diamond sparkles
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.7 + 0.2,
      baseAlpha: Math.random() * 0.6 + 0.2,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      phase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * speed * 0.4,
      vy: (Math.random() - 0.5) * speed * 0.4,
      isDiamondGlint: Math.random() > 0.65, // 35% are 4-point diamond glint stars
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.02,
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const drawDiamondStar = (cx, cy, size, alpha, color, rot) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      // 4-point star diamond flare
      ctx.moveTo(0, -size * 3.5);
      ctx.quadraticCurveTo(0, 0, size * 3.5, 0);
      ctx.quadraticCurveTo(0, 0, 0, size * 3.5);
      ctx.quadraticCurveTo(0, 0, -size * 3.5, 0);
      ctx.quadraticCurveTo(0, 0, 0, -size * 3.5);
      ctx.fill();

      // Bright center core
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = Math.min(1, alpha * 1.5);
      ctx.fill();

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.phase += p.twinkleSpeed;
        p.rotation += p.rotSpeed;
        const currentAlpha = p.baseAlpha + Math.sin(p.phase) * (p.baseAlpha * 0.65);

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Subtle mouse parallax
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 180 && dist > 1) {
          const force = (1 - dist / 180) * 0.6;
          p.x -= (dx / dist) * force;
          p.y -= (dy / dist) * force;
        }

        if (p.isDiamondGlint) {
          drawDiamondStar(p.x, p.y, p.size, Math.max(0.1, currentAlpha), p.color, p.rotation);
        } else {
          // Soft circular glow star
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0.1, currentAlpha);
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [count, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1] w-full h-full"
    />
  );
}
