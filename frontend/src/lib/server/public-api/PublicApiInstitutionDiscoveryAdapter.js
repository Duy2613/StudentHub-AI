import { createHash } from "node:crypto";
import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import { publicSourceHub } from "./PublicSourceHub.js";

const DEFAULT_MAX_CLAIMS = 20;
const DEFAULT_MAX_RESULTS_PER_CLAIM = 5;
const DEFAULT_MAX_ENTITY_QUERIES_PER_CLAIM = 3;

function boundedText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const INSTITUTION_MARKER_REGEX = /(?:đại\s+học|học\s+viện|trường|viện|university|institute|college|school|đhqg|đh[a-z0-9]{2,})/i;
const INSTITUTION_TOPIC_TAIL_REGEX = /(?:tuyển\s+sinh|học\s+phí|học\s+bổng|thông\s+báo|chỉ\s+tiêu|ngành|chương\s+trình|quy\s+định|quy\s+chế|chính\s+sách|admissions?|tuition|scholarships?|notice|program(?:me)?s?)/i;

function digest(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function safeHomepage(record) {
  for (const value of [record?.metadata?.homepage, record?.url]) {
    try {
      const parsed = new URL(String(value || ""));
      const hostname = parsed.hostname.toLowerCase();
      if (!/^https?:$/.test(parsed.protocol) || hostname === "openalex.org" || hostname.endsWith(".openalex.org")) continue;
      parsed.hash = "";
      const canonical = parsed.toString();
      if (validateRemoteUrlSync(canonical).ok) return canonical;
    } catch {
      // Try the next upstream URL field.
    }
  }
  return null;
}

function institutionQueries(claim, maxQueries = DEFAULT_MAX_ENTITY_QUERIES_PER_CLAIM) {
  const entityNames = (Array.isArray(claim?.entities) ? claim.entities : [])
    .filter((entity) => typeof entity === "string" || /\.edu\.vn$/i.test(String(entity?.officialDomain || "")) || INSTITUTION_MARKER_REGEX.test(String(entity?.canonicalName || entity?.name || "")))
    .map((entity) => typeof entity === "string" ? entity : entity?.canonicalName || entity?.name)
    .filter(Boolean)
    .map((value) => boundedText(value, 120))
    .filter(Boolean);
  if (entityNames.length > 0) return [...new Set(entityNames)].slice(0, maxQueries);

  const text = boundedText(claim?.text || claim?.normalizedText, 180);
  if (!INSTITUTION_MARKER_REGEX.test(text)) return [];
  const withoutTopicTail = text.split(INSTITUTION_TOPIC_TAIL_REGEX)[0].trim();
  return [boundedText(withoutTopicTail.length >= 4 ? withoutTopicTail : text, 180)];
}

function normalizeRecord(record, claim, index) {
  if (record?.recordType && record.recordType !== "RESEARCH_INSTITUTION") return null;
  const canonicalUrl = safeHomepage(record);
  if (!canonicalUrl) return null;
  const domain = new URL(canonicalUrl).hostname.toLowerCase();
  const title = boundedText(record?.title, 300) || domain;
  const sourceId = `public-api-institution:${digest(`${claim.claimId}:${canonicalUrl}:${title}`).slice(0, 20)}`;
  return {
    recordType: "PUBLIC_API_ENTITY_DISCOVERY",
    sourceId,
    evidenceId: `ev-${sourceId}-${index + 1}`.slice(0, 320),
    claimId: claim.claimId,
    publisher: "OpenAlex institution metadata",
    sourceType: "PUBLIC_API_ENTITY_DISCOVERY",
    canonicalUrl,
    originalRetrievedUrl: canonicalUrl,
    title,
    domain,
    publishedAt: null,
    retrievedAt: new Date().toISOString(),
    jurisdiction: "UNKNOWN",
    allowedUse: "ENTITY_DISCOVERY_ONLY",
    snapshotUri: null,
    contentDigest: digest(`${title}|${canonicalUrl}`),
    rawContentSnippet: title,
    parserVersion: "openalex-institution-homepage-v1",
    piiClassification: "REDACTED_PUBLIC",
    correctionChain: [],
    independenceKey: domain,
    retrievalMethod: "PUBLIC_API_DISCOVERY",
    retrievalProvider: "OPENALEX",
    revision: 1,
    claimRelations: { [claim.claimId]: "DISCOVERY_ONLY" },
    isPrimary: false,
    isAuthoritative: false,
    discoveryOnly: true,
    publicApiDiscovery: true,
  };
}

async function mapWithConcurrency(items, worker, concurrency = 4) {
  const output = new Array(items.length);
  let nextIndex = 0;
  async function runWorker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()));
  return output;
}

export class PublicApiInstitutionDiscoveryAdapter {
  constructor({
    sourceHub = publicSourceHub,
    maxClaims = DEFAULT_MAX_CLAIMS,
    maxResultsPerClaim = DEFAULT_MAX_RESULTS_PER_CLAIM,
    maxEntityQueriesPerClaim = DEFAULT_MAX_ENTITY_QUERIES_PER_CLAIM,
  } = {}) {
    this.sourceHub = sourceHub;
    this.maxClaims = Math.min(50, Math.max(1, Number(maxClaims) || DEFAULT_MAX_CLAIMS));
    this.maxResultsPerClaim = Math.min(10, Math.max(1, Number(maxResultsPerClaim) || DEFAULT_MAX_RESULTS_PER_CLAIM));
    this.maxEntityQueriesPerClaim = Math.min(5, Math.max(1, Number(maxEntityQueriesPerClaim) || DEFAULT_MAX_ENTITY_QUERIES_PER_CLAIM));
    this.provider = "OPENALEX_ENTITY_DISCOVERY";
  }

  async discoverAll({ claims = [], signal } = {}) {
    const boundedClaims = (Array.isArray(claims) ? claims : [])
      .filter((claim) => claim && typeof claim === "object" && boundedText(claim.claimId, 160) && boundedText(claim.text || claim.normalizedText, 180))
      .slice(0, this.maxClaims);
    if (boundedClaims.length === 0) {
      return {
        ok: false,
        status: "NOT_REQUESTED",
        provider: this.provider,
        providerStatus: "NOT_REQUESTED",
        code: "NO_CLAIMS",
        records: [],
        total: 0,
        sources: [],
        provenance: { sourceState: "NOT_CALLED", providerId: this.provider, isAuthoritative: false },
      };
    }

    const jobMap = new Map();
    for (const claim of boundedClaims) {
      for (const query of institutionQueries(claim, this.maxEntityQueriesPerClaim).filter((value) => value.length >= 2)) {
        const existing = jobMap.get(query);
        if (existing) {
          existing.claims.push(claim);
        } else {
          jobMap.set(query, { query, claims: [claim] });
        }
      }
    }
    const jobs = [...jobMap.values()];
    if (jobs.length === 0) {
      return {
        ok: false,
        status: "NOT_REQUESTED",
        provider: this.provider,
        providerStatus: "NOT_REQUESTED",
        code: "NO_INSTITUTION_SIGNAL",
        records: [],
        total: 0,
        sources: boundedClaims.map((claim) => ({ claimId: claim.claimId, provider: "OPENALEX", status: "NOT_REQUESTED", code: "NO_INSTITUTION_SIGNAL", total: 0 })),
        provenance: { sourceState: "NOT_CALLED", providerId: this.provider, isAuthoritative: false },
      };
    }

    const results = await mapWithConcurrency(jobs, async (job) => {
      try {
        const result = await this.sourceHub.searchResearch({
          query: job.query,
          type: "institutions",
          limit: this.maxResultsPerClaim,
          signal,
        });
        return { job, result };
      } catch {
        return { job, result: { ok: false, status: "UNAVAILABLE", providerStatus: "UNAVAILABLE", code: "ADAPTER_EXCEPTION", records: [] } };
      }
    });

    const successful = results.filter(({ result }) => result?.ok === true);
    const records = results.flatMap(({ job, result }) => (
      Array.isArray(result?.records)
        ? job.claims.flatMap((targetClaim) => result.records.map((record, index) => normalizeRecord(record, targetClaim, index)).filter(Boolean))
        : []
    ));
    const uniqueRecords = [...new Map(records.map((record) => [
      `${record.claimId}::${record.canonicalUrl}`,
      record,
    ])).values()];
    const status = successful.length === results.length
      ? "AVAILABLE"
      : successful.length > 0
        ? "PARTIAL"
        : "UNAVAILABLE";

    return {
      ok: successful.length > 0,
      status,
      provider: this.provider,
      providerStatus: status,
      code: successful.length > 0 ? "OK" : "UPSTREAM_UNAVAILABLE",
      records: uniqueRecords,
      total: uniqueRecords.length,
      sources: boundedClaims.map((claim) => {
        const claimResults = results.filter((entry) => entry.job.claims.some((targetClaim) => targetClaim.claimId === claim.claimId));
        const claimSuccessful = claimResults.filter(({ result }) => result?.ok === true);
        return {
          claimId: claim.claimId,
          query: claimResults.map((entry) => entry.job.query).join(" | "),
          provider: claimResults[0]?.result?.providers?.[0]?.provider || "OPENALEX",
          status: claimResults.length === 0
            ? "NOT_REQUESTED"
            : claimSuccessful.length === claimResults.length
              ? "AVAILABLE"
              : claimSuccessful.length > 0
                ? "PARTIAL"
                : "UNAVAILABLE",
          code: claimResults[0]?.result?.providers?.[0]?.code || claimResults[0]?.result?.code || (claimResults.length === 0 ? "NO_INSTITUTION_SIGNAL" : null),
          total: claimResults.reduce((sum, entry) => sum + (Array.isArray(entry.result?.records) ? entry.result.records.length : 0), 0),
        };
      }),
      provenance: {
        sourceState: successful.length > 0 ? "PUBLIC_API_ENTITY_DISCOVERY" : "PUBLIC_API_UNAVAILABLE",
        providerId: this.provider,
        isAuthoritative: false,
        allowedUse: "ENTITY_DISCOVERY_ONLY",
        dataNotice: "OpenAlex homepage metadata chỉ mở rộng entity discovery; phải fetch và xác minh nguồn chính thức trước khi dùng trong Trust.",
      },
    };
  }
}
