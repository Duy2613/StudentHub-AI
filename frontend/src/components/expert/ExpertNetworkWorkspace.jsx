"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CircleHelp, GraduationCap, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE, PRESENTATION_STATE, resolvePresentationState } from "@/lib/auth/presentationState";
import { getExpertRuntimeProvider, SCOPED_PROVIDER_MODE } from "@/lib/backend/scopedRuntimeProvider";
import { ApiError, apiErrorMessage } from "@/lib/api/runtimeError";
import { createWorkIdentity } from "@/lib/ui-state/clientModel";
import ExpertPublicDirectory from "./ExpertPublicDirectory";
import ExpertQualificationWorkspace from "./ExpertQualificationWorkspace";
import ExpertAdjudicationWorkspace from "./ExpertAdjudicationWorkspace";
import styles from "./expert-v4.module.css";

export default function ExpertNetworkWorkspace() {
  const { session, isAuthenticated, expertLifecycleState: lifecycle, expertApplication: application, verifiedDomains = [] } = useAuth();
  const [experts, setExperts] = useState([]);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("ALL");
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const presentationState = resolvePresentationState({ session, expertState: lifecycle });
  const activeExpert = presentationState === PRESENTATION_STATE.ACTIVE_EXPERT;
  const isApplicant = isAuthenticated && !activeExpert && lifecycle !== EXPERT_LIFECYCLE_STATE.NONE;

  const loadDirectory = useCallback(async (signal) => {
    setDirectoryLoading(true);
    setDirectoryError("");
    try {
      const result = await getExpertRuntimeProvider().listExperts({ limit: 60, requestId: createWorkIdentity("expert-directory").requestId }, signal);
      if (result?.error?.code === "ABORTED" || signal?.aborted) return;
      if (result.state === "SUCCESS" || result.state === "EMPTY") {
        const records = SCOPED_PROVIDER_MODE === "DEMO" ? [] : (Array.isArray(result.data) ? result.data : []);
        setExperts(records);
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
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) void loadDirectory(controller.signal);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort("expert-directory-unmounted");
    };
  }, [loadDirectory, reloadKey]);

  return (
    <div className={`expert-council-space ${styles.expertRoute}`} data-pillar="expert" data-presentation-state={presentationState}>
      {activeExpert ? <>
        <header className={styles.routeHeader}>
          <span className={styles.eyebrow}>EXPERT WORKSPACE</span>
          <h1>Đánh giá trong phạm vi chuyên môn</h1>
          <p>Queue chỉ hiển thị assignment do máy chủ gán. Trust, evidence và COI được giữ theo đúng phạm vi dossier.</p>
          <div className={styles.routeDomains}><ShieldCheck size={15} /><span>{verifiedDomains.length ? verifiedDomains.map((item) => String(item).replaceAll("_", " ")).join(" · ") : "Domain xác minh chưa có trong hồ sơ phiên này"}</span></div>
        </header>
        <ExpertAdjudicationWorkspace verifiedDomains={verifiedDomains} />
      </> : isApplicant ? <>
        <header className={styles.routeHeader}>
          <span className={styles.eyebrow}>QUALIFICATION</span>
          <h1>Hồ sơ ứng tuyển chuyên gia</h1>
          <p>Qualification và domain authority chỉ thay đổi theo phản hồi của máy chủ.</p>
        </header>
        <ExpertQualificationWorkspace lifecycle={lifecycle} application={application} />
      </> : <>
        <header className={styles.routeHeader}>
          <span className={styles.eyebrow}>EXPERT DIRECTORY</span>
          <h1>Chuyên môn có phạm vi rõ ràng</h1>
          <p>Tìm người theo domain và dữ liệu hồ sơ được công bố. Danh bạ không xếp hạng mức độ đáng tin của con người.</p>
          {isAuthenticated ? <Link href="/expert/profile" className={styles.routeAction}><GraduationCap size={16} /> Hồ sơ qualification <ArrowRight size={15} /></Link>
            : <Link href="/login?next=%2Fexpert" className={styles.routeAction}><BookOpenCheck size={16} /> Đăng nhập để bắt đầu qualification <ArrowRight size={15} /></Link>}
        </header>
        {!isAuthenticated && <p className={styles.publicAccessNote}><CircleHelp size={15} /> Bạn có thể đọc danh bạ công khai mà không cần đăng nhập.</p>}
      </>}

      <ExpertPublicDirectory
        experts={experts}
        query={query}
        domain={domain}
        onQueryChange={setQuery}
        onDomainChange={setDomain}
        onRetry={() => setReloadKey((value) => value + 1)}
        loading={directoryLoading}
        error={directoryError}
      />
    </div>
  );
}
