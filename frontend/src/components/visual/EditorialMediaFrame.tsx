"use client";

import React from "react";

export interface EditorialMediaFrameProps {
  children: React.ReactNode;
  caption?: string;
  className?: string;
  aspectRatio?: string;
}

export function EditorialMediaFrame({
  children,
  caption,
  className = "",
  aspectRatio = "16 / 10",
}: EditorialMediaFrameProps) {
  return (
    <figure
      className={`km-media-frame ${className}`}
      style={{ aspectRatio }}
    >
      {children}
      {caption && (
        <figcaption className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 text-xs text-slate-300 font-mono border-t border-white/5">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default EditorialMediaFrame;
