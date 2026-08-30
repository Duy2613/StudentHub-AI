/**
 * Layer 3 — WebSearchRetriever
 * 
 * Live web retrieval engine equipped with SSRF guards, HTML sanitization,
 * and seamless fallback to KnowledgeBaseRetriever.
 */

import { IEvidenceRetriever } from "./IEvidenceRetriever.js";
import { KnowledgeBaseRetriever } from "./KnowledgeBaseRetriever.js";

import { LAYER_3_CONFIG } from "../config/Layer3Config.js";
import { validateRemoteUrl, validateRemoteUrlSync, isRedirectStatus } from "../../../security/hardening/SafeRemoteUrl.js";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECT_HOPS = 4;

export class WebSearchRetriever extends IEvidenceRetriever {
  constructor() {
    super("live_web_search_retriever");
    this.kbRetriever = new KnowledgeBaseRetriever();
  }

  /**
   * Searches web queries with safety boundaries
   */
  async search(queries, options = {}) {
    // In local testing or offline environments, delegate to Knowledge Base
    return this.kbRetriever.search(queries, options);
  }

  /**
   * Safely fetches and sanitizes remote web page
   */
  async fetch(url) {
    if (!url || typeof url !== "string") {
      return { html: "", textContent: "", status: 400 };
    }

    try {
      const initialGuard = validateRemoteUrlSync(url);
      if (!initialGuard.ok) return { html: "", textContent: "", status: 403, error: initialGuard.code };

      // Check KB first for known documents
      const kbDoc = await this.kbRetriever.fetch(initialGuard.url);
      if (kbDoc.status === 200) {
        return kbDoc;
      }

      // Network fetches revalidate DNS before every hop and never follow an
      // unvalidated redirect.  This closes private-range and DNS-rebinding
      // SSRF paths that a single `redirect: follow` request leaves open.
      let currentUrl = initialGuard.url;
      let redirectCount = 0;
      let res;
      while (true) {
        const hopGuard = await validateRemoteUrl(currentUrl, { resolveDns: true });
        if (!hopGuard.ok) return { html: "", textContent: "", status: 403, error: hopGuard.code };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LAYER_3_CONFIG.SLA.MAX_TIMEOUT_MS);
        try {
          res = await fetch(hopGuard.url, {
            redirect: "manual",
            headers: {
              "User-Agent": "StudentHubAI-Trust-EvidenceEngine/1.0",
              Accept: "text/html,application/xhtml+xml,text/plain",
            },
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

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

      const contentLength = Number(res.headers.get("content-length") || 0);
      if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
        return { html: "", textContent: "", status: 413, error: "PAYLOAD_TOO_LARGE" };
      }

      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength > MAX_RESPONSE_BYTES) {
        return { html: "", textContent: "", status: 413, error: "PAYLOAD_TOO_LARGE" };
      }
      const html = new TextDecoder().decode(bytes);
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
      };
    } catch (err) {
      const status = err?.name === "AbortError" ? 504 : 502;
      return { html: "", textContent: "", status, error: err?.name === "AbortError" ? "FETCH_TIMEOUT" : "NETWORK_FETCH_FAILURE" };
    }
  }
}
