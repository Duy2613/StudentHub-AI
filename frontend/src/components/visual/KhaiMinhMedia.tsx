"use client";

import React from "react";
import { getKhaiMinhAsset } from "@/lib/visual/khaiMinhRegistry";

export interface KhaiMinhMediaProps {
  assetId: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  aspectRatio?: string;
  altOverride?: string;
  decorative?: boolean;
  width?: number;
  height?: number;
}

export function KhaiMinhMedia({
  assetId,
  className = "",
  imgClassName = "w-full h-full object-cover",
  priority = false,
  aspectRatio,
  altOverride,
  decorative,
  width,
  height,
}: KhaiMinhMediaProps) {
  const asset = getKhaiMinhAsset(assetId);

  if (!asset) {
    return null;
  }

  const isDecorative = decorative !== undefined ? decorative : asset.decorative;
  const altText = isDecorative ? "" : (altOverride || asset.altText);
  const style: React.CSSProperties = {
    objectPosition: asset.objectPosition,
    ...(aspectRatio ? { aspectRatio } : {}),
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <picture>
        {asset.mobileSrc && (
          <source media="(max-width: 768px)" srcSet={asset.mobileSrc} type="image/webp" />
        )}
        {asset.tabletSrc && (
          <source media="(max-width: 1024px)" srcSet={asset.tabletSrc} type="image/webp" />
        )}
        <img
          src={asset.desktopSrc}
          alt={altText}
          aria-hidden={isDecorative ? "true" : undefined}
          width={width || asset.width}
          height={height || asset.height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          style={style}
          className={imgClassName}
        />
      </picture>
    </div>
  );
}

export default KhaiMinhMedia;
