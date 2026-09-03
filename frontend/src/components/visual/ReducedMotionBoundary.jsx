"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const ReducedMotionContext = createContext(false);

export function useReducedMotionState() {
  return useContext(ReducedMotionContext);
}

export function ReducedMotionBoundary({ children }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const onChange = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return (
    <ReducedMotionContext.Provider value={prefersReducedMotion}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export default ReducedMotionBoundary;
