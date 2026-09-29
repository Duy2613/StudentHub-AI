"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import { CommunityIntelligenceRail, DiscussionCard } from "./CommunitySocialWorkspace";
import styles from "./community-v4.module.css";

export default function CommunityDiscussionDetailWorkspace() {
  const params = useParams();
  const postId = typeof params?.postId === "string" ? params.postId : "";
  const { isAuthenticated } = useAuth();
  const [result, setResult] = useState({ requestKey: "", post: null, error: "", loading: true });
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const requestKey = `${postId}:${reloadKey}`;

  useEffect(() => {
    if (!postId) return undefined;
    const controller = new AbortController();
    apiRequest(`/api/community/social?postId=${encodeURIComponent(postId)}`, {
      signal: controller.signal,
      requestId: createSecureId("community-discussion-detail"),
    }).then((payload) => {
      const post = Array.isArray(payload?.posts) ? payload.posts[0] : null;
      setResult({ requestKey, post, error: post ? "" : "Bài viết không còn khả dụng.", loading: false });
    }).catch((caught) => {
      if (caught?.code !== "ABORTED") setResult({ requestKey, post: null, error: apiErrorMessage(caught), loading: false });
    });
    return () => controller.abort("community-discussion-detail-unmounted");
  }, [postId, reloadKey, requestKey]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);
  const showContext = useCallback((post) => setSelectedPost(post), []);
  const current = result.requestKey === requestKey;
  const loading = Boolean(postId) && (!current || result.loading);

  return <section className={styles.communityPage} aria-labelledby="community-discussion-heading">
    <Link href="/community" className={styles.backButton}><ArrowLeft size={15} /> Quay lại Community</Link>
    <header className={styles.detailHeader}>
      <span className={styles.eyebrow}>CỘNG ĐỒNG</span>
      <h1 id="community-discussion-heading">Cuộc trò chuyện</h1>
    </header>
    {loading && <div className={styles.skeletonCard} role="status" aria-label="Đang tải bài viết"><span /><span /><span /><span /></div>}
    {!loading && current && result.error && <div className={styles.errorCard} role="alert"><AlertCircle size={19} /><div><strong>Không thể đọc bài viết</strong><p>{result.error}</p></div></div>}
    {!loading && current && result.post && <div className={styles.detailFeed}>
      <div className={styles.detailLayout}>
        <div className={styles.feedColumn}><DiscussionCard post={result.post} isAuthenticated={isAuthenticated} onShowContext={showContext} initiallyOpen onReload={reload} /></div>
        {(result.post.sources?.length || selectedPost?.sources?.length) && <CommunityIntelligenceRail post={result.post} />}
      </div>
    </div>}
  </section>;
}
