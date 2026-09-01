"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  MessageSquare,
  LogOut,
  Star,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import { motion, AnimatePresence } from "motion/react";

export default function UserDropdownMenu({ className = "" }) {
  const router = useRouter();
  const { session, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) {
    return (
      <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
        <Link
          href="/login"
          className="px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          Đăng Nhập
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-teal-400 to-emerald-400 text-space-950 shadow-[0_0_20px_rgba(52,231,196,0.35)] hover:brightness-110 active:scale-95 transition-all"
        >
          <span>Bắt Đầu Miễn Phí</span>
        </Link>
      </div>
    );
  }

  const isExpert = profile?.role === "expert";
  const fullName = profile?.fullName || session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Thành viên StudentHub";
  const email = profile?.email || session?.user?.email || "";
  const trustScore = profile?.trustScore ?? 50;
  const roleLabel = isExpert ? "⭐ Chuyên gia uy tín" : "🎓 Sinh viên";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-500/40 transition-all group focus:outline-none shadow-sm"
      >
        <AvatarDisplay
          avatarId={profile?.avatarId}
          avatarUrl={profile?.avatarUrl}
          role={profile?.role}
          size="sm"
          showBadge={true}
        />
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1 max-w-[130px]">
            {fullName}
          </span>
          <span className="text-[10px] text-gray-400 font-medium -mt-0.5">
            {roleLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-transform duration-200 ${
            isOpen ? "rotate-180 text-teal-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-3xl bg-space-900/95 backdrop-blur-2xl border border-white/15 shadow-glass-deep p-4 z-50 overflow-hidden"
          >
            {/* Header User Details */}
            <div className="flex items-start gap-3 pb-3.5 border-b border-white/10">
              <AvatarDisplay
                avatarId={profile?.avatarId}
                avatarUrl={profile?.avatarUrl}
                role={profile?.role}
                size="md"
                showBadge={true}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{fullName}</p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
                
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isExpert
                        ? "bg-amber-500/15 border-amber-400/40 text-amber-300"
                        : "bg-teal-500/15 border-teal-400/40 text-teal-300"
                    }`}
                  >
                    {isExpert ? <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> : <ShieldCheck className="w-2.5 h-2.5 text-teal-400" />}
                    <span>{roleLabel}</span>
                  </span>

                  <span className="text-[11px] font-mono font-bold text-teal-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {trustScore} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links Menu */}
            <div className="py-2 space-y-0.5 text-xs">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-colors group"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="font-semibold">Bảng điều khiển</span>
                  <span className="text-[10px] text-gray-400">Tin nóng & Leaderboard</span>
                </div>
              </Link>

              <Link
                href="/trust"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-colors group"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="font-semibold">Trust Engine</span>
                  <span className="text-[10px] text-gray-400">Kiểm tra link, text & OCR</span>
                </div>
              </Link>

              <Link
                href="/community"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-colors group"
              >
                <MessageSquare className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="font-semibold">Quan sát cộng đồng</span>
                  <span className="text-[10px] text-gray-400">Bằng chứng trải nghiệm có ngữ cảnh</span>
                </div>
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-colors group"
              >
                <User className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="font-semibold">Hồ sơ cá nhân</span>
                  <span className="text-[10px] text-gray-400">Điểm uy tín & Xác thực</span>
                </div>
              </Link>

              <Link
                href="/onboarding"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-colors group"
              >
                <Settings className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="font-semibold">Đổi Avatar & Vai trò</span>
                  <span className="text-[10px] text-gray-400">Sinh viên / Chuyên gia</span>
                </div>
              </Link>
            </div>

            {/* Footer Sign Out */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={async () => {
                  setIsOpen(false);
                  await signOut();
                  router.push("/login");
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
