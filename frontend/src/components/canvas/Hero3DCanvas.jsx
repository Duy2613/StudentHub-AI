"use client";

// components/canvas/Hero3DCanvas.jsx
// Interactive Flow Wave & Verification Core with Three.js / React Three Fiber + Glassmorphism HUD Pins
// Floating HUD Pins: AI Scam Engine (4-Layer), Expert Trust Network (0-100 pts), Community Verification
// Features: Simplex Noise Particle Waves (#02160c -> #34e7c4), Mouse Raycaster Pointer Repulsion, Hologram Crystal Core

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { ShieldAlert, ShieldCheck, Users, ArrowUpRight } from "lucide-react";

// Interactive Simplex Noise Particle Wave Field with Mouse Repulsion
function ParticleWaveField() {
  const count = 1200;
  const meshRef = useRef();
  const { mouse, viewport } = useThree();

  const [positions, initialPositions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initialPos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const color1 = new THREE.Color("#02160c");
    const color2 = new THREE.Color("#34e7c4");
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 14;
      const y = (Math.random() - 0.5) * 2.8;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initialPos[i * 3] = x;
      initialPos[i * 3 + 1] = y;
      initialPos[i * 3 + 2] = z;

      const alpha = (x + 7) / 14;
      tempColor.lerpColors(color1, color2, Math.max(0, Math.min(1, alpha)));
      cols[i * 3] = tempColor.r;
      cols[i * 3 + 1] = tempColor.g;
      cols[i * 3 + 2] = tempColor.b;
    }
    return [pos, initialPos, cols];
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      const array = meshRef.current.geometry.attributes.position.array;
      const mx = (mouse.x * viewport.width) / 2;
      const my = (mouse.y * viewport.height) / 2;

      for (let i = 0; i < count; i++) {
        const u = i * 3;
        const ix = initialPositions[u];
        const iz = initialPositions[u + 2];

        // Wave motion
        let y = Math.sin(t * 1.2 + ix * 0.45) * 0.3 + Math.cos(t * 0.8 + iz * 0.45) * 0.2;

        // Mouse repulsion physics (pointerRadius = 3.5)
        const dx = ix - mx;
        const dy = y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 3.5) {
          const force = (3.5 - dist) / 3.5;
          y += force * 0.6;
        }

        array[u + 1] = y;
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
        <octahedronGeometry args={[1.5, 0]} />
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
        <octahedronGeometry args={[1.55, 0]} />
        <meshBasicMaterial color="#34e7c4" wireframe={true} transparent={true} opacity={0.4} />
      </mesh>

      {/* Inner Glowing AI Pulse Sphere */}
      <Sphere ref={innerRef} args={[0.75, 32, 32]}>
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
        <torusGeometry args={[2.1, 0.018, 16, 100]} />
        <meshBasicMaterial color="#34e7c4" transparent opacity={0.65} />
      </mesh>

      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.5, 0.014, 16, 100]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.5} />
      </mesh>

      {/* Floating HUD Pin 1: AI Scam Checker (Compact) */}
      <Float speed={2.5} rotationIntensity={0.2} floatIntensity={1.2} position={[-2.1, 1.2, 0.3]}>
        <Html distanceFactor={9} center position={[0, 0, 0]}>
          <div
            onMouseEnter={() => setHoverPin("checker")}
            onMouseLeave={() => setHoverPin(null)}
            className="group cursor-pointer p-2.5 rounded-2xl bg-space-950/90 backdrop-blur-xl border border-teal-500/40 shadow-[0_0_20px_rgba(52,231,196,0.35)] transition-all duration-300 hover:scale-105 hover:border-teal-400 select-none min-w-[170px]"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white flex items-center justify-between">
                  <span>AI Scam Engine</span>
                  <ArrowUpRight className="w-3 h-3 text-teal-400" />
                </p>
                <p className="text-[9px] text-teal-300 font-medium truncate">Động Cơ 4 Lớp (0.1s)</p>
              </div>
            </div>
          </div>
        </Html>
      </Float>

      {/* Floating HUD Pin 2: Chuyên Gia Uy Tín (Compact) */}
      <Float speed={3.0} rotationIntensity={0.25} floatIntensity={1.4} position={[2.1, 0.9, -0.2]}>
        <Html distanceFactor={9} center position={[0, 0, 0]}>
          <div
            onMouseEnter={() => setHoverPin("expert")}
            onMouseLeave={() => setHoverPin(null)}
            className="group cursor-pointer p-2.5 rounded-2xl bg-space-950/90 backdrop-blur-xl border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-105 hover:border-amber-400 select-none min-w-[170px]"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white flex items-center justify-between">
                  <span>Cố Vấn Uy Tín</span>
                  <ArrowUpRight className="w-3 h-3 text-amber-400" />
                </p>
                <p className="text-[9px] text-amber-300 font-medium truncate">Trust Score (0–100 pts)</p>
              </div>
            </div>
          </div>
        </Html>
      </Float>

      {/* Floating HUD Pin 3: Diễn Đàn Xác Thực (Compact) */}
      <Float speed={2.0} rotationIntensity={0.15} floatIntensity={1.0} position={[0, -1.9, 0.5]}>
        <Html distanceFactor={9} center position={[0, 0, 0]}>
          <div
            onMouseEnter={() => setHoverPin("forum")}
            onMouseLeave={() => setHoverPin(null)}
            className="group cursor-pointer p-2.5 rounded-2xl bg-space-950/90 backdrop-blur-xl border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all duration-300 hover:scale-105 hover:border-indigo-400 select-none min-w-[175px]"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white flex items-center justify-between">
                  <span>Diễn Đàn Thực Chứng</span>
                  <ArrowUpRight className="w-3 h-3 text-indigo-400" />
                </p>
                <p className="text-[9px] text-indigo-300 font-medium truncate">Vote Uy Tín • Nhà Trọ</p>
              </div>
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
      <div className="w-full h-full flex items-center justify-center bg-transparent">
        <div className="w-10 h-10 rounded-full border-2 border-teal-500/30 border-t-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl">
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        className="w-full h-full"
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.4} color="#34e7c4" />
        <pointLight position={[-10, -10, -10]} intensity={1.2} color="#6366f1" />
        <directionalLight position={[0, 5, 5]} intensity={0.7} color="#f59e0b" />

        <ParticleWaveField />
        <VerificationHologramCore hoverPin={hoverPin} setHoverPin={setHoverPin} />
      </Canvas>
    </div>
  );
}
