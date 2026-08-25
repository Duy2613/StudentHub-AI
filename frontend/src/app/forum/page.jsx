"use client";

// app/forum/page.jsx
//
// Diễn đàn cộng đồng sinh viên StudentHub AI (Saffron Finance x Meer Mohsin 3D):
// - WebGL Real-time Fluid Dynamics Canvas theo con trỏ chuột 60fps
// - Quỹ đạo thiên văn 3D Astrolabe & vệ tinh bay quanh chu vi màn hình
// - Saffron Swiss Grid Post Cards viền tóc hairline (#47140b) và dấu chữ thập (+)
// - Hệ thống bình chọn tín nhiệm phi tập trung (Vote Uy tín, Like Hữu ích)

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Plus,
  Filter,
  CheckCircle,
  AlertTriangle,
  Building,
  Utensils,
  Home,
  BookOpen,
  Users,
  Image as ImageIcon,
  Link2,
  X,
  Clock,
  Send,
  Star,
  ShieldCheck,
  Share2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import AvatarDisplay from "@/components/AvatarDisplay";
import TactileButton from "@/components/ui/TactileButton";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMohsinPerimeter3DOrbit from "@/components/ui/SaffronMohsinPerimeter3DOrbit";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";
import SaffronSwissCrosshairGrid from "@/components/ui/SaffronSwissCrosshairGrid";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = [
  { id: "all", label: "Tất Cả", icon: MessageSquare },
  { id: "housing", label: "Nhà Trọ", icon: Home },
  { id: "food", label: "Quán Ăn", icon: Utensils },
  { id: "campus", label: "Trường Học", icon: Building },
  { id: "academic", label: "Ngành Học", icon: BookOpen },
  { id: "club", label: "CLB & Hoạt Động", icon: Users },
];

const INITIAL_POSTS = [
  {
    id: 1,
    title: "Cảnh báo phòng trọ ảo ép cọc tại ngõ 27 Tạ Quang Bửu (gần ĐHBK Hà Nội)",
    category: "housing",
    location: "Hai Bà Trưng, Hà Nội (Gần HUST / NEU)",
    author: "Nguyễn Minh Quân",
    authorRole: "student",
    authorAvatar: "student-tech",
    trustScore: 82,
    time: "20 phút trước",
    content:
      "Có đối tượng đăng tin cho thuê phòng khép kín giá 1.8 triệu đầy đủ điều hòa nóng lạnh nhưng bắt chuyển khoản cọc 1 triệu để 'giữ chỗ không người khác thuê mất'. Mình đến tận ngõ 27 kiểm tra thì số nhà đó không hề cho thuê. Các bạn tân sinh viên cẩn thận nhé!",
    images: ["/assets/scam_room_evidence.jpg"],
    links: ["https://phongtro-fake-sample.com"],
    trustVotes: { reputable: 48, notReputable: 2 },
    likes: 35,
    userVoted: null,
    userLiked: false,
    comments: [
      {
        id: "c1",
        author: "Luật sư Trần Thu Hà",
        role: "expert",
        avatar: "expert-legal",
        trustScore: 98,
        time: "10 phút trước",
        text: "Cảm ơn em đã cảnh báo. Theo quy định pháp luật, giao dịch đặt cọc bắt buộc phải có biên nhận ký tên 2 bên và xác minh quyền sở hữu nhà ở của bên cho thuê.",
      },
      {
        id: "c2",
        author: "Lê Quốc Bảo",
        role: "student",
        avatar: "student-scholar",
        trustScore: 80,
        time: "5 phút trước",
        text: "Suýt nữa mình cũng chuyển cọc cho số tài khoản đó hôm qua. May mà đọc được bài!",
      },
    ],
  },
  {
    id: 2,
    title: "Gợi ý quán cơm trưa sinh viên sạch sẽ, chuẩn vị tại Làng Đại học Thủ Đức",
    category: "food",
    location: "Khu B, ĐHQG TP.HCM (Thủ Đức)",
    author: "Trần Bảo Ngọc",
    authorRole: "student",
    authorAvatar: "student-creative",
    trustScore: 88,
    time: "2 giờ trước",
    content:
      "Quán cơm niêu cô Ba cạnh cổng KTX Khu B bán suất ăn 25k-30k đầy đặn, canh rau miễn phí và cô chủ rất thân thiện với sinh viên. Quán có chứng nhận ATTP treo công khai.",
    images: [],
    links: [],
    trustVotes: { reputable: 62, notReputable: 1 },
    likes: 54,
    userVoted: null,
    userLiked: false,
    comments: [
      {
        id: "c3",
        author: "Hoàng Văn Tuấn",
        role: "student",
        avatar: "student-gamer",
        trustScore: 78,
        time: "1 giờ trước",
        text: "Quán này ăn bao no luôn mọi người, trà đá miễn phí nữa!",
      },
    ],
  },
];

export default function ForumPage() {
  const router = useRouter();
  const { session, profile } = useAuth();

  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState("reputable"); // 'reputable' | 'newest' | 'hot'

  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("housing");
  const [newLocation, setNewLocation] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLink, setNewLink] = useState("");

  const [commentInputs, setCommentInputs] = useState({});

  // Prefill from URL query (if redirected from Scam-Check)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get("prefill");
      if (prefill) {
        setIsNewPostModalOpen(true);
        setNewTitle(prefill);
        setNewCategory("housing");
      }
    }
  }, []);

  // Filtered and Sorted Posts
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const matchesCategory =
          selectedCategory === "all" || post.category === selectedCategory;

        const matchesSearch =
          !searchQuery.trim() ||
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLocation =
          !locationFilter.trim() ||
          post.location.toLowerCase().includes(locationFilter.toLowerCase());

        return matchesCategory && matchesSearch && matchesLocation;
      })
      .sort((a, b) => {
        if (sortBy === "reputable") {
          const ratioA = a.trustVotes.reputable / (a.trustVotes.reputable + a.trustVotes.notReputable || 1);
          const ratioB = b.trustVotes.reputable / (b.trustVotes.reputable + b.trustVotes.notReputable || 1);
          return ratioB - ratioA;
        }
        if (sortBy === "hot") {
          return b.likes - a.likes;
        }
        return b.id - a.id;
      });
  }, [posts, selectedCategory, searchQuery, locationFilter, sortBy]);

  // Vote Reputable / Not Reputable
  const handleVote = (postId, voteType) => {
    saffronAudio.playClick(700);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const currentVote = p.userVoted;
        let newRep = p.trustVotes.reputable;
        let newNot = p.trustVotes.notReputable;

        if (currentVote === voteType) {
          if (voteType === "reputable") newRep -= 1;
          if (voteType === "notReputable") newNot -= 1;
          return {
            ...p,
            userVoted: null,
            trustVotes: { reputable: Math.max(0, newRep), notReputable: Math.max(0, newNot) },
          };
        }

        if (currentVote === "reputable") newRep -= 1;
        if (currentVote === "notReputable") newNot -= 1;

        if (voteType === "reputable") newRep += 1;
        if (voteType === "notReputable") newNot += 1;

        return {
          ...p,
          userVoted: voteType,
          trustVotes: { reputable: newRep, notReputable: newNot },
        };
      })
    );
  };

  // Like "Hữu ích"
  const handleLike = (postId) => {
    saffronAudio.playClick(600);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const newLiked = !p.userLiked;
        return {
          ...p,
          userLiked: newLiked,
          likes: newLiked ? p.likes + 1 : p.likes - 1,
        };
      })
    );
  };

  // Submit Comment
  const handleAddComment = (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    saffronAudio.playClick(800);
    const isExpert = profile?.role === "expert";

    const newComment = {
      id: `c_${Date.now()}`,
      author: profile?.fullName || session?.user?.email?.split("@")[0] || "Bạn",
      role: isExpert ? "expert" : "student",
      avatar: profile?.avatarId || (isExpert ? "expert-ai" : "student-tech"),
      trustScore: profile?.trustScore || (isExpert ? 98 : 80),
      time: "Vừa xong",
      text: text,
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [...p.comments, newComment],
        };
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  // Create New Post
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    saffronAudio.playSuccessChime();
    const isExpert = profile?.role === "expert";

    const created = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      location: newLocation || "Toàn quốc",
      author: profile?.fullName || session?.user?.email?.split("@")[0] || "Sinh viên StudentHub",
      authorRole: isExpert ? "expert" : "student",
      authorAvatar: profile?.avatarId || (isExpert ? "expert-ai" : "student-tech"),
      trustScore: profile?.trustScore || (isExpert ? 98 : 80),
      time: "Vừa xong",
      content: newContent,
      images: [],
      links: newLink ? [newLink] : [],
      trustVotes: { reputable: 1, notReputable: 0 },
      likes: 0,
      userVoted: "reputable",
      userLiked: false,
      comments: [],
    };

    setPosts([created, ...posts]);
    setIsNewPostModalOpen(false);
    setNewTitle("");
    setNewContent("");
    setNewLocation("");
    setNewLink("");
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. 3D Infinite Highway Canvas */}
      <div className="canvas-bg-layer">
        <RobinPayotRoadCanvas />
      </div>

      {/* 2. Meer Mohsin WebGL Fluid Smoke Canvas */}
      <MohsinFluidCanvas opacity={0.6} particleDensity={45} />

      {/* 3. 3D Astrolabe Orbit & Perimeter Satellites */}
      <SaffronMohsinPerimeter3DOrbit />

      {/* 4. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 5. Floating Quick Tools & Studio */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* Sidebar or Modern Navbar */}
      {session ? (
        <CollapsibleSidebar className="hidden md:flex relative z-40" />
      ) : (
        <header className="overlay-nav-layer">
          <ModernNavbar />
        </header>
      )}

      {/* Main Container */}
      <main className="flex-1 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 min-w-0 font-human">
        
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]" />

        {/* Header & Create Post Button */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09] text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
              <span>COMMUNITY DAO // PEER-REVIEWED FEED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">Chia Sẻ &amp; Cảnh Báo</span> Sinh Viên
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Thảo luận thực chứng về Nhà trọ, Quán ăn, Cảnh báo lừa đảo và Môi trường học đường với hệ thống bình chọn tín nhiệm phi tập trung.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
            <button
              type="button"
              onClick={() => {
                saffronAudio.playClick(600);
                setIsNewPostModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,188,9,0.35)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>ĐĂNG BÀI MỚI [DAO]</span>
            </button>
          </div>
        </div>

        {/* Search & Location Filter Bar */}
        <SaffronSwissCrosshairGrid sectionTag="01 // FILTER_CONSOLE" className="mb-6 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ffbc09]" />
              <input
                type="text"
                placeholder="Tìm kiếm từ khóa bài viết, cảnh báo lừa đảo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-[#ece7e0] placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] transition-all font-human"
              />
            </div>

            <div className="sm:col-span-4 relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38bdf8]" />
              <input
                type="text"
                placeholder="Lọc địa điểm (Quận, tên trường...)"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-[#ece7e0] placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] transition-all font-human"
              />
            </div>

            <div className="sm:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  saffronAudio.playClick(500);
                  setSortBy(e.target.value);
                }}
                className="w-full px-3 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09] font-mono cursor-pointer"
              >
                <option value="reputable">Ưu tiên Uy Tín Cao</option>
                <option value="newest">Mới nhất</option>
                <option value="hot">Nhiều lượt Like</option>
              </select>
            </div>
          </div>
        </SaffronSwissCrosshairGrid>

        {/* Category Horizontal Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none select-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  saffronAudio.playClick(500);
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] shadow-[0_0_20px_rgba(255,188,9,0.35)]"
                    : "bg-[#210a07] hover:bg-[#2f0e09] text-[#ece7e0]/70 border border-[#47140b]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Post Feed List */}
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#150604]/90 border border-[#47140b] space-y-3">
              <MessageSquare className="w-10 h-10 text-[#ffbc09]/50 mx-auto" />
              <p className="text-white font-bold text-base">Chưa có bài viết nào phù hợp.</p>
              <p className="text-xs text-[#ece7e0]/60">Hãy là người đầu tiên đăng bài chia sẻ hoặc cảnh báo trong khu vực này.</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const repRatio = Math.round(
                (post.trustVotes.reputable /
                  (post.trustVotes.reputable + post.trustVotes.notReputable || 1)) *
                  100
              );

              return (
                <article
                  key={post.id}
                  className="rounded-3xl bg-[#150604]/90 border border-[#47140b] hover:border-[#ffbc09]/50 p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.7)] relative"
                >
                  {/* Subtle corner crosshairs (+) */}
                  <span className="absolute top-2.5 left-3 text-[#ffbc09]/40 font-mono text-[10px] select-none">+</span>
                  <span className="absolute top-2.5 right-3 text-[#ffbc09]/40 font-mono text-[10px] select-none">+</span>

                  {/* Top Author Bar */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AvatarDisplay
                        avatarId={post.authorAvatar}
                        role={post.authorRole}
                        size="md"
                        showBadge={true}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-human">{post.author}</span>
                          <span className="text-[10px] font-mono text-[#ffbc09] font-bold px-1.5 py-0.2 rounded bg-[#ffbc09]/15 border border-[#ffbc09]/30">
                            {post.trustScore} PTS
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#ece7e0]/60 mt-0.5">
                          <span className="flex items-center gap-1 font-mono text-[#38bdf8]">
                            <MapPin className="w-3 h-3" /> {post.location}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{post.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Trust Rating Badge */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#210a07] border border-[#ffbc09]/40 text-[#ffbc09] text-xs font-mono font-bold shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{repRatio}% UY TÍN</span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Content */}
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-[#ece7e0]/85 leading-relaxed font-human">
                      {post.content}
                    </p>
                  </div>

                  {/* Links */}
                  {post.links && post.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {post.links.map((lnk, idx) => (
                        <a
                          key={idx}
                          href={lnk}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#210a07] border border-[#47140b] text-[11px] font-mono text-[#38bdf8] hover:border-[#ffbc09] transition-all truncate max-w-sm"
                        >
                          <Link2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{lnk}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Interactive Vote & Like Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#47140b] select-none">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, "reputable")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          post.userVoted === "reputable"
                            ? "bg-[#ffbc09] text-[#150604] shadow-[0_0_15px_rgba(255,188,9,0.4)]"
                            : "bg-[#210a07] hover:bg-[#2f0e09] text-[#ece7e0]/80 border border-[#47140b]"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Uy Tín ({post.trustVotes.reputable})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVote(post.id, "notReputable")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          post.userVoted === "notReputable"
                            ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                            : "bg-[#210a07] hover:bg-[#2f0e09] text-[#ece7e0]/80 border border-[#47140b]"
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Nghi Vấn ({post.trustVotes.notReputable})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          post.userLiked
                            ? "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                            : "bg-[#210a07] hover:bg-[#2f0e09] text-[#ece7e0]/70 border border-[#47140b]"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.userLiked ? "fill-rose-400 text-rose-400" : ""}`} />
                        <span>Hữu ích ({post.likes})</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="pt-3 border-t border-[#47140b] space-y-3">
                    {post.comments.map((cm) => (
                      <div
                        key={cm.id}
                        className={`p-3 rounded-2xl border text-xs space-y-1 ${
                          cm.role === "expert"
                            ? "bg-[#210a07] border-[#ffbc09]/40"
                            : "bg-[#150604]/60 border-[#47140b]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{cm.author}</span>
                            {cm.role === "expert" && (
                              <span className="px-2 py-0.2 rounded-full bg-[#ffbc09]/20 text-[#ffbc09] text-[9px] font-mono font-extrabold flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-[#ffbc09] text-[#ffbc09]" /> Cố Vấn Uy Tín ({cm.trustScore} pts)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#ece7e0]/40 font-mono">{cm.time}</span>
                        </div>
                        <p className="text-[#ece7e0]/85 leading-relaxed">{cm.text}</p>
                      </div>
                    ))}

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Viết nhận định hoặc cung cấp thêm bằng chứng..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                        className="flex-1 px-4 py-2 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        className="p-2 rounded-xl bg-[#ffbc09] text-[#150604] font-bold hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Modal Create Post */}
        {isNewPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d0403]/85 backdrop-blur-xl overflow-y-auto">
            <div className="w-full max-w-xl bg-[#150604] border border-[#47140b] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 font-human">
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#ffbc09]" /> Đăng Bài Chia Sẻ / Cảnh Báo
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(400);
                    setIsNewPostModalOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] text-[#ece7e0]/70 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5">
                    Tiêu đề bài viết
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cảnh báo chiêu trò lừa cọc phòng trọ ngõ 27 Tạ Quang Bửu..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-sm text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5">
                      Danh mục
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                    >
                      <option value="housing">Nhà Trọ</option>
                      <option value="food">Quán Ăn</option>
                      <option value="campus">Trường Học</option>
                      <option value="academic">Ngành Học</option>
                      <option value="club">CLB & Hoạt Động</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5">
                      Địa điểm / Khu vực trường
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Cầu Giấy, Hà Nội hoặc ĐH Bách Khoa"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5">
                    Nội dung chi tiết &amp; Bằng chứng
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Mô tả cụ thể sự việc, thủ đoạn, bằng chứng hoặc lời khuyên cho cộng đồng..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full p-4 rounded-xl bg-[#210a07] border border-[#47140b] text-xs sm:text-sm text-[#ece7e0] focus:outline-none focus:border-[#ffbc09] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5">
                    Link tham khảo / Bài đăng gốc (Tùy chọn)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#47140b]">
                  <button
                    type="button"
                    onClick={() => {
                      saffronAudio.playClick(400);
                      setIsNewPostModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#ece7e0]/60 hover:text-white cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer font-mono"
                  >
                    Đăng Bài Xác Thực
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
