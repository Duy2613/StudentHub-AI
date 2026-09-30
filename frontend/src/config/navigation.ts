/**
 * StudentHub AI v4 canonical navigation source.
 * Renderers may change presentation, but destinations and labels live here.
 */

export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  group: "core" | "utility" | "account";
  priority: number;
  availability?: "public" | "authenticated" | "flagged";
  permissions?: string[];
  desktopVisibility?: boolean;
  mobileVisibility?: boolean;
  featureFlag?: string;
  badge?: string;
}

export const CANONICAL_NAVIGATION: readonly NavigationItem[] = Object.freeze([
  {
    id: "trust",
    label: "Kiểm chứng",
    route: "/trust",
    icon: "ShieldCheck",
    group: "core",
    priority: 1,
    availability: "public",
    desktopVisibility: true,
    mobileVisibility: true,
  },
  {
    id: "community",
    label: "Cộng đồng",
    route: "/community",
    icon: "Users",
    group: "core",
    priority: 2,
    availability: "public",
    desktopVisibility: true,
    mobileVisibility: true,
  },
  {
    id: "expert",
    label: "Chuyên gia",
    route: "/expert",
    icon: "UserCheck",
    group: "core",
    priority: 3,
    availability: "public",
    desktopVisibility: true,
    mobileVisibility: true,
  },
  {
    id: "omni",
    label: "AI / Omni",
    route: "/ai",
    icon: "Search",
    group: "utility",
    priority: 4,
    availability: "public",
    desktopVisibility: true,
    mobileVisibility: true,
  },
  {
    id: "profile",
    label: "Hồ sơ",
    route: "/profile",
    icon: "User",
    group: "account",
    priority: 5,
    availability: "authenticated",
    desktopVisibility: true,
    mobileVisibility: true,
  },
  {
    id: "settings",
    label: "Cài đặt",
    route: "/settings",
    icon: "Settings",
    group: "account",
    priority: 6,
    availability: "authenticated",
    desktopVisibility: true,
    mobileVisibility: true,
  },
  {
    id: "privacy",
    label: "Quyền riêng tư",
    route: "/settings/privacy",
    icon: "ShieldCheck",
    group: "account",
    priority: 7,
    availability: "authenticated",
    desktopVisibility: true,
    mobileVisibility: true,
  },
]);

export function getCoreNavItems(): NavigationItem[] {
  return CANONICAL_NAVIGATION.filter((item) => item.group === "core");
}

export function getUtilityNavItems(): NavigationItem[] {
  return CANONICAL_NAVIGATION.filter((item) => item.group === "utility");
}

export function getAccountNavItems(): NavigationItem[] {
  return CANONICAL_NAVIGATION.filter((item) => item.group === "account");
}

export function getDesktopNavItems(): NavigationItem[] {
  return CANONICAL_NAVIGATION.filter((item) => item.desktopVisibility !== false);
}

export function getMobilePrimaryNavItems(): NavigationItem[] {
  return getCoreNavItems().filter((item) => item.mobileVisibility !== false);
}

export function isRouteActive(currentPath: string, targetRoute: string): boolean {
  if (!currentPath || !targetRoute || targetRoute.startsWith("#")) return false;
  if (currentPath === targetRoute) return true;
  return targetRoute !== "/" && currentPath.startsWith(`${targetRoute}/`);
}
