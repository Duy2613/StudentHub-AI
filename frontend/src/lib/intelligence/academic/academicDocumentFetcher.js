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
import { validateRemoteUrl, validateRemoteUrlSync, isRedirectStatus } from "../../security/hardening/SafeRemoteUrl.js";

export const FETCH_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_REDIRECT_HOPS = 4;

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
    const targetGuard = validateRemoteUrlSync(targetUrl);
    if (!targetGuard.ok) {
      return {
        success: false,
        statusCode: 403,
        error: targetGuard.code,
        rawBody: "",
        headers: {},
        etag: null,
        lastModified: null,
        isRedirected: false,
        finalUrl: targetUrl
      };
    }

    // A caller may not elevate an arbitrary public URL by labelling it as an
    // official source.  This check must happen before custom or built-in
    // transport is invoked so an authority failure has zero network effect.
    const requiresOfficialAuthority = source.sourceTier === "TIER_1_OFFICIAL" ||
      source.sourceTier === "TIER_2_OFFICIAL_MIRROR";
    if (requiresOfficialAuthority && !AcademicSourceRegistry.isOfficialAuthority(targetGuard.hostname)) {
      return {
        success: false,
        statusCode: 403,
        error: "INITIAL_AUTHORITY_VIOLATION",
        rawBody: "",
        headers: {},
        etag: null,
        lastModified: null,
        isRedirected: false,
        finalUrl: targetGuard.url
      };
    }
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

    const requestedTimeout = Number(options.timeoutMs);
    const timeoutMs = Number.isFinite(requestedTimeout)
      ? Math.min(Math.max(requestedTimeout, 1000), 30000)
      : 15000;

    try {
      if (this.#customTransport) {
        const customRes = await this.#customTransport(targetUrl, { headers: requestHeaders, timeoutMs });
        return this.#processResponse(source, targetUrl, customRes);
      }

      // Built-in fetch uses manual redirects.  Every hop is checked for
      // scheme/private-address/DNS-rebind safety before it is requested.
      let currentUrl = targetGuard.url;
      let redirectCount = 0;
      let isRedirected = false;
      let response;
      while (true) {
        const hopGuard = await validateRemoteUrl(currentUrl, { resolveDns: true });
        if (!hopGuard.ok) {
          return {
            success: false,
            statusCode: 403,
            error: hopGuard.code,
            rawBody: "",
            headers: {},
            etag: null,
            lastModified: null,
            isRedirected,
            finalUrl: currentUrl
          };
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          response = await fetch(hopGuard.url, {
            method: "GET",
            headers: requestHeaders,
            signal: controller.signal,
            redirect: "manual"
          });
        } finally {
          clearTimeout(timer);
        }

        if (!isRedirectStatus(response.status)) break;
        const location = response.headers.get("location");
        if (!location) break;
        if (redirectCount >= MAX_REDIRECT_HOPS) {
          return {
            success: false,
            statusCode: 508,
            error: "REDIRECT_LIMIT_EXCEEDED",
            rawBody: "",
            headers: {},
            etag: null,
            lastModified: null,
            isRedirected: true,
            finalUrl: currentUrl
          };
        }

        let nextUrl;
        try {
          nextUrl = new URL(location, hopGuard.url).toString();
        } catch {
          return {
            success: false,
            statusCode: 502,
            error: "MALFORMED_REDIRECT_URL",
            rawBody: "",
            headers: {},
            etag: null,
            lastModified: null,
            isRedirected: true,
            finalUrl: currentUrl
          };
        }
        const nextGuard = validateRemoteUrlSync(nextUrl);
        if (!nextGuard.ok) {
          return {
            success: false,
            statusCode: 403,
            error: nextGuard.code,
            rawBody: "",
            headers: {},
            etag: null,
            lastModified: null,
            isRedirected: true,
            finalUrl: nextUrl
          };
        }
        if (source.sourceTier === "TIER_1_OFFICIAL" && !AcademicSourceRegistry.isOfficialAuthority(nextGuard.hostname)) {
          return {
            success: false,
            statusCode: response.status,
            error: "REDIRECT_AUTHORITY_VIOLATION",
            rawBody: "",
            headers: {},
            etag: null,
            lastModified: null,
            isRedirected: true,
            finalUrl: nextGuard.url
          };
        }
        currentUrl = nextGuard.url;
        isRedirected = true;
        redirectCount += 1;
      }

      const status = response.status;
      const headers = Object.fromEntries(response.headers.entries());
      const finalUrl = currentUrl;

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

      const contentLength = Number(headers["content-length"] || 0);
      if (Number.isFinite(contentLength) && contentLength > FETCH_MAX_BYTES) {
        return this.#processResponse(source, targetUrl, { status, headers, body: "X".repeat(FETCH_MAX_BYTES + 1), finalUrl });
      }

      const rawBody = await this.#readBodyBounded(response);
      if (rawBody === null) {
        return this.#processResponse(source, targetUrl, { status, headers, body: "X".repeat(FETCH_MAX_BYTES + 1), finalUrl });
      }

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
        error: isTimeout ? "FETCH_TIMEOUT" : "NETWORK_FETCH_FAILURE",
        rawBody: "",
        headers: {},
        etag: null,
        lastModified: null,
        isRedirected: false,
        finalUrl: targetUrl
      };
    }
  }

  static async #readBodyBounded(response) {
    if (!response?.body?.getReader) {
      const body = await response.text();
      return typeof body === "string" && new TextEncoder().encode(body).byteLength <= FETCH_MAX_BYTES ? body : null;
    }

    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value?.byteLength || 0;
        if (total > FETCH_MAX_BYTES) {
          await reader.cancel();
          return null;
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock?.();
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(bytes);
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

    // 3. Check final URL safety and redirect authority before accepting body.
    const isRedirected = finalUrl !== initialUrl;
    if (isRedirected) {
      try {
        const finalParsed = new URL(finalUrl);
        const finalGuard = validateRemoteUrlSync(finalUrl);
        if (!finalGuard.ok) {
          return {
            success: false,
            statusCode: 403,
            error: finalGuard.code,
            rawBody: "",
            headers,
            etag: null,
            lastModified: null,
            isRedirected: true,
            finalUrl
          };
        }
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
    if (typeof body === "string" && new TextEncoder().encode(body).byteLength > FETCH_MAX_BYTES) {
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
