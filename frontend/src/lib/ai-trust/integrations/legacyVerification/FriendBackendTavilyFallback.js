/**
 * Optional Layer 3 recovery for the friend-backend-authoritative pipeline.
 *
 * The friend backend remains the primary provider and the only final-decision
 * authority. This module is allowed to use the server-side local Tavily key
 * only when the friend's Layer 3 did not return usable evidence. It produces
 * evidence for the friend's Layer 4 request; it never produces a verdict.
 */

import { Layer3EvidenceService } from "../../layer3/Layer3EvidenceService.js";
import { QueryGenerator } from "../../layer3/query/QueryGenerator.js";
import { TavilyRetriever } from "../../layer3/retrieval/TavilyRetriever.js";

const MAX_REASON_LENGTH = 1_200;
const MAX_SOURCES = 40;
const MAX_EVIDENCE = 80;
const DEFAULT_TIMEOUT_MS = 20_000;
const DISABLED_VALUES = new Set(["0", "false", "off", "disabled", "no", "friend-only"]);
const TERMINAL_VERDICTS = new Set(["TRUE", "FALSE", "SUPPORTED", "CONTRADICTED", "MIXED"]);

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function boundedText(value, max = MAX_REASON_LENGTH) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max)
    : "";
}

function boundedArray(value, max) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function safeUnit(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1 ? number : fallback;
}

function safeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value);
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function rawFriendResponse(result) {
  const integration = asRecord(result?.legacyIntegration);
  const raw = asRecord(integration.rawResponse);
  return typeof raw.verdict === "string" ? raw : result;
}

function rawSources(raw) {
  return boundedArray(raw?.sources, MAX_SOURCES);
}

function rawEvidence(raw) {
  return boundedArray(raw?.evidence, MAX_EVIDENCE);
}

function friendFailureReason(raw, result) {
  return boundedText(
    raw?.reason
      || result?.legacyIntegration?.reason
      || result?.reason
      || result?.errorCode,
  );
}

function shouldRecover(raw, result) {
  const verdict = boundedText(raw?.verdict || result?.rawVerdict || result?.finding, 80).toUpperCase();
  if (TERMINAL_VERDICTS.has(verdict)) return false;

  const sources = rawSources(raw);
  const evidence = rawEvidence(raw);
  if (sources.length > 0 || evidence.length > 0) return false;

  const reason = friendFailureReason(raw, result).toLowerCase();
  const providerStatus = boundedText(
    raw?.providerStatus || result?.providerStatus || result?.legacyIntegration?.providerStatus,
    120,
  ).toUpperCase();
  return verdict === "UNKNOWN"
    || verdict === "UNAVAILABLE"
    || verdict === "ERROR"
    || providerStatus !== "SUCCESS"
    || /tavily|retriev|search|432|429|401|403|timeout|unavailable|failed|error|not configured/.test(reason);
}

function fallbackEnabled(env, retriever) {
  const configured = boundedText(env?.FRIEND_BACKEND_TAVILY_FALLBACK, 40).toLowerCase();
  if (DISABLED_VALUES.has(configured)) return false;
  return retriever.isConfigured();
}

function legacySource(source, index) {
  const record = asRecord(source);
  const url = safeUrl(record.url || record.sourceUrl || record.link);
  if (!url) return null;
  return {
    title: boundedText(record.title || record.sourceTitle || record.publisher, 240) || `Tavily source ${index + 1}`,
    url,
  };
}

function legacyEvidenceRecord(item, index) {
  const record = asRecord(item);
  const url = safeUrl(record.sourceUrl || record.url || record.link);
  if (!url) return null;
  return {
    title: boundedText(record.sourceTitle || record.title || record.publisher, 240) || `Tavily evidence ${index + 1}`,
    url,
    content: boundedText(record.excerpt || record.content || record.observation || record.summary, 4_000),
  };
}

function safeDiagnostics(retriever) {
  try {
    const diagnostics = retriever.getRuntimeDiagnostics?.();
    if (!diagnostics || typeof diagnostics !== "object") return {};
    return {
      provider: "tavily",
      providerStatus: boundedText(retriever.lastSearchStatus, 80).toUpperCase() || null,
      providerCallCount: Number.isFinite(Number(diagnostics.callCount)) ? Number(diagnostics.callCount) : 0,
      queriesRequested: Number.isFinite(Number(diagnostics.queriesRequested)) ? Number(diagnostics.queriesRequested) : 0,
      queriesExecuted: Number.isFinite(Number(diagnostics.queriesExecuted)) ? Number(diagnostics.queriesExecuted) : 0,
      rawResultCount: Number.isFinite(Number(diagnostics.rawResultCount)) ? Number(diagnostics.rawResultCount) : 0,
      acceptedResultCount: Number.isFinite(Number(diagnostics.acceptedResults)) ? Number(diagnostics.acceptedResults) : 0,
      acceptedHostCount: Number.isFinite(Number(diagnostics.acceptedHostCount)) ? Number(diagnostics.acceptedHostCount) : 0,
      httpStatuses: Array.isArray(diagnostics.httpStatuses)
        ? diagnostics.httpStatuses.slice(-12).map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 100 && value <= 599)
        : [],
      lastErrorCode: boundedText(diagnostics.lastErrorCode, 120) || null,
    };
  } catch {
    return {};
  }
}

function errorCode(error) {
  return boundedText(error?.code || error?.message, 120) || "TAVILY_FALLBACK_FAILED";
}

function noRecoveryMetadata({ status = "NOT_ATTEMPTED", reason = null, retriever = null } = {}) {
  return {
    applied: false,
    status,
    sourceMode: "FRIEND_BACKEND",
    provider: "tavily",
    reason: boundedText(reason, 500) || null,
    diagnostics: retriever ? safeDiagnostics(retriever) : {},
  };
}

/**
 * @returns {Promise<{applied: boolean, normalized: object|null, raw: object|null, metadata: object}>}
 */
export async function tryFriendBackendTavilyFallback({
  input = {},
  layer2Result = null,
  friendLayer3Result = null,
  requestId = null,
  signal,
  env = process.env,
  retriever = null,
  verifyEvidence = Layer3EvidenceService.verify,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const friendRaw = rawFriendResponse(friendLayer3Result);
  if (!shouldRecover(friendRaw, friendLayer3Result)) {
    return { applied: false, normalized: null, raw: null, metadata: noRecoveryMetadata({ status: "NOT_NEEDED" }) };
  }

  // An image without OCR/QR/URL context has nothing meaningful to search.
  // Keep the friend's result unchanged instead of reporting a misleading
  // successful fallback with zero queries.
  if (!QueryGenerator.getInputContextText(input)) {
    return {
      applied: false,
      normalized: null,
      raw: null,
      metadata: noRecoveryMetadata({
        status: "NO_QUERY_CONTEXT",
        reason: "Input không có text, URL, OCR hoặc QR payload để Tavily đối chiếu.",
      }),
    };
  }

  const tavily = retriever || new TavilyRetriever({ env });
  if (!fallbackEnabled(env, tavily)) {
    return {
      applied: false,
      normalized: null,
      raw: null,
      metadata: noRecoveryMetadata({
        status: "NOT_CONFIGURED",
        reason: "Friend backend L3 không có evidence và Tavily local chưa được cấu hình.",
        retriever: tavily,
      }),
    };
  }

  if (signal?.aborted) {
    const error = new Error("TAVILY_FALLBACK_ABORTED");
    error.name = "AbortError";
    throw error;
  }

  const friendReason = friendFailureReason(friendRaw, friendLayer3Result) || "Friend backend L3 không trả evidence usable.";
  try {
    const evidenceResult = await verifyEvidence({
      input,
      layer2Result,
      claims: [],
      candidateSources: [],
      options: {
        retriever: tavily,
        allowLocalFallback: false,
        requestId,
        signal,
        retrievalTimeoutMs: Number.isFinite(Number(timeoutMs)) ? Math.max(500, Math.min(120_000, Number(timeoutMs))) : DEFAULT_TIMEOUT_MS,
        maxRetrievalQueries: 8,
        tavilyMaxResults: 8,
        maxRetrievedSources: 16,
      },
    });
    if (signal?.aborted) {
      const error = new Error("TAVILY_FALLBACK_ABORTED");
      error.name = "AbortError";
      throw error;
    }

    const sources = boundedArray(evidenceResult?.sources, MAX_SOURCES);
    const evidence = boundedArray(evidenceResult?.evidence, MAX_EVIDENCE);
    const legacySources = sources.map(legacySource).filter(Boolean);
    const legacyEvidence = evidence.map(legacyEvidenceRecord).filter(Boolean);
    const confidence = safeUnit(evidenceResult?.evidenceConfidence, 0);
    const reason = `Friend backend L3 Tavily không khả dụng (${friendReason}). Tavily local chỉ bổ sung evidence; L4 vẫn gọi và quyết định bởi friend backend.`;
    const fallbackRaw = {
      verdict: "UNKNOWN",
      confidence,
      stop: false,
      canContinueToLayer4: true,
      reason,
      evidence: legacyEvidence,
      sources: legacySources,
    };
    const metadata = {
      applied: true,
      status: "SUCCESS",
      sourceMode: "FRIEND_BACKEND_WITH_LOCAL_TAVILY_FALLBACK",
      provider: "tavily",
      friendPrimaryVerdict: boundedText(friendRaw?.verdict, 80).toUpperCase() || "UNKNOWN",
      friendPrimaryReason: friendReason,
      sourceCount: legacySources.length,
      evidenceCount: legacyEvidence.length,
      diagnostics: safeDiagnostics(tavily),
    };
    const normalized = {
      ...asRecord(evidenceResult),
      status: asRecord(evidenceResult).status || "INSUFFICIENT_EVIDENCE",
      executionStatus: "COMPLETED",
      retrievalStatus: "LOCAL_TAVILY_FALLBACK",
      retrievalMode: "LOCAL_TAVILY_FALLBACK",
      providerStatus: "LOCAL_TAVILY_FALLBACK",
      providerId: "local_tavily_fallback",
      rawVerdict: "UNKNOWN",
      finding: "UNKNOWN",
      assessmentConfidence: confidence,
      providerConfidence: confidence,
      reason,
      sources,
      evidence,
      externalEvidence: evidenceResult?.externalEvidence === true,
      legacyIntegration: {
        status: "COMPLETED",
        providerStatus: "LOCAL_TAVILY_FALLBACK",
        providerId: "local_tavily_fallback",
        rawVerdict: "UNKNOWN",
        legacyAssessmentConfidence: confidence,
        reason,
        stop: false,
        canContinueToLayer4: true,
        sourceOrigin: "LOCAL_TAVILY_FALLBACK",
        sourceCount: legacySources.length,
        evidenceCount: legacyEvidence.length,
        sources,
        evidence,
        rawResponse: fallbackRaw,
      },
    };
    return { applied: true, normalized, raw: fallbackRaw, metadata };
  } catch (error) {
    if (signal?.aborted || error?.name === "AbortError") throw error;
    return {
      applied: false,
      normalized: null,
      raw: null,
      metadata: {
        applied: false,
        status: "FAILED",
        sourceMode: "FRIEND_BACKEND",
        provider: "tavily",
        friendPrimaryVerdict: boundedText(friendRaw?.verdict, 80).toUpperCase() || "UNKNOWN",
        friendPrimaryReason: friendReason,
        errorCode: errorCode(error),
        diagnostics: safeDiagnostics(tavily),
      },
    };
  }
}
