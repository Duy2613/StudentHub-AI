"use client";

import React, { useEffect, useRef } from "react";
import { Sparkles, Bot, Code2, Database, ShieldCheck, Star } from "lucide-react";
import { motion, useMotionValue, useSpring, useAnimationFrame } from "framer-motion";

const DEFAULT_ORBS = [
  { id: 1, label: "AI Socratic 2.0", icon: Bot, color: "from-indigo-500 to-purple-500", top: "15%", left: "8%", size: "md" },
  { id: 2, label: "Algorithmic Code", icon: Code2, color: "from-cyan-500 to-blue-500", top: "25%", right: "8%", size: "sm" },
  { id: 3, label: "Verified Mentor", icon: Star, color: "from-amber-500 to-orange-500", top: "60%", left: "5%", size: "sm" },
  { id: 4, label: "+30 Uy Tín (.EDU)", icon: ShieldCheck, color: "from-emerald-500 to-teal-500", top: "50%", right: "12%", size: "md" },
  { id: 5, label: "Quantum Vector DB", icon: Database, color: "from-purple-500 to-pink-500", top: "75%", right: "5%", size: "xs" },
];

function FloatingOrb({ item, mousePos }) {
  const Icon = item.icon || Sparkles;
  const orbRef = useRef(null);

  // Motion values for smooth spring physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 100, mass: 1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const [phase] = React.useState(() => Math.random() * Math.PI * 2);

  useAnimationFrame((t) => {
    if (!orbRef.current) return;

    // Ambient floating harmonic
    const time = t / 1000;
    const floatX = Math.cos(time * 1.2 + phase) * 8;
    const floatY = Math.sin(time * 1.5 + phase) * 12;

    // Calculate repel force
    const rect = orbRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Fallback if mouse hasn't moved
    const mx = mousePos.current.x === -1 ? centerX : mousePos.current.x;
    const my = mousePos.current.y === -1 ? centerY : mousePos.current.y;

    const dist = Math.hypot(mx - centerX, my - centerY);
    const maxDist = 250; // Increased interaction radius for premium feel

    let targetX = 0;
    let targetY = 0;

    if (dist < maxDist && dist > 0.1) {
      const force = Math.pow(1 - dist / maxDist, 2) * 80; // Non-linear force for smoother repel
      const angle = Math.atan2(centerY - my, centerX - mx);
      targetX = Math.cos(angle) * force;
      targetY = Math.sin(angle) * force;
    }

    // Combine repel target + float offset
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
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: item.id * 0.1, ease: "easeOut" }}
      className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-space-950/70 border border-white/15 backdrop-blur-xl shadow-glass-deep text-white text-xs font-semibold select-none cursor-default transition-all duration-300 hover:shadow-neon-primary hover:border-indigo-500/30"
    >
      <div className={`p-1.5 rounded-xl bg-gradient-to-tr ${item.color} text-white shadow-md`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="tracking-tight text-slate-200">{item.label}</span>
    </motion.div>
  );
}

/**
 * FloatingForcefieldOrbs: High-end interactive floating badges.
 * Uses Framer Motion for buttery smooth physics, repelling gently from the cursor.
 */
export default function FloatingForcefieldOrbs({
  items = DEFAULT_ORBS,
  className = "absolute inset-0 pointer-events-none overflow-hidden z-20",
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
    
    // Reset mouse pos when leaving window to stop repel force
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
