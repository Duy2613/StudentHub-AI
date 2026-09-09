import assert from "node:assert/strict";
import test from "node:test";

import { CrossrefAdapter } from "../../src/lib/server/public-api/CrossrefAdapter.js";
import { GdeltAdapter } from "../../src/lib/server/public-api/GdeltAdapter.js";
import { OfficialDiscoveryAdapter } from "../../src/lib/server/public-api/OfficialDiscoveryAdapter.js";
import { OpenAlexAdapter } from "../../src/lib/server/public-api/OpenAlexAdapter.js";
import { OpenMeteoAdapter } from "../../src/lib/server/public-api/OpenMeteoAdapter.js";
import { PublicApiInstitutionDiscoveryAdapter } from "../../src/lib/server/public-api/PublicApiInstitutionDiscoveryAdapter.js";
import { PublicApiClient } from "../../src/lib/server/public-api/PublicApiClient.js";
import { AuthorityLadderRanking } from "../../src/lib/server/trust/AuthorityLadderRanking.js";
import { EvidenceDiscoveryService } from "../../src/lib/server/trust/EvidenceDiscoveryService.js";
import {
  getPublicApiCatalog,
  getTopicDefinition,
  PUBLIC_API_ID,
} from "../../src/lib/server/public-api/PublicApiRegistry.js";
import { PublicSourceHub } from "../../src/lib/server/public-api/PublicSourceHub.js";

function jsonResponse(status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  const headerMap = new Map(Object.entries({ "content-type": "application/json", ...headers }));
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => headerMap.get(String(name).toLowerCase()) || null },
    text: async () => body,
  };
}

function createFixtureFetch({ crossrefStatus = 200 } = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const parsed = new URL(url);
    calls.push({ parsed, options });

    if (parsed.hostname === "api.openalex.org" && parsed.pathname === "/works") {
      return jsonResponse(200, {
        meta: { count: 1 },
        results: [{
          id: "https://openalex.org/W1",
          doi: "https://doi.org/10.1000/example",
          title: "Computer vision for student safety",
          publication_year: 2025,
          publication_date: "2025-04-02",
          type: "article",
          authorships: [{
            author: { display_name: "A. Researcher" },
            institutions: [{ display_name: "StudentHub University" }],
          }],
          primary_location: {
            landing_page_url: "https://journal.example.edu/article/1",
            source: { display_name: "Journal of Student Systems" },
          },
          open_access: { is_oa: true },
          topics: [{ display_name: "Educational technology" }],
          cited_by_count: 4,
        }],
      });
    }
    if (parsed.hostname === "api.openalex.org" && parsed.pathname === "/institutions") {
      return jsonResponse(200, { meta: { count: 1 }, results: [{ id: "https://openalex.org/I1", display_name: "StudentHub University", country_code: "VN", homepage_url: "https://studenthub.example.edu.vn/", works_count: 12 }] });
    }
    if (parsed.hostname === "api.openalex.org" && parsed.pathname === "/topics") {
      return jsonResponse(200, { meta: { count: 1 }, results: [{ id: "https://openalex.org/T1", display_name: "Student safety", works_count: 7 }] });
    }
    if (parsed.hostname === "api.crossref.org" && parsed.pathname === "/works") {
      if (crossrefStatus !== 200) return jsonResponse(crossrefStatus, { message: "fixture failure" });
      return jsonResponse(200, {
        message: {
          "total-results": 2,
          items: [
            {
              DOI: "10.1000/example",
              title: ["Computer vision for student safety"],
              published: { "date-parts": [[2025, 4, 2]] },
              author: [{ given: "A.", family: "Researcher" }],
              "container-title": ["Journal of Student Systems"],
              URL: "https://doi.org/10.1000/example",
              type: "journal-article",
              "is-referenced-by-count": 4,
            },
            {
              DOI: "10.1000/second",
              title: ["A second student systems study"],
              published: { "date-parts": [[2024]] },
              URL: "https://doi.org/10.1000/second",
            },
          ],
        },
      });
    }
    if (parsed.hostname === "api.crossref.org" && parsed.pathname.startsWith("/works/")) {
      return jsonResponse(200, { message: { DOI: "10.1000/example", title: ["Computer vision for student safety"], URL: "https://doi.org/10.1000/example" } });
    }
    if (parsed.hostname === "geocoding-api.open-meteo.com") {
      return jsonResponse(200, { results: [{ id: 1, name: "Hanoi", latitude: 21.0278, longitude: 105.8342, country: "Vietnam", country_code: "VN", admin1: "Ha Noi", timezone: "Asia/Bangkok" }] });
    }
    if (parsed.hostname === "api.open-meteo.com") {
      return jsonResponse(200, {
        latitude: 21.0278,
        longitude: 105.8342,
        timezone: "Asia/Bangkok",
        current: {
          time: "2026-09-09T12:00",
          temperature_2m: 31,
          apparent_temperature: 35,
          relative_humidity_2m: 70,
          precipitation: 0.2,
          wind_speed_10m: 9,
          weather_code: 2,
        },
        current_units: { temperature_2m: "°C", apparent_temperature: "°C", relative_humidity_2m: "%", precipitation: "mm", wind_speed_10m: "km/h" },
        daily: {
          time: ["2026-09-09", "2026-09-10"],
          temperature_2m_max: [33, 34],
          temperature_2m_min: [26, 26],
          precipitation_probability_max: [50, 40],
          precipitation_sum: [1.2, 0.4],
          weather_code: [2, 61],
          sunrise: ["2026-09-09T05:40", "2026-09-10T05:40"],
          sunset: ["2026-09-09T18:05", "2026-09-10T18:05"],
        },
        daily_units: { temperature_2m_max: "°C", temperature_2m_min: "°C", precipitation_probability_max: "%", precipitation_sum: "mm" },
      });
    }
    if (parsed.hostname === "api.gdeltproject.org") {
      return jsonResponse(200, { articles: [{ url: "https://news.example.edu/story/1", title: "University admission notice discussed online", domain: "news.example.edu", seendate: "20260909T030405Z", language: "English", sourcecountry: "US" }] });
    }
    return jsonResponse(404, {});
  };
  return { calls, fetchImpl };
}

test("public API catalog exposes bounded sources, topics and model roles", () => {
  const catalog = getPublicApiCatalog();
  assert.deepEqual(catalog.apis.map((entry) => entry.id), [
    "OPENALEX",
    "CROSSREF",
    "OPEN_METEO_GEOCODING",
    "OPEN_METEO_FORECAST",
    "GDELT_DOC",
  ]);
  assert.equal(catalog.topics.length, 13);
  assert.equal(catalog.models.some((model) => model.capability === "EMBEDDING" && model.status === "NOT_CONFIGURED"), true);
  assert.equal(catalog.officialDiscovery.every((source) => source.isAuthoritative === false && source.canAuthorizeTrustVerdict === false), true);
  assert.equal(getTopicDefinition("scam_phishing")?.label, "Lừa đảo và phishing");
});

test("PublicApiClient enforces allowlist, cache, DOI paths, rate limit and body limit", async () => {
  const fixture = createFixtureFetch();
  const client = new PublicApiClient({ fetchImpl: fixture.fetchImpl, maxResponseBytes: 1024 });
  const first = await client.get(PUBLIC_API_ID.OPENALEX, "/works", { search: "student safety" });
  const second = await client.get(PUBLIC_API_ID.OPENALEX, "/works", { search: "student safety" });
  const doi = await client.get(PUBLIC_API_ID.CROSSREF, "/works/10.1000%2Fexample");
  const unknown = await client.get("NOT_ALLOWLISTED", "/works");
  const traversal = await client.get(PUBLIC_API_ID.OPENALEX, "/works/%2e%2e/admin");

  assert.equal(first.ok, true);
  assert.equal(second.code, "CACHE_HIT");
  assert.equal(doi.ok, true);
  assert.equal(fixture.calls.length, 2);
  assert.equal(unknown.code, "UNKNOWN_PUBLIC_API");
  assert.equal(traversal.code, "INVALID_PUBLIC_API_PATH");

  const rateLimited = new PublicApiClient({ fetchImpl: async () => jsonResponse(429, {}, { "retry-after": "2" }) });
  const rateResult = await rateLimited.get(PUBLIC_API_ID.GDELT_DOC, "/api/v2/doc/doc", { query: "admissions" });
  assert.equal(rateResult.status, "RATE_LIMITED");
  assert.equal(rateResult.retryAfterMs, 2000);

  const oversized = new PublicApiClient({ fetchImpl: async () => jsonResponse(200, { value: "x".repeat(2000) }), maxResponseBytes: 1024 });
  const oversizedResult = await oversized.get(PUBLIC_API_ID.OPENALEX, "/works", { search: "large" });
  assert.equal(oversizedResult.code, "UPSTREAM_BODY_TOO_LARGE");
});

test("OpenAlex and Crossref adapters normalize research metadata without authority promotion", async () => {
  const { fetchImpl } = createFixtureFetch();
  const client = new PublicApiClient({ fetchImpl });
  const openAlex = new OpenAlexAdapter({ client });
  const crossref = new CrossrefAdapter({ client });
  const openAlexResult = await openAlex.searchWorks({ query: "student safety" });
  const institutionResult = await openAlex.searchInstitutions({ query: "student" });
  const crossrefResult = await crossref.searchWorks({ query: "student safety" });
  const doiResult = await crossref.getWorkByDoi("https://doi.org/10.1000/example");

  assert.equal(openAlexResult.ok, true);
  assert.equal(openAlexResult.records[0].metadata.doi, "https://doi.org/10.1000/example");
  assert.equal(institutionResult.records[0].recordType, "RESEARCH_INSTITUTION");
  assert.equal(institutionResult.records[0].domain, "studenthub.example.edu.vn");
  assert.equal(institutionResult.records[0].discoveryOnly, true);
  assert.equal(crossrefResult.records.length, 2);
  assert.equal(doiResult.records[0].metadata.doi, "10.1000/example");
  assert.equal(openAlexResult.records.every((record) => record.isAuthoritative === false), true);
  assert.equal(crossrefResult.provenance.isAuthoritative, false);
});

test("Open-Meteo and GDELT adapters return typed contextual/discovery records", async () => {
  const { fetchImpl } = createFixtureFetch();
  const client = new PublicApiClient({ fetchImpl });
  const weather = new OpenMeteoAdapter({ client });
  const gdelt = new GdeltAdapter({ client });
  const locations = await weather.geocode({ name: "Hanoi" });
  const forecast = await weather.forecastForPlace({ place: "Hanoi", forecastDays: 2 });
  const discovery = await gdelt.searchArticles({ query: "university admissions" });

  assert.equal(locations.locations[0].metadata.countryCode, "VN");
  assert.equal(forecast.forecast.current.temperatureC, 31);
  assert.equal(forecast.forecast.daily.length, 2);
  assert.equal(forecast.provenance.isAuthoritative, false);
  assert.equal(discovery.records[0].sourceType, "SECONDARY_NEWS_DISCOVERY");
  assert.equal(discovery.records[0].isAuthoritative, false);
});

test("OfficialDiscoveryAdapter extracts only minimal link metadata and never stores raw HTML", async () => {
  const source = {
    sourceId: "TEST_MOET_SOURCE",
    title: "Test authority page",
    publisher: "Test education authority",
    domain: "vqa.moet.gov.vn",
    canonicalUrl: "https://vqa.moet.gov.vn/test-directory",
    authorityTier: "GOVERNMENT_REGULATOR",
    topics: ["PUBLIC_POLICY_REGULATION"],
  };
  const html = `<html><head><title>Accredited institutions</title></head><body><a href="https://hcmute.edu.vn/">Trường Đại học Sư phạm Kỹ thuật TP.HCM</a><script>secret-not-stored()</script></body></html>`;
  const adapter = new OfficialDiscoveryAdapter({
    sources: [source],
    fetchImpl: async () => ({
      status: 200,
      ok: true,
      headers: { get: () => null },
      text: async () => html,
    }),
  });
  const result = await adapter.fetchSource(source.sourceId);

  assert.equal(result.ok, true);
  assert.equal(result.source.pageTitle, "Accredited institutions");
  assert.equal(result.records[0].domain, "hcmute.edu.vn");
  assert.equal(result.records[0].discoveryOnly, true);
  assert.equal(result.records[0].isAuthoritative, false);
  assert.equal(result.source.rawContentStored, false);
  assert.equal(Object.hasOwn(result, "rawHtml"), false);
  assert.equal(Object.hasOwn(result.records[0], "rawHtml"), false);
});

test("PublicSourceHub keeps partial provider state explicit and official seeds soft", async () => {
  const fixture = createFixtureFetch({ crossrefStatus: 503 });
  const hub = new PublicSourceHub({ client: new PublicApiClient({ fetchImpl: fixture.fetchImpl }) });
  const research = await hub.searchResearch({ query: "student safety", limit: 5 });
  const discovery = await hub.discoverNews({ query: "admissions", topic: "ADMISSIONS", limit: 3 });

  assert.equal(research.ok, true);
  assert.equal(research.status, "PARTIAL");
  assert.equal(research.providers.find((provider) => provider.provider === "CROSSREF").status, "UNAVAILABLE");
  assert.equal(research.records.length, 1);
  assert.equal(research.records.every((record) => record.isAuthoritative === false), true);
  assert.equal(discovery.ok, true);
  assert.equal(discovery.officialDiscoverySeeds.length > 0, true);
  assert.equal(discovery.officialDiscoverySeeds.every((seed) => seed.isAuthoritative === false), true);
  assert.equal(discovery.provenance.isAuthoritative, false);
});

test("PublicSourceHub supports explicit official-page fetch without changing the soft authority boundary", async () => {
  const fixture = createFixtureFetch();
  const officialSource = {
    sourceId: "TEST_MOET_SOURCE",
    title: "Test authority page",
    publisher: "Test education authority",
    domain: "vqa.moet.gov.vn",
    canonicalUrl: "https://vqa.moet.gov.vn/test-directory",
    authorityTier: "GOVERNMENT_REGULATOR",
    topics: ["ADMISSIONS"],
  };
  const html = `<title>Directory</title><a href="https://hcmute.edu.vn/">HCMUTE</a>`;
  const fetchImpl = async (url, options) => {
    if (new URL(url).hostname === "vqa.moet.gov.vn") return { status: 200, ok: true, headers: { get: () => null }, text: async () => html };
    return fixture.fetchImpl(url, options);
  };
  const officialDiscovery = new OfficialDiscoveryAdapter({ sources: [officialSource], fetchImpl });
  const hub = new PublicSourceHub({ client: new PublicApiClient({ fetchImpl }), officialDiscovery });
  const result = await hub.discoverNews({ query: "admissions", includeOfficialContent: true, limit: 3 });

  assert.equal(result.ok, true);
  assert.equal(result.providers.some((provider) => provider.provider === "MOET_OFFICIAL_DISCOVERY" && provider.ok), true);
  assert.equal(result.provenance.isAuthoritative, false);
  assert.equal(result.records.some((record) => record.domain === "hcmute.edu.vn" && record.discoveryOnly === true), true);
});

test("Public API institution discovery emits bounded entity metadata only", async () => {
  const sourceHub = {
    searchResearch: async ({ query, limit }) => ({
      ok: true,
      status: "AVAILABLE",
      providers: [{ provider: "OPENALEX", code: "OK" }],
      records: [{
        recordType: "RESEARCH_INSTITUTION",
        title: `${query} University`,
        url: "https://hust.edu.vn/",
        domain: "hust.edu.vn",
        metadata: { homepage: "https://hust.edu.vn/", sourceProvider: "OPENALEX" },
      }].slice(0, limit),
      total: 1,
      provenance: { isAuthoritative: false },
    }),
  };
  const adapter = new PublicApiInstitutionDiscoveryAdapter({ sourceHub });
  const result = await adapter.discoverAll({
    claims: [{ claimId: "claim-institution", text: "Hanoi University of Science and Technology" }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, "AVAILABLE");
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].domain, "hust.edu.vn");
  assert.equal(result.records[0].allowedUse, "ENTITY_DISCOVERY_ONLY");
  assert.equal(result.records[0].discoveryOnly, true);
  assert.equal(result.records[0].publicApiDiscovery, true);
  assert.equal(result.records[0].isPrimary, false);
  assert.equal(result.records[0].isAuthoritative, false);
  assert.equal(result.records[0].rawContentSnippet, result.records[0].title);
});

test("Evidence discovery accepts official adapter candidates only as discovery-only ranked signals", async () => {
  const result = await EvidenceDiscoveryService.discoverEvidenceForClaims({
    claims: [{ claimId: "claim-official", text: "HCMUTE admissions notice", normalizedText: "hcmute admissions notice" }],
    mode: "STATIC",
    includeOfficialDiscovery: true,
    officialDiscoveryAdapter: {
      discoverAll: async () => ({
        ok: true,
        status: "AVAILABLE",
        provider: "MOET_OFFICIAL_DISCOVERY",
        records: [{
          sourceId: "official-discovery:test-hcmute",
          canonicalUrl: "https://hcmute.edu.vn/",
          title: "HCMUTE",
          domain: "hcmute.edu.vn",
          publisher: "MOET discovery",
          sourceType: "OFFICIAL_DISCOVERY_SEED",
          retrievalMethod: "OFFICIAL_DISCOVERY_ADAPTER",
          discoveryOnly: true,
          isAuthoritative: false,
        }],
      }),
    },
  });
  const candidate = result.sources.find((source) => source.sourceId === "official-discovery:test-hcmute");
  const ranked = AuthorityLadderRanking.rankSources([candidate], [], 2026, "HCMUTE admissions notice")[0];

  assert.equal(result.officialDiscoveryTrace.status, "AVAILABLE");
  assert.equal(candidate.discoveryOnly, true);
  assert.equal(candidate.isAuthoritative, false);
  assert.equal(ranked.authorityTier, "UNKNOWN");
  assert.equal(ranked.isPrimary, false);
});

test("Evidence discovery wires public API institution metadata into the safe pool", async () => {
  const result = await EvidenceDiscoveryService.discoverEvidenceForClaims({
    claims: [{
      claimId: "claim-public-api",
      text: "Hanoi University of Science and Technology admissions notice",
      normalizedText: "hanoi university of science and technology admissions notice",
      entities: [{ name: "Hanoi University of Science and Technology" }],
    }],
    mode: "STATIC",
    includePublicApiDiscovery: true,
    publicApiDiscoveryAdapter: {
      discoverAll: async ({ claims }) => ({
        ok: true,
        status: "AVAILABLE",
        provider: "OPENALEX_ENTITY_DISCOVERY",
        records: [{
          sourceId: "public-api-discovery:hust",
          claimId: claims[0].claimId,
          canonicalUrl: "https://hust.edu.vn/",
          title: "Hanoi University of Science and Technology",
          domain: "hust.edu.vn",
          sourceType: "PUBLIC_API_ENTITY_DISCOVERY",
          retrievalMethod: "PUBLIC_API_DISCOVERY",
          publicApiDiscovery: true,
          discoveryOnly: true,
          isAuthoritative: false,
          isPrimary: false,
        }],
      }),
    },
  });
  const candidate = result.sources.find((source) => source.sourceId === "public-api-discovery:hust");

  assert.equal(result.publicApiDiscoveryTrace.status, "AVAILABLE");
  assert.equal(result.publicApiDiscoveryTrace.candidateCount, 1);
  assert.equal(result.candidatePoolTrace.inputCounts.PUBLIC_API_DISCOVERY, 1);
  assert.equal(result.candidatePoolTrace.candidatePool, "SAFE_DEDUP(STATIC ∪ LIVE ∪ OFFICIAL_DISCOVERY ∪ PUBLIC_API_DISCOVERY)");
  assert.equal(candidate.discoveryOnly, true);
  assert.equal(candidate.publicApiDiscovery, true);
  assert.equal(candidate.isAuthoritative, false);
  assert.equal(AuthorityLadderRanking.rankSources([candidate], [], 2026, "HUST admissions notice")[0].authorityTier, "UNKNOWN");
});

test("discovery entity match changes ordering without changing authority", () => {
  const resolved = [{ entityId: "HUST", officialDomain: "hust.edu.vn", allowedDomains: ["hust.edu.vn"] }];
  const ranked = AuthorityLadderRanking.rankSources([
    {
      sourceId: "generic-seed",
      canonicalUrl: "https://vqa.moet.gov.vn/directory",
      domain: "vqa.moet.gov.vn",
      title: "Danh sách cơ sở giáo dục và thông báo tuyển sinh",
      discoveryOnly: true,
      officialDiscovery: true,
      isAuthoritative: false,
    },
    {
      sourceId: "public-hust",
      canonicalUrl: "https://hust.edu.vn/",
      domain: "hust.edu.vn",
      title: "Hanoi University of Science and Technology",
      discoveryOnly: true,
      publicApiDiscovery: true,
      isAuthoritative: false,
      isPrimary: false,
    },
  ], resolved, 2026, "Đại học Bách khoa Hà Nội tuyển sinh");

  assert.equal(ranked[0].sourceId, "public-hust");
  assert.equal(ranked[0].authorityTier, "UNKNOWN");
  assert.equal(ranked[0].isPrimary, false);
});
