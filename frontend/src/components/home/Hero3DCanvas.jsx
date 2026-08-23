"use client";

// components/home/Hero3DCanvas.jsx
// Hologram Core Hub with Three.js / React Three Fiber + Glassmorphism Transmission Material
// Floating HUD Pins: AI Mentor Engine, Code Sandbox, Knowledge Graph

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, MeshDistortMaterial, Sphere, Torus, Octahedron, Box } from "@react-three/drei";
import * as THREE from "three";
import { Bot, Code2, Network, Sparkles, Zap, ArrowUpRight } from "lucide-react";

function HologramCore({ hoverPin, setHoverPin }) {
  const coreRef = useRef();
  const innerRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.4;
      coreRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.6;
      innerRef.current.rotation.z = Math.cos(t * 0.4) * 0.3;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5;
      ring1Ref.current.rotation.y = t * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.4;
      ring2Ref.current.rotation.z = t * 0.3;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = Math.sin(t * 0.3) * 0.8;
      ring3Ref.current.rotation.z = -t * 0.5;
    }
  });

  return (
    <group ref={coreRef}>
      {/* Outer Hologram Crystal / Octahedron Cage */}
      <mesh>
        <octahedronGeometry args={[1.8, 0]} />
        <meshPhysicalMaterial
          color="#818cf8"
          transmission={0.9}
          opacity={0.7}
          transparent={true}
          roughness={0.1}
          ior={1.5}
          thickness={1.2}
          wireframe={false}
          emissive="#4338ca"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Wireframe Matrix Cage */}
      <mesh>
        <octahedronGeometry args={[1.85, 0]} />
        <meshBasicMaterial color="#34e7c4" wireframe={true} transparent={true} opacity={0.35} />
      </mesh>

      {/* Inner Glowing AI Pulse Sphere */}
      <Sphere ref={innerRef} args={[0.9, 32, 32]}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.45}
          speed={3}
          roughness={0.2}
          metalness={0.8}
          emissive="#38bdf8"
          emissiveIntensity={0.6}
        />
      </Sphere>

      {/* Orbital Quantum Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.5, 0.025, 16, 100]} />
        <meshBasicMaterial color="#34e7c4" transparent opacity={0.6} />
      </mesh>

      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.9, 0.02, 16, 100]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.5} />
      </mesh>

      <mesh ref={ring3Ref}>
        <torusGeometry args={[3.3, 0.015, 16, 100]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} />
      </mesh>

      {/* Floating HUD Pin 1: AI Mentor Engine */}
      <Float speed={2.5} rotationIntensity={0.2} floatIntensity={1.5} position={[-2.8, 1.4, 0.5]}>
        <Html distanceFactor={8} center position={[0, 0, 0]}>
          <div
            onMouseEnter={() => setHoverPin("mentor")}
            onMouseLeave={() => setHoverPin(null)}
            className="group cursor-pointer p-3 rounded-2xl bg-space-950/90 backdrop-blur-xl border border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all duration-300 hover:scale-110 hover:border-indigo-400 select-none min-w-[200px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>AI Mentor Engine</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </p>
                <p className="text-[10px] text-indigo-300 font-medium">Socratic Reasoning 2.0</p>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sẵn sàng
              </span>
              <span>120K+ bài giải</span>
            </div>
          </div>
        </Html>
      </Float>

      {/* Floating HUD Pin 2: Code Sandbox */}
      <Float speed={3.0} rotationIntensity={0.25} floatIntensity={1.8} position={[2.9, 1.1, -0.4]}>
        <Html distanceFactor={8} center position={[0, 0, 0]}>
          <div
            onMouseEnter={() => setHoverPin("sandbox")}
            onMouseLeave={() => setHoverPin(null)}
            className="group cursor-pointer p-3 rounded-2xl bg-space-950/90 backdrop-blur-xl border border-teal-500/40 shadow-[0_0_25px_rgba(52,231,196,0.35)] transition-all duration-300 hover:scale-110 hover:border-teal-400 select-none min-w-[200px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Code Sandbox</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </p>
                <p className="text-[10px] text-teal-300 font-medium">Live Python & JS Execution</p>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400">
              <span className="text-teal-400 font-semibold">Heap, Tree, Graphs</span>
              <span>O(log N)</span>
            </div>
          </div>
        </Html>
      </Float>

      {/* Floating HUD Pin 3: Knowledge Graph */}
      <Float speed={2.0} rotationIntensity={0.15} floatIntensity={1.2} position={[0, -2.4, 0.8]}>
        <Html distanceFactor={8} center position={[0, 0, 0]}>
          <div
            onMouseEnter={() => setHoverPin("graph")}
            onMouseLeave={() => setHoverPin(null)}
            className="group cursor-pointer p-3 rounded-2xl bg-space-950/90 backdrop-blur-xl border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-110 hover:border-amber-400 select-none min-w-[220px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Network className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Knowledge Graph</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </p>
                <p className="text-[10px] text-amber-300 font-medium">Vector DB & Cố Vấn Thực Chứng</p>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400">
              <span>Đại học & Viện Nghiên Cứu</span>
              <span className="text-amber-400 font-semibold">+30 pts Edu</span>
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
      <div className="w-full h-[450px] sm:h-[550px] flex items-center justify-center bg-transparent">
        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[450px] sm:h-[550px] overflow-hidden rounded-3xl">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-indigo-900/10 via-transparent to-transparent pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.9} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#818cf8" />
        <pointLight position={[-10, -10, -10]} intensity={1.2} color="#34e7c4" />
        <directionalLight position={[0, 5, 5]} intensity={0.8} color="#f59e0b" />

        <HologramCore hoverPin={hoverPin} setHoverPin={setHoverPin} />
      </Canvas>

      {/* Interactive Micro-badge Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-gray-300 flex items-center gap-2 pointer-events-none shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
        <span>Tương tác 3D: Di chuột lên các HUD Pins để khám phá tính năng</span>
      </div>
    </div>
  );
}
