"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck,
  Menu, 
  X, 
  Sparkles,
  Zap
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import UserDropdownMenu from "@/components/auth/UserDropdownMenu";
import LiveStudioClock from "@/components/ui/live-studio-clock";
import { motion } from "motion/react";

export default function ModernNavbar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);

  // Streamlined nav items with no wrapping
  const navTabs = [
    { label: "Trang Chủ", href: "/" },
    { label: "Kiểm Tra Lừa Đảo", href: "/scam-check", highlight: true, badge: "AI 4 Lớp" },
    { label: "Xếp Tín Chỉ", href: "/credit-scheduler" },
    { label: "Review GV", href: "/prof-rating" },
    { label: "Học Bổng", href: "/scholarships" },
    { label: "Bản Đồ An Ninh", href: "/safety-map" },
    { label: "Radar Học Phí", href: "/tuition-radar" },
    { label: "Bóc Tách Hợp Đồng", href: "/contract-check" },
    { label: "Cấp Cứu SOS", href: "/sos", highlight: true },
    { label: "Sàn Pass Đồ", href: "/marketplace" },
    { label: "Diễn Đàn", href: "/forum" },
    ...(session ? [
      { label: "Bảng Điều Khiển", href: "/dashboard" },
      { label: "Hồ Sơ", href: "/profile" },
    ] : []),
  ];

  return (
    <header className="fixed top-3 sm:top-4 inset-x-0 z-50 flex justify-center px-2 sm:px-4 lg:px-6 pointer-events-none">
      {/* Floating Glassmorphic Island */}
      <nav className="pointer-events-auto w-full max-w-[98vw] 2xl:max-w-[1560px] bg-[#0e0403]/90 backdrop-blur-2xl border border-[#47140b]/80 hover:border-[#ffbc09]/40 rounded-full py-1.5 sm:py-2 px-3 sm:px-5 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_20px_rgba(255,188,9,0.06)] flex items-center justify-between gap-2 lg:gap-4 transition-all duration-300">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ea3810] via-[#ffbc09] to-[#ffd15c] p-[1.5px] shadow-[0_0_15px_rgba(255,188,9,0.35)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#150604] rounded-full flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#ffbc09] group-hover:text-[#ffd15c] transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-extrabold tracking-tight text-white flex items-center gap-1 leading-tight font-mono">
              StudentHub <span className="text-[#ffbc09] text-[10px] px-1 py-0.2 rounded bg-[#ffbc09]/15 border border-[#ffbc09]/30 font-bold font-machine">AI</span>
            </span>
            <span className="text-[7.5px] text-[#ece7e0]/50 tracking-wider uppercase font-semibold hidden xl:inline font-mono">
              Hệ Thống Thẩm Định An Toàn
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items with Framer Motion Sliding Active Indicator */}
        <div 
          className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-black/60 border border-[#2d0d08] rounded-full p-1 relative overflow-x-auto no-scrollbar"
          onMouseLeave={() => setHoveredTab(null)}
        >
          {navTabs.map((tab) => {
            const isActive = pathname === tab.href;
            const isHovered = hoveredTab === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onMouseEnter={() => setHoveredTab(tab.href)}
                className={`relative px-2.5 xl:px-3 py-1 rounded-full text-[11px] xl:text-xs font-semibold whitespace-nowrap transition-colors duration-200 z-10 flex items-center gap-1 ${
                  isActive
                    ? "text-[#150604] font-bold"
                    : tab.highlight
                    ? "text-[#ffd15c] hover:text-white"
                    : "text-[#ece7e0]/75 hover:text-white"
                }`}
              >
                {/* Active Indicator (Saffron Solid Pill) */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-gradient-to-r from-[#ffbc09] to-[#ffd15c] rounded-full shadow-[0_0_18px_rgba(255,188,9,0.45)] -z-10"
                  />
                )}

                {/* Hover Glow Pill */}
                {isHovered && !isActive && (
                  <motion.div
                    layoutId="navbar-hover-indicator"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-white/10 rounded-full -z-10"
                  />
                )}

                <span>{tab.label}</span>
                {tab.badge && !isActive && (
                  <span className="text-[8.5px] px-1 py-0.2 rounded bg-[#ffbc09]/20 text-[#ffbc09] border border-[#ffbc09]/30 font-mono font-bold">
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Status Actions & User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LiveStudioClock className="hidden xl:inline-flex bg-black/50 border-[#2d0d08] text-[#ece7e0]/80" />

          {session ? (
            <UserDropdownMenu />
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#ece7e0]/80 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                Đăng Nhập
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#ffbc09] via-[#ffd15c] to-[#ff9900] text-[#150604] shadow-[0_0_20px_rgba(255,188,9,0.35)] hover:shadow-[0_0_25px_rgba(255,188,9,0.55)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-[#150604]" />
                <span>Bắt Đầu Miễn Phí</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full bg-black/60 hover:bg-white/10 border border-[#47140b] text-[#ece7e0] hover:text-white transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto absolute top-16 inset-x-4 max-w-lg mx-auto bg-[#0e0403]/95 backdrop-blur-2xl border border-[#47140b] rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-3 z-50 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navTabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#ffbc09]/20 text-[#ffd15c] border border-[#ffbc09]/40"
                      : "text-[#ece7e0]/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#ffbc09]/20 text-[#ffd15c] border border-[#ffbc09]/30">
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {!session && (
            <div className="pt-3 border-t border-[#2d0d08] grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-semibold rounded-xl bg-black/60 border border-[#2d0d08] text-[#ece7e0]"
              >
                Đăng Nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#ffd15c] text-[#150604] shadow-md"
              >
                Đăng Ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
