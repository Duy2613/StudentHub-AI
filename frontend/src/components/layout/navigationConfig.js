import { FileClock, LayoutDashboard, Settings, ShieldCheck, UserRoundCheck, Users } from "lucide-react";

/**
 * Canonical internal navigation. Route compatibility entries are deliberately
 * not included here; the frozen route map owns their redirects/deep-link
 * behavior, while this module owns the single visible navigation contract.
 */
export const CANONICAL_NAV_GROUPS = Object.freeze([
  Object.freeze({
    id: "pillars",
    label: "Trụ cột",
    items: Object.freeze([
      Object.freeze({ id: "trust", label: "Trust Engine", href: "/trust", icon: ShieldCheck, pillar: "TRUST" }),
      Object.freeze({ id: "community", label: "Community", href: "/community", icon: Users, pillar: "COMMUNITY" }),
      Object.freeze({ id: "expert", label: "Experts", href: "/expert", icon: UserRoundCheck, pillar: "EXPERT" }),
      Object.freeze({ id: "cases", label: "Evidence Case Lab", href: "/cases", icon: FileClock, pillar: "TRUST_SUPPORT" }),
    ]),
  }),
  Object.freeze({
    id: "personal",
    label: "Cá nhân",
    items: Object.freeze([
      Object.freeze({ id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, pillar: "PLATFORM" }),
      Object.freeze({ id: "profile", label: "Hồ sơ", href: "/profile", icon: UserRoundCheck, pillar: "PLATFORM" }),
      Object.freeze({ id: "settings", label: "Cài đặt", href: "/settings", icon: Settings, pillar: "PLATFORM" }),
    ]),
  }),
]);

export const CANONICAL_NAV_ITEMS = Object.freeze(CANONICAL_NAV_GROUPS.flatMap((group) => group.items));

export const ACCOUNT_NAV_ITEMS = Object.freeze([
  Object.freeze({ id: "profile", label: "Hồ sơ", href: "/profile" }),
  Object.freeze({ id: "settings", label: "Cài đặt", href: "/settings" }),
  Object.freeze({ id: "privacy", label: "Privacy", href: "/settings/privacy" }),
]);

export function isNavigationActive(pathname, href) {
  if (typeof pathname !== "string" || typeof href !== "string") return false;
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function chapterForPath(pathname = "") {
  if (pathname.startsWith("/trust")) return "I";
  if (pathname.startsWith("/community") || pathname.startsWith("/forum")) return "II";
  if (pathname.startsWith("/expert")) return "III";
  if (pathname.startsWith("/academic")) return "IV";
  if (pathname.startsWith("/cases")) return "V";
  return "VI";
}

