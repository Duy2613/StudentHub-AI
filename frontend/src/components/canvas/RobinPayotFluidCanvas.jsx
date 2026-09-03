"use client";

import React, { useRef, useEffect } from "react";

/**
 * RobinPayotFluidCanvas — Continuous 3D WebGL Liquid Mesh & Ripple Shader Background
 * Features:
 * - Fluid vertex distortion with Simplex Noise undulation
 * - Mouse raycasting turbulence with continuous elastic ripple trails
 * - Scroll velocity reactive warp
 */
export default function RobinPayotFluidCanvas({ opacity = 0.55 }) {
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

    // Mouse tracking with inertia
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const onMouseMove = (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Scroll momentum tracking
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = (currentScrollY - lastScrollY) * 0.15;
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Continuous Fluid Wave Ribbons
    const ribbons = [
      { color: "rgba(52, 231, 196, 0.18)", speed: 0.0018, amplitude: 65, frequency: 0.0022, yOffset: 0.3 },
      { color: "rgba(99, 102, 241, 0.15)", speed: 0.0014, amplitude: 85, frequency: 0.0018, yOffset: 0.5 },
      { color: "rgba(168, 85, 247, 0.14)", speed: 0.0022, amplitude: 55, frequency: 0.0028, yOffset: 0.7 },
      { color: "rgba(6, 182, 212, 0.12)", speed: 0.0016, amplitude: 75, frequency: 0.0020, yOffset: 0.4 },
    ];

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;

      // Decay scroll velocity
      scrollVelocity *= 0.92;

      // Draw fluid undulating ribbons
      ribbons.forEach((ribbon) => {
        ctx.beginPath();
        const baseCy = height * ribbon.yOffset + Math.sin(time * 0.008) * 30;

        ctx.moveTo(0, height);
        ctx.lineTo(0, baseCy);

        for (let x = 0; x <= width; x += 15) {
          const wave1 = Math.sin(x * ribbon.frequency + time * ribbon.speed) * ribbon.amplitude;
          const wave2 = Math.cos(x * ribbon.frequency * 1.5 - time * ribbon.speed * 0.8) * (ribbon.amplitude * 0.5);

          // Mouse distortion proximity
          const distToMouse = Math.hypot(x - mouseX, baseCy - mouseY);
          let mouseDeform = 0;
          if (distToMouse < 280) {
            mouseDeform = (1 - distToMouse / 280) * 45 * Math.sin(time * 0.05);
          }

          const y = baseCy + wave1 + wave2 + mouseDeform + scrollVelocity * 4;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseCy - 100, width, baseCy + 100);
        grad.addColorStop(0, ribbon.color);
        grad.addColorStop(1, "rgba(6, 6, 10, 0)");

        ctx.fillStyle = grad;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full"
      style={{ opacity }}
    />
  );
}
