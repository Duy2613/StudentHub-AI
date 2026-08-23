"use client";

// app/dashboard/page.jsx
//
// Bảng điều khiển trung tâm (Dashboard) của StudentHub AI:
// Hỗ trợ cả giao diện và tính năng riêng cho Sinh viên & Chuyên gia uy tín.

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  GraduationCap,
  Award,
  BookOpen,
  MessageSquare,
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
  ShieldCheck,
  ChevronRight,
  Lightbulb,
  Sliders,
} from "lucide-react";

import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import UserDropdownMenu from "@/components/auth/UserDropdownMenu";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";
import { AVATAR_LIST } from "@/lib/avatars";
import LiveStudioClock from "@/components/ui/live-studio-clock";
import CreativeShaderCanvas from "@/components/ui/creative-shader-canvas";

export default function DashboardPage() {
  const router = useRouter();
  const { session, profile, signOut, isLoading } = useAuth();

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, questions, experts, resources

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
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="font-medium text-gray-400">Đang tải StudentHub AI Dashboard...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center text-gray-300 px-4">
        <div className="p-8 rounded-3xl bg-space-900/80 border border-white/10 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-xs text-gray-400 mb-6">
            Bạn cần đăng nhập để truy cập vào Bảng điều khiển học tập và mạng lưới chuyên gia.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-neon-primary hover:brightness-110 transition-all"
          >
            Đăng Nhập Ngay
          </button>
        </div>
      </div>
    );
  }

  const activeProfile = profile || {
    id: session?.user?.id || "usr-1",
    fullName: session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Thành viên StudentHub",
    role: session?.user?.user_metadata?.role || "student",
    avatarId: "student-tech",
    trustScore: 80,
    badges: ["🎓 Sinh Viên"],
    questionsCount: 0,
    answersCount: 0,
    university: "Đại học Thành viên",
    major: "Khoa học & Kỹ thuật",
    academicYear: "2024 - 2028",
  };

  const isExpert = activeProfile.role === "expert";


  // Mock sample experts
  const SAMPLE_EXPERTS = [
    {
      id: "expert-1",
      name: "TS. Nguyễn Minh Đức",
      title: "Chuyên gia AI & Deep Learning",
      field: "Trí tuệ nhân tạo (AI/ML)",
      rating: 4.98,
      reviewsCount: 142,
      answersCount: 380,
      avatarId: "expert-ai",
      trustScore: 99,
      badge: "⭐ Chuyên Gia Uy Tín",
    },
    {
      id: "expert-2",
      name: "ThS. Trần Hoàng Nam",
      title: "Kiến trúc sư Phần mềm (Tech Lead)",
      field: "Kỹ thuật phần mềm & Cloud",
      rating: 4.95,
      reviewsCount: 98,
      answersCount: 245,
      avatarId: "expert-architect",
      trustScore: 97,
      badge: "⭐ Chuyên Gia Uy Tín",
    },
    {
      id: "expert-3",
      name: "PGS. Lê Thu Hà",
      title: "Giảng viên Cao cấp / Cố vấn Học thuật",
      field: "Khoa học Dữ liệu & Giải thuật",
      rating: 4.92,
      reviewsCount: 116,
      answersCount: 310,
      avatarId: "expert-professor",
      trustScore: 98,
      badge: "⭐ Chuyên Gia Uy Tín",
    },
  ];

  // Mock Q&A posts
  const SAMPLE_QUESTIONS = [
    {
      id: 1,
      title: "Làm sao để tối ưu hóa truy vấn SQL trong cơ sở dữ liệu lớn (>10 triệu bản ghi)?",
      author: "Lê Quốc Bảo",
      university: "Đại học Bách Khoa Hà Nội",
      avatarId: "student-tech",
      tags: ["Database", "SQL", "Optimization"],
      votes: 34,
      answers: 5,
      hasExpertAnswer: true,
      time: "10 phút trước",
    },
    {
      id: 2,
      title: "Giải thích sự khác biệt giữa Supervised Learning và Reinforcement Learning với ví dụ thực tế?",
      author: "Nguyễn Thảo Vy",
      university: "Đại học Công nghệ thông tin (UIT)",
      avatarId: "student-ai",
      tags: ["AI", "Machine Learning", "Data"],
      votes: 42,
      answers: 8,
      hasExpertAnswer: true,
      time: "25 phút trước",
    },
    {
      id: 3,
      title: "Cách cấu hình Next.js App Router với Supabase Auth khi deploy lên Vercel?",
      author: "Phạm Hữu Đạt",
      university: "Đại học FPT",
      avatarId: "student-explorer",
      tags: ["Next.js", "React", "Supabase"],
      votes: 28,
      answers: 3,
      hasExpertAnswer: false,
      time: "1 giờ trước",
    },
  ];

  // Sample quick prompt click
  const handleQuickPrompt = (promptText) => {
    setAiPrompt(promptText);
    handleAskAi(promptText);
  };

  const handleAskAi = async (customText = null) => {
    const textToSend = customText || aiPrompt;
    if (!textToSend.trim() || isAiGenerating) return;

    setIsAiGenerating(true);
    setAiResponse(null);

    setTimeout(() => {
      let mockReply = "";
      if (textToSend.toLowerCase().includes("sql") || textToSend.toLowerCase().includes("database")) {
        mockReply = `🤖 **StudentHub AI Giải đáp:** Để tối ưu hóa truy vấn SQL lớn:\n1. **Tạo Index hợp lý:** Đánh Composite Index trên các trường WHERE và JOIN thường xuyên.\n2. **Tránh SELECT *:** Chỉ SELECT đúng các cột cần dùng để giảm tải I/O bộ nhớ.\n3. **Sử dụng EXPLAIN ANALYZE:** Kiểm tra Query Plan để phát hiện Sequential Scan.\n4. **Phân vùng bảng (Partitioning):** Chia nhỏ bảng theo khoảng thời gian hoặc ID.`;
      } else if (textToSend.toLowerCase().includes("ai") || textToSend.toLowerCase().includes("machine learning")) {
        mockReply = `🤖 **StudentHub AI Giải đáp:**\n- **Supervised Learning (Học có giám sát):** Huấn luyện mô hình trên dữ liệu đã gán nhãn (ví dụ: Phân loại email Spam/Not Spam).\n- **Reinforcement Learning (Học tăng cường):** Agent tự học thông qua thử-sai trong môi trường, tối đa hóa phần thưởng (Reward) nhận được (ví dụ: AlphaGo, Xe tự hành).`;
      } else {
        mockReply = `🤖 **StudentHub AI Trợ Giảng:** Cảm ơn câu hỏi của bạn: "${textToSend}"!\n\n💡 **Gợi ý phương pháp tiếp cận:**\n- Bước 1: Nắm vững khái niệm nền tảng và nguyên lý cốt lõi.\n- Bước 2: Thực hành qua ví dụ code hoặc bài tập thực tế tương tự.\n- Bước 3: Bạn cũng có thể gửi câu hỏi này đến các **Chuyên gia uy tín** của StudentHub AI để nhận phản hồi chuyên sâu 1-1!`;
      }
      setAiResponse(mockReply);
      setIsAiGenerating(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col relative overflow-x-hidden">
      <AmbientBackground />
      <NoiseOverlay />

      {/* ---------------- TOP NAVBAR ---------------- */}
      <header className="sticky top-0 z-40 bg-space-950/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-200">
                StudentHub<span className="text-indigo-400">.AI</span>
              </span>
              <span className="hidden sm:block text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                Nền tảng Học tập & Chuyên gia Uy tín
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm câu hỏi, tài liệu, chuyên gia hoặc hỏi AI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          {/* Right User Status & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Studio Clock */}
            <div className="hidden lg:block">
              <LiveStudioClock />
            </div>

            {/* Trust Score Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold backdrop-blur-md ${
                isExpert
                  ? "bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "bg-indigo-500/15 border-indigo-400/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              }`}
            >
              {isExpert ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{activeProfile.trustScore} Điểm Uy Tín</span>
            </div>

            {/* Profile Avatar Popover Menu */}
            <UserDropdownMenu />
          </div>
        </div>
      </header>


      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 relative z-10">
        {/* 1. HERO BANNER CÁ NHÂN HÓA */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 border overflow-hidden backdrop-blur-2xl shadow-glass-deep ${
            isExpert
              ? "bg-gradient-to-r from-amber-950/40 via-space-900 to-space-950 border-amber-500/30"
              : "bg-gradient-to-r from-indigo-950/40 via-space-900 to-space-950 border-indigo-500/30"
          }`}
        >
          {/* Creative Shader Wave inside Dashboard Banner */}
          <CreativeShaderCanvas mode={isExpert ? "amber-dust" : "cosmic-wave"} opacity={0.45} />
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/20 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <AvatarDisplay
                avatarId={activeProfile.avatarId}
                avatarUrl={activeProfile.avatarUrl}
                role={activeProfile.role}
                size="lg"
                showBadge={true}
              />
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border backdrop-blur-md"
                  style={{
                    background: isExpert ? "rgba(245, 158, 11, 0.2)" : "rgba(99, 102, 241, 0.2)",
                    borderColor: isExpert ? "rgba(245, 158, 11, 0.5)" : "rgba(99, 102, 241, 0.5)",
                    color: isExpert ? "#fde68a" : "#c7d2fe",
                  }}
                >
                  {isExpert ? "⭐ Chuyên Gia Uy Tín Được Xác Thực" : "🎓 Sinh Viên Xác Thực"}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Xin chào, {activeProfile.fullName}!
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
                  {isExpert
                    ? `${activeProfile.expertTitle || "Chuyên gia Tư vấn"} • ${activeProfile.expertField || "Trí tuệ nhân tạo"} • ${activeProfile.experienceYears || "3+ năm"}`
                    : `${activeProfile.university || "Đại học Thành viên"} • ${activeProfile.major || "Kỹ thuật"} • ${activeProfile.academicYear || "2024 - 2028"}`}
                </p>
              </div>
            </div>


            {/* Quick Banner Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all hover:scale-102"
              >
                <User className="w-4 h-4" /> Xem Hồ sơ cá nhân
              </button>
              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-102"
              >
                <Settings className="w-4 h-4" /> Đổi Avatar & Vai trò
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- PRO VIP TRINITY SUITE ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: AI Mentor Space */}
          <div
            onClick={() => router.push("/ai-mentor")}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-indigo-950/40 via-space-900 to-space-950 border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 cursor-pointer shadow-glass-deep hover:-translate-y-1 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Socratic AI 2.0
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
              <span>AI Mentor Space</span>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Trò chuyện giải trình đa bước, phân tích thuật toán, giải toán LaTeX và lộ trình học tập chuyên sâu.
            </p>
          </div>

          {/* Card 2: Notion-style Workspace */}
          <div
            onClick={() => router.push("/workspace")}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-purple-950/40 via-space-900 to-space-950 border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 cursor-pointer shadow-glass-deep hover:-translate-y-1 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                Notion Editor
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors flex items-center justify-between">
              <span>Study Workspace</span>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Soạn thảo ghi chú học thuật chuẩn Markdown, lưu trữ tài liệu đồ án, nhúng bảng biểu và xuất file PDF.
            </p>
          </div>

          {/* Card 3: Interactive Whiteboard */}
          <div
            onClick={() => router.push("/whiteboard")}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-cyan-950/40 via-space-900 to-space-950 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 cursor-pointer shadow-glass-deep hover:-translate-y-1 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                Tldraw Infinite
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
              <span>Digital Whiteboard</span>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Bảng vẽ vô tận mô hình hóa sơ đồ kiến trúc, giải bài tập kỹ thuật số và phối hợp học nhóm trực quan.
            </p>
          </div>
        </div>


        {/* 2. STUDENTHUB AI COPILOT INTERACTIVE ASK BAR */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-glass-deep space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Trợ Lý AI Học Tập & Nghiên Cứu
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold uppercase">
                    24/7 AI Engine
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Hỏi bài tập, tóm tắt giáo trình, giải thích kiến thức hoặc tạo lộ trình ôn thi
                </p>
              </div>
            </div>
          </div>

          {/* AI Input */}
          <div className="relative">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
              placeholder="Nhập câu hỏi học tập, giải mã thuật toán hoặc thắc mắc của bạn..."
              className="w-full pl-5 pr-28 py-4 bg-white/5 border border-white/15 rounded-2xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
            />
            <button
              type="button"
              onClick={() => handleAskAi()}
              disabled={isAiGenerating || !aiPrompt.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAiGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Gửi AI</span> <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Gợi ý câu hỏi:
            </span>
            {[
              "Tối ưu truy vấn SQL cơ sở dữ liệu lớn",
              "Sự khác biệt Supervised vs Reinforcement Learning",
              "Cấu hình Next.js App Router với Supabase",
              "Lộ trình học AI/ML cho sinh viên 2026",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleQuickPrompt(chip)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-indigo-300 hover:text-white transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* AI Response Box */}
          {aiResponse && (
            <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-sm text-gray-200 whitespace-pre-line animate-in fade-in slide-in-from-top-2 duration-300">
              {aiResponse}
            </div>
          )}
        </div>

        {/* 3. GÓC CHUYÊN GIA UY TÍN (VERIFIED EXPERT SHOWCASE) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Award className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-bold text-white">Chuyên Gia Uy Tín Hàng Đầu</h3>
            </div>
            <button
              type="button"
              onClick={() => router.push("/profile/expert-1")}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
            >
              Xem tất cả chuyên gia <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SAMPLE_EXPERTS.map((exp) => (
              <div
                key={exp.id}
                onClick={() => router.push(`/profile/${exp.id}`)}
                className="group cursor-pointer relative bg-white/[0.03] hover:bg-white/[0.07] border border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-neon-gold"
              >
                <div className="flex items-start justify-between mb-4">
                  <AvatarDisplay
                    avatarId={exp.avatarId}
                    role="expert"
                    size="md"
                    showBadge={true}
                  />
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{exp.rating}</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                  {exp.name}
                </h4>
                <p className="text-xs text-amber-400/90 font-medium mt-0.5">{exp.title}</p>
                <p className="text-xs text-gray-400 mt-2 line-clamp-1">{exp.field}</p>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                  <span>{exp.answersCount} câu giải đáp</span>
                  <span className="text-amber-300 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Hỏi chuyên gia <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. DIỄN ĐÀN HỎI ĐÁP & BẢNG XẾP HẠNG */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột Trái: Danh sách câu hỏi cộng đồng (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Câu Hỏi & Thảo Luận Mới Nhất</h3>
              </div>
              <button
                type="button"
                onClick={() => handleQuickPrompt("Đặt câu hỏi mới")}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                + Đặt câu hỏi
              </button>
            </div>

            <div className="space-y-4">
              {SAMPLE_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <AvatarDisplay
                        avatarId={q.avatarId}
                        role="student"
                        size="xs"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-200">{q.author}</span>
                        <span className="text-[10px] text-gray-400 ml-2">({q.university})</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {q.time}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-semibold text-white hover:text-indigo-300 cursor-pointer transition-colors">
                    {q.title}
                  </h4>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                    <div className="flex items-center gap-1.5">
                      {q.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-gray-400">
                      <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                        ▲ {q.votes} Vote
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {q.answers} Trả lời
                      </span>
                      {q.hasExpertAnswer && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-amber-400" /> Đã có lời giải chuyên gia
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột Phải: Thống kê & Bảng xếp hạng (1/3) */}
          <div className="space-y-6">
            {/* Thẻ Uy Tín của Tôi */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Trạng thái Uy Tín
              </h4>
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Điểm Uy Tín Hiện Tại</p>
                  <p className="text-2xl font-black text-indigo-300 mt-0.5">{activeProfile.trustScore} pts</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-400 font-semibold">+30 Điểm Xác thực</p>
                  <p className="text-[10px] text-gray-400">Hạng: Top 15%</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center justify-between">
                  <span className="text-gray-400">Câu hỏi đã đăng:</span>
                  <span className="font-semibold text-white">{activeProfile.questionsCount}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-400">Câu trả lời hữu ích:</span>
                  <span className="font-semibold text-white">{activeProfile.answersCount}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-400">Huy hiệu đạt được:</span>
                  <span className="font-semibold text-indigo-300">{activeProfile.badges?.length || 2}</span>
                </li>
              </ul>

            </div>

            {/* Top Leaderboard */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" /> Bảng Xếp Hạng Tuần
              </h4>
              <div className="space-y-3">
                {[
                  { rank: 1, name: "TS. Nguyễn Minh Đức", score: "990 pts", role: "Chuyên gia", medal: "🥇" },
                  { rank: 2, name: "Lê Quốc Bảo (HUST)", score: "620 pts", role: "Sinh viên", medal: "🥈" },
                  { rank: 3, name: "ThS. Trần Hoàng Nam", score: "580 pts", role: "Chuyên gia", medal: "🥉" },
                ].map((item) => (
                  <div
                    key={item.rank}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.medal}</span>
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-gray-400">{item.role}</p>
                      </div>
                    </div>
                    <span className="font-black text-amber-300">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
