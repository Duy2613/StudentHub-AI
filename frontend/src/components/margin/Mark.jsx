"use client";

import React from "react";

/**
 * The Margin uses a deliberately closed annotation alphabet. Keeping the
 * mapping here means product surfaces cannot accidentally invent a seventh
 * visual state while still exposing useful semantics to assistive technology.
 */
export const MARGIN_MARKS = Object.freeze({
  "[n]": { label: "Trích dẫn", role: "doc-noteref", tone: "verified" },
  "✻": { label: "AI ghi chú", role: "note", tone: "correction" },
  "!!": { label: "Người đã đọc", role: "mark", tone: "correction" },
  "?": { label: "Chưa chắc", role: "mark", tone: "uncertain" },
  "→": { label: "Đi tới tham chiếu", role: "link", tone: "neutral" },
  "✕": { label: "Đã chỉnh sửa", role: "deletion", tone: "correction" },
});

export function MarginMark({ mark = "[n]", label, className = "" }) {
  const descriptor = MARGIN_MARKS[mark] || MARGIN_MARKS["?"];
  const safeMark = MARGIN_MARKS[mark] ? mark : "?";

  return (
    <span
      className={`margin-mark margin-mark-${descriptor.tone} ${className}`.trim()}
      data-mark={safeMark}
      role={descriptor.role}
      aria-label={label || descriptor.label}
    >
      {safeMark}
    </span>
  );
}

export default MarginMark;
