import "server-only";
import { publicSourceHub } from "./PublicSourceHub.js";

const MAX_CLAIMS = 8;
const MAX_RECORDS_PER_ENDPOINT = 5;
const INSTITUTION_SIGNAL = /(?:đại\s+học|học\s+viện|trường|viện|university|institute|college|school|đhqg|đh[a-z0-9]{2,})/i;

function boundedText(value, limit = 180) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, limit) : "";
}

function claimQuery(claim) {
  return boundedText([
    claim?.subject,
    claim?.predicate,
    claim?.object,
    claim?.rawText,
  ].filter(Boolean).join(" ").replace(/\s+/g, " "), 180);
}

function uniqueTasks(claims) {
  const seen = new Set();
  const uniqueClaims = claims.slice(0, MAX_CLAIMS).map((claim, index) => ({
    claimId: boundedText(claim?.claimId, 160) || `claim-${index + 1}`,
    query: claimQuery(claim),
  })).filter((claim) => claim.query.length >= 3).filter((claim) => {
    const key = claim.query.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const tasks = uniqueClaims.slice(0, 2).map((claim) => ({ endpoint: "works", ...claim }));
  const institution = uniqueClaims.find((claim) => INSTITUTION_SIGNAL.test(claim.query));
  if (institution) tasks.push({ endpoint: "institutions", ...institution });
  const topic = uniqueClaims[0];
  if (topic) tasks.push({ endpoint: "topics", ...topic });
  return tasks;
}

function safeRecord(record, endpoint) {
  if (!record || typeof record !== "object") return null;
  const base = {
    sourceId: boundedText(record.sourceId, 180),
    title: boundedText(record.title, 300),
    url: boundedText(record.url, 1000),
  };
  if (endpoint === "works") {
    return {
      ...base,
      publishedAt: boundedText(record.publishedAt, 40) || null,
      doi: boundedText(record.metadata?.doi, 240) || null,
      authors: (Array.isArray(record.metadata?.authors) ? record.metadata.authors : []).map((item) => boundedText(item, 120)).filter(Boolean).slice(0, 5),
      institutions: (Array.isArray(record.metadata?.institutions) ? record.metadata.institutions : []).map((item) => boundedText(item, 160)).filter(Boolean).slice(0, 5),
      topics: (Array.isArray(record.metadata?.topics) ? record.metadata.topics : []).map((item) => boundedText(item, 120)).filter(Boolean).slice(0, 5),
      citedByCount: Number.isFinite(Number(record.metadata?.citedByCount)) ? Math.max(0, Number(record.metadata.citedByCount)) : null,
      openAccess: record.metadata?.openAccess === true,
    };
  }
  if (endpoint === "institutions") {
    return {
      ...base,
      countryCode: boundedText(record.metadata?.countryCode, 8) || null,
      worksCount: Number.isFinite(Number(record.metadata?.worksCount)) ? Math.max(0, Number(record.metadata.worksCount)) : null,
      citedByCount: Number.isFinite(Number(record.metadata?.citedByCount)) ? Math.max(0, Number(record.metadata.citedByCount)) : null,
    };
  }
  return {
    ...base,
    field: boundedText(record.metadata?.field, 120) || null,
    subfield: boundedText(record.metadata?.subfield, 120) || null,
    domain: boundedText(record.metadata?.domain, 120) || null,
    worksCount: Number.isFinite(Number(record.metadata?.worksCount)) ? Math.max(0, Number(record.metadata.worksCount)) : null,
  };
}

async function runTask(task, signal) {
  try {
    const adapter = publicSourceHub.openAlex;
    const result = task.endpoint === "works"
      ? await adapter.searchWorks({ query: task.query, limit: MAX_RECORDS_PER_ENDPOINT, signal })
      : task.endpoint === "institutions"
        ? await adapter.searchInstitutions({ query: task.query, limit: MAX_RECORDS_PER_ENDPOINT, signal })
        : await adapter.searchTopics({ query: task.query, limit: MAX_RECORDS_PER_ENDPOINT, signal });
    return {
      endpoint: task.endpoint,
      claimId: task.claimId,
      status: result?.ok === true ? "AVAILABLE" : boundedText(result?.providerStatus, 60).toUpperCase() || "UNAVAILABLE",
      code: boundedText(result?.code, 80) || null,
      fromCache: result?.provenance?.fromCache === true,
      records: (Array.isArray(result?.records) ? result.records : []).map((record) => safeRecord(record, task.endpoint)).filter(Boolean).slice(0, MAX_RECORDS_PER_ENDPOINT),
    };
  } catch {
    return { endpoint: task.endpoint, claimId: task.claimId, status: "UNAVAILABLE", code: "ADAPTER_EXCEPTION", fromCache: false, records: [] };
  }
}

export class OpenAlexTrustContextService {
  static async discover({ claims = [], signal } = {}) {
    const adapter = publicSourceHub.openAlex;
    if (!adapter?.apiKey) {
      return { provider: "OPENALEX", status: "NOT_CONFIGURED", role: "ACADEMIC_METADATA_DISCOVERY", isAuthoritative: false, allowedUse: "CONTEXT_ONLY", queryCount: 0, endpoints: [], works: [], institutions: [], topics: [] };
    }

    const tasks = uniqueTasks(Array.isArray(claims) ? claims : []);
    if (tasks.length === 0) {
      return { provider: "OPENALEX", status: "NOT_REQUESTED", role: "ACADEMIC_METADATA_DISCOVERY", isAuthoritative: false, allowedUse: "CONTEXT_ONLY", queryCount: 0, endpoints: [], works: [], institutions: [], topics: [] };
    }

    const observations = await Promise.all(tasks.map((task) => runTask(task, signal)));
    const successful = observations.filter((item) => item.status === "AVAILABLE").length;
    const status = successful === observations.length ? "AVAILABLE" : successful > 0 ? "PARTIAL" : observations.some((item) => item.status === "RATE_LIMITED") ? "RATE_LIMITED" : "UNAVAILABLE";
    const collect = (endpoint) => [...new Map(observations
      .filter((item) => item.endpoint === endpoint)
      .flatMap((item) => item.records)
      .map((record) => [record.sourceId || `${record.title}:${record.url}`, record])).values()].slice(0, 8);

    return {
      provider: "OPENALEX",
      status,
      role: "ACADEMIC_METADATA_DISCOVERY",
      isAuthoritative: false,
      allowedUse: "CONTEXT_ONLY",
      notice: "Metadata học thuật chỉ cung cấp bối cảnh và hướng tìm kiếm; không được tính là evidence đã xác minh, nguồn chính thức hoặc đầu vào cho Final Predict.",
      queryCount: observations.length,
      endpoints: observations.map(({ endpoint, status: endpointStatus, code, fromCache }) => ({ endpoint, status: endpointStatus, code, fromCache })),
      works: collect("works"),
      institutions: collect("institutions"),
      topics: collect("topics"),
    };
  }
}
