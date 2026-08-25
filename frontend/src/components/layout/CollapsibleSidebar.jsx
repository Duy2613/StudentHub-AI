"use client";

// frontend/src/components/layout/CollapsibleSidebar.jsx
//
// Saffron Finance x Meer Mohsin Luxury App Navigation Sidebar:
// - Dark Cocoa Obsidian (#150604) surface with razor-sharp #47140b borderlines
// - Saffron Gold (#ffbc09) active pill indicators with Web Audio tactile haptics
// - Smooth collapsible desktop width (76px <-> 260px) & corner crosshair ticks (+)

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
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import { saffronAudio } from "@/lib/audio/saffronAudio";

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
    saffronAudio.playClick(500);
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
      badgeColor: "bg-[#ffbc09]/20 text-[#ffbc09] border-[#ffbc09]/40",
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
      className={`h-screen sticky top-0 bg-[#150604]/95 backdrop-blur-3xl border-r border-[#47140b] flex flex-col justify-between transition-all duration-400 ease-premium z-40 select-none font-human ${
        isCollapsed ? "w-[76px]" : "w-[260px]"
      } ${className}`}
    >
      {/* Top Header & Logo */}
      <div className="p-4 border-b border-[#47140b] flex items-center justify-between gap-2 relative">
        {/* Subtle Crosshair (+) */}
        <span className="absolute top-2 left-2 text-[#ffbc09]/40 font-mono text-[10px] select-none">+</span>

        <Link
          href="/dashboard"
          onClick={() => saffronAudio.playClick(600)}
          className="flex items-center gap-3 min-w-0 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ffbc09] via-[#f59e0b] to-[#ffd15c] p-[1.5px] shrink-0 shadow-[0_0_15px_rgba(255,188,9,0.35)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#150604] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#ffbc09]" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-300 animate-in fade-in">
              <span className="text-sm font-extrabold tracking-tight text-white truncate flex items-center gap-1.5 font-human">
                StudentHub <span className="text-[#ffbc09] text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ffbc09]/15 border border-[#ffbc09]/30">AI</span>
              </span>
              <span className="text-[10px] text-[#ece7e0]/60 font-medium truncate">
                Scam Prevention Hub
              </span>
            </div>
          )}
        </Link>

        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] text-[#ece7e0]/60 hover:text-[#ffbc09] transition-colors cursor-pointer"
          title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => saffronAudio.playClick(700)}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-2xl text-xs font-bold transition-all duration-300 group cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] shadow-[0_0_20px_rgba(255,188,9,0.35)]"
                  : "text-[#ece7e0]/70 hover:text-white hover:bg-[#210a07] border border-transparent hover:border-[#47140b]"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? "text-[#150604]" : "text-[#ece7e0]/70 group-hover:text-[#ffbc09]"
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0 transition-opacity duration-200">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        isActive
                          ? "bg-[#150604]/20 text-[#150604] border-[#150604]/30"
                          : item.badgeColor
                      }`}
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
      <div className="p-3 border-t border-[#47140b] space-y-3">
        {/* User Mini Profile */}
        <div
          onClick={() => {
            saffronAudio.playClick(600);
            router.push("/profile");
          }}
          className={`cursor-pointer rounded-2xl p-2.5 bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] hover:border-[#ffbc09]/50 transition-all flex items-center gap-2.5 shadow-sm ${
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
              <p className="text-xs font-bold text-white truncate font-human">
                {profile?.fullName || session?.user?.email?.split("@")[0] || "Thành viên"}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-[#ffbc09] font-semibold mt-0.5 font-mono">
                {isExpert ? (
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-3 h-3 text-[#ffbc09]" />
                )}
                <span>{trustScore} PTS UY TÍN</span>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={async () => {
            saffronAudio.playClick(400);
            await signOut();
            router.push("/login");
          }}
          className={`w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer ${
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
