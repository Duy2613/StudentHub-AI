import { createHash } from "node:crypto";

export const PROVENANCE_SCHEMA_VERSION = "trust.provenance.v1";

const ORIGIN_PREFIX = Object.freeze({
  LAYER_1_INTERNAL: "l1",
  LAYER_2_PROVIDER: "l2",
  LAYER_3_WEB_EVIDENCE: "l3",
  LAYER_4_INDEPENDENT_RESEARCH: "l4",
  COMMUNITY: "community",
  EXPERT: "expert",
});

const PROVIDER_STATUS = new Set([
  "READY",
  "SUCCESS",
  "PARTIAL",
  "DEGRADED",
  "RATE_LIMITED",
  "TIMEOUT",
  "AUTH_FAILED",
  "MALFORMED",
  "INVALID_RESPONSE",
  "UNAVAILABLE",
  "NOT_CONFIGURED",
  "CIRCUIT_OPEN",
  "UNKNOWN",
]);

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeText(value, max = 700) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : "";
}

function boundedArray(value, max = 80) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function boundedUnit(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? Number(value.toFixed(4))
    : null;
}

function timestamp(value, fallback = new Date().toISOString()) {
  const parsed = new Date(value || fallback);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function digest(value, length = 24) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex").slice(0, length);
}

function canonicalUrl(value) {
  const raw = safeText(value, 4096);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return raw;
  }
}

export function contentFingerprint(value) {
  const normalized = safeText(value, 12_000).replace(/\s+/g, " ").toLowerCase();
  return normalized ? `sha256:${digest(normalized, 32)}` : null;
}

export function sourceDocumentIdFor({ sourceDocumentId, url, canonicalUrl: suppliedCanonicalUrl, title } = {}) {
  const explicit = safeText(sourceDocumentId, 180);
  if (explicit) return explicit;
  const normalizedUrl = canonicalUrl(suppliedCanonicalUrl || url);
  return `source_document:${digest(normalizedUrl || safeText(title, 240) || "unknown-source")}`;
}

export function observationIdFor({ observationId, origin, rawReference, fallback = "observation" } = {}) {
  const explicit = safeText(observationId, 180);
  if (explicit) return explicit;
  const prefix = ORIGIN_PREFIX[safeText(origin, 80).toUpperCase()] || "observation";
  return `${prefix}:${safeText(rawReference, 160) || digest(fallback)}`;
}

export function createSourceDocument({
  sourceDocumentId,
  url,
  canonicalUrl: suppliedCanonicalUrl = null,
  domain = null,
  title = null,
  publisher = null,
  contentFingerprint: suppliedContentFingerprint = null,
  firstObservedAt = null,
  lastObservedAt = null,
} = {}) {
  const normalizedUrl = canonicalUrl(suppliedCanonicalUrl || url);
  return Object.freeze({
    sourceDocumentId: sourceDocumentIdFor({ sourceDocumentId, url, canonicalUrl: normalizedUrl, title }),
    url: safeText(url, 4096) || null,
    canonicalUrl: normalizedUrl,
    domain: safeText(domain, 180) || null,
    title: safeText(title, 240) || null,
    publisher: safeText(publisher, 180) || null,
    contentFingerprint: safeText(suppliedContentFingerprint, 80) || null,
    firstObservedAt: firstObservedAt ? timestamp(firstObservedAt) : null,
    lastObservedAt: lastObservedAt ? timestamp(lastObservedAt) : null,
  });
}

export function createRetrievalRun({
  retrievalRunId,
  requestId,
  providerId,
  capability,
  origin,
  startedAt = null,
  completedAt = null,
  status = "UNKNOWN",
  queryId = null,
} = {}) {
  const providerStatus = PROVIDER_STATUS.has(String(status).toUpperCase()) ? String(status).toUpperCase() : "UNKNOWN";
  return Object.freeze({
    retrievalRunId: safeText(retrievalRunId, 180) || `retrieval:${digest([requestId, providerId, origin].join("|"))}`,
    requestId: safeText(requestId, 160) || null,
    providerId: safeText(providerId, 160) || "unknown_provider",
    capability: safeText(capability, 100) || "UNKNOWN",
    origin: safeText(origin, 80).toUpperCase() || "UNKNOWN",
    startedAt: startedAt ? timestamp(startedAt) : null,
    completedAt: completedAt ? timestamp(completedAt) : null,
    status: providerStatus,
    queryId: safeText(queryId, 180) || null,
  });
}

export function createEvidenceObservation({
  observationId,
  sourceDocumentId,
  retrievalRunId,
  origin,
  layer,
  providerId,
  claimId = null,
  relation = "INSUFFICIENT",
  observedAt = null,
  observation = null,
  content = null,
  liveEvidence = false,
  providerStatus = "UNKNOWN",
  rawReference = null,
} = {}) {
  const safeStatus = PROVIDER_STATUS.has(String(providerStatus).toUpperCase()) ? String(providerStatus).toUpperCase() : "UNKNOWN";
  const safeContent = safeText(content || observation, 4_000) || null;
  return Object.freeze({
    observationId: observationIdFor({ observationId, origin, rawReference, fallback: [sourceDocumentId, observedAt, safeContent].join("|") }),
    sourceDocumentId: safeText(sourceDocumentId, 180) || null,
    retrievalRunId: safeText(retrievalRunId, 180) || null,
    origin: safeText(origin, 80).toUpperCase() || "UNKNOWN",
    layer: safeText(layer, 40) || null,
    providerId: safeText(providerId, 160) || "unknown_provider",
    claimId: safeText(claimId, 160) || null,
    relation: safeText(relation, 80).toUpperCase() || "INSUFFICIENT",
    observedAt: timestamp(observedAt),
    content: safeContent,
    contentFingerprint: contentFingerprint(safeContent),
    liveEvidence: liveEvidence === true,
    providerStatus: safeStatus,
    rawReference: safeText(rawReference, 180) || null,
  });
}

export function createProviderObservation({
  providerObservationId,
  providerId,
  capability,
  origin,
  requestId = null,
  status = "UNKNOWN",
  verdict = null,
  confidence = null,
  observedAt = null,
  latencyMs = 0,
  errorCode = null,
} = {}) {
  const safeStatus = PROVIDER_STATUS.has(String(status).toUpperCase()) ? String(status).toUpperCase() : "UNKNOWN";
  return Object.freeze({
    providerObservationId: safeText(providerObservationId, 180) || `provider_observation:${digest([providerId, capability, requestId, observedAt].join("|"))}`,
    providerId: safeText(providerId, 160) || "unknown_provider",
    capability: safeText(capability, 100) || "UNKNOWN",
    origin: safeText(origin, 80).toUpperCase() || "UNKNOWN",
    requestId: safeText(requestId, 160) || null,
    status: safeStatus,
    verdict: safeText(verdict, 100).toUpperCase() || null,
    confidence: boundedUnit(confidence),
    observedAt: timestamp(observedAt),
    latencyMs: Number.isFinite(Number(latencyMs)) ? Math.max(0, Math.round(Number(latencyMs))) : 0,
    errorCode: safeText(errorCode, 120) || null,
  });
}

export function createClaimEvidenceLink({
  linkId,
  claimId,
  evidenceObservationId,
  relation = "INSUFFICIENT",
  createdAt = null,
  sourceDocumentId = null,
} = {}) {
  return Object.freeze({
    linkId: safeText(linkId, 180) || `claim-link:${digest([claimId, evidenceObservationId, relation].join("|"))}`,
    claimId: safeText(claimId, 160) || null,
    evidenceObservationId: safeText(evidenceObservationId, 180) || null,
    sourceDocumentId: safeText(sourceDocumentId, 180) || null,
    relation: safeText(relation, 80).toUpperCase() || "INSUFFICIENT",
    createdAt: timestamp(createdAt),
  });
}

export function createDecisionRevision({
  revisionId,
  caseId = null,
  requestId = null,
  previousDecision = null,
  nextDecision = null,
  reason = null,
  observedAt = null,
  evidenceObservationIds = [],
} = {}) {
  return Object.freeze({
    revisionId: safeText(revisionId, 180) || `decision_revision:${digest([caseId, requestId, observedAt].join("|"))}`,
    caseId: safeText(caseId, 160) || null,
    requestId: safeText(requestId, 160) || null,
    previousDecision: safeText(previousDecision, 120) || null,
    nextDecision: safeText(nextDecision, 120) || null,
    reason: safeText(reason, 1_200) || null,
    observedAt: timestamp(observedAt),
    evidenceObservationIds: boundedArray(evidenceObservationIds, 40).map((value) => safeText(value, 180)).filter(Boolean),
  });
}

function originForEvidence(item) {
  return safeText(item?.origin, 80).toUpperCase() || "LAYER_1_INTERNAL";
}

function providerForEvidence(item) {
  return safeText(item?.provider, 160) || "unknown_provider";
}

export function buildProvenanceBundle({ requestId, input = {}, evidence = [], finalDecision = null } = {}) {
  const sourceDocuments = [];
  const sourceDocumentByKey = new Map();
  const retrievalRuns = [];
  const retrievalRunByKey = new Map();
  const providerObservations = [];
  const providerObservationByKey = new Map();
  const observations = [];
  const claimEvidenceLinks = [];

  const ensureSourceDocument = (item) => {
    const source = asRecord(item?.source);
    const sourceUrl = canonicalUrl(source.url);
    if (!sourceUrl && safeText(item?.type, 100).toUpperCase() === "MODEL_ASSESSMENT") return null;
    const title = safeText(source.title, 240).toLowerCase();
    const key = sourceUrl || (title ? `title:${title}` : `item:${safeText(item?.id, 180) || digest(JSON.stringify(item || {}))}`);
    if (!sourceDocumentByKey.has(key)) {
      const document = createSourceDocument({
        sourceDocumentId: sourceDocumentIdFor({ url: sourceUrl, title: source.title }),
        url: source.url,
        title: source.title,
        contentFingerprint: item?.contentFingerprint || item?.provenance?.contentFingerprint,
        firstObservedAt: item?.retrievedAt,
        lastObservedAt: item?.retrievedAt,
      });
      sourceDocumentByKey.set(key, document);
      sourceDocuments.push(document);
    }
    return sourceDocumentByKey.get(key);
  };

  const ensureRetrievalRun = (item, origin, providerId) => {
    const key = `${origin}|${providerId}|${safeText(item?.retrievedAt, 80) || "run"}`;
    if (!retrievalRunByKey.has(key)) {
      const run = createRetrievalRun({
        retrievalRunId: `${ORIGIN_PREFIX[origin] || "provider"}:retrieval:${digest([requestId, providerId, origin].join("|"))}`,
        requestId,
        providerId,
        capability: origin === "LAYER_3_WEB_EVIDENCE" ? "WebEvidenceProvider" : origin === "LAYER_4_INDEPENDENT_RESEARCH" ? "IndependentResearchProvider" : "TrustObservationProvider",
        origin,
        startedAt: item?.retrievedAt,
        completedAt: item?.retrievedAt,
        status: item?.provenance?.providerStatus || item?.providerStatus || "UNKNOWN",
      });
      retrievalRunByKey.set(key, run);
      retrievalRuns.push(run);
    }
    return retrievalRunByKey.get(key);
  };

  const ensureProviderObservation = (item, origin, providerId) => {
    const key = `${origin}|${providerId}`;
    if (!providerObservationByKey.has(key)) {
      const layer = safeText(item?.layer, 40) || null;
      const observation = createProviderObservation({
        providerObservationId: `${ORIGIN_PREFIX[origin] || "provider"}:provider:${digest([requestId, providerId, origin].join("|"))}`,
        providerId,
        capability: layer === "L3" ? "WebEvidenceProvider" : layer === "L4" ? "IndependentResearchProvider" : "TrustObservationProvider",
        origin,
        requestId,
        status: item?.provenance?.providerStatus || item?.providerStatus || "UNKNOWN",
        verdict: item?.status,
        confidence: item?.reliabilityMetadata?.confidence,
        observedAt: item?.retrievedAt,
      });
      providerObservationByKey.set(key, observation);
      providerObservations.push(observation);
    }
    return providerObservationByKey.get(key);
  };

  for (const item of boundedArray(evidence, 240)) {
    const origin = originForEvidence(item);
    const providerId = providerForEvidence(item);
    const document = ensureSourceDocument(item);
    const retrievalRun = ensureRetrievalRun(item, origin, providerId);
    const providerObservation = ensureProviderObservation(item, origin, providerId);
    const observation = createEvidenceObservation({
      observationId: observationIdFor({ origin, rawReference: item?.id || item?.rawReference, fallback: [requestId, document?.sourceDocumentId || providerId].join("|") }),
      sourceDocumentId: document?.sourceDocumentId,
      retrievalRunId: retrievalRun.retrievalRunId,
      origin,
      layer: item?.layer,
      providerId: providerObservation.providerId,
      claimId: item?.claim,
      relation: item?.status,
      observedAt: item?.retrievedAt,
      observation: item?.observation,
      content: item?.observation,
      liveEvidence: item?.provenance?.liveEvidence === true,
      providerStatus: providerObservation.status,
      rawReference: item?.rawReference || item?.id,
    });
    observations.push(observation);
    if (observation.claimId) {
      claimEvidenceLinks.push(createClaimEvidenceLink({
        claimId: observation.claimId,
        evidenceObservationId: observation.observationId,
        sourceDocumentId: observation.sourceDocumentId,
        relation: observation.relation,
        createdAt: observation.observedAt,
      }));
    }
  }

  const decisionRevision = finalDecision
    ? createDecisionRevision({
      revisionId: `decision_revision:${safeText(requestId, 160) || digest(JSON.stringify(finalDecision))}`,
      caseId: safeText(input?.caseId, 160) || null,
      requestId,
      previousDecision: null,
      nextDecision: finalDecision.security || finalDecision.truth || finalDecision.action,
      reason: "Canonical deterministic Trust policy composed this revision.",
      evidenceObservationIds: observations.map((item) => item.observationId),
    })
    : null;

  return {
    schemaVersion: PROVENANCE_SCHEMA_VERSION,
    requestId: safeText(requestId, 160) || null,
    sourceDocuments: sourceDocuments.slice(0, 240),
    retrievalRuns: retrievalRuns.slice(0, 240),
    evidenceObservations: observations.slice(0, 240),
    providerObservations: providerObservations.slice(0, 120),
    claimEvidenceLinks: claimEvidenceLinks.slice(0, 240),
    decisionRevisions: decisionRevision ? [decisionRevision] : [],
    sourceCount: Math.min(sourceDocuments.length, 240),
    observationCount: Math.min(observations.length, 240),
  };
}

export function attachProvenanceToEvidence(evidence, provenance) {
  const observationByReference = new Map((provenance?.evidenceObservations || []).map((item) => [item.rawReference, item]));
  return boundedArray(evidence, 240).map((item) => {
    const observation = observationByReference.get(item.rawReference || item.id) || null;
    if (!observation) return item;
    return {
      ...item,
      observationId: observation.observationId,
      sourceDocumentId: observation.sourceDocumentId,
      retrievalRunId: observation.retrievalRunId,
      providerObservationId: (provenance?.providerObservations || []).find((provider) => provider.providerId === observation.providerId && provider.origin === observation.origin)?.providerObservationId || null,
      contentFingerprint: observation.contentFingerprint,
      provenance: {
        ...asRecord(item.provenance),
        sourceDocumentId: observation.sourceDocumentId,
        observationId: observation.observationId,
        retrievalRunId: observation.retrievalRunId,
        providerObservationId: (provenance?.providerObservations || []).find((provider) => provider.providerId === observation.providerId && provider.origin === observation.origin)?.providerObservationId || null,
        contentFingerprint: observation.contentFingerprint,
      },
      claimEvidenceLinkId: (provenance?.claimEvidenceLinks || []).find((link) => link.evidenceObservationId === observation.observationId)?.linkId || null,
    };
  });
}
