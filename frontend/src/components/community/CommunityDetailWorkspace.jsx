"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, ExternalLink, FileSearch, RefreshCw, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE, normalizeExpertLifecycleState } from "@/lib/auth/presentationState";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import CommunityPostCard from "./CommunityPostCard";

function normalizePost(post) {
  const author = post?.author || {};
  const sources = Array.isArray(post?.sources) ? post.sources : Array.isArray(post?.links) ? post.links : [];
  const media = Array.isArray(post?.media) ? post.media : Array.isArray(post?.images) ? post.images : [];
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const perception = post?.communityPerception || {};
  return {
    ...post,
    postId: post?.postId || post?.id || "community-post",
    author: { name: author.name || post?.authorName || "Cộng đồng StudentHub", avatarUrl: author.avatarUrl || post?.authorAvatarUrl || null, isExpert: author.isExpert === true, role: author.role || null },
    location: post?.location || post?.campus || null,
    topic: String(post?.topic || post?.category || "GENERAL").toUpperCase(),
    media,
    sources,
    sourceCount: Number(post?.sourceCount ?? sources.length),
    commentCount: Number(post?.commentCount ?? comments.length),
    communityPerception: { trust: Number(perception.trust || post?.trustVoteCount || 0), doubt: Number(perception.doubt || post?.distrustVoteCount || 0) },
    comments: comments.map((comment) => ({
      commentId: comment.commentId || comment.id,
      author: comment.author || { name: comment.authorName || "Thành viên cộng đồng" },
      text: comment.text || comment.content || "",
      createdAt: comment.createdAt || comment.created_at || null,
    })),
    status: post?.status ? String(post.status).toUpperCase() : null,
    trustCase: post?.trustCase || null,
    caseScope: post?.caseScope || null,
    trustLinked: post?.trustLinked === true,
    expertResponse: post?.expertResponse || null,
    evidence: Array.isArray(post?.evidence) ? post.evidence : [],
    independenceSignal: post?.independenceSignal || null,
    isAuthoritative: false,
  };
}

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SV";
}

function publicSourceUrl(value) {
  return typeof value === "string" && /^https:\/\//i.test(value) ? value : null;
}

function atmosphereFor(topic) {
  if (topic === "SCHOLARSHIP") return V3_MEDIA.shared.evidencePaper;
  if (topic === "SAFETY" || topic === "SECURITY") return V3_MEDIA.shared.prismTexture;
  return V3_MEDIA.community.discussion;
}

function trustHref(post) {
  const scope = post?.trustCase || post?.caseScope || null;
  if (!scope?.caseId) return null;
  const revision = Number.isInteger(Number(scope.caseRevision)) ? Number(scope.caseRevision) : null;
  return revision === null
    ? `/trust?caseId=${encodeURIComponent(scope.caseId)}`
    : `/trust?caseId=${encodeURIComponent(scope.caseId)}&caseRevision=${revision}`;
}

export default function CommunityDetailWorkspace() {
  const params = useParams();
  const { isAuthenticated, moderatorEligible } = useAuth();
  const postId = typeof params?.postId === "string" ? params.postId : "";
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expertLifecycleState, setExpertLifecycleState] = useState(EXPERT_LIFECYCLE_STATE.NONE);

  const load = useCallback(async (signal) => {
    if (!postId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await apiRequest(`/api/community/social?postId=${encodeURIComponent(postId)}`, { signal, requestId: createSecureId("community-detail") });
      const nextPost = Array.isArray(payload?.posts) && payload.posts[0] ? normalizePost(payload.posts[0]) : null;
      setPost(nextPost);
      if (!nextPost) setError("Bài viết không còn khả dụng.");
    } catch (caught) {
      try {
        const fallback = await apiRequest("/api/forum/posts?sortBy=newest", { signal, requestId: createSecureId("community-detail-fallback") });
        const match = Array.isArray(fallback?.posts) ? fallback.posts.find((item) => String(item?.id || item?.postId) === postId) : null;
        setPost(match ? normalizePost(match) : null);
        if (!match) setError(apiErrorMessage(caught));
      } catch (fallbackError) {
        if (caught?.code !== "ABORTED") setError(apiErrorMessage(fallbackError || caught));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort("community-detail-unmounted");
  }, [load]);

  useEffect(() => {
    if (!isAuthenticated) {
      setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
      return undefined;
    }
    const controller = new AbortController();
    fetch("/api/expert/qualification", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setExpertLifecycleState(normalizeExpertLifecycleState(payload?.data?.state)))
      .catch(() => {
        if (!controller.signal.aborted) setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
      });
    return () => controller.abort("community-detail-expert-state-unmounted");
  }, [isAuthenticated]);

  const interact = async (currentPost, action, details = {}) => {
    if (!isAuthenticated) return;
    try {
      const payload = await apiRequest("/api/community/social", { method: "PATCH", body: JSON.stringify({ postId: currentPost.postId, action, ...details }), requestId: createSecureId("community-detail-interaction") });
      if (payload?.post) setPost(normalizePost(payload.post));
    } catch (caught) {
      setError(apiErrorMessage(caught));
    }
  };

  const backgroundImage = useMemo(() => post ? atmosphereFor(post.topic) : V3_MEDIA.community.discussion, [post]);
  const trustLink = trustHref(post);
  const trustProjection = post?.trustCase || post?.caseScope || null;
  const trustLayers = Array.isArray(trustProjection?.layers) ? trustProjection.layers : [];
  const comments = post?.comments || [];
  const hasEvidence = Boolean(post?.sources?.length || post?.media?.length || post?.evidence?.length);

  return (
    <div className="unified-workspace unified-community-detail-workspace">
      <Link href="/community" className="text-link community-back-link"><ArrowLeft size={15} /> Quay lại Community</Link>
      {loading && <div className="community-detail-skeleton" role="status" aria-label="Đang tải bài viết"><span /><span /><span /></div>}
      {!loading && error && <div className="community-state community-state-error" role="alert"><div><strong>Không thể đọc bài viết.</strong><p>{error}</p></div><button type="button" onClick={() => void load()}><RefreshCw size={14} /> Thử lại</button></div>}
      {!loading && !error && post && (
        <>
          <header className="community-detail-hero" style={{ "--community-detail-atmosphere": `url(${backgroundImage})` }}>
            <div className="community-detail-hero-image" aria-hidden="true" />
            <div className="community-detail-hero-copy">
              <div className="community-post-context"><span>{post.topic}</span>{post.location && <span>{post.location}</span>}{post.status && <span>{post.status}</span>}</div>
              <h1>{post.title || "Bài chia sẻ cộng đồng"}</h1>
              <p>{post.content || "Bài đăng chưa có nội dung công khai."}</p>
              <div className="community-detail-byline"><span className="community-author-avatar">{initials(post.author?.name)}</span><span>{post.author?.name || "Cộng đồng StudentHub"}</span><span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString("vi-VN") : "Ngày đăng chưa có dữ liệu"}</span></div>
            </div>
          </header>

          <section className="community-detail-article" aria-labelledby="community-detail-article-title">
            <div className="community-detail-section-heading"><div><span className="community-kicker">Original question</span><h2 id="community-detail-article-title">Câu hỏi và bối cảnh</h2></div><span className="community-detail-status">{post.isAuthoritative ? "Authoritative" : "Community signal"}</span></div>
            <CommunityPostCard post={post} canInteract={isAuthenticated} activeExpert={expertLifecycleState === EXPERT_LIFECYCLE_STATE.ACTIVE} moderatorEligible={moderatorEligible} onInteract={(action, details) => interact(post, action, details)} onModerate={() => setError("Công cụ kiểm duyệt chỉ mở cho moderator được máy chủ cấp quyền.")} />
          </section>

          <section className="community-detail-evidence" aria-labelledby="community-detail-evidence-title">
            <div className="community-detail-section-heading"><div><span className="community-kicker">Evidence attached</span><h2 id="community-detail-evidence-title">Nguồn được công bố</h2></div><FileSearch size={18} aria-hidden="true" /></div>
            {hasEvidence ? (
              <div className="community-detail-evidence-grid">
                <div className="community-detail-evidence-list">
                  {post.sources?.map((source, index) => {
                    const href = publicSourceUrl(source);
                    const label = typeof source === "string" ? source : `Nguồn công khai ${index + 1}`;
                    return href ? <a href={href} target="_blank" rel="noreferrer" key={href}><ExternalLink size={14} /><span>{label}</span></a> : <span className="community-detail-evidence-file" key={`${label}-${index}`}><BookOpen size={14} /><span>{label}</span></span>;
                  })}
                  {post.media?.map((source) => <span className="community-detail-evidence-file" key={source}><BookOpen size={14} /><span>{source}</span></span>)}
                  {post.evidence?.map((item, index) => <span className="community-detail-evidence-file" key={item.evidenceId || item.id || index}><ShieldCheck size={14} /><span>{item.label || item.summary || "Evidence reference"}</span></span>)}
                </div>
                <div className="community-detail-evidence-art">
                  {/* The archive visual gives the inspector a stable, editorial surface when a post has evidence. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={V3_MEDIA.shared.evidencePaper} alt="Minh họa khu vực kiểm tra nguồn của bài đăng" loading="lazy" />
                  <span>{post.sources?.length || 0} nguồn và {post.media?.length || 0} tệp trong projection</span>
                </div>
              </div>
            ) : (
              <div className="community-detail-unresolved"><ShieldCheck size={17} /><div><strong>Chưa có bằng chứng đính kèm trong projection.</strong><p>Không suy ra độ đúng từ văn bản bài đăng hoặc tín hiệu cộng đồng.</p></div></div>
            )}
          </section>

          {trustLink && (
            <section className="community-trust-link-card" aria-labelledby="community-trust-link-title">
              <div><span className="community-kicker">Trust linked</span><h2 id="community-trust-link-title">Claim này có một Trust case</h2><p>Trust được giữ nguyên scope và revision. Mở kết quả hiện có để đọc các lớp L1 đến L5.</p><div className="community-trust-projection"><span>Trust verdict projection</span><strong>{trustProjection?.verdict || trustProjection?.status || "Verdict chưa công bố"}</strong>{trustLayers.length ? <div>{trustLayers.slice(0, 5).map((layer, index) => <small key={layer.id || layer.layer || index}>{layer.id || layer.layer || `L${index + 1}`}: {layer.status || "Chưa công bố"}</small>)}</div> : <small>L1 đến L5 chưa được trả về trong projection này.</small>}</div></div>
              <Link href={trustLink} className="primary-action"><ShieldCheck size={15} /> Mở Trust result <ArrowRight size={15} /></Link>
            </section>
          )}

          <section className="community-discussion-flow" aria-labelledby="community-discussion-flow-title">
            <div className="community-detail-section-heading"><div><span className="community-kicker">Discussion</span><h2 id="community-discussion-flow-title">Luồng hiểu biết</h2><p>Phản hồi được hiển thị theo thứ tự công khai. Mỗi phản hồi vẫn là một tín hiệu cần đọc trong phạm vi của nó.</p></div><span className="community-detail-status">{comments.length} phản hồi</span></div>
            <ol className="community-discussion-timeline">
              <li className="is-origin"><span className="community-timeline-node"><BookOpen size={14} /></span><div><span className="community-kicker">Question</span><strong>{post.title || "Câu hỏi cộng đồng"}</strong><p>{post.content || "Chưa có nội dung công khai."}</p></div></li>
              {comments.map((comment) => <li key={comment.commentId}><span className="community-timeline-node">{initials(comment.author?.name)}</span><div><span className="community-kicker">Community response</span><strong>{comment.author?.name || "Thành viên cộng đồng"}</strong><p>{comment.text || "Phản hồi chưa có nội dung."}</p></div></li>)}
              {post.expertResponse && <li className="is-expert"><span className="community-timeline-node"><ShieldCheck size={14} /></span><div><span className="community-kicker">Expert response</span><strong>{post.expertResponse.domain || "Phản hồi chuyên gia"}</strong><p>{post.expertResponse.summary || post.expertResponse.content || "Chưa có nội dung phản hồi công khai."}</p></div></li>}
            </ol>
            {comments.length === 0 && !post.expertResponse && <div className="community-detail-unresolved"><Check size={17} /><div><strong>Chưa có phản hồi công khai.</strong><p>Hãy quay lại khi dữ liệu thảo luận được server cập nhật.</p></div></div>}
          </section>

          <section className="community-related-discussions" aria-labelledby="community-related-title">
            <div><span className="community-kicker">Related discussions</span><h2 id="community-related-title">Tiếp tục đọc trong Community</h2><p>Danh sách liên quan chỉ xuất hiện khi API trả về quan hệ bài đăng. Hiện tại, bạn có thể trở lại feed theo chủ đề.</p></div>
            <Link href={`/community#community-feed`} className="text-link">Xem feed {post.topic ? `theo ${post.topic}` : ""} <ArrowRight size={15} /></Link>
          </section>
        </>
      )}
    </div>
  );
}
