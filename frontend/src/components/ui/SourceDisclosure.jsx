"use client";

import React from "react";
import { FlaskConical, HelpCircle, Radio } from "lucide-react";

const SOURCE_COPY = Object.freeze({
  DEMO: { label: "DEMO FIXTURE", detail: "Dữ liệu xác định để trình diễn/kiểm thử; không phải xác minh live.", Icon: FlaskConical },
  LIVE: { label: "LIVE PROVIDER", detail: "Dữ liệu từ provider được gọi trong phạm vi hiện tại.", Icon: Radio },
  UNAVAILABLE: { label: "UNAVAILABLE", detail: "Nguồn chưa khả dụng; hệ thống không thay thế bằng dữ liệu demo.", Icon: HelpCircle },
});

export default function SourceDisclosure({ provenance, sourceMode, className = "", compact = false }) {
  const mode = provenance?.sourceMode || sourceMode || "UNAVAILABLE";
  const copy = SOURCE_COPY[mode] || SOURCE_COPY.UNAVAILABLE;
  const Icon = copy.Icon;
  const detail = provenance?.disclosure || copy.detail;

  return (
    <div className={`source-disclosure source-${mode.toLowerCase()} ${compact ? "is-compact" : ""} ${className}`.trim()} data-source-mode={mode} role="status" aria-label={`Nguồn dữ liệu: ${copy.label}`}>
      <Icon size={14} aria-hidden="true" />
      <span><strong>{copy.label}</strong>{!compact && <small>{detail}</small>}</span>
    </div>
  );
}
