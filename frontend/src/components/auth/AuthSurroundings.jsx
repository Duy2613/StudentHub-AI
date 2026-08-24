"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Sparkles,
  Zap,
  Lock,
  Network,
  CheckCircle2,
  Activity,
  Cpu,
  GraduationCap,
  ShieldAlert,
  Users,
  Award
} from "lucide-react";
import { motion, useMotionValue, useSpring, useAnimationFrame } from "framer-motion";
import LiveStudioClock from "@/components/ui/live-studio-clock";

// Floating telemetry chip with spring repulsion and animated micro-elements
function TelemetryBadge({ item, mousePos, positionClass }) {
  const Icon = item.icon || Sparkles;
  const chipRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 25, stiffness: 85, mass: 0.85 });
  const springY = useSpring(y, { damping: 25, stiffness: 85, mass: 0.85 });

  const [phase] = React.useState(() => Math.random() * Math.PI * 2);

  useAnimationFrame((t) => {
    if (!chipRef.current) return;
    const time = t / 1000;
    const floatX = Math.cos(time * 0.9 + phase) * 6;
    const floatY = Math.sin(time * 1.2 + phase) * 8;

    const rect = chipRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mx = mousePos.current.x;
    const my = mousePos.current.y;

    let targetX = 0;
    let targetY = 0;

    if (mx !== -1 && my !== -1) {
      const dist = Math.hypot(mx - centerX, my - centerY);
      const maxDist = 200;

      if (dist < maxDist && dist > 0.1) {
        const force = Math.pow(1 - dist / maxDist, 1.8) * 45;
        const angle = Math.atan2(centerY - my, centerX - mx);
        targetX = Math.cos(angle) * force;
        targetY = Math.sin(angle) * force;
      }
    }

    x.set(targetX + floatX);
    y.set(targetY + floatY);
  });

  return (
    <motion.div
      ref={chipRef}
      style={{ x: springX, y: springY }}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: item.delay, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute ${positionClass} z-20 pointer-events-auto select-none`}
    >
      <div className="group relative p-3.5 rounded-2xl bg-space-950/90 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-teal-400/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(52,231,196,0.3)] min-w-[220px] max-w-[265px]">
        {/* Glow halo */}
        <div
          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-lg pointer-events-none -z-10"
          style={{ background: item.glow }}
        />
        
        {/* Shimmering Corner Sparkle */}
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-300 opacity-60 animate-ping" />

        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${item.color} text-white shadow-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-white tracking-tight truncate">{item.title}</span>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-teal-300 font-mono font-semibold border border-teal-500/30">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-300 mt-0.5 leading-snug line-clamp-1">{item.subtitle}</p>
            
            {/* Custom interactive micro elements */}
            {item.customContent}

            {item.extra && (
              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  {item.extra.liveDot && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />}
                  {item.extra.left}
                </span>
                <span className="font-semibold text-teal-300">{item.extra.right}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Concentric Sparkling Astrolabe Orbital Rings behind the Central Card
 */
function CosmicAstrolabeRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden">
      {/* Outer Rotating Dashed Ring with Twinkling Star Nodes */}
      <svg
        className="w-[760px] h-[760px] sm:w-[920px] sm:h-[920px] opacity-40 animate-[spin_80s_linear_infinite]"
        viewBox="0 0 800 800"
        fill="none"
      >
        <circle
          cx="400"
          cy="400"
          r="370"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeDasharray="6 16"
        />
        <circle cx="400" cy="30" r="5" fill="#34e7c4" className="animate-pulse shadow-[0_0_12px_#34e7c4]" />
        <circle cx="770" cy="400" r="4" fill="#818cf8" />
        <circle cx="30" cy="400" r="4.5" fill="#fde047" />
        <circle cx="660" cy="660" r="4" fill="#ec4899" />
        <circle cx="140" cy="140" r="3.5" fill="#38bdf8" />
      </svg>

      {/* Middle Counter-Rotating Ring with Shimmering Cyan Accents */}
      <svg
        className="absolute w-[600px] h-[600px] sm:w-[740px] sm:h-[740px] opacity-50 animate-[spin_50s_linear_infinite_reverse]"
        viewBox="0 0 600 600"
        fill="none"
      >
        <circle
          cx="300"
          cy="300"
          r="280"
          stroke="#34e7c4"
          strokeWidth="1.2"
          strokeDasharray="4 12"
        />
        <circle cx="300" cy="20" r="4" fill="#34e7c4" />
        <circle cx="580" cy="300" r="4" fill="#a855f7" />
        <circle cx="90" cy="510" r="3.5" fill="#60a5fa" />
        <circle cx="510" cy="90" r="3.5" fill="#fde047" />
      </svg>

      {/* Inner Glowing Orbit Circle with Pulsing Diamond Core */}
      <div className="absolute w-[480px] h-[480px] sm:w-[580px] sm:h-[580px] rounded-full border border-teal-400/30 opacity-70 shadow-[0_0_100px_rgba(52,231,196,0.25)] animate-pulse" />

      {/* Radiant Prismatic Backlight Flare behind the central card */}
      <div className="absolute w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-indigo-600/35 via-purple-600/30 to-teal-400/25 blur-[140px] pointer-events-none" />
    </div>
  );
}

/**
 * AuthSurroundings: Fills the surrounding space around /login and /register with
 * interactive floating telemetry cards, cosmic astrolabe orbital rings, top control bar,
 * and bottom security guarantee.
 */
export default function AuthSurroundings({ children }) {
  const mousePos = useRef({ x: -1, y: -1 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mousePos.current = { x: -1, y: -1 };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const LEFT_ITEMS = [
    {
      id: 1,
      title: "Động Cơ AI 4 Lớp",
      subtitle: "Phân tích Link, Text & OCR Ảnh",
      icon: ShieldAlert,
      color: "from-teal-500 to-indigo-600",
      glow: "rgba(52,231,196,0.45)",
      badge: "ACTIVE",
      delay: 0.1,
      customContent: (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-teal-300 font-mono">
          <span className="inline-block w-1 h-3 bg-teal-400 animate-pulse" />
          <span className="inline-block w-1 h-2 bg-teal-400 animate-pulse animation-delay-200" />
          <span className="inline-block w-1 h-4 bg-teal-400 animate-pulse animation-delay-400" />
          <span className="inline-block w-1 h-2 bg-teal-400 animate-pulse animation-delay-300" />
          <span className="ml-1 text-gray-300 truncate">4-Layer Verification</span>
        </div>
      ),
      extra: { left: ">1,000 Mẫu lừa đảo", right: "● 0.1s - 3s", liveDot: true },
      pos: "top-[16%] left-[2%] xl:left-[5%] hidden md:block",
    },
    {
      id: 2,
      title: "Mạng Lưới Chuyên Gia",
      subtitle: "8 Chuyên ngành thẩm định thực chứng",
      icon: Users,
      color: "from-amber-500 to-orange-500",
      glow: "rgba(245,158,11,0.45)",
      badge: "TOP 5",
      delay: 0.25,
      customContent: (
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-amber-500/80 border border-black text-[8px] flex items-center justify-center font-bold text-black">A</div>
            <div className="w-4 h-4 rounded-full bg-teal-500/80 border border-black text-[8px] flex items-center justify-center font-bold text-black">L</div>
            <div className="w-4 h-4 rounded-full bg-indigo-500/80 border border-black text-[8px] flex items-center justify-center font-bold text-white">T</div>
          </div>
          <span className="text-[10px] text-amber-300 font-medium">Luật, An ninh mạng, Trọ</span>
        </div>
      ),
      extra: { left: "Xác thực 2 chiều", right: "★ 80-100 pts", liveDot: false },
      pos: "bottom-[16%] left-[2%] xl:left-[5%] hidden md:block",
    },
  ];

  const RIGHT_ITEMS = [
    {
      id: 3,
      title: "Sáng Tạo Trẻ AI 2026",
      subtitle: "Cuộc thi Quốc gia • Bảng C Sinh viên",
      icon: Award,
      color: "from-indigo-500 to-purple-600",
      glow: "rgba(99,102,241,0.45)",
      badge: "OFFICIAL",
      delay: 0.2,
      customContent: (
        <div className="mt-1.5 px-2 py-0.5 rounded bg-black/50 border border-indigo-500/30 text-[9px] font-mono text-indigo-300">
          <span>StudentHub AI • Verified Hub</span>
        </div>
      ),
      extra: { left: "100% Phi thương mại", right: "⚡ Real-time", liveDot: true },
      pos: "top-[18%] right-[2%] xl:right-[5%] hidden md:block",
    },
    {
      id: 4,
      title: "Cấp Điểm Edu Tự Động",
      subtitle: "Email .edu nhận ngay +30đ Uy Tín",
      icon: GraduationCap,
      color: "from-emerald-500 to-teal-600",
      glow: "rgba(52,231,196,0.45)",
      badge: "+30 PTS",
      delay: 0.35,
      customContent: (
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Edu SSO Campus Verified</span>
        </div>
      ),
      extra: { left: "Bảo vệ sinh viên", right: "✓ Đã kích hoạt", liveDot: false },
      pos: "bottom-[18%] right-[2%] xl:right-[5%] hidden md:block",
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* 1. Top Bar: Back to Home + Live Clock + Version Badge */}
      <header className="relative z-30 w-full px-4 sm:px-8 pt-5 pb-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/15 border border-white/15 text-xs font-semibold text-gray-200 hover:text-white backdrop-blur-xl shadow-glass-deep transition-all hover:scale-105 active:scale-95 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-teal-400" />
          <span>Về Trang Chủ</span>
        </Link>

        <div className="flex items-center gap-3">
          <LiveStudioClock />
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-[11px] font-mono text-teal-200 backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>StudentHub AI 2026</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area with Astrolabe Rings & Floating Telemetry */}
      <div className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4">
        {/* Astrolabe Orbital Rings */}
        <CosmicAstrolabeRings />

        {/* Left Flank Floating Badges */}
        {LEFT_ITEMS.map((item) => (
          <TelemetryBadge
            key={item.id}
            item={item}
            mousePos={mousePos}
            positionClass={item.pos}
          />
        ))}

        {/* Central Auth Form Card */}
        <div className="relative z-10 w-full flex justify-center">
          {children}
        </div>

        {/* Right Flank Floating Badges */}
        {RIGHT_ITEMS.map((item) => (
          <TelemetryBadge
            key={item.id}
            item={item}
            mousePos={mousePos}
            positionClass={item.pos}
          />
        ))}
      </div>

      {/* 3. Bottom Security Guarantee Bar */}
      <footer className="relative z-30 w-full px-4 py-4 text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-5 py-2 rounded-full bg-space-950/85 border border-white/10 backdrop-blur-md text-[11px] text-gray-300 shadow-glass-deep">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-teal-400" />
            <span>Mã hóa End-to-End 256-bit</span>
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Xác thực Edu SSO &amp; OAuth 2.0</span>
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Bảo vệ quyền riêng tư 100%</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
