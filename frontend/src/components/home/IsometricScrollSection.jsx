"use client";

// components/home/IsometricScrollSection.jsx
// Sa bàn Isometric Scrollytelling kết nối các trường Đại học và Đối tác Công nghệ
// Tích hợp Three.js / React Three Fiber + Neon Pathing Laser Lines + Lenis Scroll Awareness

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, Text, Box, Cylinder, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { 
  Building2, 
  GraduationCap, 
  Sparkles, 
  Network, 
  ArrowUpRight, 
  CheckCircle2, 
  Zap, 
  Award,
  Globe
} from "lucide-react";
import Lenis from "lenis";

const NODES_DATA = [
  { id: "hust", name: "ĐH Bách Khoa Hà Nội", short: "HUST", x: -3.5, z: -2, height: 2.2, color: "#ef4444", students: "38,000+", papers: "1,200+", field: "CNTT & Tự động hóa" },
  { id: "vnu", name: "ĐHQG Hà Nội / TP.HCM", short: "VNU", x: 3.5, z: -2.2, height: 2.6, color: "#3b82f6", students: "55,000+", papers: "2,400+", field: "Khoa học Dữ liệu & AI" },
  { id: "hcmut", name: "ĐH Bách Khoa TP.HCM", short: "HCMUT", x: -4, z: 2, height: 2.0, color: "#06b6d4", students: "26,000+", papers: "980+", field: "Kỹ thuật Phần mềm" },
  { id: "ftu", name: "ĐH Ngoại Thương", short: "FTU", x: 4.2, z: 1.8, height: 1.8, color: "#f59e0b", students: "22,000+", papers: "650+", field: "Fintech & Kinh tế số" },
  { id: "fpt", name: "Đại học FPT / RMIT", short: "FPT/RMIT", x: 0, z: 3.8, height: 2.4, color: "#a855f7", students: "30,000+", papers: "890+", field: "Trí tuệ nhân tạo & IoT" },
];

function CityScene({ selectedNode, setSelectedNode, scrollProgress }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotation reacting smoothly to scroll progress
      const targetRotY = scrollProgress * Math.PI * 0.5 + Math.sin(state.clock.getElapsedTime() * 0.2) * 0.05;
      const targetRotX = 0.55 + Math.cos(scrollProgress * Math.PI * 0.25) * 0.1;
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Ground Grid Platform */}
      <gridHelper args={[16, 16, "#6366f1", "#1e293b"]} position={[0, -0.05, 0]} />

      {/* Central Core: StudentHub Central Hub */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[1.6, 2.4, 1.6]} />
          <meshPhysicalMaterial
            color="#4f46e5"
            transmission={0.8}
            roughness={0.1}
            ior={1.4}
            thickness={1}
            emissive="#312e81"
            emissiveIntensity={0.8}
          />
        </mesh>
        
        {/* Core Wireframe Glow */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[1.65, 2.45, 1.65]} />
          <meshBasicMaterial color="#34e7c4" wireframe={true} transparent opacity={0.4} />
        </mesh>

        {/* Central Pulse Beacon */}
        <mesh position={[0, 2.7, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#34e7c4" />
        </mesh>

        <Html position={[0, 3.2, 0]} center distanceFactor={10}>
          <div className="px-3 py-1 rounded-full bg-indigo-600/90 border border-indigo-400/50 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.6)] text-white text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>StudentHub AI Central Hub</span>
          </div>
        </Html>
      </group>

      {/* Surrounding University / Partner Node Cubes & Laser Paths */}
      {NODES_DATA.map((node) => {
        const isSelected = selectedNode?.id === node.id;
        const linePoints = [
          new THREE.Vector3(0, 2.7, 0),
          new THREE.Vector3(node.x, node.height + 0.3, node.z),
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);

        return (
          <group key={node.id} position={[node.x, 0, node.z]}>
            {/* University Node Building */}
            <mesh
              position={[0, node.height / 2, 0]}
              onClick={() => setSelectedNode(node)}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "default";
              }}
            >
              <boxGeometry args={[1.3, node.height, 1.3]} />
              <meshStandardMaterial
                color={isSelected ? "#34e7c4" : node.color}
                roughness={0.2}
                metalness={0.7}
                emissive={isSelected ? "#34e7c4" : node.color}
                emissiveIntensity={isSelected ? 0.6 : 0.25}
              />
            </mesh>

            {/* Glowing Rooftop Beacon */}
            <mesh position={[0, node.height + 0.15, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
              <meshBasicMaterial color={node.color} />
            </mesh>

            {/* Neon Laser Line connecting from Central Hub to Node */}
            <primitive object={new THREE.Line(
              lineGeometry,
              new THREE.LineBasicMaterial({
                color: isSelected ? "#34e7c4" : node.color,
                transparent: true,
                opacity: 0.65,
                linewidth: 2,
              })
            )} />

            {/* Floating Label */}
            <Html position={[0, node.height + 0.6, 0]} center distanceFactor={10}>
              <button
                onClick={() => setSelectedNode(node)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all duration-300 backdrop-blur-md shadow-md flex items-center gap-1 ${
                  isSelected
                    ? "bg-teal-500 text-black border border-teal-300 ring-2 ring-teal-400 scale-110"
                    : "bg-space-950/80 text-gray-200 border border-white/20 hover:border-white/50 hover:scale-105"
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>{node.short}</span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default function IsometricScrollSection() {
  const [selectedNode, setSelectedNode] = useState(NODES_DATA[0]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initialize Lenis smooth scroll listener
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section ref={containerRef} className="relative py-24 bg-space-950 text-white overflow-hidden border-t border-white/10">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-600/10 via-purple-600/10 to-teal-500/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-teal-300 uppercase tracking-wider mb-4">
            <Network className="w-3.5 h-3.5 text-teal-400" />
            Sa Bàn Isometric Tri Thức Toàn Quốc
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Mạng Lưới Kết Nối Đa Học Viện & <br className="hidden sm:inline" />
            <span className="text-gradient-cyan">Đối Tác Công Nghệ Thực Chứng</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
            Khối điều phối StudentHub AI liên kết thời gian thực với các trường đại học trọng điểm và chuyên gia cố vấn hàng đầu Việt Nam.
          </p>
        </div>

        {/* Main 3D Canvas + Live Telemetry Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Center 3D Isometric Viewport */}
          <div className="lg:col-span-8 h-[480px] sm:h-[580px] rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden shadow-glass-deep">
            {mounted ? (
              <Canvas
                camera={{ position: [0, 6.5, 9.5], fov: 42 }}
                gl={{ antialias: true, alpha: true }}
                className="w-full h-full"
              >
                <ambientLight intensity={1.1} />
                <directionalLight position={[10, 15, 10]} intensity={1.8} color="#ffffff" />
                <pointLight position={[-10, 5, -10]} intensity={1.2} color="#34e7c4" />
                <pointLight position={[0, 8, 0]} intensity={1.5} color="#818cf8" />

                <CityScene
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                  scrollProgress={scrollProgress}
                />
              </Canvas>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-teal-400/30 border-t-teal-400 animate-spin" />
              </div>
            )}

            {/* Overlay Scroll Hint */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none text-xs text-gray-400 bg-space-950/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <span className="flex items-center gap-1.5 text-teal-300">
                <Zap className="w-3.5 h-3.5 text-teal-400" />
                Cuộn trang để xoay sa bàn
              </span>
              <span className="font-mono text-[11px] text-gray-500">
                Góc xoay: {Math.round(scrollProgress * 100)}%
              </span>
            </div>
          </div>

          {/* Right Live Telemetry Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-3xl bg-space-900/80 border border-white/10 backdrop-blur-2xl shadow-glass-deep space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${selectedNode?.color}25`, color: selectedNode?.color }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {selectedNode?.name}
                    </h3>
                    <p className="text-xs text-gray-400">{selectedNode?.field}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  ĐÃ XÁC THỰC
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <p className="text-[11px] text-gray-400">Quy mô sinh viên</p>
                  <p className="text-lg font-extrabold text-white">{selectedNode?.students}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <p className="text-[11px] text-gray-400">Đề tài & Bài báo</p>
                  <p className="text-lg font-extrabold text-teal-300">{selectedNode?.papers}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-gray-300">Đặc quyền hệ sinh thái:</p>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span>Cộng ngay <strong>+30 điểm uy tín</strong> khi đăng ký email trường</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span>Truy cập kho giáo trình & đề thi giải mã theo chuẩn Socratic</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span>Kết nối mentor 1:1 từ cựu sinh viên & chuyên gia đầu ngành</span>
                  </li>
                </ul>
              </div>

              {/* Quick Node Selector Pills */}
              <div className="pt-3 border-t border-white/10">
                <p className="text-[11px] text-gray-500 mb-2">Chọn nhanh đối tác:</p>
                <div className="flex flex-wrap gap-1.5">
                  {NODES_DATA.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                        selectedNode?.id === n.id
                          ? "bg-teal-500 text-black shadow-md shadow-teal-500/30"
                          : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {n.short}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
