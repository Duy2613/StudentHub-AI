"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Plus,
  Building,
  Utensils,
  Home,
  Link2,
  X,
  Clock,
  Send,
  Star,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import AvatarDisplay from "@/components/AvatarDisplay";
import AeroMissionControlBackdrop from "@/components/ui/AeroMissionControlBackdrop";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";
import SaffronSwissCrosshairGrid from "@/components/ui/SaffronSwissCrosshairGrid";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { safeExternalUrl } from "@/lib/security/safeExternalUrl";
import { motion, AnimatePresence } from "motion/react";

const FORUM_CATEGORIES = [
  { id: "all", label: "Tất Cả", icon: MessageSquare },
  { id: "truong_hoc", label: "Trường Học", icon: Building },
  { id: "quan_an", label: "Quán Ăn", icon: Utensils },
  { id: "nha_tro", label: "Nhà Trọ", icon: Home },
];

export default function ForumPage() {
  const router = useRouter();
  const { session, profile } = useAuth();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState("ranking"); // 'ranking' | 'newest' | 'likes'

  // User interaction state (tracked locally and synchronized with API)
  const [userVotes, setUserVotes] = useState({}); // { [postId]: 'trust' | 'distrust' }
  const [userLikes, setUserLikes] = useState({}); // { [postId]: boolean }

  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("nha_tro");
  const [newLocation, setNewLocation] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLink, setNewLink] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const [commentInputs, setCommentInputs] = useState({});
  const [postComments, setPostComments] = useState({});

  // Fetch posts from backend API (Phần E.2)
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
      if (locationFilter.trim()) {
        params.set("locationTag", locationFilter.trim());
      }
      params.set("sortBy", sortBy);

      const res = await fetch(`/api/forum/posts?${params.toString()}`);
      const data = await res.json();

      if (data?.success && Array.isArray(data?.posts)) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.warn("Failed to fetch forum posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, locationFilter, sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Prefill from URL query (if redirected from Scam-Check)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get("prefill");
      if (prefill) {
        setIsNewPostModalOpen(true);
        setNewTitle(prefill);
        setNewCategory("nha_tro");
      }
    }
  }, []);

  // 1. Vote Uy Tín / Không Uy Tín (Phần E.3 - Ghi nhận vào Trust Score qua POST /api/forum/vote)
  const handleVote = async (postId, voteType) => {
    saffronAudio.playClick(700);
    const userId = session?.user?.id || profile?.id || "guest_user";

    // Optimistic UI update
    const prevVote = userVotes[postId];
    const isRetract = prevVote === voteType;
    const nextVote = isRetract ? null : voteType;

    setUserVotes((prev) => ({ ...prev, [postId]: nextVote }));

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;
        let tCount = p.trustVoteCount || 0;
        let dCount = p.distrustVoteCount || 0;

        if (isRetract) {
          if (voteType === "trust") tCount = Math.max(0, tCount - 1);
          if (voteType === "distrust") dCount = Math.max(0, dCount - 1);
        } else {
          if (prevVote === "trust") tCount = Math.max(0, tCount - 1);
          if (prevVote === "distrust") dCount = Math.max(0, dCount - 1);

          if (voteType === "trust") tCount += 1;
          if (voteType === "distrust") dCount += 1;
        }

        return {
          ...p,
          trustVoteCount: tCount,
          distrustVoteCount: dCount,
        };
      })
    );

    try {
      await fetch("/api/forum/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId,
          type: voteType,
        }),
      });
    } catch (err) {
      console.warn("Vote sync error:", err);
    }
  };

  // 2. Like "Hữu ích" (Phần E.3 - Tách biệt hoàn toàn với Trust Score)
  const handleLike = (postId) => {
    saffronAudio.playClick(600);
    const wasLiked = !!userLikes[postId];
    const nextLiked = !wasLiked;

    setUserLikes((prev) => ({ ...prev, [postId]: nextLiked }));

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;
        const currentLikes = p.likeCount || 0;
        return {
          ...p,
          likeCount: nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
        };
      })
    );
  };

  // 3. Create New Post (POST /api/forum/posts)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmittingPost(true);
    saffronAudio.playSuccessChime();

    const isExpert = profile?.role === "expert";

    const payload = {
      category: newCategory,
      locationTag: newLocation.trim() || "CAMPUS",
      title: newTitle.trim(),
      content: newContent.trim(),
      images: [],
      links: newLink.trim() ? [newLink.trim()] : [],
      authorId: session?.user?.id || profile?.id || "usr_stu_new",
      authorName: profile?.fullName || session?.user?.email?.split("@")[0] || "Sinh viên StudentHub",
      authorAvatar: profile?.avatarId || (isExpert ? "expert-tech" : "student-tech"),
    };

    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data?.success && data?.post) {
        setPosts((prev) => [data.post, ...prev]);
        setIsNewPostModalOpen(false);
        setNewTitle("");
        setNewContent("");
        setNewLocation("");
        setNewLink("");
      }
    } catch (err) {
      console.warn("Failed to create post:", err);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // 4. Add Comment (Local thread state)
  const handleAddComment = (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    saffronAudio.playClick(800);
    const isExpert = profile?.role === "expert";

    const newComment = {
      id: `comm_${Date.now()}`,
      author: profile?.fullName || session?.user?.email?.split("@")[0] || "Bạn",
      role: isExpert ? "expert" : "student",
      avatar: profile?.avatarId || (isExpert ? "expert-ai" : "student-tech"),
      trustScore: profile?.trustScore || (isExpert ? 98 : 80),
      time: "Vừa xong",
      text,
    };

    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. High-End Aerospace Aviation Terminal Backdrop */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_07_BETA // REAL_CAMPUS_FORUM"
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

      {/* Main Container */}
      <main className="flex-1 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 min-w-0 font-human">
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]/60" />

        {/* Header & Create Post Button */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09] text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
              <span>PEER-REVIEWED CAMPUS INTELLIGENCE // PHẦN E</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">Diễn Đàn Sinh Viên</span> Đời Sống Thực Tế
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Không gian chia sẻ và kiểm chứng thực tế về Trường học, Quán ăn, Nhà trọ với thang điểm tín nhiệm Trust Score minh bạch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                saffronAudio.playClick(600);
                setIsNewPostModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,188,9,0.35)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>ĐĂNG BÀI CHIA SẺ</span>
            </button>
          </div>
        </div>

        {/* Search & Location Filter Bar */}
        <SaffronSwissCrosshairGrid sectionTag="01 // SEARCH_FILTER_CONSOLE" className="mb-6 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ffbc09]" />
              <input
                type="text"
                placeholder="Tìm kiếm từ khóa bài viết, cảnh báo trọ, quán ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-[#ece7e0] placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] transition-all font-human"
              />
            </div>

            <div className="sm:col-span-4 relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38bdf8]" />
              <input
                type="text"
                placeholder="Lọc theo vị trí / Tag (HUST, UTE, VNU_HCM...)"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-[#ece7e0] placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#38bdf8] transition-all font-human"
              />
            </div>

            <div className="sm:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09] font-mono cursor-pointer"
              >
                <option value="ranking">⚡ Tín nhiệm cao</option>
                <option value="newest">🕒 Mới nhất</option>
                <option value="likes">❤️ Hữu ích nhất</option>
              </select>
            </div>
          </div>
        </SaffronSwissCrosshairGrid>

        {/* Category Tabs (3 Core Categories - Phần E.1) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {FORUM_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  saffronAudio.playClick(500);
                  setSelectedCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#ffbc09] text-[#150604] border-[#ffbc09] shadow-[0_0_15px_rgba(255,188,9,0.3)] scale-105"
                    : "bg-[#150604] text-[#ece7e0]/70 border-[#47140b] hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Post Feed List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="p-12 text-center rounded-3xl bg-[#150604] border border-[#47140b] text-[#ece7e0]/60 font-mono text-xs flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-[#ffbc09] animate-spin" />
              <span>[ ĐANG TẢI DỮ LIỆU DIỄN ĐÀN // SAFFRON PEER ENGINE ]</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#150604] border border-[#47140b] text-[#ece7e0]/60 font-mono text-xs space-y-3">
              <p>Chưa có bài viết nào phù hợp với bộ lọc tìm kiếm.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                  setLocationFilter("");
                }}
                className="px-4 py-2 rounded-xl bg-[#210a07] border border-[#47140b] text-[#ffbc09] hover:bg-[#ffbc09] hover:text-[#150604] transition-all cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            posts.map((post) => {
              const commentsList = postComments[post.id] || [];
              const userVoted = userVotes[post.id];
              const isLiked = !!userLikes[post.id];
              const isAuthorTopExpert = (post.authorTrustScore || 80) >= 80;

              return (
                <article
                  key={post.id}
                  className="p-5 sm:p-6 rounded-3xl bg-[#150604] border border-[#47140b] hover:border-[#ffbc09]/40 transition-all space-y-4 shadow-xl"
                >
                  {/* Post Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#47140b]/60">
                    <div className="flex items-center gap-3">
                      <AvatarDisplay avatarId={post.authorAvatar || "student-tech"} size="sm" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {post.authorName || "Thành viên"}
                          </span>
                          {isAuthorTopExpert && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ffbc09]/20 text-[#ffbc09] text-[10px] font-mono font-bold border border-[#ffbc09]/40">
                              ⭐ Chuyên Gia Uy Tín
                            </span>
                          )}
                          <span className="text-[10.5px] font-mono text-[#ffbc09] px-2 py-0.5 rounded bg-[#ffbc09]/10 border border-[#ffbc09]/20">
                            {post.authorTrustScore || 80} PTS
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#ece7e0]/50 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                          {post.locationTag && (
                            <>
                              <span>•</span>
                              <span className="text-[#38bdf8] flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {post.locationTag}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-[#210a07] border border-[#47140b] text-[11px] font-mono font-semibold text-[#ffd15c] uppercase">
                        {post.category === "nha_tro" ? "🏠 Nhà Trọ" : post.category === "quan_an" ? "🍲 Quán Ăn" : "🏫 Trường Học"}
                      </span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-2">
                    <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#ece7e0]/80 leading-relaxed whitespace-pre-line font-human">
                      {post.content}
                    </p>
                  </div>

                  {/* Attached Links / Sources */}
                  {post.links && post.links.length > 0 && (() => {
                    const safeHref = safeExternalUrl(post.links[0]);
                    return (
                      <div className="p-3 rounded-2xl bg-black/40 border border-[#47140b] flex items-center gap-2 text-xs font-mono text-[#38bdf8] overflow-hidden">
                        <Link2 className="w-4 h-4 shrink-0" />
                        {safeHref ? (
                          <a href={safeHref} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                            {post.links[0]}
                          </a>
                        ) : (
                          <span className="truncate text-[#ece7e0]/60">{post.links[0]}</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Vote & Comment Actions Toolbar (Phần E.3 - Tách bạch Like & Vote) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#47140b]/60">
                    <div className="flex items-center gap-2">
                      {/* Reputable Trust Vote Button */}
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, "trust")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          userVoted === "trust"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            : "bg-[#210a07] text-[#ece7e0]/70 border-[#47140b] hover:border-emerald-500/40 hover:text-white"
                        }`}
                        title="Bình chọn bài viết Uy Tín (Cộng điểm tín nhiệm tác giả)"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Uy Tín ({post.trustVoteCount || 0})</span>
                      </button>

                      {/* Not Reputable Distrust Vote Button */}
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, "distrust")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          userVoted === "distrust"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                            : "bg-[#210a07] text-[#ece7e0]/70 border-[#47140b] hover:border-rose-500/40 hover:text-white"
                        }`}
                        title="Bình chọn bài viết Không Uy Tín / Khả Nghi"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Khả Nghi ({post.distrustVoteCount || 0})</span>
                      </button>

                      {/* Helpful Heart Button (Tách biệt hoàn toàn - Like) */}
                      <button
                        type="button"
                        onClick={() => handleLike(post.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isLiked
                            ? "bg-[#ea3810]/20 text-[#ea3810] border-[#ea3810]/50"
                            : "bg-[#210a07] text-[#ece7e0]/70 border-[#47140b] hover:border-[#ea3810]/40 hover:text-white"
                        }`}
                        title="Thả tim Hữu Ích (Không ảnh hưởng điểm tín nhiệm)"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                        <span>Hữu Ích ({post.likeCount || 0})</span>
                      </button>
                    </div>

                    <div className="text-xs font-mono text-[#ece7e0]/60 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{commentsList.length} Bình luận</span>
                    </div>
                  </div>

                  {/* Comments Thread Section */}
                  {commentsList.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {commentsList.map((comm) => (
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
                  <h3 className="text-base font-bold text-white font-mono">ĐĂNG BÀI MỚI // DIỄN ĐÀN THỰC CHỨNG</h3>
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
                    placeholder="Ví dụ: Cảnh báo lừa cọc phòng trọ tại ngõ 27 Tạ Quang Bửu..."
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
                      className="w-full px-3 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09] font-mono cursor-pointer"
                    >
                      <option value="nha_tro">🏠 Nhà Trọ</option>
                      <option value="quan_an">🍲 Quán Ăn</option>
                      <option value="truong_hoc">🏫 Trường Học</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                      KHU VỰC / TỌA ĐỘ (TAG)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: HUST, UTE, Thủ Đức..."
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
                    placeholder="Mô tả cụ thể trải nghiệm thực tế, cảnh báo lừa cọc hoặc quán ăn vệ sinh..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                    LINK LIÊN QUAN / BẰNG CHỨNG (TÙY CHỌN)
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
                    disabled={isSubmittingPost}
                    className="px-5 py-2.5 rounded-xl bg-[#ffbc09] hover:bg-[#ffd15c] text-[#150604] text-xs font-mono font-bold uppercase shadow-md cursor-pointer transition-all hover:scale-105"
                  >
                    {isSubmittingPost ? "ĐANG ĐĂNG..." : "ĐĂNG BÀI LÊN DIỄN ĐÀN"}
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
