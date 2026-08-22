"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
}) {
  const ref = useRef(null);
  const [displayValue, setDisplayValue] = useState(direction === "down" ? value : 0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1800; // ms

    const startVal = direction === "down" ? value : 0;
    const endVal = value;

    const timeout = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing: easeOutExpo
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = startVal + (endVal - startVal) * easeProgress;
        
        setDisplayValue(current);

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setDisplayValue(endVal);
        }
      };

      window.requestAnimationFrame(step);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, direction, delay]);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tabular-nums tracking-tight font-mono",
        className
      )}
    >
      {Number(displayValue).toFixed(decimalPlaces)}
    </span>
  );
}
