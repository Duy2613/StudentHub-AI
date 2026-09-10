/**
 * Verified StudentHub VNext production media registry.
 *
 * Paths are copied only from the verified production manifest, route map, or
 * the generated-art ledger. Product components should resolve semantic asset
 * IDs here rather than inventing public paths.
 */

const VERIFIED_ROOT = "/media/studenthub-vnext";

export const VNEXT_MEDIA = Object.freeze({
  "VID-PRISM-01": Object.freeze({
    id: "VID-PRISM-01",
    semanticName: "home-campus-atlas",
    type: "video",
    video: "/media/home/home-campus-atlas.webm",
    mobileVideo: "/media/home/home-campus-atlas-mobile.webm",
    desktopPoster: "/media/home/home-campus-atlas-poster.avif",
    mobilePoster: "/media/home/home-campus-atlas-poster.avif",
    reducedMotionAsset: "/media/home/home-campus-atlas-poster.avif",
    mobileVideoDefault: false,
    reducedMotionPolicy: "poster",
  }),
  "VID-HUMAN-01": Object.freeze({
    id: "VID-HUMAN-01",
    semanticName: "landing-human-evidence",
    type: "video",
    video: `${VERIFIED_ROOT}/video/landing-human-evidence-desktop.mp4`,
    desktopPoster: `${VERIFIED_ROOT}/posters/landing-human-evidence-desktop.webp`,
    mobilePoster: `${VERIFIED_ROOT}/posters/landing-human-evidence-mobile.webp`,
    reducedMotionAsset: `${VERIFIED_ROOT}/posters/landing-human-evidence-mobile.webp`,
    mobileVideoDefault: false,
    reducedMotionPolicy: "poster",
  }),
  "VID-OPTIC-01": Object.freeze({
    id: "VID-OPTIC-01",
    semanticName: "trust-evidence-specimen",
    type: "image",
    desktopPoster: "/media/trust/trust-evidence-specimen.avif",
    mobilePoster: "/media/trust/trust-evidence-specimen-mobile.avif",
    reducedMotionAsset: "/media/trust/trust-evidence-specimen.avif",
    mobileVideoDefault: false,
    reducedMotionPolicy: "poster",
  }),
  "VID-OPTIC-02": Object.freeze({
    id: "VID-OPTIC-02",
    semanticName: "trust-result-prism",
    type: "video",
    video: `${VERIFIED_ROOT}/video/trust-result-prism-desktop.mp4`,
    desktopPoster: `${VERIFIED_ROOT}/posters/trust-result-prism-desktop.webp`,
    mobilePoster: `${VERIFIED_ROOT}/posters/trust-result-prism-mobile.webp`,
    reducedMotionAsset: `${VERIFIED_ROOT}/posters/trust-result-prism-mobile.webp`,
    mobileVideoDefault: false,
    reducedMotionPolicy: "poster",
  }),
  "VID-HUMAN-02": Object.freeze({
    id: "VID-HUMAN-02",
    semanticName: "community-human-research",
    type: "video",
    video: `${VERIFIED_ROOT}/video/community-human-research-desktop.mp4`,
    desktopPoster: `${VERIFIED_ROOT}/posters/community-human-research-desktop.webp`,
    mobilePoster: `${VERIFIED_ROOT}/posters/community-human-research-mobile.webp`,
    reducedMotionAsset: `${VERIFIED_ROOT}/posters/community-human-research-mobile.webp`,
    mobileVideoDefault: false,
    reducedMotionPolicy: "poster",
  }),
  "VID-PRISM-02": Object.freeze({
    id: "VID-PRISM-02",
    semanticName: "community-prism-corroboration",
    type: "video",
    video: `${VERIFIED_ROOT}/video/community-prism-corroboration-desktop.mp4`,
    desktopPoster: `${VERIFIED_ROOT}/posters/community-prism-corroboration-desktop.webp`,
    mobilePoster: `${VERIFIED_ROOT}/posters/community-prism-corroboration-mobile.webp`,
    reducedMotionAsset: `${VERIFIED_ROOT}/posters/community-prism-corroboration-mobile.webp`,
    mobileVideoDefault: false,
    reducedMotionPolicy: "poster",
  }),
  "VID-PRISM-03": Object.freeze({
    id: "VID-PRISM-03",
    semanticName: "landing-prism-transition",
    type: "video",
    video: `${VERIFIED_ROOT}/video/landing-prism-transition-desktop.mp4`,
    desktopPoster: `${VERIFIED_ROOT}/posters/landing-prism-transition-desktop.webp`,
    mobilePoster: `${VERIFIED_ROOT}/posters/landing-prism-transition-mobile.webp`,
    reducedMotionAsset: `${VERIFIED_ROOT}/posters/landing-prism-transition-mobile.webp`,
    mobileVideoDefault: false,
    reducedMotionPolicy: "static-transition",
  }),
  "VID-HUMAN-03": Object.freeze({
    id: "VID-HUMAN-03",
    semanticName: "landing-human-library-reserve",
    type: "video",
    video: `${VERIFIED_ROOT}/video/landing-human-library-reserve-desktop.mp4`,
    desktopPoster: `${VERIFIED_ROOT}/posters/landing-human-library-reserve-desktop.webp`,
    mobilePoster: `${VERIFIED_ROOT}/posters/landing-human-library-reserve-mobile.webp`,
    reducedMotionAsset: `${VERIFIED_ROOT}/posters/landing-human-library-reserve-mobile.webp`,
    mobileVideoDefault: false,
    reducedMotionPolicy: "poster",
  }),
  "HDRI-01": Object.freeze({
    id: "HDRI-01",
    semanticName: "hdri-monochrome-studio",
    type: "hdri",
    source: `${VERIFIED_ROOT}/3d/hdri-monochrome-studio-1k.hdr`,
    mobileDefault: false,
    reducedMotionEligible: false,
  }),
  "HDRI-02": Object.freeze({
    id: "HDRI-02",
    semanticName: "hdri-studio-small",
    type: "hdri",
    source: `${VERIFIED_ROOT}/3d/hdri-studio-small-1k.hdr`,
    mobileDefault: false,
    reducedMotionEligible: false,
  }),
  "IMG-BIRD-01": Object.freeze({
    id: "IMG-BIRD-01",
    semanticName: "khai-minh-bird",
    type: "image",
    image: `${VERIFIED_ROOT}/imagery/bird-khai-minh-v1.webp`,
    desktopPoster: `${VERIFIED_ROOT}/imagery/bird-khai-minh-v1.webp`,
    mobilePoster: `${VERIFIED_ROOT}/imagery/bird-khai-minh-v1.webp`,
    reducedMotionAsset: `${VERIFIED_ROOT}/imagery/bird-khai-minh-v1.webp`,
    mobileVideoDefault: false,
    reducedMotionPolicy: "static-image",
    provenance: "GENERATED_ASSET_LEDGER",
  }),
  "AUTH-MONOLITH-01": Object.freeze({
    id: "AUTH-MONOLITH-01",
    semanticName: "auth-architectural-monolith",
    type: "image",
    image: "/media/auth/auth-architectural-monolith.avif",
    desktopPoster: "/media/auth/auth-architectural-monolith.avif",
    mobilePoster: "/media/auth/auth-architectural-monolith.avif",
    reducedMotionAsset: "/media/auth/auth-architectural-monolith.avif",
    reducedMotionPolicy: "static-image",
  }),
  "ACADEMIC-TOPOGRAPHY-01": Object.freeze({
    id: "ACADEMIC-TOPOGRAPHY-01",
    semanticName: "academic-course-topography",
    type: "image",
    image: "/media/academic/academic-course-topography.avif",
    desktopPoster: "/media/academic/academic-course-topography.avif",
    mobilePoster: "/media/academic/academic-course-topography.avif",
    reducedMotionAsset: "/media/academic/academic-course-topography.avif",
    reducedMotionPolicy: "static-image",
  }),
});

const ROUTE_POLICIES = Object.freeze([
  Object.freeze({
    id: "landing",
    matches: (pathname) => pathname === "/" || pathname === "",
    presentation: "cinematic",
    assetIds: ["VID-PRISM-01"],
    load: "INITIAL",
    // W13 controlled enhancement: poster is first render; video waits for idle desktop time.
    videoEligible: true,
    transitionAssetId: "VID-PRISM-03",
    transitionMaxPlays: 2,
    transitionVideoEligible: false,
    opacity: 0.24,
  }),
  Object.freeze({
    id: "trust",
    matches: (pathname) => pathname.startsWith("/trust"),
    presentation: "instrument",
    assetIds: ["VID-OPTIC-01", "VID-OPTIC-02"],
    load: "LAZY",
    videoEligible: true,
    idleAssetId: "VID-OPTIC-01",
    resultAssetId: "VID-OPTIC-02",
    maxConcurrentVideos: 1,
    opacity: 0.08,
  }),
  Object.freeze({
    id: "community",
    matches: (pathname) => pathname.startsWith("/community") || pathname.startsWith("/forum"),
    presentation: "instrument",
    assetIds: ["VID-HUMAN-02", "VID-PRISM-02"],
    load: "LAZY",
    videoEligible: true,
    maxConcurrentVideos: 1,
    alternateAssetId: "VID-PRISM-02",
    opacity: 0.07,
  }),
  Object.freeze({
    id: "expert",
    matches: (pathname) => pathname.startsWith("/expert"),
    presentation: "instrument",
    assetIds: ["VID-OPTIC-01"],
    load: "LAZY",
    videoEligible: false,
    opacity: 0.07,
  }),
  Object.freeze({
    id: "static",
    matches: () => true,
    presentation: "static",
    assetIds: [],
    load: "NEVER",
    videoEligible: false,
    opacity: 0,
  }),
]);

export function getMediaAsset(assetId) {
  return VNEXT_MEDIA[assetId] || null;
}

export function getRouteMediaPolicy(pathname = "") {
  const policy = ROUTE_POLICIES.find((item) => item.matches(pathname)) || ROUTE_POLICIES[ROUTE_POLICIES.length - 1];
  return {
    ...policy,
    assets: policy.assetIds.map(getMediaAsset).filter(Boolean),
  };
}

export function getRouteMediaAsset(pathname = "", assetId = null) {
  const policy = getRouteMediaPolicy(pathname);
  if (assetId) return policy.assets.find((asset) => asset.id === assetId) || null;
  return policy.assets[0] || null;
}

export function isVerifiedMediaPath(pathname = "") {
  return Object.values(VNEXT_MEDIA).some((asset) => Object.values(asset).includes(pathname));
}

export const VERIFIED_MEDIA_POLICY = Object.freeze({
  mobileVideoDefault: false,
  reducedMotionDefault: "poster",
  offscreenDefault: "suspend",
});
