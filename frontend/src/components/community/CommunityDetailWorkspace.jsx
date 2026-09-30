"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import { CommunityIntelligenceRail, ContributionCard } from "./CommunitySocialWorkspace";
import styles from "./community-v4.module.css";

export default function CommunityDetailWorkspace() {
  const params = useParams();
  const contributionId = typeof params?.postId === "string" ? params.postId : "";
  const { isAuthenticated } = useAuth();
  const [result, setResult] = useState({ requestKey: "", loading: true, post: null, error: "", sourceState: "UNKNOWN" });
  const [reloadKey, setReloadKey] = useState(0);
  const [expertStatus, setExpertStatus] = useState("");
  const showContext = useCallback((_post, status = "") => setExpertStatus(status), []);
  const requestKey = `${contributionId}:${reloadKey}`;

  useEffect(() => {
    if (!contributionId) return undefined;
    const controller = new AbortController();
    apiRequest(`/api/intelligence/community/experiences/${encodeURIComponent(contributionId)}`, {
      signal: controller.signal,
      requestId: createSecureId("community-detail"),
    }).then((payload) => {
      setResult({ requestKey, loading: false, post: payload?.experience || null, error: payload?.experience ? "" : "Bài viết không còn khả dụng.", sourceState: payload?.sourceState || "COMMUNITY_SIGNAL" });
    }).catch((caught) => {
      if (caught?.code !== "ABORTED") setResult({ requestKey, loading: false, post: null, error: apiErrorMessage(caught), sourceState: "UNKNOWN" });
    }).finally(() => {
      if (!controller.signal.aborted) setResult((current) => current.requestKey === requestKey ? { ...current, loading: false } : current);
    });
    return () => controller.abort("community-detail-unmounted");
  }, [contributionId, reloadKey, requestKey]);

  const resultIsCurrent = result.requestKey === requestKey;
  const loading = Boolean(contributionId) && (!resultIsCurrent || result.loading);
  const post = resultIsCurrent ? result.post : null;
  const error = !contributionId ? "Không tìm thấy mã đóng góp." : resultIsCurrent ? result.error : "";
  const sourceState = resultIsCurrent ? result.sourceState : "UNKNOWN";

  return (
    <section className={styles.communityPage} aria-labelledby="community-detail-heading">
      <Link href="/community" className={styles.backButton}><ArrowLeft size={15} /> Quay lại Community</Link>
      <header className={styles.feedHeading}>
        <div><span className={styles.eyebrow}>THẢO LUẬN CỘNG ĐỒNG</span><h2 id="community-detail-heading">Chi tiết đóng góp</h2></div>
      </header>
      {sourceState === "DEMO_FIXTURE" && <p className={styles.demoNotice}><Sparkles size={15} /> Đang xem dữ liệu minh họa; đây không phải nội dung cộng đồng đang hoạt động.</p>}
      {loading && <div className={styles.skeletonCard} role="status" aria-label="Đang tải bài viết"><span /><span /><span /><span /></div>}
      {!loading && error && <div className={styles.errorCard} role="alert"><AlertCircle size={19} /><div><strong>Không thể đọc đóng góp</strong><p>{error}</p></div></div>}
      {!loading && post && <div className={styles.detailLayout}>
        <div className={styles.feedColumn}><ContributionCard post={post} isAuthenticated={isAuthenticated} onShowContext={showContext} initialThreadOpen onReload={() => setReloadKey((value) => value + 1)} /></div>
        {(post.caseScope?.caseId || post.sources?.length || expertStatus) && <CommunityIntelligenceRail post={post} expertStatus={expertStatus} />}
      </div>}
    </section>
  );
}
