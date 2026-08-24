"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldAlert, 
  MessageSquare, 
  LayoutDashboard, 
  User, 
  Menu, 
  X, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import UserDropdownMenu from "@/components/auth/UserDropdownMenu";
import LiveStudioClock from "@/components/ui/live-studio-clock";
import { motion } from "motion/react";

export default function ModernNavbar() {
  const pathname = usePathname();
  const { session, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);

  const navTabs = [
    { label: "Trang Chủ", href: "/" },
    { label: "Kiểm Tra Lừa Đảo", href: "/scam-check", highlight: true },
    { label: "Diễn Đàn", href: "/forum" },
    { label: "Bảng Điều Khiển", href: session ? "/dashboard" : "/login" },
    { label: "Hồ Sơ", href: session ? "/profile" : "/register" },
  ];

  return (
    <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* Floating Glassmorphic Island */}
      <nav className="pointer-events-auto w-full max-w-5xl bg-space-950/80 backdrop-blur-2xl border border-white/12 rounded-full py-2.5 px-4 sm:px-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3 transition-all duration-300">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 via-emerald-500 to-cyan-500 p-[1.5px] shadow-[0_0_15px_rgba(52,231,196,0.4)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-space-950 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-400 group-hover:text-teal-300 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-tight">
              StudentHub <span className="text-teal-300 text-xs px-1.5 py-0.5 rounded-full bg-teal-400/10 border border-teal-400/30">AI</span>
            </span>
            <span className="text-[9px] text-gray-400 tracking-wider uppercase font-semibold hidden sm:inline">
              Xác thực & Phòng chống lừa đảo
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items with Framer Motion Sliding Active Indicator */}
        <div 
          className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/8 rounded-full p-1 relative"
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
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 z-10 ${
                  isActive
                    ? "text-space-950 font-bold"
                    : tab.highlight
                    ? "text-teal-300 hover:text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {/* Active Indicator (Solid Pill) */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 bg-gradient-to-r from-teal-300 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(52,231,196,0.5)] -z-10"
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
              </Link>
            );
          })}
        </div>

        {/* Right Status Actions & User Dropdown */}
        <div className="flex items-center gap-3">
          <LiveStudioClock className="hidden lg:inline-flex" />

          {session ? (
            <UserDropdownMenu />
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Đăng Nhập
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-teal-400 to-emerald-400 text-space-950 shadow-[0_0_20px_rgba(52,231,196,0.35)] hover:shadow-[0_0_25px_rgba(52,231,196,0.5)] transition-all hover:scale-105 active:scale-95"
              >
                Bắt Đầu Miễn Phí
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto absolute top-16 inset-x-4 max-w-lg mx-auto bg-space-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-2xl space-y-3 z-50 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                      ? "bg-teal-400/15 text-teal-300 border border-teal-400/30"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.highlight && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-teal-400/20 text-teal-300">
                      Engine 4 lớp
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {!session && (
            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-gray-300"
              >
                Đăng Nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-bold rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-space-950 shadow-md"
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
