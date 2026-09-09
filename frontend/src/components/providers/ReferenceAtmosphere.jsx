"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getReferenceRouteProfile } from "@/components/layout/referenceRouteConfig";
import { getMediaAsset } from "@/lib/media/vnextMediaRegistry";

/**
 * A quiet site-wide visual grammar for the VNext shell.
 * Product content and controls remain above this non-interactive layer.
 */
export default function ReferenceAtmosphere({ routeMediaPolicy }) {
  const pathname = usePathname() || "/";
  const profile = getReferenceRouteProfile(pathname);
  const birdAsset = getMediaAsset("IMG-BIRD-01");

  return (
    <div
      className="reference-atmosphere"
      data-reference-route={profile.id}
      data-reference-surface={profile.surface}
      data-reference-presentation={routeMediaPolicy?.presentation || "static"}
      data-reference-bird={birdAsset?.id || "none"}
      aria-hidden="true"
    >
      {birdAsset?.image ? (
        <span className="reference-atmosphere-bird" data-asset-id={birdAsset.id}>
          <Image
            src={birdAsset.image}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 72vw, 42vw"
            className="reference-atmosphere-bird-image"
          />
        </span>
      ) : null}
      <span className="reference-atmosphere-grid" />
      <span className="reference-atmosphere-orbit reference-atmosphere-orbit-one" />
      <span className="reference-atmosphere-orbit reference-atmosphere-orbit-two" />
      <span className="reference-atmosphere-beacon" />
    </div>
  );
}
