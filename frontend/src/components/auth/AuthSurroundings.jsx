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
  Activity,
  Cpu,
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
      <div className="group relative p-3.5 rounded-2xl bg-space-950/90 backdrop-blur-2xl border border-white/15 shadow-glass-deep hover:border-white/30 transition-all duration-300 hover:shadow-neon-primary min-w-[215px] max-w-[260px]">
        {/* Glow halo */}
        <div
          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-lg pointer-events-none -z-10"
          style={{ background: item.glow }}
        />
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${item.color} text-white shadow-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-white tracking-tight truncate">{item.title}</span>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-200 font-mono font-semibold border border-white/10">
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
                  {item.extra.liveDot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {item.extra.left}
                </span>
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
        className="w-[740px] h-[740px] sm:w-[880px] sm:h-[880px] opacity-35 animate-[spin_70s_linear_infinite]"
        viewBox="0 0 800 800"
        fill="none"
      >
        <circle
          cx="400"
          cy="400"
          r="360"
          stroke="#6366f1"
          strokeWidth="1.2"
          strokeDasharray="6 14"
        />
        <circle cx="400" cy="40" r="4.5" fill="#34e7c4" className="animate-pulse" />
        <circle cx="760" cy="400" r="3.5" fill="#818cf8" />
        <circle cx="40" cy="400" r="4" fill="#f59e0b" />
        <circle cx="650" cy="650" r="3.5" fill="#ec4899" />
      </svg>

      {/* Middle Counter-Rotating Ring */}
      <svg
        className="absolute w-[580px] h-[580px] sm:w-[700px] sm:h-[700px] opacity-45 animate-[spin_45s_linear_infinite_reverse]"
        viewBox="0 0 600 600"
        fill="none"
      >
        <circle
          cx="300"
          cy="300"
          r="270"
          stroke="#34e7c4"
          strokeWidth="1.2"
          strokeDasharray="4 10"
        />
        <circle cx="300" cy="30" r="3.5" fill="#34e7c4" />
        <circle cx="570" cy="300" r="3.5" fill="#a855f7" />
        <circle cx="100" cy="480" r="3" fill="#60a5fa" />
      </svg>

      {/* Inner Glowing Orbit Circle */}
      <div className="absolute w-[460px] h-[460px] sm:w-[540px] sm:h-[540px] rounded-full border border-indigo-500/25 opacity-60 shadow-[0_0_90px_rgba(99,102,241,0.3)] animate-pulse" />

      {/* Radial Backlight behind the central card */}
      <div className="absolute w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-purple-600/25 to-teal-500/20 blur-[130px] pointer-events-none" />
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
      subtitle: "Phân tích đa bước & LaTeX",
      icon: Bot,
      color: "from-indigo-500 to-purple-600",
      glow: "rgba(99,102,241,0.45)",
      badge: "ACTIVE",
      delay: 0.1,
      customContent: (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-300 font-mono">
          <span className="inline-block w-1 h-3 bg-indigo-400 animate-pulse" />
          <span className="inline-block w-1 h-2 bg-indigo-400 animate-pulse animation-delay-200" />
          <span className="inline-block w-1 h-4 bg-indigo-400 animate-pulse animation-delay-400" />
          <span className="inline-block w-1 h-2 bg-indigo-400 animate-pulse animation-delay-300" />
          <span className="ml-1 text-gray-300 truncate">Socratic CoT Engine</span>
        </div>
      ),
      extra: { left: "120K+ bài giải", right: "● Sẵn sàng", liveDot: true },
      pos: "top-[16%] left-[2%] xl:left-[5%] hidden md:block",
    },
    {
      id: 2,
      title: "Cố Vấn Chuyên Gia 1:1",
      subtitle: "TS. Nguyễn Minh Đức & 30+ Mentors",
      icon: Star,
      color: "from-amber-500 to-orange-500",
      glow: "rgba(245,158,11,0.45)",
      badge: "TOP 1%",
      delay: 0.25,
      customContent: (
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-amber-500/80 border border-black text-[8px] flex items-center justify-center font-bold text-black">Đ</div>
            <div className="w-4 h-4 rounded-full bg-indigo-500/80 border border-black text-[8px] flex items-center justify-center font-bold text-white">N</div>
            <div className="w-4 h-4 rounded-full bg-teal-500/80 border border-black text-[8px] flex items-center justify-center font-bold text-black">H</div>
          </div>
          <span className="text-[10px] text-amber-300 font-medium">HUST, VNU, UIT</span>
        </div>
      ),
      extra: { left: "Học thuật 1:1", right: "★ 4.98/5.0", liveDot: false },
      pos: "bottom-[16%] left-[2%] xl:left-[5%] hidden md:block",
    },
  ];

  const RIGHT_ITEMS = [
    {
      id: 3,
      title: "Code Sandbox Engine",
      subtitle: "def dijkstra(): heapq.heappop",
      icon: Code2,
      color: "from-cyan-500 to-blue-600",
      glow: "rgba(6,182,212,0.45)",
      badge: "O(log N)",
      delay: 0.2,
      customContent: (
        <div className="mt-1.5 px-2 py-0.5 rounded bg-black/50 border border-cyan-500/20 text-[9px] font-mono text-cyan-300">
          <span>Python 3.12 • [0.002s]</span>
        </div>
      ),
      extra: { left: "Python, TS, C++", right: "⚡ Real-time", liveDot: true },
      pos: "top-[18%] right-[2%] xl:right-[5%] hidden md:block",
    },
    {
      id: 4,
      title: "Academic Edu Trust",
      subtitle: "Xác thực Đại học Bách Khoa, CNTT, FPT",
      icon: ShieldCheck,
      color: "from-emerald-500 to-teal-600",
      glow: "rgba(52,231,196,0.45)",
      badge: "+30 PTS",
      delay: 0.35,
      customContent: (
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Edu SSO Verified Campus</span>
        </div>
      ),
      extra: { left: "Bảo mật chuẩn", right: "✓ Đã xác thực", liveDot: false },
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
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-indigo-400" />
          <span>Về Trang Chủ</span>
        </Link>

        <div className="flex items-center gap-3">
          <LiveStudioClock />
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-mono text-indigo-200 backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>v2.8 Hub</span>
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
        <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-5 py-2 rounded-full bg-space-950/80 border border-white/10 backdrop-blur-md text-[11px] text-gray-300 shadow-glass-deep">
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
