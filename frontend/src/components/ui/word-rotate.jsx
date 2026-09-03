"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * WordRotate: High-end kinetic text rotator.
 * Engineered for Vietnamese typography with ample vertical line-height
 * and ascender/descender headroom to prevent diacritic clipping.
 */
export const WordRotate = ({
  words = [],
  duration = 2800,
  framerProps = {
    initial: { opacity: 0, y: 14, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -14, filter: "blur(4px)" },
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
  className,
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  if (words.length === 0) return null;

  return (
    <span className="inline-block relative overflow-visible py-1.5 align-baseline">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          className={cn("inline-block font-extrabold whitespace-normal sm:whitespace-nowrap", className)}
          {...framerProps}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
