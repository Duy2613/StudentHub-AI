/**
 * StudentHub AI — URLhaus (abuse.ch) Threat Intelligence Client
 * 
 * Interacts with URLhaus Community API (https://urlhaus-api.abuse.ch/v1/)
 * Checks live malicious URLs, payloads, malware distribution sites, and phishing hosts.
 * Includes timeout protection (2.5s), local cache, rate limiting, and zero-fabrication status mapping.
 */

import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";

export const URLHAUS_STATUS = {
  KNOWN_MALICIOUS: "KNOWN_MALICIOUS",
  NO_KNOWN_THREAT: "NO_KNOWN_THREAT",
  API_UNAVAILABLE: "API_UNAVAILABLE",
  RATE_LIMITED: "RATE_LIMITED",
  INVALID_INPUT: "INVALID_INPUT",
};

// In-memory LRU-like cache for queried URLs/domains to avoid rate limits
const URLHAUS_CACHE = new Map();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes
const MAX_CACHE_ENTRIES = 5_000;

function cacheResult(cacheKey, data) {
  if (!URLHAUS_CACHE.has(cacheKey) && URLHAUS_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = URLHAUS_CACHE.keys().next().value;
    if (oldestKey) URLHAUS_CACHE.delete(oldestKey);
  }
  URLHAUS_CACHE.set(cacheKey, { timestamp: Date.now(), data });
}

/**
 * Normalizes input URL/Host for threat query
 */
export function normalizeUrlForQuery(rawInput = "") {
  if (!rawInput || typeof rawInput !== "string") return null;
  const trimmed = rawInput.trim();
  try {
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const parsed = new URL(hasProtocol ? trimmed : `https://${trimmed}`);
    return {
      fullUrl: parsed.href,
      hostname: parsed.hostname.toLowerCase(),
      isIp: /^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname),
    };
  } catch {
    return {
      fullUrl: trimmed,
      hostname: trimmed.toLowerCase(),
      isIp: false,
    };
  }
}

/**
 * Queries URLhaus API for a specific URL
 * @param {string} targetUrl
 * @param {object} options
 * @returns {Promise<{ status: string, isMalicious: boolean, threatType: string|null, tags: string[], reference: string|null, latencyMs: number, source: string }>}
 */
export async function queryUrlhausUrl(targetUrl, { timeoutMs = 2500 } = {}) {
  const startTime = performance.now();
  const normalized = normalizeUrlForQuery(targetUrl);

  if (!normalized?.fullUrl) {
    return {
      status: URLHAUS_STATUS.INVALID_INPUT,
      isMalicious: false,
      threatType: null,
      tags: [],
      reference: null,
      latencyMs: 0,
      source: "URLHAUS_ABUSE_CH",
    };
  }

  // Never forward loopback, private, metadata, or non-HTTP targets to a
  // third-party threat feed. This is both an SSRF boundary and a data-egress
  // boundary for user-supplied URLs.
  if (!validateRemoteUrlSync(normalized.fullUrl).ok) {
    return {
      status: URLHAUS_STATUS.INVALID_INPUT,
      isMalicious: false,
      threatType: null,
      tags: [],
      reference: null,
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
      source: "URLHAUS_ABUSE_CH",
    };
  }

  // Check in-memory cache first
  const cacheKey = `url:${normalized.fullUrl}`;
  const cached = URLHAUS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.data,
      isCached: true,
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
    };
  }

  let timeoutId = null;
  try {
    const controller = new AbortController();
    const boundedTimeout = Math.min(Math.max(Number(timeoutMs) || 2500, 250), 10000);
    timeoutId = setTimeout(() => controller.abort(), boundedTimeout);

    const formData = new URLSearchParams();
    formData.append("url", normalized.fullUrl);

    const response = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    timeoutId = null;

    if (!response.ok) {
      if (response.status === 429) {
        clearTimeout(timeoutId);
        timeoutId = null;
        return {
          status: URLHAUS_STATUS.RATE_LIMITED,
          isMalicious: false,
          threatType: null,
          tags: [],
          reference: null,
          latencyMs: Number((performance.now() - startTime).toFixed(2)),
          source: "URLHAUS_ABUSE_CH",
        };
      }
      throw new Error(`HTTP Error ${response.status}`);
    }

    const raw = await response.arrayBuffer();
    if (raw.byteLength > 1 * 1024 * 1024) throw new Error("URLhaus response exceeded the size limit");
    const data = JSON.parse(new TextDecoder().decode(raw));
    const isMalicious = data.query_status === "ok" && data.url_status !== "offline";

    const result = {
      status: isMalicious ? URLHAUS_STATUS.KNOWN_MALICIOUS : URLHAUS_STATUS.NO_KNOWN_THREAT,
      isMalicious,
      threatType: isMalicious ? (data.threat || "MALWARE_DISTRIBUTION") : null,
      tags: Array.isArray(data.tags) ? data.tags.filter(tag => typeof tag === "string").slice(0, 50) : [],
      urlStatus: data.url_status || null,
      reference: data.urlhaus_reference || null,
      firstSeen: data.date_added || null,
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
      source: "URLHAUS_ABUSE_CH",
    };

    // Cache successful response
    cacheResult(cacheKey, result);
    return result;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    // Graceful offline fallback
    const latencyMs = Number((performance.now() - startTime).toFixed(2));
    return {
      status: URLHAUS_STATUS.API_UNAVAILABLE,
      isMalicious: false,
      threatType: null,
      tags: [],
      reference: null,
      errorNotice: err?.name === "AbortError" ? "TIMEOUT_EXCEEDED" : "NETWORK_ERROR",
      latencyMs,
      source: "URLHAUS_ABUSE_CH",
    };
  }
}

/**
 * Queries URLhaus API for a host/domain
 */
export async function queryUrlhausHost(targetHost, { timeoutMs = 2500 } = {}) {
  const startTime = performance.now();
  const normalized = normalizeUrlForQuery(targetHost);

  if (!normalized?.hostname) {
    return {
      status: URLHAUS_STATUS.INVALID_INPUT,
      isMalicious: false,
      urlCount: 0,
      latencyMs: 0,
      source: "URLHAUS_ABUSE_CH",
    };
  }

  if (!validateRemoteUrlSync(`https://${normalized.hostname}`).ok) {
    return {
      status: URLHAUS_STATUS.INVALID_INPUT,
      isMalicious: false,
      urlCount: 0,
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
      source: "URLHAUS_ABUSE_CH",
    };
  }

  const cacheKey = `host:${normalized.hostname}`;
  const cached = URLHAUS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.data,
      isCached: true,
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
    };
  }

  let timeoutId = null;
  try {
    const controller = new AbortController();
    const boundedTimeout = Math.min(Math.max(Number(timeoutMs) || 2500, 250), 10000);
    timeoutId = setTimeout(() => controller.abort(), boundedTimeout);

    const formData = new URLSearchParams();
    formData.append("host", normalized.hostname);

    const response = await fetch("https://urlhaus-api.abuse.ch/v1/host/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    timeoutId = null;

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const raw = await response.arrayBuffer();
    if (raw.byteLength > 1 * 1024 * 1024) throw new Error("URLhaus response exceeded the size limit");
    const data = JSON.parse(new TextDecoder().decode(raw));
    const isMalicious = data.query_status === "ok" && Array.isArray(data.urls) && data.urls.length > 0;

    const result = {
      status: isMalicious ? URLHAUS_STATUS.KNOWN_MALICIOUS : URLHAUS_STATUS.NO_KNOWN_THREAT,
      isMalicious,
      urlCount: Array.isArray(data.urls) ? data.urls.length : 0,
      activeMalwareUrls: isMalicious ? data.urls.filter((u) => u.url_status === "online").length : 0,
      firstSeen: data.firstseen || null,
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
      source: "URLHAUS_ABUSE_CH",
    };

    cacheResult(cacheKey, result);
    return result;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      status: URLHAUS_STATUS.API_UNAVAILABLE,
      isMalicious: false,
      urlCount: 0,
      errorNotice: err?.name === "AbortError" ? "TIMEOUT_EXCEEDED" : "NETWORK_ERROR",
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
      source: "URLHAUS_ABUSE_CH",
    };
  }
}
