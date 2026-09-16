"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, FileText, Send, Clock, UserRound, Check, AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE, normalizeExpertLifecycleState } from "@/lib/auth/presentationState";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import SourceInspectorDrawer from "@/components/trust/SourceInspectorDrawer";

function normalizePost(post) {
  const author = post?.author || {};
  const sources = Array.isArray(post?.sources) ? post.sources : Array.isArray(post?.links) ? post.links : [];
  const media = Array.isArray(post?.media) ? post.media : Array.isArray(post?.images) ? post.images : [];
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const perception = post?.communityPerception || {};
  return {
    ...post,
    postId: post?.postId || post?.id || "community-post",
    author: {
      name: author.name || post?.authorName || "Cộng đồng StudentHub",
      avatarUrl: author.avatarUrl || post?.authorAvatarUrl || null,
      isExpert: author.isExpert === true,
      role: author.role || null,
    },
    location: post?.location || post?.campus || null,
    topic: String(post?.topic || post?.category || "GENERAL").toUpperCase(),
    media,
    sources,
    sourceCount: Number(post?.sourceCount ?? sources.length),
    commentCount: Number(post?.commentCount ?? comments.length),
    communityPerception: {
      trust: Number(perception.trust || post?.trustVoteCount || 0),
      doubt: Number(perception.doubt || post?.distrustVoteCount || 0),
    },
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
  return String(name || "Thành viên")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SV";
}

function dateLabel(value) {
  if (!value) return "Vừa đăng";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Vừa đăng"
    : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

function extractDomain(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export default function CommunityDetailWorkspace() {
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const postId = typeof params?.postId === "string" ? params.postId : "";
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [inspectedSource, setInspectedSource] = useState(null);
  const [expertLifecycleState, setExpertLifecycleState] = useState(EXPERT_LIFECYCLE_STATE.NONE);

  const load = useCallback(async (signal) => {
    if (!postId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await apiRequest(`/api/community/social?postId=${encodeURIComponent(postId)}`, {
        signal,
        requestId: createSecureId("community-detail"),
      });
      const nextPost = Array.isArray(payload?.posts) && payload.posts[0] ? normalizePost(payload.posts[0]) : null;
      setPost(nextPost);
      if (!nextPost) setError("Bài viết không còn khả dụng.");
    } catch (caught) {
      try {
        const fallback = await apiRequest("/api/forum/posts?sortBy=newest", {
          signal,
          requestId: createSecureId("community-detail-fallback"),
        });
        const match = Array.isArray(fallback?.posts)
          ? fallback.posts.find((item) => String(item?.id || item?.postId) === postId)
          : null;
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

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated || !post) return;
    try {
      const payload = await apiRequest("/api/community/social", {
        method: "PATCH",
        body: JSON.stringify({ postId: post.postId, action: "comment", text: commentText.trim() }),
        requestId: createSecureId("community-detail-comment"),
      });
      if (payload?.post) setPost(normalizePost(payload.post));
      setCommentText("");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    }
  };

  const handleOpenSource = (url, index) => {
    setInspectedSource({
      id: `${post?.postId || "post"}-source-${index}`,
      title: `Đường dẫn do người dùng cung cấp #${index + 1}`,
      publisher: "Liên kết bên ngoài từ người dùng",
      domain: extractDomain(url),
      url,
      sourceType: "COMMUNITY_SUBMITTED",
      relationship: "community_context",
      snippet: "Đường dẫn đính kèm làm căn cứ đối chiếu.",
      publishedAt: "Chưa xác minh",
      retrievedAt: "Thời điểm đăng tải",
      contentHash: "N/A",
    });
  };

  if (loading) {
    return (
      <div className="community-v2 community-detail-container" data-community-theme="editorial">
        <div className="community-detail-skeleton-dossier" role="status">
          <div className="community-skeleton-line w-32 h-6 mb-4" />
          <div className="community-skeleton-line w-3/4 h-10 mb-6" />
          <div className="community-skeleton-line w-full h-40" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="community-v2 community-detail-container" data-community-theme="editorial">
        <Link href="/community" className="community-detail-back-link">
          <ArrowLeft size={16} /> Quay lại Community
        </Link>
        <div className="community-feed-error-card mt-6" role="alert">
          <AlertCircle size={20} className="text-red-700" />
          <div>
            <strong>Không thể đọc bài viết</strong>
            <p>{error || "Bài viết không tồn tại hoặc đã bị gỡ."}</p>
          </div>
        </div>
      </div>
    );
  }

  const sources = post.sources || [];
  const media = post.media || [];
  const comments = post.comments || [];
  const evidenceTotal = sources.length + media.length;

  return (
    <div className="community-v2 community-detail-container" data-community-theme="editorial">
      <Link href="/community" className="community-detail-back-link">
        <ArrowLeft size={15} /> Quay lại Community
      </Link>

      {/* Header Banner */}
      <header className="community-detail-header-card">
        <div className="community-detail-header-meta">
          <span className="community-status-badge community-badge-insufficient">
            • CHƯA ĐỦ BẰNG CHỨNG
          </span>
          <span className="community-detail-header-tag">
            {post.topic} · QUAN SÁT {post.location ? `· ${post.location}` : ""}
          </span>
        </div>
        <h1 className="community-detail-claim-title">
          {post.title || "Quan sát thực địa từ cộng đồng"}
        </h1>
      </header>

      {/* 2-Column Dossier Layout */}
      <div className="community-detail-dossier-grid">
        {/* Left Column: Dossier Content & Evidence */}
        <div className="community-detail-dossier-main">
          {/* Claim / Observation */}
          <section className="community-dossier-section" aria-labelledby="detail-claim-heading">
            <h2 id="detail-claim-heading" className="community-dossier-section-title">
              CLAIM / OBSERVATION
            </h2>
            <p className="community-dossier-body-text">
              {post.content || "Chưa có mô tả chi tiết."}
            </p>
          </section>

          {/* Evidence & Provenance */}
          <section className="community-dossier-section" aria-labelledby="detail-evidence-heading">
            <h2 id="detail-evidence-heading" className="community-dossier-section-title">
              Evidence & provenance
            </h2>
            {evidenceTotal > 0 ? (
              <div className="community-dossier-evidence-list">
                {media.map((src, idx) => (
                  <div key={idx} className="community-dossier-evidence-item">
                    <div className="community-dossier-evidence-icon">
                      <FileText size={18} />
                    </div>
                    <div className="community-dossier-evidence-info">
                      <strong>Ảnh chụp hiện trường · đã che dữ liệu</strong>
                      <span>Tệp hình ảnh minh chứng · Nguồn người dùng cung cấp</span>
                    </div>
                  </div>
                ))}
                {sources.map((src, idx) => {
                  const domain = extractDomain(src);
                  return (
                    <div key={idx} className="community-dossier-evidence-item">
                      <div className="community-dossier-evidence-icon">
                        <FileText size={18} />
                      </div>
                      <div className="community-dossier-evidence-info">
                        <strong>Tài liệu tham khảo do người dùng cung cấp</strong>
                        <span>{domain || src} · Liên kết kiểm chứng</span>
                      </div>
                      <div className="community-dossier-evidence-actions">
                        <button
                          type="button"
                          className="community-source-btn"
                          onClick={() => handleOpenSource(src, idx)}
                        >
                          Chi tiết
                        </button>
                        <a
                          href={src}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="community-source-external-link"
                          title="Mở nguồn bên ngoài"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="community-dossier-empty-evidence">
                Quan sát này chưa đính kèm tài liệu minh chứng hoặc hình ảnh.
              </p>
            )}
          </section>

          {/* Discussion */}
          <section className="community-dossier-section" aria-labelledby="detail-discussion-heading">
            <h2 id="detail-discussion-heading" className="community-dossier-section-title">
              Thảo luận cộng đồng
            </h2>

            {/* Expert Response if present */}
            {post.expertResponse && (
              <div className="community-card-expert-response mb-4">
                <div className="community-expert-header">
                  <ShieldCheck size={16} className="text-purple-700" />
                  <div>
                    <span className="community-expert-title">
                      {post.expertResponse.expertName || "TS. Nguyễn An"} · EXPERT
                    </span>
                    <p className="community-expert-disclaimer">
                      Phản hồi mang tính phân tích chuyên môn độc lập.
                    </p>
                  </div>
                </div>
                <p className="community-expert-content">
                  {post.expertResponse.summary || post.expertResponse.content || "Chưa có nội dung phản hồi."}
                </p>
              </div>
            )}

            {comments.length > 0 ? (
              <div className="community-detail-comments-list">
                {comments.map((c) => (
                  <div key={c.commentId} className="community-detail-comment-card">
                    <div className="community-comment-avatar">
                      {initials(c.author?.name)}
                    </div>
                    <div className="community-comment-body">
                      <div className="community-comment-header">
                        <strong>{c.author?.name || "Thành viên"}</strong>
                        <span>{dateLabel(c.createdAt)}</span>
                      </div>
                      <p>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="community-comments-empty">
                Chưa có phản hồi nào trên quan sát này.
              </p>
            )}

            {isAuthenticated ? (
              <form onSubmit={submitComment} className="community-comment-input-bar mt-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={2000}
                  placeholder="Thêm góc nhìn hoặc bổ sung bằng chứng..."
                  className="community-comment-input"
                  aria-label="Nội dung thảo luận"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="community-comment-submit-btn"
                  aria-label="Gửi thảo luận"
                >
                  <Send size={14} />
                </button>
              </form>
            ) : (
              <div className="mt-4 p-3 bg-stone-100 rounded text-center text-xs text-stone-600">
                <Link href="/login?next=%2Fcommunity" className="text-blue-700 font-medium">
                  Đăng nhập để tham gia thảo luận cùng cộng đồng →
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Metadata Dossier Rail */}
        <aside className="community-detail-dossier-rail">
          {/* Timeline */}
          <div className="community-detail-sidebar-card">
            <h3 className="community-sidebar-title">Timeline</h3>
            <div className="community-sidebar-timeline">
              <div className="community-timeline-item">
                <span className="community-timeline-dot" />
                <div>
                  <strong>Quan sát được đăng</strong>
                  <p>{dateLabel(post.createdAt)}</p>
                </div>
              </div>
              <div className="community-timeline-item">
                <span className="community-timeline-dot" />
                <div>
                  <strong>Evidence được liên kết</strong>
                  <p>{evidenceTotal} nguồn / tệp đính kèm</p>
                </div>
              </div>
              <div className="community-timeline-item">
                <span className="community-timeline-dot" />
                <div>
                  <strong>Trạng thái hiện tại</strong>
                  <p>CHƯA ĐỦ BẰNG CHỨNG</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tác giả */}
          <div className="community-detail-sidebar-card">
            <h3 className="community-sidebar-title">Tác giả</h3>
            <div className="community-sidebar-author">
              <strong>{post.author?.name || "Thành viên StudentHub"}</strong>
              <p className="text-xs text-stone-500 mt-1">
                Phản ánh lịch sử đóng góp, không đại diện cho tính đúng của claim.
              </p>
            </div>
          </div>

          {/* Correction History */}
          <div className="community-detail-sidebar-card">
            <h3 className="community-sidebar-title">Correction history</h3>
            <div className="community-sidebar-history">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5" />
                <div>
                  <strong>Phiên bản hiện tại</strong>
                  <p className="text-xs text-stone-500">Chưa có đính chính cho quan sát này.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Link if present */}
          {post.trustLinked && (
            <div className="community-detail-sidebar-card bg-sky-50/60 border-sky-200">
              <h3 className="community-sidebar-title text-sky-900">Liên kết Trust Engine</h3>
              <p className="text-xs text-sky-800 mb-2">
                Claim này đã được chuyển tiếp vào quy trình kiểm chứng Trust.
              </p>
              <Link href="/trust" className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                Xem hồ sơ Trust →
              </Link>
            </div>
          )}
        </aside>
      </div>

      {inspectedSource && (
        <SourceInspectorDrawer
          isOpen
          source={inspectedSource}
          onClose={() => setInspectedSource(null)}
        />
      )}
    </div>
  );
}
