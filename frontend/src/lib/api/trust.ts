import { apiRequest } from "./client";
import { ApiError } from "./errors";
import { canonicalTrustResponseSchema, trustEvidenceResultSchema, trustReasoningResultSchema, trustScreenResultSchema, trustSemanticResultSchema, trustV5ResponseSchema, type CanonicalTrustResponse, type TrustLayerResult, type TrustV5Pipeline, type TrustV5Response } from "./schemas/trust";

export type { ExpertConsensus, RelatedCase, ThreatProviderResult, TrustLayerResult } from "./schemas/trust";

export type TrustInput = {
  type: "text" | "url" | "image" | "file";
  content: string;
  metadata?: Record<string, unknown>;
};

type TrustV5Event = {
  type?: string;
  event?: string;
  stageId?: string | null;
  requestId?: string;
  data?: TrustV5Pipeline;
  error?: { code?: string; message?: string };
};

function legacyStage(stageId: string, raw: Record<string, unknown> | null | undefined, finding: string, summary: string, nextStage: string | null) {
  const source = raw || {};
  const operationStatus = raw ? (stageId === "l5" ? "PARTIAL" : "COMPLETED") : stageId === "l5" ? "PARTIAL" : "FAILED";
  return {
    schemaVersion: "trust.v5.stage.compatibility",
    requestId: "legacy-compatibility",
    stageId,
    architecturalLayer: stageId.toUpperCase(),
    stageName: stageId === "l1" ? "LOCAL SECURITY" : stageId === "l2a" ? "THREAT INTELLIGENCE" : stageId === "l2b" ? "SEMANTIC INTELLIGENCE" : stageId === "l2c" ? "STUDENTHUB DOMAIN AI" : stageId === "l3" ? "EVIDENCE & PROVENANCE" : stageId === "l4" ? "FINAL POLICY" : "ASSURANCE AUDIT",
    role: "Compatibility view for a pre-V5 response",
    checking: "Phản hồi cũ không có đầy đủ V5 stage contract; dữ liệu được giữ nguyên để hiển thị chuyển tiếp.",
    operationStatus,
    finding,
    severity: finding === "UNKNOWN" || finding === "BLOCKED_BY_MISSING_EVIDENCE" ? "HIGH" : "INFO",
    startedAt: null,
    completedAt: null,
    latencyMs: null,
    providerStatus: typeof source.providerStatus === "string" ? source.providerStatus : "COMPATIBILITY",
    providerId: typeof source.provider === "string" ? source.provider : null,
    modelId: null,
    modelVersion: null,
    confidence: typeof source.confidence === "number" && source.confidence >= 0 && source.confidence <= 1 ? source.confidence : null,
    confidenceKind: "COMPATIBILITY_NON_PROBABILISTIC",
    summary,
    reasons: [],
    signals: [],
    evidenceRefs: Array.isArray(source.evidenceRefs) ? source.evidenceRefs.filter((value): value is string => typeof value === "string").slice(0, 20) : [],
    meaning: "Đây là compatibility data từ contract cũ, không phải bằng chứng V5 đầy đủ.",
    notProve: "Không chứng minh an toàn; V5 stage contract chưa được upstream cung cấp.",
    limitations: ["Upstream response không chứa đầy đủ bảy stage V5; không dùng compatibility view làm maturity evidence."],
    nextStage,
    safeToContinue: operationStatus !== "FAILED",
    userAction: "Giữ thận trọng và chờ contract V5 đầy đủ.",
    audit: { attempt: 1, attemptCount: 1, errorCode: null, transition: operationStatus },
  };
}

function legacyToV5(payload: Record<string, unknown>): TrustV5Response {
  const data = (payload.data && typeof payload.data === "object" ? payload.data : {}) as Record<string, unknown>;
  const layer1 = (data.layer1 && typeof data.layer1 === "object" ? data.layer1 : null) as Record<string, unknown> | null;
  const layer2A = (data.layer2A && typeof data.layer2A === "object" ? data.layer2A : null) as Record<string, unknown> | null;
  const layer2 = (data.layer2 && typeof data.layer2 === "object" ? data.layer2 : null) as Record<string, unknown> | null;
  const layer3 = (data.layer3 && typeof data.layer3 === "object" ? data.layer3 : null) as Record<string, unknown> | null;
  const layer4 = (data.layer4 && typeof data.layer4 === "object" ? data.layer4 : null) as Record<string, unknown> | null;
  const layer1Finding = layer1?.status === "BLOCK" ? "LOCAL_BLOCK" : layer1?.status === "SUSPICIOUS" ? "LOCAL_SUSPICIOUS" : layer1?.status === "PASS" ? "LOCAL_CLEAR" : "LOCAL_UNKNOWN";
  const l2aFinding = typeof layer2A?.finding === "string" && ["THREAT_MATCH", "NO_KNOWN_THREAT", "UNKNOWN", "NOT_APPLICABLE", "SKIPPED_PRIVACY_SAFETY"].includes(layer2A.finding) ? layer2A.finding : "UNKNOWN";
  const l2bFinding = layer2?.status === "UNKNOWN" ? "UNKNOWN" : layer2?.status === "PASS" ? "SEMANTIC_NORMAL" : "SEMANTIC_SUSPICIOUS";
  const l3Status = String(layer3?.status || "").toUpperCase();
  const l3Finding = l3Status.includes("CONTEST") ? "MIXED" : l3Status.includes("VERIFIED") ? "SUPPORTED" : l3Status.includes("PARTIAL") ? "MIXED" : l3Status.includes("UNAVAILABLE") ? "UNAVAILABLE" : "INSUFFICIENT";
  const security = typeof layer4?.securityClassification === "string" ? layer4.securityClassification : layer1?.status === "BLOCK" ? "MALICIOUS" : layer1?.status === "SUSPICIOUS" ? "SUSPICIOUS" : "UNKNOWN";
  const truth = typeof layer4?.truthStatus === "string" ? layer4.truthStatus : "INSUFFICIENT_EVIDENCE";
  const action = typeof layer4?.enforcement === "string" ? layer4.enforcement : security === "MALICIOUS" ? "BLOCK" : security === "SUSPICIOUS" ? "WARN" : "REVIEW";
  const requestId = typeof payload.requestId === "string" ? payload.requestId : "legacy-compatibility";
  const stages = {
    l1: legacyStage("l1", layer1, layer1Finding, "Layer 1 compatibility result.", "l2a"),
    l2a: legacyStage("l2a", layer2A, l2aFinding, "Layer 2A compatibility result.", "l2b"),
    l2b: legacyStage("l2b", layer2, l2bFinding, "Layer 2B compatibility result.", "l2c"),
    l2c: legacyStage("l2c", null, "UNKNOWN_STUDENT_RISK", "V5 L2C chưa có trong upstream response.", "l3"),
    l3: legacyStage("l3", layer3, l3Finding, "Layer 3 compatibility result.", "l4"),
    l4: legacyStage("l4", layer4, ["MALICIOUS", "SUSPICIOUS", "NO_KNOWN_THREAT", "UNKNOWN", "NOT_APPLICABLE"].includes(security) ? security : "UNKNOWN", "Layer 4 compatibility result.", "l5"),
    l5: legacyStage("l5", null, "BLOCKED_BY_MISSING_EVIDENCE", "L5 chưa chạy vì upstream trả contract trước V5.", null),
  };
  for (const stage of Object.values(stages)) stage.requestId = requestId;
  const pipeline = {
    schemaVersion: "trust.v5",
    pipelineVersion: "trust-v5-compatibility",
    requestId,
    pipelineStatus: "PARTIAL",
    currentStage: "l5",
    stages,
    finalDecision: {
      security,
      truth,
      action,
      securityClassification: security,
      truthStatus: truth,
      enforcement: action,
      presentedTruthStatus: truth,
      presentedEnforcement: action,
      l4Decision: { security, truth, action },
      assuranceStatus: "BLOCKED_BY_MISSING_EVIDENCE",
      assuranceApplied: false,
      decisionAuthority: "L4_DETERMINISTIC_POLICY",
      assuranceAuthority: "L5_DOWNGRADE_ONLY",
      isHardNegative: security === "MALICIOUS" || action === "BLOCK",
    },
    assurance: {
      status: "BLOCKED_BY_MISSING_EVIDENCE",
      anomalies: [{ code: "V5_CONTRACT_MISSING", severity: "HIGH", details: "Upstream response chưa có V5 orchestration." }],
      assuranceReasons: ["Compatibility response không được coi là V5 evidence."],
      recommendedRechecks: ["retry_with_v5_contract"],
      assuranceConfidence: null,
      assuranceConfidenceKind: "NOT_CALIBRATED_ASSURANCE_RESULT",
      auditVersion: "trust-v5-compatibility",
      downgradeOnly: true,
    },
    startedAt: null,
    completedAt: null,
    audit: { requestId, stageSequence: ["l1", "l2a", "l2b", "l2c", "l3", "l4", "l5"], stageAttempts: [], hardNegativePropagation: [], policyVersion: "trust-v5-compatibility", assuranceVersion: "trust-v5-compatibility", compatibilityFallback: true },
    layerResults: { layer1, layer2A, layer2B: layer2, layer2C: null, layer3, layer4 },
  };
  return { success: true, contractVersion: "trust.v5", requestId, version: "v5", demo: false, data: pipeline } as unknown as TrustV5Response;
}

function parseV5Response(payload: unknown): TrustV5Response {
  const parsed = trustV5ResponseSchema.safeParse(payload);
  if (parsed.success) return parsed.data;
  if (payload && typeof payload === "object" && (payload as Record<string, unknown>).contractVersion === "trust.v1") {
    return legacyToV5(payload as Record<string, unknown>);
  }
  throw new ApiError("Response did not match the expected V5 contract.", "SCHEMA_MISMATCH", { issues: parsed.error.issues.slice(0, 5).map((issue) => `${issue.path.join(".")}: ${issue.message}`) });
}

function statusCodeFor(status: number): ApiError["code"] {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 413) return "PAYLOAD_TOO_LARGE";
  if (status === 429) return "RATE_LIMITED";
  if (status === 502) return "UPSTREAM_UNAVAILABLE";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  if (status === 400 || status === 422) return "VALIDATION";
  return "SERVER_ERROR";
}

function requestIdFrom(response: Response, payload: unknown): string | null {
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
  const nestedError = record?.error && typeof record.error === "object" ? record.error as Record<string, unknown> : null;
  const candidate = response.headers.get("x-request-id") || response.headers.get("x-correlation-id") || nestedError?.requestId || nestedError?.traceId || record?.requestId || record?.traceId;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim().slice(0, 120) : null;
}

function safeMessageFrom(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Yêu cầu Trust không thể hoàn tất.";
  const record = payload as Record<string, unknown>;
  const nestedError = record.error && typeof record.error === "object" ? record.error as Record<string, unknown> : null;
  const candidate = nestedError?.userMessage || record.userMessage;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim().slice(0, 240) : "Yêu cầu Trust không thể hoàn tất.";
}

async function readJsonOrNull(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch {
    const requestId = requestIdFrom(response, null);
    throw new ApiError("Response was not valid JSON.", "INVALID_RESPONSE", { status: response.status, requestId, traceId: requestId });
  }
}

async function sequentialRequest(input: TrustInput, callerSignal: AbortSignal | undefined, onEvent?: (event: TrustV5Event) => void, requestId?: string): Promise<TrustV5Response> {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort("timeout"); }, 45_000);
  try {
    let response: Response;
    try {
      response = await fetch("/api/v1/trust", {
        method: "POST",
        body: JSON.stringify({ ...input, depth: "full", version: "v5", stream: true }),
        signal: controller.signal,
        credentials: "include",
        headers: { Accept: "text/event-stream, application/json", "Content-Type": "application/json", ...(requestId ? { "X-Request-ID": requestId.slice(0, 120) } : {}) },
      });
    } catch {
      if (controller.signal.aborted) throw new ApiError(timedOut ? "Request timed out." : "Request aborted.", timedOut ? "TIMEOUT" : "ABORTED", { requestId });
      throw new ApiError("Network request failed.", "NETWORK_ERROR", { requestId });
    }
    if (!response.ok) {
      const payload = await readJsonOrNull(response);
      const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
      const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "", 10);
      const responseRequestId = requestIdFrom(response, payload);
      throw new ApiError(safeMessageFrom(record), statusCodeFor(response.status), { status: response.status, retryAfter: Number.isFinite(retryAfter) ? retryAfter : null, traceId: responseRequestId, requestId: requestId || responseRequestId, userMessage: safeMessageFrom(record) });
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/event-stream")) {
      const payload = await readJsonOrNull(response);
      const result = parseV5Response(payload);
      onEvent?.({ type: "complete", event: "PIPELINE_COMPLETED", stageId: "l5", requestId: result.requestId, data: result.data });
      return result;
    }
    if (!response.body) throw new ApiError("Streaming response did not include a readable body.", "INVALID_RESPONSE", { requestId });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed: TrustV5Response | null = null;
    const dispatch = (block: string) => {
      const dataLines = block.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim());
      if (!dataLines.length) return;
      let event: TrustV5Event;
      try { event = JSON.parse(dataLines.join("\n")) as TrustV5Event; } catch { throw new ApiError("Streaming response contained malformed event data.", "INVALID_RESPONSE", { requestId }); }
      onEvent?.(event);
      if (event.type === "error") throw new ApiError("Trust pipeline failed.", "SERVER_ERROR", { requestId: event.requestId || requestId });
      if (event.type === "complete" && event.data) completed = parseV5Response({ success: true, contractVersion: "trust.v5", requestId: event.requestId || event.data.requestId, version: "v5", demo: false, data: event.data });
    };
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      let separator = buffer.indexOf("\n\n");
      while (separator >= 0) {
        dispatch(buffer.slice(0, separator));
        buffer = buffer.slice(separator + 2);
        separator = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
    if (buffer.trim()) dispatch(buffer);
    if (!completed) throw new ApiError("Streaming response ended without a completed V5 result.", "INVALID_RESPONSE", { requestId });
    return completed;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) {
      throw new ApiError(timedOut ? "Request timed out." : "Request aborted.", timedOut ? "TIMEOUT" : "ABORTED", { requestId });
    }
    throw new ApiError("Network request failed.", "NETWORK_ERROR", { requestId });
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export const trustApi = {
  canonical(input: TrustInput, signal?: AbortSignal) {
    return apiRequest<CanonicalTrustResponse>("/api/v1/trust", {
      method: "POST",
      body: JSON.stringify({ ...input, depth: "full" }),
      signal,
      schema: canonicalTrustResponseSchema,
    });
  },
  screen(input: TrustInput, signal?: AbortSignal) {
    return apiRequest<TrustLayerResult>("/api/ai-trust/screen", {
      method: "POST",
      body: JSON.stringify(input),
      signal,
      schema: trustScreenResultSchema,
    });
  },
  semantic(input: TrustInput, layer1Result: TrustLayerResult, signal?: AbortSignal) {
    return apiRequest<TrustLayerResult>("/api/ai-trust/semantic", {
      method: "POST",
      body: JSON.stringify({ ...input, layer1Result }),
      signal,
      schema: trustSemanticResultSchema,
    });
  },
  evidence(layer2Result: TrustLayerResult, signal?: AbortSignal) {
    return apiRequest<TrustLayerResult>("/api/ai-trust/evidence", {
      method: "POST",
      body: JSON.stringify({
        claims: layer2Result?.claims || [],
        candidateSources: layer2Result?.verificationPackage?.candidateSources || [],
        layer2Result,
      }),
      signal,
      schema: trustEvidenceResultSchema,
    });
  },
  reasoning(layer1Result: TrustLayerResult, layer2Result: TrustLayerResult | null, layer3Result: TrustLayerResult | null, signal?: AbortSignal) {
    return apiRequest<TrustLayerResult>("/api/ai-trust/reasoning", {
      method: "POST",
      body: JSON.stringify({ layer1Result, layer2Result, layer3Result }),
      signal,
      schema: trustReasoningResultSchema,
    });
  },
  sequential(input: TrustInput, signal?: AbortSignal, onEvent?: (event: TrustV5Event) => void, requestId?: string) {
    return sequentialRequest(input, signal, onEvent, requestId);
  },
};

export type { TrustV5Event };
