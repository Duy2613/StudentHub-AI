"use client";

// app/profile/page.jsx
//
// Hồ sơ cá nhân & Thang điểm uy tín StudentHub AI (Saffron Finance x Meer Mohsin 3D):
// - WebGL Real-time Fluid Dynamics Canvas theo con trỏ chuột 60fps
// - Quỹ đạo thiên văn 3D Astrolabe & vệ tinh bay quanh chu vi màn hình
// - Saffron Swiss Grid Identity Cards với đường viền tóc hairline (#47140b) và dấu chữ thập (+)
// - Nút HỦY & ĐÓNG QUAY LẠI TRANG rõ ràng, tiện lợi
// - Thang điểm 0-100 pts + Huy hiệu Cố vấn / Sinh viên xác thực .edu

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
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMohsinPerimeter3DOrbit from "@/components/ui/SaffronMohsinPerimeter3DOrbit";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";
import SaffronSwissCrosshairGrid from "@/components/ui/SaffronSwissCrosshairGrid";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import ModernNavbar from "@/components/layout/ModernNavbar";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import { saffronAudio } from "@/lib/audio/saffronAudio";
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

  // Handle Cancel & Close to return back
  const handleCancelAndGoBack = () => {
    saffronAudio.playClick(400);
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#150604] flex flex-col items-center justify-center text-[#ece7e0]">
        <div className="w-12 h-12 rounded-full border-2 border-[#ffbc09] border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs text-[#ffbc09] tracking-wider uppercase">[ INITIALIZING PROFILE // SAFFRON AI ENGINE ]</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#150604] flex flex-col items-center justify-center p-4">
        <p className="text-white mb-4">Không tìm thấy thông tin hồ sơ.</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="py-2.5 px-5 rounded-xl bg-[#ffbc09] text-[#150604] font-bold text-xs"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const isExpert = profile.role === "expert";
  const trustScore = profile.trustScore || 80;
  const isTopExpertBadge = trustScore >= 80;
  const isEduVerified = !!profile.eduEmailVerified;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    saffronAudio.playClick(800);
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
      saffronAudio.playSuccessChime();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditModalOpen(false);
      }, 800);
    } catch (err) {
      saffronAudio.playAlertBuzz();
      setEditError(err.message || "Không thể lưu cập nhật.");
    } finally {
      setIsSaving(false);
    }
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

      {session ? (
        <CollapsibleSidebar className="hidden md:flex relative z-40" />
      ) : (
        <header className="overlay-nav-layer">
          <ModernNavbar />
        </header>
      )}

      <main className="flex-1 layout-safe-container pt-24 sm:pt-28 pb-40 space-y-8 relative z-10 min-w-0 font-human">
        
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="rounded-2xl border border-[#47140b]" />

        {/* Top Navigation & Explicit Cancel / Close Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleCancelAndGoBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#210a07] hover:bg-[#2f0e09] text-[#ece7e0] hover:text-[#ffbc09] border border-[#47140b] hover:border-[#ffbc09]/50 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Hủy thao tác và quay về trang trước"
          >
            <ArrowLeft className="w-4 h-4 text-[#ffbc09]" />
            <span>[ ✕ HỦY &amp; ĐÓNG // QUAY LẠI TRANG ]</span>
          </button>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
            <button
              type="button"
              onClick={() => {
                saffronAudio.playClick(600);
                setIsEditModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,188,9,0.35)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer font-mono"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh Sửa Hồ Sơ</span>
            </button>
          </div>
        </div>

        {/* Profile Identity Card (Swiss Grid Style) */}
        <SaffronSwissCrosshairGrid sectionTag="01 // USER_IDENTITY_CARD" className="p-0 overflow-hidden">
          {/* Cover Header */}
          <div
            className={`h-40 sm:h-48 w-full relative ${
              isExpert
                ? "bg-gradient-to-r from-[#2f0e09] via-[#150604] to-[#ffbc09]/20"
                : "bg-gradient-to-r from-[#210a07] via-[#150604] to-[#38bdf8]/20"
            }`}
          >
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#150604]/80 backdrop-blur-md border border-[#47140b] text-[11px] font-mono font-semibold text-[#ffd15c]">
              MÃ HỒ SƠ: #{String(profile.id || "1").slice(0, 8)}
            </div>
          </div>

          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar with Interactive Edit */}
              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  saffronAudio.playClick(600);
                  setIsEditModalOpen(true);
                }}
              >
                <AvatarDisplay
                  avatarId={profile.avatarId}
                  avatarUrl={profile.avatarUrl}
                  role={profile.role}
                  size="2xl"
                  showBadge={true}
                  isInteractive={true}
                />
                <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[#ffbc09] text-xs font-bold gap-1 backdrop-blur-xs font-mono">
                  <Edit3 className="w-4 h-4" /> ĐỔI AVATAR
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(600);
                    setIsEditModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] hover:border-[#ffbc09]/50 text-white text-xs font-bold transition-all cursor-pointer font-mono"
                >
                  [ ĐỔI VAI TRÒ / AVATAR ]
                </button>
              </div>
            </div>

            {/* Profile Information & Badges */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {profile.fullName}
                </h1>

                {/* Auto Badge "Chuyên Gia Uy Tín" */}
                {isTopExpertBadge ? (
                  <span className="px-3 py-1 rounded-full bg-[#ffbc09]/20 border border-[#ffbc09]/50 text-[#ffbc09] text-xs font-bold font-mono flex items-center gap-1 shadow-[0_0_15px_rgba(255,188,9,0.3)]">
                    <Star className="w-3.5 h-3.5 fill-[#ffbc09] text-[#ffbc09]" />
                    ⭐ CỐ VẤN UY TÍN ({trustScore} PTS)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8] text-xs font-bold font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    SINH VIÊN THÀNH VIÊN ({trustScore} PTS)
                  </span>
                )}

                {isEduVerified && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    EMAIL .EDU VERIFIED (+30 PTS)
                  </span>
                )}
              </div>

              {/* Bio & Details */}
              <p className="text-sm text-[#ece7e0]/80 max-w-3xl leading-relaxed">
                {profile.bio || "Thành viên tích cực tham gia mạng lưới phòng chống lừa đảo sinh viên StudentHub AI."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#ece7e0]/70">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#ffbc09]" />
                  <span>{isExpert ? (profile.organization || "Tổ chức chuyên môn") : (profile.university || "Đại học Thành viên")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#38bdf8]" />
                  <span>{isExpert ? (profile.expertField || "Lĩnh vực tư vấn") : (profile.major || "Chuyên ngành đào tạo")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#ca56ed]" />
                  <span>{isExpert ? (profile.experienceYears || "3+ năm kinh nghiệm") : `Niên khóa: ${profile.academicYear || "2024 - 2028"}`}</span>
                </div>
              </div>
            </div>
          </div>
        </SaffronSwissCrosshairGrid>

        {/* 3 Overview Stat Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SaffronSwissCrosshairGrid sectionTag="RADAR // TRUST" className="p-6 my-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#ece7e0]/60 uppercase">
              <span>ĐIỂM UY TÍN TÍCH LŨY</span>
              <Sparkles className="w-4 h-4 text-[#ffbc09]" />
            </div>
            <div className="text-3xl font-extrabold text-[#ffd15c] font-mono">{trustScore} / 100 PTS</div>
            <p className="text-xs text-[#ece7e0]/70">Được đánh giá dựa trên mức độ chính xác của các cảnh báo và bình chọn cộng đồng.</p>
          </SaffronSwissCrosshairGrid>

          <SaffronSwissCrosshairGrid sectionTag="ACTIVITY // SCAMS" className="p-6 my-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#ece7e0]/60 uppercase">
              <span>BÁO CÁO ĐÃ GỬI</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">14 CA</div>
            <p className="text-xs text-[#ece7e0]/70">Đã phát hiện và cảnh báo thành công các vụ việc nghi vấn lừa cọc và học bổng giả.</p>
          </SaffronSwissCrosshairGrid>

          <SaffronSwissCrosshairGrid sectionTag="COMMUNITY // VOTES" className="p-6 my-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#ece7e0]/60 uppercase">
              <span>BÌNH CHỌN HỮU ÍCH</span>
              <Star className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div className="text-3xl font-extrabold text-[#38bdf8] font-mono">128 LƯỢT</div>
            <p className="text-xs text-[#ece7e0]/70">Nhận được sự đồng thuận và cảm ơn từ các bạn sinh viên trong diễn đàn.</p>
          </SaffronSwissCrosshairGrid>
        </div>

        {/* Modal Chỉnh Sửa Hồ Sơ */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d0403]/85 backdrop-blur-xl overflow-y-auto">
            <div className="w-full max-w-2xl bg-[#150604] border border-[#47140b] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 font-human">
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#ffbc09]" /> Chỉnh Sửa Hồ Sơ &amp; Đổi Avatar
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(400);
                    setIsEditModalOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] text-[#ece7e0]/70 hover:text-white cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Chọn Avatar */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-2 font-mono">
                    [ 01 ] CHỌN AVATAR NHẬN DIỆN
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {AVATAR_LIST.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          saffronAudio.playClick(500);
                          setEditAvatarId(av.id);
                        }}
                        className={`p-2 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          editAvatarId === av.id
                            ? "bg-[#ffbc09]/20 border-[#ffbc09] shadow-[0_0_15px_rgba(255,188,9,0.3)]"
                            : "bg-[#210a07] border-[#47140b] hover:border-white/30"
                        }`}
                      >
                        <AvatarDisplay avatarId={av.id} size="sm" />
                        <span className="text-[9px] text-[#ece7e0]/60 truncate w-full text-center">{av.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tên và Vai trò */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5 font-mono">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-sm text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5 font-mono">
                      Vai trò tài khoản
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                    >
                      <option value="student">Sinh viên</option>
                      <option value="expert">Chuyên gia / Cố vấn</option>
                    </select>
                  </div>
                </div>

                {/* Thông tin sinh viên hoặc chuyên gia */}
                {editRole === "student" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5 font-mono">
                        Trường Đại học
                      </label>
                      <select
                        value={editUniversity}
                        onChange={(e) => setEditUniversity(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                      >
                        {VIETNAM_UNIVERSITIES.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5 font-mono">
                        Chuyên ngành
                      </label>
                      <input
                        type="text"
                        placeholder="Khoa học Máy tính..."
                        value={editMajor}
                        onChange={(e) => setEditMajor(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5 font-mono">
                        Lĩnh vực chuyên môn
                      </label>
                      <select
                        value={editExpertField}
                        onChange={(e) => setEditExpertField(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                      >
                        {EXPERT_FIELDS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5 font-mono">
                        Tổ chức / Đơn vị
                      </label>
                      <input
                        type="text"
                        placeholder="Viện An ninh mạng..."
                        value={editOrganization}
                        onChange={(e) => setEditOrganization(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09]"
                      />
                    </div>
                  </div>
                )}

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#ece7e0]/80 mb-1.5 font-mono">
                    Giới thiệu bản thân (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Viết một vài dòng về bạn..."
                    className="w-full p-4 rounded-xl bg-[#210a07] border border-[#47140b] text-xs text-[#ece7e0] focus:outline-none focus:border-[#ffbc09] resize-none"
                  />
                </div>

                {/* Action Buttons: Hủy và Lưu */}
                <div className="flex items-center justify-between pt-3 border-t border-[#47140b]">
                  <button
                    type="button"
                    onClick={() => {
                      saffronAudio.playClick(400);
                      setIsEditModalOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] text-xs font-bold text-[#ece7e0]/80 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>[ ✕ HỦY &amp; ĐÓNG CỬA SỔ ]</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer font-mono flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#150604]" />
                        <span>ĐANG LƯU...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>ĐÃ LƯU THÀNH CÔNG!</span>
                      </>
                    ) : (
                      <span>LƯU HỒ SƠ MỚI</span>
                    )}
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
