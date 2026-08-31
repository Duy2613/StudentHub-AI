/**
 * Layer 3 — External Evidence & Provenance Service.
 *
 * Retrieval results are untrusted data. This service validates the retrieval
 * boundary, records whether evidence is live or local, preserves conflicts,
 * and never silently turns a provider failure into external verification.
 */

import { QueryGenerator } from "./query/QueryGenerator.js";
import { KnowledgeBaseRetriever } from "./retrieval/KnowledgeBaseRetriever.js";
import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import { isNetworkGuardedRetriever } from "./retrieval/NetworkGuard.js";
import { markTrustedLayer3Result } from "./TrustBoundary.js";

import { SourceAuthorityRegistry } from "./registry/SourceAuthorityRegistry.js";
import { EvidenceExtractor } from "./extractors/EvidenceExtractor.js";
import { createSecureId } from "../../security/secureId.js";
import { TemporalEvaluator } from "./extractors/TemporalEvaluator.js";
import { SourceIndependenceAnalyzer } from "./extractors/SourceIndependenceAnalyzer.js";
import { ClaimEvidenceMatcher } from "./extractors/ClaimEvidenceMatcher.js";
import { SourceConflictDetector } from "./engine/SourceConflictDetector.js";
import { CompletenessEngine } from "./engine/CompletenessEngine.js";
import { Layer3DecisionEngine } from "./engine/Layer3DecisionEngine.js";
import {
  createEvidence,
  createSource,
  createLayer3Result,
  FRESHNESS_STATUS,
  SOURCE_TYPE,
  EVIDENCE_PROVIDER_STATUS,
} from "./types.js";
import { LAYER_3_CONFIG } from "./config/Layer3Config.js";

const MAX_CLAIMS = 40;
const MAX_CANDIDATES = 80;
const MAX_QUERY_COUNT = 240;
const MAX_RETRIEVED_SOURCES = 80;
const MAX_TEXT_LENGTH = 1_000_000;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function boundedString(value, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safeClaim(claim, index) {
  if (!claim || typeof claim !== "object") return null;
  const claimId = boundedString(claim.claimId, 160) || `claim-${index + 1}`;
  const rawText = boundedString(claim.rawText, 1200);
  if (!rawText) return null;
  return {
    claimId,
    subject: boundedString(claim.subject, 240),
    predicate: boundedString(claim.predicate, 500),
    object: boundedString(claim.object, 800),
    scope: boundedString(claim.scope, 160) || "general",
    rawText,
    time: boundedString(claim.time, 40) || null,
    claimType: boundedString(claim.claimType, 80) || "GENERAL_FACT",
    importance: boundedString(claim.importance, 40) || "medium",
    verificationRequired: claim.verificationRequired !== false,
  };
}

function safeCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  const url = boundedString(candidate.url, 2048);
  if (!url) return null;
  return {
    sourceId: boundedString(candidate.sourceId, 160),
    url,
    domain: boundedString(candidate.domain, 180).toLowerCase(),
    title: boundedString(candidate.title, 240),
    publisher: boundedString(candidate.publisher, 180),
    publishedAt: typeof candidate.publishedAt === "string" ? candidate.publishedAt.slice(0, 80) : null,
    clusterId: boundedString(candidate.clusterId, 160) || null,
    sourceType: Object.values(SOURCE_TYPE).includes(candidate.sourceType) ? candidate.sourceType : null,
    isOfficial: candidate.isOfficial === true,
    officialDomains: asArray(candidate.officialDomains).slice(0, 12).map((item) => boundedString(item, 180).toLowerCase()).filter(Boolean),
    sourceFingerprint: boundedString(candidate.sourceFingerprint, 128) || null,
  };
}

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function throwIfAborted(signal) {
  if (!signal?.aborted) return;
  const error = signal.reason instanceof Error ? signal.reason : new Error("Layer 3 retrieval cancelled");
  error.name = "AbortError";
  throw error;
}

async function sha256Hex(value) {
  try {
    if (!globalThis.crypto?.subtle || typeof TextEncoder === "undefined") return null;
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

function inferSourceType(source, fetched, retrieverId) {
  if (source?.sourceType && Object.values(SOURCE_TYPE).includes(source.sourceType)) return source.sourceType;
  if (fetched?.sourceType && Object.values(SOURCE_TYPE).includes(fetched.sourceType)) return fetched.sourceType;
  if (fetched?.liveEvidence === true || String(retrieverId || "").includes("live")) {
    return source?.isOfficial ? SOURCE_TYPE.OFFICIAL_INSTITUTION : SOURCE_TYPE.SEARCH_RETRIEVAL;
  }
  return SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE;
}

function providerStatusFor(fetched, retrievalStatus, fetchedSuccessfully) {
  if (fetched?.providerStatus) return boundedString(fetched.providerStatus, 80);
  if (fetchedSuccessfully) return retrievalStatus || EVIDENCE_PROVIDER_STATUS.UNKNOWN;
  return EVIDENCE_PROVIDER_STATUS.UNAVAILABLE;
}

function isSuccessfulFetch(fetchResult) {
  return Boolean(fetchResult && fetchResult.status === 200 && typeof fetchResult.textContent === "string" && fetchResult.textContent.trim());
}

function safeFetchResult(value) {
  if (!value || typeof value !== "object") return { html: "", textContent: "", status: 502, error: "INVALID_RETRIEVER_RESPONSE" };
  const textContent = typeof value.textContent === "string" ? value.textContent.slice(0, MAX_TEXT_LENGTH) : "";
  return {
    html: typeof value.html === "string" ? value.html.slice(0, MAX_TEXT_LENGTH) : "",
    textContent,
    status: Number.isInteger(value.status) ? value.status : 502,
    error: boundedString(value.error, 120) || null,
    finalUrl: boundedString(value.finalUrl, 2048) || null,
    publishedAt: typeof value.publishedAt === "string" ? value.publishedAt.slice(0, 80) : null,
    sourceType: Object.values(SOURCE_TYPE).includes(value.sourceType) ? value.sourceType : null,
    providerStatus: Object.values(EVIDENCE_PROVIDER_STATUS).includes(value.providerStatus) ? value.providerStatus : null,
    liveEvidence: value.liveEvidence === true,
    retrievalOutcome: boundedString(value.retrievalOutcome, 80) || null,
  };
}

export class Layer3EvidenceService {
  static async verify(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const claims = input.claims;
    const candidateSources = input.candidateSources;
    const layer2Result = input.layer2Result;
    const options = input.options;
    const startTime = nowMs();
    const safeOptions = options && typeof options === "object" ? options : {};
    const requestId = boundedString(safeOptions.requestId || layer2Result?.requestId, 160) ||
      createSecureId("req_l3");
    const retriever = safeOptions.retriever || new KnowledgeBaseRetriever();
    const retrieverId = boundedString(retriever?.retrieverId, 160) || "unknown_retriever";
    const auditEvents = [];

    const rawClaims = asArray(claims).length > 0
      ? claims
      : asArray(layer2Result?.verificationPackage?.claims || layer2Result?.claims);
    const targetClaims = rawClaims.map(safeClaim).filter(Boolean).slice(0, MAX_CLAIMS);

    const rawCandidates = asArray(candidateSources).length > 0
      ? candidateSources
      : asArray(layer2Result?.verificationPackage?.candidateSources);
    const targetCandidates = rawCandidates.map(safeCandidate).filter(Boolean).slice(0, MAX_CANDIDATES);

    const allQueries = [];
    for (const claim of targetClaims) {
      const claimQueries = QueryGenerator.generateQueries(claim, targetCandidates);
      allQueries.push(...claimQueries);
    }
    const boundedQueries = allQueries.slice(0, MAX_QUERY_COUNT);

    let retrievedSources = [];
    let retrievalStatus = EVIDENCE_PROVIDER_STATUS.SUCCESS;
    let retrievalMode = retrieverId.includes("knowledge_base") || retrieverId.includes("institutional")
      ? "LOCAL_KNOWLEDGE_BASE"
      : "EXTERNAL_RETRIEVER";
    let externalEvidence = false;
    let fetchRetriever = retriever;

    try {
      throwIfAborted(safeOptions.signal);
      if (typeof retriever.search !== "function") throw new Error("RETRIEVER_SEARCH_UNAVAILABLE");
      const searchResult = await retriever.search(boundedQueries, { requestId, signal: safeOptions.signal });
      throwIfAborted(safeOptions.signal);
      retrievedSources = asArray(searchResult).map(safeCandidate).filter(Boolean).slice(0, MAX_RETRIEVED_SOURCES);
      if (retrieverId.includes("knowledge_base") || retrievedSources.some((src) => src.sourceType === SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE)) {
        retrievalMode = "LOCAL_KNOWLEDGE_BASE";
        retrievalStatus = EVIDENCE_PROVIDER_STATUS.LOCAL_ONLY;
      }
    } catch (err) {
      if (safeOptions.signal?.aborted || err?.name === "AbortError") throw err;
      retrievalStatus = EVIDENCE_PROVIDER_STATUS.UNAVAILABLE;
      retrievalMode = "LOCAL_FALLBACK";
      auditEvents.push({ type: "RETRIEVER_FAILURE", code: boundedString(err?.message, 120) || "RETRIEVER_FAILURE", at: new Date().toISOString() });
      try {
        const fallback = new KnowledgeBaseRetriever();
        fetchRetriever = fallback;
        retrievedSources = asArray(await fallback.search(boundedQueries, { requestId, signal: safeOptions.signal }))
          .map(safeCandidate).filter(Boolean).slice(0, MAX_RETRIEVED_SOURCES);
      } catch (fallbackError) {
        if (safeOptions.signal?.aborted || fallbackError?.name === "AbortError") throw fallbackError;
        retrievedSources = [];
        auditEvents.push({ type: "LOCAL_FALLBACK_FAILURE", code: boundedString(fallbackError?.message, 120) || "LOCAL_FALLBACK_FAILURE", at: new Date().toISOString() });
      }
    }

    const evidenceItems = [];
    const processedSources = [];

    for (const src of retrievedSources) {
      throwIfAborted(safeOptions.signal);
      const urlGuard = validateRemoteUrlSync(src.url);
      if (!urlGuard.ok) {
        auditEvents.push({ type: "RETRIEVAL_REJECTED", code: urlGuard.code, sourceId: src.sourceId || null, at: new Date().toISOString() });
        continue;
      }

      let fetchResult;
      try {
        if (typeof fetchRetriever.fetch !== "function") throw new Error("RETRIEVER_FETCH_UNAVAILABLE");
        fetchResult = safeFetchResult(await fetchRetriever.fetch(urlGuard.url, { requestId, signal: safeOptions.signal }));
      } catch (err) {
        if (safeOptions.signal?.aborted || err?.name === "AbortError") throw err;
        fetchResult = { html: "", textContent: "", status: 502, error: boundedString(err?.message, 120) || "FETCH_FAILURE" };
      }
      throwIfAborted(safeOptions.signal);

      const fetchedSuccessfully = isSuccessfulFetch(fetchResult);
      const sourceType = inferSourceType(src, fetchResult, retrieverId);
      const providerStatus = providerStatusFor(fetchResult, retrievalStatus, fetchedSuccessfully);
      const authority = SourceAuthorityRegistry.evaluateAuthority(src.domain || urlGuard.url, "general");
      const sourceFingerprint = src.sourceType === SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE
        ? src.sourceFingerprint
        : await sha256Hex(urlGuard.url);
      const contentFingerprint = fetchedSuccessfully ? await sha256Hex(fetchResult.textContent) : null;
      const liveEvidenceAllowed = sourceType !== SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE &&
        isNetworkGuardedRetriever(fetchRetriever) &&
        fetchedSuccessfully &&
        fetchResult.liveEvidence === true;
      const sourceDto = createSource({
        sourceId: src.sourceId,
        url: urlGuard.url,
        domain: src.domain || authority.domain,
        title: src.title,
        publisher: src.publisher,
        authorityTier: authority.tier,
        authorityScore: authority.score,
        authorityBasis: authority.basis,
        publishedAt: fetchResult.publishedAt || src.publishedAt,
        clusterId: src.clusterId,
        isOfficial: authority.isOfficial,
        sourceType,
        providerStatus,
        liveEvidence: liveEvidenceAllowed,
        sourceFingerprint,
        contentFingerprint,
        retrievalOutcome: fetchedSuccessfully ? "SUCCESS" : "FAILURE",
      });
      processedSources.push(sourceDto);
      externalEvidence = externalEvidence || sourceDto.liveEvidence;

      if (!fetchedSuccessfully) {
        auditEvents.push({ type: "SOURCE_FETCH_FAILED", sourceId: sourceDto.sourceId, status: fetchResult.status, at: new Date().toISOString() });
        continue;
      }

      const textContent = fetchResult.textContent;
      for (const claim of targetClaims) {
        const excerpt = boundedString(EvidenceExtractor.extractRelevantPassage(textContent, claim), LAYER_3_CONFIG.LIMITS.MAX_EXCERPT_LENGTH);
        if (!excerpt || excerpt.length < LAYER_3_CONFIG.LIMITS.MIN_EXCERPT_LENGTH) continue;

        const temporal = TemporalEvaluator.evaluate({
          publishedAt: fetchResult.publishedAt || src.publishedAt,
          claim,
        });
        const matchResult = ClaimEvidenceMatcher.match(claim, excerpt, sourceDto);
        const relation = temporal.isValidForClaim === false && temporal.freshness === FRESHNESS_STATUS.UNKNOWN
          ? "INSUFFICIENT"
          : matchResult.relation;

        evidenceItems.push(createEvidence({
          claimId: claim.claimId,
          sourceId: sourceDto.sourceId,
          sourceUrl: sourceDto.url,
          sourceTitle: sourceDto.title,
          excerpt,
          relation,
          relevance: matchResult.relevance,
          strength: matchResult.strength,
          publishedAt: fetchResult.publishedAt || src.publishedAt,
          freshness: temporal.freshness,
          authorityTier: authority.tier,
          clusterId: sourceDto.clusterId,
          sourceType: sourceDto.sourceType,
          providerStatus: sourceDto.providerStatus,
          liveEvidence: sourceDto.liveEvidence,
          sourceFingerprint: sourceDto.sourceFingerprint,
          contentFingerprint: sourceDto.contentFingerprint,
          retrievalOutcome: sourceDto.retrievalOutcome,
        }));
      }
    }

    const independence = SourceIndependenceAnalyzer.analyzeIndependence(processedSources, evidenceItems);
    const conflicts = SourceConflictDetector.detectConflicts(evidenceItems);
    const completenessResult = CompletenessEngine.calculateCompleteness({
      claims: targetClaims,
      evidence: evidenceItems,
      sources: processedSources,
      independence,
    });
    const { verificationCompleteness, evidenceConfidence, crossSourceAgreement } = completenessResult;
    const decision = Layer3DecisionEngine.resolveStatus({
      claims: targetClaims,
      evidence: evidenceItems,
      conflicts,
      completeness: verificationCompleteness,
      externalEvidence,
    });

    const limitations = [
      ...asArray(decision.limitations),
      ...(retrievalStatus === EVIDENCE_PROVIDER_STATUS.LOCAL_ONLY || retrievalMode === "LOCAL_FALLBACK"
        ? ["Bằng chứng cục bộ/fallback không được coi là xác minh trực tiếp từ nguồn bên ngoài."]
        : []),
      ...(!externalEvidence && evidenceItems.length > 0
        ? ["Không có bằng chứng live độc lập; trạng thái được hạ cấp để tránh false-safe."]
        : []),
    ];

    return markTrustedLayer3Result(createLayer3Result({
      status: decision.status,
      claims: targetClaims,
      claimStatuses: decision.claimStatuses,
      sources: processedSources,
      evidence: evidenceItems,
      sourceAuthority: {
        totalEvaluated: processedSources.length,
        primaryCount: processedSources.filter((s) => s.isOfficial).length,
        bySource: processedSources.map((s) => ({ sourceId: s.sourceId, tier: s.authorityTier, scope: s.sourceScope, sourceType: s.sourceType })),
      },
      sourceIndependence: independence,
      crossSourceAgreement,
      conflicts,
      temporalAssessment: {
        allCurrent: evidenceItems.length > 0 && evidenceItems.every((e) => e.freshness === FRESHNESS_STATUS.CURRENT),
        outdatedEvidenceCount: evidenceItems.filter((e) => e.freshness === FRESHNESS_STATUS.OUTDATED).length,
        unknownDateCount: evidenceItems.filter((e) => e.freshness === FRESHNESS_STATUS.UNKNOWN).length,
      },
      verificationCompleteness,
      evidenceConfidence,
      limitations,
      nextLayer: 4,
      requestId,
      retrievalStatus,
      retrievalMode,
      externalEvidence,
      auditEvents,
      metrics: {
        executionTimeMs: Number((nowMs() - startTime).toFixed(2)),
        queriesExecutedCount: boundedQueries.length,
        retrievalProvider: retrieverId,
        retrievalStatus,
        retrievalMode,
        externalEvidence,
        providerIndependent: retrieverId.includes("knowledge_base"),
      },
    }));
  }
}
