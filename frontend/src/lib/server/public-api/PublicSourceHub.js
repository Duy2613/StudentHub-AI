import {
  findOfficialDiscoverySeeds,
  getPublicApiCatalog,
  getTopicDefinition,
} from "./PublicApiRegistry.js";
import { CrossrefAdapter } from "./CrossrefAdapter.js";
import { GdeltAdapter } from "./GdeltAdapter.js";
import { OfficialDiscoveryAdapter } from "./OfficialDiscoveryAdapter.js";
import { OpenAlexAdapter } from "./OpenAlexAdapter.js";
import { OpenMeteoAdapter } from "./OpenMeteoAdapter.js";
import { PublicApiClient } from "./PublicApiClient.js";

function boundedText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function boundedLimit(value, fallback = 10) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(20, Math.max(1, parsed)) : fallback;
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/https?:\/\/(?:dx\.)?doi\.org\//g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeRecords(records) {
  const seen = new Map();
  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    const doi = normalizeKey(record?.metadata?.doi);
    const url = normalizeKey(record?.url);
    const title = normalizeKey(record?.title);
    const key = doi ? `doi:${doi}` : url ? `url:${url}` : `title:${title}`;
    if (!key || key.endsWith(":")) continue;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, { ...record, metadata: { ...(record.metadata || {}), sourceProviders: [record.metadata?.sourceProvider || record.publisher || "unknown"] } });
      continue;
    }
    const providers = new Set(existing.metadata?.sourceProviders || []);
    providers.add(record.metadata?.sourceProvider || record.publisher || "unknown");
    existing.metadata = { ...(existing.metadata || {}), sourceProviders: [...providers].slice(0, 8) };
  }
  return [...seen.values()];
}

function safeAdapterFailure(provider, code = "ADAPTER_UNAVAILABLE") {
  return {
    ok: false,
    provider,
    providerStatus: "UNAVAILABLE",
    code,
    records: [],
    total: 0,
    provenance: { sourceState: "ADAPTER_UNAVAILABLE", providerId: provider, isAuthoritative: false },
  };
}

async function callSafely(provider, operation) {
  try {
    return await operation();
  } catch {
    return safeAdapterFailure(provider, "ADAPTER_EXCEPTION");
  }
}

export class PublicSourceHub {
  constructor({ client, openAlex, crossref, gdelt, openMeteo, officialDiscovery } = {}) {
    const sharedClient = client || new PublicApiClient();
    this.openAlex = openAlex || new OpenAlexAdapter({ client: sharedClient });
    this.crossref = crossref || new CrossrefAdapter({ client: sharedClient });
    this.gdelt = gdelt || new GdeltAdapter({ client: sharedClient });
    this.openMeteo = openMeteo || new OpenMeteoAdapter({ client: sharedClient });
    this.officialDiscovery = officialDiscovery || new OfficialDiscoveryAdapter();
  }

  catalog() {
    return getPublicApiCatalog();
  }

  officialDiscoverySeeds({ query = "", topic = "" } = {}) {
    return findOfficialDiscoverySeeds({ query: boundedText(query, 180), topic: boundedText(topic, 80) });
  }

  async searchResearch({ query = "", type = "works", institution = "", topic = "", fromYear, toYear, limit = 10, signal } = {}) {
    const search = boundedText(query, 180);
    const normalizedType = ["works", "institutions", "topics"].includes(type) ? type : "works";
    if (search.length < 2) return this._invalid("RESEARCH_QUERY_REQUIRED", normalizedType);
    const bounded = boundedLimit(limit);
    const calls = normalizedType === "works"
      ? [
          callSafely("OPENALEX", () => this.openAlex.searchWorks({ query: search, institution, topic, fromYear, toYear, limit: bounded, signal })),
          callSafely("CROSSREF", () => this.crossref.searchWorks({ query: search, fromYear, toYear, limit: bounded, signal })),
        ]
      : [
          callSafely("OPENALEX", () => normalizedType === "institutions"
            ? this.openAlex.searchInstitutions({ query: search, limit: bounded, signal })
            : this.openAlex.searchTopics({ query: search, limit: bounded, signal })),
        ];
    const results = await Promise.all(calls);
    const successful = results.filter((result) => result.ok);
    const records = dedupeRecords(results.flatMap((result) => Array.isArray(result.records) ? result.records : []))
      .slice(0, bounded);
    const providerStatus = successful.length === results.length
      ? "AVAILABLE"
      : successful.length > 0
        ? "PARTIAL"
        : "UNAVAILABLE";
    return {
      ok: successful.length > 0,
      status: providerStatus,
      providerStatus,
      query: search,
      type: normalizedType,
      records,
      total: records.length,
      providerTotals: Object.fromEntries(results.map((result) => [result.provider, result.total || 0])),
      providers: results.map((result) => ({
        provider: result.provider,
        ok: result.ok,
        status: result.providerStatus,
        code: result.code,
        total: result.total || 0,
        fromCache: result.provenance?.fromCache === true,
      })),
      provenance: {
        sourceState: successful.length > 0 ? "PUBLIC_API_METADATA" : "PUBLIC_API_UNAVAILABLE",
        providerIds: results.map((result) => result.provider),
        isAuthoritative: false,
        dataNotice: "OpenAlex/Crossref chỉ bổ sung metadata discovery. Không dùng trực tiếp làm bằng chứng chính sách, officiality hoặc Trust verdict.",
      },
    };
  }

  async discoverNews({ query = "", topic = "", timespan = "1week", limit = 10, includeOfficialContent = false, signal } = {}) {
    const requestedQuery = boundedText(query, 180);
    const topicDefinition = getTopicDefinition(topic);
    const topicLabel = topicDefinition?.label || boundedText(topic, 80);
    const discoveryQuery = boundedText([requestedQuery, topicLabel].filter(Boolean).join(" "), 180);
    if (discoveryQuery.length < 2) return this._invalid("DISCOVERY_QUERY_REQUIRED", "news");

    const [news, seeds, official] = await Promise.all([
      callSafely("GDELT_DOC", () => this.gdelt.searchArticles({ query: discoveryQuery, timespan, limit, signal })),
      Promise.resolve(this.officialDiscoverySeeds({ query: requestedQuery, topic })),
      includeOfficialContent
        ? callSafely("MOET_OFFICIAL_DISCOVERY", () => this.officialDiscovery.discoverAll({ signal }))
        : Promise.resolve({ ok: false, provider: "MOET_OFFICIAL_DISCOVERY", providerStatus: "NOT_REQUESTED", code: "NOT_REQUESTED", records: [], total: 0 }),
    ]);
    const officialDiscoverySeeds = seeds.map((seed) => ({
      recordType: "OFFICIAL_DISCOVERY_SEED",
      sourceId: seed.sourceId,
      title: seed.title,
      url: seed.canonicalUrl,
      domain: seed.domain,
      publisher: seed.publisher,
      publishedAt: null,
      sourceType: "OFFICIAL_DISCOVERY_SEED",
      authorityTier: seed.authorityTier,
      isPrimary: false,
      isAuthoritative: false,
      content: seed.title,
      metadata: {
        topics: seed.topics,
        sourceState: seed.sourceState,
        canAuthorizeTrustVerdict: seed.canAuthorizeTrustVerdict,
        sourceProvider: "MOET_DISCOVERY_SEED",
      },
      discoveryOnly: true,
    }));
    const officialRecords = Array.isArray(official.records) ? official.records : [];
    const records = dedupeRecords([...officialDiscoverySeeds, ...officialRecords, ...(news.records || [])]).slice(0, boundedLimit(limit) + officialDiscoverySeeds.length + officialRecords.length);
    const ok = news.ok || official.ok || officialDiscoverySeeds.length > 0;
    const overallStatus = news.ok && (!includeOfficialContent || official.ok)
      ? "AVAILABLE"
      : ok
        ? "PARTIAL"
        : "UNAVAILABLE";
    return {
      ok,
      status: overallStatus,
      providerStatus: overallStatus,
      query: discoveryQuery,
      records,
      total: records.length,
      officialDiscoverySeeds,
      providers: [{
        provider: news.provider,
        ok: news.ok,
        status: news.providerStatus,
        code: news.code,
        total: news.total || 0,
        fromCache: news.provenance?.fromCache === true,
      }, ...(includeOfficialContent ? [{
        provider: official.provider,
        ok: official.ok,
        status: official.providerStatus,
        code: official.code,
        total: official.total || 0,
        fromCache: false,
      }] : [])],
      provenance: {
        sourceState: official.ok ? "OFFICIAL_DISCOVERY_AND_SECONDARY_DISCOVERY" : news.ok ? "SECONDARY_DISCOVERY_WITH_OFFICIAL_SEEDS" : "OFFICIAL_DISCOVERY_SEED_ONLY",
        providerIds: ["GDELT_DOC", ...(includeOfficialContent ? ["MOET_OFFICIAL_DISCOVERY"] : [])],
        officialSeedIds: officialDiscoverySeeds.map((seed) => seed.sourceId),
        officialFetchedCandidateCount: officialRecords.length,
        isAuthoritative: false,
        dataNotice: "Tin GDELT và MOET seed chỉ giúp tìm nguồn. Phải mở nguồn chính thức và chạy evidence/policy pipeline trước khi kết luận.",
      },
    };
  }

  async weather({ place = "", countryCode = "", latitude, longitude, forecastDays = 3, timezone = "auto", signal } = {}) {
    const hasCoordinates = latitude !== undefined && latitude !== "" && longitude !== undefined && longitude !== "";
    if (hasCoordinates) return callSafely("OPEN_METEO_FORECAST", () => this.openMeteo.forecast({ latitude, longitude, forecastDays, timezone, signal }));
    if (boundedText(place, 160).length < 2) return this._invalid("PLACE_QUERY_REQUIRED", "weather");
    return callSafely("OPEN_METEO_FORECAST", () => this.openMeteo.forecastForPlace({ place, countryCode, forecastDays, timezone, signal }));
  }

  _invalid(code, type) {
    return {
      ok: false,
      status: "ERROR",
      providerStatus: "ERROR",
      code,
      query: "",
      type,
      records: [],
      total: 0,
      providers: [],
      provenance: { sourceState: "NOT_CALLED", isAuthoritative: false },
    };
  }
}

export const publicSourceHub = new PublicSourceHub();
