import { PUBLIC_API_ID } from "./PublicApiRegistry.js";
import { PublicApiClient } from "./PublicApiClient.js";

const OPENALEX_WORK_FIELDS = [
  "id", "doi", "title", "publication_year", "publication_date", "type",
  "authorships", "primary_location", "open_access", "topics", "cited_by_count",
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

function normalizeWork(work, index) {
  const openAlexId = boundedText(work?.id, 240) || `unknown-${index + 1}`;
  const title = boundedText(work?.title, 500) || "Untitled scholarly work";
  const fallback = `https://openalex.org/${openAlexId.split("/").pop()}`;
  const url = safeUrl(work?.doi || work?.primary_location?.landing_page_url || work?.id, fallback);
  const authors = (Array.isArray(work?.authorships) ? work.authorships : [])
    .map((entry) => boundedText(entry?.author?.display_name, 180))
    .filter(Boolean)
    .slice(0, 8);
  const institutions = (Array.isArray(work?.authorships) ? work.authorships : [])
    .flatMap((entry) => Array.isArray(entry?.institutions) ? entry.institutions : [])
    .map((entry) => boundedText(entry?.display_name, 180))
    .filter(Boolean)
    .slice(0, 8);
  const topics = (Array.isArray(work?.topics) ? work.topics : [])
    .map((entry) => boundedText(entry?.display_name, 180))
    .filter(Boolean)
    .slice(0, 8);
  const sourceName = boundedText(work?.primary_location?.source?.display_name, 180);

  return {
    recordType: "RESEARCH_WORK",
    sourceId: `openalex:${openAlexId.split("/").pop()}`,
    title,
    url,
    domain: new URL(url).hostname,
    publisher: sourceName || "OpenAlex indexed source",
    publishedAt: work?.publication_date || (work?.publication_year ? `${work.publication_year}-01-01` : null),
    sourceType: "ACADEMIC_METADATA",
    authorityTier: "ACADEMIC_INDEX",
    isPrimary: false,
    isAuthoritative: false,
    content: [title, sourceName, topics.join(" ")].filter(Boolean).join(" — ").slice(0, 1000),
    metadata: {
      openAlexId,
      doi: boundedText(work?.doi, 240) || null,
      type: boundedText(work?.type, 80) || null,
      authors,
      institutions,
      topics,
      citedByCount: Number.isFinite(Number(work?.cited_by_count)) ? Number(work.cited_by_count) : 0,
      openAccess: work?.open_access?.is_oa === true,
      sourceProvider: "OPENALEX",
    },
  };
}

function normalizeEntity(entity, recordType, index) {
  const id = boundedText(entity?.id, 240) || `unknown-${index + 1}`;
  const title = boundedText(entity?.display_name, 300) || "OpenAlex entity";
  const fallback = `https://openalex.org/${id.split("/").pop()}`;
  const homepage = recordType === "RESEARCH_INSTITUTION"
    ? safeUrl(entity?.homepage_url || entity?.homepage, null)
    : null;
  const isInstitution = recordType === "RESEARCH_INSTITUTION";
  const url = homepage || safeUrl(entity?.id, fallback);
  return {
    recordType,
    sourceId: `openalex:${id.split("/").pop()}`,
    title,
    url,
    domain: new URL(url).hostname,
    publisher: "OpenAlex",
    publishedAt: null,
    sourceType: "ACADEMIC_METADATA",
    authorityTier: "ACADEMIC_INDEX",
    isPrimary: false,
    isAuthoritative: false,
    ...(isInstitution ? {
      discoveryOnly: true,
      allowedUse: "ENTITY_DISCOVERY_ONLY",
      retrievalMethod: "PUBLIC_API_DISCOVERY",
      retrievalProvider: "OPENALEX",
    } : {}),
    content: title,
    metadata: {
      openAlexId: id,
      worksCount: Number.isFinite(Number(entity?.works_count)) ? Number(entity.works_count) : null,
      citedByCount: Number.isFinite(Number(entity?.cited_by_count)) ? Number(entity.cited_by_count) : null,
      countryCode: boundedText(entity?.country_code, 8) || null,
      homepage,
      sourceProvider: "OPENALEX",
    },
  };
}

export class OpenAlexAdapter {
  constructor({ client = new PublicApiClient() } = {}) {
    this.client = client;
    this.apiId = PUBLIC_API_ID.OPENALEX;
  }

  async searchWorks({ query = "", institution = "", topic = "", fromYear, toYear, limit = 10, signal } = {}) {
    const search = [query, institution, topic].map((value) => boundedText(value, 160)).filter(Boolean).join(" ");
    if (search.length < 2) return this._invalid("RESEARCH_QUERY_REQUIRED");

    const from = safeYear(fromYear);
    const to = safeYear(toYear);
    const filters = [];
    if (from) filters.push(`from_publication_date:${from}-01-01`);
    if (to) filters.push(`to_publication_date:${to}-12-31`);
    const response = await this.client.get(this.apiId, "/works", {
      search,
      "per-page": boundedLimit(limit),
      select: OPENALEX_WORK_FIELDS,
      ...(filters.length ? { filter: filters.join(",") } : {}),
    }, { signal });

    return this._normalizeCollection(response, "RESEARCH_WORK", (entry, index) => normalizeWork(entry, index), search);
  }

  async searchInstitutions({ query = "", limit = 10, signal } = {}) {
    const search = boundedText(query, 160);
    if (search.length < 2) return this._invalid("INSTITUTION_QUERY_REQUIRED");
    const response = await this.client.get(this.apiId, "/institutions", {
      search,
      "per-page": boundedLimit(limit),
      select: "id,display_name,country_code,homepage_url,works_count,cited_by_count",
    }, { signal });
    return this._normalizeCollection(response, "RESEARCH_INSTITUTION", (entry, index) => normalizeEntity(entry, "RESEARCH_INSTITUTION", index), search);
  }

  async searchTopics({ query = "", limit = 10, signal } = {}) {
    const search = boundedText(query, 160);
    if (search.length < 2) return this._invalid("TOPIC_QUERY_REQUIRED");
    const response = await this.client.get(this.apiId, "/topics", {
      search,
      "per-page": boundedLimit(limit),
      select: "id,display_name,subfield,field,domain,works_count",
    }, { signal });
    return this._normalizeCollection(response, "RESEARCH_TOPIC", (entry, index) => normalizeEntity(entry, "RESEARCH_TOPIC", index), search);
  }

  async _normalizeCollection(response, recordType, mapper, query) {
    if (!response.ok) {
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
    const records = (Array.isArray(response.data?.results) ? response.data.results : [])
      .map(mapper)
      .filter(Boolean);
    return {
      ok: true,
      provider: this.apiId,
      providerStatus: "AVAILABLE",
      code: response.code,
      query,
      records,
      total: Number.isFinite(Number(response.data?.meta?.count)) ? Number(response.data.meta.count) : records.length,
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
      dataNotice: "OpenAlex chỉ cung cấp metadata/chỉ mục học thuật; cần xác minh nguồn gốc tài liệu trước khi dùng trong Trust.",
    };
  }
}
