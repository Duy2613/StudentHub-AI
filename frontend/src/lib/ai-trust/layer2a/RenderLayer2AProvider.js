/**
 * Layer 2A — real StudentHub reputation backend adapter.
 *
 * The adapter is server-only. It does not contain canary URLs, does not
 * synthesize provider output, and never maps an exception to NO_KNOWN_THREAT.
 */

import { createHash } from "node:crypto";
import { createSecureId } from "../../security/secureId.js";
import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import { LAYER_2A_CONFIG, getLayer2AConfig } from "./config.js";
import {
  createLayer2AResult,
  LAYER_2A_FINDING,
  LAYER_2A_PROVIDER_STATUS,
} from "./types.js";
import { investigateThreatIntelligence } from "../threat-intel/threatIntelligenceEngine.js";

const ALLOWED_VERDICTS = new Set(["SAFE", "DANGEROUS", "UNKNOWN"]);
const THREAT_TYPE_PATTERN = /\b(MALWARE|SOCIAL_ENGINEERING|UNWANTED_SOFTWARE|PHISHING|MALICIOUS|POTENTIALLY_HARMFUL_APPLICATION|HARMFUL_APPLICATION)\b/gi;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedText(value, maxLength) {
  return typeof value === "string" && value.length <= maxLength ? value.trim() : null;
}

function validConfidence(value) {
  return value === undefined || value === null || (
    typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
  );
}

function extractThreatTypes(...values) {
  const result = new Set();
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) result.add(item.trim().toUpperCase().slice(0, 80));
      }
    }
    if (typeof value === "string") {
      for (const match of value.matchAll(THREAT_TYPE_PATTERN)) result.add(match[1].toUpperCase());
    }
  }
  return [...result].slice(0, 20);
}

function normalizeProviderEntry(entry) {
  if (!isPlainObject(entry)) return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
  const provider = boundedText(entry.provider, 120);
  if (!provider || typeof entry.success !== "boolean") {
    return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
  }

  const verdict = typeof entry.verdict === "string" ? entry.verdict.trim().toUpperCase() : "UNKNOWN";
  if (!ALLOWED_VERDICTS.has(verdict) || !validConfidence(entry.confidence)) {
    return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
  }

  const message = entry.message === undefined || entry.message === null
    ? null
    : boundedText(entry.message, 500);
  if (entry.message !== undefined && entry.message !== null && message === null) {
    return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
  }

  if (entry.threatTypes !== undefined && (
    !Array.isArray(entry.threatTypes) ||
    entry.threatTypes.length > LAYER_2A_CONFIG.MAX_PROVIDER_RESULTS ||
    entry.threatTypes.some((item) => typeof item !== "string" || item.length > 80)
  )) {
    return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
  }

  return {
    ok: true,
    value: {
      provider,
      success: entry.success,
      verdict,
      confidence: typeof entry.confidence === "number" ? Number(entry.confidence.toFixed(4)) : null,
      message,
      threatTypes: extractThreatTypes(entry.threatTypes, message),
    },
  };
}

/**
 * Validates and normalizes the deployed backend response without trusting its
 * prose. A dangerous result is retained even when another field contradicts
 * it, while an optimistic result is never selected in a contradiction.
 */
export function normalizeLayer2AProviderPayload(payload) {
  if (!isPlainObject(payload)) {
    return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
  }

  const topVerdict = typeof payload.verdict === "string" ? payload.verdict.trim().toUpperCase() : null;
  const topReason = payload.reason === undefined || payload.reason === null
    ? null
    : boundedText(payload.reason, 500);
  if (!ALLOWED_VERDICTS.has(topVerdict) || topReason === null && payload.reason !== undefined && payload.reason !== null) {
    return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
  }
  if (!validConfidence(payload.confidence)) {
    return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
  }

  if (!Array.isArray(payload.providers) || payload.providers.length < 1 || payload.providers.length > LAYER_2A_CONFIG.MAX_PROVIDER_RESULTS) {
    // Keep an explicit top-level dangerous response as a hard negative even
    // when the provider omitted the nested diagnostic list.
    if (topVerdict === "DANGEROUS") {
      return {
        ok: true,
        providerStatus: LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE,
        finding: LAYER_2A_FINDING.THREAT_MATCH,
        rawVerdict: topVerdict,
        providerConfidence: typeof payload.confidence === "number" ? payload.confidence : null,
        threatTypes: extractThreatTypes(payload.reason),
        providerResults: [],
        message: topReason,
        contractViolation: "PROVIDER_CONTRACT_VIOLATION",
        cacheTtlMs: 0,
      };
    }
    return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
  }

  const normalizedProviders = [];
  const providerNames = new Set();
  for (const entry of payload.providers) {
    const normalized = normalizeProviderEntry(entry);
    if (!normalized.ok) return normalized;
    const key = normalized.value.provider.toLowerCase();
    if (providerNames.has(key)) return { ok: false, code: "PROVIDER_CONTRACT_VIOLATION" };
    providerNames.add(key);
    normalizedProviders.push(normalized.value);
  }

  const dangerousProviders = normalizedProviders.filter((item) => item.verdict === "DANGEROUS");
  const allSuccessfulSafe = normalizedProviders.every((item) => item.success && item.verdict === "SAFE");
  const hasProviderFailureOrUnknown = normalizedProviders.some((item) => !item.success || item.verdict === "UNKNOWN");
  const hasNestedDangerous = dangerousProviders.length > 0;
  const hasContradiction = (topVerdict === "SAFE" && hasNestedDangerous) ||
    (topVerdict === "DANGEROUS" && !hasNestedDangerous);

  let finding = LAYER_2A_FINDING.UNKNOWN;
  if (topVerdict === "DANGEROUS" || hasNestedDangerous) {
    finding = LAYER_2A_FINDING.THREAT_MATCH;
  } else if (topVerdict === "SAFE" && allSuccessfulSafe) {
    finding = LAYER_2A_FINDING.NO_KNOWN_THREAT;
  }

  const cacheSeconds = payload.cacheTtlSeconds ?? payload.ttlSeconds;
  const cacheTtlMs = typeof cacheSeconds === "number" && Number.isFinite(cacheSeconds) && cacheSeconds > 0
    ? Math.min(LAYER_2A_CONFIG.CACHE_MAX_TTL_MS, Math.floor(cacheSeconds * 1000))
    : 0;

  const threatTypes = extractThreatTypes(
    ...dangerousProviders.flatMap((item) => [item.threatTypes, item.message]),
    payload.threatTypes,
    payload.reason
  );

  return {
    ok: true,
    providerStatus: hasContradiction ? LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE : LAYER_2A_PROVIDER_STATUS.SUCCESS,
    finding,
    rawVerdict: topVerdict,
    providerConfidence: typeof payload.confidence === "number" ? payload.confidence : null,
    threatTypes,
    providerResults: normalizedProviders,
    message: topReason || normalizedProviders.find((item) => item.message)?.message || null,
    contractViolation: hasContradiction ? "PROVIDER_CONTRACT_VIOLATION" : null,
    errorCode: hasContradiction ? "PROVIDER_CONTRACT_VIOLATION" : (hasProviderFailureOrUnknown && finding === LAYER_2A_FINDING.UNKNOWN ? "PROVIDER_INSUFFICIENT_EVIDENCE" : null),
    cacheTtlMs: finding === LAYER_2A_FINDING.NO_KNOWN_THREAT || finding === LAYER_2A_FINDING.THREAT_MATCH ? cacheTtlMs : 0,
  };
}

function fingerprintTarget(value) {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 32);
}

class ProviderHttpError extends Error {
  constructor(status) {
    super("Layer 2A provider HTTP failure");
    this.name = "ProviderHttpError";
    this.status = Number(status) || 0;
  }
}

class ProviderBodyError extends Error {
  constructor(code) {
    super("Layer 2A provider response failure");
    this.name = "ProviderBodyError";
    this.code = code;
  }
}

function createAbortError(reason) {
  const error = reason instanceof Error ? reason : new Error("Layer 2A request cancelled");
  error.name = "AbortError";
  return error;
}

function bindAbortSignal(controller, signal) {
  if (!signal || typeof signal.addEventListener !== "function") return () => {};
  const onAbort = () => controller.abort(signal.reason);
  if (signal.aborted) onAbort();
  else signal.addEventListener("abort", onAbort, { once: true });
  return () => signal.removeEventListener?.("abort", onAbort);
}

async function readBoundedJson(response, maxBytes) {
  const contentLength = Number(response?.headers?.get?.("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new ProviderBodyError("PROVIDER_RESPONSE_TOO_LARGE");
  }

  const bytes = typeof response?.arrayBuffer === "function"
    ? new Uint8Array(await response.arrayBuffer())
    : new TextEncoder().encode(await response.text());
  if (bytes.byteLength > maxBytes) throw new ProviderBodyError("PROVIDER_RESPONSE_TOO_LARGE");

  let parsed;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ProviderBodyError("PROVIDER_INVALID_JSON");
  }
  return parsed;
}

export class RenderLayer2AProvider {
  constructor({
    env = process.env,
    fetchImpl = globalThis.fetch,
    clock = () => Date.now(),
    random = Math.random,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {}) {
    this.env = env;
    this.fetchImpl = fetchImpl;
    this.clock = clock;
    this.random = random;
    this.sleep = sleep;
    this.config = getLayer2AConfig(env);
    this.cache = new Map();
    this.breaker = { consecutiveFailures: 0, openedAt: 0 };
    this.providerId = "studenthub_layer2_backend";
  }

  clearState() {
    this.cache.clear();
    this.breaker = { consecutiveFailures: 0, openedAt: 0 };
  }

  #baseUrl() {
    const raw = this.config.baseUrl;
    const validation = validateRemoteUrlSync(raw);
    if (!validation.ok) return null;
    try {
      const parsed = new URL(validation.url);
      if (parsed.search || parsed.hash) return null;
      return parsed.toString().replace(/\/+$/, "");
    } catch {
      return null;
    }
  }

  #isBreakerOpen() {
    if (!this.breaker.openedAt) return false;
    if (this.clock() - this.breaker.openedAt >= this.config.BREAKER_RESET_MS) {
      this.breaker = { consecutiveFailures: 0, openedAt: 0 };
      return false;
    }
    return true;
  }

  #recordFailure() {
    this.breaker.consecutiveFailures += 1;
    if (this.breaker.consecutiveFailures >= this.config.BREAKER_FAILURE_THRESHOLD) {
      this.breaker.openedAt = this.clock();
    }
  }

  #recordSuccess() {
    this.breaker = { consecutiveFailures: 0, openedAt: 0 };
  }

  #getCached(key, requestId, targetFingerprint) {
    const item = this.cache.get(key);
    if (!item) return null;
    const ageMs = this.clock() - item.storedAt;
    if (ageMs >= item.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return createLayer2AResult({
      ...item.result,
      requestId,
      targetFingerprint,
      latencyMs: 0,
      cacheMetadata: {
        hit: true,
        ttlMs: item.ttlMs,
        ageMs,
        expiresAt: new Date(item.storedAt + item.ttlMs).toISOString(),
      },
    });
  }

  #putCached(key, result, ttlMs) {
    if (!(ttlMs > 0) || ![LAYER_2A_FINDING.THREAT_MATCH, LAYER_2A_FINDING.NO_KNOWN_THREAT].includes(result.finding)) return;
    if (!this.cache.has(key) && this.cache.size >= this.config.CACHE_MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { storedAt: this.clock(), ttlMs, result });
  }

  async #requestOnce(endpoint, targetUrl, requestId, signal) {
    if (typeof this.fetchImpl !== "function") throw new Error("FETCH_UNAVAILABLE");

    const controller = new AbortController();
    const unbindAbort = bindAbortSignal(controller, signal);
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImpl(endpoint, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-request-id": requestId,
        },
        body: JSON.stringify({ type: "url", content: targetUrl }),
      });
      if (!response?.ok) throw new ProviderHttpError(response?.status);
      const contentType = String(response?.headers?.get?.("content-type") || "").toLowerCase();
      if (contentType && !contentType.includes("json")) throw new ProviderBodyError("PROVIDER_UNEXPECTED_CONTENT_TYPE");
      return normalizeLayer2AProviderPayload(await readBoundedJson(response, this.config.MAX_RESPONSE_BYTES));
    } finally {
      clearTimeout(timeoutId);
      unbindAbort();
    }
  }

  #failureStatus(error) {
    if (error?.name === "AbortError") return LAYER_2A_PROVIDER_STATUS.TIMEOUT;
    if (error instanceof ProviderHttpError) {
      if (error.status === 429) return LAYER_2A_PROVIDER_STATUS.RATE_LIMITED;
      if (error.status >= 500) return LAYER_2A_PROVIDER_STATUS.UNAVAILABLE;
      return LAYER_2A_PROVIDER_STATUS.ERROR;
    }
    if (error instanceof ProviderBodyError) return LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE;
    return LAYER_2A_PROVIDER_STATUS.UNAVAILABLE;
  }

  #isRetryable(error) {
    if (error?.name === "AbortError") return true;
    if (error instanceof ProviderBodyError) return false;
    if (error instanceof ProviderHttpError) return [429, 500, 502, 503, 504].includes(error.status);
    return true;
  }

  async #sleepWithSignal(ms, signal) {
    if (!signal) return this.sleep(ms);
    if (signal.aborted) throw createAbortError(signal.reason);

    let onAbort;
    const abortPromise = new Promise((_, reject) => {
      onAbort = () => reject(createAbortError(signal.reason));
      signal.addEventListener?.("abort", onAbort, { once: true });
    });
    try {
      await Promise.race([Promise.resolve().then(() => this.sleep(ms)), abortPromise]);
    } finally {
      signal.removeEventListener?.("abort", onAbort);
    }
  }

  async check({ url, requestId = null, signal } = {}) {
    if (signal?.aborted) throw createAbortError(signal.reason);
    const startedAt = this.clock();
    const normalizedUrl = typeof url === "string" ? url.trim() : "";
    const targetFingerprint = normalizedUrl ? fingerprintTarget(normalizedUrl) : null;
    const baseRequestId = typeof requestId === "string" && requestId.trim()
      ? requestId.trim().slice(0, 160)
      : createSecureId("req_l2a");

    const urlGuard = validateRemoteUrlSync(normalizedUrl);
    if (!urlGuard.ok || normalizedUrl.length > this.config.MAX_URL_LENGTH) {
      return createLayer2AResult({
        provider: this.providerId,
        providerStatus: LAYER_2A_PROVIDER_STATUS.INVALID_INPUT,
        finding: LAYER_2A_FINDING.UNKNOWN,
        requestId: baseRequestId,
        targetFingerprint,
        latencyMs: this.clock() - startedAt,
        errorCode: "INVALID_URL_INPUT",
      });
    }

    const cacheKey = targetFingerprint;
    const cached = this.#getCached(cacheKey, baseRequestId, targetFingerprint);
    if (cached) return cached;

    const baseUrl = this.#baseUrl();
    if (!baseUrl) {
      // Owner Backend Direct Canonical Execution (LEGACY_RENDER_RUNTIME_CALLS = 0)
      const ownerRes = await this.#executeOwnerThreatIntelligence(urlGuard.url, baseRequestId, targetFingerprint, startedAt);
      this.#putCached(cacheKey, ownerRes, LAYER_2A_CONFIG.CACHE_MAX_TTL_MS);
      return ownerRes;
    }

    if (this.#isBreakerOpen()) {
      return createLayer2AResult({
        provider: this.providerId,
        providerStatus: LAYER_2A_PROVIDER_STATUS.CIRCUIT_OPEN,
        finding: LAYER_2A_FINDING.UNKNOWN,
        requestId: baseRequestId,
        targetFingerprint,
        latencyMs: this.clock() - startedAt,
        errorCode: "PROVIDER_CIRCUIT_OPEN",
        message: "Layer 2A provider is temporarily unavailable.",
      });
    }

    const endpoint = `${baseUrl}${LAYER_2A_CONFIG.ENDPOINT_PATH}`;
    let lastError = null;
    for (let attempt = 0; attempt <= this.config.MAX_RETRIES; attempt += 1) {
      if (signal?.aborted) throw createAbortError(signal.reason);
      try {
        const normalized = await this.#requestOnce(endpoint, urlGuard.url, baseRequestId, signal);
        if (!normalized.ok) {
          this.#recordFailure();
          return createLayer2AResult({
            provider: this.providerId,
            providerStatus: normalized.providerStatus || LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE,
            finding: normalized.finding || LAYER_2A_FINDING.UNKNOWN,
            rawVerdict: normalized.rawVerdict,
            providerConfidence: normalized.providerConfidence,
            threatTypes: normalized.threatTypes,
            providerResults: normalized.providerResults,
            message: normalized.message,
            errorCode: normalized.code || normalized.errorCode,
            contractViolation: normalized.contractViolation || normalized.code,
            requestId: baseRequestId,
            targetFingerprint,
            latencyMs: this.clock() - startedAt,
          });
        }

        this.#recordSuccess();
        const result = createLayer2AResult({
          provider: this.providerId,
          providerStatus: normalized.providerStatus,
          finding: normalized.finding,
          rawVerdict: normalized.rawVerdict,
          providerConfidence: normalized.providerConfidence,
          threatTypes: normalized.threatTypes,
          providerResults: normalized.providerResults,
          message: normalized.message,
          errorCode: normalized.errorCode,
          contractViolation: normalized.contractViolation,
          requestId: baseRequestId,
          targetFingerprint,
          latencyMs: this.clock() - startedAt,
          cacheMetadata: { hit: false, ttlMs: normalized.cacheTtlMs || 0 },
        });
        this.#putCached(cacheKey, result, normalized.cacheTtlMs || 0);
        return result;
      } catch (error) {
        if (signal?.aborted) throw createAbortError(signal.reason);
        lastError = error;
        if (attempt < this.config.MAX_RETRIES && this.#isRetryable(error)) {
          const jitter = Math.max(0, Math.min(this.config.RETRY_JITTER_MAX_MS, Math.floor(this.random() * this.config.RETRY_JITTER_MAX_MS)));
          if (jitter) await this.#sleepWithSignal(jitter, signal);
          continue;
        }
        break;
      }
    }

    const providerStatus = this.#failureStatus(lastError);
    this.#recordFailure();
    return createLayer2AResult({
      provider: this.providerId,
      providerStatus,
      finding: LAYER_2A_FINDING.UNKNOWN,
      requestId: baseRequestId,
      targetFingerprint,
      latencyMs: this.clock() - startedAt,
      errorCode: providerStatus === LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE
        ? (lastError?.code || "PROVIDER_INVALID_RESPONSE")
        : "PROVIDER_UNAVAILABLE",
      message: "Layer 2A provider did not produce a valid result.",
    });
  }

  async #executeOwnerThreatIntelligence(targetUrl, baseRequestId, targetFingerprint, startedAt) {
    try {
      const report = await investigateThreatIntelligence({ url: targetUrl });
      const sourceEntries = Object.entries(report?.sources || {});
      const providerResults = sourceEntries.map(([sourceId, source]) => {
        const provider = sourceId === "urlhaus"
          ? "URLhaus (abuse.ch)"
          : sourceId === "ncsc"
            ? "StudentHub NCSC IOC feed"
            : sourceId === "apwg"
              ? "StudentHub APWG taxonomy"
              : sourceId === "ftcSentinel"
                ? "StudentHub FTC Sentinel taxonomy"
                : `StudentHub ${sourceId}`;
        const isUnavailable = ["API_UNAVAILABLE", "RATE_LIMITED", "INVALID_INPUT"].includes(String(source?.status || "").toUpperCase()) || source?.available === false;
        const dangerous = source?.isMalicious === true || source?.isThreatDetected === true || source?.hasHighRiskVector === true || source?.hasSevereFinancialRisk === true;
        return {
          provider,
          success: !isUnavailable,
          verdict: dangerous ? "DANGEROUS" : isUnavailable ? "UNKNOWN" : "SAFE",
          confidence: dangerous && typeof source?.confidence === "number" ? source.confidence : null,
          message: typeof source?.errorNotice === "string"
            ? source.errorNotice
            : dangerous
              ? "Provider reported a matching threat signal."
              : isUnavailable
                ? "Provider did not return a usable result."
                : "No matching threat signal was returned by this provider.",
          threatTypes: [source?.threatType, ...(Array.isArray(source?.tags) ? source.tags : [])].filter((item) => typeof item === "string").slice(0, 8),
          status: source?.status || null,
        };
      });
      const hasProviderFailure = providerResults.some((item) => item.success !== true || item.verdict === "UNKNOWN");
      const dangerousProviders = providerResults.filter((item) => item.verdict === "DANGEROUS");
      if (dangerousProviders.length > 0 || report?.isThreatDetected === true) {
        const threatName = dangerousProviders.flatMap((item) => item.threatTypes || [])[0] || "MALICIOUS_THREAT";
        return createLayer2AResult({
          provider: "StudentHub Threat Intelligence",
          providerStatus: hasProviderFailure ? LAYER_2A_PROVIDER_STATUS.UNAVAILABLE : LAYER_2A_PROVIDER_STATUS.SUCCESS,
          finding: LAYER_2A_FINDING.THREAT_MATCH,
          rawVerdict: "DANGEROUS",
          providerConfidence: typeof report?.confidence === "number" ? report.confidence : null,
          threatTypes: [threatName],
          providerResults,
          message: "StudentHub threat intelligence identified a matching malicious indicator.",
          requestId: baseRequestId,
          targetFingerprint,
          latencyMs: this.clock() - startedAt,
          cacheMetadata: { hit: false, ttlMs: LAYER_2A_CONFIG.CACHE_MAX_TTL_MS },
        });
      }

      // A clean result is only disclosed when every executed provider returned
      // a usable no-match result. A partial provider outage stays UNKNOWN.
      return createLayer2AResult({
        provider: "StudentHub Threat Intelligence",
        providerStatus: hasProviderFailure ? LAYER_2A_PROVIDER_STATUS.UNAVAILABLE : LAYER_2A_PROVIDER_STATUS.SUCCESS,
        finding: hasProviderFailure ? LAYER_2A_FINDING.UNKNOWN : LAYER_2A_FINDING.NO_KNOWN_THREAT,
        rawVerdict: hasProviderFailure ? "UNKNOWN" : "SAFE",
        providerConfidence: null,
        threatTypes: [],
        providerResults,
        message: hasProviderFailure
          ? "One or more StudentHub threat providers did not return a usable result."
          : "No known threat was returned by the executed StudentHub threat providers.",
        requestId: baseRequestId,
        targetFingerprint,
        latencyMs: this.clock() - startedAt,
        cacheMetadata: { hit: false, ttlMs: hasProviderFailure ? 0 : LAYER_2A_CONFIG.CACHE_MAX_TTL_MS },
      });
    } catch (error) {
      return createLayer2AResult({
        provider: "Owner Threat Intelligence",
        providerStatus: LAYER_2A_PROVIDER_STATUS.UNAVAILABLE,
        finding: LAYER_2A_FINDING.UNKNOWN,
        rawVerdict: "UNKNOWN",
        providerConfidence: null,
        threatTypes: [],
        providerResults: [],
        errorCode: "OWNER_THREAT_INTELLIGENCE_UNAVAILABLE",
        message: typeof error?.message === "string" ? error.message.slice(0, 240) : "StudentHub threat intelligence did not return a usable result.",
        requestId: baseRequestId,
        targetFingerprint,
        latencyMs: this.clock() - startedAt,
        cacheMetadata: { hit: false, ttlMs: 0 },
      });
    }
  }
}
