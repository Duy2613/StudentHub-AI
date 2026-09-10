'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Tổng quan', href: '/dashboard' },
  { label: 'Xác minh', href: '/trust' },
  { label: 'Học thuật', href: '/academic' },
  { label: 'Cộng đồng', href: '/community' },
  { label: 'Chuyên gia', href: '/expert' },
  { label: 'Trợ lý AI', href: '/ai' },
];

const CANONICAL_SHELL_PREFIXES = ["/trust", "/community", "/expert", "/cases", "/dashboard", "/settings", "/academic", "/profile"];

export default function PrimaryNavbar() {
  const pathname = usePathname();

  // Canonical product routes own their navigation through UnifiedAppShell or
  // the editorial landing header. Keep this legacy shell for compatibility
  // routes only so users never see two competing global headers.
  if (pathname === "/" || CANONICAL_SHELL_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand Anchor */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent-trust)] transition-colors"
          >
            StudentHub<span className="text-[var(--accent-trust)] text-sm font-sans font-normal ml-1">AI</span>
          </Link>

          {/* Primary Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm font-[family-name:var(--font-ui)] transition-colors ${
                    isActive
                      ? 'text-[var(--text-primary)] font-semibold border-b-2 border-[var(--accent-trust)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
            href="/safety-map"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-[family-name:var(--font-ui)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] rounded hover:border-[var(--border-strong)] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-knowledge)]" aria-hidden="true" />
            An toàn
          </Link>
          <Link
            href="/sos"
            className="inline-flex items-center px-3 py-1 text-xs font-black font-[family-name:var(--font-ui)] text-[var(--bg-primary)] bg-[var(--status-danger)] hover:opacity-90 rounded transition-opacity"
            aria-label="Khẩn cấp SOS"
          >
            SOS
          </Link>
          <Link
            href="/profile"
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-[family-name:var(--font-ui)]"
            aria-label="Hồ sơ sinh viên"
          >
            Hồ sơ
          </Link>
          <Link
            href="/settings"
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-[family-name:var(--font-ui)]"
            aria-label="Cài đặt hệ thống"
          >
            Cài đặt
          </Link>
        </div>
      </div>
    </header>
  );
}
