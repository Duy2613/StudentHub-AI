"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * PageTransitionWrapper: Smooth, native-app-style page load transition.
 * - Gentle scale-blur fade entry
 * - Kinetic top energy accent beam
 */
export default function PageTransitionWrapper({ children, className = "" }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Top Kinetic Route Indicator */}
      <motion.div
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 origin-left z-[9999] pointer-events-none"
      />

      {/* Main Page Smooth Entrance */}
      <motion.div
        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
