/**
 * Layer 3 — Tavily-only search adapter.
 *
 * Tavily supplies candidate URLs only. Every candidate is still passed through
 * the existing guarded page fetcher before it can become live evidence.
 * Search snippets, query text, response bodies and the API key never enter
 * the public Trust DTO.
 */

import { IEvidenceRetriever } from "./IEvidenceRetriever.js";
import { WebSearchRetriever } from "./WebSearchRetriever.js";
import { markNetworkGuardedRetriever } from "./NetworkGuard.js";
import { SOURCE_TYPE, EVIDENCE_PROVIDER_STATUS } from "../types.js";
import { validateRemoteUrlSync } from "../../../security/hardening/SafeRemoteUrl.js";
import { createHash } from "node:crypto";

const TAVILY_SEARCH_ENDPOINT = "https://api.tavily.com/search";
// Tavily's public API accepts up to 20 results per request. Keep that provider
// maximum per request while preserving the complete deduplicated result set.
const MAX_RESULTS_PER_QUERY = 20;
const MAX_RESPONSE_BYTES = 512 * 1024;
const DEFAULT_SEARCH_BUDGET_MS = 30_000;
const MAX_SEARCH_BUDGET_MS = 120_000;
const MAX_REQUEST_TIMEOUT_MS = 8000;
const MIN_REQUEST_TIMEOUT_MS = 250;
const MAX_TRANSIENT_RETRIES = 1;
const RETRY_BACKOFF_MIN_MS = 100;
const RETRY_BACKOFF_MAX_MS = 250;
const RETRYABLE_HTTP_STATUSES = new Set([502, 503, 504]);
const MAX_REQUEST_TRACES = 12;
const MAX_LIVE_CALL_RECORDS = 100;
const MAX_QUERY_CACHE_ENTRIES = 500;
// Sequential requests let a quota/auth circuit open before a generated query
// batch can spend more credits. Cross-request duplicate queries share cache.
const SEARCH_CONCURRENCY = 1;
const TAVILY_MODES = new Set(["OFF", "SMOKE", "FINAL_LIVE"]);
const SMOKE_CALL_LIMIT = 3;
const FINAL_LIVE_CALL_LIMIT = 100;
const TAVILY_BUDGETS = new Map();
const TAVILY_QUERY_CACHE = new Map();
const TAVILY_CIRCUITS = new Map();
const TAVILY_IN_FLIGHT = new Map();

function defaultEnv() {
  return typeof process !== "undefined" ? process.env : {};
}

function digest(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function modeFor(env) {
  const raw = typeof env?.TAVILY_MODE === "string" ? env.TAVILY_MODE.trim().toUpperCase() : "OFF";
  return TAVILY_MODES.has(raw) ? raw : "OFF";
}

function runIdFor(env) {
  const raw = typeof env?.TAVILY_RUN_ID === "string" ? env.TAVILY_RUN_ID.trim() : "";
  return raw.slice(0, 120) || "process-default";
}

function budgetLimitFor(env, mode = modeFor(env)) {
  if (mode === "OFF") return 0;
  const raw = env?.TAVILY_MAX_CALLS_PER_RUN;
  if (mode === "SMOKE") {
    if (raw === undefined || raw === null || raw === "") return SMOKE_CALL_LIMIT;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed >= 0 ? Math.min(SMOKE_CALL_LIMIT, parsed) : 0;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(FINAL_LIVE_CALL_LIMIT, parsed)
    : 0;
}

function budgetFor(env) {
  const runId = runIdFor(env);
  let ledger = TAVILY_BUDGETS.get(runId);
  if (!ledger) {
    ledger = {
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skippedByCache: 0,
      blockedByBudget: 0,
      quotaErrorSeen: false,
      callRecords: [],
    };
    TAVILY_BUDGETS.set(runId, ledger);
  }
  return { ledger, mode: modeFor(env), limit: budgetLimitFor(env), runId };
}

function budgetSnapshot(env) {
  const { ledger, mode, limit } = budgetFor(env);
  return {
    mode,
    budget: limit,
    callsAttempted: ledger.attempted,
    callsSucceeded: ledger.succeeded,
    callsFailed: ledger.failed,
    callsSkippedByCache: ledger.skippedByCache,
    callsBlockedByBudget: ledger.blockedByBudget,
    quotaErrorSeen: ledger.quotaErrorSeen,
    callRecords: ledger.callRecords.map((record) => ({ ...record })),
  };
}

function credentialFingerprint(apiKey) {
  return digest(apiKey).slice(0, 24);
}

function circuitFor(apiKey) {
  return TAVILY_CIRCUITS.get(credentialFingerprint(apiKey)) || null;
}

function openCircuit(apiKey, status, currentController = null) {
  const fingerprint = credentialFingerprint(apiKey);
  const existing = TAVILY_CIRCUITS.get(fingerprint);
  if (!existing) {
    TAVILY_CIRCUITS.set(fingerprint, {
      state: "OPEN",
      providerStatus: status,
      openedAt: new Date().toISOString(),
    });
  }
  const controllers = TAVILY_IN_FLIGHT.get(fingerprint);
  for (const controller of controllers || []) {
    if (controller !== currentController && !controller.signal.aborted) {
      controller.abort("tavily-provider-circuit-open");
    }
  }
}

function registerInFlight(apiKey, controller) {
  const fingerprint = credentialFingerprint(apiKey);
  const controllers = TAVILY_IN_FLIGHT.get(fingerprint) || new Set();
  controllers.add(controller);
  TAVILY_IN_FLIGHT.set(fingerprint, controllers);
  return () => {
    controllers.delete(controller);
    if (controllers.size === 0) TAVILY_IN_FLIGHT.delete(fingerprint);
  };
}

function queryCacheKey({ apiKey, query, includeDomains, searchDepth, maxResults }) {
  const normalizedQuery = query.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, " ").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  return digest(JSON.stringify({
    credential: credentialFingerprint(apiKey),
    query: normalizedQuery,
    includeDomains: [...includeDomains].sort(),
    searchDepth,
    maxResults,
  }));
}

function recordLiveCall(env, record, outcome) {
  const { ledger } = budgetFor(env);
  if (outcome === "SUCCESS") ledger.succeeded += 1;
  else {
    ledger.failed += 1;
    if (record.status === "QUOTA_EXHAUSTED") ledger.quotaErrorSeen = true;
  }
  ledger.callRecords = [...ledger.callRecords, {
    queryHash: record.queryHash,
    timestamp: record.timestamp,
    httpStatus: safeHttpStatus(record.httpStatus),
    durationMs: Math.max(0, Number(record.durationMs) || 0),
    resultCount: Math.max(0, Number(record.resultCount) || 0),
    status: record.status,
  }].slice(-MAX_LIVE_CALL_RECORDS);
}

function circuitError(circuit) {
  const status = circuit?.providerStatus || EVIDENCE_PROVIDER_STATUS.QUOTA_EXHAUSTED;
  const code = status === EVIDENCE_PROVIDER_STATUS.AUTH_FAILED
    ? "TAVILY_AUTH_CIRCUIT_OPEN"
    : "TAVILY_QUOTA_CIRCUIT_OPEN";
  return createProviderErrorWithMetadata(code, status, null, {
    retryable: false,
    errorCategory: status === EVIDENCE_PROVIDER_STATUS.AUTH_FAILED ? "AUTH_ERROR" : "PROVIDER_QUOTA",
    circuitOpen: true,
  });
}

export function resetTavilyCircuitForConfiguredKey({ env = defaultEnv() } = {}) {
  const apiKey = typeof env?.TAVILY_API_KEY === "string" ? env.TAVILY_API_KEY.trim() : "";
  return apiKey ? TAVILY_CIRCUITS.delete(credentialFingerprint(apiKey)) : false;
}

export function resetTavilyRuntimeForTests() {
  TAVILY_BUDGETS.clear();
  TAVILY_QUERY_CACHE.clear();
  TAVILY_CIRCUITS.clear();
  TAVILY_IN_FLIGHT.clear();
}

function boundedString(value, maxLength = 240) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength) : "";
}

function safeHttpStatus(value) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

function createAbortError(reason) {
  const error = reason instanceof Error ? reason : new Error("Tavily retrieval cancelled");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw createAbortError(signal.reason);
}

function bindAbortSignal(controller, signal) {
  if (!signal || typeof signal.addEventListener !== "function") return () => {};
  const onAbort = () => controller.abort(signal.reason);
  if (signal.aborted) onAbort();
  else signal.addEventListener("abort", onAbort, { once: true });
  return () => signal.removeEventListener?.("abort", onAbort);
}

function providerStatusForHttp(status) {
  if (status === 401 || status === 403) return EVIDENCE_PROVIDER_STATUS.AUTH_FAILED;
  if (status === 408 || status === 504) return EVIDENCE_PROVIDER_STATUS.TIMEOUT;
  if (status === 429) return EVIDENCE_PROVIDER_STATUS.RATE_LIMITED;
  // Tavily returns HTTP 432 when the plan's configured usage limit is reached.
  if (status === 432) return EVIDENCE_PROVIDER_STATUS.QUOTA_EXHAUSTED;
  if (status !== null && status >= 500) return EVIDENCE_PROVIDER_STATUS.UNAVAILABLE;
  return EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE;
}

function createProviderError(code, providerStatus, httpStatus = null) {
  const error = new Error(code);
  error.code = code;
  error.providerStatus = providerStatus;
  error.httpStatus = safeHttpStatus(httpStatus);
  return error;
}

function createProviderErrorWithMetadata(code, providerStatus, httpStatus = null, metadata = {}) {
  const error = createProviderError(code, providerStatus, httpStatus);
  Object.assign(error, metadata);
  return error;
}

function networkFailureClassification(error, signal) {
  if (signal?.aborted) return "VERCEL_NETWORK_TIMEOUT";
  if (error?.name === "AbortError") return "VERCEL_NETWORK_TIMEOUT";
  const code = String(error?.cause?.code || error?.code || "").toUpperCase();
  if (["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL"].includes(code)) return "DNS_FAILURE";
  return "OTHER";
}

function requestTrace({ startedAt, startedClock, endedAt = new Date().toISOString(), httpStatus = null, abortReason = null, classification = "OTHER", outcome = "ERROR", timeoutMs = null, attempt = 1 }) {
  return {
    startedAt,
    endedAt,
    durationMs: Math.max(0, Date.now() - startedClock),
    httpStatus: safeHttpStatus(httpStatus),
    abortReason: typeof abortReason === "string" ? abortReason.slice(0, 80) : null,
    classification,
    outcome,
    timeoutMs: Number.isFinite(Number(timeoutMs)) ? Math.max(0, Number(timeoutMs)) : null,
    attempt: Number.isInteger(attempt) && attempt > 0 ? attempt : 1,
  };
}

function recordRejection(diagnostics, reason) {
  const safeReason = boundedString(reason, 120) || "REJECTED_RESULT";
  diagnostics.rejectedResults += 1;
  if (!diagnostics.rejectionReasons.includes(safeReason) && diagnostics.rejectionReasons.length < 20) {
    diagnostics.rejectionReasons.push(safeReason);
  }
}

function isRetryableProviderError(error) {
  return error?.retryable === true;
}

function providerErrorCategory(error) {
  if (error?.providerStatus === EVIDENCE_PROVIDER_STATUS.BUDGET_EXHAUSTED) return "CALL_BUDGET";
  if (error?.providerStatus === EVIDENCE_PROVIDER_STATUS.QUOTA_EXHAUSTED) return "PROVIDER_QUOTA";
  if (error?.providerStatus === EVIDENCE_PROVIDER_STATUS.AUTH_FAILED) return "AUTH_ERROR";
  if (error?.providerStatus === EVIDENCE_PROVIDER_STATUS.RATE_LIMITED) return "RATE_LIMIT";
  if (error?.providerStatus === EVIDENCE_PROVIDER_STATUS.TIMEOUT) return "TIMEOUT";
  if (error?.providerStatus === EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE) return "MALFORMED_RESPONSE";
  return error?.providerStatus ? "PROVIDER_ERROR" : "UNKNOWN";
}

function appendProviderAttempt(diagnostics, attempt) {
  diagnostics.providerAttempts = [...diagnostics.providerAttempts, attempt].slice(-MAX_REQUEST_TRACES);
  diagnostics.providerAttempt = { ...attempt };
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function boundedParentTimeout(value) {
  const requested = Number(value);
  if (!Number.isFinite(requested) || requested <= 0) return DEFAULT_SEARCH_BUDGET_MS;
  return Math.min(MAX_SEARCH_BUDGET_MS, Math.max(500, requested));
}

function boundedRetryDelay(randomImpl) {
  let random = 0;
  try {
    random = Number(randomImpl?.());
  } catch {
    random = 0;
  }
  const jitter = Number.isFinite(random) ? Math.max(0, Math.min(1, random)) : 0;
  return Math.min(RETRY_BACKOFF_MAX_MS, RETRY_BACKOFF_MIN_MS + Math.floor(jitter * (RETRY_BACKOFF_MAX_MS - RETRY_BACKOFF_MIN_MS)));
}

async function readJsonBounded(response) {
  const contentLength = Number(response?.headers?.get?.("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw createProviderError("TAVILY_RESPONSE_TOO_LARGE", EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE);
  }
  if (typeof response?.arrayBuffer === "function") {
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_RESPONSE_BYTES) {
      throw createProviderError("TAVILY_RESPONSE_TOO_LARGE", EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE);
    }
    try {
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw createProviderError("TAVILY_INVALID_JSON", EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE);
    }
  }
  if (typeof response?.json === "function") {
    try {
      const value = await response.json();
      if (JSON.stringify(value).length > MAX_RESPONSE_BYTES) {
        throw createProviderError("TAVILY_RESPONSE_TOO_LARGE", EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE);
      }
      return value;
    } catch (error) {
      if (error?.providerStatus) throw error;
      throw createProviderError("TAVILY_INVALID_JSON", EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE);
    }
  }
  throw createProviderError("TAVILY_RESPONSE_BODY_UNAVAILABLE", EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE);
}

function sourceFromResult(result, queryIndex, resultIndex) {
  const guard = validateRemoteUrlSync(result?.url);
  if (!guard.ok) return { rejected: guard.code };
  const canonicalUrl = canonicalSearchUrl(guard.url);
  let parsed;
  try {
    parsed = new URL(canonicalUrl);
  } catch {
    return { rejected: "INVALID_REMOTE_URL" };
  }
  const sourceId = `tavily-${queryIndex + 1}-${resultIndex + 1}`;
  return {
    source: {
      sourceId,
      url: canonicalUrl,
      domain: parsed.hostname.toLowerCase(),
      title: boundedString(result?.title, 240) || guard.url,
      publisher: boundedString(result?.publisher || parsed.hostname, 180),
      publishedAt: typeof result?.published_date === "string" ? result.published_date.slice(0, 80) : null,
      sourceType: SOURCE_TYPE.SEARCH_RETRIEVAL,
      providerStatus: EVIDENCE_PROVIDER_STATUS.SUCCESS,
      liveEvidence: false,
      retrievalOutcome: "CANDIDATE",
      sourceFingerprint: `tavily:${sourceId}`,
      providerScore: Number.isFinite(Number(result?.score)) && Number(result.score) >= 0 && Number(result.score) <= 1
        ? Number(result.score)
        : null,
      retrievalQueryIndex: queryIndex,
      retrievalResultIndex: resultIndex,
    },
  };
}

function canonicalSearchUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_[a-z0-9_]+|gclid|fbclid|mc_cid|mc_eid|ref_src)$/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.toString();
  } catch {
    return String(value || "").toLowerCase();
  }
}

function safeIncludeDomains(value) {
  if (!Array.isArray(value)) return [];
  const domains = value.map((item) => typeof item === "string" ? item.trim().toLowerCase().replace(/\.$/, "") : "")
    .filter((domain) => domain.length <= 253 && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(domain) && domain.includes("."));
  return [...new Set(domains)].slice(0, 5);
}

function safeSearchDepth(value) {
  const depth = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["ultra-fast", "fast", "basic", "advanced"].includes(depth) ? depth : "basic";
}

export class TavilyRetriever extends IEvidenceRetriever {
  constructor({ env = defaultEnv(), fetchImpl = globalThis.fetch, sourceFetcher = null, sleepImpl = defaultSleep, randomImpl = Math.random } = {}) {
    super("tavily_evidence_retriever");
    markNetworkGuardedRetriever(this);
    this.env = env || {};
    this.fetchImpl = fetchImpl;
    this.sourceFetcher = sourceFetcher || new WebSearchRetriever({ fetchImpl });
    this.sleepImpl = typeof sleepImpl === "function" ? sleepImpl : defaultSleep;
    this.randomImpl = typeof randomImpl === "function" ? randomImpl : Math.random;
    this.lastSearchStatus = EVIDENCE_PROVIDER_STATUS.NOT_CONFIGURED;
    this.lastSearchDiagnostics = {
      provider: "tavily",
      mode: "OFF",
      envPresent: false,
      adapterConfigured: false,
      timeoutConfiguredMs: MAX_REQUEST_TIMEOUT_MS,
      parentTimeoutMs: DEFAULT_SEARCH_BUDGET_MS,
      callCount: 0,
      queriesRequested: 0,
      queriesBounded: 0,
      queriesExecuted: 0,
      retryCount: 0,
      retryBackoffMs: 0,
      providerRetryable: null,
      providerRetryExhausted: false,
      acceptedResults: 0,
      acceptedHostCount: 0,
      rejectedResults: 0,
      rawResultCount: 0,
      rejectionReasons: [],
      httpStatuses: [],
      requestTrace: [],
      lastHttpStatus: null,
      lastAbortReason: null,
      lastTimeoutClassification: null,
      lastErrorCode: null,
      providerAttempt: null,
      providerAttempts: [],
      durationMs: 0,
    };
  }

  get apiKey() {
    return typeof this.env?.TAVILY_API_KEY === "string" ? this.env.TAVILY_API_KEY.trim() : "";
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  get mode() {
    return modeFor(this.env);
  }

  isEnabledByMode() {
    return this.isConfigured() && this.mode !== "OFF" && budgetLimitFor(this.env, this.mode) > 0;
  }

  getRuntimeDiagnostics() {
    const budget = budgetSnapshot(this.env);
    const circuit = circuitFor(this.apiKey);
    return {
      ...this.lastSearchDiagnostics,
      envPresent: this.isConfigured(),
      adapterConfigured: true,
      mode: budget.mode,
      budget,
      circuit: circuit ? { state: circuit.state, providerStatus: circuit.providerStatus, openedAt: circuit.openedAt } : { state: "CLOSED" },
      rejectionReasons: [...this.lastSearchDiagnostics.rejectionReasons],
      httpStatuses: [...this.lastSearchDiagnostics.httpStatuses],
      requestTrace: this.lastSearchDiagnostics.requestTrace.map((trace) => ({ ...trace })),
      providerAttempts: this.lastSearchDiagnostics.providerAttempts.map((attempt) => ({ ...attempt })),
    };
  }

  async #searchOne(query, { signal, timeoutMs, attempt = 1, maxResults = MAX_RESULTS_PER_QUERY, includeDomains = [], searchDepth = "basic" }) {
    throwIfAborted(signal);
    if (typeof this.fetchImpl !== "function") {
      throw createProviderErrorWithMetadata("TAVILY_FETCH_UNAVAILABLE", EVIDENCE_PROVIDER_STATUS.UNAVAILABLE, null, {
        timeoutClassification: "OTHER",
        retryable: false,
      });
    }

    const controller = new AbortController();
    const unbindAbort = bindAbortSignal(controller, signal);
    const unbindInFlight = registerInFlight(this.apiKey, controller);
    const startedClock = Date.now();
    const startedAt = new Date(startedClock).toISOString();
    const requestTimeoutMs = Math.max(MIN_REQUEST_TIMEOUT_MS, Math.min(MAX_REQUEST_TIMEOUT_MS, Number(timeoutMs) || DEFAULT_SEARCH_BUDGET_MS));
    let timedOut = false;
    let localAbortReason = null;
    let responseStatus = null;
    let timeoutId;
    const trace = (overrides = {}) => requestTrace({
      startedAt,
      startedClock,
      httpStatus: responseStatus,
      timeoutMs: requestTimeoutMs,
      attempt,
      ...overrides,
    });
    try {
      const request = Promise.resolve().then(() => this.fetchImpl(TAVILY_SEARCH_ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: safeSearchDepth(searchDepth),
          max_results: maxResults,
          ...(includeDomains.length > 0 ? { include_domains: includeDomains, include_domains_mode: "restrict" } : {}),
          include_answer: false,
          include_raw_content: false,
        }),
      }));
      const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          localAbortReason = "local-adapter-timeout";
          controller.abort(localAbortReason);
          reject(createProviderErrorWithMetadata("TAVILY_LOCAL_TIMEOUT", EVIDENCE_PROVIDER_STATUS.TIMEOUT, null, {
            timeoutClassification: "LOCAL_ADAPTER_TIMEOUT",
            abortReason: localAbortReason,
            retryable: false,
            requestTrace: trace({
              abortReason: localAbortReason,
              classification: "LOCAL_ADAPTER_TIMEOUT",
              outcome: "LOCAL_ABORT",
            }),
          }));
        }, requestTimeoutMs);
      });
      let response;
      try {
        response = await Promise.race([request, timeout]);
      } catch (error) {
        if (signal?.aborted) {
          throw createProviderErrorWithMetadata("TAVILY_PARENT_ABORT", EVIDENCE_PROVIDER_STATUS.TIMEOUT, null, {
            timeoutClassification: "VERCEL_NETWORK_TIMEOUT",
            abortReason: "parent-aborted",
            retryable: false,
          });
        }
        if (timedOut) throw error;
        const classification = networkFailureClassification(error, signal);
        throw createProviderErrorWithMetadata(
          classification === "DNS_FAILURE" ? "TAVILY_DNS_FAILURE" : "TAVILY_NETWORK_ERROR",
          EVIDENCE_PROVIDER_STATUS.UNAVAILABLE,
          null,
          {
            timeoutClassification: classification,
            abortReason: classification === "VERCEL_NETWORK_TIMEOUT" ? "upstream-aborted" : null,
            retryable: classification === "OTHER" && error?.name !== "AbortError",
          },
        );
      }
      if (controller.signal.aborted && controller.signal.reason === "tavily-provider-circuit-open") {
        throw circuitError(circuitFor(this.apiKey));
      }
      responseStatus = safeHttpStatus(response?.status);
      if (!response?.ok) {
        const classification = responseStatus === 504 ? "UPSTREAM_TAVILY_504" : "OTHER";
        const providerStatus = providerStatusForHttp(responseStatus);
        if ([EVIDENCE_PROVIDER_STATUS.QUOTA_EXHAUSTED, EVIDENCE_PROVIDER_STATUS.AUTH_FAILED].includes(providerStatus)) {
          openCircuit(this.apiKey, providerStatus, controller);
        }
        throw createProviderErrorWithMetadata(`TAVILY_HTTP_${responseStatus || "ERROR"}`, providerStatus, responseStatus, {
          timeoutClassification: classification,
          errorCategory: providerStatus === EVIDENCE_PROVIDER_STATUS.QUOTA_EXHAUSTED
            ? "PROVIDER_QUOTA"
            : providerStatus === EVIDENCE_PROVIDER_STATUS.AUTH_FAILED ? "AUTH_ERROR" : "HTTP_ERROR",
          retryable: providerStatus === EVIDENCE_PROVIDER_STATUS.QUOTA_EXHAUSTED || providerStatus === EVIDENCE_PROVIDER_STATUS.AUTH_FAILED
            ? false
            : RETRYABLE_HTTP_STATUSES.has(responseStatus),
        });
      }
      const payload = await readJsonBounded(response);
      if (!payload || !Array.isArray(payload.results)) {
        throw createProviderErrorWithMetadata("TAVILY_SCHEMA_INVALID", EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE, responseStatus, {
          timeoutClassification: "OTHER",
          retryable: false,
        });
      }
      return {
        results: payload.results,
        httpStatus: responseStatus || 200,
        requestTrace: trace({
          httpStatus: responseStatus || 200,
          classification: "NONE",
          outcome: "SUCCESS",
        }),
      };
    } catch (error) {
      if (controller.signal.aborted && controller.signal.reason === "tavily-provider-circuit-open") {
        throw circuitError(circuitFor(this.apiKey));
      }
      if (signal?.aborted) {
        throw createProviderErrorWithMetadata("TAVILY_PARENT_ABORT", EVIDENCE_PROVIDER_STATUS.TIMEOUT, null, {
          timeoutClassification: "VERCEL_NETWORK_TIMEOUT",
          abortReason: "parent-aborted",
          retryable: false,
          requestTrace: trace({
            abortReason: "parent-aborted",
            classification: "VERCEL_NETWORK_TIMEOUT",
            outcome: "PARENT_ABORT",
          }),
        });
      }
      if (timedOut) {
        const localError = error?.code === "TAVILY_LOCAL_TIMEOUT"
          ? error
          : createProviderErrorWithMetadata("TAVILY_LOCAL_TIMEOUT", EVIDENCE_PROVIDER_STATUS.TIMEOUT, null, {
            timeoutClassification: "LOCAL_ADAPTER_TIMEOUT",
            abortReason: localAbortReason || "local-adapter-timeout",
            retryable: false,
          });
        localError.httpStatus = null;
        localError.requestTrace ||= trace({
          abortReason: localAbortReason || "local-adapter-timeout",
          classification: "LOCAL_ADAPTER_TIMEOUT",
          outcome: "LOCAL_ABORT",
        });
        throw localError;
      }
      const providerError = error?.providerStatus
        ? error
        : createProviderErrorWithMetadata("TAVILY_NETWORK_ERROR", EVIDENCE_PROVIDER_STATUS.UNAVAILABLE, null, {
          timeoutClassification: networkFailureClassification(error, signal),
          retryable: false,
        });
      providerError.timeoutClassification ||= networkFailureClassification(error, signal);
      providerError.requestTrace ||= trace({
        classification: providerError.timeoutClassification,
        outcome: "ERROR",
      });
      throw providerError;
    } finally {
      clearTimeout(timeoutId);
      unbindAbort();
      unbindInFlight();
    }
  }

  async search(queries, options = {}) {
    const startedAt = Date.now();
    const parentTimeoutMs = boundedParentTimeout(options.timeoutMs);
    const requestedQueries = Array.isArray(queries) ? queries.length : 0;
    const boundedQueries = (Array.isArray(queries) ? queries : [])
      .map((item) => {
        const record = typeof item === "string" ? { query: item } : item && typeof item === "object" && !Array.isArray(item) ? item : {};
        const query = typeof record.query === "string"
          ? record.query.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 380)
          : "";
        return query ? {
          query,
          includeDomains: safeIncludeDomains(record.includeDomains),
          searchDepth: safeSearchDepth(record.searchDepth),
        } : null;
      })
      .filter(Boolean);
    const requestedMaxResults = Number(options.maxResults);
    const maxResults = Number.isFinite(requestedMaxResults)
      ? Math.max(1, Math.min(MAX_RESULTS_PER_QUERY, Math.floor(requestedMaxResults)))
      : MAX_RESULTS_PER_QUERY;
    const diagnostics = {
      provider: "tavily",
      mode: this.mode,
      envPresent: this.isConfigured(),
      adapterConfigured: true,
      timeoutConfiguredMs: MAX_REQUEST_TIMEOUT_MS,
      parentTimeoutMs,
      callCount: 0,
      queriesRequested: requestedQueries,
      queriesBounded: boundedQueries.length,
      queriesExecuted: 0,
      retryCount: 0,
      retryBackoffMs: 0,
      providerRetryable: null,
      providerRetryExhausted: false,
      acceptedResults: 0,
      acceptedHostCount: 0,
      rejectedResults: 0,
      rawResultCount: 0,
      rejectionReasons: [],
      httpStatuses: [],
      requestTrace: [],
      lastHttpStatus: null,
      lastAbortReason: null,
      lastTimeoutClassification: null,
      lastErrorCode: null,
      providerAttempt: null,
      providerAttempts: [],
      queriesSkippedByCache: 0,
      callsBlockedByBudget: 0,
      quotaErrorSeen: false,
      durationMs: 0,
    };
    this.lastSearchDiagnostics = diagnostics;

    if (!this.isConfigured()) {
      this.lastSearchStatus = EVIDENCE_PROVIDER_STATUS.NOT_CONFIGURED;
      diagnostics.lastErrorCode = "TAVILY_NOT_CONFIGURED";
      diagnostics.durationMs = Date.now() - startedAt;
      diagnostics.budget = budgetSnapshot(this.env);
      throw createProviderError("TAVILY_NOT_CONFIGURED", EVIDENCE_PROVIDER_STATUS.NOT_CONFIGURED);
    }

    if (!TAVILY_MODES.has(String(this.env?.TAVILY_MODE || "OFF").trim().toUpperCase())) {
      this.lastSearchStatus = EVIDENCE_PROVIDER_STATUS.DISABLED;
      diagnostics.lastErrorCode = "TAVILY_MODE_INVALID";
      diagnostics.durationMs = Date.now() - startedAt;
      diagnostics.budget = budgetSnapshot(this.env);
      throw createProviderErrorWithMetadata("TAVILY_MODE_INVALID", EVIDENCE_PROVIDER_STATUS.DISABLED, null, { retryable: false });
    }
    if (this.mode === "OFF") {
      this.lastSearchStatus = EVIDENCE_PROVIDER_STATUS.DISABLED;
      diagnostics.lastErrorCode = "TAVILY_DISABLED_BY_MODE";
      diagnostics.durationMs = Date.now() - startedAt;
      diagnostics.budget = budgetSnapshot(this.env);
      throw createProviderErrorWithMetadata("TAVILY_DISABLED_BY_MODE", EVIDENCE_PROVIDER_STATUS.DISABLED, null, { retryable: false });
    }
    const budgetState = budgetFor(this.env);
    if (budgetState.limit <= 0) {
      this.lastSearchStatus = EVIDENCE_PROVIDER_STATUS.BUDGET_EXHAUSTED;
      diagnostics.lastErrorCode = this.mode === "FINAL_LIVE" ? "TAVILY_FINAL_LIVE_BUDGET_REQUIRED" : "TAVILY_CALL_BUDGET_ZERO";
      diagnostics.durationMs = Date.now() - startedAt;
      diagnostics.budget = budgetSnapshot(this.env);
      throw createProviderErrorWithMetadata(diagnostics.lastErrorCode, EVIDENCE_PROVIDER_STATUS.BUDGET_EXHAUSTED, null, {
        retryable: false,
        errorCategory: "CALL_BUDGET",
      });
    }
    const openCircuit = circuitFor(this.apiKey);
    if (openCircuit) {
      this.lastSearchStatus = openCircuit.providerStatus;
      const error = circuitError(openCircuit);
      diagnostics.lastErrorCode = error.code;
      diagnostics.providerRetryable = false;
      diagnostics.durationMs = Date.now() - startedAt;
      appendProviderAttempt(diagnostics, {
        provider: "TAVILY",
        status: openCircuit.providerStatus,
        httpStatus: null,
        resultCount: 0,
        durationMs: 0,
        errorCategory: error.errorCategory,
        retryable: false,
      });
      throw error;
    }

    const deadline = Date.now() + parentTimeoutMs;
    const sources = [];
    const seenUrls = new Map();
    let searchBudgetExhausted = false;
    const recordTrace = (trace) => {
      if (!trace || typeof trace !== "object") return;
      diagnostics.requestTrace = [...diagnostics.requestTrace, { ...trace }].slice(-MAX_REQUEST_TRACES);
      if (trace.httpStatus !== null && trace.httpStatus !== undefined) diagnostics.httpStatuses.push(trace.httpStatus);
      diagnostics.lastHttpStatus = trace.httpStatus ?? null;
      diagnostics.lastAbortReason = trace.abortReason || null;
      diagnostics.lastTimeoutClassification = trace.classification && trace.classification !== "NONE" ? trace.classification : null;
    };
    try {
      const runQuery = async ([queryIndex, querySpec]) => {
        throwIfAborted(options.signal);
        diagnostics.queriesExecuted += 1;
        let response = null;
        try {
          for (let attempt = 1; attempt <= MAX_TRANSIENT_RETRIES + 1; attempt += 1) {
            const remainingMs = deadline - Date.now();
            if (remainingMs < MIN_REQUEST_TIMEOUT_MS) {
              const error = createProviderErrorWithMetadata("TAVILY_LOCAL_TIMEOUT", EVIDENCE_PROVIDER_STATUS.TIMEOUT, null, {
                timeoutClassification: "LOCAL_ADAPTER_TIMEOUT",
                abortReason: "search-budget-exhausted",
                retryable: false,
                requestTrace: requestTrace({
                  startedAt: new Date().toISOString(),
                  startedClock: Date.now(),
                  abortReason: "search-budget-exhausted",
                  classification: "LOCAL_ADAPTER_TIMEOUT",
                  outcome: "NOT_ATTEMPTED",
                  timeoutMs: remainingMs,
                  attempt,
                }),
              });
              recordTrace(error.requestTrace);
              return { queryIndex, budgetExhausted: true, error };
            }
            try {
              const cacheKey = queryCacheKey({
                apiKey: this.apiKey,
                query: querySpec.query,
                includeDomains: querySpec.includeDomains,
                searchDepth: querySpec.searchDepth,
                maxResults,
              });
              const cachedEntry = TAVILY_QUERY_CACHE.get(cacheKey);
              if (cachedEntry) {
                budgetState.ledger.skippedByCache += 1;
                diagnostics.queriesSkippedByCache += 1;
                const cachedResponse = cachedEntry.promise ? await cachedEntry.promise : cachedEntry.value;
                response = {
                  ...cachedResponse,
                  cacheHit: true,
                  requestTrace: requestTrace({
                    startedAt: new Date().toISOString(),
                    startedClock: Date.now(),
                    classification: "NONE",
                    outcome: "CACHE_HIT",
                    timeoutMs: 0,
                    attempt,
                  }),
                };
                recordTrace(response.requestTrace);
                break;
              }

              const currentCircuit = circuitFor(this.apiKey);
              if (currentCircuit) throw circuitError(currentCircuit);
              if (budgetState.ledger.attempted >= budgetState.limit) {
                budgetState.ledger.blockedByBudget += 1;
                diagnostics.callsBlockedByBudget += 1;
                throw createProviderErrorWithMetadata("TAVILY_CALL_BUDGET_EXHAUSTED", EVIDENCE_PROVIDER_STATUS.BUDGET_EXHAUSTED, null, {
                  retryable: false,
                  errorCategory: "CALL_BUDGET",
                });
              }

              budgetState.ledger.attempted += 1;
              diagnostics.callCount += 1;
              const callStartedAt = new Date().toISOString();
              const callStartedClock = Date.now();
              const queryHash = digest(querySpec.query.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US"));
              const pending = this.#searchOne(querySpec.query, {
                signal: options.signal,
                timeoutMs: remainingMs,
                attempt,
                maxResults,
                includeDomains: querySpec.includeDomains,
                searchDepth: querySpec.searchDepth,
              });
              const entry = { promise: pending, value: null };
              TAVILY_QUERY_CACHE.set(cacheKey, entry);
              while (TAVILY_QUERY_CACHE.size > MAX_QUERY_CACHE_ENTRIES) {
                const oldest = TAVILY_QUERY_CACHE.keys().next().value;
                if (oldest === undefined) break;
                TAVILY_QUERY_CACHE.delete(oldest);
              }
              try {
                response = await pending;
                entry.value = { results: response.results, httpStatus: response.httpStatus };
                entry.promise = null;
                recordLiveCall(this.env, {
                  queryHash,
                  timestamp: callStartedAt,
                  httpStatus: response.httpStatus,
                  durationMs: Date.now() - callStartedClock,
                  resultCount: response.results.length,
                  status: "SUCCESS",
                }, "SUCCESS");
                appendProviderAttempt(diagnostics, {
                  provider: "TAVILY",
                  status: "SUCCESS",
                  httpStatus: response.httpStatus,
                  resultCount: response.results.length,
                  durationMs: Date.now() - callStartedClock,
                  errorCategory: null,
                  retryable: false,
                });
              } catch (error) {
                if (TAVILY_QUERY_CACHE.get(cacheKey) === entry) TAVILY_QUERY_CACHE.delete(cacheKey);
                recordLiveCall(this.env, {
                  queryHash,
                  timestamp: callStartedAt,
                  httpStatus: error?.httpStatus,
                  durationMs: Date.now() - callStartedClock,
                  resultCount: 0,
                  status: error?.providerStatus || "FAILED",
                }, "FAILED");
                appendProviderAttempt(diagnostics, {
                  provider: "TAVILY",
                  status: error?.providerStatus || "FAILED",
                  httpStatus: safeHttpStatus(error?.httpStatus),
                  resultCount: 0,
                  durationMs: Date.now() - callStartedClock,
                  errorCategory: providerErrorCategory(error),
                  retryable: error?.retryable === true,
                });
                throw error;
              }
              recordTrace(response.requestTrace);
              break;
            } catch (error) {
              recordTrace(error?.requestTrace);
              diagnostics.lastErrorCode = boundedString(error?.code || error?.message, 120) || "TAVILY_SEARCH_FAILURE";
              diagnostics.lastTimeoutClassification = error?.timeoutClassification || null;
              diagnostics.lastAbortReason = error?.abortReason || null;
              diagnostics.providerRetryable = isRetryableProviderError(error);
              if (!isRetryableProviderError(error) || attempt > MAX_TRANSIENT_RETRIES) {
                diagnostics.providerRetryExhausted = isRetryableProviderError(error);
                throw error;
              }
              const retryRemainingMs = deadline - Date.now();
              const retryDelayMs = boundedRetryDelay(this.randomImpl);
              if (retryRemainingMs < MIN_REQUEST_TIMEOUT_MS + retryDelayMs) {
                diagnostics.providerRetryExhausted = true;
                throw error;
              }
              diagnostics.retryCount += 1;
              diagnostics.retryBackoffMs += retryDelayMs;
              await this.sleepImpl(retryDelayMs);
              throwIfAborted(options.signal);
            }
          }
          if (!response) throw createProviderError("TAVILY_NO_RESPONSE", EVIDENCE_PROVIDER_STATUS.UNAVAILABLE);
          return { queryIndex, response };
        } catch (error) {
          if (options.signal?.aborted || error?.name === "AbortError") throw error;
          return { queryIndex, error };
        }
      };

      const queryEntries = Array.from(boundedQueries.entries());
      const queryResults = [];
      for (let offset = 0; offset < queryEntries.length; offset += SEARCH_CONCURRENCY) {
        throwIfAborted(options.signal);
        const batch = queryEntries.slice(offset, offset + SEARCH_CONCURRENCY);
        queryResults.push(...await Promise.all(batch.map(runQuery)));
      }

      queryResults.sort((left, right) => left.queryIndex - right.queryIndex);
      let firstQueryError = null;
      let successfulResponseCount = 0;
      let hadQueryFailure = false;
      for (const queryResult of queryResults) {
        if (queryResult.budgetExhausted) {
          searchBudgetExhausted = true;
          hadQueryFailure = true;
          firstQueryError ||= queryResult.error;
          continue;
        }
        if (queryResult.error) {
          hadQueryFailure = true;
          firstQueryError ||= queryResult.error;
          continue;
        }
        const response = queryResult.response;
        if (!response) continue;
        successfulResponseCount += 1;
        diagnostics.rawResultCount += response.results.length;
        for (const [resultIndex, result] of response.results.entries()) {
          const candidate = sourceFromResult(result, queryResult.queryIndex, resultIndex);
          if (candidate.rejected) {
            recordRejection(diagnostics, candidate.rejected);
            continue;
          }
          const canonicalUrl = canonicalSearchUrl(candidate.source.url);
          if (seenUrls.has(canonicalUrl)) {
            recordRejection(diagnostics, "DUPLICATE_URL");
            const priorIndex = seenUrls.get(canonicalUrl);
            const prior = sources[priorIndex];
            if (Number.isFinite(candidate.source.providerScore) && (!Number.isFinite(prior?.providerScore) || candidate.source.providerScore > prior.providerScore)) {
              sources[priorIndex] = candidate.source;
            }
            continue;
          }
          seenUrls.set(canonicalUrl, sources.length);
          sources.push(candidate.source);
          diagnostics.acceptedResults += 1;
        }
        diagnostics.acceptedHostCount = new Set(sources.map((source) => source.domain).filter(Boolean)).size;
      }
      if (successfulResponseCount === 0 && firstQueryError) throw firstQueryError;
      const quotaErrorSeen = queryResults.some((item) => item.error?.providerStatus === EVIDENCE_PROVIDER_STATUS.QUOTA_EXHAUSTED);
      const authErrorSeen = queryResults.some((item) => item.error?.providerStatus === EVIDENCE_PROVIDER_STATUS.AUTH_FAILED);
      diagnostics.quotaErrorSeen = quotaErrorSeen || budgetState.ledger.quotaErrorSeen;
      this.lastSearchStatus = quotaErrorSeen
        ? EVIDENCE_PROVIDER_STATUS.QUOTA_EXHAUSTED
        : authErrorSeen
          ? EVIDENCE_PROVIDER_STATUS.AUTH_FAILED
          : searchBudgetExhausted
        ? EVIDENCE_PROVIDER_STATUS.TIMEOUT
        : hadQueryFailure ? EVIDENCE_PROVIDER_STATUS.PARTIAL : EVIDENCE_PROVIDER_STATUS.SUCCESS;
      diagnostics.providerRetryable = null;
      diagnostics.providerRetryExhausted = hadQueryFailure ? diagnostics.providerRetryExhausted : false;
      diagnostics.lastErrorCode = quotaErrorSeen
        ? "TAVILY_HTTP_432"
        : authErrorSeen
          ? "TAVILY_AUTH_CIRCUIT_OPEN"
          : searchBudgetExhausted
        ? "TAVILY_SEARCH_BUDGET_EXHAUSTED"
        : hadQueryFailure ? boundedString(firstQueryError?.code || firstQueryError?.message, 120) || "TAVILY_PARTIAL_SEARCH" : null;
      diagnostics.lastTimeoutClassification = searchBudgetExhausted ? "LOCAL_ADAPTER_TIMEOUT" : diagnostics.lastTimeoutClassification;
      diagnostics.lastAbortReason = searchBudgetExhausted ? "search-budget-exhausted" : diagnostics.lastAbortReason;
      diagnostics.durationMs = Date.now() - startedAt;
      diagnostics.providerAttempt = diagnostics.callCount > 0 ? {
        provider: "TAVILY",
        status: this.lastSearchStatus,
        httpStatus: diagnostics.lastHttpStatus,
        resultCount: diagnostics.rawResultCount,
        durationMs: diagnostics.durationMs,
        errorCategory: quotaErrorSeen
          ? "PROVIDER_QUOTA"
          : authErrorSeen
            ? "AUTH_ERROR"
            : diagnostics.callsBlockedByBudget > 0 ? "CALL_BUDGET" : hadQueryFailure ? "PROVIDER_ERROR" : null,
        retryable: false,
      } : null;
      diagnostics.responseSource = diagnostics.callCount > 0
        ? "LIVE_PROVIDER_RESPONSE"
        : diagnostics.queriesSkippedByCache > 0 ? "RUN_CACHE" : "NONE";
      diagnostics.budget = budgetSnapshot(this.env);
      if (successfulResponseCount === 0 && !firstQueryError && boundedQueries.length > 0) {
        throw createProviderErrorWithMetadata("TAVILY_CALL_BUDGET_EXHAUSTED", EVIDENCE_PROVIDER_STATUS.BUDGET_EXHAUSTED, null, {
          retryable: false,
          errorCategory: "CALL_BUDGET",
        });
      }
      return sources.sort((left, right) => {
        const leftScore = Number.isFinite(left.providerScore) ? left.providerScore : -1;
        const rightScore = Number.isFinite(right.providerScore) ? right.providerScore : -1;
        if (leftScore !== rightScore) return rightScore - leftScore;
        return left.retrievalQueryIndex - right.retrievalQueryIndex || left.retrievalResultIndex - right.retrievalResultIndex;
      });
    } catch (error) {
      if (options.signal?.aborted || error?.name === "AbortError") throw error;
      this.lastSearchStatus = error?.providerStatus || EVIDENCE_PROVIDER_STATUS.UNAVAILABLE;
      diagnostics.lastErrorCode = boundedString(error?.code || error?.message, 120) || "TAVILY_SEARCH_FAILURE";
      diagnostics.lastTimeoutClassification = error?.timeoutClassification || diagnostics.lastTimeoutClassification || null;
      diagnostics.lastAbortReason = error?.abortReason || diagnostics.lastAbortReason || null;
      diagnostics.durationMs = Date.now() - startedAt;
      diagnostics.quotaErrorSeen = error?.providerStatus === EVIDENCE_PROVIDER_STATUS.QUOTA_EXHAUSTED || budgetState.ledger.quotaErrorSeen;
      diagnostics.providerAttempt = diagnostics.providerAttempt || {
        provider: "TAVILY",
        status: error?.providerStatus || EVIDENCE_PROVIDER_STATUS.UNAVAILABLE,
        httpStatus: safeHttpStatus(error?.httpStatus),
        resultCount: 0,
        durationMs: diagnostics.durationMs,
        errorCategory: providerErrorCategory(error),
        retryable: error?.retryable === true,
      };
      diagnostics.budget = budgetSnapshot(this.env);
      throw error;
    }
  }

  async fetch(url, options = {}) {
    const guard = validateRemoteUrlSync(url);
    if (!guard.ok) return { html: "", textContent: "", status: 403, error: guard.code };
    if (!this.sourceFetcher || typeof this.sourceFetcher.fetch !== "function") {
      return {
        html: "",
        textContent: "",
        status: 503,
        providerStatus: EVIDENCE_PROVIDER_STATUS.UNAVAILABLE,
        sourceType: SOURCE_TYPE.SEARCH_RETRIEVAL,
        liveEvidence: false,
        retrievalOutcome: "FAILURE",
      };
    }
    return this.sourceFetcher.fetch(guard.url, options);
  }
}
