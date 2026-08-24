"use client";

// app/dashboard/page.jsx
// Bảng điều khiển trung tâm (Dashboard) của StudentHub AI:
// - Top bài viết / sự vụ bị cảnh báo lừa đảo nhiều nhất
// - Top 5 Bảng xếp hạng Người dùng & Chuyên gia uy tín nhất
// - Thanh tìm kiếm nhanh
// - Widget Điểm uy tín cá nhân (+30đ Email .edu) & Phím tắt nhanh

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
  Plus
} from "lucide-react";

import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import UserDropdownMenu from "@/components/auth/UserDropdownMenu";
import LiveStudioClock from "@/components/ui/live-studio-clock";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import TactileButton from "@/components/ui/TactileButton";

export default function DashboardPage() {
  const router = useRouter();
  const { session, profile, signOut, isLoading } = useAuth();
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
      <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center text-gray-300">
        <div className="w-12 h-12 rounded-full border-2 border-teal-400 border-t-transparent animate-spin mb-4" />
        <p className="font-medium text-gray-400">Đang tải StudentHub AI Dashboard...</p>
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
    },
    {
      id: "scam-3",
      title: "Website giả mạo 'Học bổng du học hè 2026' thu phí hồ sơ 2.5 triệu qua link lạ",
      category: "Học bổng giả",
      reportsCount: 65,
      riskLevel: "91% Rủi ro cao",
      location: "Online",
      time: "3 giờ trước",
      desc: "Tên miền .online mới tạo, giả mạo con dấu và logo các trường đại học quốc tế.",
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
    <div className="min-h-screen bg-space-950 text-gray-100 flex relative overflow-x-hidden">
      <AmbientBackground />
      <NoiseOverlay />

      {/* Elastic Collapsible Sidebar */}
      <CollapsibleSidebar className="hidden md:flex" />

      {/* Main Dashboard Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-space-950/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tra cứu bài viết, số tài khoản hoặc link nghi vấn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition-all"
            />
          </form>

          {/* Right Status */}
          <div className="flex items-center gap-3">
            <LiveStudioClock className="hidden sm:inline-flex" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-300 text-xs font-bold shadow-[0_0_15px_rgba(52,231,196,0.2)]">
              {isExpert ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />}
              <span>{trustScore} Điểm Uy Tín</span>
            </div>

            <UserDropdownMenu />
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
          
          {/* Hero Welcome Banner */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-950/40 via-space-900 to-space-950 border border-teal-500/30 overflow-hidden backdrop-blur-2xl shadow-glass-deep">
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold mb-1.5 bg-teal-400/15 border border-teal-400/40 text-teal-300">
                    {isExpert ? "⭐ Chuyên Gia Uy Tín" : "🎓 Sinh Viên Xác Thực"}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Xin chào, {activeProfile.fullName}!
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                    {isExpert
                      ? `${activeProfile.expertTitle || "Chuyên gia Tư vấn"} • ${activeProfile.expertField || "An ninh mạng"}`
                      : `${activeProfile.university || "Đại học Thành viên"} • ${activeProfile.major || "Khoa học & Kỹ thuật"}`}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <TactileButton
                  variant="primary"
                  size="sm"
                  onClick={() => router.push("/scam-check")}
                  icon={ShieldAlert}
                >
                  Quét Nghi Vấn Mới
                </TactileButton>

                <TactileButton
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push("/forum")}
                  icon={MessageSquare}
                >
                  Vào Diễn Đàn
                </TactileButton>
              </div>
            </div>
          </div>

          {/* 3 Core Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: AI Scam Checker */}
            <div
              onClick={() => router.push("/scam-check")}
              className="cursor-pointer group p-6 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-teal-500/30 hover:border-teal-400/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 shadow-glass-deep"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-400/20 text-teal-300 uppercase">
                  Engine 4 Lớp
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors flex items-center justify-between">
                <span>AI Scam Checker</span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Kiểm tra link, text và ảnh chụp OCR qua 4 tầng phân tích với Risk Meter 0-100%.
              </p>
            </div>

            {/* Card 2: Community Forum */}
            <div
              onClick={() => router.push("/forum")}
              className="cursor-pointer group p-6 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-indigo-500/30 hover:border-indigo-400/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 shadow-glass-deep"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-400/20 text-indigo-300 uppercase">
                  Vote Uy Tín
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                <span>Diễn Đàn Xác Thực</span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Thảo luận về Nhà trọ, Quán ăn, Trường học và bình luận có gắn nhãn chuyên gia.
              </p>
            </div>

            {/* Card 3: Profile & Trust Score */}
            <div
              onClick={() => router.push("/profile")}
              className="cursor-pointer group p-6 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-amber-500/30 hover:border-amber-400/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 shadow-glass-deep"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 uppercase">
                  0–100 Điểm
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                <span>Hồ Sơ & Uy Tín</span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Quản lý điểm tín nhiệm, xác thực email trường (.edu = +30đ) và lịch sử cảnh báo.
              </p>
            </div>
          </div>

          {/* Grid Layout: Top Flagged Scams (Left 2/3) + Leaderboard & Stats (Right 1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2/3: Top Flagged Scams in Community */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <h2 className="text-lg font-bold text-white">Top Cảnh Báo Lừa Đảo Nóng Trong Tuần</h2>
                </div>
                <Link
                  href="/forum"
                  className="text-xs font-semibold text-teal-300 hover:text-teal-200 flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-4">
                {TOP_SCAM_ALERTS.map((scam) => (
                  <div
                    key={scam.id}
                    onClick={() => router.push(`/scam-check?prefill=${encodeURIComponent(scam.title)}`)}
                    className="cursor-pointer p-5 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-rose-500/40 backdrop-blur-xl transition-all space-y-3 shadow-glass-deep group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {scam.category} • {scam.riskLevel}
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {scam.time}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                      {scam.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{scam.desc}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-gray-400">
                      <span>Khu vực: <strong className="text-gray-200">{scam.location}</strong></span>
                      <span className="text-teal-300 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Kiểm chứng ngay <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 1/3: Personal Trust Card & Top 5 Leaderboard */}
            <div className="space-y-6">
              
              {/* Personal Trust Score Box */}
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4 shadow-glass-deep">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" /> Trạng Thái Uy Tín Của Bạn
                </h3>

                <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-400">Điểm Uy Tín Hiện Tại</p>
                    <p className="text-3xl font-black text-teal-300 mt-0.5">{trustScore} pts</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      +30đ Email .edu
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">Hạng: Top 10%</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Cơ chế xác thực:</span>
                    <span className="font-semibold text-white">Xác nhận đúng (+1 / +2đ)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Mốc chuyên gia:</span>
                    <span className="font-semibold text-amber-300">80–100 điểm</span>
                  </div>
                </div>
              </div>

              {/* Top 5 Leaderboard */}
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4 shadow-glass-deep">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" /> Top 5 Người Dùng Uy Tín
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {TOP_5_LEADERBOARD.map((user) => (
                    <div
                      key={user.rank}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-white/10 text-gray-200 font-black text-xs flex items-center justify-center shrink-0">
                          #{user.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{user.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{user.field}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-300 shrink-0">
                        {user.score} pts
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
