export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "UPSTREAM_UNAVAILABLE"
  | "SERVICE_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "ABORTED"
  | "INVALID_RESPONSE"
  | "SCHEMA_MISMATCH"
  | "PROVIDER_PARTIAL";

type ApiErrorOptions = {
  status?: number;
  retryAfter?: number | null;
  traceId?: string | null;
  issues?: string[];
};

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  retryAfter: number | null;
  traceId: string | null;
  issues: string[];

  constructor(message: string, code: ApiErrorCode, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status || 0;
    this.retryAfter = options.retryAfter ?? null;
    this.traceId = options.traceId ?? null;
    this.issues = options.issues || [];
  }
}

export function apiErrorMessage(error: ApiError): string {
  const messages: Partial<Record<ApiErrorCode, string>> = {
    UNAUTHORIZED: "Phiên đăng nhập không còn hợp lệ. Hãy đăng nhập lại để tiếp tục.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    NOT_FOUND: "Tài nguyên được yêu cầu không còn khả dụng.",
    CONFLICT: "Dữ liệu đã thay đổi. Hãy tải lại trước khi thử tiếp.",
    PAYLOAD_TOO_LARGE: "Dữ liệu gửi lên vượt quá giới hạn cho phép.",
    RATE_LIMITED: error.retryAfter ? `Quá nhiều yêu cầu. Hãy thử lại sau ${error.retryAfter} giây.` : "Quá nhiều yêu cầu. Hãy chờ một lúc rồi thử lại.",
    UPSTREAM_UNAVAILABLE: "Một nguồn đối soát đang tạm thời không khả dụng.",
    SERVICE_UNAVAILABLE: "Dịch vụ StudentHub đang tạm thời không khả dụng.",
    TIMEOUT: "Yêu cầu mất quá nhiều thời gian. Hãy thử lại.",
    NETWORK_ERROR: "Không thể kết nối tới StudentHub.",
    INVALID_RESPONSE: "Máy chủ trả về dữ liệu không hợp lệ.",
    SCHEMA_MISMATCH: "Dữ liệu trả về không khớp hợp đồng an toàn của giao diện.",
  };
  return messages[error.code] || error.message || "Yêu cầu không thể hoàn tất.";
}
