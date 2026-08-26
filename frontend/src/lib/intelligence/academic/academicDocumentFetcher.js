/**
 * StudentHub AI — Safe Academic Document Fetcher
 * 
 * Enforces Safe Network & Retrieval Boundaries:
 * - Bounded request timeouts and response size caps (max 5MB).
 * - Validates redirect authorities against official domain whitelist.
 * - HTTP status code classification (200 OK, 304 Not Modified, 4xx/5xx).
 * - Pluggable transport provider for deterministic unit testing.
 */

import { AcademicSourceRegistry } from "./academicSourceRegistry.js";

export const FETCH_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export class AcademicDocumentFetcher {
  static #customTransport = null;

  /**
   * Sets a custom transport provider for unit testing
   * @param {Function|null} transportFn - async (url, options) => { status, headers, body, finalUrl }
   */
  static setTransport(transportFn) {
    this.#customTransport = transportFn;
  }

  /**
   * Resets transport back to standard fetch
   */
  static resetTransport() {
    this.#customTransport = null;
  }

  /**
   * Safely fetches a document from an academic source
   * @param {object} source - { sourceId, canonicalUrl, fetchPolicy, expectedContentType }
   * @param {object} options - { etag, lastModified, timeoutMs }
   * @returns {Promise<object>} FetchResult
   */
  static async fetchDocument(source, options = {}) {
    if (!source || !source.canonicalUrl) {
      return {
        success: false,
        statusCode: 0,
        error: "INVALID_SOURCE_SPECIFICATION",
        rawBody: "",
        headers: {},
        etag: null,
        lastModified: null,
        isRedirected: false,
        finalUrl: ""
      };
    }

    const targetUrl = source.canonicalUrl;
    const requestHeaders = {
      "User-Agent": "StudentHubAI-AcademicLiveSync/1.0 (+https://studenthub.ai)",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7"
    };

    if (options.etag) {
      requestHeaders["If-None-Match"] = options.etag;
    }
    if (options.lastModified) {
      requestHeaders["If-Modified-Since"] = options.lastModified;
    }

    const timeoutMs = options.timeoutMs || 15000;

    try {
      if (this.#customTransport) {
        const customRes = await this.#customTransport(targetUrl, { headers: requestHeaders, timeoutMs });
        return this.#processResponse(source, targetUrl, customRes);
      }

      // Built-in standard fetch with AbortSignal timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(targetUrl, {
        method: "GET",
        headers: requestHeaders,
        signal: controller.signal,
        redirect: "follow"
      });

      clearTimeout(timer);

      const status = response.status;
      const headers = Object.fromEntries(response.headers.entries());
      const finalUrl = response.url || targetUrl;

      if (status === 304) {
        return {
          success: true,
          statusCode: 304,
          isNotModified: true,
          rawBody: "",
          headers,
          etag: headers["etag"] || options.etag || null,
          lastModified: headers["last-modified"] || options.lastModified || null,
          isRedirected: finalUrl !== targetUrl,
          finalUrl
        };
      }

      const rawBody = await response.text();

      return this.#processResponse(source, targetUrl, {
        status,
        headers,
        body: rawBody,
        finalUrl
      });
    } catch (err) {
      const isTimeout = err.name === "AbortError" || err.message?.includes("timeout");
      return {
        success: false,
        statusCode: isTimeout ? 408 : 0,
        error: isTimeout ? "FETCH_TIMEOUT" : (err.message || "NETWORK_FETCH_FAILURE"),
        rawBody: "",
        headers: {},
        etag: null,
        lastModified: null,
        isRedirected: false,
        finalUrl: targetUrl
      };
    }
  }

  static #processResponse(source, initialUrl, res) {
    const { status, headers = {}, body = "", finalUrl = initialUrl } = res;

    // 1. Check HTTP Status Errors
    if (status >= 400) {
      return {
        success: false,
        statusCode: status,
        error: `HTTP_STATUS_${status}`,
        rawBody: "",
        headers,
        etag: headers["etag"] || null,
        lastModified: headers["last-modified"] || null,
        isRedirected: finalUrl !== initialUrl,
        finalUrl
      };
    }

    // 2. Check 304
    if (status === 304) {
      return {
        success: true,
        statusCode: 304,
        isNotModified: true,
        rawBody: "",
        headers,
        etag: headers["etag"] || null,
        lastModified: headers["last-modified"] || null,
        isRedirected: finalUrl !== initialUrl,
        finalUrl
      };
    }

    // 3. Check Redirect Authority
    const isRedirected = finalUrl !== initialUrl;
    if (isRedirected) {
      try {
        const finalParsed = new URL(finalUrl);
        const isFinalOfficial = AcademicSourceRegistry.isOfficialAuthority(finalParsed.hostname);
        if (!isFinalOfficial && source.sourceTier === "TIER_1_OFFICIAL") {
          return {
            success: false,
            statusCode: status,
            error: "REDIRECT_AUTHORITY_VIOLATION",
            rawBody: "",
            headers,
            etag: null,
            lastModified: null,
            isRedirected: true,
            finalUrl
          };
        }
      } catch {
        return {
          success: false,
          statusCode: status,
          error: "MALFORMED_REDIRECT_URL",
          rawBody: "",
          headers,
          etag: null,
          lastModified: null,
          isRedirected: true,
          finalUrl
        };
      }
    }

    // 4. Check Content Size Limit (Max 5MB)
    if (typeof body === "string" && body.length > FETCH_MAX_BYTES) {
      return {
        success: false,
        statusCode: status,
        error: "PAYLOAD_TOO_LARGE",
        rawBody: "",
        headers,
        etag: null,
        lastModified: null,
        isRedirected,
        finalUrl
      };
    }

    return {
      success: true,
      statusCode: status,
      isNotModified: false,
      rawBody: body,
      headers,
      etag: headers["etag"] || null,
      lastModified: headers["last-modified"] || null,
      isRedirected,
      finalUrl
    };
  }
}
