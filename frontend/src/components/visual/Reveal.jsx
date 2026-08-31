"use client";

import React from "react";
import { motion } from "framer-motion";
import { useReducedMotionState } from "./ReducedMotionBoundary";

const EASE_EDITORIAL = [0.16, 1, 0.3, 1];

export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  duration = 0.7,
  once = true,
  amount = 0.2,
}) {
  const reducedMotion = useReducedMotionState();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE_EDITORIAL }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
