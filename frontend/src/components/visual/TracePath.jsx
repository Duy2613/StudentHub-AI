"use client";

import React from "react";
import { motion } from "framer-motion";
import { useReducedMotionState } from "./ReducedMotionBoundary";

const EASE_EDITORIAL = [0.16, 1, 0.3, 1];

export function TracePath({
  d,
  stroke = "var(--mineral-mint)",
  strokeWidth = 1.5,
  className = "",
  duration = 1.2,
  delay = 0,
}) {
  const reducedMotion = useReducedMotionState();

  if (reducedMotion) {
    return (
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        className={className}
      />
    );
  }

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      className={className}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: EASE_EDITORIAL }}
    />
  );
}

export default TracePath;
