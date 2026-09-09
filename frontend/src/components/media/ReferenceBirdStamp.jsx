import React from "react";
import Image from "next/image";
import { getMediaAsset } from "@/lib/media/vnextMediaRegistry";

/**
 * Shared decorative bird treatment for the two product surfaces.
 * It is deliberately registry-driven and never carries product state.
 */
export default function ReferenceBirdStamp({ className = "" }) {
  const asset = getMediaAsset("IMG-BIRD-01");
  if (!asset?.image) return null;

  return (
    <span className={`reference-bird-stamp ${className}`.trim()} data-asset-id={asset.id} aria-hidden="true">
      <Image
        src={asset.image}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 768px) 78vw, 28rem"
        className="reference-bird-stamp-image"
      />
    </span>
  );
}
