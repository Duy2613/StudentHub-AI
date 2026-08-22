"use client";

// app/onboarding/page.jsx
//
// Màn hình Onboarding Spec-Driven:
// - Chọn 1 trong 2 vai trò: "Người dùng tiêu chuẩn" (standard) hoặc "Chuyên gia uy tín" (expert)
// - Tích hợp GitHub Public API để tự động kéo Avatar, Bio và Top 3 Dự án nổi bật + Tính điểm uy tín
// - Lưu đồng bộ vào bảng profiles (role, avatar_url, reputation_score) và điều hướng về /dashboard

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  User,
  Building,
  BookOpen,
  Briefcase,
  Layers,
  Star,
  Check,
  Loader2,
  GitBranch,
  FolderGit2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  AVATAR_LIST,
  VIETNAM_UNIVERSITIES,
  EXPERT_FIELDS,
  getAvatarById,
} from "@/lib/avatars";
import { fetchGitHubExpertData } from "@/lib/github";
import AvatarDisplay from "@/components/AvatarDisplay";
import { AmbientBackground, NoiseOverlay, GithubIcon } from "@/components/auth/AuthUI";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";

export default function OnboardingPage() {
  const router = useRouter();
  const { session, profile, updateProfile, isLoading: isAuthLoading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !session) {
      router.replace("/login");
    }
  }, [session, isAuthLoading, router]);

  const [step, setStep] = useState(1); // 1: Chọn Vai trò, 2: Chọn Avatar, 3: Thông tin chi tiết & GitHub
  const [role, setRole] = useState("standard"); // "standard" | "expert"
  const [avatarId, setAvatarId] = useState("student-tech");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState(VIETNAM_UNIVERSITIES[0]);
  const [customUniversity, setCustomUniversity] = useState("");
  const [major, setMajor] = useState("Công nghệ Thông tin / Kỹ thuật Phần mềm");
  const [academicYear, setAcademicYear] = useState("K65 (2023 - 2027)");

  // Expert Fields & GitHub Sync
  const [githubUsername, setGithubUsername] = useState("");
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [githubData, setGithubData] = useState(null);
  const [githubError, setGithubError] = useState(null);
  const [expertTitle, setExpertTitle] = useState("Kỹ sư AI & Trợ giảng Học thuật");
  const [expertField, setExpertField] = useState(EXPERT_FIELDS[0]);
  const [experienceYears, setExperienceYears] = useState("4+ năm kinh nghiệm");
  const [bio, setBio] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Khởi tạo thông tin từ session / OAuth metadata
  useEffect(() => {
    if (session?.user) {
      const meta = session.user.user_metadata || {};
      const initialName = meta.full_name || meta.name || meta.user_name || "";
      if (initialName && !fullName) setFullName(initialName);

      const ghUser = meta.user_name || meta.preferred_username || "";
      if (ghUser && !githubUsername) setGithubUsername(ghUser);

      if (meta.avatar_url && !customAvatarUrl) {
        setCustomAvatarUrl(meta.avatar_url);
      }
    }
    if (profile) {
      if (profile.fullName && !fullName) setFullName(profile.fullName);
      if (profile.role) {
        setRole(profile.role === "expert" ? "expert" : "standard");
        setAvatarId(profile.role === "expert" ? "expert-ai" : "student-tech");
      }
      if (profile.bio && !bio) setBio(profile.bio);
    }
  }, [session, profile]);

  // Xử lý đổi vai trò
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "expert" && avatarId.startsWith("student")) {
      setAvatarId("expert-ai");
    } else if (selectedRole === "standard" && avatarId.startsWith("expert")) {
      setAvatarId("student-tech");
    }
  };

  // Đồng bộ GitHub Public API cho Chuyên gia
  const handleSyncGitHub = async () => {
    if (!githubUsername.trim()) {
      setGithubError("Vui lòng nhập Username GitHub để đồng bộ.");
      return;
    }

    setIsSyncingGithub(true);
    setGithubError(null);

    try {
      const data = await fetchGitHubExpertData(githubUsername);
      setGithubData(data);
      if (data.avatarUrl) {
        setCustomAvatarUrl(data.avatarUrl);
      }
      if (data.bio && !bio) {
        setBio(data.bio);
      }
      if (data.name && !fullName) {
        setFullName(data.name);
      }
    } catch (err) {
      setGithubError(err.message || "Không thể đồng bộ dữ liệu từ GitHub.");
    } finally {
      setIsSyncingGithub(false);
    }
  };

  // Xử lý upload ảnh tùy chọn (Base64)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Dung lượng ảnh tối đa 2MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomAvatarUrl(reader.result);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Hoàn tất Onboarding
  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);

    const email = session?.user?.email || "";
    const isEdu = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test(email);
    const isExpert = role === "expert";

    const finalUniversity = university === "Khác" ? (customUniversity || "Đại học Tự do") : university;
    const finalBio =
      bio ||
      (isExpert
        ? "Chuyên gia cố vấn và giải đáp học thuật tại StudentHub AI."
        : "Sinh viên học tập và phát triển kỹ năng tại StudentHub AI.");

    const finalReputationScore = isExpert
      ? githubData?.reputationScore || 95
      : isEdu
      ? 80
      : 50;

    try {
      await updateProfile({
        full_name: fullName || "Thành viên StudentHub",
        role: isExpert ? "expert" : "standard",
        avatar_id: avatarId,
        avatar_url: customAvatarUrl || null,
        reputation_score: finalReputationScore,
        trust_score: finalReputationScore,
        university: !isExpert ? finalUniversity : null,
        major: !isExpert ? major : null,
        academic_year: !isExpert ? academicYear : null,
        expert_title: isExpert ? expertTitle : null,
        expert_field: isExpert ? expertField : null,
        experience_years: isExpert ? experienceYears : null,
        github_username: isExpert ? githubUsername.trim() || null : null,
        top_repos: isExpert ? githubData?.topRepos || [] : [],
        bio: finalBio,
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
  const isEduEmail = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test(session?.user?.email || "");

  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      <AmbientBackground />
      <NoiseOverlay />

      <div className="max-w-4xl w-full relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Thiết lập Hồ sơ Cá nhân & Vai trò
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200">
            Chào mừng đến với StudentHub AI
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-400">
            Chọn vai trò phù hợp và thiết lập dấu ấn cá nhân của bạn trong cộng đồng tri thức
          </p>
        </div>

        {/* Stepper Progress */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-10">
          {[
            { num: 1, label: "Chọn vai trò" },
            { num: 2, label: "Chọn Avatar" },
            { num: 3, label: "Hồ sơ & Chuyên môn" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step === s.num
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400"
                    : step > s.num
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-gray-500 border border-white/10"
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs sm:text-sm font-medium hidden sm:inline ${
                  step === s.num ? "text-indigo-200 font-semibold" : "text-gray-500"
                }`}
              >
                {s.label}
              </span>
              {s.num < 3 && <div className="w-6 sm:w-10 h-0.5 bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Main Content Box */}
        <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-glass-deep">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* ---------------- BƯỚC 1: CHỌN VAI TRÒ ---------------- */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Bạn tham gia StudentHub với vai trò nào?</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Chọn 1 trong 2 thẻ vai trò để được cấp quyền và hệ sinh thái phù hợp
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thẻ 1: Người dùng tiêu chuẩn */}
                <CardContainer className="w-full" containerClassName="w-full py-0">
                  <CardBody className="w-full h-auto">
                    <div
                      onClick={() => handleRoleSelect("standard")}
                      className={`group cursor-pointer relative p-6 sm:p-8 rounded-3xl border transition-all duration-300 w-full overflow-hidden ${
                        role === "standard"
                          ? "bg-indigo-950/60 border-indigo-500/80 shadow-[0_0_35px_rgba(99,102,241,0.35)]"
                          : "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      {role === "standard" && (
                        <BorderBeam size={220} duration={8} colorFrom="#6366f1" colorTo="#38bdf8" />
                      )}
                      <CardItem translateZ={30} className="w-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            <GraduationCap className="w-8 h-8" />
                          </div>
                          {role === "standard" && (
                            <Badge variant="default" className="text-xs font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn
                            </Badge>
                          )}
                        </div>
                      </CardItem>
                      <CardItem translateZ={25} className="w-full">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                          🎓 Người dùng tiêu chuẩn
                        </h3>
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                          Dành cho sinh viên, người học: hỏi đáp bài tập, trợ lý AI Socratic 24/7, tìm tài liệu học tập và nhận hướng dẫn từ các Chuyên gia uy tín.
                        </p>
                      </CardItem>
                      <CardItem translateZ={15} className="w-full">
                        <ul className="space-y-2 text-xs text-gray-300">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-indigo-400" /> Trợ lý AI giải thích bài giảng & ôn thi học phần
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-indigo-400" /> Đặt câu hỏi trực tiếp cho Chuyên gia uy tín
                          </li>
                          <li className="flex items-center gap-2 text-indigo-300 font-medium">
                            <Check className="w-4 h-4 text-indigo-400" /> Điểm uy tín khởi đầu: 50 pts (80 pts với email Edu)
                          </li>
                        </ul>
                      </CardItem>
                    </div>
                  </CardBody>
                </CardContainer>

                {/* Thẻ 2: Chuyên gia uy tín */}
                <CardContainer className="w-full" containerClassName="w-full py-0">
                  <CardBody className="w-full h-auto">
                    <div
                      onClick={() => handleRoleSelect("expert")}
                      className={`group cursor-pointer relative p-6 sm:p-8 rounded-3xl border transition-all duration-300 w-full overflow-hidden ${
                        role === "expert"
                          ? "bg-amber-950/60 border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]"
                          : "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      {role === "expert" && (
                        <BorderBeam size={220} duration={8} colorFrom="#f59e0b" colorTo="#ef4444" />
                      )}
                      <CardItem translateZ={30} className="w-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Award className="w-8 h-8" />
                          </div>
                          {role === "expert" && (
                            <Badge variant="expert" className="text-xs font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn
                            </Badge>
                          )}
                        </div>
                      </CardItem>
                      <CardItem translateZ={25} className="w-full">
                        <h3 className="text-lg sm:text-xl font-bold text-amber-200 mb-2 flex items-center gap-2">
                          🌟 Chuyên gia uy tín
                        </h3>
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                          Dành cho kỹ sư công nghệ, giảng viên, mentor: kết nối tài khoản GitHub, hiển thị 3 dự án nổi bật nhất và cộng điểm uy tín chuyên môn.
                        </p>
                      </CardItem>
                      <CardItem translateZ={15} className="w-full">
                        <ul className="space-y-2 text-xs text-gray-300">
                          <li className="flex items-center gap-2 text-amber-200 font-medium">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Cấp Huy hiệu Vàng "⭐ Chuyên Gia Uy Tín"
                          </li>
                          <li className="flex items-center gap-2 text-amber-300">
                            <Check className="w-4 h-4 text-amber-400" /> Tự động kéo 3 Dự án GitHub & Tính điểm uy tín (90-100 pts)
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-amber-400" /> Nhận câu hỏi ưu tiên và xây dựng hồ sơ cố vấn học thuật
                          </li>
                        </ul>
                      </CardItem>
                    </div>
                  </CardBody>
                </CardContainer>
              </div>


              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                >
                  Tiếp tục: Chọn Avatar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- BƯỚC 2: CHỌN AVATAR ---------------- */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Chọn Avatar Đại diện</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Chọn hình ảnh đại diện biểu trưng cho phong cách {role === "expert" ? "Chuyên gia uy tín" : "Người dùng tiêu chuẩn"} của bạn
                </p>
              </div>

              {/* Live Preview Box */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <AvatarDisplay
                  avatarId={avatarId}
                  avatarUrl={customAvatarUrl}
                  role={role}
                  size="xl"
                  showBadge={true}
                />
                <div className="text-center sm:text-left">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 border backdrop-blur-md"
                    style={{
                      background: role === "expert" ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)",
                      borderColor: role === "expert" ? "rgba(245, 158, 11, 0.4)" : "rgba(99, 102, 241, 0.4)",
                      color: role === "expert" ? "#fde68a" : "#c7d2fe",
                    }}
                  >
                    {role === "expert" ? "⭐ Chuyên Gia Uy Tín" : "🎓 Người Dùng Tiêu Chuẩn"}
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {customAvatarUrl ? "Ảnh đại diện tùy chỉnh / GitHub" : selectedAvatarData?.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    {customAvatarUrl ? "Hình ảnh đã đồng bộ từ GitHub hoặc tải lên" : selectedAvatarData?.description}
                  </p>
                </div>
              </div>

              {/* Avatar Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Bộ sưu tập Avatar {role === "expert" ? "Chuyên gia" : "Sinh viên"}
                  </h3>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-indigo-300 border border-white/10 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? "Đang tải..." : "Tải ảnh từ máy"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {AVATAR_LIST.map((item) => {
                    const isSelected = avatarId === item.id && !customAvatarUrl;
                    const isItemRole = item.role === role || (role === "standard" && item.role === "student");
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setAvatarId(item.id);
                          setCustomAvatarUrl("");
                        }}
                        className={`cursor-pointer group flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${
                          isSelected
                            ? role === "expert"
                              ? "bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/30 scale-105"
                              : "bg-indigo-950/50 border-indigo-400 ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-500/30 scale-105"
                            : isItemRole
                            ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-102"
                            : "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100 hover:bg-white/5"
                        }`}
                      >
                        <AvatarDisplay
                          avatarId={item.id}
                          role={item.role}
                          size="md"
                          className="mb-2"
                        />
                        <span className="text-xs font-semibold text-gray-200 text-center line-clamp-1">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {item.role === "expert" ? "Chuyên gia" : "Sinh viên"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                >
                  Tiếp tục: Cập nhật hồ sơ <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- BƯỚC 3: THÔNG TIN HỒ SƠ & GITHUB ---------------- */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {role === "expert" ? "Xác thực Hồ sơ Chuyên gia & GitHub" : "Hoàn tất Thông tin Hồ sơ"}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {role === "expert"
                    ? "Tích hợp GitHub Public API để kéo 3 dự án nổi bật và tính điểm uy tín chuyên gia"
                    : "Thông tin này sẽ hiển thị trên trang Profile cá nhân của bạn"}
                </p>
              </div>

              <div className="space-y-5">
                {/* Họ và tên */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" /> Họ và tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                  />
                </div>

                {/* Phần riêng cho Chuyên gia uy tín: GitHub Public API Integration */}
                {role === "expert" && (
                  <div className="p-5 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                        <GithubIcon className="w-4 h-4" /> Đồng bộ GitHub Public API (Task 4)
                      </div>
                      {githubData && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Điểm uy tín:</span>
                          <span className="text-sm font-extrabold text-white">
                            <NumberTicker value={githubData.reputationScore} />
                          </span>
                          <span>pts ⭐</span>
                        </span>
                      )}

                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="Nhập GitHub username (VD: torvalds, octocat)"
                        className="flex-1 px-4 py-2.5 bg-black/40 border border-amber-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={handleSyncGitHub}
                        disabled={isSyncingGithub || !githubUsername.trim()}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {isSyncingGithub ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Đang kéo...
                          </>
                        ) : (
                          <>
                            <GitBranch className="w-4 h-4" /> Kéo 3 Dự án
                          </>
                        )}
                      </button>
                    </div>

                    {githubError && (
                      <p className="text-xs text-red-400">{githubError}</p>
                    )}

                    {/* Hiển thị Top 3 Dự án nổi bật kéo từ GitHub */}
                    {githubData?.topRepos && githubData.topRepos.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-amber-500/20">
                        <p className="text-xs font-semibold text-amber-200 flex items-center gap-1">
                          <FolderGit2 className="w-3.5 h-3.5" /> 3 Dự án nổi bật nhất trên GitHub:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {githubData.topRepos.map((repo) => (
                            <a
                              key={repo.id}
                              href={repo.htmlUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 rounded-xl bg-black/30 border border-white/10 hover:border-amber-400/50 transition-colors flex flex-col justify-between group/repo"
                            >
                              <div>
                                <p className="text-xs font-bold text-white group-hover/repo:text-amber-300 flex items-center justify-between">
                                  <span className="truncate">{repo.name}</span>
                                  <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                                  {repo.description}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[10px] text-amber-300 font-semibold">
                                <span>⭐ {repo.stars} stars</span>
                                <span className="text-gray-400">{repo.language}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Form dành cho Người dùng tiêu chuẩn */}
                {role === "standard" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          <Building className="w-4 h-4 text-indigo-400" /> Trường Đại học / Tổ chức
                        </label>
                        <select
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          className="w-full px-4 py-3 bg-[#111522] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                        >
                          {VIETNAM_UNIVERSITIES.map((u) => (
                            <option key={u} value={u} className="bg-[#111522] text-gray-200">
                              {u}
                            </option>
                          ))}
                          <option value="Khác" className="bg-[#111522] text-gray-200">
                            Trường khác (Nhập tay)...
                          </option>
                        </select>
                        {university === "Khác" && (
                          <input
                            type="text"
                            placeholder="Nhập tên trường của bạn"
                            value={customUniversity}
                            onChange={(e) => setCustomUniversity(e.target.value)}
                            className="mt-2 w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-400" /> Ngành / Chuyên ngành học
                        </label>
                        <input
                          type="text"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          placeholder="Khoa học Máy tính, Kỹ thuật phần mềm..."
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" /> Niên khóa / Khóa sinh viên
                      </label>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="K65 (2023 - 2027) hoặc Năm 3"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/10"
                      />
                    </div>
                  </>
                ) : (
                  /* Form chi tiết Chuyên gia */
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-amber-200 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" /> Chức danh Chuyên gia / Nghề nghiệp
                        </label>
                        <input
                          type="text"
                          value={expertTitle}
                          onChange={(e) => setExpertTitle(e.target.value)}
                          placeholder="Senior AI Engineer, Tech Lead..."
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-amber-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 focus:bg-white/10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-amber-200 mb-2 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-amber-400" /> Lĩnh vực Chuyên sâu
                        </label>
                        <select
                          value={expertField}
                          onChange={(e) => setExpertField(e.target.value)}
                          className="w-full px-4 py-3 bg-[#111522] border border-amber-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                        >
                          {EXPERT_FIELDS.map((field) => (
                            <option key={field} value={field} className="bg-[#111522] text-gray-200">
                              {field}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-amber-200 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400" /> Số năm kinh nghiệm làm việc / giảng dạy
                      </label>
                      <input
                        type="text"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        placeholder="5+ năm kinh nghiệm trong ngành"
                        className="w-full px-4 py-3 bg-white/5 border border-amber-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 focus:bg-white/10"
                      />
                    </div>
                  </>
                )}

                {/* Giới thiệu bản thân (Bio) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Giới thiệu ngắn (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={
                      role === "expert"
                        ? "Chia sẻ kinh nghiệm chuyên môn, hướng nghiên cứu hoặc lĩnh vực bạn sẵn sàng hỗ trợ sinh viên..."
                        : "Chia sẻ sở thích, mục tiêu học tập hoặc môn học bạn đang quan tâm..."
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/10 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting || !fullName.trim()}
                  className={`px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    role === "expert"
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 shadow-amber-500/30 text-black"
                      : "bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 shadow-indigo-500/30 text-white"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu hồ sơ...
                    </>
                  ) : (
                    <>
                      Hoàn tất & Khám phá StudentHub AI <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
