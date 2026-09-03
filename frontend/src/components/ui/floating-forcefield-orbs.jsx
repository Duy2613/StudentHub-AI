"use client";

import React, { useEffect, useRef } from "react";
import { Sparkles, Bot, Code2, Database, ShieldCheck, Star } from "lucide-react";
import { motion, useMotionValue, useSpring, useAnimationFrame } from "framer-motion";

const DEFAULT_ORBS = [
  { id: 1, label: "AI Socratic 2.0", icon: Bot, color: "from-indigo-500 to-purple-500", top: "18%", left: "7%", glow: "rgba(99,102,241,0.4)" },
  { id: 2, label: "Algorithmic Code", icon: Code2, color: "from-cyan-500 to-blue-500", top: "22%", right: "8%", glow: "rgba(6,182,212,0.4)" },
  { id: 3, label: "Verified Mentor", icon: Star, color: "from-amber-500 to-orange-500", top: "68%", left: "6%", glow: "rgba(245,158,11,0.4)" },
  { id: 4, label: "+30 Uy Tín (.EDU)", icon: ShieldCheck, color: "from-emerald-500 to-teal-500", top: "54%", right: "7%", glow: "rgba(52,231,196,0.4)" },
  { id: 5, label: "Quantum Vector DB", icon: Database, color: "from-purple-500 to-pink-500", top: "78%", right: "10%", glow: "rgba(168,85,247,0.4)" },
];

function FloatingOrb({ item, mousePos }) {
  const Icon = item.icon || Sparkles;
  const orbRef = useRef(null);

  // Motion values for smooth spring physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 90, mass: 0.8 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const [phase] = React.useState(() => Math.random() * Math.PI * 2);

  useAnimationFrame((t) => {
    if (!orbRef.current) return;

    // Ambient floating harmonic
    const time = t / 1000;
    const floatX = Math.cos(time * 0.9 + phase) * 6;
    const floatY = Math.sin(time * 1.2 + phase) * 8;

    // Calculate repel force
    const rect = orbRef.current.getBoundingClientRect();
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
        const force = Math.pow(1 - dist / maxDist, 1.8) * 65;
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
      ref={orbRef}
      style={{
        position: "absolute",
        top: item.top,
        left: item.left,
        right: item.right,
        bottom: item.bottom,
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: (item.id || 1) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="hidden xl:inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-2xl shadow-glass-deep text-white text-xs font-semibold select-none cursor-default transition-all duration-300 hover:border-white/25 hover:shadow-neon-primary group/orb"
    >
      <div className={`p-1.5 rounded-xl bg-gradient-to-tr ${item.color} text-white shadow-md group-hover/orb:scale-105 transition-transform`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="tracking-tight text-slate-200 font-medium">{item.label}</span>
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover/orb:opacity-100 transition-opacity"
        style={{
          boxShadow: `0 0 20px ${item.glow}`,
        }}
      />
    </motion.div>
  );
}

/**
 * FloatingForcefieldOrbs: High-end interactive floating telemetry badges.
 * Soft spring physics with non-linear cursor repulsion, hidden on small screens to preserve clean ergonomics.
 */
export default function FloatingForcefieldOrbs({
  items = DEFAULT_ORBS,
  className = "absolute inset-0 pointer-events-none overflow-hidden z-10",
}) {
  const containerRef = useRef(null);
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

  return (
    <div ref={containerRef} className={className} aria-hidden="true">
      {items.map((item, idx) => (
        <FloatingOrb key={item.id || idx} item={item} mousePos={mousePos} />
      ))}
    </div>
  );
}
