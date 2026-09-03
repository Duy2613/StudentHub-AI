"use client";

import React, { useRef, useEffect } from "react";

/**
 * ConstellationWaveCanvas: High-density, full-viewport 2D Canvas combining:
 * 1. Expansive 3D Undulating Dot Wave (spanning full width & height)
 * 2. Dense Geometric Constellation Network (110+ nodes with triangular polygon meshes)
 * 3. Interactive Elastic Cursor Laser Web & Multi-Hue Neon Halos
 */
export default function ConstellationWaveCanvas({
  mode = "cosmic-wave",
  density = "high",
  opacity = 0.95,
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId = null;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Theme color palettes
    const PALETTES = {
      "cosmic-wave": {
        dots: [
          { r: 99, g: 102, b: 241 },   // Indigo #6366f1
          { r: 52, g: 231, b: 196 },   // Cyan #34e7c4
          { r: 168, g: 85, b: 247 },   // Purple #a855f7
          { r: 245, g: 158, b: 11 },   // Warm Amber #f59e0b
          { r: 96, g: 165, b: 250 },   // Sky Blue #60a5fa
          { r: 236, g: 72, b: 153 },   // Pink Neon #ec4899
        ],
        lineColor: "rgba(99, 102, 241, ",
        lineAccent: "rgba(52, 231, 196, ",
        glowColor: "rgba(99, 102, 241, 0.4)",
      },
      "emerald-wave": {
        dots: [
          { r: 52, g: 231, b: 196 },   // Mint Cyan #34e7c4
          { r: 16, g: 185, b: 129 },   // Emerald #10b981
          { r: 20, g: 184, b: 166 },   // Teal #14b8a6
          { r: 245, g: 158, b: 11 },   // Amber Accent #f59e0b
          { r: 132, g: 204, b: 22 },   // Lime Accent #84cc16
        ],
        lineColor: "rgba(52, 231, 196, ",
        lineAccent: "rgba(16, 185, 129, ",
        glowColor: "rgba(52, 231, 196, 0.4)",
      },
      "amber-dust": {
        dots: [
          { r: 245, g: 158, b: 11 },   // Amber #f59e0b
          { r: 244, g: 63, b: 94 },    // Rose #f43f5e
          { r: 217, g: 119, b: 6 },    // Deep Amber
          { r: 168, g: 85, b: 247 },   // Violet
        ],
        lineColor: "rgba(245, 158, 11, ",
        lineAccent: "rgba(244, 63, 94, ",
        glowColor: "rgba(245, 158, 11, 0.4)",
      },
    };

    const activePalette = PALETTES[mode] || PALETTES["cosmic-wave"];

    // Mouse tracking with smooth lerp
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
    };

    // 1. Constellation Network Nodes
    const nodes = [];
    const stardust = [];

    const initScene = () => {
      nodes.length = 0;
      stardust.length = 0;

      const nodeCount = Math.max(90, Math.floor(width / 16));
      for (let i = 0; i < nodeCount; i++) {
        const color = activePalette.dots[i % activePalette.dots.length];
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          baseRadius: Math.random() * 2.4 + 1.4,
          radius: Math.random() * 2.4 + 1.4,
          color,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.03 + 0.015,
        });
      }

      // Sparkle Stardust Particles (Golden / Cyan sparkles drifting)
      const stardustCount = 60;
      for (let i = 0; i < stardustCount; i++) {
        stardust.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -Math.random() * 0.4 - 0.1,
          size: Math.random() * 1.8 + 0.6,
          alpha: Math.random() * 0.7 + 0.2,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.05 + 0.02,
          color: i % 3 === 0 ? "245, 158, 11" : i % 3 === 1 ? "52, 231, 196" : "168, 85, 247",
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      initScene();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    let time = 0;

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      time += 0.018;

      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      ctx.clearRect(0, 0, width, height);

      // Additive blending for vivid, bright color overlap
      ctx.globalCompositeOperation = "lighter";

      // ==========================================
      // LAYER 1: Full-Viewport 3D Undulating Dot Wave
      // ==========================================
      const gridCols = Math.max(52, Math.floor(width / 26));
      const gridRows = Math.max(26, Math.floor(height / 28));
      const gridSpacingX = (width * 1.45) / gridCols;
      const gridSpacingZ = (height * 1.35) / gridRows;

      const fov = 480;
      const cameraZ = 280;
      const waveCenterX = width * 0.5;
      const waveCenterY = height * 0.55;

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const gx = (c - gridCols / 2) * gridSpacingX;
          const gz = (r - gridRows / 2) * gridSpacingZ;

          // Compute complex undulating 3D wave height
          let gy =
            Math.sin(gx * 0.014 + time * 1.4) *
              Math.cos(gz * 0.012 + time * 1.1) *
              42 +
            Math.sin((gx + gz) * 0.009 + time * 0.8) * 25 +
            Math.cos(gx * 0.02 - time * 0.6) * 14;

          // Mouse ripple interaction
          if (mouse.active) {
            const scalePreview = fov / (gz + cameraZ);
            const sxPreview = gx * scalePreview + waveCenterX;
            const syPreview = gy * scalePreview + waveCenterY;
            const mDist = Math.hypot(mouse.x - sxPreview, mouse.y - syPreview);
            if (mDist < 220) {
              const push = Math.cos((mDist / 220) * Math.PI * 0.5) * 55;
              gy -= push;
            }
          }

          const zDepth = gz + cameraZ;
          if (zDepth <= 20) continue;

          const scale = fov / zDepth;
          const sx = gx * scale + waveCenterX;
          const sy = gy * scale + waveCenterY;

          // Screen bounds check
          if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) continue;

          const depthAlpha = Math.max(0.18, Math.min(0.95, (1 - gz / (height * 1.2)) * 0.95));
          const dotSize = Math.max(0.9, (2.6 * scale) * (0.85 + Math.sin(time * 1.5 + c * 0.3) * 0.25));

          const colorIdx = (c + r * 2) % activePalette.dots.length;
          const color = activePalette.dots[colorIdx];

          // Draw Glowing Dot
          ctx.beginPath();
          ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${depthAlpha * opacity})`;
          ctx.fill();

          // Connect neighboring dots horizontally
          if (c < gridCols - 1) {
            const nextGx = (c + 1 - gridCols / 2) * gridSpacingX;
            const nextGy =
              Math.sin(nextGx * 0.014 + time * 1.4) *
                Math.cos(gz * 0.012 + time * 1.1) *
                42 +
              Math.sin((nextGx + gz) * 0.009 + time * 0.8) * 25 +
              Math.cos(nextGx * 0.02 - time * 0.6) * 14;

            const nextSx = nextGx * scale + waveCenterX;
            const nextSy = nextGy * scale + waveCenterY;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(nextSx, nextSy);
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${depthAlpha * 0.32 * opacity})`;
            ctx.lineWidth = Math.max(0.4, 0.9 * scale);
            ctx.stroke();
          }

          // Connect neighboring dots vertically for full wireframe mesh
          if (r < gridRows - 1 && (r + c) % 2 === 0) {
            const nextGz = (r + 1 - gridRows / 2) * gridSpacingZ;
            const nextScale = fov / (nextGz + cameraZ);
            const nextSx = gx * nextScale + waveCenterX;
            const nextSy = (gy + 10) * nextScale + waveCenterY;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(nextSx, nextSy);
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${depthAlpha * 0.18 * opacity})`;
            ctx.lineWidth = Math.max(0.3, 0.6 * scale);
            ctx.stroke();
          }
        }
      }

      // ==========================================
      // LAYER 2: Floating Stardust Sparkles
      // ==========================================
      for (let i = 0; i < stardust.length; i++) {
        const s = stardust[i];
        s.x += s.vx;
        s.y += s.vy;
        s.twinkle += s.twinkleSpeed;

        if (s.y < 0) s.y = height;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;

        const currentAlpha = s.alpha * (0.6 + Math.sin(s.twinkle) * 0.4) * opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color}, ${currentAlpha})`;
        ctx.fill();
      }

      // ==========================================
      // LAYER 3: Dense Geometric Constellation Network (Image 3 Style)
      // ==========================================
      const connectionDist = 160;
      const mouseConnectionDist = 200;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180 && dist > 1) {
            const force = (1 - dist / 180) * 0.8;
            n.x -= (dx / dist) * force * 3.5;
            n.y -= (dy / dist) * force * 3.5;
          }
        }

        n.pulse += n.pulseSpeed;
        n.radius = n.baseRadius + Math.sin(n.pulse) * 0.8;
      }

      // Draw lines and polygon triangles
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionDist) {
            const lineAlpha = (1 - dist / connectionDist) * 0.55 * opacity;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `${activePalette.lineColor}${lineAlpha})`;
            ctx.lineWidth = Math.max(0.6, (1 - dist / connectionDist) * 1.5);
            ctx.stroke();

            // Geometric Triangulation shading
            for (let k = j + 1; k < nodes.length; k++) {
              const n3 = nodes[k];
              const d2 = Math.hypot(n2.x - n3.x, n2.y - n3.y);
              const d3 = Math.hypot(n1.x - n3.x, n1.y - n3.y);

              if (d2 < connectionDist * 0.88 && d3 < connectionDist * 0.88) {
                const polyAlpha =
                  (1 - (dist + d2 + d3) / (connectionDist * 2.6)) *
                  0.09 *
                  opacity;
                if (polyAlpha > 0.005) {
                  ctx.beginPath();
                  ctx.moveTo(n1.x, n1.y);
                  ctx.lineTo(n2.x, n2.y);
                  ctx.lineTo(n3.x, n3.y);
                  ctx.closePath();
                  ctx.fillStyle = `rgba(${n1.color.r}, ${n1.color.g}, ${n1.color.b}, ${polyAlpha})`;
                  ctx.fill();
                }
              }
            }
          }
        }

        // Connect with cursor
        if (mouse.active) {
          const mdx = mouse.x - n1.x;
          const mdy = mouse.y - n1.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < mouseConnectionDist) {
            const mAlpha = (1 - mdist / mouseConnectionDist) * 0.85 * opacity;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `${activePalette.lineAccent}${mAlpha})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
        }

        // Draw Glowing Node with Halo
        const nodeGrad = ctx.createRadialGradient(
          n1.x,
          n1.y,
          0,
          n1.x,
          n1.y,
          n1.radius * 4
        );
        nodeGrad.addColorStop(
          0,
          `rgba(${n1.color.r}, ${n1.color.g}, ${n1.color.b}, ${1.0 * opacity})`
        );
        nodeGrad.addColorStop(
          0.35,
          `rgba(${n1.color.r}, ${n1.color.g}, ${n1.color.b}, ${0.55 * opacity})`
        );
        nodeGrad.addColorStop(1, `rgba(${n1.color.r}, ${n1.color.g}, ${n1.color.b}, 0)`);

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * opacity})`;
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      observer.disconnect();
    };
  }, [mode, density, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
