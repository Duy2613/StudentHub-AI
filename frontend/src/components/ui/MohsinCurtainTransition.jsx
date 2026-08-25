"use client";

// frontend/src/components/ui/MohsinCurtainTransition.jsx
//
// 5-Bar Staggered Shutter Curtain Scene Transition (Inspired by Meer Mohsin Portfolio - meermohsin.me)
// - 5 columns of dark cocoa obsidian shutter bars with staggered easing
// - Telemetry transition badge: [ SCENE_SWITCH // 01 -> 02 ]
// - Supports trigger on route changes, auth mode switches, or modal openings.

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function MohsinCurtainTransition({
  isActive = false,
  onTransitionComplete = null,
  label = "SCENE_SWITCH // INITIALIZED",
  children,
}) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Main Page/Component Content */}
      <div className="relative z-10 w-full h-full">{children}</div>

      {/* 5-Bar Staggered Shutter Overlay */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 z-[9999] pointer-events-none grid grid-cols-5"
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                initial={{ scaleY: 0, originY: 0 }}
                animate={{
                  scaleY: [0, 1, 1, 0],
                  originY: [0, 0, 1, 1],
                }}
                transition={{
                  duration: 0.85,
                  delay: index * 0.065,
                  times: [0, 0.45, 0.6, 1],
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="relative h-full bg-[#150604] border-r border-[#47140b]/60 flex items-center justify-center overflow-hidden"
              >
                {/* Subtle Amber Glow Line along bar edge */}
                <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-[#ffbc09]/40 to-transparent" />
                
                {/* Center Column displays Telemetry Badge during transition */}
                {index === 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.95] }}
                    transition={{ duration: 0.75, times: [0, 0.3, 0.7, 1] }}
                    className="absolute z-20 px-3 py-1.5 rounded-lg bg-[#210a07] border border-[#ffbc09]/40 text-[#ffbc09] font-mono text-[11px] tracking-widest uppercase shadow-[0_0_25px_rgba(255,188,9,0.3)] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffbc09] animate-pulse" />
                    <span>{label}</span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
