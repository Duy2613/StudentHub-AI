/**
 * AITerminalBlock — Digital Guardian "Machine Interface" Component
 *
 * Dùng cho tất cả kết quả AI output, OCR data, security scanner results.
 * Font: JetBrains Mono (--font-machine)
 * Contrast với body text dùng Inter (--font-human)
 *
 * @example
 * <AITerminalBlock
 *   title="AI SECURITY SCANNER v2.1"
 *   status="danger"
 *   rows={[
 *     { label: "Target", value: "thongbaohocphi-utc.com" },
 *     { label: "Status", value: "PHÁT HIỆN NGUY CƠ CAO", isStatus: true },
 *     { label: "Confidence", value: "97.4%" },
 *   ]}
 *   detail="Tên miền giả mạo, mới đăng ký 2 ngày trước."
 * />
 */

"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, ShieldQuestion, Zap } from "lucide-react";

const STATUS_CONFIG = {
  danger: {
    headerColor: "rgba(239, 68, 68, 0.12)",
    headerBorder: "rgba(239, 68, 68, 0.2)",
    terminalBorder: "rgba(239, 68, 68, 0.25)",
    icon: ShieldAlert,
    iconColor: "#ef4444",
    glow: "0 0 30px rgba(239, 68, 68, 0.1)",
    label: "THREAT DETECTED",
    statusClass: "dg-status-danger",
  },
  warning: {
    headerColor: "rgba(245, 158, 11, 0.1)",
    headerBorder: "rgba(245, 158, 11, 0.2)",
    terminalBorder: "rgba(245, 158, 11, 0.25)",
    icon: ShieldQuestion,
    iconColor: "#f59e0b",
    glow: "0 0 30px rgba(245, 158, 11, 0.1)",
    label: "UNDER REVIEW",
    statusClass: "dg-status-warning",
  },
  safe: {
    headerColor: "rgba(16, 185, 129, 0.1)",
    headerBorder: "rgba(16, 185, 129, 0.2)",
    terminalBorder: "rgba(16, 185, 129, 0.25)",
    icon: ShieldCheck,
    iconColor: "#10b981",
    glow: "0 0 30px rgba(16, 185, 129, 0.1)",
    label: "VERIFIED SAFE",
    statusClass: "dg-status-safe",
  },
  scanning: {
    headerColor: "rgba(6, 182, 212, 0.08)",
    headerBorder: "rgba(6, 182, 212, 0.2)",
    terminalBorder: "rgba(6, 182, 212, 0.2)",
    icon: Zap,
    iconColor: "#06b6d4",
    glow: "0 0 30px rgba(6, 182, 212, 0.1)",
    label: "SCANNING...",
    statusClass: "",
  },
};

/**
 * @param {object} props
 * @param {string} [props.title] - Header title text
 * @param {"danger"|"warning"|"safe"|"scanning"} [props.status] - Scanner result state
 * @param {Array<{label: string, value: string, isStatus?: boolean}>} [props.rows]
 * @param {string} [props.detail] - Detail text shown with >> prefix
 * @param {boolean} [props.showCursor] - Show blinking cursor for live states
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Custom body content
 */
export default function AITerminalBlock({
  title = "AI SECURITY SCANNER",
  status = "scanning",
  rows = [],
  detail,
  showCursor = false,
  className = "",
  children,
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.scanning;
  const Icon = config.icon;

  return (
    <div
      className={`dg-terminal ${className}`}
      style={{
        borderColor: config.terminalBorder,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04), ${config.glow}`,
      }}
    >
      {/* Terminal Header */}
      <div
        className="dg-terminal-header"
        style={{
          background: config.headerColor,
          borderBottomColor: config.headerBorder,
        }}
      >
        <Icon
          style={{ color: config.iconColor, width: 13, height: 13, flexShrink: 0 }}
          aria-hidden="true"
        />
        <span>{title}</span>
        <span
          className={`ml-auto text-[0.65rem] font-bold ${config.statusClass}`}
          style={{ letterSpacing: "0.14em" }}
        >
          [{config.label}]
        </span>
      </div>

      {/* Terminal Body */}
      <div className="dg-terminal-body">
        {children ? (
          children
        ) : (
          <>
            {/* Data Rows */}
            {rows.map((row, i) => (
              <div key={i} className="dg-terminal-row">
                <span className="dg-terminal-label">{row.label}:</span>
                {row.isStatus ? (
                  <span className={config.statusClass}>{row.value}</span>
                ) : (
                  <span className="dg-terminal-value">{row.value}</span>
                )}
              </div>
            ))}

            {/* Detail block */}
            {detail && (
              <>
                <hr className="dg-terminal-divider" />
                <div className="dg-terminal-detail">
                  {detail}
                  {showCursor && <span className="dg-cursor" aria-hidden="true" />}
                </div>
              </>
            )}

            {/* Default scanning state */}
            {status === "scanning" && rows.length === 0 && !detail && (
              <div className="dg-terminal-detail" style={{ marginTop: 0 }}>
                Đang phân tích dữ liệu
                <span className="dg-cursor" aria-hidden="true" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
