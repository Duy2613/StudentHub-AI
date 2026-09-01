import { z } from "zod";

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

export const API_ERROR_CODE_VALUES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PAYLOAD_TOO_LARGE",
  "VALIDATION",
  "RATE_LIMITED",
  "SERVER_ERROR",
  "UPSTREAM_UNAVAILABLE",
  "SERVICE_UNAVAILABLE",
  "NETWORK_ERROR",
  "TIMEOUT",
  "ABORTED",
  "INVALID_RESPONSE",
  "SCHEMA_MISMATCH",
  "PROVIDER_PARTIAL",
] as const satisfies readonly ApiErrorCode[];

export const apiErrorCodeSchema = z.enum(API_ERROR_CODE_VALUES);

export type SafeErrorDetails = Readonly<{
  issues?: readonly string[];
  field?: string;
  dependency?: string;
  traceId?: string;
}>;

export type SafeFrontendError = Readonly<{
  code: ApiErrorCode;
  userMessage: string;
  requestId: string | null;
  retryable: boolean;
  details?: SafeErrorDetails;
}>;

export const safeErrorDetailsSchema = z.object({
  issues: z.array(z.string().trim().min(1).max(240)).max(5).optional(),
  field: z.string().trim().min(1).max(120).optional(),
  dependency: z.string().trim().min(1).max(160).optional(),
  traceId: z.string().trim().min(1).max(120).optional(),
}).strict();

export const safeFrontendErrorSchema = z.object({
  code: apiErrorCodeSchema,
  userMessage: z.string().trim().min(1).max(240),
  requestId: z.string().trim().min(1).max(120).nullable(),
  retryable: z.boolean(),
  details: safeErrorDetailsSchema.optional(),
}).strict();

type ApiErrorOptions = {
  status?: number;
  retryAfter?: number | null;
  traceId?: string | null;
  requestId?: string | null;
  issues?: string[];
  details?: SafeErrorDetails;
  userMessage?: string;
  retryable?: boolean;
};

const SAFE_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: "Phiên đăng nhập không còn hợp lệ. Hãy đăng nhập lại để tiếp tục.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  NOT_FOUND: "Tài nguyên được yêu cầu không còn khả dụng.",
  CONFLICT: "Dữ liệu đã thay đổi. Hãy tải lại trước khi thử tiếp.",
  PAYLOAD_TOO_LARGE: "Dữ liệu gửi lên vượt quá giới hạn cho phép.",
  VALIDATION: "Thông tin gửi lên chưa hợp lệ.",
  RATE_LIMITED: "Quá nhiều yêu cầu. Hãy chờ một lúc rồi thử lại.",
  SERVER_ERROR: "Yêu cầu không thể hoàn tất lúc này.",
  UPSTREAM_UNAVAILABLE: "Một nguồn đối soát đang tạm thời không khả dụng.",
  SERVICE_UNAVAILABLE: "Dịch vụ StudentHub đang tạm thời không khả dụng.",
  NETWORK_ERROR: "Không thể kết nối tới StudentHub.",
  TIMEOUT: "Yêu cầu mất quá nhiều thời gian. Hãy thử lại.",
  ABORTED: "Yêu cầu đã được dừng.",
  INVALID_RESPONSE: "Máy chủ trả về dữ liệu không hợp lệ.",
  SCHEMA_MISMATCH: "Dữ liệu trả về không khớp hợp đồng an toàn của giao diện.",
  PROVIDER_PARTIAL: "Một phần nguồn dữ liệu chưa hoàn tất.",
};

const RETRYABLE_CODES = new Set<ApiErrorCode>([
  "RATE_LIMITED",
  "UPSTREAM_UNAVAILABLE",
  "SERVICE_UNAVAILABLE",
  "NETWORK_ERROR",
  "TIMEOUT",
  "PROVIDER_PARTIAL",
]);

function boundedRequestId(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : null;
}

function boundedIssues(value: readonly string[] | undefined): string[] {
  return (value || [])
    .filter((issue): issue is string => typeof issue === "string" && issue.trim().length > 0)
    .map((issue) => issue.trim().slice(0, 240))
    .slice(0, 5);
}

function messageFor(code: ApiErrorCode, message: string, userMessage?: string): string {
  const candidate = userMessage || message;
  if (code === "VALIDATION" && candidate.trim()) return candidate.trim().slice(0, 240);
  if (code === "NOT_FOUND" && candidate.trim()) return candidate.trim().slice(0, 240);
  return SAFE_MESSAGES[code] || SAFE_MESSAGES.SERVER_ERROR;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryAfter: number | null;
  readonly traceId: string | null;
  readonly requestId: string | null;
  readonly issues: string[];
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly details?: SafeErrorDetails;

  constructor(message: string, code: ApiErrorCode, options: ApiErrorOptions = {}) {
    const userMessage = messageFor(code, message, options.userMessage);
    super(userMessage);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status ?? 0;
    this.retryAfter = options.retryAfter ?? null;
    this.traceId = boundedRequestId(options.traceId);
    this.requestId = boundedRequestId(options.requestId) || this.traceId;
    this.issues = boundedIssues(options.issues);
    this.userMessage = userMessage;
    this.retryable = options.retryable ?? RETRYABLE_CODES.has(code);
    this.details = options.details || (this.issues.length ? { issues: this.issues } : undefined);
  }

  toSafeError(): SafeFrontendError {
    const details = this.details || this.traceId ? { ...(this.details || {}), ...(this.traceId ? { traceId: this.traceId } : {}) } : undefined;
    return {
      code: this.code,
      userMessage: this.userMessage,
      requestId: this.requestId,
      retryable: this.retryable,
      ...(details ? { details } : {}),
    };
  }
}

export function apiErrorMessage(error: ApiError): string {
  if (error.code === "RATE_LIMITED" && error.retryAfter) {
    return `Quá nhiều yêu cầu. Hãy thử lại sau ${error.retryAfter} giây.`;
  }
  return error.userMessage;
}
