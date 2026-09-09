/**
 * Bounded server-side client for the approved no-key public APIs.
 *
 * Invariants:
 * - only allowlisted API origins are callable;
 * - only GET requests are supported;
 * - timeout and response-size limits are enforced before normalization;
 * - raw upstream bodies/errors never cross this boundary;
 * - successful responses are cached in a provider-specific in-memory namespace.
 */

import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import { getPublicApiDefinition } from "./PublicApiRegistry.js";

const DEFAULT_TIMEOUT_MS = 6000;
const DEFAULT_MAX_RESPONSE_BYTES = 512 * 1024;

function cloneValue(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function toSafeParams(params = {}) {
  const output = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === "") continue;
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,64}$/.test(key)) continue;
    if (Array.isArray(value)) {
      output.set(key, value.map((item) => String(item)).join(","));
    } else {
      output.set(key, String(value));
    }
  }
  return output;
}

function classifyHttpFailure(status) {
  if (status === 429) return { status: "RATE_LIMITED", code: "UPSTREAM_RATE_LIMITED" };
  if (status >= 500) return { status: "UNAVAILABLE", code: "UPSTREAM_UNAVAILABLE" };
  return { status: "ERROR", code: `UPSTREAM_HTTP_${status}` };
}

function safeRetryAfter(headers) {
  const raw = headers?.get?.("retry-after");
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 && seconds <= 3600 ? Math.round(seconds * 1000) : null;
}

export class PublicApiClient {
  constructor({
    fetchImpl = globalThis.fetch,
    now = () => Date.now(),
    defaultTimeoutMs = DEFAULT_TIMEOUT_MS,
    maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES,
    cache = new Map(),
  } = {}) {
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.defaultTimeoutMs = Math.min(30000, Math.max(250, Number(defaultTimeoutMs) || DEFAULT_TIMEOUT_MS));
    this.maxResponseBytes = Math.min(2 * 1024 * 1024, Math.max(1024, Number(maxResponseBytes) || DEFAULT_MAX_RESPONSE_BYTES));
    this.cache = cache;
  }

  clearCache() {
    this.cache.clear();
  }

  _buildUrl(apiId, pathname, params) {
    const definition = getPublicApiDefinition(apiId);
    if (!definition) return { ok: false, code: "UNKNOWN_PUBLIC_API" };
    if (typeof pathname !== "string" || pathname.length < 2 || pathname.length > 180 ||
        !/^\/[A-Za-z0-9._~%/()!*'_-]+$/.test(pathname)) {
      return { ok: false, code: "INVALID_PUBLIC_API_PATH" };
    }
    try {
      const decodedPath = decodeURIComponent(pathname);
      if (decodedPath.includes("..") || /[\u0000-\u001f?#]/.test(decodedPath)) {
        return { ok: false, code: "INVALID_PUBLIC_API_PATH" };
      }
    } catch {
      return { ok: false, code: "INVALID_PUBLIC_API_PATH" };
    }

    const base = new URL(definition.baseUrl);
    const target = new URL(pathname, `${base.origin}/`);
    if (target.origin !== base.origin || !validateRemoteUrlSync(target.toString()).ok) {
      return { ok: false, code: "PUBLIC_API_ORIGIN_REJECTED" };
    }
    const safeParams = toSafeParams(params);
    target.search = safeParams.toString();
    return { ok: true, url: target.toString(), definition };
  }

  async get(apiId, pathname, params = {}, { signal, timeoutMs, cacheTtlMs } = {}) {
    const built = this._buildUrl(apiId, pathname, params);
    const startedAt = this.now();
    if (!built.ok) {
      return {
        ok: false,
        apiId,
        status: "ERROR",
        code: built.code,
        data: null,
        latencyMs: this.now() - startedAt,
        fromCache: false,
      };
    }

    const ttl = Math.min(24 * 60 * 60 * 1000, Math.max(0, Number(cacheTtlMs ?? built.definition.defaultCacheTtlMs) || 0));
    const cacheKey = `${apiId}:${built.url}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > this.now()) {
      return {
        ok: true,
        apiId,
        status: "AVAILABLE",
        code: "CACHE_HIT",
        data: cloneValue(cached.data),
        requestedUrl: built.url,
        fetchedAt: cached.fetchedAt,
        latencyMs: this.now() - startedAt,
        fromCache: true,
      };
    }

    if (typeof this.fetchImpl !== "function") {
      return {
        ok: false,
        apiId,
        status: "UNAVAILABLE",
        code: "FETCH_NOT_CONFIGURED",
        data: null,
        requestedUrl: built.url,
        latencyMs: this.now() - startedAt,
        fromCache: false,
      };
    }

    const controller = new AbortController();
    const boundedTimeout = Math.min(30000, Math.max(250, Number(timeoutMs) || this.defaultTimeoutMs));
    let timer;
    const onCallerAbort = () => controller.abort();
    if (signal) signal.addEventListener("abort", onCallerAbort, { once: true });
    timer = setTimeout(() => controller.abort(), boundedTimeout);

    try {
      const response = await this.fetchImpl(built.url, {
        method: "GET",
        headers: {
          accept: "application/json",
          "user-agent": "StudentHub-PublicSourceHub/1.0 (+https://studenthub.vn)",
        },
        redirect: "error",
        signal: controller.signal,
      });
      const statusCode = Number(response?.status || 0);
      if (!response?.ok && !(statusCode >= 200 && statusCode < 300)) {
        const failure = classifyHttpFailure(statusCode || 599);
        return {
          ok: false,
          apiId,
          status: failure.status,
          code: failure.code,
          retryAfterMs: safeRetryAfter(response?.headers),
          data: null,
          requestedUrl: built.url,
          latencyMs: this.now() - startedAt,
          fromCache: false,
        };
      }

      const advertisedLength = Number(response?.headers?.get?.("content-length") || 0);
      if (advertisedLength > this.maxResponseBytes) {
        return {
          ok: false,
          apiId,
          status: "ERROR",
          code: "UPSTREAM_BODY_TOO_LARGE",
          data: null,
          requestedUrl: built.url,
          latencyMs: this.now() - startedAt,
          fromCache: false,
        };
      }

      const rawBody = typeof response.text === "function"
        ? await response.text()
        : JSON.stringify(await response.json());
      if (new TextEncoder().encode(rawBody).byteLength > this.maxResponseBytes) {
        return {
          ok: false,
          apiId,
          status: "ERROR",
          code: "UPSTREAM_BODY_TOO_LARGE",
          data: null,
          requestedUrl: built.url,
          latencyMs: this.now() - startedAt,
          fromCache: false,
        };
      }

      let data;
      try {
        data = JSON.parse(rawBody);
      } catch {
        return {
          ok: false,
          apiId,
          status: "ERROR",
          code: "UPSTREAM_INVALID_JSON",
          data: null,
          requestedUrl: built.url,
          latencyMs: this.now() - startedAt,
          fromCache: false,
        };
      }

      const fetchedAt = new Date(this.now()).toISOString();
      if (ttl > 0) this.cache.set(cacheKey, { data: cloneValue(data), fetchedAt, expiresAt: this.now() + ttl });
      return {
        ok: true,
        apiId,
        status: "AVAILABLE",
        code: "OK",
        data,
        requestedUrl: built.url,
        fetchedAt,
        latencyMs: this.now() - startedAt,
        fromCache: false,
      };
    } catch {
      const code = signal?.aborted
        ? "REQUEST_CANCELLED"
        : controller.signal.aborted
          ? "UPSTREAM_TIMEOUT"
          : "UPSTREAM_NETWORK_ERROR";
      return {
        ok: false,
        apiId,
        status: code === "REQUEST_CANCELLED" ? "CANCELLED" : "UNAVAILABLE",
        code,
        data: null,
        requestedUrl: built.url,
        latencyMs: this.now() - startedAt,
        fromCache: false,
      };
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onCallerAbort);
    }
  }
}
