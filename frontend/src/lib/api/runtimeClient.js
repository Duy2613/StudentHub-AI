import { ApiError, codeForStatus } from "./runtimeError";

function traceIdFrom(response, payload) {
  const record = payload && typeof payload === "object" ? payload : null;
  const nested = record?.error && typeof record.error === "object" ? record.error : null;
  return response.headers.get("x-request-id")
    || response.headers.get("x-correlation-id")
    || nested?.requestId
    || nested?.traceId
    || record?.requestId
    || record?.traceId
    || null;
}

function safeMessageFrom(payload) {
  if (!payload || typeof payload !== "object") return "Yêu cầu không thể hoàn tất.";
  const nested = payload.error && typeof payload.error === "object" ? payload.error : null;
  return String(nested?.userMessage || payload.userMessage || nested?.message || payload.error || "Yêu cầu không thể hoàn tất.").slice(0, 240);
}

export async function apiRequest(path, options = {}) {
  const { timeoutMs = 15_000, requestId, signal: callerSignal, ...init } = options;
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort("timeout");
  }, Math.min(Math.max(Number(timeoutMs) || 15_000, 1), 120_000));

  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type") && !(typeof FormData !== "undefined" && init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (requestId) headers.set("X-Request-ID", String(requestId).slice(0, 120));

  try {
    const response = await fetch(path, { ...init, signal: controller.signal, credentials: "include", headers });
    const raw = await response.text();
    let payload = null;
    if (raw) {
      try { payload = JSON.parse(raw); } catch { throw new ApiError("Response was not valid JSON.", "INVALID_RESPONSE", { status: response.status, requestId }); }
    }
    const traceId = traceIdFrom(response, payload);
    if (!response.ok) {
      const retryHeader = response.headers.get("Retry-After");
      const retryAfter = retryHeader && Number.isFinite(Number(retryHeader)) ? Number(retryHeader) : null;
      throw new ApiError(safeMessageFrom(payload), codeForStatus(response.status), { status: response.status, retryAfter, traceId, requestId: requestId || traceId, userMessage: safeMessageFrom(payload) });
    }
    return payload;
  } catch (caught) {
    if (caught instanceof ApiError) throw caught;
    if (controller.signal.aborted) throw new ApiError(timedOut ? "Request timed out." : "Request aborted.", timedOut ? "TIMEOUT" : "ABORTED", { requestId });
    throw new ApiError("Network request failed.", "NETWORK_ERROR", { requestId });
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}
