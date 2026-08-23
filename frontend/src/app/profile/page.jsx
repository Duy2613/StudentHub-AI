"use client";

// app/profile/page.jsx
//
// Trang Profile Cá nhân của Sinh viên & Chuyên gia uy tín:
// - Hiển thị đầy đủ thông tin học vấn / chuyên môn, Huy hiệu xác thực, Điểm uy tín
// - Cho phép chỉnh sửa hồ sơ, đổi avatar, cập nhật bio và lưu vào Supabase tức thì.

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Edit3,
  Star,
  GraduationCap,
  Award,
  ShieldCheck,
  Building,
  BookOpen,
  Briefcase,
  Layers,
  CheckCircle2,
  Calendar,
  MessageSquare,
  FileText,
  Upload,
  X,
  Check,
  Loader2,
  Share2,
  Lock,
  FolderGit2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import { AmbientBackground, NoiseOverlay, GithubIcon } from "@/components/auth/AuthUI";
import {
  AVATAR_LIST,
  VIETNAM_UNIVERSITIES,
  EXPERT_FIELDS,
  getAvatarById,
} from "@/lib/avatars";
import { motion } from "motion/react";

export default function ProfilePage() {
  const router = useRouter();
  const { session, profile, updateProfile, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("overview"); // overview, activities, badges
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form States
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState("student");
  const [editAvatarId, setEditAvatarId] = useState("student-tech");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editUniversity, setEditUniversity] = useState(VIETNAM_UNIVERSITIES[0]);
  const [editCustomUniversity, setEditCustomUniversity] = useState("");
  const [editMajor, setEditMajor] = useState("");
  const [editAcademicYear, setEditAcademicYear] = useState("");
  const [editExpertTitle, setEditExpertTitle] = useState("");
  const [editExpertField, setEditExpertField] = useState(EXPERT_FIELDS[0]);
  const [editExperienceYears, setEditExperienceYears] = useState("");
  const [editBio, setEditBio] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editError, setEditError] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [session, isLoading, router]);

  // Load current profile data into edit form
  useEffect(() => {
    if (profile) {
      setEditFullName(profile.fullName || "");
      setEditRole(profile.role || "student");
      setEditAvatarId(profile.avatarId || "student-tech");
      setEditAvatarUrl(profile.avatarUrl || "");
      if (profile.university) setEditUniversity(profile.university);
      setEditMajor(profile.major || "");
      setEditAcademicYear(profile.academicYear || "");
      setEditExpertTitle(profile.expertTitle || "");
      if (profile.expertField) setEditExpertField(profile.expertField);
      setEditExperienceYears(profile.experienceYears || "");
      setEditBio(profile.bio || "");
    }
  }, [profile]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center text-gray-300">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="font-medium text-gray-400">Đang tải hồ sơ cá nhân...</p>
      </div>
    );
  }

  const isExpert = profile.role === "expert";

  // Handle Save Edit Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setEditError(null);

    const finalUniversity =
      editUniversity === "Khác"
        ? editCustomUniversity || "Đại học Tự do"
        : editUniversity;

    try {
      await updateProfile({
        full_name: editFullName,
        role: editRole,
        avatar_id: editAvatarId,
        avatar_url: editAvatarUrl || null,
        university: editRole === "student" ? finalUniversity : null,
        major: editRole === "student" ? editMajor : null,
        academic_year: editRole === "student" ? editAcademicYear : null,
        expert_title: editRole === "expert" ? editExpertTitle : null,
        expert_field: editRole === "expert" ? editExpertField : null,
        experience_years: editRole === "expert" ? editExperienceYears : null,
        bio: editBio,
        verified_expert: editRole === "expert",
        trust_score: editRole === "expert" ? 98 : profile.trustScore,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditModalOpen(false);
      }, 900);
    } catch (err) {
      setEditError(err.message || "Không thể cập nhật hồ sơ.");
    } finally {
      setIsSaving(false);
    }
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
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
            >
              <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- MAIN PROFILE CONTAINER ---------------- */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 relative z-10">
        {/* Profile Card Header */}
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl overflow-hidden shadow-glass-deep">
          {/* Cover Banner with Aurora Glow */}
          <div
            className={`h-44 sm:h-56 w-full relative ${
              isExpert
                ? "bg-gradient-to-r from-amber-900/60 via-purple-900/50 to-indigo-950"
                : "bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-space-950"
            }`}
          >
            <div className="absolute inset-0 bg-shimmer opacity-20" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-300">
                ID: #{String(profile.id || "").length > 8 ? `${String(profile.id).slice(0, 8)}...` : String(profile.id || "1")}
              </span>
            </div>
          </div>

          {/* User Info Bar */}
          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar with Glow & Edit Trigger */}
              <div className="relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
                <AvatarDisplay
                  avatarId={profile.avatarId}
                  avatarUrl={profile.avatarUrl}
                  role={profile.role}
                  size="2xl"
                  showBadge={true}
                  isInteractive={true}
                />
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1 backdrop-blur-xs">
                  <Edit3 className="w-4 h-4" /> Đổi
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all hover:scale-102"
                >
                  <Edit3 className="w-4 h-4" /> Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert("Đã sao chép liên kết trang cá nhân!");
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
                  title="Chia sẻ Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title & Badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {profile.fullName}
                </h1>

                {/* Role Badge */}
                {isExpert ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Chuyên Gia Uy Tín StudentHub
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 text-xs font-bold flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    Sinh Viên Xác Thực
                  </span>
                )}

                {/* Email Verified Badge */}
                {profile.verifiedStudent && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Email Trường Đã Xác Minh
                  </span>
                )}
              </div>

              {/* Subtitle / Affiliation */}
              <p className="text-sm text-gray-300 flex flex-wrap items-center gap-3">
                {isExpert ? (
                  <>
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" /> {profile.expertTitle}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-gray-400" /> {profile.expertField}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400">{profile.experienceYears}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-indigo-400" /> {profile.university}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-gray-400" /> {profile.major}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400">{profile.academicYear}</span>
                  </>
                )}
              </p>

              {/* Bio */}
              <p className="text-sm text-gray-400 max-w-3xl leading-relaxed pt-1">
                {profile.bio}
              </p>

              {/* Stats Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-xs text-gray-400">Điểm Uy Tín (Karma)</p>
                  <p className="text-xl font-black text-indigo-300 mt-0.5">{profile.trustScore} pts</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-xs text-gray-400">Đánh giá chất lượng</p>
                  <p className="text-xl font-black text-amber-300 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {profile.rating || 4.95}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-xs text-gray-400">Câu giải đáp</p>
                  <p className="text-xl font-black text-white mt-0.5">{profile.answersCount || 12}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-xs text-gray-400">Câu hỏi thảo luận</p>
                  <p className="text-xl font-black text-white mt-0.5">{profile.questionsCount || 5}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- TABS & CONTENT ---------------- */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            {[
              { id: "overview", label: "Tổng quan & Kỹ năng" },
              { id: "activities", label: "Hoạt động & Hỏi đáp" },
              { id: "badges", label: "Huy hiệu & Thành tích" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Thông tin học vấn / chuyên môn chi tiết */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {isExpert ? <Award className="w-5 h-5 text-amber-400" /> : <GraduationCap className="w-5 h-5 text-indigo-400" />}
                  {isExpert ? "Hồ Sơ Chuyên Môn" : "Thông Tin Học Vấn"}
                </h3>
                <div className="space-y-3 text-xs sm:text-sm">
                  {isExpert ? (
                    <>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Chức danh:</span>
                        <span className="font-semibold text-white">{profile.expertTitle}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Lĩnh vực:</span>
                        <span className="font-semibold text-amber-300">{profile.expertField}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Kinh nghiệm:</span>
                        <span className="font-semibold text-white">{profile.experienceYears}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400">Trạng thái xác thực:</span>
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> Đã xác thực uy tín
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Trường Đại học:</span>
                        <span className="font-semibold text-white">{profile.university}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Ngành học:</span>
                        <span className="font-semibold text-indigo-300">{profile.major}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Khóa sinh viên:</span>
                        <span className="font-semibold text-white">{profile.academicYear}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400">Email:</span>
                        <span className="font-semibold text-gray-300">{profile.email}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Box 2: Kỹ năng & Lĩnh vực quan tâm */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Kỹ Năng & Lĩnh Vực Chuyên Sâu
                </h3>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(isExpert
                    ? [
                        "Trí tuệ nhân tạo (AI/ML)",
                        "Python & PyTorch",
                        "System Architecture",
                        "Cloud Computing (AWS/GCP)",
                        "Code Review & Mentoring",
                        "Tư vấn Định hướng IT",
                      ]
                    : [
                        "Lập trình C/C++",
                        "React & Next.js",
                        "Cấu trúc dữ liệu & Giải thuật",
                        "Trí tuệ nhân tạo cơ bản",
                        "Tiếng Anh Chuyên ngành",
                        "Ôn thi học phần Đại cương",
                      ]
                  ).map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-indigo-200 hover:border-indigo-500/40 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Box 3: Top 3 Dự án GitHub nổi bật (Chuyên gia) */}
              {isExpert && profile.topRepos && profile.topRepos.length > 0 && (
                <div className="md:col-span-2 p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
                      <FolderGit2 className="w-5 h-5 text-amber-400" />
                      3 Dự Án Nổi Bật Trên GitHub ({profile.githubUsername ? `@${profile.githubUsername}` : "GitHub"})
                    </h3>
                    {profile.githubUsername && (
                      <a
                        href={`https://github.com/${profile.githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold"
                      >
                        <GithubIcon className="w-3.5 h-3.5" /> Xem trang GitHub
                      </a>
                    )}
                  </div>

                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.12,
                        },
                      },
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1"
                  >
                    {profile.topRepos.map((repo) => (
                      <motion.a
                        variants={{
                          hidden: { opacity: 0, y: 15, scale: 0.95 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                            },
                          },
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={repo.id || repo.name}
                        href={repo.htmlUrl || repo.html_url || `https://github.com/${profile.githubUsername}/${repo.name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 rounded-xl bg-black/40 border border-amber-500/20 hover:border-amber-400/60 transition-all flex flex-col justify-between group/gh shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white group-hover/gh:text-amber-300 transition-colors truncate">
                              {repo.name}
                            </h4>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          </div>
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                            {repo.description || "Dự án mã nguồn mở đóng góp cho cộng đồng."}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-amber-300 font-semibold">
                          <span>⭐ {repo.stars || 0} stars</span>
                          <span className="text-gray-400">{repo.language || "Mã nguồn"}</span>
                        </div>
                      </motion.a>
                    ))}
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVITIES */}
          {activeTab === "activities" && (
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Lịch Sử Đóng Góp & Hỏi Đáp Gần Đây
              </h3>
              <div className="space-y-3">
                {[
                  {
                    title: "Hướng dẫn cài đặt môi trường PyTorch CUDA trên Windows cho sinh viên",
                    type: "Giải đáp chuyên gia",
                    votes: 24,
                    date: "Hôm qua",
                  },
                  {
                    title: "Cách giải bài toán tìm đường đi ngắn nhất bằng Dijkstra trong đồ thị có hướng?",
                    type: "Câu hỏi thảo luận",
                    votes: 15,
                    date: "3 ngày trước",
                  },
                ].map((act, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors cursor-pointer">
                        {act.title}
                      </h4>
                      <span className="text-xs text-indigo-400 mt-1 inline-block">
                        {act.type} • {act.date}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-300 whitespace-nowrap">
                      ▲ {act.votes} Votes
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BADGES */}
          {activeTab === "badges" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  title: isExpert ? "⭐ Chuyên Gia Uy Tín" : "🎓 Sinh Viên Tiên Phong",
                  desc: isExpert ? "Được cấp chứng nhận chuyên gia uy tín từ StudentHub AI" : "Thành viên gia nhập sớm trong cộng đồng",
                  color: isExpert ? "border-amber-400/50 bg-amber-500/10 text-amber-300" : "border-indigo-400/50 bg-indigo-500/10 text-indigo-300",
                },
                {
                  title: "🛡️ Trạng Thái Xác Thực",
                  desc: "Đã xác thực danh tính và thông tin email học tập",
                  color: "border-emerald-400/50 bg-emerald-500/10 text-emerald-300",
                },
                {
                  title: "🤖 AI Explorer",
                  desc: "Tích cực sử dụng trợ lý AI trong giải đáp và học tập",
                  color: "border-cyan-400/50 bg-cyan-500/10 text-cyan-300",
                },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border ${badge.color} backdrop-blur-xl space-y-2`}
                >
                  <h4 className="text-base font-bold">{badge.title}</h4>
                  <p className="text-xs text-gray-400">{badge.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ---------------- MODAL CHỈNH SỬA HỒ SƠ ---------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-space-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" /> Chỉnh Sửa Hồ Sơ & Đổi Avatar
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Đã lưu cập nhật thành công!
              </div>
            )}

            {editError && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Chọn Vai trò */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Vai trò của bạn
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditRole("student");
                      if (editAvatarId.startsWith("expert")) setEditAvatarId("student-tech");
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      editRole === "student"
                        ? "bg-indigo-950/50 border-indigo-400 ring-2 ring-indigo-400/40 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-bold text-sm">🎓 Sinh viên / Người học</p>
                    <p className="text-[11px] text-gray-400 mt-1">Học tập, hỏi bài, ôn thi</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditRole("expert");
                      if (editAvatarId.startsWith("student")) setEditAvatarId("expert-ai");
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      editRole === "expert"
                        ? "bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/40 text-amber-200"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-bold text-sm">⭐ Chuyên gia uy tín</p>
                    <p className="text-[11px] text-gray-400 mt-1">Giải đáp, tư vấn, mentoring</p>
                  </button>
                </div>
              </div>

              {/* Chọn Avatar Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Chọn Avatar
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {AVATAR_LIST.map((av) => (
                    <div
                      key={av.id}
                      onClick={() => {
                        setEditAvatarId(av.id);
                        setEditAvatarUrl("");
                      }}
                      className={`cursor-pointer p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        editAvatarId === av.id && !editAvatarUrl
                          ? "border-indigo-400 bg-indigo-950/40 ring-2 ring-indigo-400/40 scale-105"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <AvatarDisplay avatarId={av.id} role={av.role} size="sm" />
                      <span className="text-[10px] text-gray-300 font-semibold line-clamp-1">
                        {av.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Họ và tên hiển thị
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Field chi tiết theo vai trò */}
              {editRole === "student" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Trường Đại học
                    </label>
                    <select
                      value={editUniversity}
                      onChange={(e) => setEditUniversity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#111522] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      {VIETNAM_UNIVERSITIES.map((u) => (
                        <option key={u} value={u} className="bg-[#111522]">
                          {u}
                        </option>
                      ))}
                      <option value="Khác" className="bg-[#111522]">Trường khác...</option>
                    </select>
                    {editUniversity === "Khác" && (
                      <input
                        type="text"
                        placeholder="Tên trường của bạn"
                        value={editCustomUniversity}
                        onChange={(e) => setEditCustomUniversity(e.target.value)}
                        className="mt-2 w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Ngành học
                    </label>
                    <input
                      type="text"
                      value={editMajor}
                      onChange={(e) => setEditMajor(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                      Chức danh chuyên gia
                    </label>
                    <input
                      type="text"
                      value={editExpertTitle}
                      onChange={(e) => setEditExpertTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-amber-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                      Lĩnh vực chuyên sâu
                    </label>
                    <select
                      value={editExpertField}
                      onChange={(e) => setEditExpertField(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#111522] border border-amber-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                    >
                      {EXPERT_FIELDS.map((f) => (
                        <option key={f} value={f} className="bg-[#111522]">
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Giới thiệu ngắn (Bio)
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
