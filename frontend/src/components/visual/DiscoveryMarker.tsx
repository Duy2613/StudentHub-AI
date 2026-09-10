"use client";

import React, { useState, useRef, useEffect } from "react";

export interface DiscoveryMarkerProps {
  id: string;
  label: string;
  tag: string;
  summary: string;
  xPercent: number;
  yPercent: number;
  onSelect?: () => void;
}

export function DiscoveryMarker({
  id,
  label,
  tag,
  summary,
  xPercent,
  yPercent,
  onSelect,
}: DiscoveryMarkerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  return (
    <div
      className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={`${label} — ${tag}`}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          if (onSelect) onSelect();
        }}
        className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold text-xs border-2 border-white flex items-center justify-center shadow-lg shadow-amber-500/40 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition-transform"
      >
        {id}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg p-3 text-left shadow-2xl z-30"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {tag}
            </span>
            <button
              type="button"
              aria-label="Đóng hộp thông tin"
              onClick={() => {
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
              className="text-slate-400 hover:text-white text-xs px-1 focus-visible:ring-1 focus-visible:ring-sky-400"
            >
              ✕
            </button>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">{label}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  );
}

export default DiscoveryMarker;
