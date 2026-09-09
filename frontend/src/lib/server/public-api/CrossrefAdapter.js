import { PUBLIC_API_ID } from "./PublicApiRegistry.js";
import { PublicApiClient } from "./PublicApiClient.js";

const CROSSREF_SELECT = [
  "DOI", "title", "published", "author", "container-title", "URL", "type",
  "update-to", "updated-by", "license", "is-referenced-by-count",
].join(",");

function boundedText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function boundedLimit(value, fallback = 10) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(20, Math.max(1, parsed)) : fallback;
}

function safeYear(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2200 ? parsed : null;
}

function safeUrl(value, fallback) {
  try {
    const candidate = new URL(String(value || fallback));
    return /^https?:$/.test(candidate.protocol) ? candidate.toString() : fallback;
  } catch {
    return fallback;
  }
}

function workDate(work) {
  const dateParts = work?.published?.["date-parts"]?.[0];
  if (!Array.isArray(dateParts) || !dateParts[0]) return null;
  const year = Number(dateParts[0]);
  const month = Number(dateParts[1] || 1);
  const day = Number(dateParts[2] || 1);
  return Number.isInteger(year) ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
}

function normalizeWork(work, index) {
  const doi = boundedText(work?.DOI, 240);
  const sourceId = doi ? `crossref:${doi.toLowerCase()}` : `crossref:record-${index + 1}`;
  const title = boundedText(Array.isArray(work?.title) ? work.title[0] : work?.title, 500) || "Untitled Crossref work";
  const url = safeUrl(work?.URL, doi ? `https://doi.org/${encodeURIComponent(doi)}` : "https://api.crossref.org/");
  const authors = (Array.isArray(work?.author) ? work.author : [])
    .map((author) => [boundedText(author?.given, 100), boundedText(author?.family, 140)].filter(Boolean).join(" "))
    .filter(Boolean)
    .slice(0, 8);
  const containers = (Array.isArray(work?.["container-title"]) ? work["container-title"] : [])
    .map((value) => boundedText(value, 180))
    .filter(Boolean)
    .slice(0, 4);
  const updates = [
    ...(Array.isArray(work?.update) ? work.update : []),
    ...(Array.isArray(work?.["update-to"]) ? work["update-to"] : []),
    ...(Array.isArray(work?.["updated-by"]) ? work["updated-by"] : []),
  ]
    .map((entry) => boundedText(entry?.label || entry?.type, 120))
    .filter(Boolean)
    .slice(0, 8);

  return {
    recordType: "RESEARCH_WORK",
    sourceId,
    title,
    url,
    domain: new URL(url).hostname,
    publisher: containers[0] || "Crossref registered publisher",
    publishedAt: workDate(work),
    sourceType: "ACADEMIC_METADATA",
    authorityTier: "DOI_REGISTRY",
    isPrimary: false,
    isAuthoritative: false,
    content: [title, containers.join(" ")].filter(Boolean).join(" — ").slice(0, 1000),
    metadata: {
      doi: doi || null,
      type: boundedText(work?.type, 80) || null,
      authors,
      containers,
      referencedByCount: Number.isFinite(Number(work?.["is-referenced-by-count"])) ? Number(work["is-referenced-by-count"]) : 0,
      updateLabels: updates,
      hasRetractionSignal: updates.some((value) => /retract|withdraw/i.test(value)),
      licenses: (Array.isArray(work?.license) ? work.license : []).map((entry) => boundedText(entry?.URL || entry?.contentVersion, 240)).filter(Boolean).slice(0, 4),
      sourceProvider: "CROSSREF",
    },
  };
}

export class CrossrefAdapter {
  constructor({ client = new PublicApiClient(), mailto = process.env.CROSSREF_MAILTO || "" } = {}) {
    this.client = client;
    this.apiId = PUBLIC_API_ID.CROSSREF;
    this.mailto = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(mailto)) ? String(mailto).slice(0, 160) : "";
  }

  async searchWorks({ query = "", fromYear, toYear, limit = 10, signal } = {}) {
    const search = boundedText(query, 180);
    if (search.length < 2) return this._invalid("RESEARCH_QUERY_REQUIRED");
    const from = safeYear(fromYear);
    const to = safeYear(toYear);
    const filters = [];
    if (from) filters.push(`from-pub-date:${from}-01-01`);
    if (to) filters.push(`until-pub-date:${to}-12-31`);
    const response = await this.client.get(this.apiId, "/works", {
      query: search,
      rows: boundedLimit(limit),
      select: CROSSREF_SELECT,
      ...(filters.length ? { filter: filters.join(",") } : {}),
      ...(this.mailto ? { mailto: this.mailto } : {}),
    }, { signal });

    if (!response.ok) return this._failure(response, search);
    const records = (Array.isArray(response.data?.message?.items) ? response.data.message.items : [])
      .map(normalizeWork)
      .filter(Boolean);
    return {
      ok: true,
      provider: this.apiId,
      providerStatus: "AVAILABLE",
      code: response.code,
      query: search,
      records,
      total: Number.isFinite(Number(response.data?.message?.["total-results"])) ? Number(response.data.message["total-results"]) : records.length,
      provenance: this._provenance(response),
    };
  }

  async getWorkByDoi(doi, { signal } = {}) {
    const cleanDoi = boundedText(doi, 240).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
    if (!/^10\.\d{4,9}\/\S+$/i.test(cleanDoi)) return this._invalid("DOI_INVALID");
    const response = await this.client.get(this.apiId, `/works/${encodeURIComponent(cleanDoi)}`, this.mailto ? { mailto: this.mailto } : {}, { signal });
    if (!response.ok) return this._failure(response, cleanDoi);
    const record = normalizeWork(response.data?.message || {}, 0);
    return {
      ok: true,
      provider: this.apiId,
      providerStatus: "AVAILABLE",
      code: response.code,
      query: cleanDoi,
      records: record ? [record] : [],
      total: record ? 1 : 0,
      provenance: this._provenance(response),
    };
  }

  _failure(response, query) {
    return {
      ok: false,
      provider: this.apiId,
      providerStatus: response.status,
      code: response.code,
      query,
      records: [],
      total: 0,
      provenance: this._provenance(response),
    };
  }

  _invalid(code) {
    return { ok: false, provider: this.apiId, providerStatus: "ERROR", code, query: "", records: [], total: 0, provenance: { sourceState: "NOT_CALLED", isAuthoritative: false } };
  }

  _provenance(response) {
    return {
      sourceState: response.ok ? "PUBLIC_API_METADATA" : response.status,
      providerId: this.apiId,
      requestedUrl: response.requestedUrl || null,
      fetchedAt: response.fetchedAt || null,
      fromCache: response.fromCache === true,
      isAuthoritative: false,
      dataNotice: "Crossref cung cấp metadata DOI do publisher/trusted sources gửi; không thay thế văn bản chính thức của trường hay cơ quan.",
    };
  }
}
