/**
 * Candidate-pool boundary for Trust V5 retrieval.
 *
 * Retrieval sources are evidence candidates, not verdicts. The pool merges
 * static, live, official-discovery and public-API-discovery candidates before
 * entity/authority ranking. In particular, UNKNOWN entity resolution never
 * removes a live candidate; it is retained with its provenance and can be
 * down-ranked later.
 */

const FORBIDDEN_EVALUATION_KEYS = new Set([
  "goldLabel", "goldVerdict", "expectedVerdict", "expectedLabel", "expectedRisk",
  "expectedHasDisagreement", "hardCategory", "difficulty", "isGold", "gold",
]);

const ALLOWED_SOURCE_KEYS = new Set([
  "sourceId", "evidenceId", "claimId", "publisher", "sourceType", "canonicalUrl", "url",
  "originalRetrievedUrl", "title", "domain", "publishedAt", "retrievedAt", "jurisdiction",
  "allowedUse", "snapshotUri", "contentDigest", "rawContentSnippet", "relevantSnippet",
  "parserVersion", "piiClassification", "correctionChain", "independenceKey",
  "retrievalMethod", "retrievalQueryId", "retrievalProvider", "revision", "claimRelations",
  "isOfficial", "isPrimary", "isAuthoritative", "discoveryOnly", "officialDiscovery", "publicApiDiscovery", "discoveryMethods", "candidateOrigin",
]);

function safeString(value, fallback = "") {
  return typeof value === "string" ? value.slice(0, 2000) : fallback;
}

function sanitizeSource(source = {}) {
  const input = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  const output = {};

  for (const key of Object.keys(input)) {
    if (!ALLOWED_SOURCE_KEYS.has(key) || FORBIDDEN_EVALUATION_KEYS.has(key)) continue;
    const value = input[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      output[key] = value;
    } else if (Array.isArray(value) && ["correctionChain", "discoveryMethods"].includes(key)) {
      output[key] = value.filter((item) => typeof item === "string").slice(0, 20);
    } else if (key === "claimRelations" && value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = Object.fromEntries(
        Object.entries(value).filter(([relationKey, relationValue]) => (
          typeof relationKey === "string" && typeof relationValue === "string"
        )).slice(0, 20)
      );
    }
  }

  const canonicalUrl = safeString(output.canonicalUrl || output.url || "").trim();
  const sourceId = safeString(output.sourceId || output.evidenceId || "").trim();
  if (canonicalUrl) output.canonicalUrl = canonicalUrl;
  if (!output.originalRetrievedUrl && canonicalUrl) output.originalRetrievedUrl = canonicalUrl;
  if (!output.sourceId && sourceId) output.sourceId = sourceId;
  if (!output.title) output.title = "Untitled evidence source";
  if (!output.domain && canonicalUrl) {
    try { output.domain = new URL(canonicalUrl).hostname.toLowerCase(); } catch { /* keep unknown */ }
  }
  if (!output.rawContentSnippet && output.relevantSnippet) output.rawContentSnippet = safeString(output.relevantSnippet);
  if (!output.relevantSnippet && output.rawContentSnippet) output.relevantSnippet = safeString(output.rawContentSnippet);
  return output;
}

function sourceKey(source, index) {
  const url = String(source.canonicalUrl || source.url || "").trim().toLowerCase();
  const claimId = String(source.claimId || "").trim();
  if (url) return `${url}::${claimId}`;
  return `source-id::${source.sourceId || index}`;
}

export class EvidenceCandidatePool {
  static forbiddenEvaluationKeys() {
    return [...FORBIDDEN_EVALUATION_KEYS];
  }

  static sanitizeSource(source) {
    return sanitizeSource(source);
  }

  static sanitizeSources(sources = []) {
    return Array.isArray(sources) ? sources.map((source) => sanitizeSource(source)) : [];
  }

  static safeDedup(sources = []) {
    const retained = [];
    const seen = new Map();
    const dropped = [];

    for (const [index, rawSource] of (Array.isArray(sources) ? sources : []).entries()) {
      const source = sanitizeSource(rawSource);
      const key = sourceKey(source, index);
      const previous = seen.get(key);
      if (!previous) {
        const withMethods = {
          ...source,
          discoveryMethods: [...new Set([
            ...(Array.isArray(source.discoveryMethods) ? source.discoveryMethods : []),
            source.retrievalMethod || "UNKNOWN_RETRIEVAL",
          ])],
        };
        seen.set(key, withMethods);
        retained.push(withMethods);
        continue;
      }

      // Merge provenance without replacing the first candidate. This keeps a
      // live candidate visible even when a static source has the same URL.
      previous.discoveryMethods = [...new Set([
        ...(previous.discoveryMethods || []),
        source.retrievalMethod || "UNKNOWN_RETRIEVAL",
      ])];
      if (source.officialDiscovery === true) previous.officialDiscovery = true;
      if (source.publicApiDiscovery === true) previous.publicApiDiscovery = true;
      dropped.push({ key, reason: "SAFE_DEDUP_DUPLICATE", sourceId: source.sourceId || null });
    }

    return { sources: retained, dropped };
  }

  static merge({ staticSources = [], liveSources = [], officialDiscoverySources = [], publicApiDiscoverySources = [] } = {}) {
    const labeled = [
      ...staticSources.map((source) => ({ source, origin: "STATIC" })),
      ...liveSources.map((source) => ({ source, origin: "LIVE" })),
      ...officialDiscoverySources.map((source) => ({ source: { ...source, officialDiscovery: true }, origin: "OFFICIAL_DISCOVERY" })),
      ...publicApiDiscoverySources.map((source) => ({ source: { ...source, publicApiDiscovery: true }, origin: "PUBLIC_API_DISCOVERY" })),
    ];
    const prepared = labeled.map(({ source, origin }) => ({
      ...sanitizeSource(source),
      candidateOrigin: origin,
    }));
    const deduped = this.safeDedup(prepared);
    const originCounts = Object.fromEntries(["STATIC", "LIVE", "OFFICIAL_DISCOVERY", "PUBLIC_API_DISCOVERY"].map((origin) => [
      origin,
      prepared.filter((source) => source.candidateOrigin === origin).length,
    ]));

    return {
      sources: deduped.sources,
      trace: {
        candidatePool: "SAFE_DEDUP(STATIC ∪ LIVE ∪ OFFICIAL_DISCOVERY ∪ PUBLIC_API_DISCOVERY)",
        inputCounts: originCounts,
        retainedCount: deduped.sources.length,
        duplicateCount: deduped.dropped.length,
        dropped: deduped.dropped,
        unknownEntityPolicy: "RETAIN_AND_RANK_SOFTLY",
        liveCandidatesDeletedForUnknownEntity: 0,
      },
    };
  }
}
