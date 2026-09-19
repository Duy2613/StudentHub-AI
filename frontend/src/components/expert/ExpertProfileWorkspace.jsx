"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  FileCheck,
  FileText,
  Mail,
  Save,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE, normalizeExpertLifecycleState } from "@/lib/auth/presentationState";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import { clampReputationScore, MAX_REPUTATION_SCORE } from "@/lib/expert/reputationScore";
import AvatarDisplay from "@/components/AvatarDisplay";
import ExpertQualificationPanel from "./ExpertQualificationPanel";
import ExpertReviewDeskModal from "./ExpertReviewDeskModal";

function formatDate(isoString) {
  if (!isoString) return "Chưa có dữ liệu";
  try {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? "Chưa có dữ liệu" : d.toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "Chưa có dữ liệu";
  }
}

export default function ExpertProfileWorkspace() {
  const { profile, isAuthenticated, isLoading, status } = useAuth();
  const [lifecycle, setLifecycle] = useState(EXPERT_LIFECYCLE_STATE.NONE);
  const [profileData, setProfileData] = useState(null);
  const [viewLoading, setViewLoading] = useState(true);
  const [draft, setDraft] = useState({ bio: "", expertise: "" });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Review Desk Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchExpertProfile = () => {
    if (!isAuthenticated) {
      setViewLoading(false);
      return;
    }
    const controller = new AbortController();
    setViewLoading(true);
    setError("");
    apiRequest("/api/experts/me", { signal: controller.signal, requestId: createSecureId("expert-profile-read") })
      .then((payload) => {
        if (!payload?.expert || !payload?.qualification) {
          throw new Error("Owner expert profile response is missing the profile DTO.");
        }
        setProfileData(payload);
        const qualification = payload?.qualification || {};
        const nextProfile = payload?.profile || null;
        setLifecycle(normalizeExpertLifecycleState(nextProfile?.qualificationStatus || qualification.state));
        setDraft({
          bio: payload?.expert?.bio || nextProfile?.bio || "",
          expertise: payload?.expert?.expertise || nextProfile?.expertise || "",
        });
      })
      .catch((caught) => {
        if (!controller.signal.aborted) setError(apiErrorMessage(caught));
      })
      .finally(() => {
        if (!controller.signal.aborted) setViewLoading(false);
      });
    return () => controller.abort("expert-profile-unmounted");
  };

  useEffect(() => {
    const cleanup = fetchExpertProfile();
    return cleanup;
  }, [isAuthenticated]);

  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError("");
    try {
      const payload = await apiRequest("/api/experts/me", {
        method: "PUT",
        body: JSON.stringify({ Bio: draft.bio, Expertise: draft.expertise }),
        requestId: createSecureId("expert-profile-update"),
      });
      setProfileData((prev) => ({
        ...prev,
        ...payload,
        expert: {
          ...(prev?.expert || {}),
          bio: draft.bio,
          expertise: draft.expertise,
        },
      }));
      setEditing(false);
      setSaveSuccess(true);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenReviewModal = (task = null) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleSubmitAssessmentFromDesk = async (assessmentPayload) => {
    try {
      await apiRequest("/api/expert/assessments", {
        method: "POST",
        body: JSON.stringify({
          ...assessmentPayload,
          assignmentId: selectedTask?.id || assessmentPayload.assignmentId,
          caseId: selectedTask?.caseId || assessmentPayload.caseId,
          caseRevision: selectedTask?.caseRevision || assessmentPayload.caseRevision || 1,
          claimId: selectedTask?.claimId || assessmentPayload.claimId || null,
          domainCode: selectedTask?.domainCode || assessmentPayload.domainCode || "GENERAL_EPISTEMICS",
        }),
        headers: {
          "Idempotency-Key": createSecureId("expert-assessment-submit"),
        },
      });
      setModalOpen(false);
      fetchExpertProfile();
    } catch (err) {
      throw new Error(apiErrorMessage(err));
    }
  };

  if (isLoading || status === "UNKNOWN") {
    return <div className="workspace-loading" role="status">Đang xác minh phiên và đọc hồ sơ chuyên gia…</div>;
  }
  if (status === "ERROR") {
    return (
      <div className="unified-workspace unified-expert-profile-workspace">
        <section className="unified-auth-empty" role="alert">
          <UserRoundCheck size={25} />
          <h1>Không thể xác minh phiên</h1>
          <p>Dịch vụ xác thực hiện chưa khả dụng. Vui lòng thử lại sau.</p>
          <Link href="/" className="secondary-action">Về trang chủ</Link>
        </section>
      </div>
    );
  }
  if (status === "ANONYMOUS" || !isAuthenticated) {
    return (
      <div className="unified-workspace unified-expert-profile-workspace">
        <section className="unified-auth-empty">
          <UserRoundCheck size={25} />
          <h1>Hồ sơ chuyên gia</h1>
          <p>Đăng nhập để bắt đầu hoặc tiếp tục qualification. Hồ sơ này không dùng chung với vai trò của User Profile.</p>
          <Link href="/login?next=%2Fexpert%2Fprofile" className="primary-action">Đăng nhập</Link>
        </section>
      </div>
    );
  }

  if (viewLoading) {
    return <div className="workspace-loading" role="status">Đang đọc hồ sơ chuyên gia từ Owner backend…</div>;
  }

  if (error && !profileData) {
    return (
      <div className="unified-workspace unified-expert-profile-workspace">
        <section className="unified-auth-empty" role="alert">
          <AlertCircle size={25} />
          <h1>Hồ sơ chuyên gia chưa khả dụng</h1>
          <p>{error}</p>
          <button type="button" onClick={() => fetchExpertProfile()} className="primary-action">Thử lại</button>
        </section>
      </div>
    );
  }

  const isActive = lifecycle === EXPERT_LIFECYCLE_STATE.ACTIVE;
  const expert = profileData?.expert || {};
  const qualification = profileData?.qualification || {};
  const reputation = profileData?.reputation || {};
  const work = profileData?.work || { assigned: 0, pending: 0, inReview: 0, completed: 0, cancelled: 0 };
  const tasks = profileData?.tasks || [];
  const assessments = profileData?.assessments || [];
  const verifiedDomains = expert.verifiedDomains || profileData?.verifiedDomains || [];

  const publicName = expert.title || profileData?.fullName || profile?.fullName || "Chuyên gia StudentHub";
  const publicBio = expert.bio || "Chưa có tiểu sử chuyên gia.";
  const publicExpertise = expert.expertise || "Chưa có tóm tắt chuyên môn.";
  const starLevel = reputation.starLevel ?? null;
  const repPoints = clampReputationScore(reputation.reputation ?? 0);
  const completedReviews = reputation.completedReviews ?? work.completed ?? 0;

  return (
    <div className="unified-workspace unified-expert-profile-workspace max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* PROFESSIONAL AUTHORITY HEADER (Scholarly, compact, zero video) */}
      <header className="rounded-xl border border-emerald-500/20 bg-[#0a1215] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AvatarDisplay
              avatarUrl={profileData?.identity?.avatarUrl || profile?.avatarUrl}
              name={publicName}
              size="lg"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-slate-100">{publicName}</h1>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 size={12} /> ACTIVE / QUALIFIED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-950 text-amber-300 border border-amber-500/40">
                    <Clock size={12} /> {qualification.state || "QUALIFICATION IN PROGRESS"}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
                  <ShieldCheck size={13} /> {verifiedDomains.length > 0 ? verifiedDomains.join(", ") : "Chưa xác minh miền"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mail size={13} /> {profileData?.identity?.email || profile?.email || "Email nội bộ"}
                </span>
                {starLevel !== null && (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-mono">
                    <Star size={13} className="fill-amber-400 text-amber-400" /> StarLevel: {starLevel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                  <Scale size={13} /> Uy tín: {repPoints}/{MAX_REPUTATION_SCORE} pts
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                  <FileCheck size={13} /> Giám định hoàn thành: {completedReviews}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isActive && (
              <button
                type="button"
                onClick={() => handleOpenReviewModal(tasks[0] || null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                id="open-review-desk-cta"
              >
                <Scale size={14} /> Mở bàn giám định
              </button>
            )}
            <a
              href="#assessments-history"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-colors"
            >
              Lịch sử thẩm định
            </a>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2" role="alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2" role="status">
          <CheckCircle2 size={16} /> Đã cập nhật Bio và Expertise qua API server-owned an toàn.
        </div>
      )}

      {isActive ? (
        <>
          {/* WORK SUMMARY (Real durable task metrics) */}
          <section aria-labelledby="work-summary-title" className="space-y-3">
            <h2 id="work-summary-title" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tổng quan nhiệm vụ thẩm định (Durable Backend State)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3 space-y-1">
                <span className="text-[11px] text-slate-400 block">Được phân công</span>
                <strong className="text-xl font-bold font-mono text-emerald-400">{work.assigned}</strong>
                <small className="text-[10px] text-slate-500 block">Đang chờ nhận</small>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3 space-y-1">
                <span className="text-[11px] text-slate-400 block">Đang xử lý</span>
                <strong className="text-xl font-bold font-mono text-indigo-400">{work.inReview}</strong>
                <small className="text-[10px] text-slate-500 block">Đang nghiên cứu</small>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3 space-y-1">
                <span className="text-[11px] text-slate-400 block">Chờ đối soát</span>
                <strong className="text-xl font-bold font-mono text-amber-400">{work.pending}</strong>
                <small className="text-[10px] text-slate-500 block">Hàng đợi</small>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3 space-y-1">
                <span className="text-[11px] text-slate-400 block">Hoàn thành</span>
                <strong className="text-xl font-bold font-mono text-teal-400">{work.completed}</strong>
                <small className="text-[10px] text-slate-500 block">Đã nộp kết luận</small>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#0e131d] p-3 space-y-1">
                <span className="text-[11px] text-slate-400 block">Hết hạn / Hủy</span>
                <strong className="text-xl font-bold font-mono text-slate-400">{work.cancelled}</strong>
                <small className="text-[10px] text-slate-500 block">Hết hiệu lực</small>
              </div>
            </div>
          </section>

          {/* TWO MAIN COLUMNS: EXPERTISE & REVIEW DESK */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN: EXPERTISE & QUALIFICATION */}
            <div className="space-y-6">
              {/* EXPERTISE & BIO SECTION */}
              <section aria-labelledby="expertise-heading" className="rounded-xl border border-white/10 bg-[#0d121c] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-400" />
                    <h2 id="expertise-heading" className="text-sm font-semibold text-slate-100">
                      Chuyên môn &amp; Giới thiệu
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing((prev) => !prev)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                  >
                    <Edit3 size={12} /> {editing ? "Đóng" : "Sửa"}
                  </button>
                </div>

                {editing ? (
                  <form onSubmit={save} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Bio (Tiểu sử chuyên môn)</label>
                      <textarea
                        value={draft.bio}
                        onChange={(e) => updateDraft("bio", e.target.value)}
                        rows={4}
                        maxLength={1000}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-emerald-500"
                        placeholder="Tiểu sử và kinh nghiệm nghiên cứu..."
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Expertise (Lĩnh vực chuyên sâu)</label>
                      <textarea
                        value={draft.expertise}
                        onChange={(e) => updateDraft("expertise", e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-emerald-500"
                        placeholder="Các phân ngành am hiểu chính xác..."
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">Chỉ gửi Bio và Expertise.</span>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50"
                      >
                        <Save size={13} /> {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3 text-xs text-slate-300">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Miền thẩm định đã xác thực</span>
                      <div className="flex flex-wrap gap-1.5">
                        {verifiedDomains.map((dom) => (
                          <span key={dom} className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
                            {dom}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Tiểu sử</span>
                      <p className="text-slate-300 leading-relaxed">{publicBio}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Tóm tắt chuyên môn</span>
                      <p className="text-slate-300 leading-relaxed">{publicExpertise}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* QUALIFICATION LIFECYCLE AUDIT (Server-owned lifecycle) */}
              <section aria-labelledby="qualification-lifecycle-title" className="rounded-xl border border-white/10 bg-[#0d121c] p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <h2 id="qualification-lifecycle-title" className="text-sm font-semibold text-slate-100">
                    Vòng đời Qualification (Server-Owned)
                  </h2>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-slate-400">1. Identity Review</span>
                    <span className="text-emerald-400 font-mono inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> ĐÃ DUYỆT
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-slate-400">2. Bài thi trắc nghiệm (Quiz)</span>
                    <span className="text-emerald-400 font-mono inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> {qualification.quizScore !== null ? `${qualification.quizScore}/${qualification.quizMaxScore}đ (v${qualification.quizVersion || 1})` : "PASSED"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-slate-400">3. Giám định thực hành (Domain Review)</span>
                    <span className="text-emerald-400 font-mono inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> ĐÃ ĐỐI SOÁT
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-slate-400">4. Trạng thái kích hoạt</span>
                    <span className="text-emerald-300 font-mono font-bold">
                      {qualification.activationState || "ACTIVE"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic pt-1">
                  * Trạng thái chuyên gia được xác nhận bởi quy trình kiểm định đa bước của hệ thống máy chủ. Không thể tự kích hoạt hoặc sửa vai trò từ client.
                </p>
              </section>

              {/* REPUTATION POLICY EXPLANATION */}
              <section aria-labelledby="reputation-policy-title" className="rounded-xl border border-white/10 bg-[#0a0e17] p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Scale size={15} className="text-indigo-400" />
                  <h3 id="reputation-policy-title" className="font-semibold text-slate-200">
                    Nguyên tắc Uy tín Chuyên gia
                  </h3>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Điểm uy tín (Reputation: {repPoints}/{MAX_REPUTATION_SCORE}) phản ánh khối lượng và chất lượng đóng góp thực tế trên nền tảng theo chính sách máy chủ.
                </p>
                <div className="p-2 rounded bg-white/[0.02] border border-white/5 text-[10px] text-slate-500 space-y-1">
                  <div><strong>Không phải</strong> xác suất chân lý của phát biểu.</div>
                  <div><strong>Không phải</strong> chỉ số thông minh toàn cầu.</div>
                  <div><strong>Không thay thế</strong> thẩm quyền phán quyết của Trust L5.</div>
                </div>
              </section>
            </div>

            {/* RIGHT TWO COLUMNS: REVIEW DESK & FORMAL ASSESSMENTS */}
            <div className="lg:col-span-2 space-y-6">
              {/* REVIEW DESK: REAL TASKS */}
              <section aria-labelledby="review-desk-title" className="rounded-xl border border-white/10 bg-[#0d121c] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Scale size={18} className="text-emerald-400" />
                    <div>
                      <h2 id="review-desk-title" className="text-sm font-semibold text-slate-100">
                        Bàn giám định nhiệm vụ (Review Desk)
                      </h2>
                      <span className="text-[11px] text-slate-500">Chỉ hiển thị các hồ sơ Trust thật được phân công từ hệ thống.</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    {tasks.length} nhiệm vụ
                  </span>
                </div>

                {tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="p-4 rounded-lg border border-white/10 bg-black/30 space-y-2 hover:border-emerald-500/30 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-emerald-400 uppercase font-semibold">
                            Miền: {task.domainCode}
                          </span>
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/5 text-slate-300">
                            {task.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">
                          <strong>Hồ sơ Trust:</strong> #{task.caseId?.slice(0, 8)} (v{task.caseRevision})
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
                          <span>Giao lúc: {formatDate(task.createdAt)}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(task)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium text-xs transition-colors"
                          >
                            <Scale size={12} /> Giám định hồ sơ này
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-xs space-y-2 border border-dashed border-white/5 rounded-lg">
                    <CheckCircle2 size={24} className="mx-auto text-slate-600 mb-1" />
                    <p className="text-slate-400 font-medium">Bàn giám định hiện không có ca tồn đọng.</p>
                    <p className="text-slate-600 max-w-sm mx-auto text-[11px]">
                      Hệ thống điều phối sẽ tự động gán ca thẩm định mới khi người dùng gửi yêu cầu trong miền {verifiedDomains.join(", ") || "chuyên môn"}.
                    </p>
                  </div>
                )}
              </section>

              {/* FORMAL ASSESSMENTS HISTORY */}
              <section id="assessments-history" aria-labelledby="assessments-history-title" className="rounded-xl border border-white/10 bg-[#0d121c] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-indigo-400" />
                    <div>
                      <h2 id="assessments-history-title" className="text-sm font-semibold text-slate-100">
                        Lịch sử thẩm định chính thức (Formal Assessments)
                      </h2>
                      <span className="text-[11px] text-slate-500">Lưu trữ bất biến, bảo đảm chứng cứ và trách nhiệm chuyên gia.</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                    {assessments.length} hồ sơ đã nộp
                  </span>
                </div>

                {assessments.length > 0 ? (
                  <div className="space-y-3">
                    {assessments.map((a) => (
                      <div key={a.id} className="p-4 rounded-lg border border-white/5 bg-black/20 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-indigo-400 font-semibold">
                            Hồ sơ #{a.caseId?.slice(0, 8)} (v{a.caseRevision})
                          </span>
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/20">
                            {a.assessmentState || "SUBMITTED"}
                          </span>
                        </div>
                        {a.reasoning && (
                          <div className="text-xs text-slate-300 bg-black/40 p-2.5 rounded border border-white/5 italic">
                            &quot;{a.reasoning}&quot;
                          </div>
                        )}
                        {a.uncertainty && (
                          <div className="text-[11px] text-amber-300/80">
                            <strong>Giới hạn/Không chắc chắn:</strong> {a.uncertainty}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span>Độ tự tin: {Math.round(a.confidence * 100)}% · Miền: {a.domainCode}</span>
                          <span>Nộp ngày: {formatDate(a.submittedAt || a.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs space-y-1">
                    <p>Chưa có thẩm định chính thức nào được hoàn tất.</p>
                    <p className="text-[11px] text-slate-600">Các thẩm định sau khi nộp tại Review Desk sẽ xuất hiện tại đây.</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      ) : (
        <ExpertQualificationPanel />
      )}

      {/* READ-ONLY BOUNDARY NOTICE */}
      <footer className="p-4 rounded-xl border border-white/5 bg-[#0a0e17] text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>Hồ sơ Chuyên gia do server quản lý. Email, StarLevel, TrustScore, quyền thẩm định không nhận sửa đổi từ client.</span>
        </div>
        <Link href="/profile" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium shrink-0">
          Xem User Profile <ArrowRight size={12} />
        </Link>
      </footer>

      {/* REVIEW DESK MODAL FOR ACTIVE TASK */}
      <ExpertReviewDeskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        caseDossier={selectedTask ? {
          caseId: selectedTask.caseId,
          caseRevision: selectedTask.caseRevision,
          claimId: selectedTask.claimId,
          domainCode: selectedTask.domainCode,
          claimText: selectedTask.question || `Hồ sơ kiểm chứng Trust #${selectedTask.caseId?.slice(0, 8)}`,
          evidenceCount: 3,
        } : null}
        onSubmitAssessment={handleSubmitAssessmentFromDesk}
      />
    </div>
  );
}
