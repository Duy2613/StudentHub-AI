import React from "react";
import { getMediaAsset } from "@/lib/media/vnextMediaRegistry";
import VerifiedPoster from "@/components/media/VerifiedPoster";

/**
 * Static-first media frame for editorial surfaces.
 *
 * The route background owns the optional motion layer. Content chapters use
 * the verified poster so a second video never competes for attention or
 * bandwidth with the page-level cinematic background.
 */
export default function VNextMediaFrame({
  assetId,
  alt = "",
  label = "",
  detail = "",
  priority = false,
  className = "",
}) {
  const asset = getMediaAsset(assetId);
  if (!asset || !asset.desktopPoster) return null;

  return (
    <figure className={`vnext-media-frame ${className}`.trim()} data-asset-id={assetId}>
      <div className="vnext-media-frame-shell">
        <VerifiedPoster
          assetId={assetId}
          alt={alt}
          priority={priority}
          className="h-full w-full"
        />
        <span className="vnext-media-frame-sheen" aria-hidden="true" />
      </div>
      <figcaption className="vnext-media-frame-caption">
        <span className="type-technical-v3">{label || asset.semanticName}</span>
        {detail ? <span>{detail}</span> : null}
      </figcaption>
    </figure>
  );
}
