"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { markAssurance, measureAssurance } from "@/lib/performance/assurance";

const AcademicCommandPalette = dynamic(() => import("../command/AcademicCommandPalette"), {
  ssr: false,
});

export const PRIMARY_NAV_ITEMS = [
  { id: "home", label: "Trang chủ", href: "/", icon: null },
  { id: "trust", label: "Kiểm chứng", href: "/trust", icon: ShieldCheck },
  { id: "community", label: "Cộng đồng", href: "/community", icon: Users },
  { id: "expert", label: "Chuyên gia", href: "/expert", icon: UserRoundCheck },
];

export const ALL_NAV_ITEMS = [...PRIMARY_NAV_ITEMS];

export default function AcademicNavbar() {
  const pathname = usePathname();
  const { session, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandPaletteMounted, setCommandPaletteMounted] = useState(false);
  const commandPaletteTriggerRef = useRef(null);

  const openCommandPalette = () => {
    markAssurance("command-palette-request");
    setCommandPaletteMounted(true);
    setCommandPaletteOpen(true);
  };

  const toggleMobileNavigation = () => {
    markAssurance("mobile-navigation-request");
    setMobileOpen((previous) => !previous);
  };

  useEffect(() => {
    if (!mobileOpen) return;
    markAssurance("mobile-navigation-interactive");
    measureAssurance("mobile-navigation-open-duration", "mobile-navigation-request", "mobile-navigation-interactive");
  }, [mobileOpen]);

  // Keyboard shortcut Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => {
          if (!prev) {
            markAssurance("command-palette-request");
            setCommandPaletteMounted(true);
          }
          return !prev;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayName = profile?.fullName || session?.user?.email?.split("@")[0] || "Sinh viên";
  const avatarLetter = (displayName[0] || "S").toUpperCase();

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const renderNavLink = (item, { mobile = false } = {}) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={mobile ? () => setMobileOpen(false) : undefined}
        className={`${mobile ? "flex items-center gap-3 p-3 rounded-xl text-base" : "px-3 py-1.5 rounded-lg text-sm"} font-medium transition-colors ${
          active
            ? "text-text-primary bg-surface-primary border border-border-strong shadow-sm"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-primary/50"
        } focus:outline-none focus:ring-2 focus:ring-accent-primary`}
        aria-current={active ? "page" : undefined}
      >
        {Icon && <Icon size={mobile ? 18 : 15} className={mobile ? "text-accent-knowledge" : undefined} aria-hidden="true" />}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <header className="reference-landing-navbar sticky top-0 z-10 w-full border-b border-border-subtle bg-bg-primary/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleMobileNavigation}
              aria-label={mobileOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
              aria-expanded={mobileOpen}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              href="/"
              className="flex items-center gap-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary rounded-lg p-1"
              aria-label="StudentHub AI Trang chủ"
            >
              <div className="reference-brand-mark w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md">
                <ShieldCheck size={18} />
              </div>
              <span className="font-semibold text-lg tracking-tight">
                StudentHub <span className="text-accent-knowledge font-mono text-sm">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Primary Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Điều hướng chính">
            {PRIMARY_NAV_ITEMS.map((item) => renderNavLink(item))}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Command Palette Trigger */}
            <button
              type="button"
              ref={commandPaletteTriggerRef}
              onClick={openCommandPalette}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-primary border border-border-subtle hover:border-border-strong text-text-muted text-xs font-mono transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary"
              aria-label="Tìm kiếm toàn hệ thống (Ctrl K)"
            >
              <Search size={14} className="text-text-secondary" />
              <span>Tìm kiếm...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border-subtle text-[10px]">
                Ctrl K
              </kbd>
            </button>

            {/* Dashboard button */}
            <Link
              href="/dashboard"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-primary border border-border-subtle transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </Link>

            {/* Profile Avatar */}
            <Link
              href="/profile"
              className="flex items-center gap-2 p-1 rounded-full text-text-primary hover:ring-2 hover:ring-accent-primary transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary"
              aria-label={`Hồ sơ của ${displayName}`}
            >
              <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-xs font-mono font-bold text-accent-knowledge shadow-sm">
                {avatarLetter}
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-t border-border-subtle p-6 overflow-y-auto animate-fade-in"
            role="dialog"
            aria-label="Menu điều hướng di động"
          >
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  ref={commandPaletteTriggerRef}
                  onClick={() => {
                    setMobileOpen(false);
                    openCommandPalette();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-primary border border-border-subtle text-text-secondary text-sm font-mono"
                >
                  <div className="flex items-center gap-2">
                    <Search size={16} />
                    <span>Tìm kiếm...</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-surface-elevated text-xs">Ctrl K</kbd>
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono uppercase tracking-wider text-text-muted px-3 mb-2">
                  Điều hướng chính
                </div>
                {PRIMARY_NAV_ITEMS.map((item) => {
                  return renderNavLink(item, { mobile: true });
                })}
              </div>

              <div className="pt-4 border-t border-border-subtle space-y-1">
                <div className="text-xs font-mono uppercase tracking-wider text-text-muted px-3 mb-2">
                  Cá nhân & Thiết lập
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-primary text-base font-medium"
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard điều hành</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-primary text-base font-medium"
                >
                  <UserRoundCheck size={18} />
                  <span>Hồ sơ học vụ 360</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      {commandPaletteMounted && (
        <AcademicCommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          restoreFocusRef={commandPaletteTriggerRef}
        />
      )}
    </>
  );
}
