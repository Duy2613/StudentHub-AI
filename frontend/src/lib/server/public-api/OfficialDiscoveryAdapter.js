import { createHash } from "node:crypto";
import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import { OFFICIAL_DISCOVERY_SOURCES } from "./PublicApiRegistry.js";

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_RESPONSE_BYTES = 512 * 1024;
const MAX_CANDIDATES_PER_SOURCE = 120;

function boundedText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function digest(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(value) {
  return decodeEntities(String(value || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)[\s\S])*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)[\s\S])*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function safeUrl(value, baseUrl) {
  try {
    const parsed = new URL(String(value || ""), baseUrl);
    if (!/^https?:$/.test(parsed.protocol) || !validateRemoteUrlSync(parsed.toString()).ok) return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

function isEducationOrGovernmentDomain(hostname) {
  const normalized = String(hostname || "").toLowerCase().replace(/\.+$/, "");
  return normalized.endsWith(".edu.vn") || normalized.endsWith(".gov.vn") || normalized === "edu.vn" || normalized === "gov.vn";
}

function extractTitle(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html || "");
  return boundedText(stripHtml(match?.[1] || ""), 300) || "Official discovery source";
}

function extractLinkedCandidates(html, source, retrievedAt, pageDigest) {
  const candidates = [];
  const seen = new Set();
  const anchorPattern = /<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html || "")) && candidates.length < MAX_CANDIDATES_PER_SOURCE) {
    const url = safeUrl(decodeEntities(match[2]), source.canonicalUrl);
    if (!url) continue;
    const parsed = new URL(url);
    if (!isEducationOrGovernmentDomain(parsed.hostname)) continue;
    const title = boundedText(stripHtml(match[3]), 240) || parsed.hostname;
    if (title.length < 2) continue;
    const key = `${parsed.hostname.toLowerCase()}::${title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const candidateId = `official-discovery:${digest(`${source.sourceId}:${url}:${title}`).slice(0, 16)}`;
    candidates.push({
      recordType: "OFFICIAL_ENTITY_DISCOVERY",
      sourceId: candidateId,
      title,
      canonicalUrl: url,
      domain: parsed.hostname.toLowerCase(),
      publisher: source.publisher,
      publishedAt: null,
      retrievedAt,
      sourceType: "OFFICIAL_DISCOVERY_SEED",
      authorityTier: source.authorityTier,
      isPrimary: false,
      isAuthoritative: false,
      discoveryOnly: true,
      officialDiscovery: true,
      retrievalMethod: "OFFICIAL_DISCOVERY_ADAPTER",
      retrievalProvider: "MOET_OFFICIAL_DISCOVERY",
      contentDigest: pageDigest,
      rawContentSnippet: title,
      parserVersion: "official-discovery-link-text-v1",
      piiClassification: "REDACTED_PUBLIC",
      correctionChain: [],
      independenceKey: source.domain,
      claimRelations: {},
      metadata: {
        discoverySourceId: source.sourceId,
        discoverySourceUrl: source.canonicalUrl,
        extractedFieldSet: ["title", "domain", "canonicalUrl"],
        legalAndProvenance: "SEPARATE_REVIEW_REQUIRED",
        canAuthorizeTrustVerdict: false,
      },
    });
  }
  return candidates;
}

function failure(provider, sourceId, code, extra = {}) {
  return {
    ok: false,
    provider,
    sourceId,
    providerStatus: code === "RATE_LIMITED" ? "RATE_LIMITED" : code === "NOT_FOUND" ? "ERROR" : "UNAVAILABLE",
    code,
    records: [],
    total: 0,
    ...extra,
    provenance: {
      sourceState: "OFFICIAL_DISCOVERY_UNAVAILABLE",
      providerId: provider,
      sourceId,
      isAuthoritative: false,
      legalAndProvenance: "SEPARATE_REVIEW_REQUIRED",
    },
  };
}

export class OfficialDiscoveryAdapter {
  constructor({
    fetchImpl = globalThis.fetch,
    now = () => Date.now(),
    sources = OFFICIAL_DISCOVERY_SOURCES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES,
  } = {}) {
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.sources = Array.isArray(sources) ? sources.map((source) => ({ ...source })) : [];
    this.timeoutMs = Math.min(30000, Math.max(250, Number(timeoutMs) || DEFAULT_TIMEOUT_MS));
    this.maxResponseBytes = Math.min(2 * 1024 * 1024, Math.max(1024, Number(maxResponseBytes) || DEFAULT_MAX_RESPONSE_BYTES));
    this.provider = "MOET_OFFICIAL_DISCOVERY";
  }

  async fetchSource(sourceId, { signal } = {}) {
    const source = this.sources.find((entry) => entry.sourceId === sourceId);
    if (!source) return failure(this.provider, sourceId, "UNKNOWN_OFFICIAL_DISCOVERY_SOURCE", { providerStatus: "ERROR" });
    const staticUrl = validateRemoteUrlSync(source.canonicalUrl);
    if (!staticUrl.ok || new URL(source.canonicalUrl).hostname.toLowerCase() !== String(source.domain).toLowerCase()) {
      return failure(this.provider, sourceId, "OFFICIAL_SOURCE_URL_REJECTED", { providerStatus: "ERROR" });
    }
    if (typeof this.fetchImpl !== "function") return failure(this.provider, sourceId, "FETCH_NOT_CONFIGURED");

    const startedAt = this.now();
    const controller = new AbortController();
    const onCallerAbort = () => controller.abort();
    if (signal) signal.addEventListener("abort", onCallerAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(source.canonicalUrl, {
        method: "GET",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "StudentHub-OfficialDiscovery/1.0 (+https://studenthub.vn)",
        },
        redirect: "error",
        signal: controller.signal,
      });
      const statusCode = Number(response?.status || 0);
      if (!response?.ok && !(statusCode >= 200 && statusCode < 300)) {
        return failure(this.provider, sourceId, statusCode === 429 ? "RATE_LIMITED" : statusCode === 404 ? "NOT_FOUND" : `UPSTREAM_HTTP_${statusCode || 599}`, {
          providerStatus: statusCode === 429 ? "RATE_LIMITED" : statusCode >= 500 || !statusCode ? "UNAVAILABLE" : "ERROR",
          latencyMs: this.now() - startedAt,
        });
      }
      const advertisedLength = Number(response?.headers?.get?.("content-length") || 0);
      if (advertisedLength > this.maxResponseBytes) return failure(this.provider, sourceId, "UPSTREAM_BODY_TOO_LARGE", { providerStatus: "ERROR" });
      const rawHtml = typeof response.text === "function" ? await response.text() : "";
      if (new TextEncoder().encode(rawHtml).byteLength > this.maxResponseBytes) return failure(this.provider, sourceId, "UPSTREAM_BODY_TOO_LARGE", { providerStatus: "ERROR" });

      const visibleText = stripHtml(rawHtml).slice(0, 50000);
      const pageDigest = digest(visibleText);
      const pageTitle = extractTitle(rawHtml);
      const retrievedAt = new Date(this.now()).toISOString();
      const records = extractLinkedCandidates(rawHtml, source, retrievedAt, pageDigest);
      return {
        ok: true,
        provider: this.provider,
        sourceId,
        providerStatus: "AVAILABLE",
        code: "OK",
        records,
        total: records.length,
        source: {
          sourceId: source.sourceId,
          title: source.title,
          publisher: source.publisher,
          domain: source.domain,
          canonicalUrl: source.canonicalUrl,
          authorityTier: source.authorityTier,
          pageTitle,
          sourceState: "OFFICIAL_DISCOVERY_FETCHED",
          isAuthoritative: false,
          canAuthorizeTrustVerdict: false,
          retrievedAt,
          contentDigest: pageDigest,
          extractedCandidateCount: records.length,
          rawContentStored: false,
          legalAndProvenance: "SEPARATE_REVIEW_REQUIRED",
        },
        provenance: {
          sourceState: "OFFICIAL_DISCOVERY_FETCHED",
          providerId: this.provider,
          sourceId,
          fetchedAt: retrievedAt,
          latencyMs: this.now() - startedAt,
          isAuthoritative: false,
          legalAndProvenance: "SEPARATE_REVIEW_REQUIRED",
          dataNotice: "Chỉ trích xuất link text/tên miền tối thiểu để discovery; không lưu HTML thô và không cấp quyền kết luận Trust.",
        },
      };
    } catch {
      const code = signal?.aborted ? "REQUEST_CANCELLED" : controller.signal.aborted ? "UPSTREAM_TIMEOUT" : "UPSTREAM_NETWORK_ERROR";
      return failure(this.provider, sourceId, code, { providerStatus: code === "REQUEST_CANCELLED" ? "CANCELLED" : "UNAVAILABLE" });
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onCallerAbort);
    }
  }

  async discoverAll({ sourceIds = this.sources.map((source) => source.sourceId), signal } = {}) {
    const boundedSourceIds = [...new Set((Array.isArray(sourceIds) ? sourceIds : []).slice(0, 4))];
    const results = await Promise.all(boundedSourceIds.map((sourceId) => this.fetchSource(sourceId, { signal })));
    const successful = results.filter((result) => result.ok);
    const records = successful.flatMap((result) => result.records || []);
    return {
      ok: successful.length > 0,
      status: successful.length === results.length ? "AVAILABLE" : successful.length > 0 ? "PARTIAL" : "UNAVAILABLE",
      provider: this.provider,
      providerStatus: successful.length === results.length ? "AVAILABLE" : successful.length > 0 ? "PARTIAL" : "UNAVAILABLE",
      sources: results.map((result) => {
        const withoutRecords = { ...result };
        delete withoutRecords.records;
        return withoutRecords;
      }),
      records,
      total: records.length,
      provenance: {
        sourceState: successful.length > 0 ? "OFFICIAL_DISCOVERY_FETCHED" : "OFFICIAL_DISCOVERY_UNAVAILABLE",
        providerId: this.provider,
        sourceIds: boundedSourceIds,
        isAuthoritative: false,
        legalAndProvenance: "SEPARATE_REVIEW_REQUIRED",
        dataNotice: "Official pages are used as bounded entity-discovery seeds only; a separate evidence/provenance review is required.",
      },
    };
  }
}
