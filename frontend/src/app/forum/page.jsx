"use client";

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
import AeroMissionControlBackdrop from "@/components/ui/AeroMissionControlBackdrop";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
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
      {/* 1. High-End Aerospace Aviation Terminal Backdrop (Clean & Non-overlapping) */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_07_BETA // COMMUNITY_INTELLIGENCE"
        gridDensity={52}
        showRadarRings={false}
      />

      {/* 2. Interactive WebGL Fluid Smoke Trail */}
      <MohsinFluidCanvas opacity={0.35} particleDensity={35} />

      {/* 3. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 4. Floating Quick Tools & Studio */}
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

      {/* Main Container (Pristine Vertical Flow) */}
      <main className="flex-1 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 min-w-0 font-human">
        
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]/60" />

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
                placeholder="Lọc theo khu vực (Thủ Đức, Cầu Giấy...)"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-[#ece7e0] placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#38bdf8] transition-all font-human"
              />
            </div>

            <div className="sm:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  saffronAudio.playClick(500);
                  setSortBy(e.target.value);
                }}
                className="w-full py-2.5 px-3 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09] transition-all font-mono font-semibold cursor-pointer"
              >
                <option value="reputable">⭐ Uy Tín Nhất</option>
                <option value="newest">🕒 Mới Nhất</option>
                <option value="hot">🔥 Nổi Bật</option>
              </select>
            </div>
          </div>
        </SaffronSwissCrosshairGrid>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  saffronAudio.playClick(650);
                  setSelectedCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#ffbc09] text-[#150604] border-[#ffbc09] shadow-[0_0_20px_rgba(255,188,9,0.3)] scale-105"
                    : "bg-[#150604]/80 text-[#ece7e0]/70 border-[#47140b] hover:border-[#ffbc09]/50 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Posts Feed Grid */}
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#150604]/90 border border-[#47140b] space-y-3">
              <AlertTriangle className="w-10 h-10 text-[#ffbc09] mx-auto opacity-60" />
              <p className="text-sm font-bold text-white">Không tìm thấy bài viết nào phù hợp</p>
              <p className="text-xs text-[#ece7e0]/60">Hãy thử thay đổi từ khóa tìm kiếm hoặc danh mục.</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const totalVotes = post.trustVotes.reputable + post.trustVotes.notReputable;
              const repPercent = totalVotes > 0 ? Math.round((post.trustVotes.reputable / totalVotes) * 100) : 100;

              return (
                <article
                  key={post.id}
                  className="p-6 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl shadow-xl space-y-4 hover:border-[#ffbc09]/40 transition-all group"
                >
                  {/* Author Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#47140b]/60">
                    <div className="flex items-center gap-3">
                      <AvatarDisplay avatarId={post.authorAvatar} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{post.author}</span>
                          {post.authorRole === "expert" && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ffbc09]/20 text-[#ffbc09] text-[10px] font-mono font-bold border border-[#ffbc09]/40">
                              ⭐ CHUYÊN GIA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#ece7e0]/60 font-mono mt-0.5">
                          <span>{post.time}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#38bdf8]">
                            <MapPin className="w-3 h-3" />
                            {post.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trust Gauge Pill */}
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-[#47140b] text-xs font-mono">
                      <span className="text-[#ece7e0]/60 text-[10px]">TÍN NHIỆM DAO:</span>
                      <span className={`font-bold ${repPercent >= 80 ? "text-emerald-400" : repPercent >= 50 ? "text-[#ffbc09]" : "text-rose-400"}`}>
                        {repPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Post Title & Content */}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-[#ffd15c] transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 leading-relaxed whitespace-pre-line font-human">
                      {post.content}
                    </p>
                  </div>

                  {/* Attached Links / Images (if any) */}
                  {post.links && post.links.length > 0 && (
                    <div className="p-3 rounded-2xl bg-black/40 border border-[#47140b] flex items-center gap-2 text-xs font-mono text-[#38bdf8] overflow-hidden">
                      <Link2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{post.links[0]}</span>
                    </div>
                  )}

                  {/* Vote & Comment Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#47140b]/60">
                    <div className="flex items-center gap-2">
                      {/* Reputable Vote Button */}
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, "reputable")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          post.userVoted === "reputable"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                            : "bg-[#210a07] text-[#ece7e0]/70 border-[#47140b] hover:border-emerald-500/40 hover:text-white"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Uy Tín ({post.trustVotes.reputable})</span>
                      </button>

                      {/* Not Reputable Vote Button */}
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, "notReputable")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          post.userVoted === "notReputable"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                            : "bg-[#210a07] text-[#ece7e0]/70 border-[#47140b] hover:border-rose-500/40 hover:text-white"
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Khả Nghi ({post.trustVotes.notReputable})</span>
                      </button>

                      {/* Helpful Heart Button */}
                      <button
                        type="button"
                        onClick={() => handleLike(post.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          post.userLiked
                            ? "bg-[#ea3810]/20 text-[#ea3810] border-[#ea3810]/50"
                            : "bg-[#210a07] text-[#ece7e0]/70 border-[#47140b] hover:border-[#ea3810]/40 hover:text-white"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.userLiked ? "fill-current" : ""}`} />
                        <span>{post.likes}</span>
                      </button>
                    </div>

                    <div className="text-xs font-mono text-[#ece7e0]/60 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.comments.length} Bình luận</span>
                    </div>
                  </div>

                  {/* Comments Thread Section */}
                  {post.comments.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {post.comments.map((comm) => (
                        <div
                          key={comm.id}
                          className="p-3 rounded-2xl bg-black/40 border border-[#2d0d08] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              {comm.author}
                              {comm.role === "expert" && (
                                <span className="text-[#ffbc09] text-[10px] font-mono">⭐ Cố vấn</span>
                              )}
                            </span>
                            <span className="text-[#ece7e0]/40 font-mono">{comm.time}</span>
                          </div>
                          <p className="text-[#ece7e0]/80 leading-relaxed font-human">{comm.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input Bar */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Viết phản hồi hoặc chia sẻ thực chứng của bạn..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                      className="flex-1 px-4 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-[#ece7e0] placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] transition-all font-human"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      className="p-2 rounded-xl bg-[#ffbc09] text-[#150604] hover:bg-[#ffd15c] transition-all cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      {/* CREATE NEW POST MODAL */}
      <AnimatePresence>
        {isNewPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl p-6 rounded-3xl bg-[#150604] border border-[#ffbc09]/50 shadow-2xl space-y-4 font-human"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbc09] animate-ping" />
                  <h3 className="text-base font-bold text-white font-mono">ĐĂNG BÀI MỚI // DAO COMMUNITY</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="p-1 rounded-lg text-[#ece7e0]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                    TIÊU ĐỀ BÀI VIẾT (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cảnh báo lừa đảo đặt cọc phòng trọ tại..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                      DANH MỤC (*)
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09] font-mono"
                    >
                      <option value="housing">🏠 Nhà Trọ</option>
                      <option value="food">🍲 Quán Ăn</option>
                      <option value="campus">🏫 Trường Học</option>
                      <option value="academic">📚 Ngành Học</option>
                      <option value="club">👥 CLB &amp; Hoạt Động</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                      KHU VỰC / TỌA ĐỘ
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Cầu Giấy, Hà Nội..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                    NỘI DUNG CHI TIẾT (*)
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Mô tả cụ thể sự việc, số điện thoại hoặc tài khoản nghi vấn..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                    LINK LIÊN QUAN / CHỨNG THỰC (TÙY CHỌN)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewPostModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-transparent border border-[#47140b] text-xs font-mono font-bold text-[#ece7e0]/70 hover:text-white cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#ffbc09] hover:bg-[#ffd15c] text-[#150604] text-xs font-mono font-bold uppercase shadow-md cursor-pointer transition-all hover:scale-105"
                  >
                    ĐĂNG BÀI LÊN DIỄN ĐÀN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
