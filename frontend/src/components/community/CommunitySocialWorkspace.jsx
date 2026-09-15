"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE, normalizeExpertLifecycleState } from "@/lib/auth/presentationState";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import CommunityComposer from "./CommunityComposer";
import CommunityFeed from "./CommunityFeed";
import CommunityCinematicHero from "./CommunityCinematicHero";
import { CommunityEditorialStory, CommunityLiveQuestions } from "./CommunityEditorialStory";
import CommunityEvidenceWorld from "./CommunityEvidenceWorld";

export const NORMAL_COMMUNITY_WORKSPACE_COUNT = 1;

const FILTERS = Object.freeze([
  ["ALL", "Tất cả"],
  ["TRENDING", "Đang được đọc"],
  ["UNRESOLVED", "Chưa khép lại"],
  ["TRUST_VERIFIED", "Trust linked"],
  ["EXPERT_ANSWERED", "Expert answered"],
  ["CAMPUS", "Campus"],
  ["SCHOLARSHIP", "Học bổng"],
  ["INTERNSHIP", "Thực tập"],
  ["SECURITY", "An toàn số"],
]);

const API_TOPIC_BY_FILTER = Object.freeze({
  CAMPUS: "CAMPUS",
  SCHOLARSHIP: "SCHOLARSHIP",
  SECURITY: "SAFETY",
});

function sourceList(post) {
  return Array.isArray(post?.sources) ? post.sources : Array.isArray(post?.links) ? post.links : [];
}

function mediaList(post) {
  return Array.isArray(post?.media) ? post.media : Array.isArray(post?.images) ? post.images : [];
}

function normalizeForumPost(post) {
  const sources = sourceList(post);
  const media = mediaList(post);
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const author = post?.author || {};
  const perception = post?.communityPerception || {
    trust: Number(post?.trustVoteCount || 0),
    doubt: Number(post?.distrustVoteCount || 0),
  };
  return {
    postId: post?.postId || post?.id || "community-post",
    author: {
      name: author.name || post?.authorName || "Cộng đồng StudentHub",
      avatarUrl: author.avatarUrl || post?.authorAvatarUrl || null,
      isExpert: author.isExpert === true,
      role: author.role || null,
    },
    location: post?.location || post?.campus || null,
    createdAt: post?.createdAt || post?.created_at || null,
    topic: String(post?.category || post?.topic || "GENERAL").toUpperCase(),
    title: post?.title || "Chia sẻ từ cộng đồng",
    content: post?.content || "",
    media,
    sources,
    sourceCount: Number(post?.sourceCount ?? sources.length),
    likeCount: Number(post?.likeCount || 0),
    commentCount: Number(post?.commentCount ?? comments.length),
    communityPerception: {
      trust: Number(perception.trust || 0),
      doubt: Number(perception.doubt || 0),
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
    sourceState: post?.sourceState || null,
    dataNotice: post?.dataNotice || post?.perceptionNotice || null,
    isAuthoritative: false,
  };
}

export default function CommunitySocialWorkspace() {
  const { isAuthenticated, moderatorEligible } = useAuth();
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sourceState, setSourceState] = useState("UNKNOWN");
  const [reloadKey, setReloadKey] = useState(0);
  const [expertLifecycleState, setExpertLifecycleState] = useState(EXPERT_LIFECYCLE_STATE.NONE);

  const apiTopic = API_TOPIC_BY_FILTER[activeFilter] || "ALL";

  const loadFeed = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "60", topic: apiTopic });
      const payload = await apiRequest(`/api/community/social?${params}`, { signal, requestId: createSecureId("community-feed") });
      setPosts(Array.isArray(payload?.posts) ? payload.posts.map(normalizeForumPost) : []);
      setSourceState(payload?.sourceState || "UNKNOWN");
    } catch (caught) {
      try {
        const fallback = await apiRequest("/api/forum/posts?sortBy=newest", { signal, requestId: createSecureId("community-feed-fallback") });
        setPosts(Array.isArray(fallback?.posts) ? fallback.posts.map(normalizeForumPost) : []);
        setSourceState(fallback?.sourceState || "COMMUNITY_SIGNAL");
        setNotice("Bảng tin đang dùng projection cộng đồng tương thích; các tín hiệu vẫn không phải kết luận xác minh.");
      } catch (fallbackError) {
        if (caught?.code !== "ABORTED") setError(apiErrorMessage(fallbackError || caught));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [apiTopic]);

  useEffect(() => {
    const controller = new AbortController();
    void loadFeed(controller.signal);
    return () => controller.abort("community-feed-unmounted");
  }, [loadFeed, reloadKey]);

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
    return () => controller.abort("community-expert-state-unmounted");
  }, [isAuthenticated]);

  const activeExpert = expertLifecycleState === EXPERT_LIFECYCLE_STATE.ACTIVE;
  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    const searched = normalized
      ? posts.filter((post) => `${post.title} ${post.content} ${post.topic} ${post.sources.join(" ")}`.toLocaleLowerCase("vi").includes(normalized))
      : posts;
    const filtered = searched.filter((post) => {
      const status = String(post.status || "").toUpperCase();
      switch (activeFilter) {
        case "UNRESOLVED":
          return ["OPEN", "UNRESOLVED", "PENDING", "UNKNOWN"].includes(status);
        case "TRUST_VERIFIED":
          return post.trustLinked || Boolean(post.trustCase?.verdict || post.trustCase?.status === "COMPLETE");
        case "EXPERT_ANSWERED":
          return Boolean(post.expertResponse);
        case "INTERNSHIP":
          return post.topic === "INTERNSHIP";
        case "SECURITY":
          return post.topic === "SECURITY" || post.topic === "SAFETY";
        case "CAMPUS":
        case "SCHOLARSHIP":
          return post.topic === activeFilter;
        default:
          return true;
      }
    });
    if (activeFilter !== "TRENDING") return filtered;
    return [...filtered].sort((left, right) => {
      const leftSignal = Number(left.likeCount || 0) + Number(left.commentCount || 0) * 2 + Number(left.sourceCount || 0);
      const rightSignal = Number(right.likeCount || 0) + Number(right.commentCount || 0) * 2 + Number(right.sourceCount || 0);
      return rightSignal - leftSignal;
    });
  }, [activeFilter, posts, query]);

  const signals = useMemo(() => ({
    questions: posts.length,
    evidence: posts.filter((post) => mediaList(post).length + sourceList(post).length > 0).length,
    expert: posts.filter((post) => Boolean(post.expertResponse)).length,
  }), [posts]);

  const createPost = async (draft) => {
    setBusy(true);
    setError("");
    try {
      const payload = await apiRequest("/api/community/social", { method: "POST", body: JSON.stringify(draft), requestId: createSecureId("community-create") });
      if (payload?.post) setPosts((current) => [normalizeForumPost(payload.post), ...current]);
      setNotice("Đã đăng chia sẻ. Đây là tín hiệu cộng đồng, chưa phải kết luận xác minh.");
    } catch (caught) {
      try {
        const payload = await apiRequest("/api/forum/posts", {
          method: "POST",
          body: JSON.stringify({ category: draft.topic?.toLowerCase() === "safety" ? "nha_tro" : "truong_hoc", title: draft.content.slice(0, 90), content: draft.content, images: draft.imageUrl ? [draft.imageUrl] : [], links: draft.sourceUrl ? [draft.sourceUrl] : [] }),
          requestId: createSecureId("community-create-fallback"),
        });
        if (payload?.post) setPosts((current) => [normalizeForumPost(payload.post), ...current]);
        setNotice("Đã nhận chia sẻ qua luồng cộng đồng tương thích; chưa phải kết luận xác minh.");
      } catch (fallbackError) {
        setError(apiErrorMessage(fallbackError || caught));
      }
    } finally {
      setBusy(false);
    }
  };

  const interact = async (post, action, details = {}) => {
    if (!isAuthenticated) return;
    try {
      const payload = await apiRequest("/api/community/social", { method: "PATCH", body: JSON.stringify({ postId: post.postId, action, ...details }), requestId: createSecureId("community-interaction") });
      if (payload?.post) setPosts((current) => current.map((item) => item.postId === post.postId ? normalizeForumPost(payload.post) : item));
    } catch (caught) {
      if (action === "like" || action === "comment") {
        try {
          const payload = await apiRequest("/api/forum/posts", { method: "PATCH", body: JSON.stringify({ postId: post.postId, action, text: details.text }), requestId: createSecureId("community-interaction-fallback") });
          if (payload?.post) setPosts((current) => current.map((item) => item.postId === post.postId ? normalizeForumPost(payload.post) : item));
          return;
        } catch (fallbackError) {
          setNotice(apiErrorMessage(fallbackError || caught));
          return;
        }
      }
      setNotice(apiErrorMessage(caught));
    }
  };

  return (
    <div className="unified-workspace unified-community-workspace" data-normal-workspace-count={NORMAL_COMMUNITY_WORKSPACE_COUNT}>
      <CommunityCinematicHero posts={posts} />

      {!isAuthenticated && <div className="unified-auth-boundary"><div><strong>Đọc bảng tin mà không cần đăng nhập.</strong><p>Đăng nhập để đăng bài, bình luận, đánh dấu đáng tin hoặc không tin.</p></div><Link href="/login?next=%2Fcommunity" className="primary-action">Đăng nhập để tham gia</Link></div>}
      {notice && <div className="unified-inline-notice" role="status">{notice}</div>}

      <div className="community-data-strip" aria-label="Trạng thái dữ liệu Community">
        <span className="community-data-state"><span className="community-live-indicator" aria-hidden="true" /> {sourceState === "DURABLE_POSTGRES" ? "LIVE PROVIDER" : sourceState === "COMMUNITY_SIGNAL" ? "COMMUNITY SIGNAL" : "NGUỒN DỮ LIỆU CHƯA XÁC ĐỊNH"}</span>
        <span>Chỉ hiển thị dữ liệu đã trả về từ server.</span>
        <span>Đọc công khai, tương tác cần identity.</span>
      </div>

      <CommunityEditorialStory posts={visiblePosts} signals={signals} />

      {isAuthenticated && <CommunityComposer busy={busy} onCreate={createPost} />}

      <div className="community-feed-toolbar" id="community-feed">
        <label className="unified-search"><Search size={16} /><span className="sr-only">Tìm trong cộng đồng</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm vấn đề, quy trình hoặc bằng chứng..." /></label>
        <div className="community-topic-filter" role="group" aria-label="Bộ lọc Community"><Filter size={15} aria-hidden="true" />{FILTERS.map(([value, label]) => <button type="button" key={value} className={`filter-chip ${activeFilter === value ? "is-active" : ""}`} aria-pressed={activeFilter === value} onClick={() => setActiveFilter(value)}>{label}</button>)}</div>
      </div>

      <CommunityFeed posts={visiblePosts.slice(1)} loading={loading} error={error} canInteract={isAuthenticated} activeExpert={activeExpert} moderatorEligible={moderatorEligible} onInteract={interact} onModerate={() => setNotice("Công cụ kiểm duyệt chỉ mở cho moderator được máy chủ cấp quyền.")} onRetry={() => setReloadKey((value) => value + 1)} />
      <CommunityLiveQuestions posts={visiblePosts} />
      <CommunityEvidenceWorld />
    </div>
  );
}
