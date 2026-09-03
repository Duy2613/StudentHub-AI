"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionState } from "./ReducedMotionBoundary";

const SPRING = { type: "spring", stiffness: 150, damping: 15, mass: 0.1 };

export function MagneticTarget({
  children,
  className = "",
  strength = 12,
  ...props
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const reducedMotion = useReducedMotionState();

  const handleMouseMove = (e) => {
    if (reducedMotion || !ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({
      x: (middleX / (width / 2)) * strength,
      y: (middleY / (height / 2)) * strength,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  if (reducedMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={SPRING}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default MagneticTarget;
