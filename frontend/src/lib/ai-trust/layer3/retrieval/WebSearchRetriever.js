/**
 * Layer 3 — WebSearchRetriever
 * 
 * Live web retrieval engine equipped with SSRF guards, HTML sanitization,
 * and seamless fallback to KnowledgeBaseRetriever.
 */

import { IEvidenceRetriever } from "./IEvidenceRetriever.js";
import { KnowledgeBaseRetriever } from "./KnowledgeBaseRetriever.js";
import { SOURCE_TYPE, EVIDENCE_PROVIDER_STATUS } from "../types.js";
import { markNetworkGuardedRetriever } from "./NetworkGuard.js";

import { LAYER_3_CONFIG } from "../config/Layer3Config.js";
import { validateRemoteUrl, validateRemoteUrlSync, isRedirectStatus } from "../../../security/hardening/SafeRemoteUrl.js";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECT_HOPS = 4;

function createAbortError(reason) {
  const error = reason instanceof Error ? reason : new Error("Evidence retrieval cancelled");
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

export class WebSearchRetriever extends IEvidenceRetriever {
  constructor({ fetchImpl = globalThis.fetch } = {}) {
    super("live_web_search_retriever");
    markNetworkGuardedRetriever(this);
    this.kbRetriever = new KnowledgeBaseRetriever();
    this.fetchImpl = fetchImpl;
    this.networkGuarded = true;
    this.lastSearchStatus = EVIDENCE_PROVIDER_STATUS.LOCAL_ONLY;
  }

  /**
   * Searches web queries with safety boundaries
   */
  async search(queries, options = {}) {
    // No search-provider credentials are configured in this repository. The
    // explicit local result is useful for offline operation, but callers are
    // told through source provenance that it is not live external evidence.
    throwIfAborted(options?.signal);
    this.lastSearchStatus = EVIDENCE_PROVIDER_STATUS.LOCAL_ONLY;
    return this.kbRetriever.search(Array.isArray(queries) ? queries.slice(0, 240) : [], options);
  }

  /**
   * Safely fetches and sanitizes remote web page
   */
  async fetch(url, options = {}) {
    const signal = options?.signal;
    throwIfAborted(signal);
    if (!url || typeof url !== "string") {
      return { html: "", textContent: "", status: 400 };
    }

    try {
      const initialGuard = validateRemoteUrlSync(url);
      if (!initialGuard.ok) return { html: "", textContent: "", status: 403, error: initialGuard.code };

      // Check KB first for known documents
      const kbDoc = await this.kbRetriever.fetch(initialGuard.url, options);
      throwIfAborted(signal);
      if (kbDoc.status === 200) {
        return kbDoc;
      }

      if (typeof this.fetchImpl !== "function") {
        return { html: "", textContent: "", status: 503, error: "FETCH_PROVIDER_NOT_CONFIGURED", sourceType: SOURCE_TYPE.SEARCH_RETRIEVAL, providerStatus: EVIDENCE_PROVIDER_STATUS.NOT_CONFIGURED, liveEvidence: false, retrievalOutcome: "FAILURE" };
      }

      // Network fetches revalidate DNS before every hop and never follow an
      // unvalidated redirect.  This closes private-range and DNS-rebinding
      // SSRF paths that a single `redirect: follow` request leaves open.
      let currentUrl = initialGuard.url;
      let redirectCount = 0;
      let res;
      while (true) {
        throwIfAborted(signal);
        const hopGuard = await validateRemoteUrl(currentUrl, { resolveDns: true });
        throwIfAborted(signal);
        if (!hopGuard.ok) return { html: "", textContent: "", status: 403, error: hopGuard.code };

        const controller = new AbortController();
        const unbindAbort = bindAbortSignal(controller, signal);
        const timeoutId = setTimeout(() => controller.abort(), LAYER_3_CONFIG.SLA.MAX_TIMEOUT_MS);
        try {
          res = await this.fetchImpl(hopGuard.url, {
            redirect: "manual",
            headers: {
              "User-Agent": "StudentHubAI-Trust-EvidenceEngine/1.0",
              Accept: "text/html,application/xhtml+xml,text/plain",
            },
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
          unbindAbort();
        }
        throwIfAborted(signal);

        if (!isRedirectStatus(res.status)) break;
        const location = res.headers.get("location");
        if (!location) break;
        if (redirectCount >= MAX_REDIRECT_HOPS) {
          return { html: "", textContent: "", status: 508, error: "REDIRECT_LIMIT_EXCEEDED" };
        }

        let nextUrl;
        try {
          nextUrl = new URL(location, hopGuard.url).toString();
        } catch {
          return { html: "", textContent: "", status: 502, error: "MALFORMED_REDIRECT_URL" };
        }
        const nextGuard = validateRemoteUrlSync(nextUrl);
        if (!nextGuard.ok) return { html: "", textContent: "", status: 403, error: nextGuard.code };
        currentUrl = nextGuard.url;
        redirectCount += 1;
      }

      if (!res.ok) return { html: "", textContent: "", status: res.status };

      const contentType = String(res.headers.get("content-type") || "").toLowerCase();
      const contentEncoding = String(res.headers.get("content-encoding") || "").toLowerCase();
      if (contentEncoding && contentEncoding !== "identity") {
        return { html: "", textContent: "", status: 415, error: "COMPRESSED_RESPONSE_REJECTED", sourceType: SOURCE_TYPE.SEARCH_RETRIEVAL, providerStatus: EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE, liveEvidence: false, retrievalOutcome: "FAILURE" };
      }
      if (!contentType || !/(text\/html|application\/xhtml\+xml|text\/plain)/i.test(contentType)) {
        return { html: "", textContent: "", status: 415, error: "UNSUPPORTED_EVIDENCE_CONTENT_TYPE", sourceType: SOURCE_TYPE.SEARCH_RETRIEVAL, providerStatus: EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE, liveEvidence: false, retrievalOutcome: "FAILURE" };
      }

      const contentLength = Number(res.headers.get("content-length") || 0);
      if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
        return { html: "", textContent: "", status: 413, error: "PAYLOAD_TOO_LARGE" };
      }

      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength > MAX_RESPONSE_BYTES) {
        return { html: "", textContent: "", status: 413, error: "PAYLOAD_TOO_LARGE" };
      }
      const html = new TextDecoder().decode(bytes);
      if (html.includes("\uFFFD")) {
        return { html: "", textContent: "", status: 415, error: "BINARY_OR_MALFORMED_TEXT", sourceType: SOURCE_TYPE.SEARCH_RETRIEVAL, providerStatus: EVIDENCE_PROVIDER_STATUS.INVALID_RESPONSE, liveEvidence: false, retrievalOutcome: "FAILURE" };
      }
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return {
        html,
        textContent,
        status: 200,
        finalUrl: currentUrl,
        sourceType: SOURCE_TYPE.SEARCH_RETRIEVAL,
        providerStatus: EVIDENCE_PROVIDER_STATUS.SUCCESS,
        liveEvidence: true,
        retrievalOutcome: "SUCCESS",
      };
    } catch (err) {
      if (signal?.aborted) throw createAbortError(signal.reason);
      const status = err?.name === "AbortError" ? 504 : 502;
      return { html: "", textContent: "", status, error: err?.name === "AbortError" ? "FETCH_TIMEOUT" : "NETWORK_FETCH_FAILURE", sourceType: SOURCE_TYPE.SEARCH_RETRIEVAL, providerStatus: err?.name === "AbortError" ? EVIDENCE_PROVIDER_STATUS.TIMEOUT : EVIDENCE_PROVIDER_STATUS.UNAVAILABLE, liveEvidence: false, retrievalOutcome: "FAILURE" };
    }
  }
}
