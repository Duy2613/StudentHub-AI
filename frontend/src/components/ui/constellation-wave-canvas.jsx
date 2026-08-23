"use client";

import React, { useRef, useEffect } from "react";

/**
 * ConstellationWaveCanvas: High-performance 2D Canvas combining:
 * 1. 3D Undulating Dot Wave (perspective-projected sine/cosine grid)
 * 2. Connected Geometric Constellation Network (floating nodes & polygonal triangular web)
 * 3. Interactive Elastic Cursor Forcefield & Multi-Hue Neon Halos
 */
export default function ConstellationWaveCanvas({
  mode = "cosmic-wave",
  density = "normal",
  opacity = 0.85,
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

    // Theme color palette definition
    const PALETTES = {
      "cosmic-wave": {
        dots: [
          { r: 99, g: 102, b: 241 },   // Indigo #6366f1
          { r: 52, g: 231, b: 196 },   // Cyan #34e7c4
          { r: 168, g: 85, b: 247 },   // Purple #a855f7
          { r: 245, g: 158, b: 11 },   // Warm Amber #f59e0b
          { r: 96, g: 165, b: 250 },   // Sky Blue #60a5fa
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

    // 1. Constellation Network Nodes (Floating Geometric Polygons)
    const nodeCount = density === "high" ? 65 : 45;
    const nodes = [];

    const initNodes = () => {
      nodes.length = 0;
      for (let i = 0; i < nodeCount; i++) {
        const color = activePalette.dots[i % activePalette.dots.length];
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          baseRadius: Math.random() * 2.2 + 1.2,
          radius: Math.random() * 2.2 + 1.2,
          color,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
        });
      }
    };

    // 2. 3D Undulating Wave Grid Parameters
    const gridCols = density === "high" ? 36 : 28;
    const gridRows = density === "high" ? 18 : 14;
    const gridSpacing = 42;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      initNodes();
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

    // Observer to pause animation when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    let time = 0;

    // Render loop
    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      time += 0.015;

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Additive blending for luminous glow
      ctx.globalCompositeOperation = "lighter";

      // ==========================================
      // LAYER 1: 3D Undulating Dot Wave Grid
      // ==========================================
      const fov = 420;
      const cameraZ = 350;
      const waveCenterY = height * 0.68;
      const waveCenterX = width * 0.5;

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const gx = (c - gridCols / 2) * gridSpacing;
          const gz = (r - gridRows / 2) * (gridSpacing * 0.9) + 50;

          // Compute 3D wave height y
          const distFromCenter = Math.hypot(gx, gz);
          let gy =
            Math.sin(gx * 0.022 + time * 1.3) *
              Math.cos(gz * 0.02 + time * 0.9) *
              32 +
            Math.sin((gx + gz) * 0.015 + time * 0.7) * 18;

          // Mouse perturbation ripple
          if (mouse.active) {
            // Project 3D coordinate to screen 2D to check mouse distance
            const scalePreview = fov / (gz + cameraZ);
            const sxPreview = gx * scalePreview + waveCenterX;
            const syPreview = gy * scalePreview + waveCenterY;
            const mouseDist = Math.hypot(mouse.x - sxPreview, mouse.y - syPreview);
            if (mouseDist < 180) {
              const push = Math.cos((mouseDist / 180) * Math.PI * 0.5) * 45;
              gy -= push;
            }
          }

          // 3D Perspective Projection
          const zDepth = gz + cameraZ;
          if (zDepth <= 10) continue;

          const scale = fov / zDepth;
          const sx = gx * scale + waveCenterX;
          const sy = gy * scale + waveCenterY;

          // Depth-based fade and sizing
          const depthAlpha = Math.max(0.1, Math.min(0.85, (1 - gz / 500) * 0.85));
          const dotSize = Math.max(0.8, (2.8 * scale) * (0.8 + Math.sin(time + c) * 0.2));

          const colorIdx = (c + r) % activePalette.dots.length;
          const color = activePalette.dots[colorIdx];

          // Draw Glowing Wave Dot
          ctx.beginPath();
          ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${depthAlpha * opacity})`;
          ctx.fill();

          // Connect neighboring wave dots horizontally
          if (c < gridCols - 1) {
            const nextGx = (c + 1 - gridCols / 2) * gridSpacing;
            const nextGy =
              Math.sin(nextGx * 0.022 + time * 1.3) *
                Math.cos(gz * 0.02 + time * 0.9) *
                32 +
              Math.sin((nextGx + gz) * 0.015 + time * 0.7) * 18;
            const nextScale = fov / zDepth;
            const nextSx = nextGx * nextScale + waveCenterX;
            const nextSy = nextGy * nextScale + waveCenterY;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(nextSx, nextSy);
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${depthAlpha * 0.22 * opacity})`;
            ctx.lineWidth = 0.75 * scale;
            ctx.stroke();
          }
        }
      }

      // ==========================================
      // LAYER 2: Geometric Constellation Network (Image 3 Style)
      // ==========================================
      const connectionDist = 135;
      const mouseConnectionDist = 175;

      // Update node positions with gentle elastic bounds
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // Bounce on boundaries
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // Mouse attraction/repulsion
        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150 && dist > 1) {
            const force = (1 - dist / 150) * 0.6;
            n.x -= (dx / dist) * force * 3;
            n.y -= (dy / dist) * force * 3;
          }
        }

        // Pulse radius
        n.pulse += n.pulseSpeed;
        n.radius = n.baseRadius + Math.sin(n.pulse) * 0.6;
      }

      // Draw constellation connecting lines & triangles
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];

        // Connect with other nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionDist) {
            const lineAlpha = (1 - dist / connectionDist) * 0.45 * opacity;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `${activePalette.lineColor}${lineAlpha})`;
            ctx.lineWidth = Math.max(0.5, (1 - dist / connectionDist) * 1.2);
            ctx.stroke();

            // Geometric Triangulation mesh shading for close triads
            for (let k = j + 1; k < nodes.length; k++) {
              const n3 = nodes[k];
              const d2 = Math.hypot(n2.x - n3.x, n2.y - n3.y);
              const d3 = Math.hypot(n1.x - n3.x, n1.y - n3.y);

              if (d2 < connectionDist * 0.85 && d3 < connectionDist * 0.85) {
                const polyAlpha =
                  (1 - (dist + d2 + d3) / (connectionDist * 2.5)) *
                  0.07 *
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

        // Connect with cursor if near
        if (mouse.active) {
          const mdx = mouse.x - n1.x;
          const mdy = mouse.y - n1.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < mouseConnectionDist) {
            const mAlpha = (1 - mdist / mouseConnectionDist) * 0.7 * opacity;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `${activePalette.lineAccent}${mAlpha})`;
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
        }

        // Draw Glowing Node Dot with Radial Halo
        const nodeGrad = ctx.createRadialGradient(
          n1.x,
          n1.y,
          0,
          n1.x,
          n1.y,
          n1.radius * 3.5
        );
        nodeGrad.addColorStop(
          0,
          `rgba(${n1.color.r}, ${n1.color.g}, ${n1.color.b}, ${0.95 * opacity})`
        );
        nodeGrad.addColorStop(
          0.4,
          `rgba(${n1.color.r}, ${n1.color.g}, ${n1.color.b}, ${0.5 * opacity})`
        );
        nodeGrad.addColorStop(1, `rgba(${n1.color.r}, ${n1.color.g}, ${n1.color.b}, 0)`);

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        // Node core solid dot
        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * opacity})`;
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
