'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getMobilePrimaryNavItems, isRouteActive } from '@/config/navigation';

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

export default function MobileNavRail() {
  const pathname = usePathname();

  if (pathname === "/" || CANONICAL_SHELL_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) {
    return null;
  }

  const mobileItems = getMobilePrimaryNavItems();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--surface-1)]/95 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around"
      aria-label="Điều hướng di động"
    >
      {mobileItems.map((item) => {
        const isActive = isRouteActive(pathname, item.route);

        return (
          <Link
            key={item.id}
            href={item.route}
            className={`flex flex-col items-center py-1 px-2 text-[11px] font-[family-name:var(--font-product)] transition-colors ${
              isActive
                ? 'text-[var(--action-primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
