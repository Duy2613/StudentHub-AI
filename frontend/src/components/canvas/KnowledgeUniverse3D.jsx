"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { KNOWLEDGE_DOMAINS, KNOWLEDGE_RELATIONS } from "./knowledgeUniverseData";

// Preserve the existing import surface for callers that only need the graph
// ontology. The data module remains free of the WebGL dependency.
export { KNOWLEDGE_DOMAINS, KNOWLEDGE_RELATIONS } from "./knowledgeUniverseData";

/**
 * Device Quality Tier evaluation
 */
function getDeviceQualityTier() {
  if (typeof window === "undefined") return "low";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return "reduced";
  const width = window.innerWidth;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency || 4;
  if (width < 768 || isCoarse || cores < 4) return "low";
  if (width < 1200 || cores < 8) return "medium";
  return "high";
}

export default function KnowledgeUniverse3D({
  activeNodeId = null,
  onSelectNode = () => {},
  className = "",
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const activeNodeIdRef = useRef(activeNodeId);
  const [qualityTier] = useState(getDeviceQualityTier);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    activeNodeIdRef.current = activeNodeId;
  }, [activeNodeId]);

  useEffect(() => {
    // If reduced-motion or low-tier or WebGL unsupported, use crisp SVG fallback
    if (qualityTier === "reduced" || qualityTier === "low") {
      return undefined;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: qualityTier === "high",
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setWebglSupported(false));
      return undefined;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, qualityTier === "high" ? 1.75 : 1.25);
    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth, container.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 6.2);

    // Particle starfield budget based on quality tier
    const particleCount = qualityTier === "high" ? 320 : 140;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(particleCount * 3);
    const starColors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color("#756BFF"),
      new THREE.Color("#65D8FF"),
      new THREE.Color("#FFB66D"),
      new THREE.Color("#45D69A"),
    ];

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      starPositions[idx] = (Math.random() - 0.5) * 12;
      starPositions[idx + 1] = (Math.random() - 0.5) * 10;
      starPositions[idx + 2] = (Math.random() - 0.5) * 8 - 2;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[idx] = col.r;
      starColors[idx + 1] = col.g;
      starColors[idx + 2] = col.b;
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Relational lines between connected domains
    const lineCoords = [];
    KNOWLEDGE_RELATIONS.forEach(([fromId, toId]) => {
      const from = KNOWLEDGE_DOMAINS.find((d) => d.id === fromId);
      const to = KNOWLEDGE_DOMAINS.find((d) => d.id === toId);
      if (from && to) {
        lineCoords.push(from.x, from.y, from.z, to.x, to.y, to.z);
      }
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lineCoords, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x756bff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);

    // 3D Nodes
    const nodeMeshes = [];
    const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);

    KNOWLEDGE_DOMAINS.forEach((domain) => {
      const isSelected = domain.id === activeNodeIdRef.current;
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(domain.color),
        transparent: true,
        opacity: isSelected ? 1.0 : 0.85,
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(domain.x, domain.y, domain.z);
      mesh.userData = { id: domain.id };
      scene.add(mesh);
      nodeMeshes.push({ mesh, domain, mat });
    });

    // Single RAF Governance & Visibility Observer
    let isVisible = true;
    let animId;
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.4;
      targetY = y * 0.3;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const timer = new THREE.Timer();
    timer.connect(document);

    const renderLoop = (time) => {
      animId = requestAnimationFrame(renderLoop);
      if (!isVisible) return;

      timer.update(time);
      const elapsed = timer.getElapsed();

      // Selecting a node only updates material opacity; it must not tear down
      // and recreate the renderer, listeners, and GPU resources.
      const selectedId = activeNodeIdRef.current;
      nodeMeshes.forEach(({ domain, mat }) => {
        mat.opacity = domain.id === selectedId ? 1.0 : 0.85;
      });

      // Smooth camera orientation lerp
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      camera.position.x = mouseX;
      camera.position.y = mouseY;
      camera.lookAt(0, 0, 0);

      // Subtle constellation drift
      lineMesh.rotation.y = elapsed * 0.03;
      starField.rotation.y = elapsed * 0.015;

      renderer.render(scene, camera);
    };

    renderLoop();

    // Comprehensive unmount cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();

      starGeometry.dispose();
      starMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      sphereGeo.dispose();
      nodeMeshes.forEach(({ mat }) => mat.dispose());
      renderer.dispose();
      timer.dispose();
    };
  }, [qualityTier]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Không gian tri thức liên kết (Knowledge Universe)"
      className={`relative w-full h-full min-h-[420px] lg:min-h-[560px] flex items-center justify-center overflow-hidden ${className}`}
    >
      {/* 2.5D SVG/CSS Fallback for Low/Reduced Motion/No-WebGL */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Ambient atmospheric depth rings */}
        <div className="absolute w-80 h-80 lg:w-[460px] lg:h-[460px] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute w-60 h-60 lg:w-80 lg:h-80 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        <svg
          className="pointer-events-auto w-full h-full max-w-[580px] max-h-[520px] p-6"
          viewBox="-3 -2.5 6 5"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Sơ đồ quan hệ các lĩnh vực tri thức"
        >
          {/* Relational edges */}
          {KNOWLEDGE_RELATIONS.map(([fromId, toId], idx) => {
            const from = KNOWLEDGE_DOMAINS.find((d) => d.id === fromId);
            const to = KNOWLEDGE_DOMAINS.find((d) => d.id === toId);
            if (!from || !to) return null;
            const isHighlight = from.id === activeNodeId || to.id === activeNodeId;
            return (
              <line
                key={`edge-${idx}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHighlight ? "#65D8FF" : "rgba(117, 107, 255, 0.28)"}
                strokeWidth={isHighlight ? "0.04" : "0.02"}
                strokeDasharray={isHighlight ? "none" : "0.05, 0.05"}
                className="transition-colors duration-300"
              />
            );
          })}

          {/* Interactive domain nodes */}
          {KNOWLEDGE_DOMAINS.map((domain) => {
            const isSelected = domain.id === activeNodeId;
            return (
              <g
                key={domain.id}
                role="button"
                tabIndex={0}
                aria-label={`${domain.label} (${domain.domain})`}
                className="pointer-events-auto cursor-pointer outline-none group"
                onClick={() => onSelectNode(domain.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectNode(domain.id);
                  }
                }}
              >
                {/* Node halo */}
                <circle
                  cx={domain.x}
                  cy={domain.y}
                  r={isSelected ? 0.32 : 0.22}
                  fill={domain.color}
                  fillOpacity={isSelected ? 0.3 : 0.12}
                  className="transition-all duration-300 group-hover:fill-opacity-40"
                />
                {/* Core node */}
                <circle
                  cx={domain.x}
                  cy={domain.y}
                  r={isSelected ? 0.14 : 0.1}
                  fill={domain.color}
                  stroke="#070A12"
                  strokeWidth="0.03"
                  className="transition-all duration-300 group-hover:scale-125"
                />
                {/* Node label */}
                <text
                  x={domain.x}
                  y={domain.y + 0.32}
                  textAnchor="middle"
                  fill="#F6F7FB"
                  fontSize="0.14"
                  fontWeight={isSelected ? "600" : "500"}
                  className="font-mono select-none drop-shadow-md"
                >
                  {domain.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* WebGL Canvas Layer (Active for High/Med non-reduced tiers) */}
      {webglSupported && qualityTier !== "reduced" && qualityTier !== "low" && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
