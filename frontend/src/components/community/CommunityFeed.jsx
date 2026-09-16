"use client";

import React from "react";
import { RefreshCw, Users, AlertCircle, Sparkles, FilterX } from "lucide-react";
import CommunityPostCard from "./CommunityPostCard";

export default function CommunityFeed({
  posts = [],
  loading = false,
  error = "",
  sourceState = "UNKNOWN",
  canInteract = false,
  activeExpert = false,
  moderatorEligible = false,
  onInteract,
  onModerate,
  onRetry,
  onResetFilters,
}) {
  return (
    <section className="community-evidence-feed" aria-labelledby="live-evidence-stream-heading">
      {/* Stream Header */}
      <div className="community-stream-header">
        <div>
          <span className="community-kicker">LIVE / EVIDENCE FIRST</span>
          <h2 id="live-evidence-stream-heading" className="community-stream-title">
            Live Evidence Stream
          </h2>
          <p className="community-stream-subtitle">
            Cập nhật theo bằng chứng mới nhất từ sinh viên và nguồn công khai
          </p>
        </div>
        <div className="community-stream-sort">
          <span className="community-stream-sort-label">Sắp xếp:</span>
          <span className="community-stream-sort-val font-semibold">Mới nhất ▾</span>
        </div>
      </div>

      {/* Real Data Callout Banner */}
      <div className="community-stream-state-banner" role="status">
        <div className="community-state-banner-left">
          <span className="community-state-banner-dot" aria-hidden="true" />
          <span className="community-state-banner-text">
            <strong>Dữ liệu minh bạch:</strong> Chỉ hiển thị các bài viết và bằng chứng đã được lưu trữ thực tế trên máy chủ.
          </span>
        </div>
        <span className="community-state-banner-tag">
          {sourceState === "DURABLE_POSTGRES" ? "LIVE DATABASE" : "COMMUNITY SIGNAL"}
        </span>
      </div>

      {/* Loading Skeleton */}
      {loading && posts.length === 0 && (
        <div className="community-feed-skeleton-container" role="status" aria-label="Đang tải dữ liệu luồng bằng chứng">
          {[1, 2, 3].map((i) => (
            <div key={i} className="community-skeleton-card">
              <div className="community-skeleton-badge" />
              <div className="community-skeleton-line community-skeleton-title" />
              <div className="community-skeleton-line community-skeleton-desc" />
              <div className="community-skeleton-line community-skeleton-evidence" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="community-feed-error-card" role="alert">
          <AlertCircle size={20} className="text-red-700" />
          <div>
            <strong>Không thể đồng bộ luồng quan sát</strong>
            <p>{error}</p>
          </div>
          {onRetry && (
            <button type="button" onClick={onRetry} className="community-retry-btn">
              <RefreshCw size={13} /> Thử lại
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && posts.length === 0 && (
        <div className="community-feed-empty-card">
          <div className="community-empty-prism-icon" aria-hidden="true">
            <FilterX size={28} />
          </div>
          <h3 className="community-empty-title">Chưa ghi nhận quan sát nào phù hợp</h3>
          <p className="community-empty-desc">
            Bộ lọc hiện tại không tìm thấy bằng chứng đối chiếu. Bạn có đang nắm giữ quan sát thực địa về vấn đề này?
          </p>
          <div className="community-empty-actions">
            {onResetFilters && (
              <button type="button" onClick={onResetFilters} className="community-btn-reset-filters">
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>
      )}

      {/* Post List */}
      <div className="community-stream-cards-list">
        {posts.map((post) => (
          <CommunityPostCard
            key={post.postId}
            post={post}
            canInteract={canInteract}
            activeExpert={activeExpert}
            moderatorEligible={moderatorEligible}
            onInteract={(action, details) => onInteract?.(post, action, details)}
            onModerate={onModerate}
          />
        ))}
      </div>
    </section>
  );
}
