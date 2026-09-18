"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { ChevronDown, LogOut, Menu, Search, Settings, ShieldCheck, UserRound, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE, normalizeExpertLifecycleState } from "@/lib/auth/presentationState";
import MarginRail from "@/components/margin/MarginRail";
import ContextBar from "@/components/ui/ContextBar";
import RealtimeLiveConsole from "@/components/realtime/RealtimeLiveConsole";
import { CANONICAL_NAV_GROUPS, chapterForPath } from "./navigationConfig";
import { getReferenceRouteProfile } from "./referenceRouteConfig";
import { markAssurance } from "@/lib/performance/assurance";

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
  const searchButtonRef = useRef(null);

  const openSearch = () => {
    markAssurance("command-palette-request");
    setSearchMounted(true);
    setSearchOpen(true);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
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
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);


  const displayName = profile?.fullName || session?.user?.email?.split("@")[0] || "Khách";
  const signedInForHeader = ready && status === "READY" && isAuthenticated;
  const isExpert = expertLifecycleState === EXPERT_LIFECYCLE_STATE.ACTIVE;
  const profileLink = isExpert
    ? { label: "Hồ sơ chuyên gia", href: "/expert/profile" }
    : { label: "Hồ sơ cá nhân", href: "/profile" };
  const expertEntry = isExpert
    ? { label: "Expert Dashboard", href: "/expert" }
    : { label: "Trở thành chuyên gia.", href: "/expert/profile" };
  const handleNavigate = () => setMobileOpen(false);
  const routeProfile = getReferenceRouteProfile(pathname || "/");
  const contextItems = pathname && pathname !== "/dashboard"
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
      <a href="#main-content" className="skip-link">Bỏ qua đến nội dung chính</a>
      <header className="app-header">
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
          <Link href="/dashboard" className="brand-mark" aria-label="StudentHub Command Center">
            <span className="brand-mark-icon"><ShieldCheck size={18} /></span>
            <span>
              <span className="brand-name">StudentHub <em>AI</em></span>
              <span className="brand-subtitle">Kiểm chứng trước quyết định</span>
            </span>
          </Link>
        </div>
        <button
          ref={searchButtonRef}
          type="button"
          onClick={openSearch}
          className="command-search hidden md:flex"
          aria-haspopup="dialog"
          aria-label="Tìm kiếm trên StudentHub (Ctrl+K)"
        >
          <span className="flex items-center gap-2">
            <Search size={15} aria-hidden="true" />
            <span>Tìm kiếm tình huống, Trust, chuyên gia...</span>
          </span>
          <kbd>Ctrl K</kbd>
        </button>
        <div className="flex items-center gap-2">
          <span className="trust-status hidden sm:inline-flex">
            <span className="status-dot" /> Bảo vệ đang bật
          </span>
          {!ready ? (
            <span className="trust-status" role="status">Đang xác minh phiên…</span>
          ) : status === "ERROR" ? (
            <span className="trust-status" role="status">Phiên chưa khả dụng</span>
          ) : signedInForHeader ? (
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
                  <img src={profile.avatarUrl} alt="" className="profile-avatar object-cover" />
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
                  <Link href="/settings" role="menuitem" onClick={() => setAccountOpen(false)}><Settings size={15} /> Cài đặt</Link>
                  <button type="button" role="menuitem" onClick={() => { setAccountOpen(false); void signOut(); }}><LogOut size={15} /> Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <div className="anonymous-actions">
              <Link href="/login" prefetch={false} className="secondary-action">Đăng nhập</Link>
              <Link href="/register" prefetch={false} className="primary-action">Đăng ký</Link>
            </div>
          )}
        </div>
      </header>
      <div className="app-body">
        <MarginRail
          groups={CANONICAL_NAV_GROUPS}
          pathname={pathname}
          chapter={chapterForPath(pathname)}
          chapterLabel={pathname === "/dashboard" ? "Trung tâm cá nhân" : "StudentHub / Lề ghi chú"}
          displayName={displayName}
          mobileOpen={mobileOpen}
          onMobileToggle={setMobileOpen}
          onNavigate={handleNavigate}
        />
        <main id="main-content" className="app-main">
          <div className="app-content">
            <ContextBar items={contextItems} className="mb-6" />
            {children}
          </div>
        </main>
      </div>
      <RealtimeLiveConsole />
      {isExpert && <ExpertBlindReviewWidget userRole="expert" />}
      {searchMounted && (
        <AcademicCommandPalette
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          restoreFocusRef={searchButtonRef}
        />
      )}
    </div>
  );
}
