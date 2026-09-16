"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

const ATLAS_NODES = [
  { id: "trust", label: "Thẩm Định Bằng Chứng", x: -2.2, y: 0.8, z: 0.2, color: 0x45d69a, weight: 1.2 },
  { id: "community", label: "Cộng Đồng Trí Tuệ", x: 2.1, y: 1.2, z: -0.4, color: 0x65d8ff, weight: 1.0 },
  { id: "expert", label: "Hội đồng Chuyên Gia", x: 0.2, y: 2.0, z: 0.8, color: 0xffb66d, weight: 1.1 },
  { id: "policy", label: "Quy Chế Học Vụ", x: -1.4, y: -1.6, z: 0.5, color: 0x756bff, weight: 0.9 },
  { id: "scholarship", label: "Radar Học Bổng", x: 1.8, y: -1.4, z: -0.2, color: 0x34e7c4, weight: 0.8 },
  { id: "coi", label: "Kiểm Soát Xung Đột (COI)", x: -0.8, y: 0.2, z: -1.2, color: 0xff6377, weight: 0.85 },
  { id: "provenance", label: "Nguồn Độc Lập", x: 0.6, y: -0.4, z: 1.1, color: 0xf6f7fb, weight: 0.95 }
];

const ATLAS_EDGES = [
  [0, 3], [0, 5], [0, 6],
  [1, 0], [1, 2], [1, 4],
  [2, 0], [2, 5], [2, 6],
  [3, 6], [4, 6], [5, 6]
];

export default function KnowledgeAtlas3D({ className = "" }) {
  const mountRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isMobile] = useState(() => (
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  ));
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isWebGLReady, setIsWebGLReady] = useState(false);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState(0);
  const selectedNode = ATLAS_NODES[selectedNodeIdx];

  // 1. Observer to lazy-mount WebGL when within 450px of viewport (Desktop only)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return;
    }

    const container = mountRef.current;
    if (!container || typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return;
    }

    const prewarmObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          prewarmObserver.disconnect();
        }
      },
      { rootMargin: "450px 0px" }
    );

    prewarmObserver.observe(container);
    return () => prewarmObserver.disconnect();
  }, []);

  // 2. WebGL Lifecycle (Mounted only when near viewport on desktop, suspended when offscreen)
  useEffect(() => {
    if (!isNearViewport || isMobile) return;

    const container = mountRef.current;
    if (!container) return;

    let renderer, scene, camera, graphGroup;
    let animationFrameId;
    let mouseX = 0, mouseY = 0;
    let targetCameraX = 0, targetCameraY = 0;
    const nodeMeshes = [];
    const createdMaterials = [];
    const createdGeometries = [];

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        40,
        container.clientWidth / container.clientHeight,
        0.1,
        100
      );
      camera.position.set(0, 0, 7.5);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.5));
      container.appendChild(renderer.domElement);

      graphGroup = new THREE.Group();
      scene.add(graphGroup);

      // 1. Build Nodes
      const sphereGeo = new THREE.SphereGeometry(0.16, 16, 16);
      createdGeometries.push(sphereGeo);

      ATLAS_NODES.forEach((node, idx) => {
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(node.color),
          emissive: new THREE.Color(node.color),
          emissiveIntensity: 0.4,
          roughness: 0.2,
          metalness: 0.6
        });
        createdMaterials.push(mat);

        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.position.set(node.x, node.y, node.z);
        mesh.scale.set(node.weight, node.weight, node.weight);
        mesh.userData = { id: node.id, label: node.label, index: idx };
        graphGroup.add(mesh);
        nodeMeshes.push(mesh);

        // Luminous Glow Ring
        const ringGeo = new THREE.RingGeometry(0.24 * node.weight, 0.28 * node.weight, 24);
        createdGeometries.push(ringGeo);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(node.color),
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide
        });
        createdMaterials.push(ringMat);

        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(node.x, node.y, node.z);
        graphGroup.add(ring);
      });

      // 2. Build Synaptic Connecting Edges
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(0x65d8ff),
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending
      });
      createdMaterials.push(lineMat);

      const linePositions = [];
      ATLAS_EDGES.forEach(([i, j]) => {
        const n1 = ATLAS_NODES[i];
        const n2 = ATLAS_NODES[j];
        linePositions.push(n1.x, n1.y, n1.z);
        linePositions.push(n2.x, n2.y, n2.z);
      });

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
      createdGeometries.push(lineGeo);

      const lines = new THREE.LineSegments(lineGeo, lineMat);
      graphGroup.add(lines);

      // 3. Ambient Dust
      const dustCount = 80;
      const dustGeo = new THREE.BufferGeometry();
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount * 3; i += 3) {
        dustPos[i] = (Math.random() - 0.5) * 8;
        dustPos[i + 1] = (Math.random() - 0.5) * 6;
        dustPos[i + 2] = (Math.random() - 0.5) * 4;
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      createdGeometries.push(dustGeo);

      const dustMat = new THREE.PointsMaterial({
        size: 0.03,
        color: 0x756bff,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });
      createdMaterials.push(dustMat);

      const dust = new THREE.Points(dustGeo, dustMat);
      scene.add(dust);

      // 4. Lights
      const pLight1 = new THREE.PointLight(0x65d8ff, 3, 15);
      pLight1.position.set(3, 3, 4);
      scene.add(pLight1);

      const pLight2 = new THREE.PointLight(0x756bff, 3, 15);
      pLight2.position.set(-3, -2, 4);
      scene.add(pLight2);

      const amb = new THREE.AmbientLight(0x060813, 2);
      scene.add(amb);

      requestAnimationFrame(() => {
        setIsWebGLReady(true);
      });

      // 5. Scoped Pointer Interaction
      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetCameraX = mouseX * 0.8;
        targetCameraY = mouseY * 0.5;
      };

      let resizeRaf = null;
      const handleResize = () => {
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          if (!container || !renderer || !camera) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        });
      };

      container.addEventListener("pointermove", handleMouseMove, { passive: true });
      window.addEventListener("resize", handleResize, { passive: true });

      // 6. Adaptive RAF Lifecycle
      let isVisibleInViewport = true;
      let isTabHidden = typeof document !== "undefined" ? document.hidden : false;
      let isRunning = false;
      let clock = new THREE.Clock();

      const animate = () => {
        if (!isVisibleInViewport || isTabHidden) {
          isRunning = false;
          return;
        }

        animationFrameId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Organic topology drift
        graphGroup.rotation.y = Math.sin(t * 0.2) * 0.15;
        graphGroup.rotation.x = Math.cos(t * 0.15) * 0.08;

        // Camera gentle parallax follow
        camera.position.x += (targetCameraX - camera.position.x) * 0.03;
        camera.position.y += (targetCameraY - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);

        // Pulse node emissive intensity
        nodeMeshes.forEach((mesh, idx) => {
          mesh.material.emissiveIntensity = 0.35 + Math.sin(t * 2 + idx) * 0.2;
        });

        renderer.render(scene, camera);
      };

      const startAnimation = () => {
        if (!isRunning && isVisibleInViewport && !isTabHidden) {
          isRunning = true;
          clock.start();
          animate();
        }
      };

      const stopAnimation = () => {
        if (isRunning) {
          isRunning = false;
          cancelAnimationFrame(animationFrameId);
        }
      };

      // Viewport Intersection Observer for Atlas
      let viewportObserver = null;
      if (typeof IntersectionObserver !== "undefined") {
        viewportObserver = new IntersectionObserver(
          ([entry]) => {
            isVisibleInViewport = entry.isIntersecting;
            if (isVisibleInViewport) {
              startAnimation();
            } else {
              stopAnimation();
            }
          },
          { threshold: 0.05 }
        );
        viewportObserver.observe(container);
      } else {
        startAnimation();
      }

      // Tab Visibility Listener
      const handleVisibilityChange = () => {
        isTabHidden = document.hidden;
        if (isTabHidden) {
          stopAnimation();
        } else if (isVisibleInViewport) {
          startAnimation();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange, { passive: true });

      startAnimation();

      return () => {
        viewportObserver?.disconnect();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        container.removeEventListener("pointermove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        stopAnimation();
        if (renderer?.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        createdGeometries.forEach((g) => g.dispose());
        createdMaterials.forEach((m) => m.dispose());
        renderer.dispose();
      };
    } catch (err) {
      console.warn("Atlas WebGL init failed, using static asset:", err);
      requestAnimationFrame(() => {
        setHasWebGL(false);
      });
    }
  }, [isNearViewport, isMobile]);

  return (
    <div className={`knowledge-atlas-3d relative w-full h-full min-h-[460px] rounded-3xl overflow-hidden border border-white/10 bg-space-950/80 backdrop-blur-xl ${className}`}>
      {/* Three.js Canvas Container (rendered only when not on mobile) */}
      {!isMobile && <div ref={mountRef} className="absolute inset-0 w-full h-full" />}

      {/* Atmospheric Texture & Poster Fallback (active on mobile or until desktop WebGL is initialized) */}
      {(!hasWebGL || !isWebGLReady || isMobile) && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={V3_MEDIA.landing.atlas}
          alt="Knowledge Atlas Fallback"
          className="absolute inset-0 w-full h-full object-cover opacity-70 transition-opacity duration-700 pointer-events-none"
        />
      )}

      {/* Architectural Telemetry HUD Overlay */}
      <div className="absolute top-6 left-6 pointer-events-none z-10 flex flex-col gap-1.5 max-w-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
            LIVING KNOWLEDGE ATLAS // REALTIME TOPOLOGY
          </span>
        </div>
        <div className="p-3 rounded-xl bg-space-950/85 border border-white/10 backdrop-blur-md">
          <div className="text-xs font-mono font-bold text-white mb-0.5">
            CỤM ĐANG CHỌN: {selectedNode.label.toUpperCase()}
          </div>
          <p className="text-[11px] text-slate-400 font-serif italic">
            Mỗi thông tin là một điểm nút được đối soát đa chiều với văn bản và cộng đồng.
          </p>
        </div>
      </div>

      <div className="absolute top-6 right-6 pointer-events-none z-10 hidden sm:flex items-center gap-3 bg-space-900/80 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
        <span className="text-[10px] font-mono text-cyan-300">
          7 CLUSTERS ACTIVE · SHA-256 VERIFIED
        </span>
      </div>

      {/* Interactive Cluster Selector Pills */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {ATLAS_NODES.map((node, idx) => {
          const isSelected = selectedNodeIdx === idx;
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNodeIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer backdrop-blur-md ${
                isSelected
                  ? "bg-white text-space-950 font-bold shadow-lg shadow-white/15 scale-105"
                  : "bg-space-900/80 hover:bg-space-850 text-slate-300 border border-white/10"
              }`}
            >
              {node.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
