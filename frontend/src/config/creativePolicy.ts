/**
 * StudentHub AI — Machine-Readable Creative Policy
 *
 * Governing Authority: MASTER FRONTEND CONSTITUTION v3.0 (C-06, Appendix C)
 * Controls layer assignment, scroll grade, pointer grade, transition class,
 * WebGL eligibility, and fallback chains across the platform.
 */

export type CreativeLayer = "L1" | "L2" | "L3";
export type ScrollGrade = "SG0" | "SG1" | "SG2" | "SG3";
export type PointerGrade = "PG0" | "PG1" | "PG2";
export type TransitionClass = "TC0" | "TC1" | "TC2";
export type RenderTier = "R-WEBGPU" | "R-WEBGL2" | "R-LITE" | "R-SEQUENCE" | "R-POSTER";
export type CapabilityProfile = "CAP-FULL" | "CAP-BALANCED" | "CAP-MINIMAL" | "CAP-STATIC";

export interface RouteCreativeRule {
  readonly maxLayer: CreativeLayer;
  readonly scroll: ScrollGrade;
  readonly pointer: PointerGrade;
  readonly transition: TransitionClass;
  readonly webgl: boolean;
  readonly fallback?: readonly RenderTier[];
  readonly description?: string;
}

export const CREATIVE_POLICY: Record<string, RouteCreativeRule> = Object.freeze({
  "/": {
    maxLayer: "L3",
    scroll: "SG3",
    pointer: "PG2",
    transition: "TC2",
    webgl: true,
    fallback: ["R-WEBGL2", "R-LITE", "R-POSTER"],
    description: "Landing hero: 3-layer architecture (DOM first, 3D identity object, atmospheric background).",
  },
  "/onboarding": {
    maxLayer: "L2",
    scroll: "SG1",
    pointer: "PG1",
    transition: "TC1",
    webgl: false,
    description: "No mandatory extra step, skip always visible.",
  },
  "/auth": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
    description: "Static Prism imagery allowed, zero ambient WebGL shaders.",
  },
  "/dashboard": {
    maxLayer: "L1",
    scroll: "SG1",
    pointer: "PG1",
    transition: "TC0",
    webgl: false,
    description: "Academic Intelligence focus; achievement overlay may be L2.",
  },
  "/learn": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
    description: "Focus Mode has zero ambient motion, calm readable editorial typography.",
  },
  "/trust": {
    maxLayer: "L2",
    scroll: "SG1",
    pointer: "PG0",
    transition: "TC1",
    webgl: false,
    description: "Processing stage L2 with Evidence Crystallization; result screen returns to calm L1.",
  },
  "/trust/explorer": {
    maxLayer: "L2",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC1",
    webgl: false,
    fallback: ["R-LITE", "R-POSTER"],
    description: "Advanced Evidence Explorer; prefer SVG/Canvas2D before WebGL.",
  },
  "/knowledge": {
    maxLayer: "L3",
    scroll: "SG3",
    pointer: "PG1",
    transition: "TC2",
    webgl: true,
    fallback: ["R-LITE", "R-POSTER"],
    description: "Knowledge Universe; 2D and list fallback strictly mandatory.",
  },
  "/community": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
    description: "Evidence-aware feed, zero WebGL decoration.",
  },
  "/expert": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
    description: "Credentials, scope, assessments; no gamified reputation.",
  },
  "/tools": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
    description: "Utility tools.",
  },
  "/safety-map": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
    description: "Safety-critical route: functional map JS only, no decorative WebGL.",
  },
  "/sos": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
    description: "Emergency route: fast, direct operation, zero decorative runtime.",
  },
  "/settings": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
    description: "Account and configuration settings.",
  },
  "/profile": {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
    description: "Authoritative academic profile 360.",
  },
});

/**
 * Resolve creative policy for any pathname
 */
export function getRouteCreativePolicy(pathname: string): RouteCreativeRule {
  if (!pathname || pathname === "/") {
    return CREATIVE_POLICY["/"];
  }

  // Exact match
  if (CREATIVE_POLICY[pathname]) {
    return CREATIVE_POLICY[pathname];
  }

  // Prefix match
  for (const [prefix, rule] of Object.entries(CREATIVE_POLICY)) {
    if (prefix !== "/" && pathname.startsWith(prefix)) {
      return rule;
    }
  }

  // Default to L1 strict safe baseline
  return {
    maxLayer: "L1",
    scroll: "SG0",
    pointer: "PG0",
    transition: "TC0",
    webgl: false,
  };
}

/**
 * Validate whether a route is permitted to initialize WebGL or 3D shaders
 */
export function isWebGLPermittedForRoute(pathname: string): boolean {
  return getRouteCreativePolicy(pathname).webgl;
}
