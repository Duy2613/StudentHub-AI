"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import MarginRail from "@/components/margin/MarginRail";
import { CANONICAL_NAV_GROUPS, CANONICAL_NAV_ITEMS, chapterForPath } from "./navigationConfig";

export default function UnifiedAppShell({ children }) {
  const pathname = usePathname();
  const { session, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchButtonRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchDialogRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
      return undefined;
    }
    searchButtonRef.current?.focus({ preventScroll: true });
    return undefined;
  }, [searchOpen]);

  const quickResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? CANONICAL_NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(normalizedQuery))
      : CANONICAL_NAV_ITEMS.slice(0, 5);
  }, [query]);
  const displayName = profile?.fullName || session?.user?.email?.split("@")[0] || "Sinh viên";
  const handleNavigate = () => setMobileOpen(false);
  const handleDialogKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setSearchOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = searchDialogRef.current?.querySelectorAll("button, input, a[href]");
    if (!focusable?.length) return;
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

  return (
    <div className="app-shell min-h-screen bg-app-canvas text-app-primary">
      <a href="#main-content" className="skip-link">Bỏ qua đến nội dung chính</a>
      <header className="app-header">
        <div className="flex items-center gap-3"><button type="button" aria-label={mobileOpen ? "Đóng menu" : "Mở menu"} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen((value) => !value)} className="icon-button md:hidden">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button><Link href="/dashboard" className="brand-mark" aria-label="StudentHub Command Center"><span className="brand-mark-icon"><ShieldCheck size={18} /></span><span><span className="brand-name">StudentHub <em>AI</em></span><span className="brand-subtitle">Academic operating system</span></span></Link></div>
        <button ref={searchButtonRef} type="button" onClick={() => setSearchOpen(true)} className="command-search hidden md:flex" aria-haspopup="dialog"><span className="flex items-center gap-2"><Search size={15} /><span>Tìm case, bằng chứng hoặc chuyên gia...</span></span><kbd>Ctrl K</kbd></button>
        <div className="flex items-center gap-2"><span className="trust-status hidden sm:inline-flex"><span className="status-dot" /> Bảo vệ đang bật</span><Link href="/settings" className="profile-chip"><span className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span className="hidden lg:block max-w-32 truncate">{displayName}</span></Link></div>
      </header>
      <div className="app-body">
        <MarginRail
          groups={CANONICAL_NAV_GROUPS}
          pathname={pathname}
          chapter={chapterForPath(pathname)}
          chapterLabel={pathname === "/dashboard" ? "Personal command center" : "StudentHub / Margin"}
          displayName={displayName}
          mobileOpen={mobileOpen}
          onMobileToggle={setMobileOpen}
          onNavigate={handleNavigate}
        />
        <main id="main-content" className="app-main"><div className="app-content">{children}</div></main>
      </div>
      {searchOpen && <div className="command-overlay" role="dialog" aria-modal="true" aria-labelledby="quick-search-title" onKeyDown={handleDialogKeyDown} onMouseDown={(event) => event.target === event.currentTarget && setSearchOpen(false)}><div ref={searchDialogRef} className="command-dialog"><h2 id="quick-search-title" className="sr-only">Tìm kiếm nhanh</h2><div className="command-input-wrap"><Search size={18} aria-hidden="true" /><label className="sr-only" htmlFor="quick-search-input">Tìm trong StudentHub</label><input ref={searchInputRef} id="quick-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong StudentHub..." /><button type="button" className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Đóng tìm kiếm"><X size={16} /></button></div><p className="nav-group-label mt-5 mb-2">Đi đến</p><div className="space-y-1">{quickResults.length ? quickResults.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => { setSearchOpen(false); setQuery(""); }} className="command-result"><Icon size={16} aria-hidden="true" /><span>{item.label}</span><ChevronRight size={14} className="ml-auto" aria-hidden="true" /></Link>; }) : <p className="empty-copy">Không tìm thấy khu vực phù hợp.</p>}</div></div></div>}
    </div>
  );
}
