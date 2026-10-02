"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { BookOpen, ChevronDown, LogOut, Menu, Palette, Search, Settings, ShieldCheck, UserRound, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE } from "@/lib/auth/presentationState";
import MarginRail, { DEFAULT_ANNOTATIONS } from "@/components/margin/MarginRail";
import ContextBar from "@/components/ui/ContextBar";
import { CANONICAL_NAV_GROUPS, chapterForPath } from "./navigationConfig";
import { getReferenceRouteProfile } from "./referenceRouteConfig";
import { markAssurance } from "@/lib/performance/assurance";
import { getAccountNavItems, getUtilityNavItems } from "@/config/navigation";
import OmniRouteTrigger from "@/components/omni/OmniRouteTrigger";
import ExpertRoomNotificationBell from "@/components/expert/ExpertRoomNotificationBell";

const THEME_STORAGE_KEY = "studenthub-theme-mode";
const THEME_MODE_EVENT = "studenthub:theme-mode-change";
let themeModeOverride = null;

function getThemeModeSnapshot() {
  if (themeModeOverride) return themeModeOverride;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return ["light", "system"].includes(stored) ? stored : "midnight";
  } catch {
    return "midnight";
  }
}

function subscribeThemeMode(onChange) {
  const onStorage = (event) => {
    if (!event.key || event.key === THEME_STORAGE_KEY) {
      themeModeOverride = null;
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_MODE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_MODE_EVENT, onChange);
  };
}

function getServerThemeModeSnapshot() {
  return "midnight";
}

function saveThemeMode(mode) {
  themeModeOverride = mode;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // The in-memory preference still applies when storage is unavailable.
  }
  window.dispatchEvent(new Event(THEME_MODE_EVENT));
}

const AcademicCommandPalette = dynamic(() => import("@/components/command/AcademicCommandPalette"), {
  ssr: false,
});

const ExpertBlindReviewWidget = dynamic(() => import("@/components/expert/ExpertBlindReviewWidget"), {
  ssr: false,
});

export default function UnifiedAppShell({ children }) {
  const pathname = usePathname();
  const { session, profile, isAuthenticated, ready, status, signOut, expertLifecycleState } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const themeMode = useSyncExternalStore(subscribeThemeMode, getThemeModeSnapshot, getServerThemeModeSnapshot);
  const searchButtonRef = useRef(null);
  const searchRestoreFocusRef = useRef(null);
  const glossaryDialogRef = useRef(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const openSearch = useCallback((event) => {
    searchRestoreFocusRef.current = event?.currentTarget instanceof HTMLElement ? event.currentTarget : document.activeElement;
    markAssurance("command-palette-request");
    setSearchMounted(true);
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRestoreFocusRef.current = document.activeElement;
        setSearchOpen((value) => {
          if (!value) {
            markAssurance("command-palette-request");
            setSearchMounted(true);
          }
          return !value;
        });
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("studenthub:omni-open", openSearch);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("studenthub:omni-open", openSearch);
    };
  }, [openSearch]);

  useEffect(() => {
    if (!glossaryOpen) return undefined;
    const previousFocus = document.activeElement;
    const focusTimer = window.setTimeout(() => glossaryDialogRef.current?.querySelector("button")?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setGlossaryOpen(false);
        return;
      }
      if (event.key !== "Tab" || !glossaryDialogRef.current) return;
      const focusable = [...glossaryDialogRef.current.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown, true);
      previousFocus?.focus?.();
    };
  }, [glossaryOpen]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = themeMode === "system" ? (media.matches ? "midnight" : "light") : themeMode;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.paper = resolved === "light" ? "day" : "night";
    };
    apply();
    if (themeMode !== "system") return undefined;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [themeMode]);

  const toggleTheme = () => {
    const nextTheme = themeMode === "midnight" ? "light" : themeMode === "light" ? "system" : "midnight";
    saveThemeMode(nextTheme);
  };


  const displayName = profile?.fullName || session?.user?.email?.split("@")[0] || "Khách";
  const signedInForHeader = ready && status === "READY" && isAuthenticated;
  const isExpert = expertLifecycleState === EXPERT_LIFECYCLE_STATE.ACTIVE;
  const profileLink = isExpert
    ? { label: "Hồ sơ chuyên gia", href: "/expert/profile" }
    : { label: "Hồ sơ cá nhân", href: "/profile" };
  const expertEntry = isExpert
    ? { label: "Khu vực chuyên gia", href: "/expert" }
    : { label: "Trở thành chuyên gia.", href: "/expert/profile" };
  const handleNavigate = () => setMobileOpen(false);
  const routeProfile = getReferenceRouteProfile(pathname || "/");
  const isCommunityRoute = pathname === "/community" || String(pathname || "").startsWith("/community/");
  const isTrustRoute = pathname === "/trust";
  const isExpertV4Route = pathname === "/expert" || String(pathname || "").startsWith("/expert/");
  const omniItem = getUtilityNavItems().find((item) => item.id === "omni");
  const settingsItem = getAccountNavItems().find((item) => item.id === "settings");
  const contextItems = pathname && pathname !== "/"
    ? [
      { id: "route", label: "Phạm vi", value: pathname },
      { id: "signal", label: routeProfile.label, value: routeProfile.signal },
    ]
    : [];

  return (
    <div
      className="app-shell min-h-dvh bg-app-canvas text-app-primary"
      data-reference-route={routeProfile.id}
      data-reference-surface={routeProfile.surface}
      data-auth-state={status}
    >
      <header className={`app-header${isCommunityRoute ? " community-app-header" : ""}`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((value) => !value)}
            className="icon-button md:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link href="/" className="brand-mark" aria-label="StudentHub AI trang chủ">
            <span className="brand-mark-icon"><ShieldCheck size={18} /></span>
            <span>
              <span className="brand-name">StudentHub <em>AI</em></span>
              <span className="brand-subtitle">Kiểm chứng trước quyết định</span>
            </span>
          </Link>
        </div>
        <button
          type="button"
          onClick={openSearch}
          className={`icon-button md:hidden${isCommunityRoute ? " community-search-icon" : ""}`}
          aria-haspopup="dialog"
          aria-label={`Mở ${omniItem?.label || "AI / Omni"} (Ctrl+K)`}
        >
          <Search size={17} aria-hidden="true" />
        </button>
        <button
          ref={searchButtonRef}
          type="button"
          onClick={openSearch}
          className={`command-search hidden md:flex${isCommunityRoute ? " community-command-search" : ""}`}
          aria-haspopup="dialog"
          aria-label={`Mở ${omniItem?.label || "AI / Omni"} trên StudentHub (Ctrl+K)`}
        >
          <span className="flex items-center gap-2">
            <Search size={15} aria-hidden="true" />
            <span>Tìm kiếm tình huống, Trust, chuyên gia...</span>
          </span>
          <kbd>Ctrl K</kbd>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-button touch-target"
            onClick={toggleTheme}
            aria-label={themeMode === "midnight" ? "Chuyển sang giao diện sáng" : themeMode === "light" ? "Chuyển sang giao diện hệ thống" : "Chuyển sang Midnight Lab"}
            title={`Giao diện: ${themeMode}`}
          >
            <Palette size={17} aria-hidden="true" />
          </button>
          {!isTrustRoute && <span className="trust-status hidden sm:inline-flex">
            <span className="status-dot" /> Bảo vệ đang bật
          </span>}
          {!ready ? (
            <span className="trust-status" role="status">Đang xác minh phiên…</span>
          ) : status === "ERROR" ? (
            <span className="trust-status" role="status">Phiên chưa khả dụng</span>
          ) : signedInForHeader ? (
            <>
            {isExpert && <ExpertRoomNotificationBell />}
            <div className="relative">
              <button
                type="button"
                className="profile-chip"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label="Mở menu tài khoản"
                onClick={() => setAccountOpen((value) => !value)}
              >
                {profile?.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt="" width={30} height={30} unoptimized className="profile-avatar object-cover" />
                ) : (
                  <span className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
                )}
                <span className="hidden lg:block max-w-32 truncate">{displayName}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              {accountOpen && (
                <div className="account-menu" role="menu" aria-label="Menu tài khoản">
                  <div className="account-menu-identity">
                    <span className="data-label">Phiên StudentHub</span>
                    <strong>{displayName}</strong>
                    <small>{session?.user?.email || "Email chưa công bố"}</small>
                  </div>
                  <Link href={profileLink.href} role="menuitem" onClick={() => setAccountOpen(false)}>
                    {isExpert ? <ShieldCheck size={15} /> : <UserRound size={15} />} {profileLink.label}
                  </Link>
                  <Link href={expertEntry.href} role="menuitem" onClick={() => setAccountOpen(false)}><ShieldCheck size={15} /> {expertEntry.label}</Link>
                  <Link href={settingsItem?.route || "/settings"} prefetch={false} role="menuitem" onClick={() => setAccountOpen(false)}><Settings size={15} /> {settingsItem?.label || "Cài đặt"}</Link>
                  <button type="button" role="menuitem" onClick={() => { setAccountOpen(false); void signOut(); }}><LogOut size={15} /> Đăng xuất</button>
                </div>
              )}
            </div>
            </>
          ) : (
            <div className="anonymous-actions">
              <Link href="/login" prefetch={false} className="secondary-action">Đăng nhập</Link>
              <Link href="/register" prefetch={false} className="primary-action">Đăng ký</Link>
            </div>
          )}
          {isCommunityRoute && <button
            type="button"
            className="community-glossary-trigger"
            aria-haspopup="dialog"
            aria-expanded={glossaryOpen}
            aria-controls="community-glossary-dialog"
            onClick={() => setGlossaryOpen(true)}
          ><BookOpen size={15} aria-hidden="true" /><span>Chú giải</span></button>}
        </div>
      </header>
      <div className="app-body">
        <MarginRail
          groups={CANONICAL_NAV_GROUPS}
          pathname={pathname}
          chapter={chapterForPath(pathname)}
          chapterLabel="StudentHub / Lề ghi chú"
          communityMode={isCommunityRoute}
          displayName={displayName}
          mobileOpen={mobileOpen}
          onMobileToggle={setMobileOpen}
          onNavigate={handleNavigate}
        />
        <div className="app-main">
          <div className="app-content">
            {!isCommunityRoute && !isTrustRoute && <ContextBar items={contextItems} className="mb-6" />}
            {children}
          </div>
        </div>
      </div>
      {isCommunityRoute && glossaryOpen && <div className="community-glossary-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setGlossaryOpen(false); }}>
        <section id="community-glossary-dialog" ref={glossaryDialogRef} className="community-glossary-dialog" role="dialog" aria-modal="true" aria-labelledby="community-glossary-title">
          <header><div><span className="data-label">COMMUNITY</span><h2 id="community-glossary-title">Chú giải</h2></div><button type="button" className="icon-button" onClick={() => setGlossaryOpen(false)} aria-label="Đóng chú giải"><X size={17} /></button></header>
          <ul>{DEFAULT_ANNOTATIONS.map((annotation) => <li key={annotation.mark}><span aria-hidden="true">{annotation.mark}</span><div><strong>{annotation.title}</strong><p>{annotation.body}</p></div></li>)}</ul>
        </section>
      </div>}
      {isExpert && !isExpertV4Route && !isTrustRoute && <ExpertBlindReviewWidget userRole="expert" />}
      {searchMounted && (
        <AcademicCommandPalette
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          restoreFocusRef={searchRestoreFocusRef}
        />
      )}
      <Suspense fallback={null}><OmniRouteTrigger /></Suspense>
    </div>
  );
}
