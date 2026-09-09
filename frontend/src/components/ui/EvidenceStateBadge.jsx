import React from "react";
import {
  CheckCircle2,
  CircleHelp,
  Clock3,
  Info,
  TriangleAlert,
  WifiOff,
} from "lucide-react";

const STATES = Object.freeze({
  support: { label: "Có căn cứ hỗ trợ", icon: CheckCircle2, tone: "success" },
  success: { label: "Đã hoàn tất", icon: CheckCircle2, tone: "success" },
  conflict: { label: "Có mâu thuẫn", icon: TriangleAlert, tone: "critical" },
  caution: { label: "Cần thận trọng", icon: TriangleAlert, tone: "caution" },
  unknown: { label: "Chưa đủ dữ liệu", icon: CircleHelp, tone: "neutral" },
  stale: { label: "Có thể đã cũ", icon: Clock3, tone: "caution" },
  unavailable: { label: "Nguồn chưa khả dụng", icon: WifiOff, tone: "critical" },
  info: { label: "Thông tin phạm vi", icon: Info, tone: "info" },
});

export function EvidenceStateBadge({ state = "unknown", label, className = "" }) {
  const config = STATES[state] || STATES.unknown;
  const Icon = config.icon;
  return (
    <span className={`evidence-state-badge evidence-state-${config.tone} ${className}`.trim()} data-state={state}>
      <Icon size={15} aria-hidden="true" />
      <span>{label || config.label}</span>
    </span>
  );
}

export default EvidenceStateBadge;
