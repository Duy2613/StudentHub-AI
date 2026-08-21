"use client";

// app/profile/[id]/page.jsx
//
// Trang Profile công khai của Chuyên gia uy tín hoặc Sinh viên trong cộng đồng:
// - Cho phép xem hồ sơ chi tiết, đánh giá sao, lĩnh vực chuyên môn
// - Tính năng "Đặt câu hỏi cho Chuyên gia", "Đánh giá uy tín", "Gửi tin nhắn tư vấn 1-1"

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Star,
  Award,
  ShieldCheck,
  Building,
  Briefcase,
  CheckCircle2,
  MessageSquare,
  Send,
  Calendar,
  Heart,
  Share2,
  Check,
  HelpCircle,
  Clock,
  UserCheck,
} from "lucide-react";
import AvatarDisplay from "@/components/AvatarDisplay";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id || "expert-1";

  const [isFollowing, setIsFollowing] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionContent, setQuestionContent] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState(false);

  // Mock public profile data
  const isExpertProfile = String(profileId).includes("expert");

  const profileData = isExpertProfile
    ? {
        id: profileId,
        name: "TS. Nguyễn Minh Đức",
        role: "expert",
        avatarId: "expert-ai",
        badge: "⭐ Chuyên Gia Uy Tín",
        expertTitle: "Chuyên gia AI & Deep Learning",
        field: "Trí tuệ nhân tạo (AI & Machine Learning)",
        experienceYears: "6+ năm nghiên cứu & giảng dạy",
        rating: 4.98,
        reviewsCount: 142,
        answersCount: 380,
        trustScore: 99,
        bio: "Tiến sĩ Khoa học Máy tính. Chuyên gia nghiên cứu về Large Language Models (LLMs), Computer Vision và kiến trúc học sâu. Rất vui được hỗ trợ và giải đáp thắc mắc học thuật cho các bạn sinh viên!",
        skills: ["Deep Learning", "PyTorch", "LLMs & RAG", "Python", "Data Science", "Định hướng Nghiên cứu"],
        recentAnswers: [
          {
            title: "Tối ưu mô hình Transformers khi fine-tune trên dữ liệu tiếng Việt",
            votes: 56,
            date: "2 ngày trước",
            accepted: true,
          },
          {
            title: "Hướng dẫn xây dựng hệ thống RAG cơ bản với LangChain và ChromaDB",
            votes: 89,
            date: "1 tuần trước",
            accepted: true,
          },
          {
            title: "Phân biệt chi tiết giữa Cross-Entropy Loss và Focal Loss",
            votes: 41,
            date: "2 tuần trước",
            accepted: true,
          },
        ],
        reviews: [
          {
            student: "Lê Quốc Bảo (HUST)",
            rating: 5,
            comment: "Thầy giải thích cực kỳ dễ hiểu, tận tình và giúp em fix xong bug huấn luyện model!",
            date: "Hôm qua",
          },
          {
            student: "Nguyễn Thảo Vy (UIT)",
            rating: 5,
            comment: "Chuyên gia uy tín hàng đầu của StudentHub, câu trả lời rất sâu sắc và chi tiết.",
            date: "3 ngày trước",
          },
        ],
      }
    : {
        id: profileId,
        name: "Trần Minh Hoàng",
        role: "student",
        avatarId: "student-tech",
        badge: "🎓 Sinh Viên Xác Thực",
        university: "Đại học Bách Khoa Hà Nội (HUST)",
        major: "Khoa học Máy tính",
        academicYear: "K66 (2021 - 2025)",
        trustScore: 85,
        rating: 4.9,
        answersCount: 18,
        bio: "Sinh viên năm 4 đam mê công nghệ Web, Next.js, Cloud và Trí tuệ nhân tạo. Luôn học hỏi và chia sẻ tài liệu cùng các bạn sinh viên.",
        skills: ["Next.js", "TypeScript", "Python", "SQL", "Docker", "Thuật toán"],
        recentAnswers: [
          {
            title: "Kinh nghiệm ôn thi môn Giải tích 2 đạt điểm A",
            votes: 38,
            date: "5 ngày trước",
            accepted: true,
          },
          {
            title: "Tổng hợp đề thi giữa kỳ Cấu trúc dữ liệu có lời giải",
            votes: 64,
            date: "2 tuần trước",
            accepted: true,
          },
        ],
        reviews: [],
      };

  const handleSendQuestion = (e) => {
    e.preventDefault();
    if (!questionTitle.trim() || !questionContent.trim()) return;

    setIsSubmittingQuestion(true);
    setTimeout(() => {
      setIsSubmittingQuestion(false);
      setQuestionSuccess(true);
      setTimeout(() => {
        setQuestionSuccess(false);
        setIsQuestionModalOpen(false);
        setQuestionTitle("");
        setQuestionContent("");
      }, 1200);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col relative overflow-x-hidden">
      <AmbientBackground />
      <NoiseOverlay />

      {/* ---------------- TOP NAVBAR ---------------- */}
      <header className="sticky top-0 z-40 bg-space-950/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                isFollowing
                  ? "bg-white/10 text-gray-300 border border-white/20"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105"
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4 text-emerald-400" /> Đang theo dõi
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" /> Theo dõi chuyên gia
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- MAIN PUBLIC PROFILE ---------------- */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 relative z-10">
        {/* Profile Card Header */}
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl overflow-hidden shadow-glass-deep">
          <div
            className={`h-44 sm:h-52 w-full relative ${
              profileData.role === "expert"
                ? "bg-gradient-to-r from-amber-950/70 via-purple-950/60 to-space-950"
                : "bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-space-950"
            }`}
          />

          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
              <AvatarDisplay
                avatarId={profileData.avatarId}
                role={profileData.role}
                size="2xl"
                showBadge={true}
              />

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {profileData.role === "expert" && (
                  <button
                    type="button"
                    onClick={() => setIsQuestionModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
                  >
                    <MessageSquare className="w-4 h-4" /> Đặt câu hỏi cho Chuyên gia
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert("Đã sao chép liên kết hồ sơ!");
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {profileData.name}
                </h1>

                {profileData.role === "expert" ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {profileData.badge}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    {profileData.badge}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-300 flex flex-wrap items-center gap-3">
                {profileData.role === "expert" ? (
                  <>
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" /> {profileData.expertTitle}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400">{profileData.field}</span>
                    <span>•</span>
                    <span className="text-gray-400">{profileData.experienceYears}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-indigo-400" /> {profileData.university}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400">{profileData.major}</span>
                  </>
                )}
              </p>

              <p className="text-sm text-gray-400 max-w-3xl leading-relaxed pt-1">
                {profileData.bio}
              </p>

              {/* Stats Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-xs text-gray-400">Điểm Uy Tín</p>
                  <p className="text-xl font-black text-indigo-300 mt-0.5">{profileData.trustScore} pts</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-xs text-gray-400">Đánh giá trung bình</p>
                  <p className="text-xl font-black text-amber-300 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {profileData.rating}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-xs text-gray-400">Câu trả lời chất lượng</p>
                  <p className="text-xl font-black text-white mt-0.5">{profileData.answersCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-xs text-gray-400">Lượt sinh viên đánh giá</p>
                  <p className="text-xl font-black text-emerald-400 mt-0.5">
                    {profileData.reviewsCount || 24}+
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- CHUYÊN MÔN & GIẢI ĐÁP NỔI BẬT ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột 1 & 2: Câu trả lời & Đánh giá (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lời giải nổi bật */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                Câu Trả Lời Chuyên Sâu Đã Được Chấp Nhận
              </h3>
              <div className="space-y-3">
                {profileData.recentAnswers.map((ans, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-white hover:text-amber-300 transition-colors cursor-pointer">
                        {ans.title}
                      </h4>
                      <span className="text-xs text-gray-400 mt-1 inline-block">
                        Đã đăng: {ans.date}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                      ▲ {ans.votes}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Đánh giá từ sinh viên */}
            {profileData.reviews?.length > 0 && (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  Đánh Giá & Nhận Xét Từ Sinh Viên
                </h3>
                <div className="space-y-3">
                  {profileData.reviews.map((rev, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-200">{rev.student}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 italic">"{rev.comment}"</p>
                      <span className="text-[10px] text-gray-500 block">{rev.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột 3: Kỹ năng & Đặt lịch (1/3) */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Lĩnh Vực Chuyên Sâu
              </h4>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-amber-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {profileData.role === "expert" && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-space-900 to-space-950 border border-amber-500/30 backdrop-blur-xl space-y-4">
                <h4 className="text-sm font-bold text-amber-200 uppercase tracking-wider">
                  Cố Vấn & Hướng Nghiệp
                </h4>
                <p className="text-xs text-gray-300">
                  Bạn cần giải đáp bài tập khó, định hướng nghiên cứu đề tài hoặc review CV công nghệ?
                </p>
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-black font-bold text-xs shadow-lg shadow-amber-500/25 hover:scale-102 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Gửi câu hỏi trực tiếp
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ---------------- MODAL ĐẶT CÂU HỎI CHO CHUYÊN GIA ---------------- */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-space-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Đặt câu hỏi cho {profileData.name}
            </h2>

            {questionSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" /> Câu hỏi của bạn đã được gửi tới chuyên gia!
              </div>
            ) : (
              <form onSubmit={handleSendQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Tiêu đề câu hỏi / Vấn đề cần giải đáp
                  </label>
                  <input
                    type="text"
                    value={questionTitle}
                    onChange={(e) => setQuestionTitle(e.target.value)}
                    placeholder="VD: Cần hỗ trợ tối ưu thuật toán Transformer..."
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Nội dung chi tiết & Ngữ cảnh
                  </label>
                  <textarea
                    rows={4}
                    value={questionContent}
                    onChange={(e) => setQuestionContent(e.target.value)}
                    placeholder="Mô tả chi tiết bài toán, những cách bạn đã thử và khúc mắc cần chuyên gia gợi ý..."
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsQuestionModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuestion}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-black text-xs font-bold shadow-md shadow-amber-500/25 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSubmittingQuestion ? "Đang gửi..." : "Gửi câu hỏi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
