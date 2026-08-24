"use client";

// app/dashboard/page.jsx
// Bảng điều khiển trung tâm (Dashboard) của StudentHub AI:
// - Đầy đủ hiệu ứng đỉnh cao như Trang chủ: RobinPayotRoadCanvas 3D Highway, Film Grain NoiseOverlay
// - Studio hiệu ứng BackgroundsAndEffectsStudio + Thanh phím tắt FloatingDock
// - Bộ điều khiển âm hưởng băng tuyết IglooSoundAmbiencePill trên Topbar
// - Ma trận Bento 3D Holographic Foil phản quang theo góc chuột (.igloo-hologram-card)
// - Chuẩn Typography Kép: Inter 900 (Human Interface) + JetBrains Mono (Machine Telemetry)
// - Top sự vụ cảnh báo lừa đảo (.ai-analysis-box.danger) + Bảng xếp hạng Uy tín 0-100 pts
// - Radar An ninh mạng Sentinel quét 24/7 với độ trễ 0.1s

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
  Zap
} from "lucide-react";

import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import UserDropdownMenu from "@/components/auth/UserDropdownMenu";
import LiveStudioClock from "@/components/ui/live-studio-clock";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import TactileButton from "@/components/ui/TactileButton";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import IglooAuroraDivider from "@/components/ui/IglooAuroraDivider";

export default function DashboardPage() {
  const router = useRouter();
  const { session, profile, signOut, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

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
      <div className="min-h-screen bg-[#05070e] flex flex-col items-center justify-center text-gray-300">
        <div className="w-12 h-12 rounded-full border-2 border-teal-400 border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-sm text-teal-300 tracking-wider">[INITIALIZING DASHBOARD ENGINE...]</p>
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
    { rank: 5, name: "Đặng Hoàng Long (FTU)", field: "Cộng đồng SV", score: 88, role: "Sinh viên", verified: true },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/forum?prefill=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex relative overflow-x-hidden">
      {/* 1. 3D Infinite Curving Road Highway Canvas (Robin Payot Signature) */}
      <div className="canvas-bg-layer">
        <RobinPayotRoadCanvas />
      </div>

      {/* 2. Film Grain & Ambient Noise */}
      <NoiseOverlay />

      {/* 3. Floating Quick Tools & Studio */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* 4. Elastic Collapsible Sidebar */}
      <CollapsibleSidebar className="hidden md:flex relative z-40" />

      {/* 5. Main Dashboard Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-space-950/80 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tra cứu bài viết, STK ngân hàng hoặc link nghi vấn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/15 rounded-2xl text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-space-900 transition-all font-human"
            />
          </form>

          {/* Right Status */}
          <div className="flex items-center gap-3">
            {/* Igloo Ambient Sound Synthesizer */}
            <IglooSoundAmbiencePill />

            <LiveStudioClock className="hidden sm:inline-flex" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-300 text-xs font-bold font-mono shadow-[0_0_15px_rgba(52,231,196,0.2)]">
              {isExpert ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />}
              <span>{trustScore} PTS</span>
            </div>

            <UserDropdownMenu />
          </div>
        </header>

        {/* Dashboard Main Content wrapped in layout-safe-container */}
        <main className="flex-1 layout-safe-container py-8 space-y-8 pb-40">
          
          {/* Hero Welcome Holographic Banner */}
          <div
            onMouseMove={handleCardMouseMove}
            className="relative rounded-3xl p-6 sm:p-8 igloo-hologram-card border border-teal-500/30 overflow-hidden backdrop-blur-3xl shadow-glass-deep"
          >
            {/* Mouse reactive holographic glare */}
            <div
              className="igloo-hologram-glare"
              style={{
                background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(56, 189, 248, 0.25) 0%, rgba(45, 212, 191, 0.15) 35%, transparent 70%)`,
              }}
            />

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
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-mono font-bold mb-1.5 bg-teal-400/15 border border-teal-400/40 text-teal-300">
                    <span className="w-2 h-2 rounded-full bg-teal-400 igloo-radar-beacon" />
                    <span>{isExpert ? "⭐ VERIFIED EXPERT MENTOR" : "🎓 VERIFIED STUDENT MEMBER"}</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-human font-black text-white tracking-tight">
                    Xin chào, {activeProfile.fullName}!
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1 font-human">
                    {isExpert
                      ? `${activeProfile.expertTitle || "Chuyên gia Tư vấn"} • ${activeProfile.expertField || "An ninh mạng"}`
                      : `${activeProfile.university || "Đại học Thành viên"} • ${activeProfile.major || "Khoa học & Kỹ thuật"}`}
                  </p>
                </div>
              </div>

              {/* Quick Actions with Dual Typography */}
              <div className="flex flex-wrap items-center gap-3">
                <TactileButton
                  variant="primary"
                  size="sm"
                  techSuffix="[AI 0.1s]"
                  onClick={() => router.push("/scam-check")}
                  icon={ShieldAlert}
                >
                  Quét Nghi Vấn
                </TactileButton>

                <TactileButton
                  variant="secondary"
                  size="sm"
                  techSuffix="[DAO]"
                  onClick={() => router.push("/forum")}
                  icon={MessageSquare}
                >
                  Diễn Đàn
                </TactileButton>
              </div>
            </div>

            {/* Live Sentinel Defense Telemetry Bar */}
            <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono relative z-10">
              <div className="space-y-1">
                <p className="text-gray-400 text-[11px] font-human">Trạng Thái Hệ Thống</p>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>ONLINE [100% SECURE]</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 text-[11px] font-human">Độ Trễ Phân Tích</p>
                <p className="text-cyan-300 font-bold">&lt; 0.12s [EARLY EXIT]</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 text-[11px] font-human">Sự Vụ Đã Bảo Vệ</p>
                <p className="text-teal-300 font-bold">1,240+ CA PHÁT HIỆN</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 text-[11px] font-human">Điểm Uy Tín Cá Nhân</p>
                <p className="text-amber-300 font-bold">{trustScore} / 100 PTS</p>
              </div>
            </div>
          </div>

          {/* 3 Core Quick Navigation Igloo Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: AI Scam Checker */}
            <div
              onClick={() => router.push("/scam-check")}
              onMouseMove={handleCardMouseMove}
              className="cursor-pointer group p-6 rounded-3xl igloo-hologram-card border border-teal-500/30 hover:border-teal-400/60 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 shadow-glass-deep"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 group-hover:scale-110 group-hover:bg-teal-400 group-hover:text-space-950 transition-all">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-teal-400/15 border border-teal-400/30 text-teal-300">
                  [ENGINE 4 LỚP]
                </span>
              </div>
              <h3 className="text-lg font-human font-black text-white group-hover:text-teal-300 transition-colors flex items-center justify-between">
                <span>AI Scam Checker</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed font-human">
                Kiểm tra link, tin nhắn và ảnh chụp OCR qua 4 tầng phân tích với Risk Meter 0–100%.
              </p>
            </div>

            {/* Card 2: Community Forum */}
            <div
              onClick={() => router.push("/forum")}
              onMouseMove={handleCardMouseMove}
              className="cursor-pointer group p-6 rounded-3xl igloo-hologram-card border border-indigo-500/30 hover:border-indigo-400/60 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 shadow-glass-deep"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:scale-110 group-hover:bg-indigo-400 group-hover:text-space-950 transition-all">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-400/15 border border-indigo-400/30 text-indigo-300">
                  [VOTE UY TÍN]
                </span>
              </div>
              <h3 className="text-lg font-human font-black text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                <span>Diễn Đàn Xác Thực</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed font-human">
                Thảo luận về Nhà trọ, Quán ăn, Trường học và bình luận có gắn nhãn chuyên gia.
              </p>
            </div>

            {/* Card 3: Profile & Trust Score */}
            <div
              onClick={() => router.push("/profile")}
              onMouseMove={handleCardMouseMove}
              className="cursor-pointer group p-6 rounded-3xl igloo-hologram-card border border-amber-500/30 hover:border-amber-400/60 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 shadow-glass-deep"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-space-950 transition-all">
                  <Star className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300">
                  [0–100 PTS]
                </span>
              </div>
              <h3 className="text-lg font-human font-black text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                <span>Hồ Sơ & Điểm Tín Nhiệm</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed font-human">
                Quản lý điểm tín nhiệm, xác thực email trường (.edu = +30đ) và lịch sử cảnh báo.
              </p>
            </div>
          </div>

          <IglooAuroraDivider intensity="subtle" />

          {/* Grid Layout: Top Flagged Scams (Left 2/3) + Leaderboard & Stats (Right 1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2/3: Top Flagged Scams in Community */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                  <h2 className="text-xl font-human font-black text-white">Top Cảnh Báo Lừa Đảo Nóng Trong Tuần</h2>
                </div>
                <Link
                  href="/forum"
                  className="text-xs font-mono font-bold text-teal-300 hover:text-teal-200 flex items-center gap-1 transition-colors"
                >
                  XEM TẤT CẢ <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-4">
                {TOP_SCAM_ALERTS.map((scam) => (
                  <div
                    key={scam.id}
                    onClick={() => router.push(`/scam-check?prefill=${encodeURIComponent(scam.title)}`)}
                    className="cursor-pointer p-5 rounded-3xl ai-analysis-box danger hover:border-rose-400/60 backdrop-blur-2xl transition-all space-y-3 shadow-glass-deep group"
                  >
                    <div className="ai-header">
                      <div className="flex items-center gap-2">
                        <span className="status-danger">
                          {scam.category} • {scam.riskLevel}
                        </span>
                        <span className="font-mono text-[10px] text-rose-300/80 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
                          {scam.techTag}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" /> {scam.time}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-human font-bold text-white group-hover:text-rose-300 transition-colors">
                      {scam.title}
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed font-human">{scam.desc}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                      <span className="font-human text-gray-300">Khu vực: <strong className="text-white font-mono">{scam.location}</strong></span>
                      <span className="font-mono text-teal-300 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        KIỂM CHỨNG NGAY <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 1/3: Personal Trust Card & Top 5 Leaderboard */}
            <div className="space-y-6">
              
              {/* Personal Trust Score Box with Holographic Sheen */}
              <div className="p-6 rounded-3xl igloo-hologram-card border border-teal-500/30 backdrop-blur-2xl space-y-4 shadow-glass-deep">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" /> TRẠNG THÁI UY TÍN CỦA BẠN
                </h3>

                <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/40 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-human text-gray-300">Điểm Uy Tín Hiện Tại</p>
                    <p className="text-3xl font-black font-mono text-teal-300 mt-0.5">{trustScore} PTS</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      +30Đ .EDU.VN
                    </span>
                    <p className="text-[10px] font-mono text-gray-400 mt-1">HẠNG: TOP 10%</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-300 font-human">
                  <div className="flex justify-between py-1.5 border-b border-white/10">
                    <span className="text-gray-400">Cơ chế xác thực:</span>
                    <span className="font-semibold text-white font-mono">Xác nhận đúng (+1 / +2đ)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/10">
                    <span className="text-gray-400">Mốc chuyên gia:</span>
                    <span className="font-semibold text-amber-300 font-mono">80–100 PTS</span>
                  </div>
                </div>
              </div>

              {/* Top 5 Leaderboard */}
              <div className="p-6 rounded-3xl igloo-hologram-card border border-white/15 backdrop-blur-2xl space-y-4 shadow-glass-deep">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" /> TOP 5 LEADERBOARD
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {TOP_5_LEADERBOARD.map((user) => (
                    <div
                      key={user.rank}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs hover:border-amber-400/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-white/10 text-gray-200 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          #{user.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="font-human font-bold text-white truncate">{user.name}</p>
                          <p className="text-[10px] text-gray-400 font-human truncate">{user.field}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-300 shrink-0">
                        {user.score} PTS
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
