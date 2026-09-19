"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE, PRESENTATION_STATE, normalizeExpertLifecycleState, resolvePresentationState } from "@/lib/auth/presentationState";
import { getExpertRuntimeProvider, SCOPED_PROVIDER_MODE } from "@/lib/backend/scopedRuntimeProvider";
import { ApiError, apiErrorMessage } from "@/lib/api/runtimeError";
import { createWorkIdentity } from "@/lib/ui-state/clientModel";
import ExpertPublicDirectory from "./ExpertPublicDirectory";
import ExpertQualificationWorkspace from "./ExpertQualificationWorkspace";
import ExpertOperationalWorkspace from "./ExpertOperationalWorkspace";
import ExpertCinematicHero from "./ExpertCinematicHero";
import ExpertAuthorityNetwork from "./ExpertAuthorityNetwork";
import ExpertPublicStory from "./ExpertPublicStory";
import FormalExpertAssessmentCard from "./FormalExpertAssessmentCard";
import ReputationMatrixCard from "./ReputationMatrixCard";
import ExpertReviewDeskModal from "./ExpertReviewDeskModal";

export const SYNTHETIC_EXPERT_PUBLIC_COUNT = 0;

function isSynthetic(expert) {
  return /staging verified expert|synthetic|fixture/i.test(`${expert?.name || ""} ${expert?.title || ""}`);
}

export default function ExpertNetworkWorkspace() {
  const {
    session,
    profile,
    isAuthenticated,
    moderatorEligible,
    expertLifecycleState: lifecycle,
    expertApplication: application,
    verifiedDomains = [],
  } = useAuth();
  const [experts, setExperts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("ALL");
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isReviewDeskOpen, setIsReviewDeskOpen] = useState(false);
  const [activeReviewCase, setActiveReviewCase] = useState(null);

  const openReviewDesk = useCallback(async () => {
    try {
      const res = await fetch("/api/expert/blind-reviews", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setActiveReviewCase(data.reviews[0]);
        } else {
          setActiveReviewCase(null);
        }
      } else {
        setActiveReviewCase(null);
      }
    } catch {
      setActiveReviewCase(null);
    }
    setIsReviewDeskOpen(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", "review-desk");
      window.history.pushState({}, "", url.toString());
    }
  }, []);

  const closeReviewDesk = useCallback(() => {
    setIsReviewDeskOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      window.history.pushState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "review-desk") {
        void openReviewDesk();
      }
      const handlePopState = () => {
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.get("view") === "review-desk") {
          setIsReviewDeskOpen(true);
        } else {
          setIsReviewDeskOpen(false);
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [openReviewDesk]);

  const loadDirectory = useCallback(async (signal) => {
    setDirectoryLoading(true);
    setDirectoryError("");
    try {
      const result = await getExpertRuntimeProvider().listExperts({ limit: 60, requestId: createWorkIdentity("expert-directory").requestId }, signal);
      if (result?.error?.code === "ABORTED" || signal?.aborted) return;
      if (result.state === "SUCCESS" || result.state === "EMPTY") {
        const nextExperts = SCOPED_PROVIDER_MODE === "DEMO"
          ? []
          : (Array.isArray(result.data) ? result.data : []).filter((expert) => !isSynthetic(expert));
        setExperts(nextExperts);
        setSelected((current) => nextExperts.find((expert) => expert.expertId === current?.expertId) || nextExperts[0] || null);
      } else {
        setDirectoryError(result.error?.userMessage || "Danh bạ chuyên gia tạm thời chưa khả dụng.");
      }
    } catch (caught) {
      if (!(caught instanceof ApiError && caught.code === "ABORTED")) setDirectoryError(apiErrorMessage(caught));
    } finally {
      if (!signal?.aborted) setDirectoryLoading(false);
    }
  }, []);

  const submitAssessment = useCallback(async (payload) => {
    const response = await fetch("/api/expert/assessments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": payload.idempotencyKey || `expert-assessment:${payload.caseId}:${payload.assignmentId}`,
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      throw new Error(result?.error?.userMessage || "Không thể lưu đánh giá chuyên môn.");
    }
    setActiveReviewCase((current) => current ? { ...current, formalAssessment: result.data } : current);
    return result.data;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadDirectory(controller.signal);
    return () => controller.abort("expert-directory-unmounted");
  }, [loadDirectory, reloadKey]);

  const presentationState = resolvePresentationState({ session, expertState: lifecycle });
  const activeExpert = presentationState === PRESENTATION_STATE.ACTIVE_EXPERT;
  const isApplicant = isAuthenticated && !activeExpert && lifecycle !== EXPERT_LIFECYCLE_STATE.NONE;
  const publicExperts = useMemo(() => experts.filter((expert) => !isSynthetic(expert)), [experts]);

  return (
    <div className="expert-council-space" data-pillar="expert">
      <div className="unified-workspace unified-expert-workspace" data-public-synthetic-count={SYNTHETIC_EXPERT_PUBLIC_COUNT} data-presentation-state={presentationState}>

        {/* ROLE 1: QUALIFIED ACTIVE EXPERT WORKSPACE */}
        {activeExpert && (
          <>
            <header className="expert-role-header expert-header-active border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 to-slate-950/60 rounded-xl p-6 mb-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} /> EXPERT COUNCIL MEMBER · ACTIVE JURISDICTION
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-serif text-white mt-1">Bàn làm việc Giám định Chuyên gia</h1>
                  <p className="text-slate-300 text-sm mt-1">
                    Thẩm quyền domain: {verifiedDomains.length ? verifiedDomains.map((d) => String(d).replaceAll("_", " ")).join(" · ") : "Đang cập nhật"}
                  </p>
                </div>
                <button
                  type="button"
                  id="open-review-desk-button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition-colors shadow-lg cursor-pointer"
                  onClick={openReviewDesk}
                >
                  <ShieldCheck size={16} /> Mở bàn giám định (Review Desk)
                </button>
              </div>
            </header>

            <ExpertOperationalWorkspace profile={profile} verifiedDomains={verifiedDomains} moderatorEligible={moderatorEligible} />
          </>
        )}

        {/* ROLE 2: APPLICANT IN PROGRESS */}
        {isApplicant && (
          <>
            <header className="expert-role-header expert-header-applicant border border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-slate-950/60 rounded-xl p-6 mb-6 shadow-xl">
              <span className="text-amber-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} /> TIẾN TRÌNH KIỂM ĐỊNH CHUYÊN MÔN (QUALIFICATION)
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-white mt-1">Hồ sơ Ứng tuyển Chuyên gia</h1>
              <p className="text-slate-300 text-sm mt-1">
                Theo dõi và hoàn thành các giai đoạn kiểm định: Xác minh danh tính, Bài kiểm tra kiến thức, và Thẩm định domain.
              </p>
            </header>

            <ExpertQualificationWorkspace lifecycle={lifecycle} application={application} />
          </>
        )}

        {/* ROLE 3: NORMAL USER / PUBLIC DIRECTORY */}
        {!activeExpert && !isApplicant && (
          <header className="expert-role-header expert-header-directory border border-white/10 bg-slate-950/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} /> EXPERT COUNCIL / HỘI ĐỒNG CHUYÊN GIA
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif text-white mt-1">
                  Danh bạ Chuyên gia & Thẩm quyền Domain
                </h1>
                <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                  Tìm kiếm, đối chiếu và kết nối với các chuyên gia độc lập đã được xác minh theo từng domain chuyên môn.
                </p>
              </div>
              <div>
                {isAuthenticated ? (
                  <Link
                    href="/expert/profile"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm transition-colors"
                  >
                    Trở thành Chuyên gia <ArrowRight size={14} />
                  </Link>
                ) : (
                  <Link
                    href="/login?next=%2Fexpert"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition-colors"
                  >
                    Đăng nhập để ứng tuyển <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          </header>
        )}

        {!isAuthenticated && (
          <div className="unified-auth-boundary">
            <div>
              <strong>Xem danh bạ công khai trước khi đăng nhập.</strong>
              <p>Bạn có thể tìm chuyên gia và đọc domain đã xác minh; đăng nhập để bắt đầu qualification.</p>
            </div>
            <Link href="/login?next=%2Fexpert" className="primary-action">Đăng nhập</Link>
          </div>
        )}

        <ExpertAuthorityNetwork experts={publicExperts} selected={selected} onSelect={setSelected} />
        <ExpertPublicDirectory
          experts={publicExperts}
          selected={selected}
          query={query}
          domain={domain}
          onQueryChange={setQuery}
          onDomainChange={setDomain}
          onSelect={setSelected}
          onRetry={() => setReloadKey((value) => value + 1)}
          loading={directoryLoading}
          error={directoryError}
        />

        {/* Informational Qualification footer for Normal Users */}
        {!activeExpert && !isApplicant && (
          <>
            {isAuthenticated ? (
              <ExpertQualificationWorkspace lifecycle={lifecycle} application={application} />
            ) : (
              <ExpertQualificationWorkspace publicView />
            )}
          </>
        )}

        {selected && (
          <>
            <section className="expert-public-dossier" aria-labelledby="expert-public-dossier-title">
              <div>
                <span className="expert-kicker">Public profile / safe projection</span>
                <h2 id="expert-public-dossier-title">{selected.name}</h2>
                <p>{selected.bio || "Chưa có tiểu sử công khai."}</p>
              </div>
              <div className="expert-dossier-fields">
                <span><ShieldCheck size={14} /> {selected.verificationSummary?.identity === "VERIFIED" ? "Đã xác minh theo projection" : "Chưa có identity verification"}</span>
                <span>Phạm vi: {selected.scopes?.length ? selected.scopes.map((scope) => scope.domain.replaceAll("_", " ")).join(" · ") : "Chưa công bố"}</span>
                <span>Thông tin liên hệ riêng tư không hiển thị.</span>
              </div>
              <Link href={`/expert/profile/${encodeURIComponent(selected.expertId)}`} className="text-link">Mở hồ sơ công khai <ArrowRight size={14} /></Link>
            </section>

            {/* Structured Formal Assessment & Reputation Matrix surfaces */}
            <section className="expert-evaluation-surfaces space-y-6 my-8" aria-label="Đánh giá và Chỉ số Chuyên gia">
              <FormalExpertAssessmentCard assessment={selected.formalAssessment || null} />
              <ReputationMatrixCard reputationData={selected.reputationData || selected.metrics || null} />
            </section>
          </>
        )}
        <ExpertPublicStory selected={selected} />

        {isReviewDeskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <ExpertReviewDeskModal
              isOpen={isReviewDeskOpen}
              onClose={closeReviewDesk}
              caseDossier={activeReviewCase}
              onSubmitAssessment={submitAssessment}
            />
          </div>
        )}
      </div>
    </div>
  );
}
