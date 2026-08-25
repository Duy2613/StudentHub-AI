"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Star,
  Search,
  Plus,
  BookOpen,
  ThumbsUp,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  MessageSquare,
  Flame,
  Loader2,
  Building,
  UserCheck,
  Filter,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
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

export default function ProfRatingPage() {
  const { session, profile } = useAuth();

  const [professors, setProfessors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedUni, setSelectedUni] = useState("ALL");

  // Modal State for New Review
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetProf, setTargetProf] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newClarity, setNewClarity] = useState(5);
  const [newAttendance, setNewAttendance] = useState(4);
  const [newDifficulty, setNewDifficulty] = useState(3);
  const [newRecommend, setNewRecommend] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Suggest Lecturer State
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestName, setSuggestName] = useState("");
  const [suggestUni, setSuggestUni] = useState("HCMUTE");
  const [suggestDept, setSuggestDept] = useState("Khoa Công Nghệ Thông Tin");
  const [suggestSubject, setSuggestSubject] = useState("");
  const [suggestSuccess, setSuggestSuccess] = useState(false);

  // Reviews Drawer State
  const [viewingReviewsProf, setViewingReviewsProf] = useState(null);
  const [profReviews, setProfReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Fetch Professors
  const fetchProfessors = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDept !== "ALL") params.set("department", selectedDept);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/prof-rating/professors?${params.toString()}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data?.professors)) {
        let list = data.professors;
        if (selectedUni !== "ALL") {
          list = list.filter((p) => p.university.toLowerCase().includes(selectedUni.toLowerCase()));
        }
        setProfessors(list);
      }
    } catch (err) {
      console.warn("Fetch professors error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDept, selectedUni, searchQuery]);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  // Open Reviews List for a Professor
  const handleOpenReviews = async (prof) => {
    saffronAudio.playClick(500);
    setViewingReviewsProf(prof);
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`/api/prof-rating/reviews?professorId=${prof.id}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data?.reviews)) {
        setProfReviews(data.reviews);
      }
    } catch (err) {
      console.warn("Fetch prof reviews error:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!targetProf || !newComment.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    saffronAudio.playClick(800);

    try {
      const res = await fetch("/api/prof-rating/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professorId: targetProf.id,
          rating: newRating,
          clarityScore: newClarity,
          attendanceScore: newAttendance,
          difficultyScore: newDifficulty,
          recommend: newRecommend,
          comment: newComment.trim(),
          studentRole: profile?.fullName ? `Sinh viên ${profile.fullName.split(" ")[0]}` : "Sinh viên Ẩn danh",
        }),
      });

      const data = await res.json();
      if (data?.success) {
        saffronAudio.playSuccessChime();
        setIsModalOpen(false);
        setNewComment("");
        fetchProfessors();
      } else {
        saffronAudio.playAlertBuzz();
        setSubmitError(data.error || "Gửi nhận xét thất bại.");
      }
    } catch (err) {
      console.warn("Submit review error:", err);
      setSubmitError("Lỗi kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestLecturer = (e) => {
    e.preventDefault();
    if (!suggestName.trim() || !suggestSubject.trim()) return;
    saffronAudio.playSuccessChime();
    setSuggestSuccess(true);
    setTimeout(() => {
      setSuggestSuccess(false);
      setIsSuggestOpen(false);
      setSuggestName("");
      setSuggestSubject("");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. Aerospace Mission Control Backdrop */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_13_ALPHA // FACULTY_REPUTATION_HUB"
        gridDensity={52}
        showRadarRings={false}
      />

      {/* 2. Interactive WebGL Fluid Smoke Trail */}
      <MohsinFluidCanvas opacity={0.35} particleDensity={35} />

      {/* 3. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 4. Floating Quick Tools */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* Navigation */}
      {session ? (
        <CollapsibleSidebar className="hidden md:flex relative z-40" />
      ) : (
        <header className="overlay-nav-layer">
          <ModernNavbar />
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 min-w-0 font-human">
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]/60" />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09] text-xs font-mono font-bold tracking-wider mb-3">
              <GraduationCap className="w-4 h-4 text-[#ffbc09]" />
              <span>CIVILIZED FACULTY FEEDBACK // AI TOXICITY FILTERED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">AI Review Giảng Viên</span> &amp; Bí Kíp Vượt Môn
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Không gian phản biện học thuật văn minh: Tra cứu phong cách giảng dạy, mức độ điểm danh, dạng đề thi và mẹo ôn tập điểm A từ các khóa trước.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
            <button
              type="button"
              onClick={() => {
                saffronAudio.playClick(500);
                setIsSuggestOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-[#210a07] border border-[#ffbc09]/50 hover:border-[#ffbc09] text-[#ffd15c] font-mono font-bold text-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>ĐỀ XUẤT THẦY/CÔ MỚI</span>
            </button>
          </div>
        </div>

        {/* Search, University & Department Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-[#ece7e0]/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên Thầy/Cô, môn học (Giải tích, C++, Triết...)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#150604] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] font-mono"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedUni}
              onChange={(e) => setSelectedUni(e.target.value)}
              className="w-full px-3 py-3 bg-[#150604] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09] font-mono cursor-pointer"
            >
              <option value="ALL">🏛️ Tất Cả Trường ĐH</option>
              <option value="HCMUTE">ĐH Sư Phạm Kỹ Thuật (HCMUTE)</option>
              <option value="HUST">ĐH Bách Khoa Hà Nội (HUST)</option>
              <option value="UIT">ĐH Công Nghệ Thông Tin (UIT)</option>
              <option value="NEU">ĐH Kinh Tế Quốc Dân (NEU)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-3 bg-[#150604] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09] font-mono cursor-pointer"
            >
              <option value="ALL">📚 Tất Cả Các Khoa</option>
              <option value="Khoa Học Ứng Dụng">Khoa Khoa Học Ứng Dụng (Toán/Lý)</option>
              <option value="Công Nghệ Thông Tin">Khoa Công Nghệ Thông Tin</option>
              <option value="Lý Luận Chính Trị">Khoa Lý Luận Chính Trị</option>
            </select>
          </div>
        </div>

        {/* Faculty Grid */}
        {isLoading ? (
          <div className="p-12 text-center rounded-3xl bg-[#150604] border border-[#47140b] text-xs font-mono text-[#ece7e0]/60 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-[#ffbc09] animate-spin" />
            <span>Đang tải danh bạ phản biện giảng viên...</span>
          </div>
        ) : professors.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#150604] border border-[#47140b] text-xs font-mono text-[#ece7e0]/50">
            Không tìm thấy giảng viên nào phù hợp với từ khóa tìm kiếm.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {professors.map((prof) => (
              <div
                key={prof.id}
                className="p-6 rounded-3xl bg-[#150604] border border-[#47140b] hover:border-[#ffbc09]/50 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Row: Name, Rating, Recommend % */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-[#ffd15c] uppercase block">
                        {prof.department} • {prof.university}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-tight mt-0.5">
                        {prof.name}
                      </h3>
                      <span className="text-xs font-mono text-[#38bdf8] block mt-0.5">
                        Môn phụ trách: {prof.subject}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#ffbc09]/20 border border-[#ffbc09]/40 text-[#ffd15c] text-sm font-black font-mono">
                        <Star className="w-4 h-4 fill-[#ffd15c] text-[#ffd15c]" />
                        <span>{prof.overallRating}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block mt-1">
                        {prof.recommendRate}% Đề xuất học
                      </span>
                    </div>
                  </div>

                  {/* 3 Metric Badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-[#210a07] border border-[#47140b] space-y-0.5">
                      <span className="text-[9.5px] text-[#ece7e0]/50 uppercase block">ĐIỂM DANH:</span>
                      <span className="text-white font-bold text-[11px]">{prof.attendanceLabel}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#210a07] border border-[#47140b] space-y-0.5">
                      <span className="text-[9.5px] text-[#ece7e0]/50 uppercase block">HÌNH THỨC THI:</span>
                      <span className="text-[#38bdf8] font-bold text-[11px]">{prof.examFormatLabel}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {prof.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-black/40 border border-[#47140b] text-[10.5px] font-mono text-[#ece7e0]/80"
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>

                  {/* Survival Tip Box */}
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      BÍ KÍP VƯỢT MÔN ĐIỂM A (TỪ KHÓA TRƯỚC):
                    </span>
                    <p className="text-xs text-[#ece7e0]/90 leading-relaxed font-human">
                      {prof.survivalTip}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#47140b] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#ece7e0]/50">
                    {prof.totalReviews} sinh viên đã đánh giá
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReviews(prof)}
                      className="px-3 py-1.5 rounded-xl bg-[#210a07] border border-[#47140b] hover:border-white/30 text-xs font-mono text-white cursor-pointer"
                    >
                      Xem Nhận Xét
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        saffronAudio.playClick(500);
                        setTargetProf(prof);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#ffbc09] text-[#150604] font-mono font-bold text-xs hover:scale-105 transition-all cursor-pointer"
                    >
                      + Gửi Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* SUBMIT REVIEW MODAL */}
      <AnimatePresence>
        {isModalOpen && targetProf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-[#150604] border border-[#ffbc09]/50 shadow-2xl space-y-4 font-human"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    GỬI ĐÁNH GIÁ HỌC THUẬT ẨN DANH
                  </h3>
                  <span className="text-xs text-[#ffbc09] font-mono">
                    Giảng viên: {targetProf.name} ({targetProf.subject})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-[#ece7e0]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating 1 to 5 Stars */}
                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                    ĐIỂM TỔNG QUAN (1 - 5 SAO) (*)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className={`p-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          newRating >= star
                            ? "bg-[#ffbc09] text-[#150604] border-[#ffbc09]"
                            : "bg-[#210a07] text-[#ece7e0]/50 border-[#47140b]"
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                        <span>{star}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                      ĐỘ DỄ HIỂU BÀI GIẢNG (1-5)
                    </label>
                    <select
                      value={newClarity}
                      onChange={(e) => setNewClarity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono cursor-pointer"
                    >
                      <option value={5}>5/5 - Rất dễ hiểu, truyền cảm hứng</option>
                      <option value={4}>4/5 - Giảng rõ ràng, đúng trọng tâm</option>
                      <option value={3}>3/5 - Bình thường, chủ yếu theo slide</option>
                      <option value={2}>2/5 - Khá hàn lâm, khó theo kịp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                      CÓ ĐỀ XUẤT ĐĂNG KÝ HỌC?
                    </label>
                    <select
                      value={newRecommend ? "YES" : "NO"}
                      onChange={(e) => setNewRecommend(e.target.value === "YES")}
                      className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono cursor-pointer"
                    >
                      <option value="YES">✓ Khuyên nên học</option>
                      <option value="NO">✗ Cân nhắc lớp khác</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                    NHẬN XÉT CHI TIẾT &amp; MẸO ÔN THI (*)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Chia sẻ về phong cách giảng dạy, dạng bài thi hay gặp, lưu ý khi làm bài tập lớn... (Nghiêm cấm từ ngữ xúc phạm cá nhân)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                    ⚠️ {submitError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-transparent border border-[#47140b] text-xs font-mono text-[#ece7e0]/70"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#ffbc09] text-[#150604] font-mono font-bold text-xs uppercase cursor-pointer"
                  >
                    {isSubmitting ? "ĐANG KIỂM DUYỆT..." : "GỬI NHẬN XÉT"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW REVIEWS DRAWER MODAL */}
      <AnimatePresence>
        {viewingReviewsProf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl p-6 rounded-3xl bg-[#150604] border border-[#ffbc09]/50 shadow-2xl space-y-4 font-human"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    NHẬN XÉT CỦA SINH VIÊN // {viewingReviewsProf.name}
                  </h3>
                  <span className="text-xs text-[#38bdf8] font-mono">
                    Môn: {viewingReviewsProf.subject}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingReviewsProf(null)}
                  className="p-1 rounded-lg text-[#ece7e0]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingReviews ? (
                <div className="p-8 text-center text-xs font-mono text-[#ece7e0]/60 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#ffbc09] animate-spin" />
                  <span>Đang tải nhận xét...</span>
                </div>
              ) : profReviews.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-[#ece7e0]/50">
                  Chưa có nhận xét nào cho giảng viên này. Hãy gửi nhận xét đầu tiên!
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {profReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-[#210a07] border border-[#47140b] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono">
                          {rev.studentRole}
                        </span>
                        <div className="flex items-center gap-1 text-[#ffd15c] font-mono font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{rev.rating} / 5</span>
                        </div>
                      </div>

                      <p className="text-[#ece7e0]/90 leading-relaxed font-human">
                        &ldquo;{rev.comment}&rdquo;
                      </p>

                      <span className="text-[10px] font-mono text-[#ece7e0]/40 block">
                        Ngày đăng: {new Date(rev.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUGGEST NEW PROFESSOR MODAL */}
      <AnimatePresence>
        {isSuggestOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-[#150604] border border-[#ffbc09]/50 shadow-2xl space-y-4 font-human"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <h3 className="text-base font-bold text-white font-mono">
                  ĐỀ XUẤT THẦY/CÔ MỚI VÀO DANH BẠ HỌC THUẬT
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSuggestOpen(false)}
                  className="p-1 rounded-lg text-[#ece7e0]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSuggestLecturer} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                    HỌ VÀ TÊN THẦY/CÔ (KÈM HỌC HÀM NẾU CÓ) (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: TS. Nguyễn Văn A..."
                    value={suggestName}
                    onChange={(e) => setSuggestName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                      TRƯỜNG ĐẠI HỌC
                    </label>
                    <select
                      value={suggestUni}
                      onChange={(e) => setSuggestUni(e.target.value)}
                      className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono cursor-pointer"
                    >
                      <option value="HCMUTE">ĐH Sư Phạm Kỹ Thuật (HCMUTE)</option>
                      <option value="HUST">ĐH Bách Khoa Hà Nội (HUST)</option>
                      <option value="UIT">ĐH Công Nghệ Thông Tin (UIT)</option>
                      <option value="NEU">ĐH Kinh Tế Quốc Dân (NEU)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                      KHOA / VIỆN
                    </label>
                    <select
                      value={suggestDept}
                      onChange={(e) => setSuggestDept(e.target.value)}
                      className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono cursor-pointer"
                    >
                      <option value="Khoa Công Nghệ Thông Tin">Khoa Công Nghệ Thông Tin</option>
                      <option value="Khoa Khoa Học Ứng Dụng">Khoa Khoa Học Ứng Dụng (Toán/Lý)</option>
                      <option value="Khoa Lý Luận Chính Trị">Khoa Lý Luận Chính Trị</option>
                      <option value="Khoa Điện - Điện Tử">Khoa Điện - Điện Tử</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                    MÔN HỌC THẦY/CÔ PHỤ TRÁCH (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cơ sở dữ liệu, Vi tích phân 2, Kỹ thuật số..."
                    value={suggestSubject}
                    onChange={(e) => setSuggestSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>

                {suggestSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Đã gửi đề xuất thành công! Ban học thuật sẽ xác minh và cập nhật.</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSuggestOpen(false)}
                    className="px-4 py-2 rounded-xl bg-transparent border border-[#47140b] text-xs font-mono text-[#ece7e0]/70"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#ffbc09] text-[#150604] font-mono font-bold text-xs uppercase cursor-pointer"
                  >
                    GỬI ĐỀ XUẤT
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
