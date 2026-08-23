"use client";

import React, { useEffect, useRef } from "react";
import { Sparkles, Bot, Code2, Database, ShieldCheck, GraduationCap, Star, Zap } from "lucide-react";

const DEFAULT_ORBS = [
  { id: 1, label: "AI Socratic 2.0", icon: Bot, color: "from-indigo-500 to-purple-500", top: "12%", left: "6%", size: "md" },
  { id: 2, label: "Algorithmic Code", icon: Code2, color: "from-cyan-500 to-blue-500", top: "25%", right: "8%", size: "sm" },
  { id: 3, label: "Verified Mentor", icon: Star, color: "from-amber-500 to-orange-500", top: "72%", left: "10%", size: "sm" },
  { id: 4, label: "+30 Uy Tín (.EDU)", icon: ShieldCheck, color: "from-emerald-500 to-teal-500", top: "68%", right: "6%", size: "md" },
  { id: 5, label: "Quantum Vector DB", icon: Database, color: "from-purple-500 to-pink-500", top: "85%", left: "48%", size: "xs" },
];

/**
 * FloatingForcefieldOrbs: Inspired by the Soda 3D showcase.
 * Knowledge capsules and badges that float with gentle ambient harmonic oscillation
 * and are forcefully repelled when the user's cursor approaches them.
 */
export default function FloatingForcefieldOrbs({
  items = DEFAULT_ORBS,
  className = "absolute inset-0 pointer-events-none overflow-hidden z-20",
}) {
  const containerRef = useRef(null);
  const elementsRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const state = items.map(() => ({
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      phase: Math.random() * Math.PI * 2,
    }));

    const handleMouseMove = (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      elementsRef.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dist = Math.hypot(mouseX - centerX, mouseY - centerY);
        const maxDist = 200;

        if (dist < maxDist) {
          const force = (1 - dist / maxDist) * 55;
          const angle = Math.atan2(centerY - mouseY, centerX - mouseX);
          state[i].targetX = Math.cos(angle) * force;
          state[i].targetY = Math.sin(angle) * force;
        } else {
          state[i].targetX = 0;
          state[i].targetY = 0;
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animId;
    const loop = (now) => {
      const t = now / 1000;

      elementsRef.current.forEach((el, i) => {
        if (!el) return;
        const s = state[i];
        // Spring physics
        s.currentX += (s.targetX - s.currentX) * 0.08;
        s.currentY += (s.targetY - s.currentY) * 0.08;

        // Ambient floating harmonic
        const floatY = Math.sin(t * 1.5 + s.phase) * 8;
        const floatX = Math.cos(t * 1.2 + s.phase) * 5;

        el.style.transform = `translate3d(${s.currentX + floatX}px, ${s.currentY + floatY}px, 0)`;
      });

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [items]);

  return (
    <div ref={containerRef} className={className} aria-hidden="true">
      {items.map((item, idx) => {
        const Icon = item.icon || Sparkles;
        return (
          <div
            key={item.id || idx}
            ref={(el) => (elementsRef.current[idx] = el)}
            style={{
              position: "absolute",
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
            }}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-space-950/70 border border-white/15 backdrop-blur-xl shadow-glass-deep text-white text-xs font-semibold select-none cursor-default transition-shadow hover:shadow-neon-primary"
          >
            <div className={`p-1.5 rounded-xl bg-gradient-to-tr ${item.color} text-white shadow-md`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-tight text-slate-200">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
