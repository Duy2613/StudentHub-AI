const REFERENCE_ROUTE_PROFILES = Object.freeze([
  Object.freeze({
    id: "landing",
    chapter: "00",
    label: "OPEN FIELD",
    signal: "PRISM / 01",
    surface: "cinematic",
    matches: (pathname) => pathname === "/" || pathname === "",
  }),
  Object.freeze({
    id: "trust",
    chapter: "I",
    label: "FORENSIC INSTRUMENT",
    signal: "OPTIC / EVIDENCE",
    surface: "instrument",
    matches: (pathname) => pathname.startsWith("/trust"),
  }),
  Object.freeze({
    id: "community",
    chapter: "II",
    label: "COLLECTIVE FIELD",
    signal: "HUMAN / CONTEXT",
    surface: "instrument",
    matches: (pathname) => pathname.startsWith("/community") || pathname.startsWith("/forum"),
  }),
  Object.freeze({
    id: "expert",
    chapter: "III",
    label: "SCOPE DOSSIER",
    signal: "OPTIC / SCOPE",
    surface: "instrument",
    matches: (pathname) => pathname.startsWith("/expert"),
  }),
  Object.freeze({
    id: "academic",
    chapter: "IV",
    label: "ACADEMIC ATLAS",
    signal: "STATIC / READING",
    surface: "archive",
    matches: (pathname) => pathname.startsWith("/academic"),
  }),
  Object.freeze({
    id: "cases",
    chapter: "V",
    label: "EVIDENCE ARCHIVE",
    signal: "PASSPORT / REVISION",
    surface: "archive",
    matches: (pathname) => pathname.startsWith("/cases"),
  }),
  Object.freeze({
    id: "personal",
    chapter: "VI",
    label: "PERSONAL DESK",
    signal: "SIGNAL / NEXT STEP",
    surface: "paper",
    matches: (pathname) => pathname.startsWith("/dashboard") || pathname.startsWith("/profile") || pathname.startsWith("/settings"),
  }),
  Object.freeze({
    id: "static",
    chapter: "VI",
    label: "READING SURFACE",
    signal: "STATIC / VERIFIED",
    surface: "paper",
    matches: () => true,
  }),
]);

export function getReferenceRouteProfile(pathname = "") {
  const safePathname = typeof pathname === "string" ? pathname : "";
  return REFERENCE_ROUTE_PROFILES.find((profile) => profile.matches(safePathname)) || REFERENCE_ROUTE_PROFILES[REFERENCE_ROUTE_PROFILES.length - 1];
}

export { REFERENCE_ROUTE_PROFILES };
