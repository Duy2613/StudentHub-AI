'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MOBILE_ITEMS = [
  { label: 'Tổng quan', href: '/dashboard' },
  { label: 'Xác minh', href: '/trust' },
  { label: 'Học thuật', href: '/academic' },
  { label: 'Cộng đồng', href: '/community' },
  { label: 'AI', href: '/ai' },
];

const CANONICAL_SHELL_PREFIXES = ["/trust", "/community", "/expert", "/cases", "/dashboard", "/settings", "/academic", "/profile"];

export default function MobileNavRail() {
  const pathname = usePathname();

  if (pathname === "/" || CANONICAL_SHELL_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around"
      aria-label="Điều hướng di động"
    >
      {MOBILE_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-1 px-2 text-[11px] font-[family-name:var(--font-ui)] ${
              isActive
                ? 'text-[var(--accent-trust)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
      <Link
        href="/sos"
        className="flex flex-col items-center py-1 px-2 text-[11px] font-bold text-[var(--status-danger)]"
      >
        <span>SOS</span>
      </Link>
    </nav>
  );
}
