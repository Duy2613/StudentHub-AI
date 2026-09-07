"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import KnowledgeUniverseFallback from "./KnowledgeUniverseFallback";

const KnowledgeUniverse3D = dynamic(() => import("./KnowledgeUniverse3D"), {
  ssr: false,
  loading: () => <KnowledgeUniverseFallback />,
});

function scheduleIdle(callback) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 2200 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 1400);
  return () => window.clearTimeout(id);
}

/**
 * Keeps the first paint semantic and deterministic. The WebGL module is only
 * mounted after the browser is idle or when a below-fold atlas approaches the
 * viewport, so Three.js never competes with the route's LCP request chain.
 */
export default function ProgressiveKnowledgeUniverse({
  activeNodeId = null,
  onSelectNode = () => {},
  className = "",
  loadStrategy = "idle",
}) {
  const hostRef = useRef(null);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const activate = () => {
      if (!cancelled) setEnhanced(true);
    };

    let cancelIdle = () => {};
    let observer;
    if (loadStrategy === "visible" && hostRef.current && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          activate();
          observer?.disconnect();
        }
      }, { rootMargin: "480px 0px" });
      observer.observe(hostRef.current);
    } else {
      cancelIdle = scheduleIdle(activate);
    }

    return () => {
      cancelled = true;
      cancelIdle();
      observer?.disconnect();
    };
  }, [loadStrategy]);

  return (
    <div ref={hostRef} className="relative w-full h-full">
      {enhanced ? (
        <KnowledgeUniverse3D activeNodeId={activeNodeId} onSelectNode={onSelectNode} className={className} />
      ) : (
        <KnowledgeUniverseFallback activeNodeId={activeNodeId} onSelectNode={onSelectNode} className={className} />
      )}
    </div>
  );
}
