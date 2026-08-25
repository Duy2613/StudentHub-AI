"use client";

// app/onboarding/page.jsx
// Màn hình Onboarding thiết lập lần đầu:
// - Đầy đủ hiệu ứng đỉnh cao như Trang chủ: RobinPayotRoadCanvas 3D Highway, Film Grain NoiseOverlay
// - Studio hiệu ứng BackgroundsAndEffectsStudio + Thanh phím tắt FloatingDock
// - Bộ điều khiển âm hưởng băng tuyết IglooSoundAmbiencePill
// - Ma trận Bento 3D Holographic Foil phản quang (.igloo-hologram-card)
// - Chọn vai trò: "Người dùng thường" (Sinh viên) hoặc "Chuyên gia uy tín"
// - Chọn 1 Avatar trong bộ có sẵn + Nhập thông tin & Lĩnh vực chuyên môn
// - Tự động đồng bộ Supabase & ASP.NET Core Backend -> Điều hướng về /dashboard

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Building,
  BookOpen,
  Briefcase,
  Star,
  Check,
  ShieldCheck,
  Layers,
  Radio,
  Cpu,
  Activity,
  Zap
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  AVATAR_LIST,
  VIETNAM_UNIVERSITIES,
  EXPERT_FIELDS,
  getAvatarById,
} from "@/lib/avatars";
import AvatarDisplay from "@/components/AvatarDisplay";
import TactileButton from "@/components/ui/TactileButton";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import IglooAuroraDivider from "@/components/ui/IglooAuroraDivider";

export default function OnboardingPage() {
  const router = useRouter();
  const { session, profile, updateProfile, isLoading: isAuthLoading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !session) {
      router.replace("/login");
    }
  }, [session, isAuthLoading, router]);

  const [step, setStep] = useState(1); // 1: Chọn Vai trò, 2: Chọn Avatar, 3: Thông tin chi tiết
  const [role, setRole] = useState("student"); // "student" | "expert"
  const [avatarId, setAvatarId] = useState("student-tech");
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState(VIETNAM_UNIVERSITIES[0]);
  const [major, setMajor] = useState("Kỹ thuật Phần mềm & An toàn Thông tin");
  const [academicYear, setAcademicYear] = useState("K65 (2023 - 2027)");

  // Expert Fields
  const [expertTitle, setExpertTitle] = useState("Chuyên gia An ninh Mạng");
  const [expertField, setExpertField] = useState(EXPERT_FIELDS[0]);
  const [experienceYears, setExperienceYears] = useState("4+ năm kinh nghiệm");
  const [bio, setBio] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize from session / metadata
  useEffect(() => {
    if (session?.user) {
      const meta = session.user.user_metadata || {};
      const initialName = meta.full_name || meta.name || session.user.email?.split("@")[0] || "";
      if (initialName && !fullName) setFullName(initialName);
    }
    if (profile) {
      if (profile.fullName && !fullName) setFullName(profile.fullName);
      if (profile.role) setRole(profile.role === "expert" ? "expert" : "student");
      if (profile.avatarId) setAvatarId(profile.avatarId);
      if (profile.bio && !bio) setBio(profile.bio);
    }
  }, [session, profile]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "expert") {
      setAvatarId("expert-security");
    } else {
      setAvatarId("student-tech");
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);

    const email = session?.user?.email || "";
    let isEdu = false;
    let verifiedUniversity = university;

    try {
      // 1. Verify Edu Email via Backend Source of Truth (Section D.1)
      const eduCheckRes = await fetch("/api/users/verify-edu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const eduCheckData = await eduCheckRes.json();
      if (eduCheckData?.success && eduCheckData?.isEdu) {
        isEdu = true;
        if (eduCheckData.university) verifiedUniversity = eduCheckData.university;
      } else {
        isEdu = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test(email);
      }
    } catch (e) {
      console.warn("Edu verification check fallback:", e);
      isEdu = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test(email);
    }

    const isExpert = role === "expert";
    const finalTrustScore = isExpert ? 98 : isEdu ? 80 : 50;

    try {
      // 2. Sync to API backend (Phần F Data Model)
      await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName: fullName || "Thành viên StudentHub",
          role: isExpert ? "expert" : "student",
          avatarId: avatarId,
          expertField: isExpert ? expertField : null,
          university: !isExpert ? verifiedUniversity : null,
          major: !isExpert ? major : null,
          onboardingCompleted: true,
        }),
      }).catch((e) => console.warn("Sync profile PUT error:", e));

      // 3. Update Auth context & local cache
      await updateProfile({
        full_name: fullName || "Thành viên StudentHub",
        role: isExpert ? "expert" : "student",
        avatar_id: avatarId,
        reputation_score: finalTrustScore,
        trust_score: finalTrustScore,
        university: !isExpert ? verifiedUniversity : null,
        major: !isExpert ? major : null,
        academic_year: !isExpert ? academicYear : null,
        expert_title: isExpert ? expertTitle : null,
        expert_field: isExpert ? expertField : null,
        experience_years: isExpert ? experienceYears : null,
        bio:
          bio ||
          (isExpert
            ? "Chuyên gia cố vấn phòng chống lừa đảo và bảo vệ sinh viên."
            : "Sinh viên tích cực tham gia xác thực và xây dựng cộng đồng an toàn."),
        verified_student: !isExpert && isEdu,
        verified_expert: isExpert,
        onboarded: true,
      });

      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Không thể lưu thông tin hồ sơ.");
      setIsSubmitting(false);
    }
  };

  const selectedAvatarData = getAvatarById(avatarId);

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      {/* 1. 3D Infinite Curving Road Highway Canvas (Robin Payot Signature) */}
      <div className="canvas-bg-layer">
        <RobinPayotRoadCanvas />
      </div>

      {/* 2. Film Grain & Ambient Noise */}
      <NoiseOverlay />

      {/* 3. Floating Quick Tools & Studio */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* 4. Top Ambience Bar */}
      <div className="fixed top-6 right-6 z-40">
        <IglooSoundAmbiencePill />
      </div>

      <div className="max-w-4xl w-full relative z-10 layout-safe-container pb-28">
        {/* Header Branding with Dual Typography */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 backdrop-blur-md mb-3 text-xs font-mono font-bold tracking-wider text-teal-300">
            <span className="w-2 h-2 rounded-full bg-teal-400 igloo-radar-beacon" />
            <span>ONBOARDING PROTOCOL • STEP 0{step} OF 03</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-human font-black text-white tracking-tight">
            Chào Mừng Đến Với StudentHub AI
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-300 font-human max-w-xl mx-auto">
            Chọn vai trò phù hợp và thiết lập danh tính biểu trưng của bạn trong mạng lưới xác thực số quốc gia.
          </p>
        </div>

        {/* Stepper Progress */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-8">
          {[
            { num: 1, label: "Chọn Vai Trò", code: "01. ROLE" },
            { num: 2, label: "Chọn Avatar", code: "02. AVATAR" },
            { num: 3, label: "Thông Tin Chi Tiết", code: "03. PROFILE" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-mono font-bold text-xs transition-all ${
                  step === s.num
                    ? "bg-teal-400 text-space-950 shadow-[0_0_20px_rgba(52,231,196,0.6)] ring-2 ring-teal-400"
                    : step > s.num
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-white/5 text-gray-400 border border-white/15"
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4 text-emerald-300" /> : s.num}
              </div>
              <span
                className={`text-xs font-mono font-bold hidden sm:inline ${
                  step === s.num ? "text-teal-300" : "text-gray-400"
                }`}
              >
                {s.code}
              </span>
              {s.num < 3 && <div className="w-6 sm:w-10 h-0.5 bg-white/15" />}
            </div>
          ))}
        </div>

        {/* Main Step Box: Igloo Holographic Container */}
        <div className="relative igloo-hologram-card border border-white/15 backdrop-blur-3xl rounded-3xl p-6 sm:p-10 shadow-glass-deep">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-human">
              {error}
            </div>
          )}

          {/* STEP 1: CHỌN VAI TRÒ */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-human font-black text-white">Bạn tham gia StudentHub với vai trò nào?</h2>
                <p className="text-xs text-gray-300 mt-1 font-human">Chọn 1 trong 2 vai trò để kích hoạt ma trận tính năng phù hợp</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Người dùng thường / Sinh viên */}
                <div
                  onClick={() => handleRoleSelect("student")}
                  onMouseMove={handleCardMouseMove}
                  className={`cursor-pointer p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden igloo-hologram-card ${
                    role === "student"
                      ? "bg-teal-950/40 border-teal-400 ring-2 ring-teal-400/50 shadow-[0_0_35px_rgba(52,231,196,0.25)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    {role === "student" && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-teal-400 text-space-950 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> [SELECTED]
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-human font-black text-white mb-2">
                    🎓 Người Dùng Thường (Sinh Viên)
                  </h3>
                  <p className="text-xs text-gray-300 mb-4 leading-relaxed font-human">
                    Dành cho sinh viên: kiểm tra lừa đảo 4 lớp siêu tốc, cảnh báo thủ đoạn mới và thảo luận trên diễn đàn Nhà trọ, Quán ăn, Đời sống đại học.
                  </p>

                  <ul className="space-y-2 text-xs text-gray-300 font-human">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Quét link, tin nhắn & ảnh OCR qua 4 tầng AI
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Vote uy tín và cảnh báo sự vụ cho bạn bè
                    </li>
                    <li className="flex items-center gap-2 text-teal-300 font-bold font-mono">
                      <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" /> EMAIL .EDU.VN: NHẬN NGAY +30 ĐIỂM XÁC THỰC
                    </li>
                  </ul>
                </div>

                {/* Option 2: Chuyên gia uy tín */}
                <div
                  onClick={() => handleRoleSelect("expert")}
                  onMouseMove={handleCardMouseMove}
                  className={`cursor-pointer p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden igloo-hologram-card ${
                    role === "expert"
                      ? "bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_35px_rgba(245,158,11,0.25)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Award className="w-7 h-7" />
                    </div>
                    {role === "expert" && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-400 text-space-950 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> [SELECTED]
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-human font-black text-amber-200 mb-2 flex items-center gap-1.5">
                    ⭐ Chuyên Gia Uy Tín
                  </h3>
                  <p className="text-xs text-gray-300 mb-4 leading-relaxed font-human">
                    Dành cho chuyên gia các lĩnh vực (An ninh mạng, Luật pháp, Kinh tế, Bất động sản): thẩm định độc lập và cố vấn cho cộng đồng sinh viên.
                  </p>

                  <ul className="space-y-2 text-xs text-gray-300 font-human">
                    <li className="flex items-center gap-2 text-amber-300 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" /> Cấp Huy hiệu Vàng "⭐ Chuyên Gia Uy Tín"
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Bình luận thẩm định có gắn nhãn nổi bật
                    </li>
                    <li className="flex items-center gap-2 text-amber-300 font-mono font-bold">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> KHỞI ĐẦU VỚI 98 PTS ĐIỂM UY TÍN
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <TactileButton variant="primary" size="md" techSuffix="[STEP 2]" onClick={() => setStep(2)}>
                  Tiếp Tục: Chọn Avatar
                </TactileButton>
              </div>
            </div>
          )}

          {/* STEP 2: CHỌN AVATAR */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-human font-black text-white">Chọn Avatar Biểu Trưng</h2>
                <p className="text-xs text-gray-300 mt-1 font-human">Chọn nhanh 1 biểu trưng danh tính phù hợp trong bộ có sẵn</p>
              </div>

              {/* Preview Box */}
              <div className="flex items-center justify-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md max-w-md mx-auto">
                <AvatarDisplay
                  avatarId={avatarId}
                  role={role}
                  size="xl"
                  showBadge={true}
                />
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold mb-1 border ${
                      role === "expert"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    }`}
                  >
                    {role === "expert" ? "⭐ EXPERT MENTOR" : "🎓 VERIFIED STUDENT"}
                  </span>
                  <h4 className="text-base font-human font-bold text-white">{selectedAvatarData?.name}</h4>
                  <p className="text-[11px] text-gray-400 font-human">{selectedAvatarData?.description}</p>
                </div>
              </div>

              {/* Preset Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {AVATAR_LIST.map((av) => (
                  <div
                    key={av.id}
                    onClick={() => setAvatarId(av.id)}
                    className={`cursor-pointer p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      avatarId === av.id
                        ? "border-teal-400 bg-teal-950/50 ring-2 ring-teal-400/50 scale-105 shadow-lg"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <AvatarDisplay avatarId={av.id} role={av.role} size="md" />
                    <span className="text-xs font-human font-bold text-gray-200 line-clamp-1 text-center">
                      {av.name}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {av.role === "expert" ? "[EXPERT]" : "[STUDENT]"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> [QUAY LẠI]
                </button>

                <TactileButton variant="primary" size="md" techSuffix="[STEP 3]" onClick={() => setStep(3)}>
                  Tiếp Tục: Điền Thông Tin
                </TactileButton>
              </div>
            </div>
          )}

          {/* STEP 3: THÔNG TIN CHI TIẾT */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-human font-black text-white">
                  {role === "expert" ? "Lĩnh Vực Chuyên Môn Của Chuyên Gia" : "Thông Tin Sinh Viên"}
                </h2>
                <p className="text-xs text-gray-300 mt-1 font-human">Thông tin sẽ hiển thị trên hồ sơ cá nhân và diễn đàn xác thực</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-400" /> HỌ VÀ TÊN HIỂN THỊ
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-2xl text-sm text-white focus:outline-none focus:border-teal-400 focus:bg-space-900 transition-all font-human"
                />
              </div>

              {role === "student" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-teal-400" /> TRƯỜNG ĐẠI HỌC
                    </label>
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0d1322] border border-white/15 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 font-human"
                    >
                      {VIETNAM_UNIVERSITIES.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-400" /> NGÀNH HỌC
                    </label>
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="Khoa học Máy tính, Kỹ thuật phần mềm..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 focus:bg-space-900 transition-all font-human"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> LĨNH VỰC CHUYÊN SÂU
                    </label>
                    <select
                      value={expertField}
                      onChange={(e) => setExpertField(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0d1322] border border-amber-500/30 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 font-human"
                    >
                      {EXPERT_FIELDS.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" /> CHỨC DANH NGHỀ NGHIỆP
                    </label>
                    <input
                      type="text"
                      value={expertTitle}
                      onChange={(e) => setExpertTitle(e.target.value)}
                      placeholder="Senior Security Analyst, Luật sư..."
                      className="w-full px-4 py-3 bg-white/5 border border-amber-500/30 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-space-900 transition-all font-human"
                    />
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-gray-300 mb-1.5">
                  GIỚI THIỆU NGẮN (BIO)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={
                    role === "expert"
                      ? "Chia sẻ kinh nghiệm chuyên môn trong lĩnh vực thẩm định và bảo vệ quyền lợi sinh viên..."
                      : "Chia sẻ trường đại học, mối quan tâm hoặc mục tiêu tham gia diễn đàn..."
                  }
                  className="w-full p-3.5 bg-white/5 border border-white/15 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 resize-none font-human"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> [QUAY LẠI]
                </button>

                <TactileButton
                  variant="primary"
                  size="md"
                  techSuffix="[DASHBOARD]"
                  onClick={handleFinish}
                  isLoading={isSubmitting}
                >
                  Hoàn Tất &amp; Vào Ứng Dụng
                </TactileButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
