import { Search, Settings, ShieldCheck, User, UserRoundCheck, Users } from "lucide-react";
import { CANONICAL_NAVIGATION } from "@/config/navigation";

const ICONS = Object.freeze({
  ShieldCheck,
  Users,
  UserCheck: UserRoundCheck,
  Search,
  User,
  Settings,
});

function toShellItem(item) {
  return Object.freeze({
    id: item.id,
    label: item.label,
    href: item.route,
    icon: ICONS[item.icon],
    pillar: item.group.toUpperCase(),
  });
}

const coreItems = CANONICAL_NAVIGATION.filter((item) => item.group === "core").map(toShellItem);
const accountItems = CANONICAL_NAVIGATION.filter((item) => item.group === "account").map(toShellItem);

/** Shell navigation adapts the canonical v4 destinations without redefining them. */
export const CANONICAL_NAV_GROUPS = Object.freeze([
  Object.freeze({ id: "pillars", label: "Trụ cột cốt lõi", items: Object.freeze(coreItems) }),
  Object.freeze({ id: "account", label: "Tài khoản", items: Object.freeze(accountItems) }),
]);

export const CANONICAL_NAV_ITEMS = Object.freeze([...coreItems, ...accountItems]);

export const ACCOUNT_NAV_ITEMS = Object.freeze([
  ...accountItems,
]);

export function isNavigationActive(pathname, href) {
  if (typeof pathname !== "string" || typeof href !== "string") return false;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function chapterForPath(pathname = "") {
  if (pathname.startsWith("/trust")) return "I";
  if (pathname.startsWith("/community")) return "II";
  if (pathname.startsWith("/expert")) return "III";
  return "IV";
}
