"use client";

import React, { useState } from "react";
import { Filter, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

export default function CommunityFilterRail({
  activeFilter = "ALL",
  onFilterChange,
  statusFilter = "ALL",
  onStatusFilterChange,
  onReset,
}) {
  const [topicOpen, setTopicOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);

  const topicOptions = [
    { id: "ALL", label: "Tất cả" },
    { id: "CAMPUS", label: "Quan sát thực địa (Nhà trọ/KTX)" },
    { id: "SAFETY", label: "Cảnh báo lừa đảo" },
    { id: "ACADEMIC", label: "Hỏi đáp học tập" },
    { id: "SCHOLARSHIP", label: "Học vụ & Học bổng" },
    { id: "GENERAL", label: "Đời sống sinh viên" },
  ];

  const statusOptions = [
    { id: "ALL", label: "Tất cả trạng thái" },
    { id: "WITH_EVIDENCE", label: "Có bằng chứng đính kèm" },
    { id: "EXPERT_ANSWERED", label: "Chuyên gia đã phản hồi" },
    { id: "TRUST_VERIFIED", label: "Liên kết Trust Case" },
  ];

  return (
    <aside className="community-filter-rail" aria-labelledby="community-filter-rail-heading">
      <div className="community-filter-header">
        <h2 id="community-filter-rail-heading" className="community-filter-title">
          <Filter size={16} aria-hidden="true" />
          <span>Bộ lọc</span>
        </h2>
        <button
          type="button"
          className="community-filter-reset-btn"
          onClick={onReset}
          aria-label="Đặt lại tất cả bộ lọc"
        >
          <RotateCcw size={12} aria-hidden="true" />
          <span>Đặt lại</span>
        </button>
      </div>

      <div className="community-filter-group">
        <button
          type="button"
          className="community-filter-group-header"
          onClick={() => setTopicOpen((prev) => !prev)}
          aria-expanded={topicOpen}
        >
          <span>Loại bài</span>
          {topicOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {topicOpen && (
          <div className="community-filter-options" role="radiogroup" aria-label="Lọc theo loại bài">
            {topicOptions.map((opt) => (
              <label key={opt.id} className="community-filter-radio-label">
                <input
                  type="radio"
                  name="community-topic"
                  value={opt.id}
                  checked={activeFilter === opt.id}
                  onChange={() => onFilterChange?.(opt.id)}
                  className="community-filter-radio"
                />
                <span className="community-filter-radio-text">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="community-filter-group">
        <button
          type="button"
          className="community-filter-group-header"
          onClick={() => setStatusOpen((prev) => !prev)}
          aria-expanded={statusOpen}
        >
          <span>Trạng thái bằng chứng</span>
          {statusOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {statusOpen && (
          <div className="community-filter-options" role="radiogroup" aria-label="Lọc theo trạng thái bằng chứng">
            {statusOptions.map((opt) => (
              <label key={opt.id} className="community-filter-radio-label">
                <input
                  type="radio"
                  name="community-status"
                  value={opt.id}
                  checked={statusFilter === opt.id}
                  onChange={() => onStatusFilterChange?.(opt.id)}
                  className="community-filter-radio"
                />
                <span className="community-filter-radio-text">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="community-filter-policy-note">
        <p>
          <strong>Nguyên tắc khách quan:</strong> Dữ liệu lọc được ánh xạ trực tiếp từ thuộc tính thật của server, không tính điểm suy diễn số đông.
        </p>
      </div>
    </aside>
  );
}
