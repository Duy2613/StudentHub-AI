"use client";

// app/dashboard/page.jsx
//
// Bảng điều khiển trung tâm (Dashboard) — Saffron Finance x Meer Mohsin 3D:
// - Cơ chế tương tác 2 trạng thái: Sóng Hạt 3D Tối Giản <-> Bung Mở Toàn Bộ Thông Tin A-Z khi Chạm
// - WebGL Real-time Fluid Dynamics Canvas theo con trỏ chuột 60fps
// - Quỹ đạo thiên văn 3D Astrolabe & vệ tinh bay quanh chu vi màn hình
// - Ma trận Saffron Bento 3D Swiss Grid viền tóc hairline (#47140b) và dấu chữ thập (+)
// - Nút Thu Gọn về chế độ sóng hạt tức thì

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  ArrowRight,
  Star,
  CheckCircle,
  TrendingUp,
  User,
  LogOut,
  Settings,
  Send,
  HelpCircle,
  Clock,
  Compass,
  FileText,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Plus,
  Radio,
  Cpu,
  Activity,
  Zap,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import UserDropdownMenu from "@/components/auth/UserDropdownMenu";
import LiveStudioClock from "@/components/ui/live-studio-clock";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import TactileButton from "@/components/ui/TactileButton";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMohsinPerimeter3DOrbit from "@/components/ui/SaffronMohsinPerimeter3DOrbit";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";
import SaffronSwissCrosshairGrid from "@/components/ui/SaffronSwissCrosshairGrid";
import Interactive3DWaveMonolithCapsule from "@/components/ui/Interactive3DWaveMonolithCapsule";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import { saffronAudio } from "@/lib/audio/saffronAudio";

export default function DashboardPage() {
  const router = useRouter();
  const { session, profile, signOut, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // 2 View Modes: "WAVE_MINIMAL" | "FULL_EXPANDED"
  const [viewMode, setViewMode] = useState("WAVE_MINIMAL");

  // Keyboard shortcut (Space) to toggle expand/collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (viewMode === "WAVE_MINIMAL") {
          saffronAudio.playSuccessChime();
          setViewMode("FULL_EXPANDED");
        } else {
          saffronAudio.playClick(400);
          setViewMode("WAVE_MINIMAL");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode]);

  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  // Redirect if not logged in or not onboarded
  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.replace("/login");
      } else if (profile && !profile.onboarded) {
        router.replace("/onboarding");
      }
    }
  }, [session, profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#150604] flex flex-col items-center justify-center text-[#ece7e0]">
        <div className="w-12 h-12 rounded-full border-2 border-[#ffbc09] border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs text-[#ffbc09] tracking-wider uppercase">[ INITIALIZING DASHBOARD // SAFFRON AI ENGINE ]</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const activeProfile = profile || {
    id: session?.user?.id || "usr-1",
    fullName: session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Thành viên StudentHub",
    role: session?.user?.user_metadata?.role || "student",
    avatarId: "student-tech",
    trustScore: 80,
    verifiedStudent: true,
  };

  const isExpert = activeProfile.role === "expert";
  const trustScore = activeProfile.trustScore ?? (isExpert ? 98 : 80);

  // Top Flagged Scam Cases in community
  const TOP_SCAM_ALERTS = [
    {
      id: "scam-1",
      title: "Cảnh báo thủ đoạn 'Nạp cọc làm nhiệm vụ Shopee/Tiki' lừa đảo sinh viên",
      category: "Tuyển dụng ảo",
      reportsCount: 142,
      riskLevel: "94% Nguy hiểm",
      location: "Toàn quốc (Zalo / Telegram)",
      time: "15 phút trước",
      desc: "Hứa hẹn hoa hồng 20-30%, bắt nạp cọc kích hoạt mã nhiệm vụ vào tài khoản cá nhân rác.",
      techTag: "[OCR CONFIRMED]",
    },
    {
      id: "scam-2",
      title: "Trọ ảo ngõ 27 Tạ Quang Bửu (Hai Bà Trưng, HN) ép chuyển cọc giữ chỗ 1 triệu",
      category: "Nhà trọ lừa cọc",
      reportsCount: 89,
      riskLevel: "88% Rủi ro cao",
      location: "Gần ĐH Bách Khoa Hà Nội",
      time: "1 giờ trước",
      desc: "Ảnh phòng trọ cắt ghép từ khách sạn sang trọng, số nhà thực tế không cho thuê.",
      techTag: "[GEO FLAGGED]",
    },
    {
      id: "scam-3",
      title: "Website giả mạo 'Học bổng du học hè 2026' thu phí hồ sơ 2.5 triệu qua link lạ",
      category: "Học bổng giả",
      reportsCount: 65,
      riskLevel: "91% Rủi ro cao",
      location: "Online (Domain .online)",
      time: "3 giờ trước",
      desc: "Tên miền .online mới tạo, giả mạo con dấu và logo các trường đại học quốc tế.",
      techTag: "[DOMAIN SPOOF]",
    },
  ];

  // Top 5 Leaderboard (0-100 pts)
  const TOP_5_LEADERBOARD = [
    { rank: 1, name: "TS. Nguyễn Minh Đức", field: "An ninh Mạng & AI", score: 99, role: "Chuyên gia", verified: true },
    { rank: 2, name: "Luật sư Trần Thu Hà", field: "Pháp lý & Quyền lợi SV", score: 98, role: "Chuyên gia", verified: true },
    { rank: 3, name: "ThS. Lê Hoàng Nam", field: "Học bổng & Hướng nghiệp", score: 97, role: "Chuyên gia", verified: true },
    { rank: 4, name: "Nguyễn Minh Quân (HUST)", field: "An toàn Mạng", score: 92, role: "Sinh viên", verified: true },
    { rank: 5, name: "Trần Bảo Ngọc (HCMUT)", field: "CTSV Đối Soát", score: 88, role: "Sinh viên", verified: true },
  ];

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. 3D Infinite Curving Road Highway Canvas */}
      <div className="canvas-bg-layer">
        <RobinPayotRoadCanvas />
      </div>

      {/* 2. Meer Mohsin WebGL Real-time Fluid Dynamics Canvas */}
      <MohsinFluidCanvas opacity={0.65} particleDensity={50} />

      {/* 3. 3D Astrolabe Orbit & Perimeter Satellites */}
      <SaffronMohsinPerimeter3DOrbit />

      {/* 4. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 5. Floating Quick Tools & Studio */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* Desktop Elastic Collapsible Sidebar */}
      <CollapsibleSidebar className="hidden md:flex relative z-40" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 font-human">
        
        {/* Top Header Bar with Glassmorphic styling */}
        <header className="h-16 px-4 sm:px-8 bg-[#150604]/80 backdrop-blur-2xl border-b border-[#47140b] flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#ffbc09] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tra cứu bài viết, từ khóa lừa đảo, số tài khoản đen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] transition-all font-human"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 select-none">
            {/* View Mode Toggle Pill */}
            <button
              type="button"
              onClick={() => {
                if (viewMode === "WAVE_MINIMAL") {
                  saffronAudio.playSuccessChime();
                  setViewMode("FULL_EXPANDED");
                } else {
                  saffronAudio.playClick(400);
                  setViewMode("WAVE_MINIMAL");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] hover:border-[#ffbc09]/50 text-xs font-mono font-bold text-[#ffbc09] transition-all shadow-sm cursor-pointer"
            >
              {viewMode === "WAVE_MINIMAL" ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>[ BUNG MỞ A-Z ]</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>[ ✕ THU GỌN SÓNG HẠT ]</span>
                </>
              )}
            </button>

            <IglooSoundAmbiencePill />
            <LiveStudioClock className="hidden sm:inline-flex" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/40 text-[#ffbc09] text-xs font-bold font-mono shadow-[0_0_15px_rgba(255,188,9,0.2)]">
              {isExpert ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#ffbc09]" />}
              <span>{trustScore} PTS</span>
            </div>

            <UserDropdownMenu />
          </div>
        </header>

        {/* Dynamic View: WAVE_MINIMAL vs FULL_EXPANDED */}
        <AnimatePresence mode="wait">
          {viewMode === "WAVE_MINIMAL" ? (
            /* =========================================================================
               STATE 1: 3D PARTICLE WAVE MINIMALIST MONOLITH CAPSULE
               ========================================================================= */
            <motion.div
              key="minimal-monolith"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col justify-center py-12"
            >
              <Interactive3DWaveMonolithCapsule
                badge="01 // BẢNG ĐIỀU KHIỂN • SÓNG HẠT 3D"
                title={`Xin chào, ${activeProfile.fullName}!`}
                subtitle="Không gian sóng hạt 3D vô tận. Chạm vào viên nang hoặc bấm phím Space để bung mở toàn bộ bảng điều khiển từ A đến Z."
                actionText="CHẠM ĐỂ MỞ BẢNG ĐIỀU KHIỂN TOÀN DIỆN [A → Z]"
                onExpand={() => setViewMode("FULL_EXPANDED")}
              />
            </motion.div>
          ) : (
            /* =========================================================================
               STATE 2: FULL EXPANDED MISSION CONTROL CONSOLE (A TO Z)
               ========================================================================= */
            <motion.main
              key="full-console"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
              className="flex-1 layout-safe-container py-8 space-y-8 pb-40"
            >
              {/* Collapse Trigger Bar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(400);
                    setViewMode("WAVE_MINIMAL");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] hover:border-[#ffbc09]/50 text-xs font-mono font-bold text-[#ffbc09] transition-all cursor-pointer shadow-sm"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>[ ✕ THU GỌN VỀ CHẾ ĐỘ SÓNG HẠT 3D ]</span>
                </button>

                <div className="text-[11px] font-mono text-[#ece7e0]/60 uppercase">
                  STATUS: FULL_DEEP_CONSOLE_ACTIVE [A → Z]
                </div>
              </div>

              {/* Top Marquee Telemetry Ticker */}
              <SaffronMarqueeTicker className="rounded-2xl border border-[#47140b]" />

              {/* Hero Welcome Banner (Swiss Style) */}
              <SaffronSwissCrosshairGrid sectionTag="MISSION // CONTROL" className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <AvatarDisplay
                      avatarId={activeProfile.avatarId}
                      avatarUrl={activeProfile.avatarUrl}
                      role={activeProfile.role}
                      size="lg"
                      showBadge={true}
                    />
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-mono font-bold mb-1.5 bg-[#ffbc09]/15 border border-[#ffbc09]/40 text-[#ffbc09]">
                        <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
                        <span>{isExpert ? "⭐ VERIFIED EXPERT MENTOR" : "🎓 VERIFIED STUDENT MEMBER"}</span>
                      </div>
                      <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                        Xin chào, <span className="text-[#ffd15c]">{activeProfile.fullName}</span>!
                      </h1>
                      <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-1 font-normal">
                        {isExpert
                          ? `${activeProfile.expertTitle || "Chuyên gia Tư vấn"} • ${activeProfile.expertField || "An ninh mạng"}`
                          : `${activeProfile.university || "Đại học Thành viên"} • ${activeProfile.major || "Khoa học & Kỹ thuật"}`}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        saffronAudio.playClick(700);
                        router.push("/scam-check");
                      }}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,188,9,0.35)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer font-mono"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Quét Nghi Vấn [0.1s]</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        saffronAudio.playClick(600);
                        router.push("/forum");
                      }}
                      className="py-2.5 px-4 rounded-xl bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] hover:border-[#ffbc09]/50 text-[#ece7e0] font-bold text-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    >
                      <MessageSquare className="w-4 h-4 text-[#ffbc09]" />
                      <span>Diễn Đàn Cộng Đồng</span>
                    </button>
                  </div>
                </div>

                {/* Live Sentinel Defense Telemetry Bar */}
                <div className="mt-6 pt-5 border-t border-[#47140b] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono relative z-10">
                  <div className="space-y-1">
                    <p className="text-[#ece7e0]/60 text-[11px]">Trạng Thái Hệ Thống</p>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      <span>ONLINE [100% SECURE]</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#ece7e0]/60 text-[11px]">Độ Trễ Phân Tích</p>
                    <p className="text-[#38bdf8] font-bold">&lt; 0.12s [EARLY EXIT]</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#ece7e0]/60 text-[11px]">Sự Vụ Đã Bảo Vệ</p>
                    <p className="text-[#ffbc09] font-bold">1,240+ CA PHÁT HIỆN</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#ece7e0]/60 text-[11px]">Điểm Uy Tín Cá Nhân</p>
                    <p className="text-[#ffd15c] font-bold">{trustScore} / 100 PTS</p>
                  </div>
                </div>
              </SaffronSwissCrosshairGrid>

              {/* 3 Core Quick Navigation Bento Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: AI Scam Checker */}
                <div
                  onClick={() => {
                    saffronAudio.playClick(600);
                    router.push("/scam-check");
                  }}
                  className="cursor-pointer group p-6 rounded-3xl bg-[#150604]/90 border border-[#47140b] hover:border-[#ffbc09]/60 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-[#ffbc09]/15 text-[#ffbc09] border border-[#ffbc09]/30 group-hover:scale-110 group-hover:bg-[#ffbc09] group-hover:text-[#150604] transition-all">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09]">
                      [ENGINE 4 LỚP]
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-[#ffd15c] transition-colors flex items-center justify-between">
                    <span>AI Scam Checker</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#ffbc09] group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-[#ece7e0]/70 mt-2 leading-relaxed">
                    Kiểm tra link, tin nhắn và ảnh chụp OCR qua 4 tầng phân tích với Risk Meter 0–100%.
                  </p>
                </div>

                {/* Card 2: Community Forum */}
                <div
                  onClick={() => {
                    saffronAudio.playClick(600);
                    router.push("/forum");
                  }}
                  className="cursor-pointer group p-6 rounded-3xl bg-[#150604]/90 border border-[#47140b] hover:border-[#38bdf8]/60 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 group-hover:scale-110 group-hover:bg-[#38bdf8] group-hover:text-[#150604] transition-all">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8]">
                      [VOTE UY TÍN]
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-[#38bdf8] transition-colors flex items-center justify-between">
                    <span>Diễn Đàn Xác Thực</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#38bdf8] group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-[#ece7e0]/70 mt-2 leading-relaxed">
                    Thảo luận về Nhà trọ, Quán ăn, Trường học và bình luận có gắn nhãn chuyên gia.
                  </p>
                </div>

                {/* Card 3: Profile & Trust Score */}
                <div
                  onClick={() => {
                    saffronAudio.playClick(600);
                    router.push("/profile");
                  }}
                  className="cursor-pointer group p-6 rounded-3xl bg-[#150604]/90 border border-[#47140b] hover:border-[#ca56ed]/60 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-[#ca56ed]/15 text-[#ca56ed] border border-[#ca56ed]/30 group-hover:scale-110 group-hover:bg-[#ca56ed] group-hover:text-[#150604] transition-all">
                      <User className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#ca56ed]/15 border border-[#ca56ed]/30 text-[#ca56ed]">
                      [REPUTATION]
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-[#ca56ed] transition-colors flex items-center justify-between">
                    <span>Hồ Sơ &amp; Uy Tín</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#ca56ed] group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-[#ece7e0]/70 mt-2 leading-relaxed">
                    Quản lý huy hiệu trường học, lịch sử báo cáo lừa đảo và tích lũy điểm uy tín sinh viên.
                  </p>
                </div>
              </div>

              {/* Section: Top Flagged Scams & Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left 7 Cols: Top Scam Alerts */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                      <span>Cảnh Báo Nóng Từ Mạng Lưới</span>
                    </h2>
                    <Link
                      href="/forum"
                      className="text-xs font-mono text-[#ffbc09] hover:underline flex items-center gap-1"
                    >
                      Xem tất cả ({TOP_SCAM_ALERTS.length * 4}+) <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {TOP_SCAM_ALERTS.map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          saffronAudio.playClick(600);
                          router.push("/forum");
                        }}
                        className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-[#150604]/90 hover:bg-[#210a07] border border-[#47140b] hover:border-red-500/50 transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-300">
                            {alert.riskLevel}
                          </span>
                          <span className="text-[11px] text-[#ece7e0]/50 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {alert.time}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">
                          {alert.title}
                        </h4>

                        <p className="text-xs text-[#ece7e0]/70 line-clamp-2 leading-relaxed">
                          {alert.desc}
                        </p>

                        <div className="pt-2 flex items-center justify-between text-[11px] text-[#ece7e0]/50 border-t border-[#47140b]/60">
                          <span>{alert.location}</span>
                          <span className="font-mono text-[#ffbc09] font-bold">{alert.techTag}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right 5 Cols: Top 5 Trust Leaderboard */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Star className="w-5 h-5 text-[#ffbc09] fill-[#ffbc09]" />
                      <span>Bảng Xếp Hạng Uy Tín</span>
                    </h2>
                    <span className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">[ TOP VERIFIED ]</span>
                  </div>

                  <div className="p-5 rounded-3xl bg-[#150604]/90 border border-[#47140b] space-y-3">
                    {TOP_5_LEADERBOARD.map((user) => (
                      <div
                        key={user.rank}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#210a07] border border-[#47140b]/70 hover:border-[#ffbc09]/40 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            user.rank === 1 ? "bg-[#ffbc09] text-[#150604]" :
                            user.rank === 2 ? "bg-gray-300 text-[#150604]" :
                            user.rank === 3 ? "bg-amber-700 text-white" :
                            "bg-[#2f0e09] text-[#ece7e0]/60"
                          }`}>
                            {user.rank}
                          </span>
                          <div>
                            <p className="font-bold text-white">{user.name}</p>
                            <p className="text-[10px] text-[#ece7e0]/60">{user.field}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-extrabold text-[#ffd15c]">{user.score} PTS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
