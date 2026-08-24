"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { 
  ShieldAlert, 
  Users, 
  MessageSquare, 
  ArrowUpRight, 
  Sparkles, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink,
  Award,
  Lock,
  Zap
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export const ROAD_PROJECTS = [
  {
    id: "scam-engine",
    num: "01",
    tag: "01 • XÁC THỰC AI",
    title: "AI Scam Engine 4 Lớp",
    client: "StudentHub AI Core",
    year: "2026",
    technologies: "Local Regex, Aggregator API, Vector RAG, Multi-LLM",
    speed: "0.1s – 1.5s",
    badge: "Explainable AI (XAI)",
    description:
      "Động cơ phân tích rủi ro đa tầng nhận diện chính xác thủ đoạn lừa cọc, học bổng giả mạo và deepfake qua Link, Text hoặc Ảnh OCR. Cơ chế dừng sớm (Early Exit) giúp 85% vụ việc có kết quả dưới 1.5 giây.",
    awards: ["1x Giải Nhất Bảng C Sinh Viên 2026", "1x Thẩm Định An Toàn VNCERT"],
    href: "/scam-check",
    bgImage: "/wallpapers/04-neural-network.jpg",
    color: "#38bdf8",
    icon: ShieldAlert,
    pos: [-7.5, 1.5, -35],
    rotY: 0.25,
  },
  {
    id: "trust-network",
    num: "02",
    tag: "02 • MẠNG LƯỚI CỐ VẤN",
    title: "Mạng Lưới Chuyên Gia",
    client: "National Advisor Council",
    year: "2026",
    technologies: "Edu SSO, Reputation Ledger, Peer Verification",
    speed: "Thời gian thực",
    badge: "Trust Score 0–100 pts",
    description:
      "Hệ thống điểm uy tín 0–100 điểm kết hợp xác thực Email trường (.edu = +30 điểm) và mạng lưới cố vấn đa ngành (Luật, An ninh mạng, Nhà trọ). Thẩm định thực chứng 2 chiều ngăn chặn mạo danh.",
    awards: ["1x Mạng Lưới Cố Vấn Quốc Gia", "1x Edu Campus Verified"],
    href: "/profile",
    bgImage: "/wallpapers/02-smart-campus-future.jpg",
    color: "#f59e0b",
    icon: Users,
    pos: [8, 1.0, -75],
    rotY: -0.3,
  },
  {
    id: "forum-community",
    num: "03",
    tag: "03 • DIỄN ĐÀN THỰC CHỨNG",
    title: "Diễn Đàn Sinh Viên",
    client: "Campus Community Hub",
    year: "2026",
    technologies: "Campus Tagging, Trust-Weighted Upvotes, Moderation",
    speed: "Cộng đồng thực",
    badge: "Vote Uy Tín",
    description:
      "Không gian cảnh báo bẫy lừa và đánh giá thực tế về Nhà trọ, Quán ăn, Việc làm sinh viên. Cơ chế Vote Uy Tín đẩy bài viết có độ tin cậy cao lên đầu, tách biệt với lượt tương tác thông thường.",
    awards: ["1x Diễn Đàn Sinh Viên Độc Lập", "1x Giải Pháp Vì Cộng Đồng"],
    href: "/forum",
    bgImage: "/wallpapers/05-data-flow.jpg",
    color: "#818cf8",
    icon: MessageSquare,
    pos: [-8, 1.8, -115],
    rotY: 0.28,
  },
  {
    id: "contest-mission",
    num: "04",
    tag: "04 • CUỘC THI QUỐC GIA 2026",
    title: "Sáng Tạo Trẻ AI 2026",
    client: "Bộ Khoa Học & Công Nghệ",
    year: "2026",
    technologies: "Next.js 16 Turbopack, PyTorch RAG, VNCERT Data",
    speed: "Bảng C Sinh Viên",
    badge: "100% Phi Thương Mại",
    description:
      "Đề án công nghệ giải pháp số toàn diện bảo vệ quyền lợi sinh viên Việt Nam trước bẫy lừa đảo trên không gian mạng. Cam kết 100% miễn phí, bảo mật quyền riêng tư tối đa.",
    awards: ["1x Đề Án Quốc Gia Xuất Sắc", "1x Digital Trust Network 2026"],
    href: "/scam-check",
    bgImage: "/wallpapers/01-ai-knowledge-portal.jpg",
    color: "#34e7c4",
    icon: Sparkles,
    pos: [7.5, 1.2, -155],
    rotY: -0.25,
  },
];

/**
 * CurvedRoadTrack:
 * Iconic Robin Payot 3D dotted highway track curving into depth
 */
function CurvedRoadTrack() {
  const lanesCount = 7;
  const pointsPerLane = 150;

  const [positions] = useMemo(() => {
    const totalPoints = lanesCount * pointsPerLane;
    const pos = new Float32Array(totalPoints * 3);

    let idx = 0;
    for (let l = 0; l < lanesCount; l++) {
      const laneOffset = (l - (lanesCount - 1) / 2) * 2.5;
      for (let p = 0; p < pointsPerLane; p++) {
        const z = -p * 1.8;
        const curveX = Math.sin(z * 0.025) * 14 + laneOffset;
        const y = -3.4 + Math.cos(z * 0.02) * 1.2;

        pos[idx * 3] = curveX;
        pos[idx * 3 + 1] = y;
        pos[idx * 3 + 2] = z;
        idx++;
      }
    }
    return [pos];
  }, [lanesCount, pointsPerLane]);

  const pointsRef = useRef();

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const array = pointsRef.current.geometry.attributes.position.array;

    let idx = 0;
    for (let l = 0; l < lanesCount; l++) {
      const laneOffset = (l - (lanesCount - 1) / 2) * 2.5;
      for (let p = 0; p < pointsPerLane; p++) {
        const z = -p * 1.8;
        const curveX = Math.sin(z * 0.025 + t * 0.3) * 14 + laneOffset;
        const y = -3.4 + Math.cos(z * 0.02 + t * 0.2) * 1.2;

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
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * CurvedBillboard:
 * 3D Curved project screens along the road track
 */
function CurvedBillboard({ project, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const Icon = project.icon;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = project.pos[1] + Math.sin(t * 1.5 + project.pos[2]) * 0.2;
  });

  return (
    <group ref={meshRef} position={project.pos} rotation={[0, project.rotY, 0]}>
      {/* 3D Curved Plane Screen */}
      <mesh
        onClick={() => onSelect(project)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        className="cursor-pointer"
      >
        <planeGeometry args={[8.5, 5.0, 32, 16]} />
        <meshPhysicalMaterial
          color={hovered ? "#38bdf8" : "#0f172a"}
          roughness={0.2}
          metalness={0.8}
          transmission={0.4}
          transparent
          opacity={0.85}
          emissive={hovered ? project.color : "#0a0f1d"}
          emissiveIntensity={hovered ? 0.85 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Screen Glowing Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(8.5, 5.0)]} />
        <lineBasicMaterial color={hovered ? "#ffffff" : project.color} linewidth={hovered ? 2.5 : 1.5} />
      </lineSegments>

      {/* Thin Flagpost Line connecting to road floor */}
      <mesh position={[4.5, -3.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 6.4, 8]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>

      {/* Flagpost Node & Annotation HTML */}
      <Html position={[4.8, 0.5, 0]} distanceFactor={15} center={false}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(project);
          }}
          className="select-none pointer-events-auto group/item cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div className="p-3 rounded-2xl bg-space-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl min-w-[220px] transition-all duration-300 group-hover/item:scale-110 group-hover/item:border-cyan-400">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300">{project.tag}</span>
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-white mt-1">{project.title}</h4>
              <p className="text-[10px] text-teal-300 font-semibold mt-1 flex items-center gap-1">
                <span>Bấm để xem chi tiết 3D</span>
                <ArrowUpRight className="w-3 h-3 group-hover/item:translate-x-0.5 transition-transform" />
              </p>
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
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5} position={[-9, 1, -40]}>
        <mesh ref={blob1}>
          <sphereGeometry args={[1.5, 64, 64]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.05} />
        </mesh>
      </Float>

      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.8} position={[11, 2, -80]}>
        <mesh ref={blob2}>
          <sphereGeometry args={[2.0, 64, 64]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} wireframe={true} />
        </mesh>
      </Float>

      <Float speed={3} rotationIntensity={0.4} floatIntensity={1.2} position={[-12, 0, -130]}>
        <mesh ref={blob3}>
          <sphereGeometry args={[1.8, 64, 64]} />
          <meshPhysicalMaterial color="#818cf8" metalness={0.8} roughness={0.15} transmission={0.6} transparent opacity={0.8} />
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
    const targetZ = -(scrollYProgress * 150) + 12;
    const curveX = Math.sin(targetZ * 0.025) * 8 + mouse.x * 2.5;
    const targetY = 1.2 + mouse.y * 1.5;

    camera.position.z += (targetZ - camera.position.z) * 0.08;
    camera.position.x += (curveX - camera.position.x) * 0.08;
    camera.position.y += (targetY - camera.position.y) * 0.08;

    const lookTargetX = Math.sin((targetZ - 20) * 0.025) * 12;
    camera.lookAt(lookTargetX, -0.5, targetZ - 25);
  });

  return null;
}

/**
 * DetailScreen3DCanvas:
 * Interactive 3D tilted curved image mesh for the center of the Detail View modal
 */
function DetailScreen3DCanvas({ project }) {
  const meshRef = useRef();

  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      className="w-full h-full"
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#38bdf8" />
      <pointLight position={[-5, -5, -5]} intensity={1.0} color="#818cf8" />

      <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <group ref={meshRef}>
          {/* Main Curved Screen */}
          <mesh rotation={[0.05, -0.15, -0.04]}>
            <planeGeometry args={[5.8, 3.4, 32, 16]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.8}
              roughness={0.2}
              emissive={project.color}
              emissiveIntensity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Wireframe Outline */}
          <lineSegments rotation={[0.05, -0.15, -0.04]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(5.8, 3.4)]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>

          {/* Floating Chrome Orb */}
          <Float speed={3} rotationIntensity={0.8} floatIntensity={1.5} position={[2.6, -1.2, 0.8]}>
            <mesh>
              <sphereGeometry args={[0.45, 32, 32]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.05} />
            </mesh>
          </Float>

          {/* Floating Glass Orb */}
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1.2} position={[-2.4, 1.3, 0.6]}>
            <mesh>
              <sphereGeometry args={[0.35, 32, 32]} />
              <meshPhysicalMaterial color="#38bdf8" transmission={0.85} opacity={0.8} transparent roughness={0.1} />
            </mesh>
          </Float>
        </group>
      </Float>
    </Canvas>
  );
}

/**
 * RobinPayotDetailView:
 * Fullscreen Interactive Detail Screen matching Robin Payot's Kokopako / Upperquad / USSF inspection view!
 */
function RobinPayotDetailView({ project, onClose, onPrev, onNext }) {
  const Icon = project.icon;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp") onPrev();
      if (e.key === "ArrowDown") onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[9999] bg-[#070c18] flex flex-col justify-between overflow-hidden select-none pointer-events-auto"
    >
      {/* 1. Diagonal Architectural Split Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Deep Left Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#060a14] via-[#0b1326] to-[#111e3b]" />
        
        {/* Diagonal Soft Indigo/Cyan Wedge */}
        <div
          className="absolute -top-1/4 -right-1/4 w-[90vw] h-[150vh] bg-gradient-to-bl from-cyan-900/20 via-indigo-900/15 to-transparent blur-[80px] pointer-events-none transform -rotate-12"
        />

        {/* Ambient Grid Matrix */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:48px_48px] opacity-15" />
      </div>

      {/* 2. Top-Right Organic Curved BACK Button (Robin Payot Style) */}
      <div className="absolute top-0 right-0 z-30">
        <button
          onClick={onClose}
          className="px-10 py-6 rounded-bl-[40px] bg-cyan-500/20 hover:bg-cyan-400 border-b border-l border-cyan-400/30 text-xs font-mono font-black tracking-widest text-cyan-200 hover:text-space-950 transition-all duration-300 backdrop-blur-2xl shadow-[0_0_30px_rgba(56,189,248,0.3)] flex items-center gap-2 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>BACK</span>
        </button>
      </div>

      {/* 3. Top-Center & Bottom-Center Floating Navigation Arrows (↑ / ↓) */}
      <button
        onClick={onPrev}
        className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-cyan-400 border border-white/20 text-white hover:text-space-950 transition-all duration-300 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 group cursor-pointer"
        title="Mục Trước (Phím Mũi Tên Lên)"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      <button
        onClick={onNext}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-cyan-400 border border-white/20 text-white hover:text-space-950 transition-all duration-300 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 group cursor-pointer"
        title="Mục Tiếp Theo (Phím Mũi Tên Xuống)"
      >
        <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
      </button>

      {/* 4. Main Split Content Area */}
      <div className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-6 sm:px-14 lg:px-20 max-w-[1700px] w-full mx-auto my-auto gap-8">
        
        {/* Left Side: Interactive 3D Tilted Curved Canvas (7 Cols) */}
        <div className="lg:col-span-7 h-[360px] sm:h-[480px] lg:h-[540px] relative flex items-center justify-center">
          <div className="w-full h-full relative">
            <DetailScreen3DCanvas project={project} />

            {/* In-canvas Floating Title Badge */}
            <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-space-950/80 backdrop-blur-xl border border-white/15 text-left pointer-events-none">
              <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase">{project.tag}</span>
              <p className="text-xs font-bold text-white mt-0.5 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{project.title}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Editorial Metadata Specification (5 Cols) */}
        <motion.div
          key={project.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6 text-left max-w-xl"
        >
          {/* Main Display Headline */}
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              {project.title}
            </h1>
          </div>

          {/* Metadata Specs (Client, Year, Technologies) */}
          <div className="space-y-3.5 pt-2 text-xs sm:text-sm">
            <div>
              <p className="text-gray-400 italic font-serif">Client / Dự án</p>
              <p className="text-gray-100 font-semibold mt-0.5">{project.client}</p>
            </div>

            <div>
              <p className="text-gray-400 italic font-serif">Year / Năm</p>
              <p className="text-gray-100 font-semibold mt-0.5">{project.year}</p>
            </div>

            <div>
              <p className="text-gray-400 italic font-serif">Technologies / Công nghệ</p>
              <p className="text-gray-100 font-semibold mt-0.5">{project.technologies}</p>
            </div>
          </div>

          {/* Description Paragraph */}
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal pt-1">
            {project.description}
          </p>

          {/* Visit Website / Open Tool CTA with OOO Icon */}
          <div className="pt-2">
            <Link
              href={project.href}
              className="inline-flex items-center gap-3 text-sm sm:text-base font-bold text-cyan-300 hover:text-white transition-all group"
            >
              <div className="flex -space-x-1.5 items-center">
                <div className="w-3.5 h-3.5 rounded-full border border-cyan-400 animate-spin" />
                <div className="w-3.5 h-3.5 rounded-full border border-indigo-400 animate-spin animation-delay-200" />
                <div className="w-3.5 h-3.5 rounded-full border border-purple-400 animate-spin animation-delay-400" />
              </div>
              <span className="underline underline-offset-4 decoration-cyan-400/50 group-hover:decoration-cyan-300">
                Visit website / Mở ứng dụng
              </span>
              <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Awards / Recognition */}
          <div className="pt-4 border-t border-white/10 space-y-1 text-xs font-mono text-gray-400">
            {project.awards.map((award, idx) => (
              <p key={idx} className="flex items-center gap-1.5 text-gray-300">
                <span className="text-cyan-400 font-bold">★</span>
                <span>{award}</span>
              </p>
            ))}
          </div>
        </motion.div>

      </div>

      {/* 5. Minimalist Bottom-Left Indicator */}
      <div className="absolute bottom-6 left-8 z-20 flex items-center gap-3 text-xs font-mono text-gray-400 pointer-events-none">
        <span className="text-cyan-400 font-bold">{project.num} / 04</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">STUDENT HUB AI 2026 ARCHITECTURE</span>
      </div>
    </motion.div>
  );
}

/**
 * Main RobinPayotRoadCanvas Component
 */
export default function RobinPayotRoadCanvas({ showHud = false }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mode, setMode] = useState("ROAD"); // ROAD | OVERVIEW | LIST
  const [selectedProject, setSelectedProject] = useState(null);

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

  const handlePrev = useCallback(() => {
    if (!selectedProject) return;
    const currentIdx = ROAD_PROJECTS.findIndex((p) => p.id === selectedProject.id);
    const prevIdx = (currentIdx - 1 + ROAD_PROJECTS.length) % ROAD_PROJECTS.length;
    setSelectedProject(ROAD_PROJECTS[prevIdx]);
  }, [selectedProject]);

  const handleNext = useCallback(() => {
    if (!selectedProject) return;
    const currentIdx = ROAD_PROJECTS.findIndex((p) => p.id === selectedProject.id);
    const nextIdx = (currentIdx + 1) % ROAD_PROJECTS.length;
    setSelectedProject(ROAD_PROJECTS[nextIdx]);
  }, [selectedProject]);

  return (
    <>
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
          <CurvedRoadTrack />
          <FloatingChromeBlobs />

          {ROAD_PROJECTS.map((project) => (
            <CurvedBillboard
              key={project.id}
              project={project}
              onSelect={(p) => setSelectedProject(p)}
            />
          ))}
        </Canvas>

        {/* 3. Minimalist HUD Top-Right Mode Switcher (only shown when showHud is enabled) */}
        {showHud && (
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
        )}

        {/* 4. Minimalist HUD Bottom-Left (only shown when showHud is enabled) */}
        {showHud && (
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
            <span className="text-[10px] font-mono text-cyan-300/80">3D HIGHWAY FLIGHT ACTIVE</span>
          </div>
        )}
      </div>

      {/* 5. Fullscreen Detail Inspection View Modal (Z-INDEX 9999) */}
      <AnimatePresence>
        {selectedProject && (
          <RobinPayotDetailView
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </AnimatePresence>
    </>
  );
}
