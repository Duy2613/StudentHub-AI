/**
 * STUDENTHUB AI — KHAI MINH VISUAL ASSET REGISTRY
 * CANONICAL PRODUCTION REGISTRY (PHASE C.1 DEDUPLICATED)
 * 13 Production-Eligible Masters · 52 Production Derivatives · 0 Storyboard Composites
 */

export interface KhaiMinhAsset {
  id: string;
  family: string;
  desktopSrc: string;
  tabletSrc: string;
  mobileSrc: string;
  ogSrc: string;
  width: number;
  height: number;
  focalPoint: string;
  objectPosition: string;
  decorative: boolean;
  humanIllustrative: boolean;
  realityRisk: string;
  safePresentationClass: string;
  priority: boolean;
  routeRoles: string[];
  altPolicy: "DECORATIVE_EMPTY_ALT" | "SHORT_INFORMATIVE_ALT";
  altText?: string;
}

export const KhaiMinhVisualRegistry: Record<string, KhaiMinhAsset> = {
  "KM-PRISM-001": {
    id: "KM-PRISM-001",
    family: "PRISM_LIGHT",
    desktopSrc: "/media/khai-minh/landing/km-prism-001-desktop.webp",
    tabletSrc: "/media/khai-minh/landing/km-prism-001-tablet.webp",
    mobileSrc: "/media/khai-minh/landing/km-prism-001-mobile.webp",
    ogSrc: "/media/khai-minh/landing/km-prism-001-og.webp",
    width: 1440,
    height: 810,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_LOW",
    safePresentationClass: "SAFE_FULL_FRAME",
    priority: true,
    routeRoles: ["LANDING_HERO_DESKTOP"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-EDITORIAL-001": {
    id: "KM-EDITORIAL-001",
    family: "EDITORIAL_SCENE",
    desktopSrc: "/media/khai-minh/landing/km-editorial-001-desktop.webp",
    tabletSrc: "/media/khai-minh/landing/km-editorial-001-tablet.webp",
    mobileSrc: "/media/khai-minh/landing/km-editorial-001-mobile.webp",
    ogSrc: "/media/khai-minh/landing/km-editorial-001-og.webp",
    width: 1122,
    height: 1402,
    focalPoint: "center top",
    objectPosition: "center top",
    decorative: true,
    humanIllustrative: true,
    realityRisk: "REALITY_RISK_LOW",
    safePresentationClass: "SAFE_FULL_FRAME",
    priority: true,
    routeRoles: ["LANDING_HERO_MOBILE"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-PRISM-002": {
    id: "KM-PRISM-002",
    family: "PRISM_LIGHT",
    desktopSrc: "/media/khai-minh/trust/km-prism-002-desktop.webp",
    tabletSrc: "/media/khai-minh/trust/km-prism-002-tablet.webp",
    mobileSrc: "/media/khai-minh/trust/km-prism-002-mobile.webp",
    ogSrc: "/media/khai-minh/trust/km-prism-002-og.webp",
    width: 1440,
    height: 810,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_LOW",
    safePresentationClass: "SAFE_FULL_FRAME",
    priority: false,
    routeRoles: ["TRUST_TRANSFORMATION"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-ATLAS-001": {
    id: "KM-ATLAS-001",
    family: "KNOWLEDGE_ATLAS",
    desktopSrc: "/media/khai-minh/community/km-atlas-001-desktop.webp",
    tabletSrc: "/media/khai-minh/community/km-atlas-001-tablet.webp",
    mobileSrc: "/media/khai-minh/community/km-atlas-001-mobile.webp",
    ogSrc: "/media/khai-minh/community/km-atlas-001-og.webp",
    width: 1440,
    height: 617,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_LOW",
    safePresentationClass: "SAFE_FULL_FRAME",
    priority: false,
    routeRoles: ["COMMUNITY_ATLAS"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-EXPERT-001": {
    id: "KM-EXPERT-001",
    family: "HUMAN_REVIEW",
    desktopSrc: "/media/khai-minh/expert/km-expert-001-desktop.webp",
    tabletSrc: "/media/khai-minh/expert/km-expert-001-tablet.webp",
    mobileSrc: "/media/khai-minh/expert/km-expert-001-mobile.webp",
    ogSrc: "/media/khai-minh/expert/km-expert-001-og.webp",
    width: 1440,
    height: 1080,
    focalPoint: "center top",
    objectPosition: "center top",
    decorative: true,
    humanIllustrative: true,
    realityRisk: "REALITY_RISK_HIGH",
    safePresentationClass: "SAFE_WITH_CROP",
    priority: false,
    routeRoles: ["EXPERT_VERIFICATION"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-CASES-001": {
    id: "KM-CASES-001",
    family: "ARCHIVAL_DOSSIER",
    desktopSrc: "/media/khai-minh/cases/km-cases-001-desktop.webp",
    tabletSrc: "/media/khai-minh/cases/km-cases-001-tablet.webp",
    mobileSrc: "/media/khai-minh/cases/km-cases-001-mobile.webp",
    ogSrc: "/media/khai-minh/cases/km-cases-001-og.webp",
    width: 1440,
    height: 901,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_HIGH",
    safePresentationClass: "REFERENCE_ONLY",
    priority: false,
    routeRoles: ["CASES_ARCHIVE"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-PRISM-005": {
    id: "KM-PRISM-005",
    family: "PRISM_LIGHT",
    desktopSrc: "/media/khai-minh/dashboard/km-prism-005-desktop.webp",
    tabletSrc: "/media/khai-minh/dashboard/km-prism-005-tablet.webp",
    mobileSrc: "/media/khai-minh/dashboard/km-prism-005-mobile.webp",
    ogSrc: "/media/khai-minh/dashboard/km-prism-005-og.webp",
    width: 1440,
    height: 810,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_LOW",
    safePresentationClass: "SAFE_FULL_FRAME",
    priority: false,
    routeRoles: ["DASHBOARD_ATMOSPHERE"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-SETTINGS-001": {
    id: "KM-SETTINGS-001",
    family: "QUIET_SYSTEM",
    desktopSrc: "/media/khai-minh/settings/km-settings-001-desktop.webp",
    tabletSrc: "/media/khai-minh/settings/km-settings-001-tablet.webp",
    mobileSrc: "/media/khai-minh/settings/km-settings-001-mobile.webp",
    ogSrc: "/media/khai-minh/settings/km-settings-001-og.webp",
    width: 1440,
    height: 901,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_LOW",
    safePresentationClass: "SAFE_WITH_CROP",
    priority: false,
    routeRoles: ["SETTINGS_ANCHOR"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-PRISM-003": {
    id: "KM-PRISM-003",
    family: "PRISM_LIGHT",
    desktopSrc: "/media/khai-minh/shared/km-prism-003-desktop.webp",
    tabletSrc: "/media/khai-minh/shared/km-prism-003-tablet.webp",
    mobileSrc: "/media/khai-minh/shared/km-prism-003-mobile.webp",
    ogSrc: "/media/khai-minh/shared/km-prism-003-og.webp",
    width: 1440,
    height: 810,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_LOW",
    safePresentationClass: "SAFE_FULL_FRAME",
    priority: false,
    routeRoles: ["SHARED_ATMOSPHERE"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-PRISM-004": {
    id: "KM-PRISM-004",
    family: "PRISM_LIGHT",
    desktopSrc: "/media/khai-minh/shared/km-prism-004-desktop.webp",
    tabletSrc: "/media/khai-minh/shared/km-prism-004-tablet.webp",
    mobileSrc: "/media/khai-minh/shared/km-prism-004-mobile.webp",
    ogSrc: "/media/khai-minh/shared/km-prism-004-og.webp",
    width: 1440,
    height: 810,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_LOW",
    safePresentationClass: "SAFE_FULL_FRAME",
    priority: false,
    routeRoles: ["SHARED_ATMOSPHERE"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-BRAND-001": {
    id: "KM-BRAND-001",
    family: "BRAND_SEAL",
    desktopSrc: "/media/khai-minh/shared/km-brand-001-desktop.webp",
    tabletSrc: "/media/khai-minh/shared/km-brand-001-tablet.webp",
    mobileSrc: "/media/khai-minh/shared/km-brand-001-mobile.webp",
    ogSrc: "/media/khai-minh/shared/km-brand-001-og.webp",
    width: 1440,
    height: 960,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_HIGH",
    safePresentationClass: "SAFE_WITH_CROP",
    priority: false,
    routeRoles: ["BRAND_IDENTITY"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-AI-001": {
    id: "KM-AI-001",
    family: "AI_ASSISTANT",
    desktopSrc: "/media/khai-minh/shared/km-ai-001-desktop.webp",
    tabletSrc: "/media/khai-minh/shared/km-ai-001-tablet.webp",
    mobileSrc: "/media/khai-minh/shared/km-ai-001-mobile.webp",
    ogSrc: "/media/khai-minh/shared/km-ai-001-og.webp",
    width: 1440,
    height: 810,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_HIGH",
    safePresentationClass: "SAFE_WITH_CROP",
    priority: false,
    routeRoles: ["AI_ASSISTANT_VISUAL"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  },
  "KM-CRITICAL-001": {
    id: "KM-CRITICAL-001",
    family: "VERIFICATION_ANALYSIS",
    desktopSrc: "/media/khai-minh/shared/km-critical-001-desktop.webp",
    tabletSrc: "/media/khai-minh/shared/km-critical-001-tablet.webp",
    mobileSrc: "/media/khai-minh/shared/km-critical-001-mobile.webp",
    ogSrc: "/media/khai-minh/shared/km-critical-001-og.webp",
    width: 1440,
    height: 1080,
    focalPoint: "center center",
    objectPosition: "center center",
    decorative: true,
    humanIllustrative: false,
    realityRisk: "REALITY_RISK_LOW",
    safePresentationClass: "SAFE_WITH_CROP",
    priority: false,
    routeRoles: ["VERIFICATION_VISUAL"],
    altPolicy: "DECORATIVE_EMPTY_ALT"
  }
};

export function getKhaiMinhAsset(assetId: string): KhaiMinhAsset | undefined {
  return KhaiMinhVisualRegistry[assetId];
}

export default KhaiMinhVisualRegistry;
