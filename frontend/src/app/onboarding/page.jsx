"use client";

// app/onboarding/page.jsx
// Màn hình Onboarding thiết lập lần đầu:
// - Chọn vai trò: "Người dùng thường" (Sinh viên) hoặc "Chuyên gia uy tín"
// - Chọn 1 Avatar trong bộ có sẵn (tối giản, nhanh chóng, không cần upload)
// - Nhập thông tin & Lĩnh vực chuyên môn (Toán, Lập trình, Kinh tế, Y Dược, Luật, An ninh mạng...)
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
  Layers
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  AVATAR_LIST,
  VIETNAM_UNIVERSITIES,
  EXPERT_FIELDS,
  getAvatarById,
} from "@/lib/avatars";
import AvatarDisplay from "@/components/AvatarDisplay";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { BorderBeam } from "@/components/ui/border-beam";
import TactileButton from "@/components/ui/TactileButton";

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
    const isEdu = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test(email);
    const isExpert = role === "expert";

    const finalTrustScore = isExpert ? 98 : isEdu ? 80 : 50;

    try {
      await updateProfile({
        full_name: fullName || "Thành viên StudentHub",
        role: isExpert ? "expert" : "student",
        avatar_id: avatarId,
        reputation_score: finalTrustScore,
        trust_score: finalTrustScore,
        university: !isExpert ? university : null,
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
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <AmbientBackground />
      <NoiseOverlay />

      <div className="max-w-4xl w-full relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 backdrop-blur-md mb-3 text-xs font-bold uppercase tracking-wider text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Thiết lập Hồ sơ & Vai trò
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Chào Mừng Đến Với StudentHub AI
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-400">
            Chọn vai trò phù hợp và thiết lập avatar biểu trưng của bạn trong mạng lưới xác thực
          </p>
        </div>

        {/* Stepper Progress */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-8">
          {[
            { num: 1, label: "Chọn Vai Trò" },
            { num: 2, label: "Chọn Avatar" },
            { num: 3, label: "Thông Tin Chi Tiết" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  step === s.num
                    ? "bg-teal-400 text-space-950 shadow-[0_0_15px_rgba(52,231,196,0.5)] ring-2 ring-teal-400"
                    : step > s.num
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-white/5 text-gray-500 border border-white/10"
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  step === s.num ? "text-teal-300" : "text-gray-500"
                }`}
              >
                {s.label}
              </span>
              {s.num < 3 && <div className="w-6 sm:w-10 h-0.5 bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Main Step Box */}
        <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-glass-deep">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* STEP 1: CHỌN VAI TRÒ */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">Bạn tham gia StudentHub với vai trò nào?</h2>
                <p className="text-xs text-gray-400 mt-1">Chọn 1 trong 2 vai trò để kích hoạt hệ sinh thái phù hợp</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Người dùng thường / Sinh viên */}
                <div
                  onClick={() => handleRoleSelect("student")}
                  className={`cursor-pointer p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                    role === "student"
                      ? "bg-teal-950/50 border-teal-400 ring-2 ring-teal-400/50 shadow-[0_0_35px_rgba(52,231,196,0.25)]"
                      : "bg-white/5 border-white/10 hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    {role === "student" && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-400 text-space-950 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã chọn
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
                    🎓 Người Dùng Thường (Sinh Viên)
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Dành cho sinh viên: kiểm tra lừa đảo nhanh chóng, nhận cảnh báo kịp thời và thảo luận trên diễn đàn Nhà trọ, Quán ăn, Trường học.
                  </p>

                  <ul className="space-y-1.5 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400" /> Quét link, tin nhắn & ảnh OCR qua 4 lớp AI
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400" /> Vote uy tín và cảnh báo sự vụ cho bạn bè
                    </li>
                    <li className="flex items-center gap-2 text-teal-300 font-semibold">
                      <Check className="w-3.5 h-3.5 text-teal-400" /> Email trường (.edu): Nhận ngay +30 điểm xác thực
                    </li>
                  </ul>
                </div>

                {/* Option 2: Chuyên gia uy tín */}
                <div
                  onClick={() => handleRoleSelect("expert")}
                  className={`cursor-pointer p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                    role === "expert"
                      ? "bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_35px_rgba(245,158,11,0.25)]"
                      : "bg-white/5 border-white/10 hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Award className="w-7 h-7" />
                    </div>
                    {role === "expert" && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-space-950 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã chọn
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-amber-200 mb-1.5 flex items-center gap-1.5">
                    ⭐ Chuyên Gia Uy Tín
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Dành cho chuyên gia các lĩnh vực (An ninh mạng, Luật, Kinh tế, Y Dược, Bất động sản): thẩm định nghi vấn và cố vấn an toàn cho sinh viên.
                  </p>

                  <ul className="space-y-1.5 text-xs text-gray-300">
                    <li className="flex items-center gap-2 text-amber-300 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Cấp Huy hiệu Vàng "⭐ Chuyên Gia Uy Tín"
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400" /> Bình luận thẩm định có gắn nhãn nổi bật
                    </li>
                    <li className="flex items-center gap-2 text-amber-300">
                      <Check className="w-3.5 h-3.5 text-amber-400" /> Khởi đầu với 98 điểm uy tín
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <TactileButton variant="primary" size="md" onClick={() => setStep(2)}>
                  Tiếp Tục: Chọn Avatar
                </TactileButton>
              </div>
            </div>
          )}

          {/* STEP 2: CHỌN AVATAR */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-bold text-white">Chọn Avatar Đại Diện Trong Bộ Có Sẵn</h2>
                <p className="text-xs text-gray-400 mt-1">Chọn nhanh 1 biểu tượng phù hợp với phong cách của bạn</p>
              </div>

              {/* Preview Box */}
              <div className="flex items-center justify-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-md mx-auto">
                <AvatarDisplay
                  avatarId={avatarId}
                  role={role}
                  size="xl"
                  showBadge={true}
                />
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-1 border ${
                      role === "expert"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    }`}
                  >
                    {role === "expert" ? "⭐ Chuyên Gia Uy Tín" : "🎓 Sinh Viên Xác Thực"}
                  </span>
                  <h4 className="text-sm font-bold text-white">{selectedAvatarData?.name}</h4>
                  <p className="text-[11px] text-gray-400">{selectedAvatarData?.description}</p>
                </div>
              </div>

              {/* Preset Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {AVATAR_LIST.map((av) => (
                  <div
                    key={av.id}
                    onClick={() => setAvatarId(av.id)}
                    className={`cursor-pointer p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      avatarId === av.id
                        ? "border-teal-400 bg-teal-950/40 ring-2 ring-teal-400/50 scale-105 shadow-lg"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <AvatarDisplay avatarId={av.id} role={av.role} size="md" />
                    <span className="text-xs font-bold text-gray-200 line-clamp-1 text-center">
                      {av.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {av.role === "expert" ? "Chuyên gia" : "Sinh viên"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Quay lại
                </button>

                <TactileButton variant="primary" size="md" onClick={() => setStep(3)}>
                  Tiếp Tục: Điền Thông Tin
                </TactileButton>
              </div>
            </div>
          )}

          {/* STEP 3: THÔNG TIN CHI TIẾT */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {role === "expert" ? "Lĩnh Vực Chuyên Môn Của Chuyên Gia" : "Thông Tin Sinh Viên"}
                </h2>
                <p className="text-xs text-gray-400 mt-1">Thông tin sẽ hiển thị trên hồ sơ cá nhân và diễn đàn</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-400" /> Họ và tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              {role === "student" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-teal-400" /> Trường Đại học
                    </label>
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full px-4 py-3 bg-[#111522] border border-white/10 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                    >
                      {VIETNAM_UNIVERSITIES.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-400" /> Ngành học
                    </label>
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="Khoa học Máy tính, Kỹ thuật phần mềm..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> Lĩnh vực chuyên sâu
                    </label>
                    <select
                      value={expertField}
                      onChange={(e) => setExpertField(e.target.value)}
                      className="w-full px-4 py-3 bg-[#111522] border border-amber-500/30 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      {EXPERT_FIELDS.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Chức danh nghề nghiệp
                    </label>
                    <input
                      type="text"
                      value={expertTitle}
                      onChange={(e) => setExpertTitle(e.target.value)}
                      placeholder="Senior Security Analyst, Luật sư..."
                      className="w-full px-4 py-3 bg-white/5 border border-amber-500/30 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                  Giới thiệu ngắn (Bio)
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
                  className="w-full p-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Quay lại
                </button>

                <TactileButton
                  variant="primary"
                  size="md"
                  onClick={handleFinish}
                  isLoading={isSubmitting}
                >
                  Hoàn Tất & Vào Ứng Dụng
                </TactileButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
