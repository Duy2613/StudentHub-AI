"use client";

import React from "react";
import { RefreshCw, Users } from "lucide-react";
import CommunityPostCard from "./CommunityPostCard";

export default function CommunityFeed({ posts = [], loading = false, error = "", canInteract = false, activeExpert = false, moderatorEligible = false, onInteract, onModerate, onRetry }) {
  return (
    <section className="community-feed" aria-labelledby="community-feed-title" data-community-layer="evidence-feed">
      <div className="community-section-heading">
        <div><span className="community-kicker">Evidence feed</span><h2 id="community-feed-title">Điều cộng đồng đang gặp</h2><p className="community-section-description">Mỗi bài giữ lại bối cảnh, nguồn và giới hạn của chính nó.</p></div>
        <span className="community-feed-count"><Users size={14} /> {posts.length} bài chia sẻ</span>
      </div>
      {loading && posts.length === 0 && <div className="community-feed-skeletons" role="status" aria-label="Đang tải bảng tin cộng đồng"><span /><span /><span /></div>}
      {error && <div className="community-state community-state-error" role="alert"><div><strong>Bảng tin chưa khả dụng.</strong><p>{error}</p></div>{onRetry && <button type="button" onClick={onRetry}><RefreshCw size={14} /> Thử lại</button>}</div>}
      {!loading && !error && posts.length === 0 && <div className="community-state"><strong>Không có báo cáo phù hợp với bộ lọc hiện tại.</strong><p>Đổi bộ lọc hoặc mở Featured discussion để đọc bài chia sẻ đầu tiên.</p></div>}
      <div className="community-feed-list">{posts.map((post) => <CommunityPostCard key={post.postId} post={post} canInteract={canInteract} activeExpert={activeExpert} moderatorEligible={moderatorEligible} onInteract={(action, details) => onInteract?.(post, action, details)} onModerate={onModerate} />)}</div>
    </section>
  );
}
