"use client";

import React, { useEffect } from "react";
import { useBackground } from "@/components/providers/BackgroundContext";

export default function CinematicScrollytellingObserver() {
  const { setScrollySection, isManualOverride } = useBackground();

  useEffect(() => {
    if (typeof window === "undefined" || isManualOverride) return;

    const sections = [
      { id: "hero", wallpaperId: "portal" },
      { id: "features", wallpaperId: "campus" },
      { id: "demo", wallpaperId: "study" },
      { id: "engine", wallpaperId: "network" },
      { id: "community", wallpaperId: "dataflow" },
      { id: "cta", wallpaperId: "focus" },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const matched = sections.find((s) => s.id === entry.target.id);
            if (matched) {
              setScrollySection(matched.wallpaperId);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -40% 0px", // Trigger when section is in active viewing area
        threshold: 0.2,
      }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [setScrollySection, isManualOverride]);

  return null;
}
