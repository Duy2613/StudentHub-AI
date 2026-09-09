import React from "react";
import Image from "next/image";
import { getMediaAsset } from "@/lib/media/vnextMediaRegistry";

export default function VerifiedPoster({ assetId, alt = "", className = "", priority = false }) {
  const asset = getMediaAsset(assetId);
  if (!asset || !asset.desktopPoster) return null;

  return (
    <picture className={`verified-poster ${className}`.trim()} data-asset-id={assetId}>
      <source media="(prefers-reduced-motion: reduce)" srcSet={asset.reducedMotionAsset} />
      <source media="(max-width: 768px)" srcSet={asset.mobilePoster} />
      <Image
        src={asset.desktopPoster}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="verified-poster-image"
      />
    </picture>
  );
}
