"use client";

// components/canvas/Hero3DCanvas.jsx
// Interactive Flow Wave & Verification Core with Three.js / React Three Fiber + Glassmorphism HUD Pins
// Floating HUD Pins: AI Scam Engine (4-Layer), Expert Trust Network (0-100 pts), Community Verification

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { ShieldAlert, ShieldCheck, Users, Sparkles, ArrowUpRight, CheckCircle2 } from "lucide-react";

// Interactive Particle Wave Field
function ParticleWaveField() {
  const count = 1200;
  const meshRef = useRef();

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const color1 = new THREE.Color("#02160c");
    const color2 = new THREE.Color("#34e7c4");
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 4;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const alpha = (x + 8) / 16;
      tempColor.lerpColors(color1, color2, alpha);
      cols[i * 3] = tempColor.r;
      cols[i * 3 + 1] = tempColor.g;
      cols[i * 3 + 2] = tempColor.b;
    }
    return [pos, cols];
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      const array = meshRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const u = i * 3;
        const x = array[u];
        const z = array[u + 2];
        array[u + 1] = Math.sin(t * 1.2 + x * 0.4) * 0.4 + Math.cos(t * 0.9 + z * 0.4) * 0.3;
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Central Hologram Verification Core & Orbital HUD Pins
function VerificationHologramCore({ hoverPin, setHoverPin }) {
  const coreRef = useRef();
  const innerRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.35;
      coreRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.5;
      innerRef.current.rotation.z = Math.cos(t * 0.3) * 0.2;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.4;
      ring1Ref.current.rotation.y = t * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.3;
      ring2Ref.current.rotation.z = t * 0.25;
    }
  });

  return (
    <group ref={coreRef}>
      {/* Outer Hologram Shield Octahedron */}
      <mesh>
        <octahedronGeometry args={[1.7, 0]} />
        <meshPhysicalMaterial
          color="#34e7c4"
          transmission={0.85}
          opacity={0.65}
          transparent={true}
          roughness={0.15}
          ior={1.4}
          thickness={1.1}
          emissive="#02160c"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Wireframe Shield Matrix */}
      <mesh>
        <octahedronGeometry args={[1.75, 0]} />
        <meshBasicMaterial color="#34e7c4" wireframe={true} transparent={true} opacity={0.4} />
      </mesh>

      {/* Inner Glowing AI Pulse Sphere */}
      <Sphere ref={innerRef} args={[0.85, 32, 32]}>
        <MeshDistortMaterial
          color="#064e3b"
          attach="material"
          distort={0.4}
          speed={2.5}
          roughness={0.2}
          metalness={0.8}
          emissive="#34e7c4"
          emissiveIntensity={0.6}
        />
      </Sphere>

      {/* Orbital Quantum Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.4, 0.02, 16, 100]} />
        <meshBasicMaterial color="#34e7c4" transparent opacity={0.65} />
      </mesh>

      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.8, 0.015, 16, 100]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.5} />
      </mesh>

      {/* Floating HUD Pin 1: AI Scam Checker */}
      <Float speed={2.5} rotationIntensity={0.2} floatIntensity={1.5} position={[-2.7, 1.3, 0.4]}>
        <Html distanceFactor={8} center position={[0, 0, 0]}>
          <div
            onMouseEnter={() => setHoverPin("checker")}
            onMouseLeave={() => setHoverPin(null)}
            className="group cursor-pointer p-3 rounded-2xl bg-space-950/90 backdrop-blur-xl border border-teal-500/40 shadow-[0_0_25px_rgba(52,231,196,0.35)] transition-all duration-300 hover:scale-110 hover:border-teal-400 select-none min-w-[200px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>AI Scam Engine</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </p>
                <p className="text-[10px] text-teal-300 font-medium">Động Cơ Phân Tích 4 Lớp</p>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-2.5 h-2.5" /> Dừng sớm (0.1s)
              </span>
              <span>Link, Text & OCR</span>
            </div>
          </div>
        </Html>
      </Float>

      {/* Floating HUD Pin 2: Chuyên Gia Uy Tín */}
      <Float speed={3.0} rotationIntensity={0.25} floatIntensity={1.8} position={[2.8, 1.0, -0.3]}>
        <Html distanceFactor={8} center position={[0, 0, 0]}>
          <div
            onMouseEnter={() => setHoverPin("expert")}
            onMouseLeave={() => setHoverPin(null)}
            className="group cursor-pointer p-3 rounded-2xl bg-space-950/90 backdrop-blur-xl border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-110 hover:border-amber-400 select-none min-w-[200px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Mạng Lưới Chuyên Gia</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </p>
                <p className="text-[10px] text-amber-300 font-medium">Trust Score (0–100 pts)</p>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400">
              <span className="text-amber-400 font-semibold">+30 pts Email Edu</span>
              <span>Top 5 Bảng xếp hạng</span>
            </div>
          </div>
        </Html>
      </Float>

      {/* Floating HUD Pin 3: Diễn Đàn Xác Thực */}
      <Float speed={2.0} rotationIntensity={0.15} floatIntensity={1.2} position={[0, -2.3, 0.7]}>
        <Html distanceFactor={8} center position={[0, 0, 0]}>
          <div
            onMouseEnter={() => setHoverPin("forum")}
            onMouseLeave={() => setHoverPin(null)}
            className="group cursor-pointer p-3 rounded-2xl bg-space-950/90 backdrop-blur-xl border border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all duration-300 hover:scale-110 hover:border-indigo-400 select-none min-w-[220px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Diễn Đàn Xác Thực</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </p>
                <p className="text-[10px] text-indigo-300 font-medium">Vote Uy Tín • Nhà Trọ • Quán Ăn</p>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400">
              <span>Đại học toàn quốc</span>
              <span className="text-indigo-400 font-semibold">Cộng đồng Sinh viên</span>
            </div>
          </div>
        </Html>
      </Float>
    </group>
  );
}

export default function Hero3DCanvas() {
  const [hoverPin, setHoverPin] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[420px] sm:h-[500px] flex items-center justify-center bg-transparent">
        <div className="w-14 h-14 rounded-full border-2 border-teal-500/30 border-t-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[420px] sm:h-[500px] overflow-hidden rounded-3xl">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-teal-900/15 via-transparent to-transparent pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.4} color="#34e7c4" />
        <pointLight position={[-10, -10, -10]} intensity={1.2} color="#6366f1" />
        <directionalLight position={[0, 5, 5]} intensity={0.7} color="#f59e0b" />

        <ParticleWaveField />
        <VerificationHologramCore hoverPin={hoverPin} setHoverPin={setHoverPin} />
      </Canvas>

      {/* Interactive Micro-badge Overlay */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-space-950/80 backdrop-blur-md border border-white/10 text-[11px] text-gray-300 flex items-center gap-2 pointer-events-none shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
        <span>Mô phỏng 3D: Di chuột để tương tác với các khối xác thực</span>
      </div>
    </div>
  );
}
