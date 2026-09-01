"use client";

import React from "react";
import { AlertCircle, CheckCircle2, CircleHelp, Info, LoaderCircle, RefreshCw, ShieldAlert, WifiOff } from "lucide-react";

const COPY = Object.freeze({
  IDLE: { title: "Sẵn sàng", description: "Chưa có yêu cầu nào được gửi." },
  VALIDATING: { title: "Đang kiểm tra dữ liệu", description: "Đang xác nhận đầu vào trước khi gọi nguồn." },
  LOADING: { title: "Đang tải dữ liệu", description: "Nguồn đang xử lý yêu cầu." },
  SUBMITTING: { title: "Đang gửi yêu cầu", description: "Yêu cầu đang được chuyển tới nguồn đã chọn." },
  SUCCESS: { title: "Đã hoàn tất", description: "Dữ liệu đã sẵn sàng." },
  EMPTY: { title: "Chưa có dữ liệu", description: "Không có bản ghi phù hợp trong phạm vi hiện tại." },
  PARTIAL: { title: "Kết quả chưa đầy đủ", description: "Một phần nguồn hoặc phạm vi chưa trả về dữ liệu." },
  UNKNOWN: { title: "Chưa thể kết luận", description: "Dữ liệu hiện tại chưa đủ để đưa ra kết luận an toàn." },
  INSUFFICIENT_EVIDENCE: { title: "Chưa đủ bằng chứng", description: "Hãy kiểm tra thêm nguồn độc lập trước khi hành động." },
  CONFLICTING_EVIDENCE: { title: "Các nguồn đang xung đột", description: "Không nên coi kết quả này là an toàn khi các nguồn chưa thống nhất." },
  UNAVAILABLE: { title: "Nguồn chưa khả dụng", description: "Nguồn được yêu cầu hiện không thể truy cập; dữ liệu demo không được dùng thay thế." },
  ERROR: { title: "Không thể hoàn tất", description: "Yêu cầu gặp lỗi và không có kết quả hợp lệ." },
  OFFLINE: { title: "Đang ngoại tuyến", description: "Kiểm tra kết nối rồi thử lại khi có mạng." },
  CANCELLED: { title: "Đã dừng yêu cầu", description: "Yêu cầu hiện tại đã được hủy." },
  AUTH_REQUIRED: { title: "Cần đăng nhập", description: "Đăng nhập để tiếp tục trong phạm vi được phép." },
  FORBIDDEN: { title: "Không có quyền truy cập", description: "Tài khoản hiện tại không có quyền với phạm vi này." },
});

const ICONS = Object.freeze({
  LOADING: LoaderCircle,
  VALIDATING: LoaderCircle,
  SUBMITTING: LoaderCircle,
  SUCCESS: CheckCircle2,
  UNKNOWN: CircleHelp,
  INSUFFICIENT_EVIDENCE: CircleHelp,
  CONFLICTING_EVIDENCE: ShieldAlert,
  UNAVAILABLE: Info,
  OFFLINE: WifiOff,
  ERROR: AlertCircle,
});

const CONTENT_STATES = new Set(["PARTIAL", "UNKNOWN", "INSUFFICIENT_EVIDENCE", "CONFLICTING_EVIDENCE", "UNAVAILABLE", "ERROR", "OFFLINE"]);

export default function StateBoundary({
  envelope,
  state: explicitState,
  title,
  description,
  actions = [],
  onAction,
  children,
  className = "",
}) {
  const state = explicitState || envelope?.state || "IDLE";
  const copy = COPY[state] || COPY.ERROR;
  const Icon = ICONS[state] || Info;
  const errorMessage = envelope?.error?.userMessage;
  const unavailable = envelope?.unavailable;
  const visibleActions = actions.length ? actions : envelope?.nextActions || [];
  const message = errorMessage || description || copy.description;
  const role = ["ERROR", "UNAVAILABLE", "OFFLINE", "FORBIDDEN"].includes(state) ? "alert" : "status";

  if (state === "SUCCESS" && children) return children;

  return (
    <div className={`ui-state-boundary ui-state-${state.toLowerCase()} ${className}`.trim()} data-ui-state={state} role={role} aria-live="polite">
      <div className="ui-state-icon" aria-hidden="true"><Icon className={state === "LOADING" || state === "VALIDATING" || state === "SUBMITTING" ? "animate-spin" : undefined} size={18} /></div>
      <div className="ui-state-copy">
        <strong>{title || copy.title}</strong>
        <p>{message}</p>
        {unavailable && <small>{unavailable.dependency} · {unavailable.reason}</small>}
      </div>
      {visibleActions.length > 0 && onAction && <div className="ui-state-actions">
        {visibleActions.map((action) => <button key={action.id} type="button" className="secondary-action" onClick={() => onAction(action)}><RefreshCw size={14} aria-hidden="true" />{action.label}</button>)}
      </div>}
      {children && CONTENT_STATES.has(state) && <div className="ui-state-content">{children}</div>}
    </div>
  );
}
