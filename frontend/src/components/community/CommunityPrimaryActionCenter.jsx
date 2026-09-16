"use client";

import React from "react";
import { Search, Plus, Image as ImageIcon, Link2, ShieldCheck } from "lucide-react";
import CommunityEvidenceLegendBar from "./CommunityEvidenceLegendBar";

const QUICK_FILTER_CHIPS = [
  { id: "ALL", label: "Tất cả", topic: "ALL" },
  { id: "SCHOLARSHIP", label: "Học vụ", topic: "SCHOLARSHIP" },
  { id: "CAMPUS", label: "Nhà trọ", topic: "CAMPUS" },
  { id: "SAFETY", label: "Lừa đảo", topic: "SAFETY" },
  { id: "ACADEMIC", label: "Học tập", topic: "ACADEMIC" },
  { id: "GENERAL", label: "Đời sống", topic: "GENERAL" },
  { id: "EXPERT_ANSWERED", label: "Expert", isSpecial: true },
  { id: "TRUST_VERIFIED", label: "Official", isSpecial: true },
];

export default function CommunityPrimaryActionCenter({
  query = "",
  onQueryChange,
  activeFilter = "ALL",
  onFilterChange,
  onOpenQuickPost,
}) {
  return (
    <section className="community-primary-action-center" aria-label="Trung tâm hành động quan sát cộng đồng">
      <div className="community-hero-statement">
        <span className="community-kicker">COMMUNITY / EVIDENCE STREAM</span>
        <h1 className="community-display-title">
          Bằng chứng trước<br />độ phổ biến.
        </h1>
        <p className="community-hero-desc">
          Nơi sinh viên chia sẻ quan sát, kiểm tra nguồn và giữ lại những bất đồng cần thiết — trước khi đi đến kết luận.
        </p>
      </div>

      <div className="community-search-container">
        <label className="community-search-box" htmlFor="community-main-search">
          <Search size={18} className="community-search-icon" aria-hidden="true" />
          <input
            id="community-main-search"
            type="search"
            className="community-search-input"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Tìm vấn đề, bằng chứng, case hoặc quy chế..."
            aria-label="Tìm vấn đề, bằng chứng, case hoặc quy chế"
          />
          <kbd className="community-search-kbd" aria-hidden="true">
            ⌘ / Ctrl K
          </kbd>
        </label>
      </div>

      <div className="community-chips-scroll" role="group" aria-label="Các bộ lọc chủ đề nhanh">
        {QUICK_FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              className={`community-chip ${isActive ? "is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => onFilterChange?.(chip.id)}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="community-quickpost-trigger-wrapper">
        <button
          type="button"
          className="community-quickpost-trigger"
          onClick={onOpenQuickPost}
          aria-label="Mở hộp thoại ghi nhận quan sát thực địa"
        >
          <div className="community-quickpost-trigger-left">
            <span className="community-quickpost-plus-circle" aria-hidden="true">
              <Plus size={16} />
            </span>
            <span className="community-quickpost-placeholder">
              Bạn đã thấy điều gì, ở đâu và khi nào?
            </span>
          </div>
          <div className="community-quickpost-trigger-right">
            <span className="community-quickpost-hint-btn">
              <ImageIcon size={14} aria-hidden="true" />
              <span>Ảnh</span>
            </span>
            <span className="community-quickpost-hint-btn">
              <Link2 size={14} aria-hidden="true" />
              <span>Link</span>
            </span>
            <span className="community-quickpost-hint-btn">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Trust Case</span>
            </span>
          </div>
        </button>
      </div>

      <CommunityEvidenceLegendBar />
    </section>
  );
}
