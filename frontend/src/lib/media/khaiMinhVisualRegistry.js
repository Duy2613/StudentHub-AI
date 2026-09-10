/**
 * Khai Minh visual registry.
 *
 * This registry owns only visual references and derivative paths. It never
 * owns product facts, route data, expert identities, case records, or Trust
 * verdicts. The original concept art stays in the master pack and is never
 * served directly.
 */

const ROOT = "/media/khai-minh";

const makeAsset = ({ id, stem, routeRole, sourceSha256, priority = false, decorative = true, embeddedTextRisk = "LOW", humanIllustrative = false, provenance }) => Object.freeze({
  id,
  routeRole,
  desktopSrc: `${ROOT}/${stem}-desktop.avif`,
  tabletSrc: `${ROOT}/${stem}-tablet.avif`,
  mobileSrc: `${ROOT}/${stem}-mobile.avif`,
  ogSrc: `${ROOT}/${stem}-og.avif`,
  decorativeSrc: `${ROOT}/${stem}-decorative.avif`,
  width: 1600,
  height: 900,
  aspectRatio: 1600 / 900,
  priority,
  decorative,
  embeddedTextRisk,
  humanIllustrative,
  provenance: { sourceSha256, note: provenance },
  fallback: "Live product surface without decorative art.",
});

export const KHAI_MINH_VISUAL_REGISTRY = Object.freeze({
  "KH-LANDING-HERO-01": makeAsset({
    id: "KH-LANDING-HERO-01",
    stem: "landing-hero",
    routeRole: "landing.hero",
    sourceSha256: "0291d6135e2f2b76cea8b1354a82864beacb13edddfacd16650da9022e205309",
    priority: true,
    decorative: false,
    embeddedTextRisk: "NONE",
    humanIllustrative: true,
    provenance: "Generated text-free hero reference. The application renders all meaningful copy and controls.",
  }),
  "KH-TRUST-ATMOSPHERE-01": makeAsset({
    id: "KH-TRUST-ATMOSPHERE-01",
    stem: "trust-atmosphere",
    routeRole: "trust.ambient",
    sourceSha256: "97eeb7294eab3e3f34fc09b927bd0fa3d9cf8318da5276560c835cc97a734272",
    provenance: "Supplied text-free concept art, reduced to a muted decorative evidence atmosphere.",
  }),
  "KH-COMMUNITY-ATMOSPHERE-01": makeAsset({
    id: "KH-COMMUNITY-ATMOSPHERE-01",
    stem: "community-atmosphere",
    routeRole: "community.ambient",
    sourceSha256: "6e7a76e2bca63b3ba726e062f4d3a57dbb6bf484cf3b01306f05fed5ac67db38",
    provenance: "Supplied text-free concept art, reduced to a muted decorative archive atmosphere.",
  }),
  "KH-EXPERT-ATMOSPHERE-01": makeAsset({
    id: "KH-EXPERT-ATMOSPHERE-01",
    stem: "expert-atmosphere",
    routeRole: "expert.ambient",
    sourceSha256: "9f0ed43d3feb1aa6a4dcef767f80e0f2309e21310dcc58202dce09609ce8a3ed",
    provenance: "Supplied text-free concept art, reduced to a muted decorative scope atmosphere.",
  }),
  "KH-CASES-ATMOSPHERE-01": makeAsset({
    id: "KH-CASES-ATMOSPHERE-01",
    stem: "cases-atmosphere",
    routeRole: "cases.ambient",
    sourceSha256: "243f3ef34eaaef4559e7b971791f78d3a9d65b1142bf4cd80168d126f0319a6d",
    provenance: "Supplied text-free concept art, reduced to a muted decorative archive atmosphere.",
  }),
  "KH-DASHBOARD-ATMOSPHERE-01": makeAsset({
    id: "KH-DASHBOARD-ATMOSPHERE-01",
    stem: "dashboard-atmosphere",
    routeRole: "dashboard.ambient",
    sourceSha256: "9f0ed43d3feb1aa6a4dcef767f80e0f2309e21310dcc58202dce09609ce8a3ed",
    provenance: "Supplied text-free concept art, reduced to a quiet personal-desk atmosphere.",
  }),
  "KH-SETTINGS-ATMOSPHERE-01": makeAsset({
    id: "KH-SETTINGS-ATMOSPHERE-01",
    stem: "settings-atmosphere",
    routeRole: "settings.ambient",
    sourceSha256: "243f3ef34eaaef4559e7b971791f78d3a9d65b1142bf4cd80168d126f0319a6d",
    provenance: "Supplied text-free concept art, reduced to a low-contrast paper atmosphere.",
  }),
  "KH-ACADEMIC-ATMOSPHERE-01": makeAsset({
    id: "KH-ACADEMIC-ATMOSPHERE-01",
    stem: "academic-atmosphere",
    routeRole: "academic.ambient",
    sourceSha256: "243f3ef34eaaef4559e7b971791f78d3a9d65b1142bf4cd80168d126f0319a6d",
    provenance: "Supplied text-free concept art, reduced to a quiet archive atmosphere.",
  }),
  "KH-STATIC-ATMOSPHERE-01": makeAsset({
    id: "KH-STATIC-ATMOSPHERE-01",
    stem: "static-atmosphere",
    routeRole: "static.ambient",
    sourceSha256: "97eeb7294eab3e3f34fc09b927bd0fa3d9cf8318da5276560c835cc97a734272",
    provenance: "Supplied text-free concept art, reduced to a low-contrast fallback atmosphere.",
  }),
});

const ROUTE_VISUALS = Object.freeze([
  Object.freeze({ id: "landing", matches: (pathname) => pathname === "/" || pathname === "", assetId: "KH-LANDING-HERO-01" }),
  Object.freeze({ id: "trust", matches: (pathname) => pathname.startsWith("/trust"), assetId: "KH-TRUST-ATMOSPHERE-01" }),
  Object.freeze({ id: "community", matches: (pathname) => pathname.startsWith("/community") || pathname.startsWith("/forum"), assetId: "KH-COMMUNITY-ATMOSPHERE-01" }),
  Object.freeze({ id: "expert", matches: (pathname) => pathname.startsWith("/expert"), assetId: "KH-EXPERT-ATMOSPHERE-01" }),
  Object.freeze({ id: "cases", matches: (pathname) => pathname.startsWith("/cases"), assetId: "KH-CASES-ATMOSPHERE-01" }),
  Object.freeze({ id: "dashboard", matches: (pathname) => pathname.startsWith("/dashboard"), assetId: "KH-DASHBOARD-ATMOSPHERE-01" }),
  Object.freeze({ id: "settings", matches: (pathname) => pathname.startsWith("/settings"), assetId: "KH-SETTINGS-ATMOSPHERE-01" }),
  Object.freeze({ id: "academic", matches: (pathname) => pathname.startsWith("/academic"), assetId: "KH-ACADEMIC-ATMOSPHERE-01" }),
  Object.freeze({ id: "static", matches: () => true, assetId: "KH-STATIC-ATMOSPHERE-01" }),
]);

export function getKhaiMinhVisual(assetId) {
  return KHAI_MINH_VISUAL_REGISTRY[assetId] || null;
}

export function getKhaiMinhRouteVisual(pathname = "") {
  const safePathname = typeof pathname === "string" ? pathname : "";
  const route = ROUTE_VISUALS.find((item) => item.matches(safePathname)) || ROUTE_VISUALS[ROUTE_VISUALS.length - 1];
  return { ...route, asset: getKhaiMinhVisual(route.assetId) };
}

export { ROUTE_VISUALS };
