import type { ZodType } from "zod";
import { ApiError, type ApiErrorCode } from "./errors";

export { ApiError } from "./errors";

export type ApiRequestOptions<T> = RequestInit & {
  timeoutMs?: number;
  requestId?: string;
  schema?: ZodType<T>;
};

function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 413) return "PAYLOAD_TOO_LARGE";
  if (status === 400 || status === 422) return "VALIDATION";
  if (status === 429) return "RATE_LIMITED";
  if (status === 502) return "UPSTREAM_UNAVAILABLE";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  return "SERVER_ERROR";
}

function traceIdFrom(response: Response, payload: unknown): string | null {
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
  const nestedError = record?.error && typeof record.error === "object" ? record.error as Record<string, unknown> : null;
  const candidate = response.headers.get("x-request-id")
    || response.headers.get("x-correlation-id")
    || nestedError?.requestId
    || nestedError?.traceId
    || record?.requestId
    || record?.traceId;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim().slice(0, 120) : null;
}

function safeMessageFrom(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Yêu cầu không thể hoàn tất.";
  const record = payload as Record<string, unknown>;
  const nestedError = record.error && typeof record.error === "object" ? record.error as Record<string, unknown> : null;
  const candidate = nestedError?.userMessage || record.userMessage;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim().slice(0, 240) : "Yêu cầu không thể hoàn tất.";
}

function boundedTimeout(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.min(Math.trunc(value), 120_000) : 15_000;
}

function shouldSetJsonContentType(body: BodyInit | null | undefined, headers: Headers): boolean {
  if (!body || headers.has("Content-Type")) return false;
  return typeof FormData === "undefined" || !(body instanceof FormData);
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions<T> = {}): Promise<T> {
  const {
    timeoutMs = 15_000,
    requestId,
    schema,
    signal: callerSignal,
    ...init
  } = options;
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort("timeout");
  }, boundedTimeout(timeoutMs));

  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (shouldSetJsonContentType(init.body, headers)) headers.set("Content-Type", "application/json");
  if (requestId?.trim()) headers.set("X-Request-ID", requestId.trim().slice(0, 120));

  try {
    const response = await fetch(path, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers,
    });
    const raw = await response.text();
    let payload: unknown = null;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        const traceId = traceIdFrom(response, null);
        throw new ApiError("Response was not valid JSON.", "INVALID_RESPONSE", { status: response.status, traceId, requestId: requestId || traceId });
      }
    }
    const traceId = traceIdFrom(response, payload);
    if (!response.ok) {
      const code = codeForStatus(response.status);
      const retryHeader = response.headers.get("Retry-After");
      const parsedRetry = retryHeader ? Number.parseInt(retryHeader, 10) : Number.NaN;
      const retryAfter = Number.isFinite(parsedRetry) ? Math.max(0, Math.min(parsedRetry, 86_400)) : null;
      throw new ApiError(safeMessageFrom(payload), code, {
        status: response.status,
        retryAfter,
        traceId,
        requestId: requestId || traceId,
        userMessage: safeMessageFrom(payload),
      });
    }
    if (!schema) return payload as T;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new ApiError("Response did not match the expected contract.", "SCHEMA_MISMATCH", {
        status: response.status,
        traceId,
        requestId: requestId || traceId,
        issues: parsed.error.issues.slice(0, 5).map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
    }
    return parsed.data;
  } catch (caught) {
    if (caught instanceof ApiError) throw caught;
    if (controller.signal.aborted) {
      throw new ApiError(timedOut ? "Request timed out." : "Request aborted.", timedOut ? "TIMEOUT" : "ABORTED", { requestId });
    }
    throw new ApiError("Network request failed.", "NETWORK_ERROR", { requestId });
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}
