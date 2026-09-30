"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, ArrowDownUp, ArrowRight, ArrowUpRight, Check, ChevronDown,
  CircleHelp, ExternalLink, FileCheck2, Filter, Info, MessageCircle, Plus,
  Search, Send, Share2, ShieldCheck, Sparkles, ThumbsUp, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import { useRealtime } from "@/components/providers/RealtimeContext";
import { useRouter } from "next/navigation";
import CommunityComposer from "./CommunityComposer";
import styles from "./community-v4.module.css";
import RequestExpertReviewSheet from "@/components/expert/RequestExpertReviewSheet";

const TYPE_LABELS = Object.freeze({
  DIRECT_EXPERIENCE: "Trải nghiệm",
  FOUND_SOURCE: "Nguồn mới",
  NEEDS_VERIFICATION: "Cần đối chiếu",
  SUPPORTING_EVIDENCE: "Bổ sung bằng chứng",
  CONTRADICTING_EVIDENCE: "Bằng chứng khác chiều",
  CONTEXT: "Bối cảnh",
  CRITIQUE: "Phản biện",
});

const FEED_FILTERS = Object.freeze([
  ["ALL", "Tất cả"],
  ["GENERAL", "Câu hỏi / Thảo luận"],
  ["ACADEMIC", "Nguồn mới"],
  ["DIRECT_EXPERIENCE", "Trải nghiệm"],
  ["FOUND_SOURCE", "Nguồn gắn Trust"],
  ["NEEDS_VERIFICATION", "Cần đối chiếu"],
  ["SUPPORTING_EVIDENCE", "Bổ sung bằng chứng"],
  ["CONTRADICTING_EVIDENCE", "Khác chiều"],
]);

function normalizeContribution(post) {
  const sources = Array.isArray(post?.sources) ? post.sources : [];
  const evidenceRefs = Array.isArray(post?.evidenceRefs) ? post.evidenceRefs : [];
  return {
    ...post,
    sourceKind: "TRUST",
    postId: post?.contributionId || post?.postId || post?.id,
    content: post?.statement || post?.content || "",
    contributionType: String(post?.contributionType || "DIRECT_EXPERIENCE").toUpperCase(),
    sources: sources.map((source) => {
      if (typeof source === "string") return { url: source, publisher: null };
      return { url: source?.url || source?.canonicalUrl || "", publisher: source?.publisher || null };
    }).filter((source) => Boolean(source.url)),
    evidenceRefs,
    evidenceRevisionIds: Array.isArray(post?.evidenceRevisionIds) ? post.evidenceRevisionIds : [],
    reactions: post?.reactions || {},
    caseScope: post?.caseScope || null,
    trustFreshness: post?.trustFreshness || "UNKNOWN",
    commentCount: Number(post?.commentCount || 0),
    revision: Number(post?.revision || 1),
  };
}

function normalizeDiscussion(post) {
  return {
    ...post,
    sourceKind: "DISCUSSION",
    content: post?.content || "",
    contributionType: String(post?.topic || "GENERAL").toUpperCase(),
    sources: (Array.isArray(post?.sources) ? post.sources : []).map((source) => typeof source === "string" ? { url: source, publisher: null } : source).filter((source) => Boolean(source?.url)),
    evidenceRefs: [],
    reactions: { helpful: Number(post?.likeCount || 0) },
    commentCount: Number(post?.commentCount || 0),
  };
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.toString() : "";
  } catch {
    return "";
  }
}

function initials(value) {
  const threadPseudonym = String(value || "").match(/^Người tham gia ([A-Z0-9]+)$/i);
  if (threadPseudonym) return threadPseudonym[1].slice(-2).toLocaleUpperCase("vi");
  return String(value || "Cộng đồng")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0] || "")
    .join("")
    .toLocaleUpperCase("vi") || "SH";
}

function timestamp(value) {
  if (!value) return "Mới đây";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Mới đây";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function expertStatusLabel(status) {
  return ({
    REQUESTED: "Đã nhận yêu cầu · đang chờ chuyên gia đủ điều kiện",
    MATCHING: "Đang ghép chuyên gia theo phạm vi",
    ASSIGNED: "Đã phân công chuyên gia được xác thực",
    IN_REVIEW: "Đang thẩm định độc lập",
    COMPLETED: "Đã hoàn tất · mở Trust để xem phần được phép chia sẻ",
    CANCELLED: "Yêu cầu đã đóng",
    EXPIRED: "Yêu cầu đã hết hạn",
  })[String(status || "").toUpperCase()] || "Chưa có yêu cầu thẩm định";
}

function postRoute(post) {
  return post?.sourceKind === "DISCUSSION"
    ? `/community/discussion/${encodeURIComponent(post.postId)}`
    : `/community/${encodeURIComponent(post.postId)}`;
}

function SharePostButton({ post, className = "" }) {
  const [notice, setNotice] = useState("");
  const share = async () => {
    const url = new URL(postRoute(post), window.location.origin).toString();
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: post.title || "Bài viết Community", text: post.content, url });
        setNotice("Đã mở chia sẻ liên kết.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setNotice("Đã sao chép liên kết bài viết.");
      } else {
        setNotice(`Liên kết bài viết: ${url}`);
      }
    } catch (error) {
      if (error?.name !== "AbortError") setNotice("Chưa thể chia sẻ liên kết trên thiết bị này.");
    }
  };
  return <>
    <button type="button" className={className} onClick={share} aria-label="Chia sẻ liên kết bài viết"><Share2 size={16} /><span>Chia sẻ liên kết</span></button>
    {notice && <span className={styles.shareNotice} role="status">{notice}</span>}
  </>;
}

function TrustFreshness({ post }) {
  const revision = Number(post?.caseScope?.caseRevision || 0);
  const latest = Number(post?.latestCaseRevision || 0);
  if (post?.trustFreshness === "CURRENT") {
    return <span className={`${styles.freshness} ${styles.freshnessCurrent}`}><Check size={13} /> Khớp bản mới nhất</span>;
  }
  if (post?.trustFreshness === "STALE") {
    const caseRevisionChanged = ["CASE_REVISION_ADVANCED", "CASE_REVISION_UNAVAILABLE"].includes(post?.trustFreshnessReason);
    return <span className={`${styles.freshness} ${styles.freshnessStale}`}><AlertCircle size={13} /> {caseRevisionChanged ? `Cần cập nhật · rev ${revision}/${latest}` : "Có tín hiệu Community mới sau lần Trust kiểm tra"}</span>;
  }
  return <span className={`${styles.freshness} ${styles.freshnessUnknown}`}><CircleHelp size={13} /> Trạng thái cập nhật chưa rõ</span>;
}

function ThreadComment({ comment, onReply, depth = 0 }) {
  return (
    <article className={`${styles.comment} ${depth ? styles.commentNested : ""}`}>
      <div className={styles.commentAvatar} aria-hidden="true">{initials(comment.authorLabel || "Người tham gia")}</div>
      <div className={styles.commentContent}>
        <div className={styles.commentMeta}>
          <strong>{comment.authorLabel || "Thành viên StudentHub"}</strong>
          <time dateTime={comment.createdAt || undefined}>{timestamp(comment.createdAt)}</time>
        </div>
        <p>{comment.content}</p>
        {comment.status === "PUBLISHED" && depth < 3 && (
          <button type="button" className={styles.textAction} onClick={() => onReply(comment)}>
            Trả lời
          </button>
        )}
        {Array.isArray(comment.replies) && comment.replies.length > 0 && (
          <div className={styles.replies}>
            {comment.replies.map((reply) => <ThreadComment key={reply.commentId} comment={reply} onReply={onReply} depth={depth + 1} />)}
          </div>
        )}
      </div>
    </article>
  );
}

function ExpertRequestPanel({ post, onClose, onStateChange, restoreFocusRef }) {
  return <RequestExpertReviewSheet
    caseId={post.caseScope.caseId}
    caseRevision={post.caseScope.caseRevision}
    claimId={post.claimId || null}
    contextRefs={post.evidenceRevisionIds}
    communityContributionId={post.postId}
    restoreFocusRef={restoreFocusRef}
    onClose={onClose}
    onStateChange={onStateChange}
  />;
}
function CommentThread({ post, isAuthenticated, onChanged, open, loading, onLoaded }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const endpoint = `/api/intelligence/community/posts/${encodeURIComponent(post.postId)}/comments`;
  const { subscribe } = useRealtime();

  const fetchComments = useCallback(async (signal) => {
    const payload = await apiRequest(endpoint, { signal, requestId: createSecureId("community-thread") });
    return Array.isArray(payload?.comments) ? payload.comments : [];
  }, [endpoint]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    let active = true;
    fetchComments(controller.signal).then((items) => {
      if (active) { setComments(items); setError(""); }
    }).catch((caught) => {
      if (active && caught?.code !== "ABORTED") setError(apiErrorMessage(caught));
    }).finally(() => {
      if (active) onLoaded?.();
    });
    return () => { active = false; controller.abort("community-thread-closed"); };
  }, [open, fetchComments, onLoaded]);

  useEffect(() => subscribe("community", "community:comment", (record) => {
    if (record?.data?.contributionId !== post.postId || !open) return;
    fetchComments().then(setComments).catch((caught) => setError(apiErrorMessage(caught)));
  }), [subscribe, fetchComments, post.postId, open]);

  const chooseReply = (comment) => {
    setReplyTarget(comment);
    inputRef.current?.focus();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated || busy || !text.trim()) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(endpoint, {
        method: "POST",
        headers: { "Idempotency-Key": createSecureId("community-comment") },
        body: JSON.stringify({ content: text.trim(), parentCommentId: replyTarget?.commentId || null }),
        requestId: createSecureId("community-comment"),
      });
      setText("");
      setReplyTarget(null);
      setComments(await fetchComments());
      setError("");
      onChanged?.();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.threadSection} aria-label="Bình luận và trả lời">
      {open && (
        <div className={styles.threadBody}>
          {loading ? <p className={styles.subtle} role="status">Đang tải thảo luận…</p> : comments.length ? (
            <div className={styles.commentList}>{comments.map((comment) => <ThreadComment key={comment.commentId} comment={comment} onReply={chooseReply} />)}</div>
          ) : <p className={styles.emptyThread}>Chưa có thảo luận. Hãy thêm câu hỏi hoặc góc nhìn có căn cứ.</p>}
          {isAuthenticated ? (
            <form className={styles.commentForm} onSubmit={submit}>
              {replyTarget && <div className={styles.replyingTo}>Đang trả lời {replyTarget.authorLabel || "thành viên"}<button type="button" onClick={() => setReplyTarget(null)} aria-label="Hủy trả lời"><X size={13} /></button></div>}
              <label className={styles.srOnly} htmlFor={`comment-${post.postId}`}>{replyTarget ? "Viết câu trả lời" : "Viết bình luận"}</label>
              <textarea id={`comment-${post.postId}`} ref={inputRef} value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} rows={2} placeholder={replyTarget ? "Viết câu trả lời…" : "Đặt câu hỏi hoặc bổ sung ngữ cảnh…"} />
              <button type="submit" className={styles.iconButtonPrimary} disabled={busy || !text.trim()} aria-label={busy ? "Đang gửi bình luận" : "Gửi bình luận"}><Send size={16} /></button>
            </form>
          ) : <Link href={`/login?next=${encodeURIComponent("/community")}`} className={styles.loginHint}>Đăng nhập để tham gia thảo luận <ArrowRight size={14} /></Link>}
          {error && <p className={styles.inlineError} role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}

function DiscussionComments({ post, isAuthenticated, onChanged, open, loading, onLoaded }) {
  const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : []);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const { subscribe } = useRealtime();
  const refresh = useCallback(async (signal) => {
    const payload = await apiRequest(`/api/community/social?postId=${encodeURIComponent(post.postId)}`, {
      signal,
      requestId: createSecureId("community-discussion-comments"),
    });
    return Array.isArray(payload?.posts) ? payload.posts[0] : null;
  }, [post.postId]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    refresh(controller.signal).then((latest) => {
      if (latest) setComments(Array.isArray(latest.comments) ? latest.comments : []);
    }).catch((caught) => {
      if (caught?.code !== "ABORTED") setError(apiErrorMessage(caught));
    }).finally(() => {
      if (!controller.signal.aborted) onLoaded?.();
    });
    return () => controller.abort("community-discussion-comments-closed");
  }, [open, refresh, onLoaded]);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribe("community", "community:comment", (record) => {
      if (!open || record?.data?.postId !== post.postId) return;
      refresh().then((latest) => {
        if (active && latest) setComments(Array.isArray(latest.comments) ? latest.comments : []);
      }).catch((caught) => {
        if (active && caught?.code !== "ABORTED") setError(apiErrorMessage(caught));
      });
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [subscribe, refresh, post.postId, open]);

  const submit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated || busy || text.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const payload = await apiRequest("/api/community/social", {
        method: "PATCH",
        body: JSON.stringify({ postId: post.postId, action: "comment", text: text.trim() }),
        requestId: createSecureId("community-discussion-comment"),
      });
      setComments(Array.isArray(payload?.post?.comments) ? payload.post.comments : []);
      setText("");
      onChanged?.(payload?.post);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return <section className={styles.threadSection} aria-label="Bình luận">
    {open && <div className={styles.threadBody}>
      {loading ? <p className={styles.subtle} role="status">Đang tải bình luận…</p> : comments.length ? <div className={styles.commentList}>
        {comments.map((comment) => <article key={comment.commentId} className={styles.comment}>
          {comment.author?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- User-supplied avatar hosts are unrestricted, so they bypass the remote image optimizer.
            <img className={styles.commentAvatarImage} src={comment.author.avatarUrl} alt="" />
          ) : <div className={styles.commentAvatar} aria-hidden="true">{initials(comment.author?.name)}</div>}
          <div className={styles.commentContent}><div className={styles.commentMeta}><strong>{comment.author?.name || "Thành viên StudentHub"}</strong><time dateTime={comment.createdAt || undefined}>{timestamp(comment.createdAt)}</time></div><p>{comment.text}</p></div>
        </article>)}
      </div> : <p className={styles.emptyThread}>Chưa có bình luận. Hãy bắt đầu cuộc trò chuyện.</p>}
      {isAuthenticated ? <form className={styles.commentForm} onSubmit={submit}>
        <label className={styles.srOnly} htmlFor={`discussion-comment-${post.postId}`}>Viết bình luận công khai</label>
        <textarea id={`discussion-comment-${post.postId}`} ref={inputRef} value={text} onChange={(event) => setText(event.target.value)} minLength={2} maxLength={2000} rows={2} placeholder="Viết bình luận công khai…" />
        <button type="submit" className={styles.iconButtonPrimary} disabled={busy || text.trim().length < 2} aria-label={busy ? "Đang gửi bình luận" : "Gửi bình luận"}><Send size={16} /></button>
      </form> : <Link href={`/login?next=${encodeURIComponent(postRoute(post))}`} className={styles.loginHint}>Đăng nhập để bình luận <ArrowRight size={14} /></Link>}
      {error && <p className={styles.inlineError} role="alert">{error}</p>}
    </div>}
  </section>;
}

export function DiscussionCard({ post: incomingPost, isAuthenticated, onReload, onShowContext, initiallyOpen = false }) {
  const post = useMemo(() => normalizeDiscussion(incomingPost), [incomingPost]);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(initiallyOpen);
  const [commentsLoading, setCommentsLoading] = useState(initiallyOpen);
  const markCommentsLoaded = useCallback(() => setCommentsLoading(false), []);
  const toggleComments = () => {
    const next = !commentsOpen;
    if (next) setCommentsLoading(true);
    setCommentsOpen(next);
  };
  const source = post.sources[0];
  const sourceUrl = safeHttpUrl(source?.url);
  const sourceHost = sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : "";
  const hasContext = Boolean(sourceUrl);

  const like = async () => {
    if (!isAuthenticated || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const payload = await apiRequest("/api/community/social", {
        method: "PATCH",
        body: JSON.stringify({ postId: post.postId, action: "like" }),
        requestId: createSecureId("community-discussion-like"),
      });
      setLikeCount(Number(payload?.post?.likeCount || 0));
      onReload?.(payload?.post);
    } catch (caught) {
      setNotice(apiErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return <article className={`${styles.postCard} ${styles.discussionCard}`} data-community-discussion={post.postId}>
    <header className={styles.postHeader}>
      {post.author?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- User-supplied avatar hosts are unrestricted, so they bypass the remote image optimizer.
        <img className={styles.authorPhoto} src={post.author.avatarUrl} alt="" />
      ) : <div className={styles.authorMark} aria-hidden="true">{initials(post.author?.name)}</div>}
      <div className={styles.postByline}>
        <div className={styles.authorLine}><strong>{post.author?.name || "Thành viên StudentHub"}</strong><span>{post.topic === "ACADEMIC" ? "Nguồn" : "Thảo luận"}</span></div>
        <div className={styles.postMeta}><time dateTime={post.createdAt || undefined}>{timestamp(post.createdAt)}</time><span aria-hidden="true">·</span><span>Công khai</span></div>
      </div>
      <Link href={postRoute(post)} className={styles.openPost} aria-label="Mở chi tiết bài viết"><ArrowUpRight size={18} /></Link>
      {hasContext && <button type="button" className={styles.contextButton} onClick={() => onShowContext?.(post, "")} aria-label="Hiện thông tin nguồn"><Info size={16} /></button>}
    </header>
    <div className={styles.postBody}><p>{post.content}</p>
      {sourceUrl && <a className={styles.citationRow} href={sourceUrl} target="_blank" rel="noreferrer noopener"><FileCheck2 size={15} /><strong>{source.publisher || sourceHost || "Nguồn cộng đồng"}</strong><span>{sourceHost}</span><ExternalLink size={13} aria-hidden="true" /></a>}
    </div>
    <div className={styles.socialPrimaryRow} aria-label="Tương tác bài viết">
      {isAuthenticated ? <button type="button" onClick={like} disabled={busy} aria-label="Đánh dấu bài viết hữu ích"><ThumbsUp size={16} /><span>Hữu ích</span><b>{likeCount}</b></button> : <Link href={`/login?next=${encodeURIComponent(postRoute(post))}`} className={styles.socialPrimaryAction}><ThumbsUp size={16} /><span>Hữu ích</span></Link>}
      <button type="button" className={styles.socialPrimaryAction} onClick={toggleComments} aria-expanded={commentsOpen}><MessageCircle size={16} /><span>Bình luận</span><b>{post.commentCount}</b></button>
      <SharePostButton post={post} className={styles.socialPrimaryAction} />
    </div>
    {notice && <p className={styles.inlineNotice} role="status">{notice}</p>}
    {commentsOpen && <DiscussionComments post={post} isAuthenticated={isAuthenticated} onChanged={onReload} open={commentsOpen} loading={commentsLoading} onLoaded={markCommentsLoaded} />}
  </article>;
}

export function ContributionCard({ post: incomingPost, isAuthenticated, onReload, onShowContext, initialThreadOpen = false }) {
  const post = useMemo(() => normalizeContribution(incomingPost), [incomingPost]);
  const [busyReaction, setBusyReaction] = useState("");
  const [reactionNotice, setReactionNotice] = useState("");
  const [expertOpen, setExpertOpen] = useState(false);
  const [threadOpen, setThreadOpen] = useState(initialThreadOpen);
  const [threadLoading, setThreadLoading] = useState(initialThreadOpen);
  const [expertStatus, setExpertStatus] = useState("");
  const expertTriggerRef = useRef(null);

  const markThreadLoaded = useCallback(() => setThreadLoading(false), []);
  const toggleThread = () => {
    const next = !threadOpen;
    if (next) setThreadLoading(true);
    setThreadOpen(next);
  };

  const showContext = useCallback((status = "") => onShowContext?.(post, status), [onShowContext, post]);
  const handleExpertState = useCallback((status) => {
    setExpertStatus(status);
    showContext(status);
  }, [showContext]);

  const react = async (kind) => {
    if (!isAuthenticated) return;
    setBusyReaction(kind);
    setReactionNotice("");
    try {
      await apiRequest(`/api/intelligence/community/posts/${encodeURIComponent(post.postId)}/reactions`, {
        method: "POST",
        headers: { "Idempotency-Key": createSecureId("community-reaction") },
        body: JSON.stringify({
          kind,
          value: 1,
          claimId: post.claimId || null,
          caseRevision: post.caseScope.caseRevision,
          expectedRevision: post.revision,
        }),
        requestId: createSecureId("community-reaction"),
      });
      setReactionNotice("Đã ghi nhận phản hồi cộng đồng.");
      onReload?.();
    } catch (caught) {
      setReactionNotice(apiErrorMessage(caught));
    } finally {
      setBusyReaction("");
    }
  };

  const source = post.sources[0];
  const sourceUrl = safeHttpUrl(source?.url);
  const sourceHost = sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : "";

  return (
    <article className={styles.postCard} data-community-contribution={post.postId}>
      <header className={styles.postHeader}>
        <div className={styles.authorMark} aria-hidden="true">SH</div>
        <div className={styles.postByline}>
          <div className={styles.authorLine}><strong>Người đóng góp</strong><span>Danh tính không hiển thị</span></div>
          <div className={styles.postMeta}><time dateTime={post.createdAt || undefined}>{timestamp(post.createdAt)}</time><span aria-hidden="true">·</span><span>{TYPE_LABELS[post.contributionType] || "Đóng góp"}</span></div>
        </div>
        <Link href={`/community/${encodeURIComponent(post.postId)}`} className={styles.openPost} aria-label="Mở chi tiết bài viết"><ArrowUpRight size={18} /></Link>
        <button type="button" className={styles.contextButton} onClick={() => showContext()} aria-label="Hiện thông tin Trust và nguồn"><Info size={16} /></button>
      </header>

      <div className={styles.postBody}>
        <p>{post.content}</p>
        {sourceUrl && (
          <a className={styles.citationRow} href={sourceUrl} target="_blank" rel="noreferrer noopener">
            <FileCheck2 size={15} />
            <strong>{source.publisher || sourceHost || "Nguồn do cộng đồng cung cấp"}</strong><span>{sourceHost || "Liên kết nguồn"}</span>
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        )}
        {post.evidenceRefs.length > 0 && !sourceUrl && (
          <div className={styles.evidenceRefNote}><FileCheck2 size={15} /><span>{post.evidenceRefs.length} tham chiếu nguồn gắn với đóng góp</span></div>
        )}
      </div>

      <div className={styles.trustLink} data-trust-freshness={post.trustFreshness}>
        <ShieldCheck size={14} aria-hidden="true" />
        <strong>Trust · rev {post.caseScope.caseRevision}</strong>
        <TrustFreshness post={post} />
        <Link href={`/trust?caseId=${encodeURIComponent(post.caseScope.caseId)}&caseRevision=${encodeURIComponent(post.caseScope.caseRevision)}`} className={styles.trustLinkAction}>Mở Trust <ArrowUpRight size={14} /></Link>
      </div>

      <div className={styles.socialPrimaryRow} aria-label="Tương tác bài viết">
        {isAuthenticated ? <>
          <button type="button" onClick={() => react("HELPFUL")} disabled={Boolean(busyReaction)} aria-label="Đánh dấu hữu ích">
            <ThumbsUp size={16} /><span>Hữu ích</span><b>{post.reactions.helpful || 0}</b>
          </button>
        </> : <Link href={`/login?next=${encodeURIComponent("/community")}`} className={styles.socialPrimaryAction}><ThumbsUp size={16} /><span>Hữu ích</span></Link>}
        <button type="button" className={styles.socialPrimaryAction} onClick={toggleThread} aria-expanded={threadOpen}><MessageCircle size={16} /><span>Bình luận</span><b>{post.commentCount}</b></button>
        <SharePostButton post={post} className={styles.socialPrimaryAction} />
      </div>
      {reactionNotice && <p className={styles.inlineNotice} role="status">{reactionNotice}</p>}

      <div className={styles.evidenceActions} aria-label="Thao tác bằng chứng">
        {isAuthenticated ? <>
          <button type="button" onClick={() => react("ADD_EVIDENCE")} disabled={Boolean(busyReaction)}><FileCheck2 size={14} /><span>Bổ sung nguồn</span></button>
          <button type="button" onClick={() => react("CHALLENGE")} disabled={Boolean(busyReaction)}><CircleHelp size={14} /><span>Phản biện</span></button>
          <button type="button" onClick={() => react("INSUFFICIENT_INFORMATION")} disabled={Boolean(busyReaction)}><AlertCircle size={14} /><span>Thiếu ngữ cảnh</span></button>
          <button type="button" className={styles.reportAction} onClick={() => react("REPORT_ABUSE")} disabled={Boolean(busyReaction)}>Báo nội dung</button>
        </> : <Link href={`/login?next=${encodeURIComponent("/community")}`} className={styles.loginHint}>Đăng nhập để bổ sung hoặc báo nội dung <ArrowRight size={14} /></Link>}
      </div>

      {threadOpen && <CommentThread post={post} isAuthenticated={isAuthenticated} onChanged={onReload} open={threadOpen} loading={threadLoading} onLoaded={markThreadLoaded} />}

      <footer className={styles.postFooter}>
        {post.canRequestExpert && isAuthenticated && (
          <button ref={expertTriggerRef} type="button" className={styles.expertToggle} aria-expanded={expertOpen} onClick={(event) => { expertTriggerRef.current = event.currentTarget; showContext(expertStatus); setExpertOpen((value) => !value); }}>
            <ShieldCheck size={16} /> {expertStatus ? expertStatusLabel(expertStatus) : "Yêu cầu chuyên gia →"}
          </button>
        )}
      </footer>
      {expertOpen && post.canRequestExpert && <ExpertRequestPanel post={post} onClose={() => setExpertOpen(false)} onStateChange={handleExpertState} restoreFocusRef={expertTriggerRef} />}
    </article>
  );
}

export function CommunityIntelligenceRail({ post, expertStatus = "" }) {
  if (!post) return null;
  const sources = Array.isArray(post.sources) ? post.sources : [];
  const rows = [];
  if (post.caseScope?.caseId) {
    const freshness = post.trustFreshness === "CURRENT"
      ? "Khớp revision mới nhất"
      : post.trustFreshness === "STALE"
        ? "Cần cập nhật"
        : "Chưa xác định được trạng thái";
    rows.push({ label: "Trust", value: `rev ${post.caseScope.caseRevision} · ${freshness}` });
  }
  if (sources.length) {
    rows.push({ label: "Nguồn", value: `${sources.length} nguồn` });
  }
  if (expertStatus) rows.push({ label: "Chuyên gia", value: expertStatusLabel(expertStatus) });
  if (!rows.length) return null;

  return <aside className={styles.rightRail} aria-label="Thông tin bài viết đang chọn">
    <section className={styles.intelligenceCard}>
      <span className={styles.eyebrow}>NGỮ CẢNH BÀI VIẾT</span>
      <h2>Thông tin liên quan</h2>
      {rows.map((row) => <div className={styles.intelligenceRow} key={row.label}><strong>{row.label}</strong><span>{row.value}</span></div>)}
      {sources.length > 0 && <ul className={styles.intelligenceSources}>{sources.slice(0, 4).map((source, index) => {
        const url = safeHttpUrl(source.url);
        if (!url) return null;
        return <li key={`${url}-${index}`}><a href={url} target="_blank" rel="noreferrer noopener">{source.publisher || new URL(url).hostname.replace(/^www\./, "")}</a></li>;
      })}</ul>}
    </section>
  </aside>;
}

function FeedSkeleton() {
  return <div className={styles.skeletonCard} role="status" aria-label="Đang tải bảng tin"><span /><span /><span /><span /></div>;
}

export default function CommunitySocialWorkspace() {
  const { profile, isAuthenticated } = useAuth();
  const router = useRouter();
  const { subscribe, connectionStatus } = useRealtime();
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [sourcesOnly, setSourcesOnly] = useState(false);
  const [staleOnly, setStaleOnly] = useState(false);
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const composerOpenerRef = useRef(null);
  const [composerInitialMode, setComposerInitialMode] = useState("GENERAL");
  const [sourceState, setSourceState] = useState("UNKNOWN");
  const [partialError, setPartialError] = useState("");
  const [selectedContext, setSelectedContext] = useState({ postId: "", expertStatus: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const loadFeed = useCallback(async (search, signal) => {
    setLoading(true);
    setError("");
    setPartialError("");
    try {
      const queryValue = search.trim();
      const trustFeed = queryValue.length > 1
        ? apiRequest(`/api/intelligence/community/search?q=${encodeURIComponent(queryValue)}`, { signal, requestId: createSecureId("community-search") })
        : apiRequest(`/api/intelligence/community/posts?limit=100&sort=${encodeURIComponent(sort)}`, { signal, requestId: createSecureId("community-feed") });
      const socialParams = new URLSearchParams({ limit: "40" });
      if (queryValue.length > 1) socialParams.set("q", queryValue);
      const discussionFeed = apiRequest(`/api/community/social?${socialParams.toString()}`, { signal, requestId: createSecureId("community-social-feed") });
      const [trustResult, discussionResult] = await Promise.allSettled([trustFeed, discussionFeed]);
      if (signal?.aborted) return;
      const failures = [trustResult, discussionResult].filter((result) => result.status === "rejected");
      const trustPayload = trustResult.status === "fulfilled" ? trustResult.value : null;
      const discussionPayload = discussionResult.status === "fulfilled" ? discussionResult.value : null;
      const trustPosts = Array.isArray(trustPayload?.posts) ? trustPayload.posts.map(normalizeContribution) : [];
      const discussionPosts = sort === "needs_review" ? [] : Array.isArray(discussionPayload?.posts) ? discussionPayload.posts.map(normalizeDiscussion) : [];
      const merged = [...trustPosts, ...discussionPosts];
      if (sort === "recent" || queryValue.length > 1) merged.sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
      setPosts(merged);
      setSourceState(trustPayload?.sourceState === "DEMO_FIXTURE" ? "DEMO_FIXTURE" : discussionPayload?.sourceState || trustPayload?.sourceState || "COMMUNITY_SIGNAL");
      if (failures.length === 2) throw trustResult.reason || discussionResult.reason;
      if (failures.length === 1) {
        const failedStore = trustResult.status === "rejected" ? "Trust" : "bài thảo luận";
        const reason = trustResult.status === "rejected" ? trustResult.reason : discussionResult.reason;
        setPartialError(`Tạm thời không tải được ${failedStore}. Các bài từ nguồn còn lại vẫn được giữ rõ ràng; hãy thử tải lại.`);
        if (!merged.length) setError(apiErrorMessage(reason));
      }
    } catch (caught) {
      if (caught?.code !== "ABORTED") setError(apiErrorMessage(caught));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    const controller = new AbortController();
    const delay = query.trim().length > 1 ? 260 : 0;
    const timer = window.setTimeout(() => void loadFeed(query, controller.signal), delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort("community-query-changed");
    };
  }, [loadFeed, query, reloadKey]);

  useEffect(() => {
    let timer = null;
    const refreshCanonicalState = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setReloadKey((value) => value + 1), 160);
    };
    const unsubs = [
      subscribe("community", "*", refreshCanonicalState),
      subscribe("trust", "trust:revision", refreshCanonicalState),
      subscribe("trust", "trust:expert_review", refreshCanonicalState),
      subscribe("expert", "expert:assignment", refreshCanonicalState),
      subscribe("expert", "expert:revision", refreshCanonicalState),
    ];
    return () => {
      window.clearTimeout(timer);
      unsubs.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [subscribe]);

  const visiblePosts = useMemo(() => posts.filter((post) => {
    if (activeFilter !== "ALL" && post.contributionType !== activeFilter) return false;
    if (sourcesOnly && !(post.sources?.length || post.evidenceRefs?.length)) return false;
    if (staleOnly && post.trustFreshness !== "STALE") return false;
    return true;
  }), [posts, activeFilter, sourcesOnly, staleOnly]);

  const resetFilters = () => {
    setActiveFilter("ALL");
    setSourcesOnly(false);
    setStaleOnly(false);
  };

  const showPostContext = useCallback((post, expertStatus = "") => {
    const postId = post?.postId || "";
    const nextStatus = expertStatus || "";
    setSelectedContext((current) => current.postId === postId && current.expertStatus === nextStatus
      ? current
      : { postId, expertStatus: nextStatus });
  }, []);

  const contextPost = posts.find((post) => post.postId === selectedContext.postId) || null;
  const hasContextData = Boolean(contextPost && (
    contextPost.caseScope?.caseId || contextPost.sources?.length || selectedContext.expertStatus
  ));

  const openComposer = (mode = "GENERAL", event) => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/community")}`);
      return;
    }
    composerOpenerRef.current = event?.currentTarget || document.activeElement;
    setComposerInitialMode(mode);
    setComposerOpen(true);
  };

  return (
    <section className={styles.communityPage} aria-labelledby="community-title">
      <div className={styles.pageHeader}>
        <div className={styles.pageIntro}>
          <div className={styles.pageKicker}><span className={styles.kickerMark} /> KHÔNG GIAN CỘNG ĐỒNG</div>
          <h1 id="community-title">Community<span className={styles.titlePeriod}>.</span></h1>
          <p>Đặt câu hỏi, chia sẻ trải nghiệm và cùng mở nguồn khi cần.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.liveState} data-connected={connectionStatus === "CONNECTED"}>
            <span /> {connectionStatus === "CONNECTED" ? "Đang đồng bộ" : "Cập nhật khi tải lại"}
          </span>
          <button type="button" className={styles.composeButton} onClick={(event) => openComposer("GENERAL", event)}>
            <Plus size={17} /> Đăng bài
          </button>
        </div>
      </div>

      {sourceState === "DEMO_FIXTURE" && <p className={styles.demoNotice}><Sparkles size={15} /> Đang xem dữ liệu minh họa; đây không phải nội dung cộng đồng đang hoạt động.</p>}

      <div className={`${styles.communityGrid} ${hasContextData ? styles.communityGridWithContext : styles.communityGridWithoutContext}`}>
        <aside className={styles.leftRail} aria-label="Bộ lọc Community">
          <div className={styles.railHeading}><span>KHÔNG GIAN</span><Filter size={14} /></div>
          <nav className={styles.filterList} aria-label="Lọc theo loại đóng góp">
            {FEED_FILTERS.map(([value, label]) => (
              <button key={value} type="button" className={activeFilter === value ? styles.filterActive : ""} aria-pressed={activeFilter === value} onClick={() => setActiveFilter(value)}>
                <span className={styles.filterDot} />{label}
              </button>
            ))}
          </nav>
          <div className={styles.railDivider} />
          <button type="button" className={`${styles.railOption} ${sourcesOnly ? styles.filterActive : ""}`} aria-pressed={sourcesOnly} onClick={() => setSourcesOnly((value) => !value)}>
            <FileCheck2 size={15} /> Có nguồn tham chiếu
          </button>
          <button type="button" className={`${styles.railOption} ${staleOnly ? styles.filterActive : ""}`} aria-pressed={staleOnly} onClick={() => setStaleOnly((value) => !value)}>
            <AlertCircle size={15} /> Trust cần cập nhật
          </button>
          {(activeFilter !== "ALL" || sourcesOnly || staleOnly) && <button type="button" className={styles.resetFilters} onClick={resetFilters}>Xóa bộ lọc</button>}
        </aside>

        <div className={styles.feedColumn}>
          <section className={styles.collapsedComposer} aria-label="Tạo bài viết cộng đồng">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- User-supplied avatar hosts are unrestricted, so they bypass the remote image optimizer.
              <img src={profile.avatarUrl} alt="" />
            ) : <span className={styles.collapsedComposerAvatar} aria-hidden="true">{String(profile?.fullName || "B").trim().slice(0, 1).toLocaleUpperCase("vi")}</span>}
            <button type="button" className={styles.collapsedComposerPrompt} onClick={(event) => openComposer("GENERAL", event)}>Bạn muốn chia sẻ hoặc kiểm chứng điều gì?</button>
            <div className={styles.collapsedComposerActions}>
              <button type="button" onClick={(event) => openComposer("SOURCE", event)}><FileCheck2 size={15} /> Nguồn</button>
              <button type="button" disabled aria-label="Ảnh hoặc video, sắp có"><Plus size={15} /> Ảnh/Video <small>Sắp có</small></button>
              <button type="button" onClick={(event) => openComposer("GENERAL", event)}><MessageCircle size={15} /> Câu hỏi</button>
              <button type="button" onClick={(event) => openComposer("VERIFY", event)}><ShieldCheck size={15} /> Kiểm chứng</button>
            </div>
          </section>
          <div className={styles.feedToolbar}>
            <button type="button" className={styles.mobileFilterToggle} aria-expanded={mobileFiltersOpen} onClick={() => setMobileFiltersOpen((value) => !value)}><Filter size={16} /> Lọc <ChevronDown size={14} /></button>
            <form className={styles.searchBox} role="search" onSubmit={(event) => event.preventDefault()}>
              <Search size={17} aria-hidden="true" />
              <label className={styles.srOnly} htmlFor="community-search">Tìm trong Community</label>
              <input id="community-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm bài viết, nguồn, chủ đề…" />
              {query && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setQuery("")}><X size={15} /></button>}
            </form>
            <label className={styles.sortControl}>
              <ArrowDownUp size={15} />
              <span className={styles.srOnly}>Sắp xếp bài viết</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sắp xếp bài viết">
                <option value="recent">Mới nhất</option>
                <option value="relevant">Liên quan</option>
                <option value="needs_review">Cần xem xét</option>
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
          {mobileFiltersOpen && <nav className={styles.mobileFilters} aria-label="Bộ lọc nhanh">
            {FEED_FILTERS.map(([value, label]) => <button key={value} type="button" aria-pressed={activeFilter === value} onClick={() => { setActiveFilter(value); setMobileFiltersOpen(false); }}>{label}</button>)}
            <button type="button" aria-pressed={sourcesOnly} onClick={() => setSourcesOnly((value) => !value)}>Có nguồn</button>
            <button type="button" aria-pressed={staleOnly} onClick={() => setStaleOnly((value) => !value)}>Trust cần cập nhật</button>
          </nav>}

          <div className={styles.feedHeading}>
            <div><span className={styles.eyebrow}>BÀI VIẾT CỘNG ĐỒNG</span><h2>{query ? "Kết quả tìm kiếm" : "Bài viết mới"}</h2></div>
            <span className={styles.resultCount}>{loading ? "…" : `${visiblePosts.length} ${visiblePosts.length === 1 ? "bài" : "bài"}`}</span>
          </div>

          {error && <div className={styles.errorCard} role="alert"><AlertCircle size={19} /><div><strong>Không thể tải bảng tin</strong><p>{error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</button></div></div>}
          {partialError && <p className={styles.partialFeedNotice} role="status"><AlertCircle size={15} /> {partialError}<button type="button" onClick={() => setReloadKey((value) => value + 1)}>Tải lại</button></p>}
          {loading && !posts.length && <div className={styles.feedStack}><FeedSkeleton /><FeedSkeleton /></div>}
          {!loading && !error && visiblePosts.length === 0 && <div className={styles.emptyState}>
            <div className={styles.emptyGlyph}><MessageCircle size={22} /></div>
            <h3>{posts.length ? "Không có đóng góp phù hợp" : "Bảng tin đang chờ góc nhìn đầu tiên"}</h3>
            <p>{posts.length ? "Thử đổi bộ lọc hoặc từ khóa." : "Đặt câu hỏi, mở cuộc thảo luận hoặc chia sẻ một nguồn hữu ích."}</p>
            {posts.length ? <button type="button" className={styles.textAction} onClick={resetFilters}>Xóa bộ lọc</button> : <button type="button" className={styles.composeButton} onClick={(event) => openComposer("GENERAL", event)}><Plus size={16} /> Đăng bài</button>}
          </div>}
          <div className={styles.feedStack} aria-busy={loading}>
            {visiblePosts.map((post) => post.sourceKind === "DISCUSSION"
              ? <DiscussionCard key={`discussion-${post.postId}`} post={post} isAuthenticated={isAuthenticated} onShowContext={showPostContext} onReload={() => setReloadKey((value) => value + 1)} />
              : <ContributionCard key={`trust-${post.postId}`} post={post} isAuthenticated={isAuthenticated} onShowContext={showPostContext} onReload={() => setReloadKey((value) => value + 1)} />)}
            {loading && posts.length > 0 && <FeedSkeleton />}
          </div>
        </div>

        {hasContextData && <CommunityIntelligenceRail post={contextPost} expertStatus={selectedContext.expertStatus} />}
      </div>

      {composerOpen && <CommunityComposer initialMode={composerInitialMode} restoreFocusRef={composerOpenerRef} onClose={() => setComposerOpen(false)} onPublished={() => { setComposerOpen(false); setQuery(""); setReloadKey((value) => value + 1); }} />}
    </section>
  );
}
