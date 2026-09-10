"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { getReferenceRouteProfile } from "@/components/layout/referenceRouteConfig";
import { getMediaAsset } from "@/lib/media/vnextMediaRegistry";
import { getKhaiMinhRouteVisual } from "@/lib/media/khaiMinhVisualRegistry";
import KhaiMinhImage from "@/components/media/KhaiMinhImage";

/**
 * A quiet site-wide visual grammar for the VNext shell.
 * Product content and controls remain above this non-interactive layer.
 */
export default function ReferenceAtmosphere({ routeMediaPolicy }) {
  const pathname = usePathname() || "/";
  const profile = getReferenceRouteProfile(pathname);
  const birdAsset = getMediaAsset("IMG-BIRD-01");
  const routeVisual = getKhaiMinhRouteVisual(pathname);

  return (
    <div
      className="reference-atmosphere"
      data-reference-route={profile.id}
      data-reference-surface={profile.surface}
      data-reference-presentation={routeMediaPolicy?.presentation || "static"}
      data-reference-bird={birdAsset?.id || "none"}
      data-khai-minh-visual={routeVisual.asset?.id || "none"}
      aria-hidden="true"
    >
      {routeVisual.asset ? (
        <KhaiMinhImage
          assetId={routeVisual.asset.id}
          alt=""
          sizes="100vw"
          className="reference-atmosphere-khai-image"
        />
      ) : null}
      {/* The bird remains in the legacy registry for compatibility metadata.
          Route-specific Khai Minh visuals now own the site-wide atmosphere. */}
      <span className="reference-atmosphere-grid" />
      <span className="reference-atmosphere-orbit reference-atmosphere-orbit-one" />
      <span className="reference-atmosphere-orbit reference-atmosphere-orbit-two" />
      <span className="reference-atmosphere-beacon" />
    </div>
  );
}
