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

export const SYNTHETIC_EXPERT_PUBLIC_COUNT = 0;

function isSynthetic(expert) {
  return /staging verified expert|synthetic|fixture/i.test(`${expert?.name || ""} ${expert?.title || ""}`);
}

export default function ExpertNetworkWorkspace() {
  const { session, profile, isAuthenticated, moderatorEligible } = useAuth();
  const [experts, setExperts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("ALL");
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [lifecycle, setLifecycle] = useState(EXPERT_LIFECYCLE_STATE.NONE);
  const [application, setApplication] = useState(null);
  const [verifiedDomains, setVerifiedDomains] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

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

  useEffect(() => {
    const controller = new AbortController();
    void loadDirectory(controller.signal);
    return () => controller.abort("expert-directory-unmounted");
  }, [loadDirectory, reloadKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLifecycle(EXPERT_LIFECYCLE_STATE.NONE);
      setApplication(null);
      setVerifiedDomains([]);
      return undefined;
    }
    const controller = new AbortController();
    fetch("/api/expert/qualification", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const data = payload?.data || {};
        setLifecycle(normalizeExpertLifecycleState(data.state));
        setApplication(data.application || null);
        setVerifiedDomains(Array.isArray(data.application?.approvedDomains) ? data.application.approvedDomains : []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLifecycle(EXPERT_LIFECYCLE_STATE.NONE);
      });
    return () => controller.abort("expert-state-unmounted");
  }, [isAuthenticated]);

  const presentationState = resolvePresentationState({ session, expertState: lifecycle });
  const activeExpert = presentationState === PRESENTATION_STATE.ACTIVE_EXPERT;
  const publicExperts = useMemo(() => experts.filter((expert) => !isSynthetic(expert)), [experts]);

  return (
    <div className="unified-workspace unified-expert-workspace" data-public-synthetic-count={SYNTHETIC_EXPERT_PUBLIC_COUNT} data-presentation-state={presentationState}>
      <ExpertCinematicHero experts={publicExperts} />

      {!isAuthenticated && <div className="unified-auth-boundary"><div><strong>Xem danh bạ công khai trước khi đăng nhập.</strong><p>Bạn có thể tìm chuyên gia và đọc domain đã xác minh; đăng nhập để bắt đầu qualification.</p></div><Link href="/login?next=%2Fexpert" className="primary-action">Đăng nhập</Link></div>}

      <ExpertAuthorityNetwork experts={publicExperts} selected={selected} onSelect={setSelected} />
      <ExpertPublicDirectory experts={publicExperts} selected={selected} query={query} domain={domain} onQueryChange={setQuery} onDomainChange={setDomain} onSelect={setSelected} onRetry={() => setReloadKey((value) => value + 1)} loading={directoryLoading} error={directoryError} />
      {isAuthenticated && !activeExpert && <ExpertQualificationWorkspace lifecycle={lifecycle} application={application} />}
      {!isAuthenticated && <ExpertQualificationWorkspace publicView />}
      {activeExpert && <ExpertOperationalWorkspace profile={profile} verifiedDomains={verifiedDomains} moderatorEligible={moderatorEligible} />}
      {selected && <section className="expert-public-dossier" aria-labelledby="expert-public-dossier-title"><div><span className="expert-kicker">Public profile / safe projection</span><h2 id="expert-public-dossier-title">{selected.name}</h2><p>{selected.bio || "Chưa có tiểu sử công khai."}</p></div><div className="expert-dossier-fields"><span><ShieldCheck size={14} /> {selected.verificationSummary?.identity === "VERIFIED" ? "Đã xác minh theo projection" : "Chưa có identity verification"}</span><span>Phạm vi: {selected.scopes?.length ? selected.scopes.map((scope) => scope.domain.replaceAll("_", " ")).join(" · ") : "Chưa công bố"}</span><span>Thông tin liên hệ riêng tư không hiển thị.</span></div><Link href={`/expert/profile/${encodeURIComponent(selected.expertId)}`} className="text-link">Mở hồ sơ công khai <ArrowRight size={14} /></Link></section>}
      <ExpertPublicStory selected={selected} />
    </div>
  );
}
