"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  ShieldCheck,
  Award,
  Users,
  Layers,
  User,
  Shield,
  Search,
  Menu,
  X,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Lock
} from "lucide-react";
import { CommandPalette } from "../command/CommandPalette";

export function GlobalAppShell({ children }) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePersona, setActivePersona] = useState("STUDENT");

  useEffect(() => {
    async function loadIdentity() {
      try {
        const res = await fetch("/api/personalization/command-center");
        const json = await res.json();
        if (json.success && json.data) {
          setActivePersona(json.data.persona || "STUDENT");
        }
      } catch (err) {
        // Fallback default
      }
    }
    loadIdentity();
  }, []);

  const navItems = [
    { label: "Command Center", href: "/", icon: LayoutDashboard, exact: true },
    { label: "Academic Workspace", href: "/academic", icon: GraduationCap },
    { label: "T1 Trust Lens", href: "/intelligence/trust", icon: ShieldCheck },
    { label: "T2 Expert Lens", href: "/intelligence/experts", icon: Award },
    { label: "T3 Community Lens", href: "/intelligence/community", icon: Users },
    { label: "T4 Evidence Lens", href: "/intelligence/evidence", icon: Layers },
    { label: "Personal Vault", href: "/profile", icon: User },
    { label: "Privacy & Devices", href: "/settings/privacy", icon: Shield }
  ];

  const getPersonaLabel = (p) => {
    switch (p) {
      case "NEW_STUDENT":
        return "Tân Sinh Viên (Khóa 2024)";
      case "SENIOR_STUDENT":
        return "Sinh Viên Năm Cuối (Khóa 2022)";
      case "EXPERT":
        return "Chuyên Gia Kiểm Định";
      default:
        return "Sinh Viên Chính Quy (K23)";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-neutral-950">
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Top Universal App Header */}
      <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-black text-sm">
              SH
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-cyan-400 transition-all">
                  StudentHub
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  AI PROMAX
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-none">Personal Academic OS</p>
            </div>
          </Link>
        </div>

        {/* Global Search Bar (Ctrl+K trigger) */}
        <div className="hidden sm:flex items-center w-80 lg:w-96">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs transition-all shadow-inner"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-neutral-500" />
              <span>Tra cứu môn học, chuyên gia, quy chế...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 border border-neutral-700 text-neutral-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Security & Persona Badges */}
        <div className="flex items-center space-x-2.5">
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
            <Lock className="w-3 h-3" />
            <span>Zero-Trust Active</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-neutral-300 font-medium">{getPersonaLabel(activePersona)}</span>
          </div>
        </div>
      </header>

      {/* Main App Layout (Sidebar + Content Workspace) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800/80 bg-neutral-950/40 p-4 space-y-6 shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-3 block mb-2">
              Hệ Thống Trí Tuệ Học Vụ
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/30 font-bold shadow-lg shadow-cyan-500/5"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-neutral-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Connected Device Status Card */}
          <div className="mt-auto p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-semibold text-neutral-300 flex items-center space-x-1">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Đồng Bộ Thiết Bị</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">REALTIME</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              Bản sao số tự động duy trì liên tục giữa Laptop, Tablet và Mobile.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex flex-col p-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-sm text-neutral-200">Menu Điều Hướng</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold"
                        : "text-neutral-300 hover:bg-neutral-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-neutral-950 relative">
          <div className="max-w-6xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
