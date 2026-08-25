"use client";

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
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import UserDropdownMenu from "@/components/auth/UserDropdownMenu";
import LiveStudioClock from "@/components/ui/live-studio-clock";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import ModernNavbar from "@/components/layout/ModernNavbar";
import TactileButton from "@/components/ui/TactileButton";
import AeroMissionControlBackdrop from "@/components/ui/AeroMissionControlBackdrop";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";
import SaffronSwissCrosshairGrid from "@/components/ui/SaffronSwissCrosshairGrid";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import { saffronAudio } from "@/lib/audio/saffronAudio";

export default function DashboardPage() {
  const router = useRouter();
  const { session, profile, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="min-h-screen bg-[#070403] flex flex-col items-center justify-center text-[#ece7e0]">
        <div className="w-12 h-12 rounded-full border-2 border-[#ffbc09] border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs text-[#ffbc09] tracking-wider uppercase">[ INITIALIZING MISSION CONTROL // SAFFRON AI ]</p>
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
      {/* 1. High-End Aerospace Aviation Terminal Backdrop (Clean & Non-overlapping) */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_07_ALPHA // MISSION_CONTROL_MATRIX"
        gridDensity={52}
        showRadarRings={true}
      />

      {/* 2. Interactive WebGL Fluid Smoke Trail */}
      <MohsinFluidCanvas opacity={0.35} particleDensity={35} />

      {/* 3. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 4. Floating Quick Tools & Studio */}
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
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-[#47140b] text-[11px] font-mono text-[#ffbc09]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>RADAR_ARMED // ZERO_LEAK</span>
            </div>

            <IglooSoundAmbiencePill />
            <LiveStudioClock className="hidden sm:inline-flex" />
            <UserDropdownMenu />
          </div>
        </header>

        {/* Main Mission Control Scroll Area */}
        <main className="p-4 sm:p-8 space-y-8 pb-32 max-w-7xl mx-auto w-full font-human">
          
          {/* Top Marquee Telemetry Ticker */}
          <SaffronMarqueeTicker className="rounded-2xl border border-[#47140b]/60" />

          {/* SECTION 1: Identity & 4-KPI Telemetry Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Identity Flight Card (Col 5) */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-4 hover:border-[#ffbc09]/40 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <AvatarDisplay avatarId={activeProfile.avatarId} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                        {activeProfile.fullName}
                      </h2>
                      {isExpert ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#ffbc09]/20 text-[#ffbc09] text-[10px] font-mono font-bold border border-[#ffbc09]/40">
                          ⭐ CỐ VẤN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                          ✓ SINH VIÊN
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-[#ece7e0]/60 mt-0.5">
                      NODE_ID: {activeProfile.id?.slice(0, 12)}...
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#ece7e0]/60 uppercase block">TÍN NHIỆM:</span>
                  <span className="text-2xl font-black text-[#ffbc09] font-mono">{trustScore} <span className="text-xs font-normal text-white">PTS</span></span>
                </div>
              </div>

              {/* Progress Bar of Trust */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-mono text-[#ece7e0]/60">
                  <span>CHỈ SỐ AN TOÀN SỐ</span>
                  <span className="text-emerald-400 font-bold">{trustScore >= 80 ? "XÁC THỰC CAO" : "TRUNG BÌNH"}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-[#2d0d08]">
                  <div
                    className="h-full bg-gradient-to-r from-[#ea3810] via-[#ffbc09] to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, trustScore)}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons inside Card */}
              <div className="flex items-center gap-3 pt-2">
                <Link
                  href="/profile"
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center text-xs font-mono font-bold text-white transition-all"
                >
                  [ HỒ SƠ &amp; CHỨNG CHỈ ]
                </Link>
                <Link
                  href="/scam-check"
                  className="flex-1 py-2 px-3 rounded-xl bg-[#ffbc09] hover:bg-[#ffd15c] text-[#150604] text-center text-xs font-mono font-extrabold uppercase transition-all shadow-md"
                >
                  [ KIỂM TRA LỪA ĐẢO ]
                </Link>
              </div>
            </div>

            {/* 4 Telemetry Metrics Grid (Col 7) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-2 gap-4">
              
              <div className="p-5 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl flex flex-col justify-between hover:border-[#ffbc09]/40 transition-all">
                <div className="flex items-center justify-between text-[#ffbc09]">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-[10px] font-mono uppercase bg-[#ffbc09]/10 px-2 py-0.5 rounded-md">L1 ENGINE</span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">142</span>
                  <p className="text-xs text-[#ece7e0]/70 mt-1">Cảnh báo lừa đảo đã chặn</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">✓ 99.8% Chính xác</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl flex flex-col justify-between hover:border-[#ffbc09]/40 transition-all">
                <div className="flex items-center justify-between text-[#38bdf8]">
                  <Activity className="w-5 h-5" />
                  <span className="text-[10px] font-mono uppercase bg-[#38bdf8]/10 px-2 py-0.5 rounded-md">NETWORK</span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">14,280</span>
                  <p className="text-xs text-[#ece7e0]/70 mt-1">Nút sinh viên kết nối</p>
                  <p className="text-[10px] text-[#38bdf8] font-mono mt-0.5">● Real-time Telemetry</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl flex flex-col justify-between hover:border-[#ffbc09]/40 transition-all">
                <div className="flex items-center justify-between text-emerald-400">
                  <Zap className="w-5 h-5" />
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md">LATENCY</span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">0.04ms</span>
                  <p className="text-xs text-[#ece7e0]/70 mt-1">Tốc độ quét Layer 1</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">⚡ Deterministic Zero-Lag</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl flex flex-col justify-between hover:border-[#ffbc09]/40 transition-all">
                <div className="flex items-center justify-between text-amber-400">
                  <Lock className="w-5 h-5" />
                  <span className="text-[10px] font-mono uppercase bg-amber-400/10 px-2 py-0.5 rounded-md">ENCRYPTION</span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">AES-256</span>
                  <p className="text-xs text-[#ece7e0]/70 mt-1">Bảo mật định danh .edu</p>
                  <p className="text-[10px] text-amber-400 font-mono mt-0.5">🔒 Zero Data Leakage</p>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: Command Station & Threat Feeds (2-Column Architecture) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column (Col 8): Quick Actions & Recent Scam Alerts */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Quick Action Command Center */}
              <SaffronSwissCrosshairGrid sectionTag="02 // COMMAND_STATION" className="p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 font-mono">
                  <Sparkles className="w-4 h-4 text-[#ffbc09]" />
                  TRẠM THỰC THI &amp; THẨM ĐỊNH NHANH
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link
                    href="/scam-check"
                    className="p-4 rounded-2xl bg-black/40 border border-[#2d0d08] hover:border-[#ffbc09]/60 transition-all group block"
                  >
                    <ShieldAlert className="w-5 h-5 text-[#ffbc09] mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white">Quét URL / Tin Nhắn</p>
                    <p className="text-[11px] text-[#ece7e0]/60 mt-0.5 font-human">Kiểm tra ngay qua Layer 1</p>
                  </Link>

                  <Link
                    href="/forum"
                    className="p-4 rounded-2xl bg-black/40 border border-[#2d0d08] hover:border-[#38bdf8]/60 transition-all group block"
                  >
                    <MessageSquare className="w-5 h-5 text-[#38bdf8] mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white">Đăng Báo Cáo Mới</p>
                    <p className="text-[11px] text-[#ece7e0]/60 mt-0.5 font-human">Cảnh báo cộng đồng sinh viên</p>
                  </Link>

                  <Link
                    href="/profile"
                    className="p-4 rounded-2xl bg-black/40 border border-[#2d0d08] hover:border-emerald-500/60 transition-all group block"
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white">Xác Minh Học Vị</p>
                    <p className="text-[11px] text-[#ece7e0]/60 mt-0.5 font-human">Nâng điểm uy tín tài khoản</p>
                  </Link>
                </div>
              </SaffronSwissCrosshairGrid>

              {/* Recent Community Threat Alerts Feed */}
              <div className="p-6 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ea3810] animate-ping" />
                    <h3 className="text-sm font-bold text-white font-mono">CẢNH BÁO NGUY HIỂM GẦN ĐÂY [REALTIME]</h3>
                  </div>
                  <Link
                    href="/forum"
                    className="text-xs font-mono text-[#ffbc09] hover:underline flex items-center gap-1"
                  >
                    <span>Xem tất cả</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {TOP_SCAM_ALERTS.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 rounded-2xl bg-black/40 border border-[#2d0d08] hover:border-[#ffbc09]/40 transition-all space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#ea3810]/20 text-[#ea3810] font-mono font-bold text-[10px]">
                          {alert.techTag}
                        </span>
                        <span className="text-[11px] font-mono text-[#ece7e0]/40">{alert.time}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-white">{alert.title}</p>
                      <p className="text-xs text-[#ece7e0]/70 font-human leading-relaxed">{alert.desc}</p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#ece7e0]/50 pt-1">
                        <span>Khu vực: {alert.location}</span>
                        <span className="text-[#ea3810] font-bold">{alert.riskLevel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column (Col 4): Leaderboard & Accreditations */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Top 5 Reputable Contributors Leaderboard */}
              <div className="p-6 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <Star className="w-4 h-4 text-[#ffbc09]" />
                  BẢNG VINH DANH TÍN NHIỆM
                </h3>

                <div className="space-y-3">
                  {TOP_5_LEADERBOARD.map((item) => (
                    <div
                      key={item.rank}
                      className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-[#2d0d08]"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                          item.rank === 1
                            ? "bg-[#ffbc09] text-[#150604]"
                            : item.rank === 2
                            ? "bg-slate-300 text-[#150604]"
                            : item.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-white/10 text-white/60"
                        }`}>
                          {item.rank}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">{item.name}</p>
                          <p className="text-[10px] text-[#ece7e0]/50 font-mono">{item.field}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#ffbc09]">{item.score}</span>
                        <span className="text-[10px] text-[#ece7e0]/40 font-mono block">PTS</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aerospace Trust Credentials Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-[#150604] to-[#0a0302] border border-[#ffbc09]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#ffbc09] font-mono text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>TSO-C199 CERTIFIED AI SHIELD</span>
                </div>
                <p className="text-xs text-[#ece7e0]/80 leading-relaxed font-human">
                  Hệ thống thẩm định 4 lớp vận hành theo chuẩn kiến trúc phân giải danh tính đại học, đảm bảo không lưu vết dữ liệu cá nhân nhạy cảm.
                </p>
                <div className="pt-2 border-t border-[#47140b] text-[10px] font-mono text-[#ece7e0]/40 flex justify-between">
                  <span>STATUS: SECURE</span>
                  <span>VERSION: 1.0.0-PROD</span>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
