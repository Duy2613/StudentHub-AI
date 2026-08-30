"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, ChevronRight, FileClock, LayoutDashboard, Menu, MessageSquare, Search, Settings, ShieldCheck, UserRoundCheck, Users, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import MarginRail from "@/components/margin/MarginRail";

const groups = [
  { label: "Intelligence network", items: [
    { label: "Trust Engine", href: "/trust", icon: ShieldCheck },
    { label: "Community", href: "/community", icon: Users },
    { label: "Experts", href: "/expert", icon: UserRoundCheck },
    { label: "Academic 360", href: "/academic", icon: BookOpen },
    { label: "Evidence Case Lab", href: "/cases", icon: FileClock },
    { label: "Diễn đàn", href: "/forum", icon: MessageSquare }
  ] },
  { label: "Cá nhân", items: [
    { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
    { label: "Thông báo", href: "/dashboard#notifications", icon: Bell },
    { label: "Hồ sơ", href: "/profile", icon: UserRoundCheck },
    { label: "Cài đặt", href: "/settings", icon: Settings }
  ] },
];

function chapterForPath(pathname) {
  if (pathname.startsWith("/trust")) return "I";
  if (pathname.startsWith("/community") || pathname.startsWith("/forum")) return "II";
  if (pathname.startsWith("/expert")) return "III";
  if (pathname.startsWith("/academic")) return "IV";
  if (pathname.startsWith("/cases")) return "V";
  return "VI";
}

export default function UnifiedAppShell({ children }) {
  const pathname = usePathname();
  const { session, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen((value) => !value); }
      if (event.key === "Escape") { setSearchOpen(false); setMobileOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const quickResults = useMemo(() => {
    const all = groups.flatMap((group) => group.items);
    return query.trim() ? all.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())) : all.slice(0, 5);
  }, [query]);
  const displayName = profile?.fullName || session?.user?.email?.split("@")[0] || "Sinh viên";

  return (
    <div className="app-shell min-h-screen bg-app-canvas text-app-primary">
      <a href="#main-content" className="skip-link">Bỏ qua đến nội dung chính</a>
      <header className="app-header">
        <div className="flex items-center gap-3"><button type="button" aria-label={mobileOpen ? "Đóng menu" : "Mở menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)} className="icon-button md:hidden">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button><Link href="/dashboard" className="brand-mark" aria-label="StudentHub Command Center"><span className="brand-mark-icon"><ShieldCheck size={18} /></span><span><span className="brand-name">StudentHub <em>AI</em></span><span className="brand-subtitle">Academic operating system</span></span></Link></div>
        <button type="button" onClick={() => setSearchOpen(true)} className="command-search hidden md:flex"><span className="flex items-center gap-2"><Search size={15} /><span>Tìm case, bằng chứng hoặc chuyên gia...</span></span><kbd>Ctrl K</kbd></button>
        <div className="flex items-center gap-2"><span className="trust-status hidden sm:inline-flex"><span className="status-dot" /> Bảo vệ đang bật</span><Link href="/settings" className="profile-chip"><span className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span className="hidden lg:block max-w-32 truncate">{displayName}</span></Link></div>
      </header>
      <div className="app-body">
        <MarginRail
          groups={groups}
          pathname={pathname}
          chapter={chapterForPath(pathname)}
          chapterLabel={pathname === "/dashboard" ? "Personal command center" : "StudentHub / Margin"}
          displayName={displayName}
          mobileOpen={mobileOpen}
          onMobileToggle={setMobileOpen}
        />
        <main id="main-content" className="app-main"><div className="app-content">{children}</div></main>
      </div>
      {searchOpen && <div className="command-overlay" role="dialog" aria-modal="true" aria-label="Tìm kiếm nhanh" onMouseDown={(event) => event.target === event.currentTarget && setSearchOpen(false)}><div className="command-dialog"><div className="command-input-wrap"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong StudentHub..." /><button type="button" className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Đóng tìm kiếm"><X size={16} /></button></div><p className="nav-group-label mt-5 mb-2">Đi đến</p><div className="space-y-1">{quickResults.length ? quickResults.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setSearchOpen(false)} className="command-result"><Icon size={16} /><span>{item.label}</span><ChevronRight size={14} className="ml-auto" /></Link>; }) : <p className="empty-copy">Không tìm thấy khu vực phù hợp.</p>}</div></div></div>}
    </div>
  );
}
