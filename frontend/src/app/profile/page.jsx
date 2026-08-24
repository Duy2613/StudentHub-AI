"use client";

// app/profile/page.jsx
// Hồ sơ cá nhân & Thang điểm uy tín StudentHub AI:
// - Thang điểm 0–100 điểm (+1/+2 điểm khi xác nhận đúng, -1/-2 khi spam)
// - Đạt 80–100 điểm -> Tự động gắn nhãn "⭐ Chuyên Gia Uy Tín"
// - Email trường (.edu) -> Xác thực +30 điểm
// - Lịch sử cảnh báo lừa đảo & bài viết diễn đàn
// - Đổi avatar trong bộ có sẵn

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Star,
  Award,
  GraduationCap,
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
  ArrowLeft,
  Edit3,
  Clock
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import ModernNavbar from "@/components/layout/ModernNavbar";
import TactileButton from "@/components/ui/TactileButton";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import {
  AVATAR_LIST,
  VIETNAM_UNIVERSITIES,
  EXPERT_FIELDS,
} from "@/lib/avatars";

export default function ProfilePage() {
  const router = useRouter();
  const { session, profile, updateProfile, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "scams" | "forum"
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form State
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState("student");
  const [editAvatarId, setEditAvatarId] = useState("student-tech");
  const [editUniversity, setEditUniversity] = useState(VIETNAM_UNIVERSITIES[0]);
  const [editMajor, setEditMajor] = useState("");
  const [editAcademicYear, setEditAcademicYear] = useState("2024 - 2028");
  const [editBio, setEditBio] = useState("");
  const [editExpertTitle, setEditExpertTitle] = useState("Chuyên gia An ninh");
  const [editExpertField, setEditExpertField] = useState(EXPERT_FIELDS[0]);
  const [editExperienceYears, setEditExperienceYears] = useState("3+ năm");
  const [editOrganization, setEditOrganization] = useState("Tập đoàn An ninh Mạng / Học viện");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (profile) {
      setEditFullName(profile.fullName || "");
      setEditRole(profile.role || "student");
      setEditAvatarId(profile.avatarId || "student-tech");
      setEditUniversity(profile.university || VIETNAM_UNIVERSITIES[0]);
      setEditMajor(profile.major || "");
      setEditAcademicYear(profile.academicYear || "2024 - 2028");
      setEditBio(profile.bio || "");
      setEditExpertTitle(profile.expertTitle || "Chuyên gia An ninh");
      setEditExpertField(profile.expertField || EXPERT_FIELDS[0]);
      setEditExperienceYears(profile.experienceYears || "3+ năm");
      setEditOrganization(profile.organization || "Tập đoàn An ninh Mạng / Học viện");
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-space-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center p-4">
        <p className="text-white mb-4">Không tìm thấy thông tin hồ sơ.</p>
        <TactileButton variant="primary" onClick={() => router.push("/login")}>
          Đăng nhập ngay
        </TactileButton>
      </div>
    );
  }

  const isExpert = profile.role === "expert";
  const trustScore = profile.trustScore || 80;
  const isTopExpertBadge = trustScore >= 80;
  const isEduVerified = !!profile.eduEmailVerified;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setEditError("");
    try {
      await updateProfile({
        fullName: editFullName,
        role: editRole,
        avatarId: editAvatarId,
        university: editUniversity,
        major: editMajor,
        academicYear: editAcademicYear,
        bio: editBio,
        expertTitle: editExpertTitle,
        expertField: editExpertField,
        experienceYears: editExperienceYears,
        organization: editOrganization,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditModalOpen(false);
      }, 800);
    } catch (err) {
      setEditError(err.message || "Không thể lưu cập nhật.");
    } finally {
      setIsSaving(false);
    }
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

      {session ? (
        <CollapsibleSidebar className="hidden md:flex relative z-40" />
      ) : (
        <header className="overlay-nav-layer">
          <ModernNavbar />
        </header>
      )}

      <main className="flex-1 layout-safe-container pt-24 sm:pt-32 pb-40 space-y-8 relative z-10 min-w-0">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
          </button>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
            <TactileButton
              variant="primary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              icon={Edit3}
            >
              Chỉnh Sửa Hồ Sơ
            </TactileButton>
          </div>
        </div>

        {/* Profile Identity Card */}
        <div className="relative rounded-3xl border border-white/10 igloo-hologram-card backdrop-blur-2xl overflow-hidden shadow-glass-deep">
          {/* Cover Header */}
          <div
            className={`h-40 sm:h-48 w-full relative ${
              isExpert
                ? "bg-gradient-to-r from-teal-950 via-space-900 to-amber-950/50"
                : "bg-gradient-to-r from-teal-950 via-space-900 to-indigo-950/50"
            }`}
          >
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-300">
              Mã hồ sơ: #{String(profile.id || "1").slice(0, 8)}
            </div>
          </div>

          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar with Interactive Edit */}
              <div
                className="relative group cursor-pointer"
                onClick={() => setIsEditModalOpen(true)}
              >
                <AvatarDisplay
                  avatarId={profile.avatarId}
                  avatarUrl={profile.avatarUrl}
                  role={profile.role}
                  size="2xl"
                  showBadge={true}
                  isInteractive={true}
                />
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1 backdrop-blur-xs">
                  <Edit3 className="w-4 h-4" /> Đổi Avatar
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all"
                >
                  Đổi vai trò / avatar
                </button>
              </div>
            </div>

            {/* Profile Information & Badges */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {profile.fullName}
                </h1>

                {/* Auto Badge "Chuyên Gia Uy Tín" at 80-100 pts */}
                {isTopExpertBadge ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ⭐ Chuyên Gia Uy Tín
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/50 text-teal-300 text-xs font-bold flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                    🎓 Sinh Viên Xác Thực
                  </span>
                )}

                {/* Edu Verified Badge */}
                {isEduVerified && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Email Trường Xác Minh (+30 pts)
                  </span>
                )}
              </div>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-2.5">
                {isExpert ? (
                  <>
                    <span className="font-semibold text-amber-300 flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-400" /> {profile.expertTitle || "Chuyên gia Tư vấn"}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400">{profile.expertField || "An ninh mạng"}</span>
                    <span>•</span>
                    <span className="text-gray-400">{profile.experienceYears || "3+ năm"}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-teal-300 flex items-center gap-1">
                      <Building className="w-4 h-4 text-teal-400" /> {profile.university || "Đại học Thành viên"}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400">{profile.major || "Khoa học & Kỹ thuật"}</span>
                    <span>•</span>
                    <span className="text-gray-400">{profile.academicYear || "2024 - 2028"}</span>
                  </>
                )}
              </p>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-gray-400 max-w-3xl leading-relaxed">
                {profile.bio || "Thành viên tích cực trong cộng đồng phòng chống lừa đảo StudentHub AI."}
              </p>

              {/* Stat Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Điểm Uy Tín</p>
                  <p className="text-2xl font-black text-teal-300 mt-0.5">{trustScore} pts</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Xác nhận đúng</p>
                  <p className="text-2xl font-black text-emerald-400 mt-0.5">+18 lượt</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Cảnh báo đã quét</p>
                  <p className="text-2xl font-black text-white mt-0.5">14 vụ</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center sm:text-left">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Bài đăng diễn đàn</p>
                  <p className="text-2xl font-black text-white mt-0.5">6 bài</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            {[
              { id: "overview", label: "Thông Tin Chuyên Môn / Học Vấn" },
              { id: "scams", label: "Lịch Sử Quét Lừa Đảo" },
              { id: "forum", label: "Bài Đăng Diễn Đàn Của Tôi" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-teal-400 text-space-950 shadow-md shadow-teal-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  {isExpert ? <Award className="w-4 h-4 text-amber-400" /> : <GraduationCap className="w-4 h-4 text-teal-400" />}
                  {isExpert ? "Chi Tiết Chuyên Gia" : "Chi Tiết Sinh Viên"}
                </h3>
                <div className="space-y-3 text-xs sm:text-sm">
                  {isExpert ? (
                    <>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Lĩnh vực chuyên sâu:</span>
                        <span className="font-semibold text-amber-300">{profile.expertField}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Kinh nghiệm:</span>
                        <span className="font-semibold text-white">{profile.experienceYears}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400">Cơ chế điểm:</span>
                        <span className="font-semibold text-teal-300">Cộng đồng xác nhận (+1/+2đ)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Trường Đại học:</span>
                        <span className="font-semibold text-white">{profile.university}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400">Chuyên ngành:</span>
                        <span className="font-semibold text-teal-300">{profile.major}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400">Email:</span>
                        <span className="font-semibold text-gray-300">{profile.email}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Quy Chuẩn Thang Điểm Uy Tín (0–100)
                </h3>
                <ul className="space-y-2.5 text-xs text-gray-300">
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span>Xác thực bằng Email trường (.edu)</span>
                    <strong className="text-emerald-400">+30 điểm</strong>
                  </li>
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span>Cộng đồng xác nhận cảnh báo chính xác</span>
                    <strong className="text-teal-300">+1 đến +2 điểm</strong>
                  </li>
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                    <span>Bị gắn cờ thông tin sai lệch / spam</span>
                    <strong className="text-rose-400">-1 đến -2 điểm</strong>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "scams" && (
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-3">
              {[
                { title: "Kiểm tra link tuyển dụng Shopee nhiệm vụ nạp cọc", risk: "94% Lừa đảo", date: "Hôm qua" },
                { title: "Kiểm tra link phòng trọ ngõ 27 Tạ Quang Bửu", risk: "88% Lừa đảo", date: "3 ngày trước" },
                { title: "Thông báo học bổng chính thống từ sis.hust.edu.vn", risk: "12% An toàn", date: "Tuần trước" },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.date}</p>
                  </div>
                  <span className="font-bold text-teal-300 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
                    {item.risk}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "forum" && (
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-white">Cảnh báo phòng trọ ảo ép cọc tại ngõ 27 Tạ Quang Bửu</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Nhà Trọ • 48 lượt vote uy tín</p>
                </div>
                <span className="font-bold text-teal-300">Đã đăng</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Edit Profile */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-xl bg-space-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-teal-400" /> Chỉnh Sửa Hồ Sơ & Chọn Avatar
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Đã cập nhật thành công!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Chọn Avatar Grid */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                    Chọn Avatar Đại Diện
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {AVATAR_LIST.map((av) => (
                      <div
                        key={av.id}
                        onClick={() => setEditAvatarId(av.id)}
                        className={`cursor-pointer p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          editAvatarId === av.id
                            ? "border-teal-400 bg-teal-950/40 ring-2 ring-teal-400/40 scale-105"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <AvatarDisplay avatarId={av.id} role={av.role} size="sm" />
                        <span className="text-[10px] text-gray-300 line-clamp-1 font-semibold">
                          {av.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                    Họ và tên hiển thị
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                {isExpert ? (
                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-300 mb-1.5">
                      Lĩnh vực chuyên môn
                    </label>
                    <select
                      value={editExpertField}
                      onChange={(e) => setEditExpertField(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#111522] border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {EXPERT_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                      Trường Đại học
                    </label>
                    <select
                      value={editUniversity}
                      onChange={(e) => setEditUniversity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#111522] border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
                    >
                      {VIETNAM_UNIVERSITIES.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                    Giới thiệu ngắn (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                  >
                    Hủy
                  </button>
                  <TactileButton variant="primary" size="sm" type="submit" isLoading={isSaving} showArrow={false}>
                    Lưu Thay Đổi
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
