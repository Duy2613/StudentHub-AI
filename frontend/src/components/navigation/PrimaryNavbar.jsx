'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAccountNavItems, getCoreNavItems, getUtilityNavItems, isRouteActive } from '@/config/navigation';

const CANONICAL_SHELL_PREFIXES = [
  "/trust",
  "/community",
  "/expert",
  "/cases",
  "/settings",
  "/profile",
  "/login",
  "/register",
  "/onboarding",
  "/callback",
];

export default function PrimaryNavbar() {
  const pathname = usePathname();

  // Canonical product routes own their navigation through UnifiedAppShell or
  // the editorial landing header. Keep this legacy shell for compatibility
  // routes only so users never see two competing global headers (M-07).
  if (pathname === "/" || CANONICAL_SHELL_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) {
    return null;
  }

  const coreItems = getCoreNavItems();
  const omniItem = getUtilityNavItems().find((item) => item.id === "omni");
  const accountItems = getAccountNavItems().filter((item) => item.id !== "privacy");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand Anchor */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-editorial)] text-xl font-bold tracking-tight text-[var(--text-primary)] hover:text-[var(--action-primary)] transition-colors"
          >
            StudentHub<span className="text-[var(--action-accent)] text-sm font-sans font-normal ml-1">AI</span>
          </Link>

          {/* Primary Nav Links (5 Canonical Pillars M-06) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng chính">
            {coreItems.map((item) => {
              const isActive = isRouteActive(pathname, item.route);

              return (
                <Link
                  key={item.id}
                  href={item.route}
                  className={`px-3 py-1.5 text-sm font-[family-name:var(--font-product)] transition-colors rounded-lg ${
                    isActive
                      ? 'text-[var(--text-primary)] font-semibold bg-[var(--surface-2)] border-b-2 border-[var(--action-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Utility Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={omniItem?.route || "/ai"}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-[family-name:var(--font-product)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--border-default)] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--action-primary)]" aria-hidden="true" />
            {omniItem?.label || "AI / Omni"}
          </Link>
          {accountItems.map((item) => (
            <Link
              key={item.id}
              href={item.route}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-[family-name:var(--font-product)]"
              aria-label={item.label}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
