import type { ZodType } from "zod";
import { ApiError, type ApiErrorCode } from "./errors";

export { ApiError } from "./errors";

type ApiRequestOptions<T> = RequestInit & {
  timeoutMs?: number;
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
  const candidate = response.headers.get("x-request-id") || response.headers.get("x-correlation-id") || nestedError?.traceId || record?.traceId;
  return typeof candidate === "string" ? candidate.slice(0, 80) : null;
}

function messageFrom(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Yêu cầu không thể hoàn tất.";
  const record = payload as Record<string, unknown>;
  const nestedError = record.error && typeof record.error === "object" ? record.error as Record<string, unknown> : null;
  const candidate = nestedError?.message || record.message;
  return typeof candidate === "string" ? candidate : "Yêu cầu không thể hoàn tất.";
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions<T> = {}): Promise<T> {
  const { timeoutMs = 15_000, schema, signal: callerSignal, ...init } = options;
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort("timeout"); }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (caught) {
    if (controller.signal.aborted) {
      throw new ApiError(timedOut ? "Request timed out." : "Request aborted.", timedOut ? "TIMEOUT" : "ABORTED");
    }
    throw new ApiError(caught instanceof Error ? caught.message : "Network request failed.", "NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try { payload = JSON.parse(raw); }
    catch {
      throw new ApiError("Response was not valid JSON.", "INVALID_RESPONSE", { status: response.status, traceId: traceIdFrom(response, null) });
    }
  }
  const traceId = traceIdFrom(response, payload);
  if (!response.ok) {
    const retryHeader = response.headers.get("Retry-After");
    const parsedRetry = retryHeader ? Number.parseInt(retryHeader, 10) : Number.NaN;
    throw new ApiError(messageFrom(payload), codeForStatus(response.status), {
      status: response.status,
      retryAfter: Number.isFinite(parsedRetry) ? parsedRetry : null,
      traceId,
    });
  }
  if (!schema) return payload as T;
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError("Response did not match the expected contract.", "SCHEMA_MISMATCH", {
      status: response.status,
      traceId,
      issues: parsed.error.issues.slice(0, 5).map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    });
  }
  return parsed.data;
}
