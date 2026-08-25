"use client";

import React, { useRef, useEffect } from "react";

/**
 * GeometricConstellationCanvas:
 * Interactive 60fps Canvas bringing alive the user's uploaded Purple/Magenta Geometric Constellation & Neural Mesh.
 * - Deep Cosmic Indigo to Radiant Fuchsia/Magenta gradient
 * - Interconnected glowing white nodes with dynamic polygon triangulation
 * - Floating wireframe triangles drifting and rotating
 * - Interactive magnetic mouse links & ripple physics
 */
export default function GeometricConstellationCanvas({
  opacity = 1,
  interactive = true,
}) {
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
      initElements();
    };

    window.addEventListener("resize", onResize);

    // Mouse coordinates with smooth interpolation
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    const onMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    const onMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    if (interactive) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("mouseleave", onMouseLeave, { passive: true });
    }

    // 1. Stardust Particles
    let stars = [];
    // 2. Neural Cluster Nodes (Concentrated heavily on bottom-right and branching left)
    let nodes = [];
    // 3. Floating Wireframe Triangles
    let triangles = [];

    const initElements = () => {
      // Create Stars
      stars = [];
      const starCount = Math.floor((width * height) / 9000);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.8 + 0.8,
          alpha: Math.random() * 0.7 + 0.3,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
        });
      }

      // Create Cluster Nodes
      nodes = [];
      const clusterCenterX = width * 0.75;
      const clusterCenterY = height * 0.72;
      const clusterRadius = Math.min(width, height) * 0.45;

      // Bottom-right dense geodesic cluster
      const clusterNodeCount = 55;
      for (let i = 0; i < clusterNodeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.65) * clusterRadius;
        nodes.push({
          x: clusterCenterX + Math.cos(angle) * dist,
          y: clusterCenterY + Math.sin(angle) * dist,
          baseX: clusterCenterX + Math.cos(angle) * dist,
          baseY: clusterCenterY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 3 + 2.2,
          pulse: Math.random() * Math.PI,
        });
      }

      // Branching constellation nodes spanning across top and center
      const fieldNodeCount = 40;
      for (let i = 0; i < fieldNodeCount; i++) {
        const x = Math.random() * width * 0.85;
        const y = Math.random() * height * 0.9;
        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.55,
          vy: (Math.random() - 0.5) * 0.55,
          radius: Math.random() * 2.5 + 1.8,
          pulse: Math.random() * Math.PI,
        });
      }

      // Create Floating Triangles (Polygonal shards)
      triangles = [];
      const triCount = 18;
      for (let i = 0; i < triCount; i++) {
        triangles.push({
          x: Math.random() * (width * 0.75),
          y: Math.random() * (height * 0.85),
          size: Math.random() * 55 + 30,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.009,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          alpha: Math.random() * 0.5 + 0.35,
        });
      }
    };

    initElements();

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      // 1. Draw Deep Midnight Polar Gradient (Obsidian -> Slate Navy -> Subtle Glacier Indigo)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#05070e");
      bgGrad.addColorStop(0.35, "#0a0e1a");
      bgGrad.addColorStop(0.7, "#0e1526");
      bgGrad.addColorStop(0.92, "#121b30");
      bgGrad.addColorStop(1, "#16203a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient radial lighting on lower right (gentle polar glow, no eye glare)
      const radGlow = ctx.createRadialGradient(
        width * 0.8,
        height * 0.78,
        60,
        width * 0.8,
        height * 0.78,
        Math.min(width, height) * 0.85
      );
      radGlow.addColorStop(0, "rgba(56, 189, 248, 0.12)");
      radGlow.addColorStop(0.45, "rgba(99, 102, 241, 0.08)");
      radGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Stars
      for (let s of stars) {
        s.alpha += Math.sin(time * 2 + s.twinkleSpeed * 100) * 0.01;
        const currentAlpha = Math.max(0.2, Math.min(1.0, s.alpha));
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw Floating Wireframe Triangles
      for (let tri of triangles) {
        tri.x += tri.vx;
        tri.y += tri.vy;
        tri.angle += tri.rotSpeed;

        if (tri.x < -100) tri.x = width * 0.75 + 50;
        if (tri.x > width * 0.75 + 100) tri.x = -50;
        if (tri.y < -100) tri.y = height + 50;
        if (tri.y > height + 100) tri.y = -50;

        ctx.save();
        ctx.translate(tri.x, tri.y);
        ctx.rotate(tri.angle);

        ctx.strokeStyle = `rgba(233, 213, 255, ${tri.alpha})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();

        const s = tri.size;
        const p1 = { x: 0, y: -s };
        const p2 = { x: (Math.sqrt(3) / 2) * s, y: s / 2 };
        const p3 = { x: (-Math.sqrt(3) / 2) * s, y: s / 2 };

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.stroke();

        // Little corner nodes
        ctx.fillStyle = `rgba(255, 255, 255, ${tri.alpha * 1.5})`;
        [p1, p2, p3].forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      // 4. Update Node Positions with Soft Float & Mouse Dynamics
      for (let node of nodes) {
        node.pulse += 0.03;
        node.x += node.vx + Math.sin(node.pulse) * 0.4;
        node.y += node.vy + Math.cos(node.pulse) * 0.4;

        // Keep inside bounds
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Mouse Proximity Repulsion / Attraction
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 220 && dist > 1) {
            const force = (220 - dist) / 220;
            node.x += (dx / dist) * force * 4.2;
            node.y += (dy / dist) * force * 4.2;
          }
        }
      }

      // 5. Draw Interconnecting Constellation Web Lines
      const maxConnectDist = Math.min(width, height) * 0.25;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const lineAlpha = (1 - dist / maxConnectDist) * 0.35;
            ctx.strokeStyle = `rgba(148, 163, 184, ${lineAlpha})`;
            ctx.lineWidth = lineAlpha > 0.2 ? 1.2 : 0.8;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // 6. Draw Mouse Connection Laser Chords
      if (mouse.x > 0 && mouse.y > 0) {
        for (let node of nodes) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const mouseAlpha = (1 - dist / 200) * 0.45;
            ctx.strokeStyle = `rgba(56, 189, 248, ${mouseAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        }
      }

      // 7. Draw Glowing Nodes
      for (let node of nodes) {
        const glowRadius = node.radius + Math.sin(node.pulse) * 0.7;

        // Outer Soft Glow (Gentle cyan/indigo aura, no glare)
        const nodeGlow = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          glowRadius * 3.2
        );
        nodeGlow.addColorStop(0, "rgba(255, 255, 255, 0.85)");
        nodeGlow.addColorStop(0.4, "rgba(56, 189, 248, 0.3)");
        nodeGlow.addColorStop(1, "rgba(56, 189, 248, 0)");

        ctx.fillStyle = nodeGlow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius * 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Solid White Core
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      if (interactive) {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseleave", onMouseLeave);
      }
      cancelAnimationFrame(animId);
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity }}
    />
  );
}
