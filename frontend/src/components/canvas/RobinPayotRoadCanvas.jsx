"use client";

// frontend/src/components/canvas/RobinPayotRoadCanvas.jsx
//
// 3D Highway / Road Canvas (Robin Payot x Meer Mohsin x Saffron Luxury Signature):
// - 3D Dotted Highway Track uốn lượn vào chiều sâu không gian
// - Các BẢNG ĐEN 3D (3D Obsidian Black Billboards) đặt dọc theo con đường, mỗi bảng đặc trưng cho 1 trang/module
// - Camera lướt theo chuyển động cuộn (Scroll Flight Controller)
// - Click vào bảng đen sẽ mở bảng thông tin chi tiết từ A tới Z (Fullscreen Detail Inspection View)

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { ShieldAlert, Users, MessageSquare, ArrowUpRight, ArrowLeft, ArrowUp, ArrowDown, ExternalLink, LayoutDashboard, GraduationCap } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { saffronAudio } from "@/lib/audio/saffronAudio";

export const ROAD_PROJECTS = [
  {
    id: "scam-engine",
    num: "01",
    tag: "01 // XÁC THỰC AI",
    title: "AI Scam Engine 4 Lớp",
    client: "StudentHub AI Core Security",
    year: "2026",
    technologies: "Deterministic Screening, Semantic Intent, Evidence Matching, 3D Decision Matrix",
    speed: "0.19ms – 1.5s [Early Exit]",
    badge: "Explainable AI (XAI)",
    description:
      "Động cơ phân tích rủi ro đa tầng nhận diện chính xác thủ đoạn lừa cọc, tuyển dụng ảo, học bổng giả mạo và bẫy OTP qua Link, Text hoặc Ảnh OCR. Cơ chế dừng sớm (Early Exit) chặn ngay lập tức các mối nguy hại.",
    awards: ["Phân tích đa phương thức: Link, Text, Ảnh OCR & QR Code", "Giải trình minh bạch từng bước phát hiện rủi ro"],
    href: "/scam-check",
    bgImage: "/wallpapers/04-neural-network.jpg",
    color: "#ffbc09",
    icon: ShieldAlert,
    pos: [-7.5, 1.5, -35],
    rotY: 0.25,
  },
  {
    id: "trust-network",
    num: "02",
    tag: "02 // CỐ VẤN & HỒ SƠ UY TÍN",
    title: "Mạng Lưới Chuyên Gia & Điểm Uy Tín",
    client: "StudentHub Trust Network",
    year: "2026",
    technologies: "Edu Verification, Trust Score Engine, Peer Review",
    speed: "Thời gian thực",
    badge: "Trust Score 0–100 pts",
    description:
      "Hệ thống điểm uy tín 0–100 điểm kết hợp xác thực Email trường (.edu = +30 điểm) và mạng lưới cố vấn chuyên gia cộng đồng. Thẩm định thực chứng 2 chiều ngăn chặn mạo danh và farm điểm ảo.",
    awards: ["Xác thực sinh viên chính chủ qua Email trường (.edu)", "Cơ chế chống gian lận & điều phối trọng số vote"],
    href: "/profile",
    bgImage: "/wallpapers/02-smart-campus-future.jpg",
    color: "#ffd15c",
    icon: Users,
    pos: [8, 1.0, -75],
    rotY: -0.3,
  },
  {
    id: "forum-community",
    num: "03",
    tag: "03 // DIỄN ĐÀN SINH VIÊN",
    title: "Diễn Đàn Xác Thực & Vote Tín Nhiệm",
    client: "Campus Community Hub",
    year: "2026",
    technologies: "LocationTag Filtering, Trust-Weighted Upvotes, Anti-Spam",
    speed: "Thời gian thực",
    badge: "Vote Uy Tín Thực Tế",
    description:
      "Không gian cảnh báo bẫy lừa và đánh giá thực tế về Nhà trọ, Quán ăn, Trường học. Cơ chế Vote Uy Tín đẩy bài viết có độ tin cậy cao lên đầu, tách biệt hoàn toàn với lượt thả tim thông thường.",
    awards: ["3 Danh mục thiết thực: Trường học, Quán ăn, Nhà trọ", "Tách biệt rõ ràng giữa Like (hữu ích) và Vote (điểm uy tín)"],
    href: "/forum",
    bgImage: "/wallpapers/05-data-flow.jpg",
    color: "#38bdf8",
    icon: MessageSquare,
    pos: [-8, 1.8, -115],
    rotY: 0.28,
  },
  {
    id: "dashboard-control",
    num: "04",
    tag: "04 // BẢNG ĐIỀU KHIỂN MISSION CONTROL",
    title: "Bảng Điều Khiển Trung Tâm (Dashboard)",
    client: "StudentHub Defense Station",
    year: "2026",
    technologies: "Bento Matrix, Real-time Threat Telemetry, 3D Wave Dynamics",
    speed: "Tức thì (<10ms)",
    badge: "Trung Tâm Chỉ Huy",
    description:
      "Trạm chỉ huy tổng quan cung cấp bức tranh toàn cảnh về an ninh mạng học đường, tra cứu nhanh từ khóa cảnh báo, theo dõi Top 5 bảng xếp hạng uy tín và quản lý thông tin cá nhân.",
    awards: ["Top 5 Bảng xếp hạng thành viên uy tín tuần/tháng", "Tìm kiếm nhanh theo từ khóa và thẻ trường học"],
    href: "/dashboard",
    bgImage: "/wallpapers/01-ai-knowledge-portal.jpg",
    color: "#ca56ed",
    icon: LayoutDashboard,
    pos: [7.5, 1.2, -155],
    rotY: -0.25,
  },
  {
    id: "register-defense",
    num: "05",
    tag: "05 // ĐĂNG KÝ & BẢO VỆ SỐ",
    title: "Cổng Đăng Ký & Xác Thực Orbit OTP",
    client: "StudentHub Academic Network",
    year: "2026",
    technologies: "Settigation Orbit OTP v3, Edu Domain Verification, Supabase Auth",
    speed: "Xác thực 2 bước",
    badge: "Bảo Mật 2 Bước",
    description:
      "Cổng khởi tạo tài khoản bảo vệ số dành riêng cho sinh viên Việt Nam với bàn phím số xoay quỹ đạo Settigation Orbit OTP và bộ đếm ngược 60 giây an toàn tuyệt đối.",
    awards: ["Bàn phím quỹ đạo số Orbit OTP tương tác mượt mà", "Tự động kích hoạt điểm thưởng khi dùng email trường .edu"],
    href: "/register",
    bgImage: "/wallpapers/02-smart-campus-future.jpg",
    color: "#34e7c4",
    icon: GraduationCap,
    pos: [-7.5, 1.5, -195],
    rotY: 0.25,
  },
];

/**
 * CurvedRoadTrack:
 * Iconic Robin Payot 3D dotted highway track curving into depth
 */
function CurvedRoadTrack() {
  const lanesCount = 7;
  const pointsPerLane = 180;

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
        size={0.14}
        color="#ffbc09"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * CurvedBillboard:
 * 3D Obsidian Black Billboard with Gold Hairline Border and Crosshairs (+)
 */
function CurvedBillboard({ project, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const Icon = project.icon;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = project.pos[1] + Math.sin(t * 1.5 + project.pos[2] * 0.1) * 0.25;
  });

  const handleClick = (e) => {
    e.stopPropagation();
    saffronAudio.playHardwareKey();
    onSelect(project);
  };

  return (
    <group ref={meshRef} position={project.pos} rotation={[0, project.rotY, 0]}>
      {/* Main 3D Obsidian Black Screen Mesh */}
      <mesh
        onClick={handleClick}
        onPointerOver={() => {
          setHovered(true);
          saffronAudio.playClick(800);
        }}
        onPointerOut={() => setHovered(false)}
        className="cursor-pointer"
      >
        <planeGeometry args={[8.5, 5.0, 32, 16]} />
        <meshPhysicalMaterial
          color={hovered ? "#210a07" : "#150604"}
          roughness={0.2}
          metalness={0.8}
          transmission={0.3}
          transparent
          opacity={0.92}
          emissive={hovered ? project.color : "#150604"}
          emissiveIntensity={hovered ? 0.8 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Screen Glowing Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(8.5, 5.0)]} />
        <lineBasicMaterial color={hovered ? "#ffbc09" : "#47140b"} linewidth={hovered ? 2.5 : 1.5} />
      </lineSegments>

      {/* Centered Large Readable 3D Billboard Content */}
      <Html position={[0, 0, 0.15]} distanceFactor={14} center>
        <div
          onClick={handleClick}
          className="select-none pointer-events-auto group/item cursor-pointer font-human w-[460px] sm:w-[520px]"
        >
          <div className="p-6 sm:p-7 rounded-3xl bg-[#120604]/96 backdrop-blur-2xl border-2 border-[#ffbc09]/40 group-hover/item:border-[#ffbc09] shadow-[0_20px_60px_rgba(0,0,0,0.95)] transition-all duration-300 group-hover/item:scale-105 space-y-3">
            {/* Tag & Category Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#ffbc09] animate-ping" />
                <span className="text-xs sm:text-sm font-mono font-black text-[#ffbc09] tracking-wider uppercase">
                  {project.tag}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#210a07] border border-[#ffbc09]/40 text-[#ffd15c]">
                  {project.badge}
                </span>
                <Icon className="w-5 h-5 text-[#ffbc09]" />
              </div>
            </div>

            {/* Big Bold Headline */}
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white group-hover/item:text-[#ffd15c] transition-colors leading-tight drop-shadow-md">
              {project.title}
            </h3>

            {/* Description Preview */}
            <p className="text-xs sm:text-sm text-[#ece7e0]/90 leading-relaxed line-clamp-2">
              {project.description}
            </p>

            {/* Speed & Tech Meta */}
            <div className="flex items-center justify-between text-[11px] font-mono text-[#38bdf8] pt-1 border-t border-[#47140b]">
              <span>Tốc độ: {project.speed}</span>
              <span className="text-[#ece7e0]/60">Năm 2026</span>
            </div>

            {/* Prominent Action Button CTA */}
            <div className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-[#ffbc09] group-hover/item:bg-[#ffd15c] text-[#150604] font-mono font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(255,188,9,0.4)] transition-all">
              <span>BẤM ĐỂ MỞ TOÀN BỘ A-Z</span>
              <ArrowUpRight className="w-4 h-4 group-hover/item:translate-x-1 group-hover/item:-translate-y-0.5 transition-transform" />
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
          <meshStandardMaterial color="#ffd15c" metalness={0.9} roughness={0.1} />
        </mesh>
      </Float>

      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.8} position={[11, 2, -80]}>
        <mesh ref={blob2}>
          <sphereGeometry args={[2.0, 64, 64]} />
          <meshStandardMaterial color="#ffbc09" metalness={0.85} roughness={0.15} wireframe={true} />
        </mesh>
      </Float>

      <Float speed={3} rotationIntensity={0.4} floatIntensity={1.2} position={[-12, 0, -130]}>
        <mesh ref={blob3}>
          <sphereGeometry args={[1.8, 64, 64]} />
          <meshPhysicalMaterial color="#38bdf8" metalness={0.8} roughness={0.15} transmission={0.6} transparent opacity={0.8} />
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
    const targetZ = -(scrollYProgress * 210) + 12;
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
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffbc09" />
      <pointLight position={[-5, -5, -5]} intensity={1.0} color="#ffd15c" />

      <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <group ref={meshRef}>
          {/* Main Curved Screen */}
          <mesh rotation={[0.05, -0.15, -0.04]}>
            <planeGeometry args={[5.8, 3.4, 32, 16]} />
            <meshStandardMaterial
              color="#150604"
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
            <lineBasicMaterial color="#ffbc09" linewidth={2} />
          </lineSegments>

          {/* Floating Chrome Orb */}
          <Float speed={3} rotationIntensity={0.8} floatIntensity={1.5} position={[2.6, -1.2, 0.8]}>
            <mesh>
              <sphereGeometry args={[0.45, 32, 32]} />
              <meshStandardMaterial color="#ffd15c" metalness={0.95} roughness={0.05} />
            </mesh>
          </Float>

          {/* Floating Glass Orb */}
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1.2} position={[-2.4, 1.3, 0.6]}>
            <mesh>
              <sphereGeometry args={[0.35, 32, 32]} />
              <meshPhysicalMaterial color="#ffbc09" transmission={0.85} opacity={0.8} transparent roughness={0.1} />
            </mesh>
          </Float>
        </group>
      </Float>
    </Canvas>
  );
}

/**
 * RobinPayotDetailView:
 * Fullscreen Interactive Detail Screen (A to Z) with Saffron Luxury styling & explicit Back button
 */
function RobinPayotDetailView({ project, onClose, onPrev, onNext }) {
  const Icon = project.icon;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        saffronAudio.playClick(400);
        onClose();
      }
      if (e.key === "ArrowUp") {
        saffronAudio.playClick(600);
        onPrev();
      }
      if (e.key === "ArrowDown") {
        saffronAudio.playClick(600);
        onNext();
      }
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
      className="fixed inset-0 z-[9999] bg-[#070403] flex flex-col justify-between overflow-hidden select-none pointer-events-auto font-human"
    >
      {/* 1. Diagonal Architectural Split Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#150604] via-[#070403] to-[#210a07]" />
        
        {/* Saffron Gold Glow Wedge */}
        <div
          className="absolute -top-1/4 -right-1/4 w-[90vw] h-[150vh] bg-gradient-to-bl from-[#ffbc09]/15 via-[#f59e0b]/10 to-transparent blur-[80px] pointer-events-none transform -rotate-12"
        />

        {/* Ambient Grid Matrix */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#47140b_1px,transparent_1px),linear-gradient(to_bottom,#47140b_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
      </div>

      {/* 2. Top-Right Organic Curved BACK Button */}
      <div className="absolute top-0 right-0 z-30">
        <button
          onClick={() => {
            saffronAudio.playClick(400);
            onClose();
          }}
          className="px-10 py-6 rounded-bl-[40px] bg-[#ffbc09]/20 hover:bg-[#ffbc09] border-b border-l border-[#ffbc09]/40 text-xs font-mono font-black tracking-widest text-[#ffd15c] hover:text-[#150604] transition-all duration-300 backdrop-blur-2xl shadow-[0_0_30px_rgba(255,188,9,0.3)] flex items-center gap-2 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>[ ✕ QUAY LẠI 3D ROAD ]</span>
        </button>
      </div>

      {/* 3. Top-Center & Bottom-Center Floating Navigation Arrows (↑ / ↓) */}
      <button
        onClick={() => {
          saffronAudio.playClick(600);
          onPrev();
        }}
        className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-11 h-11 rounded-full bg-[#210a07] hover:bg-[#ffbc09] border border-[#47140b] hover:border-[#ffbc09] text-white hover:text-[#150604] transition-all duration-300 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 group cursor-pointer"
        title="Mục Trước (Phím Mũi Tên Lên)"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      <button
        onClick={() => {
          saffronAudio.playClick(600);
          onNext();
        }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-11 h-11 rounded-full bg-[#210a07] hover:bg-[#ffbc09] border border-[#47140b] hover:border-[#ffbc09] text-white hover:text-[#150604] transition-all duration-300 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 group cursor-pointer"
        title="Mục Tiếp Theo (Phím Mũi Tên Xuống)"
      >
        <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
      </button>

      {/* 4. Main Split Content Area (A to Z Details) */}
      <div className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-6 sm:px-14 lg:px-20 max-w-[1700px] w-full mx-auto my-auto gap-8">
        
        {/* Left Side: Interactive 3D Tilted Curved Canvas */}
        <div className="lg:col-span-7 h-[360px] sm:h-[480px] lg:h-[540px] relative flex items-center justify-center">
          <div className="w-full h-full relative">
            <DetailScreen3DCanvas project={project} />

            {/* In-canvas Floating Title Badge */}
            <div className="absolute bottom-4 left-4 p-3.5 rounded-2xl bg-[#150604]/90 backdrop-blur-xl border border-[#47140b] text-left pointer-events-none">
              <span className="text-[10px] font-mono text-[#ffbc09] font-bold uppercase">{project.tag}</span>
              <p className="text-xs font-bold text-white mt-0.5 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-[#ffbc09]" />
                <span>{project.title}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Editorial Metadata Specification (A to Z) */}
        <motion.div
          key={project.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6 text-left max-w-xl"
        >
          {/* Main Display Headline */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/40 text-[#ffbc09] text-xs font-mono font-bold uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
              <span>{project.badge}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {project.title}
            </h1>
          </div>

          {/* Metadata Specs (Client, Year, Technologies) */}
          <div className="space-y-3.5 pt-2 text-xs sm:text-sm">
            <div>
              <p className="text-[#ece7e0]/60 font-mono text-xs uppercase">[ 01 // DỰ ÁN ]</p>
              <p className="text-white font-bold mt-0.5">{project.client}</p>
            </div>

            <div>
              <p className="text-[#ece7e0]/60 font-mono text-xs uppercase">[ 02 // CÔNG NGHỆ NỀN TẢNG ]</p>
              <p className="text-[#ffd15c] font-semibold mt-0.5">{project.technologies}</p>
            </div>

            <div>
              <p className="text-[#ece7e0]/60 font-mono text-xs uppercase">[ 03 // TỐC ĐỘ XỬ LÝ ]</p>
              <p className="text-[#38bdf8] font-mono font-bold mt-0.5">{project.speed}</p>
            </div>
          </div>

          {/* Description Paragraph */}
          <p className="text-xs sm:text-sm text-[#ece7e0]/85 leading-relaxed font-normal pt-1">
            {project.description}
          </p>

          {/* Visit Website / Open Tool CTA Button */}
          <div className="pt-2">
            <Link
              href={project.href}
              onClick={() => saffronAudio.playSuccessChime()}
              className="inline-flex items-center gap-3 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#ffbc09] via-[#f59e0b] to-[#ffd15c] text-[#150604] font-mono font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(255,188,9,0.4)] hover:scale-105 transition-all group"
            >
              <span>TRUY CẬP TRANG TRỰC TIẾP</span>
              <ExternalLink className="w-4 h-4 text-[#150604] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Awards / Recognition */}
          <div className="pt-4 border-t border-[#47140b] space-y-1 text-xs font-mono text-[#ece7e0]/60">
            {project.awards.map((award, idx) => (
              <p key={idx} className="flex items-center gap-1.5 text-white">
                <span className="text-[#ffbc09] font-bold">★</span>
                <span>{award}</span>
              </p>
            ))}
          </div>
        </motion.div>

      </div>

      {/* 5. Minimalist Bottom-Left Indicator */}
      <div className="absolute bottom-6 left-8 z-20 flex items-center gap-3 text-xs font-mono text-[#ece7e0]/60 pointer-events-none">
        <span className="text-[#ffbc09] font-bold">{project.num} / 05</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">STUDENT HUB AI 2026 ARCHITECTURE</span>
      </div>
    </motion.div>
  );
}

/**
 * Main RobinPayotRoadCanvas Component
 */
export default function RobinPayotRoadCanvas({ showHud = true, onSelectProject }) {
  const [scrollProgress, setScrollProgress] = useState(0);
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

  const handleSelect = (project) => {
    setSelectedProject(project);
    if (onSelectProject) onSelectProject(project);
  };

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
      <div className="fixed inset-0 pointer-events-auto z-0 w-full h-full">
        {/* 1. Deep Atmospheric Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#150604] via-[#070403] to-[#150604] opacity-95 pointer-events-none" />

        {/* 2. Three.js 3D WebGL Scene */}
        <Canvas
          camera={{ position: [0, 2, 12], fov: 50, near: 0.1, far: 300 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 1.5]}
          className="w-full h-full"
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 20, 15]} intensity={1.5} color="#ffbc09" />
          <pointLight position={[-15, -5, -40]} intensity={2.0} color="#ffd15c" />
          <pointLight position={[15, 10, -90]} intensity={2.0} color="#f59e0b" />

          <CameraFlightController scrollYProgress={scrollProgress} />
          <CurvedRoadTrack />
          <FloatingChromeBlobs />

          {ROAD_PROJECTS.map((project) => (
            <CurvedBillboard
              key={project.id}
              project={project}
              onSelect={handleSelect}
            />
          ))}
        </Canvas>

        {/* 3. Minimalist HUD Bottom-Left */}
        {showHud && (
          <div className="fixed bottom-6 left-8 z-30 pointer-events-auto flex items-center gap-3 select-none font-mono">
            <div className="flex -space-x-2 items-center">
              <div className="w-4 h-4 rounded-full border border-[#ffbc09] animate-spin" />
              <div className="w-4 h-4 rounded-full border border-[#ffd15c] animate-spin animation-delay-200" />
            </div>
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-3 bg-[#ffbc09] animate-pulse" />
              <span className="w-0.5 h-2 bg-[#ffbc09] animate-pulse animation-delay-150" />
              <span className="w-0.5 h-3.5 bg-[#ffbc09] animate-pulse animation-delay-300" />
            </div>
            <span className="text-[10px] text-[#ffbc09]/80 font-bold">
              3D HIGHWAY FLIGHT // SCROLL ĐỂ LƯỚT QUA CÁC BẢNG ĐEN
            </span>
          </div>
        )}
      </div>

      {/* 4. Fullscreen Detail Inspection View Modal (Z-INDEX 9999) */}
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
