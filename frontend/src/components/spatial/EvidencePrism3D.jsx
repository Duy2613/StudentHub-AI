"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

export default function EvidencePrism3D({ className = "" }) {
  const mountRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile] = useState(() => (
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  ));

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    let renderer, scene, camera, prismGroup, particleSystem;
    let animationFrameId;
    let mouseX = 0, mouseY = 0;
    let targetRotX = 0, targetRotY = 0;

    try {
      // 1. Scene & Camera Setup
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
      );
      camera.position.z = 4.8;

      // 2. WebGL Renderer with High Dynamic Range & Sensible DPR Capping
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);

      // 3. Evidence Prism Group
      prismGroup = new THREE.Group();
      scene.add(prismGroup);

      // Primary Refractive Prism Geometry (Icosahedron / Octahedron Hybrid)
      const prismGeo = new THREE.OctahedronGeometry(1.2, 0);

      // Dual-layer Glass Material for Chromatic Refraction
      const innerGeo = new THREE.OctahedronGeometry(1.18, 0);
      const innerMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x756bff),
        emissive: new THREE.Color(0x18103c),
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.85,
        ior: 1.52,
        thickness: 1.2,
        transparent: true,
        opacity: 0.85
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      prismGroup.add(innerMesh);

      // Wireframe Facets for Academic Forensic Blueprint
      const wireMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x65d8ff),
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const wireMesh = new THREE.Mesh(prismGeo, wireMat);
      prismGroup.add(wireMesh);

      // Outer Specular Halo
      const outerMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x45d69a),
        roughness: 0.05,
        transmission: 0.95,
        ior: 1.7,
        thickness: 0.8,
        transparent: true,
        opacity: 0.4
      });
      const outerMesh = new THREE.Mesh(prismGeo, outerMat);
      outerMesh.scale.set(1.04, 1.04, 1.04);
      prismGroup.add(outerMesh);

      // 4. Spectral Refraction Ray Beams (Transformed Signal Beams Exiting Prism)
      const rayGroup = new THREE.Group();
      prismGroup.add(rayGroup);

      const rayColors = [0x756bff, 0x38bdf8, 0x34d399, 0xfbbf24];
      const rayLines = [];
      rayColors.forEach((col, idx) => {
        const rayGeo = new THREE.BufferGeometry();
        const angle = (idx / rayColors.length) * Math.PI * 2 + Math.PI / 4;
        const length = 3.2;
        const pts = new Float32Array([
          0, 0, 0,
          Math.cos(angle) * length, Math.sin(angle) * length, Math.sin(angle * 2) * 0.8
        ]);
        rayGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
        const rayMat = new THREE.LineBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(rayGeo, rayMat);
        rayGroup.add(line);
        rayLines.push({ line, geo: rayGeo, mat: rayMat, angle });
      });

      // 5. Orbiting Forensic Shards (Raw Claims Being Drawn into the Core)
      const shardGroup = new THREE.Group();
      scene.add(shardGroup);
      const shardGeo = new THREE.PlaneGeometry(0.18, 0.08);
      const shardMat = new THREE.MeshBasicMaterial({
        color: 0x65d8ff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const shards = [];
      for (let i = 0; i < 8; i++) {
        const shardMesh = new THREE.Mesh(shardGeo, shardMat);
        const sTheta = (i / 8) * Math.PI * 2;
        const sRad = 2.1 + (i % 3) * 0.4;
        shardMesh.position.set(
          Math.cos(sTheta) * sRad,
          Math.sin(sTheta * 2) * 0.7,
          Math.sin(sTheta) * sRad
        );
        shardGroup.add(shardMesh);
        shards.push({ mesh: shardMesh, baseAngle: sTheta, radius: sRad, speed: 0.008 + (i % 4) * 0.004 });
      }

      // 6. Luminous Evidence Dust Particles
      const particleCount = 140;
      const particleGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      const colorArray = new Float32Array(particleCount * 3);

      const colorPalette = [
        new THREE.Color(0x756bff), // Indigo-Violet
        new THREE.Color(0x65d8ff), // Sky Cyan
        new THREE.Color(0x45d69a)  // Mineral Mint
      ];

      for (let i = 0; i < particleCount * 3; i += 3) {
        const r = 1.6 + Math.random() * 2.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        posArray[i] = r * Math.sin(phi) * Math.cos(theta);
        posArray[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        posArray[i + 2] = r * Math.cos(phi);

        const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colorArray[i] = col.r;
        colorArray[i + 1] = col.g;
        colorArray[i + 2] = col.b;
      }

      particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      particleGeo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      particleSystem = new THREE.Points(particleGeo, particleMat);
      scene.add(particleSystem);

      // 7. 3-Point Pillar Light Rig
      const lightViolet = new THREE.PointLight(0x756bff, 4.5, 12);
      lightViolet.position.set(-2.5, 2.5, 2.5);
      scene.add(lightViolet);

      const lightCyan = new THREE.PointLight(0x65d8ff, 4, 12);
      lightCyan.position.set(2.5, -2, 2.5);
      scene.add(lightCyan);

      const lightMint = new THREE.PointLight(0x45d69a, 3, 10);
      lightMint.position.set(0, 3, -2);
      scene.add(lightMint);

      const ambientLight = new THREE.AmbientLight(0x060813, 1.8);
      scene.add(ambientLight);

      requestAnimationFrame(() => {
        setIsLoaded(true);
      });

      // 8. Interaction Listeners with Scoped Tracking
      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotY = mouseX * 0.8;
        targetRotX = mouseY * 0.6;
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

      // 9. Adaptive RAF Lifecycle (Intersection + Visibility Gating)
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
        const elapsedTime = clock.getElapsedTime();

        // Continuous subtle rotation + dampened mouse tracking
        prismGroup.rotation.y += (targetRotY - prismGroup.rotation.y) * 0.04 + 0.003;
        prismGroup.rotation.x += (targetRotX - prismGroup.rotation.x) * 0.04;
        prismGroup.rotation.z = Math.sin(elapsedTime * 0.4) * 0.08;

        // Breathing scale pulsation
        const pulse = 1 + Math.sin(elapsedTime * 0.8) * 0.02;
        innerMesh.scale.set(pulse, pulse, pulse);

        // Ray beams dynamic shimmer & elongation
        rayLines.forEach((r, idx) => {
          r.mat.opacity = 0.35 + Math.sin(elapsedTime * 2 + idx) * 0.2;
        });

        // Orbiting forensic shards: revolving towards the prism
        shards.forEach((s) => {
          const currentAngle = s.baseAngle + elapsedTime * s.speed * 8;
          s.mesh.position.x = Math.cos(currentAngle) * s.radius;
          s.mesh.position.z = Math.sin(currentAngle) * s.radius;
          s.mesh.position.y = Math.sin(currentAngle * 2) * 0.5;
          s.mesh.rotation.y = currentAngle + Math.PI / 2;
        });

        // Slow particle drift
        particleSystem.rotation.y = elapsedTime * 0.05;
        particleSystem.rotation.x = Math.sin(elapsedTime * 0.03) * 0.1;

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

      // Intersection Observer for Viewport-Based RAF Suspension
      let observer = null;
      if (typeof IntersectionObserver !== "undefined") {
        observer = new IntersectionObserver(
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
        observer.observe(container);
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

      // Cleanup
      return () => {
        observer?.disconnect();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        container.removeEventListener("pointermove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        stopAnimation();
        if (renderer?.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        prismGeo.dispose();
        innerGeo.dispose();
        innerMat.dispose();
        wireMat.dispose();
        outerMat.dispose();
        rayLines.forEach(r => {
          r.geo.dispose();
          r.mat.dispose();
        });
        shardGeo.dispose();
        shardMat.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        renderer.dispose();
      };
    } catch (err) {
      console.warn("WebGL initialization failed, falling back to canonical poster:", err);
      requestAnimationFrame(() => {
        setHasWebGL(false);
      });
    }
  }, []);

  if (isMobile) {
    return (
      <div
        className={`evidence-prism-3d relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden pointer-events-none ${className}`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={V3_MEDIA.landing.prism}
          alt="Lăng Kính Phản Chiếu"
          className="w-full h-full max-h-[360px] object-contain filter drop-shadow-[0_0_35px_rgba(117,107,255,0.4)] animate-float-slow"
        />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`evidence-prism-3d relative w-full h-full min-h-[360px] flex items-center justify-center overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {(!hasWebGL || !isLoaded) && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={V3_MEDIA.landing.prism}
          alt=""
          className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_0_40px_rgba(117,107,255,0.35)] transition-opacity duration-700"
        />
      )}
    </div>
  );
}
