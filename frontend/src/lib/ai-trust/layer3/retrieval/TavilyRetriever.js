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

const TAVILY_SEARCH_ENDPOINT = "https://api.tavily.com/search";
// Tavily's public API accepts up to 20 results per request. We request that
// provider maximum and deliberately do not impose another application-level
// source/result cap after the response arrives.
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
// Run every generated query, but keep a bounded number of in-flight requests
// so a long OCR/QR input cannot exhaust sockets or the Tavily rate budget.
const SEARCH_CONCURRENCY = 8;

function defaultEnv() {
  return typeof process !== "undefined" ? process.env : {};
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
  let parsed;
  try {
    parsed = new URL(guard.url);
  } catch {
    return { rejected: "INVALID_REMOTE_URL" };
  }
  const sourceId = `tavily-${queryIndex + 1}-${resultIndex + 1}`;
  return {
    source: {
      sourceId,
      url: guard.url,
      domain: parsed.hostname.toLowerCase(),
      title: boundedString(result?.title, 240) || guard.url,
      publisher: boundedString(result?.publisher || parsed.hostname, 180),
      publishedAt: typeof result?.published_date === "string" ? result.published_date.slice(0, 80) : null,
      sourceType: SOURCE_TYPE.SEARCH_RETRIEVAL,
      providerStatus: EVIDENCE_PROVIDER_STATUS.SUCCESS,
      liveEvidence: false,
      retrievalOutcome: "CANDIDATE",
      sourceFingerprint: `tavily:${sourceId}`,
    },
  };
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
      durationMs: 0,
    };
  }

  get apiKey() {
    return typeof this.env?.TAVILY_API_KEY === "string" ? this.env.TAVILY_API_KEY.trim() : "";
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  getRuntimeDiagnostics() {
    return {
      ...this.lastSearchDiagnostics,
      envPresent: this.isConfigured(),
      adapterConfigured: true,
      rejectionReasons: [...this.lastSearchDiagnostics.rejectionReasons],
      httpStatuses: [...this.lastSearchDiagnostics.httpStatuses],
      requestTrace: this.lastSearchDiagnostics.requestTrace.map((trace) => ({ ...trace })),
    };
  }

  async #searchOne(query, { signal, timeoutMs, attempt = 1 }) {
    throwIfAborted(signal);
    if (typeof this.fetchImpl !== "function") {
      throw createProviderErrorWithMetadata("TAVILY_FETCH_UNAVAILABLE", EVIDENCE_PROVIDER_STATUS.UNAVAILABLE, null, {
        timeoutClassification: "OTHER",
        retryable: false,
      });
    }

    const controller = new AbortController();
    const unbindAbort = bindAbortSignal(controller, signal);
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
          search_depth: "basic",
          max_results: MAX_RESULTS_PER_QUERY,
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
      responseStatus = safeHttpStatus(response?.status);
      if (!response?.ok) {
        const classification = responseStatus === 504 ? "UPSTREAM_TAVILY_504" : "OTHER";
        throw createProviderErrorWithMetadata(`TAVILY_HTTP_${responseStatus || "ERROR"}`, providerStatusForHttp(responseStatus), responseStatus, {
          timeoutClassification: classification,
          retryable: RETRYABLE_HTTP_STATUSES.has(responseStatus),
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
    }
  }

  async search(queries, options = {}) {
    const startedAt = Date.now();
    const parentTimeoutMs = boundedParentTimeout(options.timeoutMs);
    const requestedQueries = Array.isArray(queries) ? queries.length : 0;
    const boundedQueries = (Array.isArray(queries) ? queries : [])
      .map((item) => typeof item === "string" ? item : item?.query)
      .filter((item) => typeof item === "string" && item.trim())
      // Tavily recommends compact queries. This is a provider transport
      // constraint, not a source-count limit: every generated query is kept
      // and sent within the provider's accepted query size.
      .map((item) => item.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 380));
    const diagnostics = {
      provider: "tavily",
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
      durationMs: 0,
    };
    this.lastSearchDiagnostics = diagnostics;

    if (!this.isConfigured()) {
      this.lastSearchStatus = EVIDENCE_PROVIDER_STATUS.NOT_CONFIGURED;
      diagnostics.lastErrorCode = "TAVILY_NOT_CONFIGURED";
      diagnostics.durationMs = Date.now() - startedAt;
      throw createProviderError("TAVILY_NOT_CONFIGURED", EVIDENCE_PROVIDER_STATUS.NOT_CONFIGURED);
    }

    const deadline = Date.now() + parentTimeoutMs;
    const sources = [];
    const seenUrls = new Set();
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
      const runQuery = async ([queryIndex, query]) => {
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
            diagnostics.callCount += 1;
            try {
              response = await this.#searchOne(query, {
                signal: options.signal,
                timeoutMs: remainingMs,
                attempt,
              });
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
          const canonicalUrl = candidate.source.url.toLowerCase();
          if (seenUrls.has(canonicalUrl)) {
            recordRejection(diagnostics, "DUPLICATE_URL");
            continue;
          }
          seenUrls.add(canonicalUrl);
          sources.push(candidate.source);
          diagnostics.acceptedResults += 1;
        }
        diagnostics.acceptedHostCount = new Set(sources.map((source) => source.domain).filter(Boolean)).size;
      }
      if (successfulResponseCount === 0 && firstQueryError) throw firstQueryError;
      this.lastSearchStatus = searchBudgetExhausted
        ? EVIDENCE_PROVIDER_STATUS.TIMEOUT
        : hadQueryFailure ? EVIDENCE_PROVIDER_STATUS.PARTIAL : EVIDENCE_PROVIDER_STATUS.SUCCESS;
      diagnostics.providerRetryable = null;
      diagnostics.providerRetryExhausted = hadQueryFailure ? diagnostics.providerRetryExhausted : false;
      diagnostics.lastErrorCode = searchBudgetExhausted
        ? "TAVILY_SEARCH_BUDGET_EXHAUSTED"
        : hadQueryFailure ? boundedString(firstQueryError?.code || firstQueryError?.message, 120) || "TAVILY_PARTIAL_SEARCH" : null;
      diagnostics.lastTimeoutClassification = searchBudgetExhausted ? "LOCAL_ADAPTER_TIMEOUT" : diagnostics.lastTimeoutClassification;
      diagnostics.lastAbortReason = searchBudgetExhausted ? "search-budget-exhausted" : diagnostics.lastAbortReason;
      diagnostics.durationMs = Date.now() - startedAt;
      return sources;
    } catch (error) {
      if (options.signal?.aborted || error?.name === "AbortError") throw error;
      this.lastSearchStatus = error?.providerStatus || EVIDENCE_PROVIDER_STATUS.UNAVAILABLE;
      diagnostics.lastErrorCode = boundedString(error?.code || error?.message, 120) || "TAVILY_SEARCH_FAILURE";
      diagnostics.lastTimeoutClassification = error?.timeoutClassification || diagnostics.lastTimeoutClassification || null;
      diagnostics.lastAbortReason = error?.abortReason || diagnostics.lastAbortReason || null;
      diagnostics.durationMs = Date.now() - startedAt;
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
