const RETRYABLE_CODES = new Set(["RATE_LIMITED", "UPSTREAM_UNAVAILABLE", "SERVICE_UNAVAILABLE", "NETWORK_ERROR", "TIMEOUT", "PROVIDER_PARTIAL"]);

const SAFE_MESSAGES = Object.freeze({
  UNAUTHORIZED: "Phiên đăng nhập không còn hợp lệ. Hãy đăng nhập lại để tiếp tục.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  NOT_FOUND: "Tài nguyên được yêu cầu không còn khả dụng.",
  CONFLICT: "Dữ liệu đã thay đổi. Hãy tải lại trước khi thử tiếp.",
  VALIDATION: "Thông tin gửi lên chưa hợp lệ.",
  RATE_LIMITED: "Quá nhiều yêu cầu. Hãy chờ một lúc rồi thử lại.",
  SERVER_ERROR: "Yêu cầu không thể hoàn tất lúc này.",
  UPSTREAM_UNAVAILABLE: "Một nguồn đối soát đang tạm thời không khả dụng.",
  SERVICE_UNAVAILABLE: "Dịch vụ StudentHub đang tạm thời không khả dụng.",
  NETWORK_ERROR: "Không thể kết nối tới StudentHub.",
  TIMEOUT: "Yêu cầu mất quá nhiều thời gian. Hãy thử lại.",
  ABORTED: "Yêu cầu đã được dừng.",
  INVALID_RESPONSE: "Máy chủ trả về dữ liệu không hợp lệ.",
});

export class ApiError extends Error {
  constructor(message, code = "SERVER_ERROR", options = {}) {
    const safeMessage = code === "VALIDATION" || code === "NOT_FOUND"
      ? String(options.userMessage || message || SAFE_MESSAGES[code]).slice(0, 240)
      : SAFE_MESSAGES[code] || SAFE_MESSAGES.SERVER_ERROR;
    super(safeMessage);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status || 0;
    this.retryAfter = options.retryAfter ?? null;
    this.traceId = options.traceId || null;
    this.requestId = options.requestId || this.traceId || null;
    this.retryable = options.retryable ?? RETRYABLE_CODES.has(code);
    this.issues = Array.isArray(options.issues) ? options.issues.slice(0, 5) : [];
  }

  toSafeError() {
    return {
      code: this.code,
      userMessage: this.message,
      requestId: this.requestId,
      retryable: this.retryable,
      ...(this.issues.length ? { details: { issues: this.issues } } : {}),
      ...(this.traceId ? { details: { ...(this.issues.length ? { issues: this.issues } : {}), traceId: this.traceId } } : {}),
    };
  }
}

export function apiErrorMessage(error) {
  if (error?.code === "RATE_LIMITED" && error.retryAfter) return `Quá nhiều yêu cầu. Hãy thử lại sau ${error.retryAfter} giây.`;
  return error?.message || SAFE_MESSAGES.SERVER_ERROR;
}

export function codeForStatus(status) {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 400 || status === 422) return "VALIDATION";
  if (status === 429) return "RATE_LIMITED";
  if (status === 502) return "UPSTREAM_UNAVAILABLE";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  return "SERVER_ERROR";
}
