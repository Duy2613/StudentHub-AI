import React from "react";
import KhaiMinhImage from "@/components/media/KhaiMinhImage";
import VisualSurface from "@/components/visual/VisualSurface";

export default function EvidencePrismHero({ assetId = "KH-LANDING-HERO-01", alt, sizes, priority = false, className = "" }) {
  return (
    <VisualSurface tone="cinematic" className={`vnext-hero-art-frame group ${className}`.trim()}>
      <KhaiMinhImage
        assetId={assetId}
        priority={priority}
        alt={alt}
        sizes={sizes}
        className="w-full h-full"
      />
      <span className="vnext-hero-art-sheen" aria-hidden="true" />
    </VisualSurface>
  );
}
