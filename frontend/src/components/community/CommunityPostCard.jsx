"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Send,
  UserRound,
  FileText,
  Image as ImageIcon,
  Check,
  AlertCircle
} from "lucide-react";
import SourceInspectorDrawer from "@/components/trust/SourceInspectorDrawer";

const TOPIC_CONFIG = Object.freeze({
  GENERAL: { label: "ĐỜI SỐNG", type: "QUAN SÁT" },
  CAMPUS: { label: "NHÀ TRỌ", type: "QUAN SÁT" },
  ACADEMIC: { label: "HỌC TẬP", type: "HỎI ĐÁP" },
  SAFETY: { label: "LỪA ĐẢO", type: "CẢNH BÁO" },
  SCHOLARSHIP: { label: "HỌC VỤ", type: "CHÍNH SÁCH" },
});

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

function sourceUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
}

function extractDomain(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export default function CommunityPostCard({
  post,
  canInteract = false,
  activeExpert = false,
  moderatorEligible = false,
  onInteract,
  onModerate,
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [inspectedSource, setInspectedSource] = useState(null);

  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const author = post?.author || {};
  const topicMeta = TOPIC_CONFIG[post?.topic] || { label: post?.topic || "CHUNG", type: "QUAN SÁT" };
  const safeMedia = Array.isArray(post?.media) ? post.media.filter(Boolean).slice(0, 4) : [];
  const safeSources = Array.isArray(post?.sources) ? post.sources.filter(Boolean).slice(0, 6) : [];
  const evidenceCount = safeMedia.length + safeSources.length;

  const perception = post?.communityPerception || { trust: 0, doubt: 0 };
  const authorIsExpert = author.isExpert === true || String(author.role || "").toUpperCase() === "EXPERT";

  // Determine state badge presentation
  const stateBadge = useMemo(() => {
    if (post?.trustLinked || post?.trustCase) {
      return { text: "• TRUST LINKED", className: "community-badge-trust" };
    }
    if (evidenceCount > 0) {
      return { text: "• CÓ BẰNG CHỨNG ĐÍNH KÈM", className: "community-badge-support" };
    }
    return { text: "• CHƯA ĐỦ BẰNG CHỨNG", className: "community-badge-insufficient" };
  }, [post?.trustLinked, post?.trustCase, evidenceCount]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !canInteract) return;
    await onInteract?.("comment", { text: commentText.trim() });
    setCommentText("");
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
      snippet: "Đường dẫn do người dùng đính kèm làm căn cứ đối chiếu. Chưa qua thẩm định chính thức.",
      publishedAt: "Chưa xác minh",
      retrievedAt: "Thời điểm đăng tải",
      contentHash: "N/A",
    });
  };

  return (
    <article className="community-stream-card" aria-labelledby={`community-post-${post?.postId}`}>
      {/* 1. Header line: Status badge + Topic/Type */}
      <header className="community-card-meta-line">
        <span className={`community-status-badge ${stateBadge.className}`}>
          {stateBadge.text}
        </span>
        <span className="community-card-category-tag">
          {topicMeta.label} · {topicMeta.type}
        </span>
      </header>

      {/* 2. Claim Title */}
      <h3 id={`community-post-${post?.postId}`} className="community-card-claim-title">
        {post?.postId && post.postId !== "community-post" ? (
          <Link href={`/community/${encodeURIComponent(post.postId)}`} className="community-card-title-link">
            {post?.title || "Chia sẻ quan sát từ cộng đồng"}
          </Link>
        ) : (
          post?.title || "Chia sẻ quan sát từ cộng đồng"
        )}
      </h3>

      {/* 3. Observation / Context text */}
      <p className="community-card-observation-text">
        {post?.content || "Chưa có nội dung mô tả chi tiết."}
      </p>

      {/* 4. Media grid if attached */}
      {safeMedia.length > 0 && (
        <div className="community-card-media-gallery">
          {safeMedia.map((src, idx) => (
            <div key={idx} className="community-card-media-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Minh chứng đính kèm từ quan sát thực tế" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* 5. Evidence & Provenance Block */}
      <div className="community-card-evidence-block">
        <div className="community-card-evidence-header">
          <span className="community-card-evidence-label">EVIDENCE</span>
          <div className="community-card-evidence-counts">
            {safeSources.length > 0 && (
              <span className="community-evidence-pill">
                <FileText size={12} /> {safeSources.length} nguồn
              </span>
            )}
            {safeMedia.length > 0 && (
              <span className="community-evidence-pill">
                <ImageIcon size={12} /> {safeMedia.length} ảnh
              </span>
            )}
            {evidenceCount === 0 && (
              <span className="community-evidence-pill-empty">
                Chưa có đính kèm
              </span>
            )}
          </div>
        </div>

        {safeSources.length > 0 && (
          <div className="community-card-sources-list">
            {safeSources.slice(0, 3).map((source, index) => {
              const url = sourceUrl(source);
              const domain = extractDomain(url);
              return (
                <div key={index} className="community-source-row">
                  <span className="community-source-text">
                    [n] Đường dẫn do người dùng cung cấp: <strong>{domain || source}</strong>
                  </span>
                  <div className="community-source-actions">
                    <button
                      type="button"
                      className="community-source-btn"
                      onClick={() => handleOpenSource(url || source, index)}
                    >
                      Chi tiết nguồn
                    </button>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="community-source-external-link"
                        title="Mở liên kết nguồn bên ngoài"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Author Byline */}
      <div className="community-card-author-line">
        <div className="community-card-author-left">
          <div className="community-card-avatar">
            {author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.avatarUrl} alt="" loading="lazy" />
            ) : (
              <span>{initials(author.name)}</span>
            )}
          </div>
          <div className="community-card-author-details">
            <div className="community-card-author-name">
              <strong>{author.name || "Thành viên StudentHub"}</strong>
              {authorIsExpert && (
                <span className="community-author-expert-tag">
                  <ShieldCheck size={11} /> Expert
                </span>
              )}
            </div>
            <span className="community-card-timestamp">
              {dateLabel(post?.createdAt)} {post?.location ? `· ${post.location}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* 7. Community Perception & Social Actions */}
      <div className="community-card-actions-wrapper">
        <div className="community-card-perception-group">
          <span className="community-card-perception-caption">
            Cảm nhận cộng đồng:
          </span>
          {canInteract ? (
            <div className="community-card-perception-buttons">
              <button
                type="button"
                className="community-btn-perception"
                onClick={() => onInteract?.("perception", { value: 1 })}
                aria-label="Đánh dấu đáng tin"
              >
                <ThumbsUp size={13} />
                <span>Đáng tin ({perception.trust || 0})</span>
              </button>
              <button
                type="button"
                className="community-btn-perception"
                onClick={() => onInteract?.("perception", { value: -1 })}
                aria-label="Đánh dấu chưa tin"
              >
                <ThumbsDown size={13} />
                <span>Chưa tin ({perception.doubt || 0})</span>
              </button>
            </div>
          ) : (
            <Link href="/login?next=%2Fcommunity" className="community-perception-login-hint">
              <span>Đáng tin ({perception.trust || 0}) · Chưa tin ({perception.doubt || 0})</span>
            </Link>
          )}
        </div>

        <div className="community-card-social-actions">
          {canInteract ? (
            <button
              type="button"
              className="community-action-chip"
              onClick={() => onInteract?.("like")}
            >
              <ThumbsUp size={14} />
              <span>Hữu ích ({post?.likeCount || 0})</span>
            </button>
          ) : (
            <Link href="/login?next=%2Fcommunity" className="community-action-chip">
              <ThumbsUp size={14} />
              <span>Hữu ích ({post?.likeCount || 0})</span>
            </Link>
          )}

          <button
            type="button"
            className={`community-action-chip ${commentsOpen ? "is-active" : ""}`}
            onClick={() => setCommentsOpen((prev) => !prev)}
            aria-expanded={commentsOpen}
          >
            <MessageCircle size={14} />
            <span>Bình luận ({post?.commentCount || comments.length || 0})</span>
          </button>

          <Link href="/trust" className="community-action-chip community-action-verify">
            <Check size={14} />
            <span>Xác minh trong Trust</span>
          </Link>
        </div>
      </div>

      <div className="community-card-perception-note">
        <AlertCircle size={12} aria-hidden="true" />
        <span>Cảm nhận cộng đồng mang tính đối thoại thực tế, không thay thế kết luận xác minh từ Trust Engine.</span>
      </div>

      {/* 8. Expert Response block if present */}
      {post?.expertResponse && (
        <div className="community-card-expert-response" role="region" aria-label="Phản hồi chuyên môn">
          <div className="community-expert-header">
            <ShieldCheck size={16} className="text-purple-700" />
            <div>
              <span className="community-expert-title">Phản hồi từ Chuyên gia</span>
              <p className="community-expert-disclaimer">
                Phân tích mang tính chuyên môn thực địa, không thay thế văn bản quy phạm pháp luật chính thức.
              </p>
            </div>
          </div>
          <p className="community-expert-content">
            {post.expertResponse.summary || post.expertResponse.content || "Chưa có nội dung phản hồi."}
          </p>
          <div className="community-expert-meta">
            <span>Lĩnh vực: {post.expertResponse.domain || "Chung"}</span>
            {post.expertResponse.qualification && (
              <span>Thẩm quyền: {post.expertResponse.qualification}</span>
            )}
          </div>
        </div>
      )}

      {/* 9. Comments drawer if expanded */}
      {commentsOpen && (
        <div className="community-card-comments-section" aria-live="polite">
          {comments.length > 0 ? (
            <div className="community-comments-stream">
              {comments.map((c) => (
                <div key={c.commentId} className="community-comment-item">
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
              Chưa có phản hồi nào. Hãy là người đầu tiên cung cấp góc nhìn!
            </p>
          )}

          {canInteract ? (
            <form onSubmit={submitComment} className="community-comment-input-bar">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
                placeholder="Viết phản hồi có góc nhìn hoặc chứng cứ..."
                className="community-comment-input"
                aria-label="Nội dung bình luận"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="community-comment-submit-btn"
                aria-label="Gửi phản hồi"
              >
                <Send size={14} />
              </button>
            </form>
          ) : (
            <Link href="/login?next=%2Fcommunity" className="community-comment-login-link">
              Đăng nhập để tham gia thảo luận →
            </Link>
          )}
        </div>
      )}

      {inspectedSource && (
        <SourceInspectorDrawer
          isOpen
          source={inspectedSource}
          onClose={() => setInspectedSource(null)}
        />
      )}
    </article>
  );
}
