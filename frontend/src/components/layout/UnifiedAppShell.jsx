"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Menu, Search, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import MarginRail from "@/components/margin/MarginRail";
import ContextBar from "@/components/ui/ContextBar";
import RealtimeLiveConsole from "@/components/realtime/RealtimeLiveConsole";
import { CANONICAL_NAV_GROUPS, chapterForPath } from "./navigationConfig";
import { getReferenceRouteProfile } from "./referenceRouteConfig";
import { markAssurance } from "@/lib/performance/assurance";

const AcademicCommandPalette = dynamic(() => import("@/components/command/AcademicCommandPalette"), {
  ssr: false,
});

export default function UnifiedAppShell({ children }) {
  const pathname = usePathname();
  const { session, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);
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

  const displayName = profile?.fullName || session?.user?.email?.split("@")[0] || "Sinh viên";
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
      className="app-shell min-h-screen bg-app-canvas text-app-primary"
      data-reference-route={routeProfile.id}
      data-reference-surface={routeProfile.surface}
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
          <Link href="/settings" prefetch={false} className="profile-chip" aria-label="Hồ sơ và Cài đặt">
            <span className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
            <span className="hidden lg:block max-w-32 truncate">{displayName}</span>
          </Link>
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
