"use client";

/**
 * StudentHub AI — StudentHub OS Master Application Shell
 * Multi-audience desktop sidebar + top unified command bar + mobile bottom navigation.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  GraduationCap,
  Calendar,
  Brain,
  Users,
  Award,
  Sparkles,
  ShieldCheck,
  Bell,
  Search,
  Settings,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

export const USER_ROLES = Object.freeze({
  STUDENT: "STUDENT",
  EXPERT: "EXPERT",
  MODERATOR: "MODERATOR"
});

export default function StudentHubOSShell({ children }) {
  const pathname = usePathname();
  const [activeRole, setActiveRole] = useState(USER_ROLES.STUDENT);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([
    {
      id: "notif_1",
      title: "Điều chỉnh phòng học Giải tích 1",
      desc: "Phòng Đào Tạo đã chuyển lớp từ D301 sang A1-204.",
      time: "10 phút trước",
      type: "OFFICIAL"
    },
    {
      id: "notif_2",
      title: "Cảnh báo nghẽn cổng đăng ký học phần",
      desc: "Hệ thống ghi nhận 14 báo cáo timeout lúc 20h00.",
      time: "35 phút trước",
      type: "WARNING"
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    {
      label: "Command Center",
      href: "/",
      icon: Zap,
      badge: "LIVE",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30"
    },
    {
      label: "Học vụ 360",
      href: "/academic",
      icon: GraduationCap,
      badge: "K24",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30"
    },
    {
      label: "Intelligence Fabric",
      href: "/intelligence",
      icon: Brain,
      badge: "T1–T4",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    },
    {
      label: "AI Studio",
      href: "/ai",
      icon: Sparkles,
      badge: "Grounded",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30"
    },
    {
      label: "Cài đặt & Quyền riêng tư",
      href: "/settings",
      icon: Settings
    }
  ];

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Global Command Header */}
      <header className="sticky top-0 z-40 h-16 bg-[#0e0705]/95 border-b border-[#2d120a] backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand Logo & Current View */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#1a0c08] border border-[#3d1910] text-gray-300"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-black fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">StudentHub</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">OS</span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono hidden sm:block">Academic Operating System</p>
            </div>
          </Link>

          {/* Role Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-lg bg-[#140805] border border-[#2d120a]">
            {Object.values(USER_ROLES).map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                  activeRole === role
                    ? "bg-amber-500 text-black font-bold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {role === USER_ROLES.STUDENT ? "Sinh Viên (K24)" : role === USER_ROLES.EXPERT ? "Chuyên Gia" : "Quản Trị Viên"}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Quick Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#140805] border border-[#2d120a] hover:border-amber-500/40 text-gray-400 hover:text-gray-200 transition-all text-xs group"
          >
            <div className="flex items-center gap-2">
              <Search size={15} className="text-gray-400 group-hover:text-amber-400" />
              <span>Tìm học phần, giảng viên, bằng chứng, quy chế...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-[#200e08] border border-[#3d1910] text-[10px] font-mono text-gray-400">Ctrl K</kbd>
          </button>
        </div>

        {/* Right: Security Status, Notifications & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Zero-Trust Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-semibold">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Zero-Trust Active</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-[#140805] border border-[#2d120a] hover:border-amber-500/40 text-gray-300 transition-all"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#120704] border border-[#3d1910] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-[#2d120a]">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Thông Báo Học Vụ Mới</h4>
                  <span className="text-[10px] text-gray-400 font-mono">{recentNotifications.length} chưa đọc</span>
                </div>
                <div className="space-y-2.5 mt-3 max-h-72 overflow-y-auto">
                  {recentNotifications.map(n => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-[#1a0b07] border border-[#2d120a] hover:border-amber-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          n.type === "OFFICIAL" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                        }`}>{n.type}</span>
                        <span className="text-[10px] text-gray-500">{n.time}</span>
                      </div>
                      <h5 className="text-xs font-semibold text-gray-100 mt-1">{n.title}</h5>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Account Capsule */}
          <Link
            href="/settings"
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#140805] border border-[#2d120a] hover:border-amber-500/40 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 text-black flex items-center justify-center font-bold text-xs font-mono">
              24
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-200 leading-none">Trần Bảo Duy</p>
              <p className="text-[10px] text-amber-400/80 font-mono leading-tight">MSSV: 24110001</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Main OS Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex w-64 flex-col bg-[#0b0503] border-r border-[#2d120a] p-4 shrink-0">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-2">Điều Hướng Chính</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold shadow-sm shadow-amber-500/5"
                      : "text-gray-400 hover:text-gray-200 hover:bg-[#140805]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? "text-amber-400" : "text-gray-400 group-hover:text-gray-200"} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Context Card */}
          <div className="mt-auto p-3.5 rounded-2xl bg-[#140805] border border-[#2d120a] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>Học kỳ Hiện Tại</span>
              <span className="text-amber-400 font-bold">HK2 2025–2026</span>
            </div>
            <div className="w-full bg-[#200e08] h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-[65%]" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>Tuần 9 / 15</span>
              <span>65% Hoàn thành</span>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-over Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-[#2d120a]">
              <span className="font-extrabold text-amber-400 font-mono text-sm">MENU STUDENTHUB OS</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-[#1a0c08] text-gray-300">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 mt-4 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-sm ${
                      isActive ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-gray-300 bg-[#120704]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#070403]">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#120704] border border-[#3d1910] shadow-2xl p-4 space-y-4">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#1a0b07] border border-[#2d120a]">
              <Search className="text-amber-400" size={18} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm môn học, quy chế tốt nghiệp, giáo sư, bằng chứng..."
                className="w-full bg-transparent text-sm text-gray-100 focus:outline-none placeholder-gray-500"
              />
              <button onClick={() => setIsSearchOpen(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold px-2">Truy Cập Nhanh</p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/academic"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-3 rounded-xl bg-[#180905] border border-[#2d120a] hover:border-amber-500/40 text-left transition-all"
                >
                  <p className="text-xs font-semibold text-gray-200">🎓 Tra cứu Hồ sơ Học vụ 360</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tiến độ tín chỉ, GPA, chuẩn đầu ra</p>
                </Link>
                <Link
                  href="/intelligence"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-3 rounded-xl bg-[#180905] border border-[#2d120a] hover:border-amber-500/40 text-left transition-all"
                >
                  <p className="text-xs font-semibold text-gray-200">🧠 Tra cứu Bằng chứng T4</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Hợp nhất văn bản, quy định xét tốt nghiệp</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
