"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Mail,
  MessageSquare,
  Save,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE } from "@/lib/auth/presentationState";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import AvatarDisplay from "@/components/AvatarDisplay";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";
import AcademicSummaryWidget from "@/components/academic/AcademicSummaryWidget";

// Base presentation editable fields contract for backwards compatibility
const EDITABLE_FIELDS = ["fullName", "avatarUrl"];
const EXTENDED_FIELDS = ["bio", "university", "major"];
const ALL_EDITABLE_FIELDS = [...EDITABLE_FIELDS, ...EXTENDED_FIELDS];

function formatDate(isoString) {
  if (!isoString) return "Chưa có dữ liệu";
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? "Chưa có dữ liệu" : d.toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "Chưa có dữ liệu";
  }
}

function formatRelativeAge(isoString) {
  if (!isoString) return "Mới tham gia";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMonths = Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
    if (diffMonths === 0) return "Tháng này";
    if (diffMonths < 12) return `${diffMonths} tháng`;
    const years = Math.floor(diffMonths / 12);
    const rem = diffMonths % 12;
    return rem > 0 ? `${years} năm ${rem} tháng` : `${years} năm`;
  } catch {
    return "Mới tham gia";
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile, session, isLoading, isAuthenticated, status, refreshProfile, expertLifecycleState } = useAuth();
  const [profileView, setProfileView] = useState(null);
  const [viewLoading, setViewLoading] = useState(true);
  const [viewError, setViewError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draft, setDraft] = useState({
    fullName: "",
    avatarUrl: "",
    bio: "",
    university: "",
    major: "",
  });

  // Part 4: Role-aware routing. Active experts are redirected to /expert/profile
  useEffect(() => {
    if (!isLoading && isAuthenticated && expertLifecycleState === EXPERT_LIFECYCLE_STATE.ACTIVE) {
      router.replace("/expert/profile");
    }
  }, [isLoading, isAuthenticated, expertLifecycleState, router]);

  // Fetch full normalized UserProfileDTO from canonical /api/users/me
  useEffect(() => {
    if (!isAuthenticated) {
      setViewLoading(false);
      return;
    }
    let isMounted = true;
    setViewLoading(true);
    setViewError("");
    apiRequest("/api/users/me")
      .then((res) => {
        if (!res?.profile) throw new Error("Owner profile response is missing the profile DTO.");
        if (!isMounted) return;
        setProfileView(res.profile);
        setDraft({
          fullName: res.profile.identity?.fullName || res.profile.fullName || "",
          avatarUrl: res.profile.identity?.avatarUrl || res.profile.avatarUrl || "",
          bio: res.profile.bio || "",
          university: res.profile.education?.university || res.profile.university || "",
          major: res.profile.education?.major || res.profile.major || "",
        });
      })
      .catch((error) => {
        if (isMounted) setViewError(apiErrorMessage(error));
      })
      .finally(() => {
        if (isMounted) setViewLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      // Send safe editable presentation fields only
      const payload = {
        fullName: draft.fullName?.trim() || null,
        avatarUrl: draft.avatarUrl?.trim() || null,
        bio: draft.bio?.trim() || null,
        university: draft.university?.trim() || null,
        major: draft.major?.trim() || null,
      };
      const result = await apiRequest("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (result?.profile) {
        setProfileView(result.profile);
        await refreshProfile?.();
      } else {
        throw new Error("Owner profile update response is missing the profile DTO.");
      }
      setEditing(false);
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(error?.message || "Không thể lưu hồ sơ lúc này.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || status === "UNKNOWN") {
    return (
      <UnifiedAppShell>
        <div className="unified-workspace unified-profile-workspace" role="status">
          <div className="space-y-4 max-w-4xl mx-auto py-8">
            <div className="h-24 rounded-lg bg-white/5 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-40 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-40 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-40 rounded-lg bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </UnifiedAppShell>
    );
  }

  if (status === "ERROR") {
    return (
      <UnifiedAppShell>
        <div className="unified-workspace unified-profile-workspace">
          <section className="unified-auth-empty" role="alert">
            <ShieldAlert size={28} className="text-amber-400 mb-2" />
            <h1 className="text-lg font-bold text-slate-100">Không thể xác minh phiên</h1>
            <p className="text-sm text-slate-400 max-w-md">Dịch vụ xác thực hoặc hồ sơ hiện chưa khả dụng. Dữ liệu chưa bị mất. Vui lòng thử lại sau.</p>
            <button type="button" onClick={() => window.location.reload()} className="primary-action mt-4">
              Thử lại
            </button>
          </section>
        </div>
      </UnifiedAppShell>
    );
  }

  if (status === "ANONYMOUS" || !isAuthenticated) {
    return (
      <UnifiedAppShell>
        <div className="unified-workspace unified-profile-workspace">
          <section className="unified-auth-empty">
            <UserRound size={28} className="text-indigo-400 mb-2" />
            <h1 className="text-lg font-bold text-slate-100">Hồ sơ sinh viên cá nhân</h1>
            <p className="text-sm text-slate-400 max-w-md">Đăng nhập bằng tài khoản StudentHub để xem tiến trình học tập, lịch sử thẩm định Trust và đóng góp cộng đồng.</p>
            <Link href="/login?next=%2Fprofile" className="primary-action mt-4">
              Đăng nhập ngay
            </Link>
          </section>
        </div>
      </UnifiedAppShell>
    );
  }

  if (viewLoading) {
    return (
      <UnifiedAppShell>
        <div className="unified-workspace unified-profile-workspace" role="status">
          <div className="space-y-4 max-w-4xl mx-auto py-8">
            <div className="h-24 rounded-lg bg-white/5 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-40 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-40 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-40 rounded-lg bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </UnifiedAppShell>
    );
  }

  if (viewError || !profileView) {
    return (
      <UnifiedAppShell>
        <div className="unified-workspace unified-profile-workspace">
          <section className="unified-auth-empty" role="alert">
            <ShieldAlert size={28} className="text-amber-400 mb-2" />
            <h1 className="text-lg font-bold text-slate-100">Hồ sơ Owner chưa khả dụng</h1>
            <p className="text-sm text-slate-400 max-w-md">{viewError || "API hồ sơ không trả về dữ liệu hợp lệ."}</p>
            <button type="button" onClick={() => window.location.reload()} className="primary-action mt-4">
              Thử lại
            </button>
          </section>
        </div>
      </UnifiedAppShell>
    );
  }

  const identity = profileView?.identity || profileView || {};
  const education = profileView?.education || {};
  const trustActivity = profileView?.trustActivity || { count: 0, recentCases: [], pendingExpertRequests: 0 };
  const communityActivity = profileView?.communityActivity || { posts: 0, comments: 0, recentActivity: [] };
  const expertRequests = profileView?.expertRequests || { total: 0, pending: 0, inReview: 0, completed: 0, recentRequests: [] };
  const account = profileView?.account || {};

  const fullName = identity.fullName || profile?.fullName || "Thành viên StudentHub";
  const university = education.university || profileView?.university || null;
  const major = education.major || profileView?.major || null;
  const bio = profileView?.bio || null;
  const email = identity.email || session?.user?.email || profile?.email || null;
  const isInstitutionalVerified = education.institutionalEmailVerified || profile?.institutionalEmailVerified;
  const isEmailVerified = profile?.emailVerified || false;
  const createdAt = account.createdAt || profileView?.createdAt || null;

  return (
    <UnifiedAppShell>
      <div className="unified-workspace unified-profile-workspace max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* COMPACT ACADEMIC HEADER (No giant hero, zero video) */}
        <header className="rounded-xl border border-white/10 bg-[#0d121c] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AvatarDisplay
                avatarId={identity.avatarId || profile?.avatarId}
                avatarUrl={identity.avatarUrl || profile?.avatarUrl}
                name={fullName}
                size="lg"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-100">{fullName}</h1>
                  {isInstitutionalVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 size={12} /> Sinh viên đã xác thực
                    </span>
                  ) : isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-500/30">
                      <CheckCircle2 size={12} /> Hộp thư đã xác thực
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      Chưa xác thực trường
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {university && (
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap size={13} className="text-slate-400" /> {university}
                    </span>
                  )}
                  {major && (
                    <span className="inline-flex items-center gap-1">
                      <BookOpen size={13} className="text-slate-400" /> {major}
                    </span>
                  )}
                  {email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={13} className="text-slate-400" /> {email}
                    </span>
                  )}
                </div>

                {bio && <p className="text-xs text-slate-300 pt-1 italic line-clamp-2">{bio}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setSaveError("");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors"
                id="edit-profile-cta"
              >
                <Edit3 size={14} /> Chỉnh sửa hồ sơ
              </button>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-colors"
                id="settings-cta"
              >
                <Settings size={14} /> Cài đặt
              </Link>
            </div>
          </div>
        </header>

        <AcademicSummaryWidget />

        {saveSuccess && (
          <div className="rounded-lg p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2" role="status">
            <CheckCircle2 size={16} /> Đã cập nhật thành công các trường hồ sơ cá nhân.
          </div>
        )}

        {/* OVERVIEW SECTION BASED ON REAL DURABLE SERVER DATA */}
        <section aria-labelledby="overview-title" className="space-y-3">
          <h2 id="overview-title" className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Tổng quan hoạt động thực tế
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Hồ sơ Trust</span>
              <strong className="text-xl font-bold text-slate-100">{trustActivity.count}</strong>
              <small className="text-[10px] text-slate-500 block">Ca kiểm chứng</small>
            </div>
            <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Bài viết</span>
              <strong className="text-xl font-bold text-slate-100">{communityActivity.posts}</strong>
              <small className="text-[10px] text-slate-500 block">Cộng đồng</small>
            </div>
            <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Bình luận</span>
              <strong className="text-xl font-bold text-slate-100">{communityActivity.comments}</strong>
              <small className="text-[10px] text-slate-500 block">Đóng góp</small>
            </div>
            <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Hỏi chuyên gia</span>
              <strong className="text-xl font-bold text-slate-100">{expertRequests.total}</strong>
              <small className="text-[10px] text-slate-500 block">Yêu cầu giám định</small>
            </div>
            <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Chờ giám định</span>
              <strong className="text-xl font-bold text-slate-100">{expertRequests.pending + expertRequests.inReview}</strong>
              <small className="text-[10px] text-slate-500 block">Đang xử lý</small>
            </div>
            <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3.5 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Tuổi tài khoản</span>
              <strong className="text-base font-bold text-slate-100 truncate block">{formatRelativeAge(createdAt)}</strong>
              <small className="text-[10px] text-slate-500 block">{formatDate(createdAt)}</small>
            </div>
          </div>
        </section>

        {/* THREE COLUMNS / ACTIVITY TABS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TRUST ACTIVITY SECTION */}
          <section aria-labelledby="trust-activity-title" className="rounded-xl border border-white/10 bg-[#0d121c] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h2 id="trust-activity-title" className="text-sm font-semibold text-slate-100">
                  Hoạt động Trust
                </h2>
              </div>
              <Link href="/trust" className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
                Kiểm chứng mới <ArrowRight size={12} />
              </Link>
            </div>

            {trustActivity.recentCases && trustActivity.recentCases.length > 0 ? (
              <ul className="space-y-2.5" role="list">
                {trustActivity.recentCases.map((tc) => (
                  <li key={tc.id} className="p-3 rounded-lg border border-white/5 bg-black/20 hover:bg-black/30 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-400">#{tc.id.slice(0, 8)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                        tc.state === "AFFIRMED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/20"
                          : tc.state === "CONTESTED"
                            ? "bg-rose-950 text-rose-300 border border-rose-500/20"
                            : "bg-amber-950 text-amber-300 border border-amber-500/20"
                      }`}>
                        {tc.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{tc.visibility}</span>
                      <Link href={`/trust/${tc.id}`} className="text-indigo-400 hover:underline inline-flex items-center gap-0.5">
                        Chi tiết <ExternalLink size={10} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs space-y-2">
                <p>Chưa có hồ sơ Trust nào.</p>
                <Link href="/trust" className="inline-block px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs">
                  Bắt đầu kiểm chứng đầu tiên
                </Link>
              </div>
            )}
          </section>

          {/* COMMUNITY ACTIVITY SECTION */}
          <section aria-labelledby="community-activity-title" className="rounded-xl border border-white/10 bg-[#0d121c] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-400" />
                <h2 id="community-activity-title" className="text-sm font-semibold text-slate-100">
                  Hoạt động cộng đồng
                </h2>
              </div>
              <Link href="/community" className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
                Diễn đàn <ArrowRight size={12} />
              </Link>
            </div>

            {communityActivity.recentActivity && communityActivity.recentActivity.length > 0 ? (
              <ul className="space-y-2.5" role="list">
                {communityActivity.recentActivity.map((item) => (
                  <li key={item.id} className="p-3 rounded-lg border border-white/5 bg-black/20 hover:bg-black/30 transition-colors">
                    <div className="text-xs font-medium text-slate-200 truncate">{item.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span className="capitalize">{item.category?.toLowerCase()}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs space-y-2">
                <p>Chưa có bài đăng nào.</p>
                <Link href="/community" className="inline-block px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs">
                  Khám phá diễn đàn sinh viên
                </Link>
              </div>
            )}
          </section>

          {/* EXPERT REQUESTS SECTION */}
          <section aria-labelledby="expert-requests-title" className="rounded-xl border border-white/10 bg-[#0d121c] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-amber-400" />
                <h2 id="expert-requests-title" className="text-sm font-semibold text-slate-100">
                  Yêu cầu giám định chuyên gia
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {expertRequests.total} yêu cầu
              </span>
            </div>

            {expertRequests.recentRequests && expertRequests.recentRequests.length > 0 ? (
              <ul className="space-y-2.5" role="list">
                {expertRequests.recentRequests.map((req) => (
                  <li key={req.id} className="p-3 rounded-lg border border-white/5 bg-black/20 hover:bg-black/30 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-amber-400 uppercase">{req.domainCode}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-mono">{req.status}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{req.question}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Ca #{req.caseId?.slice(0, 8)} (v{req.caseRevision})</span>
                      <span>{formatDate(req.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs space-y-2">
                <p>Chưa có yêu cầu gửi chuyên gia.</p>
                <p className="text-[11px] text-slate-600">Khi kiểm chứng Trust, bạn có thể nhấn &quot;Hỏi chuyên gia&quot; để nhận thẩm định chính thức.</p>
              </div>
            )}
          </section>
        </div>

        {/* READ-ONLY CANONICAL CONSTRAINTS & SERVER BOUNDARIES */}
        <section aria-labelledby="authority-boundaries-title" className="rounded-xl border border-white/10 bg-[#0a0e17] p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck size={16} className="text-indigo-400" />
            <h2 id="authority-boundaries-title" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Quy tắc quản lý danh tính &amp; Quyền hạn (Server-Owned Authority)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded bg-white/[0.02] border border-white/5 space-y-1">
              <span className="font-mono text-slate-400 block text-[11px]">Email · read-only</span>
              <strong className="text-slate-200 block truncate">{email || "Chưa có"}</strong>
              <p className="text-[10px] text-slate-500">Email danh tính do Supabase Auth quản lý, không sửa trực tiếp từ UI.</p>
            </div>
            <div className="p-3 rounded bg-white/[0.02] border border-white/5 space-y-1">
              <span className="font-mono text-slate-400 block text-[11px]">TrustScore · read-only</span>
              <strong className="text-slate-200 block">Không áp dụng cho User Profile</strong>
              <p className="text-[10px] text-slate-500">Chỉ cấp khi có thẩm quyền đánh giá từ Trust Engine.</p>
            </div>
            <div className="p-3 rounded bg-white/[0.02] border border-white/5 space-y-1">
              <span className="font-mono text-slate-400 block text-[11px]">StarLevel · read-only</span>
              <strong className="text-slate-200 block">Không áp dụng cho User Profile</strong>
              <p className="text-[10px] text-slate-500">Reputation và StarLevel chỉ thuộc về Expert Qualification.</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
            <span>Bạn muốn thẩm định chuyên môn?</span>
            <Link href="/expert/profile" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium">
              Xem lộ trình Expert Qualification <ArrowRight size={12} />
            </Link>
          </div>
        </section>

        {/* EDIT PROFILE MODAL (Strict allowlist) */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-profile-modal-title">
            <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0e131d] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-indigo-400" />
                  <h3 id="edit-profile-modal-title" className="text-base font-semibold text-slate-100">
                    Chỉnh sửa hồ sơ cá nhân
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>

              {saveError && (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs" role="alert">
                  {saveError}
                </div>
              )}

              <form onSubmit={save} className="space-y-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <label htmlFor="edit-fullname" className="block text-slate-300 mb-1 font-medium">
                      FullName (Họ và tên) *
                    </label>
                    <input
                      id="edit-fullname"
                      type="text"
                      value={draft.fullName}
                      onChange={(e) => updateDraft("fullName", e.target.value)}
                      maxLength={120}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-avatar" className="block text-slate-300 mb-1 font-medium">
                      AvatarUrl (Ảnh đại diện)
                    </label>
                    <input
                      id="edit-avatar"
                      type="url"
                      value={draft.avatarUrl}
                      onChange={(e) => updateDraft("avatarUrl", e.target.value)}
                      maxLength={1000}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="edit-university" className="block text-slate-300 mb-1 font-medium">
                        University (Trường đại học)
                      </label>
                      <input
                        id="edit-university"
                        type="text"
                        value={draft.university}
                        onChange={(e) => updateDraft("university", e.target.value)}
                        maxLength={180}
                        placeholder="VD: ĐH Sư phạm Kỹ thuật TP.HCM"
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-major" className="block text-slate-300 mb-1 font-medium">
                        Major (Ngành học)
                      </label>
                      <input
                        id="edit-major"
                        type="text"
                        value={draft.major}
                        onChange={(e) => updateDraft("major", e.target.value)}
                        maxLength={180}
                        placeholder="VD: Khoa học máy tính"
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="edit-bio" className="block text-slate-300 mb-1 font-medium">
                      Bio (Giới thiệu bản thân)
                    </label>
                    <textarea
                      id="edit-bio"
                      value={draft.bio}
                      onChange={(e) => updateDraft("bio", e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Chia sẻ ngắn gọn về sở thích học tập và hướng nghiên cứu của bạn..."
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px] text-slate-400">
                  <span>Chỉ gửi FullName, AvatarUrl, Bio, University, Major.</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Save size={14} /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </UnifiedAppShell>
  );
}
