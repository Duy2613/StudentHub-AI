"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Code2,
  ShieldCheck,
  Star,
  Sparkles,
  Zap,
  Lock,
  Network,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useAnimationFrame } from "framer-motion";
import LiveStudioClock from "@/components/ui/live-studio-clock";

// Floating telemetry chip with spring repulsion
function TelemetryBadge({ item, mousePos, positionClass }) {
  const Icon = item.icon || Sparkles;
  const chipRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 25, stiffness: 80, mass: 0.9 });
  const springY = useSpring(y, { damping: 25, stiffness: 80, mass: 0.9 });

  const [phase] = React.useState(() => Math.random() * Math.PI * 2);

  useAnimationFrame((t) => {
    if (!chipRef.current) return;
    const time = t / 1000;
    const floatX = Math.cos(time * 0.8 + phase) * 5;
    const floatY = Math.sin(time * 1.1 + phase) * 7;

    const rect = chipRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mx = mousePos.current.x;
    const my = mousePos.current.y;

    let targetX = 0;
    let targetY = 0;

    if (mx !== -1 && my !== -1) {
      const dist = Math.hypot(mx - centerX, my - centerY);
      const maxDist = 220;

      if (dist < maxDist && dist > 0.1) {
        const force = Math.pow(1 - dist / maxDist, 1.8) * 55;
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: item.delay, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute ${positionClass} z-20 pointer-events-auto select-none`}
    >
      <div className="group relative p-3.5 rounded-2xl bg-space-950/85 backdrop-blur-2xl border border-white/10 shadow-glass-deep hover:border-white/25 transition-all duration-300 hover:shadow-neon-primary min-w-[210px] max-w-[250px]">
        {/* Glow halo */}
        <div
          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-md pointer-events-none -z-10"
          style={{ background: item.glow }}
        />
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl bg-gradient-to-tr ${item.color} text-white shadow-md shrink-0 mt-0.5`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-white tracking-tight truncate">{item.title}</span>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono font-semibold">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-300 mt-0.5 leading-snug line-clamp-1">{item.subtitle}</p>
            {item.extra && (
              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
                <span>{item.extra.left}</span>
                <span className="font-semibold text-emerald-400">{item.extra.right}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Concentric Astrolabe Orbital Rings behind the Central Card
 */
function CosmicAstrolabeRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden">
      {/* Outer Rotating Dashed Ring */}
      <svg
        className="w-[720px] h-[720px] sm:w-[840px] sm:h-[840px] opacity-25 animate-[spin_80s_linear_infinite]"
        viewBox="0 0 800 800"
        fill="none"
      >
        <circle
          cx="400"
          cy="400"
          r="360"
          stroke="#6366f1"
          strokeWidth="1"
          strokeDasharray="6 14"
        />
        <circle
          cx="400"
          cy="40"
          r="4"
          fill="#34e7c4"
          className="animate-pulse"
        />
        <circle
          cx="760"
          cy="400"
          r="3"
          fill="#818cf8"
        />
        <circle
          cx="40"
          cy="400"
          r="3.5"
          fill="#f59e0b"
        />
      </svg>

      {/* Middle Counter-Rotating Ring */}
      <svg
        className="absolute w-[560px] h-[560px] sm:w-[660px] sm:h-[660px] opacity-35 animate-[spin_50s_linear_infinite_reverse]"
        viewBox="0 0 600 600"
        fill="none"
      >
        <circle
          cx="300"
          cy="300"
          r="270"
          stroke="#34e7c4"
          strokeWidth="1"
          strokeDasharray="4 10"
        />
        <circle
          cx="300"
          cy="30"
          r="3"
          fill="#34e7c4"
        />
        <circle
          cx="570"
          cy="300"
          r="3"
          fill="#a855f7"
        />
      </svg>

      {/* Inner Glowing Orbit Circle */}
      <div className="absolute w-[440px] h-[440px] sm:w-[520px] sm:h-[520px] rounded-full border border-indigo-500/20 opacity-50 shadow-[0_0_80px_rgba(99,102,241,0.25)]" />

      {/* Radial Backlight behind the central card */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600/25 via-purple-600/20 to-teal-500/15 blur-[120px] pointer-events-none" />
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
      title: "AI Mentor Socratic 2.0",
      subtitle: "Phân tích đa bước & Giải toán LaTeX",
      icon: Bot,
      color: "from-indigo-500 to-purple-600",
      glow: "rgba(99,102,241,0.35)",
      badge: "ACTIVE",
      delay: 0.1,
      extra: { left: "120K+ bài giải", right: "● Sẵn sàng" },
      pos: "top-[18%] left-[3%] xl:left-[6%] hidden lg:block",
    },
    {
      id: 2,
      title: "Cố Vấn Chuyên Gia 1:1",
      subtitle: "TS. Nguyễn Minh Đức & 30+ Mentor",
      icon: Star,
      color: "from-amber-500 to-orange-500",
      glow: "rgba(245,158,11,0.35)",
      badge: "TOP 1%",
      delay: 0.25,
      extra: { left: "Đánh giá học thuật", right: "★ 4.98/5.0" },
      pos: "bottom-[18%] left-[3%] xl:left-[6%] hidden lg:block",
    },
  ];

  const RIGHT_ITEMS = [
    {
      id: 3,
      title: "Code Sandbox Engine",
      subtitle: "def solve(graph): heapq.heappop",
      icon: Code2,
      color: "from-cyan-500 to-blue-600",
      glow: "rgba(6,182,212,0.35)",
      badge: "O(log N)",
      delay: 0.2,
      extra: { left: "Python, TS, C++", right: "⚡ Real-time" },
      pos: "top-[20%] right-[3%] xl:right-[6%] hidden lg:block",
    },
    {
      id: 4,
      title: "Academic Edu Trust",
      subtitle: "Xác thực Đại học Bách Khoa, CNTT, FPT",
      icon: ShieldCheck,
      color: "from-emerald-500 to-teal-600",
      glow: "rgba(52,231,196,0.35)",
      badge: "+30 PTS",
      delay: 0.35,
      extra: { left: "Edu SSO Verified", right: "✓ Đã xác thực" },
      pos: "bottom-[20%] right-[3%] xl:right-[6%] hidden lg:block",
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* 1. Top Bar: Back to Home + Live Clock + Version Badge */}
      <header className="relative z-30 w-full px-4 sm:px-8 pt-5 pb-2 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white backdrop-blur-xl shadow-glass-deep transition-all hover:scale-105 active:scale-95 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Về Trang Chủ</span>
        </Link>

        <div className="flex items-center gap-3">
          <LiveStudioClock />
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-[11px] font-mono text-indigo-300 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>v2.8 Hub</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area with Astrolabe Rings & Floating Telemetry */}
      <div className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
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
        <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-indigo-400" />
            <span>Mã hóa End-to-End 256-bit</span>
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Xác thực Edu SSO & OAuth 2.0</span>
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Phục vụ 24/7 không gián đoạn</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
