import { PUBLIC_API_ID } from "./PublicApiRegistry.js";
import { PublicApiClient } from "./PublicApiClient.js";

function boundedText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function boundedLimit(value, fallback = 10) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(20, Math.max(1, parsed)) : fallback;
}

function safeUrl(value) {
  try {
    const candidate = new URL(String(value || ""));
    return /^https?:$/.test(candidate.protocol) && candidate.hostname ? candidate.toString() : null;
  } catch {
    return null;
  }
}

function hashText(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeSeenDate(value) {
  const raw = boundedText(value, 40);
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    const candidate = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    if (!Number.isNaN(Date.parse(candidate))) return candidate;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function normalizeArticle(article) {
  const url = safeUrl(article?.url || article?.url_mobile);
  if (!url) return null;
  const title = boundedText(article?.title, 500) || "Untitled news result";
  const seenDate = normalizeSeenDate(article?.seendate || article?.seenDate);
  const domain = new URL(url).hostname;
  return {
    recordType: "DISCOVERY_ARTICLE",
    sourceId: `gdelt:${hashText(url)}`,
    title,
    url,
    domain,
    publisher: boundedText(article?.domain, 180) || domain,
    publishedAt: seenDate,
    sourceType: "SECONDARY_NEWS_DISCOVERY",
    authorityTier: "SECONDARY_DISCOVERY",
    isPrimary: false,
    isAuthoritative: false,
    content: title,
    metadata: {
      language: boundedText(article?.language, 40) || null,
      sourceCountry: boundedText(article?.sourcecountry, 80) || null,
      seenDate,
      sourceCollection: boundedText(article?.sourcecollection, 80) || null,
      socialImageUrl: safeUrl(article?.socialimage),
      sourceProvider: "GDELT_DOC",
    },
  };
}

export class GdeltAdapter {
  constructor({ client = new PublicApiClient() } = {}) {
    this.client = client;
    this.apiId = PUBLIC_API_ID.GDELT_DOC;
  }

  async searchArticles({ query = "", timespan = "1week", limit = 10, signal } = {}) {
    const search = boundedText(query, 180);
    if (search.length < 2) return this._invalid("DISCOVERY_QUERY_REQUIRED");
    const safeTimespan = /^(?:\d{1,3}(?:hour|hours|day|days|week|weeks|month|months)|\d{8}-\d{8})$/i.test(String(timespan || ""))
      ? String(timespan)
      : "1week";
    const response = await this.client.get(this.apiId, "/api/v2/doc/doc", {
      query: search,
      mode: "artlist",
      format: "json",
      maxrecords: boundedLimit(limit),
      timespan: safeTimespan,
      sort: "HybridRel",
    }, { signal });

    if (!response.ok) return {
      ok: false,
      provider: this.apiId,
      providerStatus: response.status,
      code: response.code,
      query: search,
      records: [],
      total: 0,
      provenance: this._provenance(response),
    };

    const records = (Array.isArray(response.data?.articles) ? response.data.articles : [])
      .map(normalizeArticle)
      .filter(Boolean)
      .slice(0, boundedLimit(limit));
    return {
      ok: true,
      provider: this.apiId,
      providerStatus: "AVAILABLE",
      code: response.code,
      query: search,
      records,
      total: records.length,
      provenance: this._provenance(response),
    };
  }

  _invalid(code) {
    return { ok: false, provider: this.apiId, providerStatus: "ERROR", code, query: "", records: [], total: 0, provenance: { sourceState: "NOT_CALLED", providerId: this.apiId, isAuthoritative: false } };
  }

  _provenance(response) {
    return {
      sourceState: response.ok ? "SECONDARY_DISCOVERY" : response.status,
      providerId: this.apiId,
      requestedUrl: response.requestedUrl || null,
      fetchedAt: response.fetchedAt || null,
      fromCache: response.fromCache === true,
      isAuthoritative: false,
      dataNotice: "GDELT chỉ hỗ trợ discovery tin thứ cấp; mỗi bài phải được mở và xác minh nguồn gốc trước khi dùng cho quyết định.",
    };
  }
}
