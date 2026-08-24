"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { ShieldAlert, Users, MessageSquare, ArrowUpRight, Sparkles, CheckCircle2 } from "lucide-react";

/**
 * CurvedRoadTrack:
 * Generates the iconic Robin Payot 3D dotted highway track curving into the depth.
 */
function CurvedRoadTrack({ scrollProgress }) {
  const lanesCount = 7;
  const pointsPerLane = 140;

  const [positions, opacities] = useMemo(() => {
    const totalPoints = lanesCount * pointsPerLane;
    const pos = new Float32Array(totalPoints * 3);
    const opac = new Float32Array(totalPoints);

    let idx = 0;
    for (let l = 0; l < lanesCount; l++) {
      const laneOffset = (l - (lanesCount - 1) / 2) * 2.4;
      for (let p = 0; p < pointsPerLane; p++) {
        const z = -p * 1.8;
        // Serpentine S-curve in X space
        const curveX = Math.sin(z * 0.025) * 14 + laneOffset;
        const y = -3.2 + Math.cos(z * 0.02) * 1.2;

        pos[idx * 3] = curveX;
        pos[idx * 3 + 1] = y;
        pos[idx * 3 + 2] = z;

        // Depth falloff alpha
        opac[idx] = Math.max(0.1, 1 - (p / pointsPerLane) * 0.85);
        idx++;
      }
    }
    return [pos, opac];
  }, [lanesCount, pointsPerLane]);

  const pointsRef = useRef();

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const array = pointsRef.current.geometry.attributes.position.array;

    let idx = 0;
    for (let l = 0; l < lanesCount; l++) {
      const laneOffset = (l - (lanesCount - 1) / 2) * 2.4;
      for (let p = 0; p < pointsPerLane; p++) {
        const z = -p * 1.8;
        // Dynamic undulating road wave
        const curveX = Math.sin(z * 0.025 + t * 0.3) * 14 + laneOffset;
        const y = -3.2 + Math.cos(z * 0.02 + t * 0.2) * 1.2;

        array[idx * 3] = curveX;
        array[idx * 3 + 1] = y;
        array[idx * 3 + 2] = z;
        idx++;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color="#38bdf8"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * CurvedBillboard:
 * Robin Payot curved 3D project screens along the road track
 */
function CurvedBillboard({ position, rotationY = 0, title, subtitle, tag, icon: Icon, href, color = "#38bdf8", imageSrc }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[2]) * 0.2;
  });

  return (
    <group ref={meshRef} position={position} rotation={[0, rotationY, 0]}>
      {/* 3D Curved Plane Screen */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[9, 5.2, 32, 16]} />
        <meshPhysicalMaterial
          color={hovered ? "#38bdf8" : "#1e293b"}
          roughness={0.2}
          metalness={0.8}
          transmission={0.4}
          transparent
          opacity={0.88}
          emissive={hovered ? color : "#0f172a"}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Screen Glowing Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(9, 5.2)]} />
        <lineBasicMaterial color={hovered ? "#ffffff" : color} linewidth={2} />
      </lineSegments>

      {/* Thin Flagpost Line connecting to road floor */}
      <mesh position={[4.8, -3.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 6.4, 8]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Flagpost Node & Annotation HTML */}
      <Html position={[5.2, 0.6, 0]} distanceFactor={14} center={false}>
        <div className="select-none pointer-events-auto group/item cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div className="p-3 rounded-2xl bg-space-950/90 backdrop-blur-2xl border border-white/20 shadow-2xl min-w-[220px] transition-all duration-300 group-hover/item:scale-105 group-hover/item:border-cyan-400">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300">{tag}</span>
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-white mt-1">{title}</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

/**
 * FloatingChromeBlobs:
 * Metallic chrome spheres orbiting beside the road
 */
function FloatingChromeBlobs() {
  const blob1 = useRef();
  const blob2 = useRef();
  const blob3 = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (blob1.current) {
      blob1.current.position.y = Math.sin(t * 1.2) * 1.5;
      blob1.current.rotation.y = t * 0.4;
    }
    if (blob2.current) {
      blob2.current.position.y = 1 + Math.cos(t * 1.4) * 1.2;
      blob2.current.rotation.x = t * 0.5;
    }
    if (blob3.current) {
      blob3.current.position.y = -1 + Math.sin(t * 1.6) * 1.3;
      blob3.current.rotation.z = t * 0.3;
    }
  });

  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5} position={[-8, 1, -25]}>
        <mesh ref={blob1}>
          <sphereGeometry args={[1.6, 64, 64]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.95}
            roughness={0.05}
            envMapIntensity={1.5}
          />
        </mesh>
      </Float>

      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.8} position={[10, 2, -65]}>
        <mesh ref={blob2}>
          <sphereGeometry args={[2.2, 64, 64]} />
          <meshStandardMaterial
            color="#38bdf8"
            metalness={0.9}
            roughness={0.1}
            wireframe={true}
          />
        </mesh>
      </Float>

      <Float speed={3} rotationIntensity={0.4} floatIntensity={1.2} position={[-11, 0, -110]}>
        <mesh ref={blob3}>
          <sphereGeometry args={[1.9, 64, 64]} />
          <meshPhysicalMaterial
            color="#818cf8"
            metalness={0.8}
            roughness={0.15}
            transmission={0.6}
            transparent
            opacity={0.8}
          />
        </mesh>
      </Float>
    </>
  );
}

/**
 * CameraFlightController:
 * Glides the camera smoothly along the 3D road as the user scrolls
 */
function CameraFlightController({ scrollYProgress }) {
  const { camera, mouse } = useThree();

  useFrame(() => {
    // Total road depth = -150
    const targetZ = -(scrollYProgress * 140) + 12;
    const curveX = Math.sin(targetZ * 0.025) * 8 + mouse.x * 2.5;
    const targetY = 1.2 + mouse.y * 1.5;

    camera.position.z += (targetZ - camera.position.z) * 0.08;
    camera.position.x += (curveX - camera.position.x) * 0.08;
    camera.position.y += (targetY - camera.position.y) * 0.08;

    // Look ahead down the road
    const lookTargetX = Math.sin((targetZ - 20) * 0.025) * 12;
    camera.lookAt(lookTargetX, -0.5, targetZ - 25);
  });

  return null;
}

/**
 * Main RobinPayotRoadCanvas Component
 */
export default function RobinPayotRoadCanvas() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mode, setMode] = useState("ROAD"); // ROAD | OVERVIEW | LIST

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = Math.min(1, Math.max(0, window.scrollY / totalScroll));
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 w-full h-full">
      {/* 1. Deep Atmospheric Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b132b] via-[#1c2541] to-[#0b132b] opacity-95" />

      {/* 2. Three.js 3D WebGL Scene */}
      <Canvas
        camera={{ position: [0, 2, 12], fov: 50, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        className="w-full h-full"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 20, 15]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[-15, -5, -40]} intensity={2.0} color="#818cf8" />
        <pointLight position={[15, 10, -90]} intensity={2.0} color="#f43f5e" />

        <CameraFlightController scrollYProgress={scrollProgress} />
        <CurvedRoadTrack scrollProgress={scrollProgress} />
        <FloatingChromeBlobs />

        {/* Section 1: AI Scam Engine */}
        <CurvedBillboard
          position={[-6, 1.5, -20]}
          rotationY={0.25}
          tag="01 • XÁC THỰC AI"
          title="AI Scam Engine 4 Lớp"
          subtitle="Cơ chế Dừng Sớm (0.1s) & Phân tích giải trình XAI"
          icon={ShieldAlert}
          color="#38bdf8"
        />

        {/* Section 2: Trust Network */}
        <CurvedBillboard
          position={[7, 1.0, -55]}
          rotationY={-0.3}
          tag="02 • MẠNG LƯỚI CỐ VẤN"
          title="Mạng Lưới Chuyên Gia Uy Tín"
          subtitle="Trust Score (0–100 pts) • Thẩm định 2 chiều"
          icon={Users}
          color="#f59e0b"
        />

        {/* Section 3: Student Community Forum */}
        <CurvedBillboard
          position={[-7, 1.8, -90]}
          rotationY={0.28}
          tag="03 • DIỄN ĐÀN THỰC CHỨNG"
          title="Cộng Đồng Sinh Viên Toàn Quốc"
          subtitle="Vote Uy Tín • Nhà trọ • Quán ăn • Cảnh báo bẫy lừa"
          icon={MessageSquare}
          color="#818cf8"
        />

        {/* Section 4: National Contest & Mission */}
        <CurvedBillboard
          position={[6, 1.2, -125]}
          rotationY={-0.25}
          tag="04 • CUỘC THI QUỐC GIA 2026"
          title="Sáng Tạo Trẻ AI 2026"
          subtitle="100% Phi thương mại • Bảo vệ sinh viên số"
          icon={Sparkles}
          color="#34e7c4"
        />
      </Canvas>

      {/* 3. Minimalist HUD Top-Right Mode Switcher (Robin Payot Signature) */}
      <div className="fixed top-6 right-8 z-30 pointer-events-auto flex items-center gap-4 text-xs font-mono font-bold select-none">
        {["ROAD", "OVERVIEW", "LIST"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`transition-all duration-300 tracking-widest ${
              mode === m
                ? "text-cyan-300 border-b-2 border-cyan-400 pb-0.5 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 4. Minimalist HUD Bottom-Left (3 Intersecting Rings OOO & Visualizer) */}
      <div className="fixed bottom-6 left-8 z-30 pointer-events-auto flex items-center gap-3 select-none">
        <div className="flex -space-x-2 items-center">
          <div className="w-4 h-4 rounded-full border border-cyan-400 animate-spin" />
          <div className="w-4 h-4 rounded-full border border-indigo-400 animate-spin animation-delay-200" />
          <div className="w-4 h-4 rounded-full border border-purple-400 animate-spin animation-delay-400" />
        </div>
        <div className="flex items-center gap-0.5 h-3">
          <span className="w-0.5 h-3 bg-cyan-400 animate-pulse" />
          <span className="w-0.5 h-2 bg-cyan-400 animate-pulse animation-delay-150" />
          <span className="w-0.5 h-3.5 bg-cyan-400 animate-pulse animation-delay-300" />
          <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse animation-delay-450" />
        </div>
        <span className="text-[10px] font-mono text-cyan-300/80">3D ROAD HIGHWAY ACTIVE</span>
      </div>
    </div>
  );
}
