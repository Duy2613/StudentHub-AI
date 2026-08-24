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
  opacity = 0.95,
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
      const starCount = Math.floor((width * height) / 12000);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.7 + 0.3,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
        });
      }

      // Create Cluster Nodes
      nodes = [];
      const clusterCenterX = width * 0.78;
      const clusterCenterY = height * 0.75;
      const clusterRadius = Math.min(width, height) * 0.42;

      // Bottom-right dense geodesic cluster
      const clusterNodeCount = 45;
      for (let i = 0; i < clusterNodeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.7) * clusterRadius;
        nodes.push({
          x: clusterCenterX + Math.cos(angle) * dist,
          y: clusterCenterY + Math.sin(angle) * dist,
          baseX: clusterCenterX + Math.cos(angle) * dist,
          baseY: clusterCenterY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2.5 + 1.8,
          pulse: Math.random() * Math.PI,
        });
      }

      // Branching constellation nodes spanning across top and center
      const fieldNodeCount = 35;
      for (let i = 0; i < fieldNodeCount; i++) {
        const x = Math.random() * width * 0.8;
        const y = Math.random() * height * 0.85;
        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2.2 + 1.5,
          pulse: Math.random() * Math.PI,
        });
      }

      // Create Floating Triangles (Polygonal shards)
      triangles = [];
      const triCount = 14;
      for (let i = 0; i < triCount; i++) {
        triangles.push({
          x: Math.random() * (width * 0.7),
          y: Math.random() * (height * 0.8),
          size: Math.random() * 45 + 25,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.008,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          alpha: Math.random() * 0.45 + 0.25,
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

      // 1. Draw Deep Cosmic Gradient (Indigo -> Purple -> Radiant Magenta / Rose)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#120326");
      bgGrad.addColorStop(0.35, "#2a084e");
      bgGrad.addColorStop(0.7, "#6b1178");
      bgGrad.addColorStop(0.95, "#be185d");
      bgGrad.addColorStop(1, "#f43f5e");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient radial lighting on lower right
      const radGlow = ctx.createRadialGradient(
        width * 0.82,
        height * 0.8,
        50,
        width * 0.82,
        height * 0.8,
        Math.min(width, height) * 0.75
      );
      radGlow.addColorStop(0, "rgba(244, 63, 94, 0.45)");
      radGlow.addColorStop(0.5, "rgba(192, 38, 211, 0.25)");
      radGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Stars
      for (let s of stars) {
        s.alpha += Math.sin(time * 2 + s.twinkleSpeed * 100) * 0.01;
        const currentAlpha = Math.max(0.15, Math.min(0.9, s.alpha));
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

        if (tri.x < -100) tri.x = width * 0.7 + 50;
        if (tri.x > width * 0.7 + 100) tri.x = -50;
        if (tri.y < -100) tri.y = height + 50;
        if (tri.y > height + 100) tri.y = -50;

        ctx.save();
        ctx.translate(tri.x, tri.y);
        ctx.rotate(tri.angle);

        ctx.strokeStyle = `rgba(216, 180, 254, ${tri.alpha})`;
        ctx.lineWidth = 1.2;
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
        ctx.fillStyle = `rgba(255, 255, 255, ${tri.alpha * 1.4})`;
        [p1, p2, p3].forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      // 4. Update Node Positions with Soft Float & Mouse Dynamics
      for (let node of nodes) {
        node.pulse += 0.03;
        node.x += node.vx + Math.sin(node.pulse) * 0.35;
        node.y += node.vy + Math.cos(node.pulse) * 0.35;

        // Keep inside bounds
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Mouse Proximity Repulsion / Attraction
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 1) {
            const force = (180 - dist) / 180;
            node.x += (dx / dist) * force * 3.5;
            node.y += (dy / dist) * force * 3.5;
          }
        }
      }

      // 5. Draw Interconnecting Constellation Web Lines
      const maxConnectDist = Math.min(width, height) * 0.22;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const lineAlpha = (1 - dist / maxConnectDist) * 0.55;
            ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
            ctx.lineWidth = lineAlpha > 0.35 ? 1.4 : 0.8;
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
            const mouseAlpha = (1 - dist / 200) * 0.85;
            ctx.strokeStyle = `rgba(254, 215, 170, ${mouseAlpha})`;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        }
      }

      // 7. Draw Glowing Nodes
      for (let node of nodes) {
        const glowRadius = node.radius + Math.sin(node.pulse) * 0.8;

        // Outer Soft Glow
        const nodeGlow = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          glowRadius * 3.5
        );
        nodeGlow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        nodeGlow.addColorStop(0.4, "rgba(244, 114, 182, 0.5)");
        nodeGlow.addColorStop(1, "rgba(244, 114, 182, 0)");

        ctx.fillStyle = nodeGlow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Solid White Core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
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
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
      style={{ opacity }}
    />
  );
}
