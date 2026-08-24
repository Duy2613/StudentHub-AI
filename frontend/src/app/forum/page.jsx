"use client";

// app/forum/page.jsx
// Diễn đàn cộng đồng sinh viên StudentHub AI:
// - Phân loại theo danh mục: Trường học, Quán ăn, Nhà trọ, Ngành học, CLB
// - Tìm kiếm theo từ khóa và địa điểm (thuật toán lọc tag/text thông thường, KHÔNG AI)
// - Vote "Uy tín" / "Không uy tín" (ưu tiên xếp hạng hiển thị bài viết)
// - Like tách biệt hoàn toàn khỏi điểm uy tín (thể hiện "Thấy hữu ích")
// - Bình luận mở cho Chuyên gia & Sinh viên

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
  Share2
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import AvatarDisplay from "@/components/AvatarDisplay";
import TactileButton from "@/components/ui/TactileButton";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
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
    userVoted: null, // "reputable" | "notReputable" | null
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
    title: "Danh sách 5 quán cơm sinh viên giá rẻ, sạch sẽ quanh KTX ĐHQG TP.HCM",
    category: "food",
    location: "Thủ Đức, TP.HCM (Làng Đại học ĐHQG-HCM)",
    author: "Trần Mai Anh",
    authorRole: "student",
    authorAvatar: "student-designer",
    trustScore: 85,
    time: "2 giờ trước",
    content:
      "Tổng hợp 5 quán cơm bình dân sạch sẽ, canh rau tự lấy miễn phí, giá từ 25k - 30k dành cho các bạn sinh viên khu B và khu A. Đã qua kiểm chứng vệ sinh và thái độ phục vụ nhiệt tình.",
    images: [],
    links: [],
    trustVotes: { reputable: 62, notReputable: 1 },
    likes: 88,
    userVoted: null,
    userLiked: false,
    comments: [
      {
        id: "c3",
        author: "Nguyễn Thảo Vy",
        role: "student",
        avatar: "student-ai",
        trustScore: 80,
        time: "1 giờ trước",
        text: "Quán cô Năm ở số 3 đường vành đai ngon và nhiều đồ ăn lắm, vote 5 sao!",
      },
    ],
  },
  {
    id: 3,
    title: "Cảnh báo fanpage giả mạo 'CLB Kỹ năng Sinh viên FTU' thu phí phỏng vấn 150k",
    category: "club",
    location: "Đống Đa, Hà Nội (ĐH Ngoại Thương)",
    author: "Đặng Hoàng Long",
    authorRole: "student",
    authorAvatar: "student-leader",
    trustScore: 88,
    time: "4 giờ trước",
    content:
      "Hiện có page mạo danh tuyển thành viên CLB Kỹ năng sinh viên nhưng yêu cầu ứng viên nộp lệ phí dự thi vòng phỏng vấn 150.000đ qua Momo. CLB chính thức của trường KHÔNG BAO GIỜ thu phí tuyển sinh.",
    images: [],
    links: ["https://ftu.edu.vn/canh-bao-clb-gia-mao"],
    trustVotes: { reputable: 54, notReputable: 0 },
    likes: 42,
    userVoted: null,
    userLiked: false,
    comments: [
      {
        id: "c4",
        author: "TS. Nguyễn Minh Đức",
        role: "expert",
        avatar: "expert-ai",
        trustScore: 99,
        time: "3 giờ trước",
        text: "Mọi hoạt động tuyển thành viên CLB sinh viên thu tiền xét tuyển đều là dấu hiệu mạo danh trục lợi. Hãy kiểm tra qua fanpage chính thức có tick xanh hoặc website trường.",
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
  const [sortBy, setSortBy] = useState("reputable"); // "reputable" | "newest" | "hot"

  // Modal new post
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("housing");
  const [newLocation, setNewLocation] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLink, setNewLink] = useState("");

  // Active comment input per post
  const [commentInputs, setCommentInputs] = useState({});

  // Check URL query parameters for prefill
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get("prefill");
      if (prefill) {
        setNewTitle(`[Cảnh báo] ${prefill}`);
        setIsNewPostModalOpen(true);
      }
    }
  }, []);

  // Filter & Sort Logic (Tag & Location matching without AI)
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
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const currentVote = p.userVoted;
        let newRep = p.trustVotes.reputable;
        let newNot = p.trustVotes.notReputable;

        if (currentVote === voteType) {
          // Cancel vote
          if (voteType === "reputable") newRep -= 1;
          if (voteType === "notReputable") newNot -= 1;
          return {
            ...p,
            userVoted: null,
            trustVotes: { reputable: Math.max(0, newRep), notReputable: Math.max(0, newNot) },
          };
        }

        // Change vote
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

  // Like "Hữu ích" (Separated from Trust score)
  const handleLike = (postId) => {
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
    <div className="min-h-screen bg-transparent text-gray-100 flex relative overflow-x-hidden">
      {/* 1. 3D Infinite Highway Canvas */}
      <div className="canvas-bg-layer">
        <RobinPayotRoadCanvas />
      </div>

      {/* 2. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 3. Floating Quick Tools & Studio */}
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

      {/* Main Container with generous top padding for navbar */}
      <main className="flex-1 layout-safe-container pt-28 sm:pt-32 pb-40 relative z-10 min-w-0">
        
        {/* Header & Create Post Button */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-teal-400 igloo-radar-beacon" />
              <span>COMMUNITY DAO • PEER-REVIEWED FEED</span>
            </div>
            <h1 className="page-title">
              Chia Sẻ &amp; Cảnh Báo Sinh Viên
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-2xl font-human">
              Thảo luận thực chứng về Nhà trọ, Quán ăn, Cảnh báo lừa đảo và Môi trường học đường với hệ thống bình chọn tín nhiệm phi tập trung.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
            <TactileButton
              variant="primary"
              size="md"
              techSuffix="[DAO POST]"
              onClick={() => setIsNewPostModalOpen(true)}
              icon={Plus}
            >
              Đăng Bài Mới
            </TactileButton>
          </div>
        </div>

        {/* Search & Location Filter Bar (No AI algorithm) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6 p-4 rounded-3xl igloo-hologram-card border border-white/10 backdrop-blur-2xl">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm từ khóa bài viết, cảnh báo lừa đảo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition-all"
            />
          </div>

          <div className="sm:col-span-4 relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
            <input
              type="text"
              placeholder="Lọc địa điểm (Quận, tên trường...)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#111522] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-teal-400"
            >
              <option value="reputable">Ưu tiên Uy Tín Cao</option>
              <option value="newest">Mới nhất</option>
              <option value="hot">Nhiều lượt Like</option>
            </select>
          </div>
        </div>

        {/* Category Horizontal Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-teal-400 text-space-950 shadow-[0_0_20px_rgba(52,231,196,0.35)]"
                    : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Forum Posts List */}
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-300">Không tìm thấy bài viết phù hợp</p>
              <p className="text-xs text-gray-500 mt-1">Thử thay đổi từ khóa hoặc địa điểm tìm kiếm</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const totalVotes = post.trustVotes.reputable + post.trustVotes.notReputable;
              const repPercent = totalVotes > 0 ? Math.round((post.trustVotes.reputable / totalVotes) * 100) : 100;
              const isReputableHigh = repPercent >= 80;

              return (
                <article
                  key={post.id}
                  className="p-6 sm:p-7 rounded-3xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 backdrop-blur-2xl transition-all space-y-4 shadow-glass-deep"
                >
                  {/* Top Author & Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AvatarDisplay
                        avatarId={post.authorAvatar}
                        role={post.authorRole}
                        size="sm"
                        showBadge={true}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{post.author}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                              post.authorRole === "expert"
                                ? "bg-amber-500/15 border-amber-400/40 text-amber-300"
                                : "bg-teal-500/15 border-teal-400/40 text-teal-300"
                            }`}
                          >
                            {post.trustScore} pts
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-teal-400" /> {post.location} • <Clock className="w-3 h-3 ml-1" /> {post.time}
                        </p>
                      </div>
                    </div>

                    {/* Trust Ratio Pill */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                        isReputableHigh
                          ? "bg-teal-500/15 border-teal-400/40 text-teal-300"
                          : "bg-rose-500/15 border-rose-400/40 text-rose-300"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{repPercent}% Uy Tín ({totalVotes} votes)</span>
                    </div>
                  </div>

                  {/* Title & Body Content */}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {/* Reference Links */}
                  {post.links && post.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {post.links.map((lnk, idx) => (
                        <a
                          key={idx}
                          href={lnk}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-teal-300 hover:text-teal-200 underline font-medium"
                        >
                          <Link2 className="w-3 h-3" /> {lnk}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Dual Action Bar: Vote Uy Tín vs Like Hữu Ích */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10 text-xs">
                    {/* Vote Uy Tín / Không Uy Tín */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-400 mr-1">Xác thực bài viết:</span>
                      
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, "reputable")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          post.userVoted === "reputable"
                            ? "bg-teal-400/25 border-teal-400 text-teal-200 font-bold shadow-[0_0_15px_rgba(52,231,196,0.3)]"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-teal-400" />
                        <span>Uy Tín ({post.trustVotes.reputable})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVote(post.id, "notReputable")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          post.userVoted === "notReputable"
                            ? "bg-rose-500/25 border-rose-400 text-rose-200 font-bold shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                        <span>Không Uy Tín ({post.trustVotes.notReputable})</span>
                      </button>
                    </div>

                    {/* Like "Hữu ích" (Tách biệt khỏi điểm uy tín) */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                          post.userLiked
                            ? "bg-rose-500/20 text-rose-400 font-bold"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                        title="Đánh dấu bài viết hữu ích (không ảnh hưởng điểm uy tín)"
                      >
                        <Heart className={`w-4 h-4 ${post.userLiked ? "fill-rose-400 text-rose-400" : ""}`} />
                        <span>{post.likes} Hữu ích</span>
                      </button>

                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {post.comments.length}
                      </span>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    {post.comments.map((cm) => (
                      <div
                        key={cm.id}
                        className={`p-3 rounded-2xl border text-xs space-y-1 ${
                          cm.role === "expert"
                            ? "bg-amber-950/20 border-amber-500/30"
                            : "bg-white/[0.02] border-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{cm.author}</span>
                            {cm.role === "expert" && (
                              <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-extrabold flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Chuyên Gia Uy Tín ({cm.trustScore} pts)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500">{cm.time}</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{cm.text}</p>
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
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        className="p-2 rounded-xl bg-teal-400 text-space-950 font-bold hover:scale-105 transition-transform"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-xl bg-space-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-400" /> Đăng Bài Chia Sẻ / Cảnh Báo
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                    Tiêu đề bài viết
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cảnh báo chiêu trò lừa cọc phòng trọ ngõ 27 Tạ Quang Bửu..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                      Danh mục
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#111522] border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="housing">Nhà Trọ</option>
                      <option value="food">Quán Ăn</option>
                      <option value="campus">Trường Học</option>
                      <option value="academic">Ngành Học</option>
                      <option value="club">CLB & Hoạt Động</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                      Địa điểm / Khu vực trường
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Cầu Giấy, Hà Nội hoặc ĐH Bách Khoa"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                    Nội dung chi tiết & Bằng chứng
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Mô tả cụ thể sự việc, thủ đoạn, bằng chứng hoặc lời khuyên cho cộng đồng..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                    Link tham khảo / Bài đăng gốc (Tùy chọn)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewPostModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                  >
                    Hủy
                  </button>
                  <TactileButton variant="primary" size="sm" type="submit" showArrow={false}>
                    Đăng Bài Xác Thực
                  </TactileButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
