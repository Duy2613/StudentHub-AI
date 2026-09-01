"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Award, Building, BookOpen, CheckCircle2, Calendar, X, ArrowLeft, Edit3 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";
import AeroMissionControlBackdrop from "@/components/ui/AeroMissionControlBackdrop";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";
import SaffronSwissCrosshairGrid from "@/components/ui/SaffronSwissCrosshairGrid";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
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
      <div className="min-h-screen bg-[#070403] flex flex-col items-center justify-center text-[#ece7e0]">
        <div className="w-12 h-12 rounded-full border-2 border-[#ffbc09] border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs text-[#ffbc09] tracking-wider uppercase">[ INITIALIZING PROFILE // SAFFRON AI ENGINE ]</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#070403] flex flex-col items-center justify-center p-4">
        <h1 className="text-white mb-4 text-center">Không tìm thấy thông tin hồ sơ.</h1>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="py-2.5 px-5 rounded-xl bg-[#ffbc09] text-[#150604] font-bold text-xs"
        >
          Đăng nhập ngay
        </button>
      </main>
    );
  }

  const isExpert = profile.role === "expert";
  const trustScore = typeof profile.trustScore === "number" && Number.isFinite(profile.trustScore)
    ? Math.max(0, Math.min(100, profile.trustScore))
    : null;
  const isEduVerified = !!profile.eduEmailVerified;
  const hasVerifiedStudentProof = profile.verifiedStudent === true || isEduVerified;

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
    <UnifiedAppShell>
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. High-End Aerospace Aviation Terminal Backdrop (Clean & Non-overlapping) */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_07_GAMMA // ACADEMIC_IDENTITY"
        gridDensity={52}
        showRadarRings={false}
      />

      {/* 2. Interactive WebGL Fluid Smoke Trail */}
      <MohsinFluidCanvas opacity={0.35} particleDensity={35} />

      {/* 3. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 4. Studio Controls */}
      <BackgroundsAndEffectsStudio />

      <main className="flex-1 layout-safe-container pt-24 sm:pt-28 pb-40 space-y-8 relative z-10 min-w-0 font-human">
        
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="rounded-2xl border border-[#47140b]/60" />

        {/* Top Navigation & Explicit Cancel / Close Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleCancelAndGoBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#210a07] hover:bg-[#2f0e09] text-[#ece7e0] hover:text-[#ffbc09] border border-[#47140b] hover:border-[#ffbc09]/50 text-xs font-bold transition-all shadow-sm cursor-pointer font-mono"
            title="Hủy thao tác và quay về trang trước"
          >
            <ArrowLeft className="w-4 h-4 text-[#ffbc09]" />
            <span>[ ✕ HỦY &amp; ĐÓNG // QUAY LẠI TRANG ]</span>
          </button>

          <div className="flex items-center gap-3">
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
              MÃ HỒ SƠ: {profile.id ? `#${String(profile.id).slice(0, 8)}` : "CHƯA CÓ ID"}
            </div>
          </div>

          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="p-1 rounded-full bg-[#150604] border-2 border-[#ffbc09] shadow-2xl">
                  <AvatarDisplay avatarId={profile.avatarId} size="xl" />
                </div>
              </div>

              {/* Trust Badge Meter */}
              <div className="flex items-center gap-4 bg-[#210a07] border border-[#47140b] p-3 rounded-2xl">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#ece7e0]/60 uppercase block">ĐIỂM TÍN NHIỆM:</span>
                  <span className="text-xl sm:text-2xl font-black text-[#ffbc09] font-mono">
                    {trustScore === null ? "CHƯA CÔNG BỐ" : <>{trustScore} <span className="text-xs font-normal text-white">/ 100 PTS</span></>}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#ffbc09]/20 border border-[#ffbc09]/40 flex items-center justify-center text-[#ffbc09]">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* User Info Details */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {profile.fullName || "Chưa đặt tên"}
                </h1>
                {isExpert ? (
                  <span className="px-3 py-1 rounded-full bg-[#ffbc09]/20 text-[#ffbc09] text-xs font-mono font-bold border border-[#ffbc09]/40">
                    ⭐ CỐ VẤN / CHUYÊN GIA
                  </span>
                ) : hasVerifiedStudentProof ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    SINH VIÊN XÁC THỰC
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-mono font-bold border border-white/15">
                    SINH VIÊN · CHƯA XÁC MINH
                  </span>
                )}
                {isEduVerified && (
                  <span className="px-3 py-1 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] text-xs font-mono font-bold border border-[#38bdf8]/40">
                    ✓ EMAIL .EDU.VN
                  </span>
                )}
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-[#ece7e0]/80 max-w-3xl leading-relaxed">
                {profile.bio || "Chưa có mô tả được công bố."}
              </p>

              {/* Academic Details Meta */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#ece7e0]/70 pt-2 border-t border-[#47140b]/60">
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#ffbc09]" />
                  <span>{profile.university || "Trường Đại học"}</span>
                </div>
                {profile.major && (
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#38bdf8]" />
                    <span>{profile.major}</span>
                  </div>
                )}
                {profile.academicYear && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Khóa: {profile.academicYear}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SaffronSwissCrosshairGrid>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#47140b] pb-2">
          <button
            type="button"
            onClick={() => {
              saffronAudio.playClick(600);
              setActiveTab("overview");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
            }`}
          >
            [01] TỔNG QUAN HỒ SƠ
          </button>
          <button
            type="button"
            onClick={() => {
              saffronAudio.playClick(650);
              setActiveTab("scams");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "scams"
                ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
            }`}
          >
            [02] CẢNH BÁO ĐÃ ĐĂNG
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl space-y-3">
              <span className="text-[10px] font-mono text-[#ffbc09] uppercase block">ĐÓNG GÓP THỰC CHỨNG</span>
              <span className="text-3xl font-black text-white font-mono">12</span>
              <p className="text-xs text-[#ece7e0]/60">Lần đối soát bài đăng khả nghi trên Diễn đàn</p>
            </div>
            <div className="p-6 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl space-y-3">
              <span className="text-[10px] font-mono text-[#38bdf8] uppercase block">BÌNH CHỌN HỮU ÍCH</span>
              <span className="text-3xl font-black text-white font-mono">86</span>
              <p className="text-xs text-[#ece7e0]/60">Lượt cảm ơn từ cộng đồng sinh viên</p>
            </div>
            <div className="p-6 rounded-3xl bg-[#120604]/90 border border-[#47140b] backdrop-blur-2xl space-y-3">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block">CẤP ĐỘ BẢO VỆ SỐ</span>
              <span className="text-3xl font-black text-white font-mono">LEVEL 4</span>
              <p className="text-xs text-[#ece7e0]/60">Hệ thống kích hoạt bảo vệ chủ động 24/7</p>
            </div>
          </div>
        )}

        {activeTab === "scams" && (
          <div className="p-8 text-center rounded-3xl bg-[#120604]/90 border border-[#47140b] space-y-3">
            <ShieldAlert className="w-10 h-10 text-[#ffbc09] mx-auto opacity-60" />
            <p className="text-sm font-bold text-white">Bạn chưa có báo cáo cảnh báo nào vi phạm</p>
            <p className="text-xs text-[#ece7e0]/60">Khi bạn báo cáo một đường link hoặc số tài khoản lừa đảo, báo cáo sẽ hiển thị tại đây.</p>
          </div>
        )}
      </main>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-[#150604] border border-[#ffbc09]/50 shadow-2xl space-y-4 font-human">
            <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
              <h3 className="text-base font-bold text-white font-mono">CHỈNH SỬA HỒ SƠ CÁ NHÂN</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-[#ece7e0]/60 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-xs text-rose-300">
                {editError}
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-xs text-emerald-300">
                ✓ Lưu thay đổi hồ sơ thành công!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                  HỌ VÀ TÊN
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#ffbc09]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                  CHỌN AVATAR
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_LIST.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setEditAvatarId(av.id)}
                      className={`p-1 rounded-xl border transition-all ${
                        editAvatarId === av.id
                          ? "border-[#ffbc09] bg-[#ffbc09]/20 scale-105"
                          : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <AvatarDisplay avatarId={av.id} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                    TRƯỜNG ĐẠI HỌC
                  </label>
                  <select
                    value={editUniversity}
                    onChange={(e) => setEditUniversity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09] font-mono"
                  >
                    {VIETNAM_UNIVERSITIES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                    CHUYÊN NGÀNH
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Khoa học Máy tính..."
                    value={editMajor}
                    onChange={(e) => setEditMajor(e.target.value)}
                    className="w-full px-4 py-2 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#ffbc09] font-bold mb-1">
                  TIỂU SỬ
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-4 py-2 bg-[#210a07] border border-[#47140b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#ffbc09]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-transparent border border-[#47140b] text-xs font-mono font-bold text-[#ece7e0]/70 hover:text-white cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#ffbc09] hover:bg-[#ffd15c] text-[#150604] text-xs font-mono font-bold uppercase shadow-md cursor-pointer transition-all"
                >
                  {isSaving ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </UnifiedAppShell>
  );
}
