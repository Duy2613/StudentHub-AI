import React from "react";
import Image from "next/image";
import { getKhaiMinhVisual } from "@/lib/media/khaiMinhVisualRegistry";

export default function KhaiMinhImage({ assetId, alt = "", className = "", sizes = "100vw", priority = false }) {
  const asset = getKhaiMinhVisual(assetId);
  if (!asset) return null;

  return (
    <picture className={`khai-minh-image ${className}`.trim()} data-asset-id={asset.id}>
      <source media="(max-width: 767px)" srcSet={asset.mobileSrc} />
      <source media="(max-width: 1199px)" srcSet={asset.tabletSrc} />
      <Image
        src={asset.desktopSrc}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        className="khai-minh-image-image"
      />
    </picture>
  );
}
