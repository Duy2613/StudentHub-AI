"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, MessageCircle, MoreHorizontal, Send, ShieldCheck, ThumbsUp, UserRound } from "lucide-react";
import SourceInspectorDrawer from "@/components/trust/SourceInspectorDrawer";
import CommunityPerceptionBar from "./CommunityPerceptionBar";

const TOPIC_LABELS = Object.freeze({
  GENERAL: "Chung",
  CAMPUS: "Đời sống campus",
  ACADEMIC: "Học tập",
  SAFETY: "An toàn",
  SCHOLARSHIP: "Học bổng",
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
  return Number.isNaN(date.getTime()) ? "Vừa đăng" : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

function sourceUrl(value) {
  return typeof value === "string" && /^https:\/\//i.test(value) ? value : null;
}

function sourceRecord(value, index, post) {
  const url = sourceUrl(value);
  let domain = null;
  if (url) {
    try { domain = new URL(url).hostname; } catch { domain = null; }
  }
  return {
    id: `${post?.postId || "community-post"}-source-${index}`,
    title: `Nguồn công khai ${index + 1}`,
    publisher: "Community projection",
    domain,
    url,
    sourceType: "COMMUNITY_SUBMITTED",
    relationship: "community_context",
    snippet: "URL được bài đăng công khai cung cấp. Nội dung này chưa được Trust xác nhận.",
    publishedAt: "Chưa công bố",
    retrievedAt: "Chưa công bố",
    contentHash: "Chưa công bố",
  };
}

export default function CommunityPostCard({ post, canInteract = false, activeExpert = false, moderatorEligible = false, onInteract, onModerate }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [inspectedSource, setInspectedSource] = useState(null);
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const author = post?.author || {};
  const topic = TOPIC_LABELS[post?.topic] || post?.topic || "Chung";
  const safeMedia = Array.isArray(post?.media) ? post.media.filter(Boolean).slice(0, 4) : [];
  const safeSources = Array.isArray(post?.sources) ? post.sources.filter(Boolean).slice(0, 6) : [];
  const evidenceCount = safeMedia.length + safeSources.length;
  const sourceLabel = useMemo(() => `${safeSources.length || post?.sourceCount || 0} nguồn tham khảo`, [post?.sourceCount, safeSources.length]);
  const authorIsExpert = author.isExpert === true || String(author.role || "").toUpperCase() === "EXPERT";

  const submitComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim() || !canInteract) return;
    await onInteract?.("comment", { text: commentText.trim() });
    setCommentText("");
  };

  return (
    <article className="community-post-card" aria-labelledby={`community-post-${post?.postId}`}>
      <header className="community-post-header">
        <div className="community-author-avatar">
          {author.avatarUrl ? <img src={author.avatarUrl} alt="" loading="lazy" /> : author.name ? initials(author.name) : <UserRound size={18} />}
        </div>
        <div className="community-post-author">
          <div className="community-post-author-line">
            <strong>{author.name || "Thành viên StudentHub"}</strong>
            {authorIsExpert && <span className="community-expert-badge"><ShieldCheck size={12} /> Expert</span>}
          </div>
          <span>{dateLabel(post?.createdAt)} · {topic}</span>
        </div>
        {moderatorEligible && <button type="button" className="community-more-button" aria-label="Mở công cụ kiểm duyệt" onClick={() => onModerate?.(post)}><MoreHorizontal size={17} /></button>}
      </header>

      <div className="community-post-body">
        <h3 id={`community-post-${post?.postId}`}>{post?.postId && post.postId !== "community-post" ? <Link href={`/community/${encodeURIComponent(post.postId)}`} className="community-post-title-link">{post?.title || "Chia sẻ từ cộng đồng"}</Link> : (post?.title || "Chia sẻ từ cộng đồng")}</h3>
        <p>{post?.content || "Chưa có nội dung để hiển thị."}</p>
        {safeMedia.length > 0 && <div className="community-media-grid">{safeMedia.map((src) => <img key={src} src={src} alt="Tệp đính kèm từ bài chia sẻ" loading="lazy" />)}</div>}
        <dl className="community-post-evidence" aria-label="Cấu trúc bằng chứng của bài đăng">
          <div><dt>Evidence attached</dt><dd>{evidenceCount}</dd><small>{evidenceCount > 0 ? "tệp hoặc nguồn" : "chưa có đính kèm"}</small></div>
          <div><dt>Source count</dt><dd>{safeSources.length || post?.sourceCount || 0}</dd><small>{safeSources.length ? "nguồn công khai" : "chưa có nguồn"}</small></div>
          <div><dt>Discussion depth</dt><dd>{post?.commentCount || comments.length || 0}</dd><small>bình luận công khai</small></div>
          <div><dt>Expert participation</dt><dd>{post?.expertResponse ? "Có" : "Chưa có"}</dd><small>{post?.expertResponse ? "projection công khai" : "chưa có dữ liệu"}</small></div>
          <div><dt>Independence signal</dt><dd>{post?.independenceSignal || "Chưa có"}</dd><small>không suy ra từ số đông</small></div>
        </dl>
        <div className="community-post-meta">
          <span>{sourceLabel}</span>
          {safeSources.slice(0, 2).map((source, index) => <span className="community-post-source-actions" key={source}><button type="button" className="community-source-inspector-trigger" onClick={() => setInspectedSource(sourceRecord(source, index, post))}>Xem provenance</button>{sourceUrl(source) && <a href={sourceUrl(source)} target="_blank" rel="noreferrer">Mở nguồn <ExternalLink size={12} /></a>}</span>)}
        </div>
      </div>

      <CommunityPerceptionBar post={post} canInteract={canInteract} onInteract={onInteract} />

      <footer className="community-post-footer">
        {canInteract ? <button type="button" onClick={() => onInteract?.("like")}><ThumbsUp size={15} /> Hữu ích</button> : <Link href="/login?next=%2Fcommunity"><ThumbsUp size={15} /> Hữu ích</Link>}
        <button type="button" onClick={() => setCommentsOpen((value) => !value)}><MessageCircle size={15} /> Bình luận <span>{post?.commentCount || comments.length || 0}</span></button>
        <Link href="/trust" className="community-verify-action"><Check size={15} /> Xác minh</Link>
      </footer>

      {activeExpert && (
        <div className="community-expert-actions" aria-label="Expert actions">
          <span className="data-label">Expert actions · theo chính sách</span>
          <div>
            <Link href="/expert?tab=blind-review">Viết phản hồi chuyên gia</Link>
            <Link href="/expert?tab=blind-review">Thêm bằng chứng chuyên môn</Link>
            <Link href="/expert?tab=blind-review">Phản biện nguồn</Link>
          </div>
        </div>
      )}

      {post?.expertResponse && (
        <section className="community-expert-response" aria-labelledby={`expert-response-${post?.postId}`}>
          <div className="community-expert-response-heading"><ShieldCheck size={17} /><div><span className="data-label">Expert response</span><h4 id={`expert-response-${post?.postId}`}>Phản hồi chuyên gia</h4></div></div>
          <p>{post.expertResponse.summary || post.expertResponse.content || "Chưa có nội dung phản hồi công khai."}</p>
          <div className="community-expert-response-meta"><span>Domain: {post.expertResponse.domain || "Chưa công bố"}</span><span>Qualification: {post.expertResponse.qualification || "Chưa công bố"}</span><span>Evidence cited: {Array.isArray(post.expertResponse.evidenceRefs) ? post.expertResponse.evidenceRefs.length : "Chưa có dữ liệu"}</span></div>
        </section>
      )}

      {commentsOpen && (
        <div className="community-comments" aria-live="polite">
          {comments.length > 0 ? comments.map((comment) => <div className="community-comment" key={comment.commentId}><span className="community-comment-avatar">{initials(comment.author?.name)}</span><div><strong>{comment.author?.name || "Thành viên"}</strong><p>{comment.text}</p><small>{dateLabel(comment.createdAt)}</small></div></div>) : <p className="community-empty-inline">Chưa có bình luận. Hãy thêm góc nhìn của bạn.</p>}
          {canInteract ? <form className="community-comment-form" onSubmit={submitComment}><input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={2000} placeholder="Viết bình luận có bối cảnh…" aria-label="Nội dung bình luận" /><button type="submit" disabled={!commentText.trim()} aria-label="Gửi bình luận"><Send size={15} /></button></form> : <Link href="/login?next=%2Fcommunity" className="text-link">Đăng nhập để bình luận</Link>}
        </div>
      )}
      {inspectedSource && <SourceInspectorDrawer isOpen source={inspectedSource} onClose={() => setInspectedSource(null)} />}
    </article>
  );
}
