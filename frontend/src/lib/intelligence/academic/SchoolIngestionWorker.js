// frontend/src/lib/intelligence/academic/SchoolIngestionWorker.js
//
// Server-Side Bounded Polling Ingestion Worker
// Implements:
// - HTTP conditional requests (ETag / If-None-Match, Last-Modified / If-Modified-Since)
// - Clean 304 Not Modified handling (zero unneeded processing)
// - Exponential backoff with jitter on errors & 429/503 rate limits
// - Bounded per-host rate limiting

import { defaultSchoolSourceRegistry, SOURCE_HEALTH } from "./DurableSchoolSourceRegistry.js";

export class SchoolIngestionWorker {
  constructor(registry = defaultSchoolSourceRegistry, options = {}) {
    this.registry = registry;
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.baseBackoffMs = options.baseBackoffMs || 1000;
    this.maxBackoffMs = options.maxBackoffMs || 60000;
    this.hostLastRequested = new Map();
    this.minHostIntervalMs = options.minHostIntervalMs || 2000; // 2 seconds between hits to same host
  }

  /**
   * Calculate exponential backoff with full jitter
   */
  calculateBackoff(attempt) {
    const exponential = Math.min(this.maxBackoffMs, this.baseBackoffMs * Math.pow(2, attempt));
    // Full jitter: random value between 0 and exponential
    return Math.floor(Math.random() * exponential);
  }

  /**
   * Polls a specific source using HTTP conditional headers
   */
  async pollSource(sourceId) {
    const source = this.registry.getSource(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    const metadata = this.registry.getMetadata(sourceId);
    const headers = { ...(source.headers || {}) };

    if (metadata?.etag) {
      headers["If-None-Match"] = metadata.etag;
    }
    if (metadata?.lastModified) {
      headers["If-Modified-Since"] = metadata.lastModified;
    }

    // Rate-limit check per host
    let host = "default";
    try {
      host = new URL(source.endpointUrl).host;
    } catch {
      // ignore
    }

    const lastReq = this.hostLastRequested.get(host) || 0;
    const now = Date.now();
    const elapsed = now - lastReq;
    if (elapsed < this.minHostIntervalMs) {
      const waitMs = this.minHostIntervalMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    this.hostLastRequested.set(host, Date.now());

    try {
      const response = await this.fetchFn(source.endpointUrl, {
        method: "GET",
        headers,
      });

      // 1. Handle 304 Not Modified
      if (response.status === 304) {
        this.registry.recordSuccess(sourceId);
        return {
          sourceId,
          status: "NOT_MODIFIED",
          statusCode: 304,
          data: null,
          noticesCount: 0,
        };
      }

      // 2. Handle 429 Too Many Requests or 503 Service Unavailable
      if (response.status === 429 || response.status === 503) {
        this.registry.recordFailure(sourceId);
        const retryAfterSec = Number(response.headers?.get?.("retry-after")) || 5;
        return {
          sourceId,
          status: "RATE_LIMITED",
          statusCode: response.status,
          backoffMs: retryAfterSec * 1000,
        };
      }

      if (!response.ok) {
        this.registry.recordFailure(sourceId);
        return {
          sourceId,
          status: "HTTP_ERROR",
          statusCode: response.status,
          backoffMs: this.calculateBackoff(metadata?.failureCount || 1),
        };
      }

      // 3. Update conditional headers
      const newEtag = response.headers?.get?.("etag");
      const newLastModified = response.headers?.get?.("last-modified");
      this.registry.updateConditionalHeaders(sourceId, {
        etag: newEtag,
        lastModified: newLastModified,
      });
      this.registry.recordSuccess(sourceId);

      const contentType = response.headers?.get?.("content-type") || "";
      let rawData;
      if (contentType.includes("application/json")) {
        rawData = await response.json();
      } else {
        rawData = await response.text();
      }

      return {
        sourceId,
        status: "MODIFIED",
        statusCode: response.status,
        data: rawData,
        etag: newEtag || null,
        lastModified: newLastModified || null,
      };
    } catch (err) {
      this.registry.recordFailure(sourceId);
      return {
        sourceId,
        status: "NETWORK_ERROR",
        error: err.message,
        backoffMs: this.calculateBackoff(metadata?.failureCount || 1),
      };
    }
  }
}
