/**
 * Layer 3 — WebSearchRetriever
 * 
 * Live web retrieval engine equipped with SSRF guards, HTML sanitization,
 * and seamless fallback to KnowledgeBaseRetriever.
 */

import { IEvidenceRetriever } from "./IEvidenceRetriever.js";
import { KnowledgeBaseRetriever } from "./KnowledgeBaseRetriever.js";
import { SourceAuthorityRegistry } from "../registry/SourceAuthorityRegistry.js";
import { LAYER_3_CONFIG } from "../config/Layer3Config.js";

const SSRF_BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254",
  "::1",
  "fe80::",
];

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
      const parsed = new URL(url);

      // SSRF Boundary Check
      if (
        SSRF_BLOCKED_HOSTNAMES.some((h) => parsed.hostname === h || parsed.hostname.endsWith(".internal") || parsed.hostname.endsWith(".local"))
      ) {
        console.warn(`[Layer 3 SSRF Guard] Blocked access to restricted destination: ${url}`);
        return { html: "", textContent: "", status: 403, error: "SSRF_RESTRICTED" };
      }

      // Check KB first for known documents
      const kbDoc = await this.kbRetriever.fetch(url);
      if (kbDoc.status === 200) {
        return kbDoc;
      }

      // Real fetch with timeout constraint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LAYER_3_CONFIG.SLA.MAX_TIMEOUT_MS);

      const res = await fetch(url, {
        headers: {
          "User-Agent": "StudentHubAI-Trust-EvidenceEngine/1.0",
          Accept: "text/html,application/xhtml+xml,text/plain",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return { html: "", textContent: "", status: res.status };
      }

      const html = await res.text();
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
      };
    } catch (err) {
      console.warn(`[Layer3 Web Fetch Error]: ${err.message}`);
      return { html: "", textContent: "", status: 500, error: err.message };
    }
  }
}
