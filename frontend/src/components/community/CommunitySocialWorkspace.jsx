"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE, normalizeExpertLifecycleState } from "@/lib/auth/presentationState";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import CommunityPrimaryActionCenter from "./CommunityPrimaryActionCenter";
import CommunityFilterRail from "./CommunityFilterRail";
import CommunityFeed from "./CommunityFeed";
import CommunityContextSignalRail from "./CommunityContextSignalRail";
import CommunityQuickPostDialog from "./CommunityQuickPostDialog";

export const NORMAL_COMMUNITY_WORKSPACE_COUNT = 1;

const API_TOPIC_BY_FILTER = Object.freeze({
  CAMPUS: "CAMPUS",
  SCHOLARSHIP: "SCHOLARSHIP",
  SAFETY: "SAFETY",
  ACADEMIC: "ACADEMIC",
  GENERAL: "GENERAL",
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sourceState, setSourceState] = useState("UNKNOWN");
  const [reloadKey, setReloadKey] = useState(0);
  const [quickPostOpen, setQuickPostOpen] = useState(false);
  const [expertLifecycleState, setExpertLifecycleState] = useState(EXPERT_LIFECYCLE_STATE.NONE);

  const apiTopic = API_TOPIC_BY_FILTER[activeFilter] || "ALL";

  const loadFeed = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "60", topic: apiTopic });
      const payload = await apiRequest(`/api/community/social?${params}`, {
        signal,
        requestId: createSecureId("community-feed"),
      });
      setPosts(Array.isArray(payload?.posts) ? payload.posts.map(normalizeForumPost) : []);
      setSourceState(payload?.sourceState || "UNKNOWN");
    } catch (caught) {
      try {
        const fallback = await apiRequest("/api/forum/posts?sortBy=newest", {
          signal,
          requestId: createSecureId("community-feed-fallback"),
        });
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
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setExpertLifecycleState(normalizeExpertLifecycleState(payload?.data?.state)))
      .catch(() => {
        if (!controller.signal.aborted) setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
      });
    return () => controller.abort("community-expert-state-unmounted");
  }, [isAuthenticated]);

  const activeExpert = expertLifecycleState === EXPERT_LIFECYCLE_STATE.ACTIVE;

  // Filter posts client-side for fine-grained search & status facets
  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    const searched = normalized
      ? posts.filter((post) =>
          `${post.title} ${post.content} ${post.topic} ${post.sources.join(" ")}`
            .toLocaleLowerCase("vi")
            .includes(normalized)
        )
      : posts;

    return searched.filter((post) => {
      // 1. Topic filter
      if (activeFilter === "EXPERT_ANSWERED") {
        if (!post.expertResponse) return false;
      } else if (activeFilter === "TRUST_VERIFIED") {
        if (!post.trustLinked && !post.trustCase) return false;
      } else if (activeFilter !== "ALL") {
        if (post.topic !== activeFilter) return false;
      }

      // 2. Status facet filter
      if (statusFilter === "WITH_EVIDENCE") {
        return (post.sources?.length || 0) + (post.media?.length || 0) > 0;
      }
      if (statusFilter === "EXPERT_ANSWERED") {
        return Boolean(post.expertResponse);
      }
      if (statusFilter === "TRUST_VERIFIED") {
        return post.trustLinked || Boolean(post.trustCase);
      }

      return true;
    });
  }, [activeFilter, statusFilter, posts, query]);

  const createPost = async (draft) => {
    setBusy(true);
    setError("");
    try {
      const payload = await apiRequest("/api/community/social", {
        method: "POST",
        body: JSON.stringify(draft),
        requestId: createSecureId("community-create"),
      });
      if (payload?.post) setPosts((current) => [normalizeForumPost(payload.post), ...current]);
      setNotice("Đã đăng quan sát. Đây là tín hiệu cộng đồng, chưa phải kết luận xác minh.");
    } catch (caught) {
      try {
        const payload = await apiRequest("/api/forum/posts", {
          method: "POST",
          body: JSON.stringify({
            category: draft.topic?.toLowerCase() === "safety" ? "nha_tro" : "truong_hoc",
            title: draft.content.slice(0, 90),
            content: draft.content,
            images: draft.imageUrl ? [draft.imageUrl] : [],
            links: draft.sourceUrl ? [draft.sourceUrl] : [],
          }),
          requestId: createSecureId("community-create-fallback"),
        });
        if (payload?.post) setPosts((current) => [normalizeForumPost(payload.post), ...current]);
        setNotice("Đã nhận quan sát qua luồng tương thích; chưa phải kết luận xác minh.");
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
      const payload = await apiRequest("/api/community/social", {
        method: "PATCH",
        body: JSON.stringify({ postId: post.postId, action, ...details }),
        requestId: createSecureId("community-interaction"),
      });
      if (payload?.post) {
        setPosts((current) =>
          current.map((item) => (item.postId === post.postId ? normalizeForumPost(payload.post) : item))
        );
      }
    } catch (caught) {
      if (action === "like" || action === "comment") {
        try {
          const payload = await apiRequest("/api/forum/posts", {
            method: "PATCH",
            body: JSON.stringify({ postId: post.postId, action, text: details.text }),
            requestId: createSecureId("community-interaction-fallback"),
          });
          if (payload?.post) {
            setPosts((current) =>
              current.map((item) => (item.postId === post.postId ? normalizeForumPost(payload.post) : item))
            );
          }
          return;
        } catch (fallbackError) {
          setNotice(apiErrorMessage(fallbackError || caught));
          return;
        }
      }
      setNotice(apiErrorMessage(caught));
    }
  };

  const handleResetFilters = () => {
    setActiveFilter("ALL");
    setStatusFilter("ALL");
    setQuery("");
  };

  return (
    <div
      className="community-v2 unified-community-workspace"
      data-community-theme="editorial"
      data-normal-workspace-count={NORMAL_COMMUNITY_WORKSPACE_COUNT}
    >
      {/* 1. Primary Action Center */}
      <CommunityPrimaryActionCenter
        query={query}
        onQueryChange={setQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onOpenQuickPost={() => setQuickPostOpen(true)}
      />

      {/* Global notifications & auth hint */}
      {!isAuthenticated && (
        <div className="community-auth-strip">
          <div className="community-auth-strip-text">
            <strong>Đọc quan sát công khai không cần đăng nhập.</strong>
            <span>Đăng nhập để đăng quan sát thực địa, bình luận và phản hồi.</span>
          </div>
          <Link href="/login?next=%2Fcommunity" className="community-auth-strip-btn">
            Đăng nhập để tham gia
          </Link>
        </div>
      )}

      {notice && (
        <div className="community-inline-notice" role="status">
          {notice}
        </div>
      )}

      {/* 2. Main 3-Column Layout Body */}
      <div className="community-body-grid">
        {/* Left Column: Filter Rail */}
        <CommunityFilterRail
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onReset={handleResetFilters}
        />

        {/* Center Column: Live Evidence Stream */}
        <main className="community-stream-column">
          <CommunityFeed
            posts={visiblePosts}
            loading={loading}
            error={error}
            sourceState={sourceState}
            canInteract={isAuthenticated}
            activeExpert={activeExpert}
            moderatorEligible={moderatorEligible}
            onInteract={interact}
            onModerate={() => setNotice("Công cụ kiểm duyệt chỉ mở cho moderator được máy chủ cấp quyền.")}
            onRetry={() => setReloadKey((v) => v + 1)}
            onResetFilters={handleResetFilters}
          />
        </main>

        {/* Right Column: Context Signal Rail */}
        <CommunityContextSignalRail posts={posts} />
      </div>

      {/* 3. Quick Post Modal Dialog */}
      <CommunityQuickPostDialog
        isOpen={quickPostOpen}
        onClose={() => setQuickPostOpen(false)}
        onSubmit={createPost}
        busy={busy}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
