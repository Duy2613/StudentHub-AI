"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  MessageSquare,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";

export default function CollapsibleSidebar({ className = "" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, profile, signOut } = useAuth();
  
  // Default expanded on desktop, can be collapsed
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("studenthub_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("studenthub_sidebar_collapsed", String(nextState));
    }
  };

  const navItems = [
    {
      label: "Bảng Điều Khiển",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: "Kiểm Tra Lừa Đảo",
      href: "/scam-check",
      icon: ShieldAlert,
      badge: "AI 4 Lớp",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    },
    {
      label: "Diễn Đàn Cộng Đồng",
      href: "/forum",
      icon: MessageSquare,
      badge: null,
    },
    {
      label: "Hồ Sơ & Uy Tín",
      href: "/profile",
      icon: User,
      badge: null,
    },
    {
      label: "Đổi Avatar & Vai Trò",
      href: "/onboarding",
      icon: Settings,
      badge: null,
    },
  ];

  const isExpert = profile?.role === "expert";
  const trustScore = profile?.trustScore ?? (isExpert ? 98 : 80);

  return (
    <aside
      className={`h-screen sticky top-0 bg-space-950/90 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between transition-all duration-400 ease-premium z-40 select-none ${
        isCollapsed ? "w-[76px]" : "w-[260px]"
      } ${className}`}
    >
      {/* Top Header & Logo */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 p-[1.5px] shrink-0 shadow-[0_0_15px_rgba(52,231,196,0.35)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-space-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-300 animate-in fade-in">
              <span className="text-sm font-extrabold tracking-tight text-white truncate flex items-center gap-1">
                StudentHub <span className="text-teal-300 text-[10px] px-1 py-0.2 rounded bg-teal-400/20">AI</span>
              </span>
              <span className="text-[10px] text-gray-400 font-semibold truncate">
                Scam Prevention Hub
              </span>
            </div>
          )}
        </Link>

        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
          title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links with Sliding Curve Active Indicator */}
      <div className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-2xl text-xs font-bold transition-all duration-300 group ${
                isActive
                  ? "bg-teal-400/15 text-teal-300 border border-teal-400/30 shadow-[0_0_20px_rgba(52,231,196,0.2)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? "text-teal-300" : "text-gray-400 group-hover:text-gray-200"
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0 transition-opacity duration-200">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom User Card & Sign Out */}
      <div className="p-3 border-t border-white/10 space-y-3">
        {/* User Mini Profile */}
        <div
          onClick={() => router.push("/profile")}
          className={`cursor-pointer rounded-2xl p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2.5 ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? `${profile?.fullName || "Tài khoản"} (${trustScore} pts)` : undefined}
        >
          <AvatarDisplay
            avatarId={profile?.avatarId}
            avatarUrl={profile?.avatarUrl}
            role={profile?.role}
            size="sm"
            showBadge={true}
          />

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {profile?.fullName || session?.user?.email?.split("@")[0] || "Thành viên"}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-teal-300 font-semibold mt-0.5">
                {isExpert ? (
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-3 h-3 text-teal-400" />
                )}
                <span>{trustScore} Điểm Uy Tín</span>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          className={`w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all ${
            isCollapsed ? "justify-center" : ""
          }`}
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
