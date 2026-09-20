/**
 * Layer 3 — External Evidence & Provenance Service.
 *
 * Retrieval results are untrusted data. This service validates the retrieval
 * boundary, records whether evidence is live or local, preserves conflicts,
 * and never silently turns a provider failure into external verification.
 */

import { QueryGenerator } from "./query/QueryGenerator.js";
import { KnowledgeBaseRetriever } from "./retrieval/KnowledgeBaseRetriever.js";
import { TavilyRetriever } from "./retrieval/TavilyRetriever.js";
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
  CLAIM_EVIDENCE_RELATION,
  FRESHNESS_STATUS,
  SOURCE_TYPE,
  RETRIEVAL_ORIGIN,
  EVIDENCE_PROVIDER_STATUS,
} from "./types.js";
import { LAYER_3_CONFIG } from "./config/Layer3Config.js";
import { VERIFICATION_TASK_TYPES } from "../layer2/types.js";
import {
  L2C_VERIFICATION_TASK_TYPES,
  normalizeStudentDomainVerificationPackage,
  verificationTaskCatalog,
} from "../v5/l2c/verificationPackage.js";

const MAX_CLAIMS = 40;
const MAX_TEXT_LENGTH = 1_000_000;
const MAX_VERIFICATION_TASKS = 80;

const L2B_TASK_TYPES = new Set(Object.values(VERIFICATION_TASK_TYPES));
const L2C_TASK_TYPES = new Set(Object.values(L2C_VERIFICATION_TASK_TYPES));
const TASK_SOURCE_SCOPES = new Set(["OFFICIAL_INSTITUTION", "OFFICIAL_SOURCE", "THREAT_INTELLIGENCE", "GENERAL_SOURCE"]);

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
    origin: boundedString(claim.origin, 80) || "L2B_SEMANTIC",
    candidateOnly: claim.candidateOnly !== false,
    sourceScope: boundedString(claim.sourceScope, 120) || "GENERAL_SOURCE",
    verificationTaskId: boundedString(claim.verificationTaskId, 160) || null,
  };
}

function safeVerificationTask(task, index, forcedOrigin = null) {
  if (!task || typeof task !== "object" || Array.isArray(task)) return null;
  const type = boundedString(task.type, 100);
  const isL2C = L2C_TASK_TYPES.has(type);
  if (!L2B_TASK_TYPES.has(type) && !isL2C) return null;
  const catalog = isL2C ? verificationTaskCatalog(type) : null;
  const origin = forcedOrigin || (isL2C ? "L2C_DOMAIN_AI" : "L2B_SEMANTIC");
  const sourceScope = TASK_SOURCE_SCOPES.has(task.sourceScope) ? task.sourceScope : catalog?.sourceScope || "GENERAL_SOURCE";
  const fixedRequirements = catalog?.evidenceRequirements || [];
  return {
    taskId: boundedString(task.taskId, 160) || `verification-task-${index + 1}`,
    type,
    classification: boundedString(task.classification, 120) || null,
    priority: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(String(task.priority).toUpperCase()) ? String(task.priority).toUpperCase() : "MEDIUM",
    claimId: boundedString(task.claimId, 160) || null,
    purpose: boundedString(task.purpose, 240) || catalog?.purpose || `verification ${type}`,
    targetClaim: boundedString(task.targetClaim, 1_200) || catalog?.targetClaim || null,
    sourceScope,
    evidenceRequirements: (fixedRequirements.length > 0 ? fixedRequirements : asArray(task.evidenceRequirements))
      .map((item) => boundedString(item, 240)).filter(Boolean).slice(0, 4),
    origin,
    candidateOnly: true,
    inputTrust: "UNTRUSTED_MODEL_OUTPUT",
  };
}

function taskDedupeKey(task) {
  return [task.type, task.claimId || "", task.purpose || "", task.targetClaim || ""].join("|").toLowerCase();
}

function mergeVerificationTasks(layer2Result, layer2CVerificationPackage) {
  const l2bRaw = asArray(layer2Result?.verificationPackage?.verificationTasks || layer2Result?.verificationTasks).slice(0, MAX_VERIFICATION_TASKS);
  const l2cPackage = normalizeStudentDomainVerificationPackage(layer2CVerificationPackage);
  const l2cRaw = asArray(l2cPackage.verificationTasks).slice(0, MAX_VERIFICATION_TASKS);
  const merged = [];
  const keys = new Set();
  let deduplicatedCount = 0;
  for (const [index, task] of [...l2bRaw.map((item) => ({ item, origin: "L2B_SEMANTIC" })), ...l2cRaw.map((item) => ({ item, origin: "L2C_DOMAIN_AI" }))].entries()) {
    const safe = safeVerificationTask(task.item, index, task.origin);
    if (!safe) continue;
    const key = taskDedupeKey(safe);
    if (keys.has(key)) {
      deduplicatedCount += 1;
      continue;
    }
    keys.add(key);
    merged.push(safe);
    if (merged.length >= MAX_VERIFICATION_TASKS) break;
  }
  return {
    tasks: merged,
    l2bTaskCount: l2bRaw.length,
    l2cTaskCount: l2cRaw.length,
    deduplicatedCount,
    highImpactTaskCount: merged.filter((task) => ["CRITICAL", "HIGH"].includes(task.priority)).length,
    l2cPackage: l2cPackage.status === "UNKNOWN" && l2cRaw.length === 0 ? null : l2cPackage,
  };
}

function l2cCandidateClaims(verificationPackage) {
  const pkg = verificationPackage && typeof verificationPackage === "object" ? verificationPackage : {};
  return asArray(pkg.domainClaims).slice(0, 12).map((claim) => ({
    claimId: claim.claimId,
    subject: "StudentHub domain classification",
    predicate: "requires independent verification",
    object: claim.classification || "high-impact student-domain risk",
    scope: "OFFICIAL_INSTITUTION",
    rawText: claim.statement,
    claimType: "institutional",
    importance: claim.importance || "high",
    verificationRequired: true,
    origin: "L2C_DOMAIN_AI",
    candidateOnly: true,
    sourceScope: "OFFICIAL_INSTITUTION",
  }));
}

function dedupeClaims(claims) {
  const seen = new Set();
  return claims.map(safeClaim).filter(Boolean).filter((claim) => {
    const key = `${claim.claimId}|${claim.rawText}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_CLAIMS);
}

function safeCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  const url = boundedString(candidate.url, 2048);
  if (!url) return null;
  if (candidate.retrievalOrigin && !Object.values(RETRIEVAL_ORIGIN).includes(candidate.retrievalOrigin)) return null;
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
    retrievalOrigin: candidate.retrievalOrigin || null,
    sourceScope: boundedString(candidate.sourceScope, 120) || "claim_specific",
  };
}

function directInputCandidates(requestInput) {
  const source = requestInput && typeof requestInput === "object" && !Array.isArray(requestInput)
    ? requestInput
    : {};
  const inputType = String(source.type || "").toLowerCase();
  const metadata = source.metadata && typeof source.metadata === "object" ? source.metadata : {};
  const values = [
    source.content,
    metadata.url,
    source.url,
    metadata.ocrText,
    metadata.qrContent,
    metadata.qrPayload,
    metadata.qrIntake?.normalizedValue,
  ].filter((value) => typeof value === "string" && value.trim());
  const candidates = [];
  for (const value of values) {
    const matches = inputType === "url" && /^https?:\/\//i.test(value.trim())
      ? [value.trim()]
      : (value.match(/https?:\/\/[^\s<>"'`]+/gi) || []);
    for (const match of matches) {
      const candidateUrl = match.replace(/[),.;!?\]}]+$/g, "");
      const guard = validateRemoteUrlSync(candidateUrl);
      if (!guard.ok) continue;
      let parsed;
      try { parsed = new URL(guard.url); } catch { continue; }
      const hostname = parsed.hostname.toLowerCase();
      const multimodal = inputType === "image" || inputType === "qr";
      candidates.push({
        sourceId: createSecureId("src_direct_input"),
        url: guard.url,
        domain: hostname,
        title: `${multimodal ? inputType.toUpperCase() : "Direct input"} · ${hostname}`,
        publisher: hostname,
        sourceType: SOURCE_TYPE.USER_SUPPLIED,
        sourceScope: multimodal ? "multimodal_extracted_url" : "direct_input",
        isOfficial: false,
        retrievalOrigin: RETRIEVAL_ORIGIN.DIRECT_INPUT,
        retrievalOutcome: "CANDIDATE",
      });
    }
  }
  return dedupeCandidates(candidates, { defaultOrigin: RETRIEVAL_ORIGIN.DIRECT_INPUT });
}

function dedupeCandidates(candidates, { defaultOrigin, supplemental = false } = {}) {
  const seenUrls = new Set();
  const seenIds = new Set();
  return asArray(candidates).map((candidate, index) => {
    const origin = candidate?.retrievalOrigin || defaultOrigin || RETRIEVAL_ORIGIN.TAVILY_INITIAL;
    const sourceId = boundedString(candidate?.sourceId, 160) || `source-${index + 1}`;
    return safeCandidate({
      ...candidate,
      sourceId: supplemental && !sourceId.startsWith("supplemental-")
        ? `supplemental-${sourceId}`
        : sourceId,
      retrievalOrigin: origin,
    });
  }).filter((candidate) => {
    if (!candidate || seenUrls.has(candidate.url.toLowerCase()) || seenIds.has(candidate.sourceId)) return false;
    seenUrls.add(candidate.url.toLowerCase());
    seenIds.add(candidate.sourceId);
    return true;
  });
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

function safeRetrieverDiagnostics(retriever) {
  if (!retriever || typeof retriever.getRuntimeDiagnostics !== "function") return {};
  try {
    const diagnostics = retriever.getRuntimeDiagnostics();
    if (!diagnostics || typeof diagnostics !== "object" || Array.isArray(diagnostics)) return {};
    return {
      callCount: Number.isFinite(Number(diagnostics.callCount)) ? Math.max(0, Number(diagnostics.callCount)) : 0,
      durationMs: Number.isFinite(Number(diagnostics.durationMs)) ? Math.max(0, Number(diagnostics.durationMs)) : 0,
      timeoutConfiguredMs: Number.isFinite(Number(diagnostics.timeoutConfiguredMs)) ? Math.max(0, Number(diagnostics.timeoutConfiguredMs)) : null,
      parentTimeoutMs: Number.isFinite(Number(diagnostics.parentTimeoutMs)) ? Math.max(0, Number(diagnostics.parentTimeoutMs)) : null,
      rawResultCount: Number.isFinite(Number(diagnostics.rawResultCount)) ? Math.max(0, Number(diagnostics.rawResultCount)) : 0,
      acceptedResults: Number.isFinite(Number(diagnostics.acceptedResults)) ? Math.max(0, Number(diagnostics.acceptedResults)) : 0,
      acceptedHostCount: Number.isFinite(Number(diagnostics.acceptedHostCount)) ? Math.max(0, Number(diagnostics.acceptedHostCount)) : 0,
      rejectedResults: Number.isFinite(Number(diagnostics.rejectedResults)) ? Math.max(0, Number(diagnostics.rejectedResults)) : 0,
      rejectionReasons: asArray(diagnostics.rejectionReasons).map((item) => boundedString(item, 120)).filter(Boolean).slice(0, 20),
      httpStatuses: asArray(diagnostics.httpStatuses).map((item) => Number(item)).filter((item) => Number.isInteger(item) && item >= 100 && item <= 599).slice(-20),
      timeoutClassification: boundedString(diagnostics.lastTimeoutClassification, 80) || null,
      abortReason: boundedString(diagnostics.lastAbortReason, 80) || null,
      retryCount: Number.isFinite(Number(diagnostics.retryCount)) ? Math.max(0, Number(diagnostics.retryCount)) : 0,
      retryExhausted: diagnostics.providerRetryExhausted === true,
      retryable: typeof diagnostics.providerRetryable === "boolean" ? diagnostics.providerRetryable : null,
      requestTrace: asArray(diagnostics.requestTrace).slice(-12).map((trace) => {
        if (!trace || typeof trace !== "object" || Array.isArray(trace)) return null;
        const httpStatus = Number(trace.httpStatus);
        const timeoutMs = Number(trace.timeoutMs);
        const durationMs = Number(trace.durationMs);
        const attempt = Number(trace.attempt);
        return {
          startedAt: boundedString(trace.startedAt, 80) || null,
          endedAt: boundedString(trace.endedAt, 80) || null,
          durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.min(durationMs, 120_000)) : 0,
          httpStatus: Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? httpStatus : null,
          abortReason: boundedString(trace.abortReason, 80) || null,
          classification: boundedString(trace.classification, 80) || "OTHER",
          outcome: boundedString(trace.outcome, 80) || "ERROR",
          timeoutMs: Number.isFinite(timeoutMs) ? Math.max(0, Math.min(timeoutMs, 8_000)) : null,
          attempt: Number.isInteger(attempt) && attempt > 0 ? attempt : 1,
        };
      }).filter(Boolean),
    };
  } catch {
    return {};
  }
}

export class Layer3EvidenceService {
  static async verify(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const claims = input.claims;
    const candidateSources = input.candidateSources;
    const layer2Result = input.layer2Result;
    const layer2CResult = input.layer2CResult;
    const layer2CVerificationPackage = input.layer2CVerificationPackage || layer2CResult?.verificationPackage;
    const options = input.options;
    const startTime = nowMs();
    const safeOptions = options && typeof options === "object" ? options : {};
    const retrievalStage = safeOptions.retrievalStage === "SUPPLEMENTAL" ? "SUPPLEMENTAL" : "INITIAL";
    const retrievalOrigin = retrievalStage === "SUPPLEMENTAL"
      ? RETRIEVAL_ORIGIN.TAVILY_AI_REQUESTED_SUPPLEMENT
      : RETRIEVAL_ORIGIN.TAVILY_INITIAL;
    const previousEvidencePackage = retrievalStage === "SUPPLEMENTAL"
      ? (safeOptions.previousEvidencePackage && typeof safeOptions.previousEvidencePackage === "object"
        ? safeOptions.previousEvidencePackage
        : null)
      : null;
    const previousSources = retrievalStage === "SUPPLEMENTAL"
      ? dedupeCandidates(previousEvidencePackage?.sources, { defaultOrigin: RETRIEVAL_ORIGIN.TAVILY_INITIAL })
      : [];
    const requestId = boundedString(safeOptions.requestId || layer2Result?.requestId, 160) ||
      createSecureId("req_l3");
    // Supplemental retrieval is an external Tavily-only phase. A local
    // corpus fallback would blur retrievalOrigin and could leak unvalidated
    // supplemental material into the rebuilt Layer 4 evidence package.
    const allowLocalFallback = retrievalStage !== "SUPPLEMENTAL" && safeOptions.allowLocalFallback !== false;
    const defaultTavilyRetriever = new TavilyRetriever();
    const retriever = safeOptions.retriever || (defaultTavilyRetriever.isConfigured() || !allowLocalFallback
      ? defaultTavilyRetriever
      : new KnowledgeBaseRetriever());
    const retrieverId = boundedString(retriever?.retrieverId, 160) || "unknown_retriever";
    const auditEvents = [];

    const rawClaims = asArray(claims).length > 0
      ? claims
      : asArray(layer2Result?.verificationPackage?.claims || layer2Result?.claims);
    const taskMerge = mergeVerificationTasks(layer2Result, layer2CVerificationPackage);
    const targetClaims = dedupeClaims([...rawClaims, ...l2cCandidateClaims(taskMerge.l2cPackage)]);
    const directInputSources = retrievalStage === "INITIAL"
      ? directInputCandidates(input.input || input)
      : [];
    const submittedInput = input.input || input;
    const inputContextText = QueryGenerator.getInputContextText(submittedInput);

    const rawCandidates = asArray(candidateSources).length > 0
      ? candidateSources
      : asArray(layer2Result?.verificationPackage?.candidateSources);
    const targetCandidates = rawCandidates.map(safeCandidate).filter(Boolean);

    const allQueries = [];
    const taskQueryCounts = new Map();
    if (retrievalStage === "SUPPLEMENTAL") {
      for (const item of asArray(safeOptions.supplementalQueries).slice(0, 2)) {
        const query = typeof item === "string" ? item : item?.suggestedQuery || item?.query;
        if (typeof query === "string" && query.trim()) allQueries.push(query.trim().slice(0, 500));
      }
    } else {
      // Input-context discovery is intentionally first. It is independent of
      // extracted claims and is not discarded when claims/tasks also exist.
      // Tavily receives the complete generated query set; it may still stop
      // on transport timeout or provider policy, but this layer does not
      // silently drop queries before handing them to the retriever.
      const inputQueries = QueryGenerator.generateInputQueries(submittedInput);
      // Keep the two broad input queries first when extracted claims exist so
      // the provider always sees claim-independent context before claim
      // verification. The remaining input viewpoints/counter-context queries
      // are appended below; none are discarded.
      if (targetClaims.length > 0) allQueries.push(...inputQueries.slice(0, 2));
      else allQueries.push(...inputQueries);
      for (const claim of targetClaims) {
        const claimQueries = QueryGenerator.generateQueries(claim, targetCandidates);
        allQueries.push(...claimQueries);
      }
      for (const task of taskMerge.tasks) {
        const relatedClaim = targetClaims.find((claim) => claim.claimId === task.claimId) || null;
        const taskQueries = QueryGenerator.generateTaskQueries(task, relatedClaim);
        taskQueryCounts.set(task.taskId, taskQueries.length);
        allQueries.push(...taskQueries);
      }
      if (targetClaims.length > 0) allQueries.push(...inputQueries.slice(2));
    }
    const retrievalQueries = retrievalStage === "SUPPLEMENTAL" ? allQueries.slice(0, 2) : allQueries;

    let retrievedSources = [];
    let retrievalStatus = EVIDENCE_PROVIDER_STATUS.SUCCESS;
    let retrievalMode = retrievalStage === "SUPPLEMENTAL"
      ? "TAVILY_SUPPLEMENTAL"
      : retrieverId.includes("knowledge_base") || retrieverId.includes("institutional")
      ? "LOCAL_KNOWLEDGE_BASE"
      : "EXTERNAL_RETRIEVER";
    let externalEvidence = false;
    let fetchRetriever = retriever;
    let providerDiagnostics = {};

    try {
      throwIfAborted(safeOptions.signal);
      if (typeof retriever.search !== "function") throw new Error("RETRIEVER_SEARCH_UNAVAILABLE");
      const searchResult = await retriever.search(retrievalQueries, { requestId, signal: safeOptions.signal });
      providerDiagnostics = safeRetrieverDiagnostics(retriever);
      throwIfAborted(safeOptions.signal);
      const searchedSources = asArray(searchResult).map((source) => ({
        ...source,
        sourceId: retrievalStage === "SUPPLEMENTAL" && source?.sourceId
          ? `supplemental-${source.sourceId}`
          : source?.sourceId,
        retrievalOrigin,
      }));
      retrievedSources = dedupeCandidates(
        retrievalStage === "SUPPLEMENTAL" ? [...previousSources, ...searchedSources] : [...directInputSources, ...searchedSources],
        { defaultOrigin: retrievalOrigin },
      );
      if (Object.values(EVIDENCE_PROVIDER_STATUS).includes(retriever.lastSearchStatus) && retriever.lastSearchStatus !== EVIDENCE_PROVIDER_STATUS.SUCCESS) {
        retrievalStatus = retriever.lastSearchStatus;
      }
      if (retrievalStage !== "SUPPLEMENTAL" && (retrieverId.includes("knowledge_base") || retrievedSources.some((src) => src.sourceType === SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE))) {
        retrievalMode = "LOCAL_KNOWLEDGE_BASE";
        retrievalStatus = EVIDENCE_PROVIDER_STATUS.LOCAL_ONLY;
      }
    } catch (err) {
      if (safeOptions.signal?.aborted || err?.name === "AbortError") throw err;
      providerDiagnostics = safeRetrieverDiagnostics(retriever);
      retrievalStatus = Object.values(EVIDENCE_PROVIDER_STATUS).includes(err?.providerStatus)
        ? err.providerStatus
        : EVIDENCE_PROVIDER_STATUS.UNAVAILABLE;
      auditEvents.push({ type: "RETRIEVER_FAILURE", code: boundedString(err?.message, 120) || "RETRIEVER_FAILURE", at: new Date().toISOString() });
      if (allowLocalFallback) {
        retrievalMode = "LOCAL_FALLBACK";
        try {
          const fallback = new KnowledgeBaseRetriever();
          fetchRetriever = fallback;
          retrievedSources = dedupeCandidates([...directInputSources, ...asArray(await fallback.search(retrievalQueries, { requestId, signal: safeOptions.signal }))], {
            defaultOrigin: RETRIEVAL_ORIGIN.LOCAL_KNOWLEDGE,
          });
        } catch (fallbackError) {
          if (safeOptions.signal?.aborted || fallbackError?.name === "AbortError") throw fallbackError;
          retrievedSources = retrievalStage === "SUPPLEMENTAL" ? previousSources : directInputSources;
          auditEvents.push({ type: "LOCAL_FALLBACK_FAILURE", code: boundedString(fallbackError?.message, 120) || "LOCAL_FALLBACK_FAILURE", at: new Date().toISOString() });
        }
      } else {
        // Canonical own-backend mode never relabels local corpus content as
        // external evidence after Tavily fails or is not configured.
        retrievalMode = "TAVILY_UNAVAILABLE";
        fetchRetriever = retriever;
        retrievedSources = retrievalStage === "SUPPLEMENTAL" ? previousSources : directInputSources;
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

      const sourceFetcher = src.retrievalOrigin === RETRIEVAL_ORIGIN.DIRECT_INPUT
        ? retriever
        : fetchRetriever;
      let fetchResult;
      try {
        if (typeof sourceFetcher.fetch !== "function") throw new Error("RETRIEVER_FETCH_UNAVAILABLE");
        fetchResult = safeFetchResult(await sourceFetcher.fetch(urlGuard.url, { requestId, signal: safeOptions.signal }));
      } catch (err) {
        if (safeOptions.signal?.aborted || err?.name === "AbortError") throw err;
        fetchResult = { html: "", textContent: "", status: 502, error: boundedString(err?.message, 120) || "FETCH_FAILURE" };
      }
      throwIfAborted(safeOptions.signal);

      const fetchedSuccessfully = isSuccessfulFetch(fetchResult);
      const sourceType = inferSourceType(src, fetchResult, sourceFetcher?.retrieverId || retrieverId);
      const providerStatus = providerStatusFor(fetchResult, retrievalStatus, fetchedSuccessfully);
      const authority = SourceAuthorityRegistry.evaluateAuthority(src.domain || urlGuard.url, "general");
      const sourceFingerprint = src.sourceType === SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE
        ? src.sourceFingerprint
        : await sha256Hex(urlGuard.url);
      const contentFingerprint = fetchedSuccessfully ? await sha256Hex(fetchResult.textContent) : null;
      const liveEvidenceAllowed = sourceType !== SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE &&
        isNetworkGuardedRetriever(sourceFetcher) &&
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
        retrievalOrigin: src.retrievalOrigin || retrievalOrigin,
        sourceScope: targetClaims.length === 0 &&
          src.retrievalOrigin !== RETRIEVAL_ORIGIN.DIRECT_INPUT &&
          (!src.sourceScope || src.sourceScope === "claim_specific")
          ? "input_context"
          : src.sourceScope || (
            src.retrievalOrigin === RETRIEVAL_ORIGIN.DIRECT_INPUT
              ? "direct_input"
              : "claim_specific"
          ),
        httpStatus: fetchResult.status,
        requestedUrl: urlGuard.url,
        finalUrl: fetchResult.finalUrl || urlGuard.url,
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
          retrievalOrigin: sourceDto.retrievalOrigin,
        }));
      }

      // A free-form input may be worth researching even when Layer 2 did not
      // produce a factual claim. Store a clearly labelled contextual excerpt
      // so Gemini can reason over it and the UI can show the source. It is not
      // claim evidence and cannot make Layer 3/Final Predict verify anything.
      if (inputContextText) {
        const contextExcerpt = boundedString(
          EvidenceExtractor.extractRelevantPassage(textContent, {
            subject: inputContextText,
            predicate: "",
            rawText: inputContextText,
            time: null,
          }),
          LAYER_3_CONFIG.LIMITS.MAX_EXCERPT_LENGTH,
        );
        if (contextExcerpt && contextExcerpt.length >= LAYER_3_CONFIG.LIMITS.MIN_EXCERPT_LENGTH) {
          const temporal = TemporalEvaluator.evaluate({
            publishedAt: fetchResult.publishedAt || src.publishedAt,
            claim: { time: null },
          });
          evidenceItems.push(createEvidence({
            claimId: null,
            sourceId: sourceDto.sourceId,
            sourceUrl: sourceDto.url,
            sourceTitle: sourceDto.title,
            excerpt: contextExcerpt,
            relation: CLAIM_EVIDENCE_RELATION.CONTEXTUALIZES,
            relevance: 0.35,
            strength: 0.25,
            publishedAt: fetchResult.publishedAt || src.publishedAt,
            freshness: temporal.freshness,
            authorityTier: authority.tier,
            clusterId: sourceDto.clusterId,
            sourceType: sourceDto.sourceType,
            providerStatus: sourceDto.providerStatus,
            liveEvidence: sourceDto.liveEvidence,
            sourceFingerprint: sourceDto.sourceFingerprint,
            contentFingerprint: sourceDto.contentFingerprint,
            evidenceScope: "input_context",
            retrievalOutcome: sourceDto.retrievalOutcome,
            retrievalOrigin: sourceDto.retrievalOrigin,
          }));
        }
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
    providerDiagnostics = providerDiagnostics.callCount === undefined ? safeRetrieverDiagnostics(retriever) : providerDiagnostics;
    const independentHostCount = new Set(processedSources.map((source) => boundedString(source.domain, 180)).filter(Boolean)).size;
    const decision = Layer3DecisionEngine.resolveStatus({
      claims: targetClaims,
      evidence: evidenceItems,
      conflicts,
      completeness: verificationCompleteness,
      externalEvidence,
    });
    const sourceCountByOrigin = (origin) => processedSources.filter((source) => source.retrievalOrigin === origin).length;
    const evidenceCountByOrigin = (origin) => evidenceItems.filter((item) => item.retrievalOrigin === origin).length;
    const directInputSourceCount = sourceCountByOrigin(RETRIEVAL_ORIGIN.DIRECT_INPUT);
    const directInputEvidenceCount = evidenceCountByOrigin(RETRIEVAL_ORIGIN.DIRECT_INPUT);
    const directInputValidatedSourceCount = processedSources.filter((source) => source.retrievalOrigin === RETRIEVAL_ORIGIN.DIRECT_INPUT && source.liveEvidence === true).length;

    const limitations = [
      ...asArray(decision.limitations),
      ...(inputContextText && targetClaims.length === 0
        ? ["Input đã được Tavily tìm kiếm tự do và có thể có contextual evidence; vì chưa có factual claim nên chưa tạo verdict claim-specific."]
        : []),
      ...(retrievalStatus === EVIDENCE_PROVIDER_STATUS.LOCAL_ONLY || retrievalMode === "LOCAL_FALLBACK"
        ? ["Bằng chứng cục bộ/fallback không được coi là xác minh trực tiếp từ nguồn bên ngoài."]
        : []),
      ...(!externalEvidence && evidenceItems.length > 0
        ? ["Không có bằng chứng live độc lập; trạng thái được hạ cấp để tránh false-safe."]
        : []),
    ];

    const validatedSourceCount = processedSources.filter((source) => source.liveEvidence === true).length;
    const previousInitialPhase = previousEvidencePackage?.retrievalPhases?.initialSearch;
    const retrievalPhases = {
      initialSearch: retrievalStage === "SUPPLEMENTAL" && previousInitialPhase
        ? previousInitialPhase
        : {
          status: retrievalStatus,
          queryCount: retrievalStage === "INITIAL" ? retrievalQueries.length : 0,
          sourceCount: sourceCountByOrigin(RETRIEVAL_ORIGIN.TAVILY_INITIAL),
          evidenceCount: evidenceCountByOrigin(RETRIEVAL_ORIGIN.TAVILY_INITIAL),
          validatedSourceCount: processedSources.filter((source) => source.retrievalOrigin === RETRIEVAL_ORIGIN.TAVILY_INITIAL && source.liveEvidence === true).length,
          directInputSourceCount,
          directInputEvidenceCount,
          directInputValidatedSourceCount,
          provider: retrieverId,
          providerStatus: retrievalStage === "INITIAL" ? retrievalStatus : null,
          retrievalOrigin: RETRIEVAL_ORIGIN.TAVILY_INITIAL,
        },
      supplementalSearch: retrievalStage === "SUPPLEMENTAL"
        ? {
          status: retrievalStatus === EVIDENCE_PROVIDER_STATUS.SUCCESS ? "COMPLETED" : retrievalStatus,
          queryCount: retrievalQueries.length,
          sourceCount: sourceCountByOrigin(RETRIEVAL_ORIGIN.TAVILY_AI_REQUESTED_SUPPLEMENT),
          evidenceCount: evidenceCountByOrigin(RETRIEVAL_ORIGIN.TAVILY_AI_REQUESTED_SUPPLEMENT),
          validatedSourceCount: processedSources.filter((source) => source.retrievalOrigin === RETRIEVAL_ORIGIN.TAVILY_AI_REQUESTED_SUPPLEMENT && source.liveEvidence === true).length,
          provider: retrieverId,
          providerStatus: retrievalStatus,
          retrievalOrigin: RETRIEVAL_ORIGIN.TAVILY_AI_REQUESTED_SUPPLEMENT,
        }
        : {
          status: "NOT_REQUESTED",
          queryCount: 0,
          sourceCount: 0,
          evidenceCount: 0,
          validatedSourceCount: 0,
          provider: null,
          providerStatus: null,
          retrievalOrigin: RETRIEVAL_ORIGIN.TAVILY_AI_REQUESTED_SUPPLEMENT,
        },
      finalValidatedEvidenceSet: {
        status: validatedSourceCount > 0 ? "COMPLETED" : "INSUFFICIENT",
        queryCount: retrievalQueries.length,
        sourceCount: processedSources.length,
        evidenceCount: evidenceItems.length,
        validatedSourceCount,
        directInputSourceCount,
        directInputEvidenceCount,
        directInputValidatedSourceCount,
        provider: retrieverId,
        providerStatus: retrievalStatus,
        retrievalOrigin,
      },
    };

    return markTrustedLayer3Result(createLayer3Result({
      status: decision.status,
      executionStatus: "COMPLETED",
      retrievalExecuted: true,
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
      verificationTasks: taskMerge.tasks,
      verificationTaskSummary: {
        totalTasks: taskMerge.tasks.length,
        l2bTaskCount: taskMerge.l2bTaskCount,
        l2cTaskCount: taskMerge.l2cTaskCount,
        deduplicatedCount: taskMerge.deduplicatedCount,
        highImpactTaskCount: taskMerge.highImpactTaskCount,
        tasksWithQueries: taskMerge.tasks.filter((task) => (taskQueryCounts.get(task.taskId) || 0) > 0).length,
        tasksWithoutQueries: taskMerge.tasks.filter((task) => (taskQueryCounts.get(task.taskId) || 0) === 0).length,
      },
      candidateClaimOrigins: Array.from(new Set(targetClaims.map((claim) => claim.origin).filter(Boolean))).slice(0, 4),
      evidenceRequirements: asArray(taskMerge.l2cPackage?.evidenceRequirements).slice(0, 16),
      retrievalPhases,
      limitations,
      nextLayer: 4,
      requestId,
      retrievalStatus,
      retrievalMode,
      externalEvidence,
      auditEvents,
      metrics: {
        executionTimeMs: Number((nowMs() - startTime).toFixed(2)),
        queriesExecutedCount: retrievalQueries.length,
        executionStatus: "COMPLETED",
        retrievalExecuted: true,
        retrievalProvider: retrieverId,
        retrievalStatus,
        retrievalMode,
        retrievalStage,
        retrievalOrigin,
        initialQueryCount: retrievalPhases.initialSearch.queryCount,
        initialSourceCount: retrievalPhases.initialSearch.sourceCount,
        initialEvidenceCount: retrievalPhases.initialSearch.evidenceCount,
        directInputSourceCount,
        directInputEvidenceCount,
        directInputValidatedSourceCount,
        supplementalQueryCount: retrievalPhases.supplementalSearch.queryCount,
        supplementalSourceCount: retrievalPhases.supplementalSearch.sourceCount,
        supplementalEvidenceCount: retrievalPhases.supplementalSearch.evidenceCount,
        finalValidatedSourceCount: retrievalPhases.finalValidatedEvidenceSet.validatedSourceCount,
        geminiGeneratedUrlCount: 0,
        externalEvidence,
        providerIndependent: retrieverId.includes("knowledge_base"),
        providerCallCount: providerDiagnostics.callCount || 0,
        providerDurationMs: providerDiagnostics.durationMs || 0,
        providerTimeoutConfiguredMs: providerDiagnostics.timeoutConfiguredMs,
        providerParentTimeoutMs: providerDiagnostics.parentTimeoutMs,
        providerRawResultCount: providerDiagnostics.rawResultCount || 0,
        providerAcceptedResultCount: providerDiagnostics.acceptedResults || 0,
        providerAcceptedHostCount: providerDiagnostics.acceptedHostCount || 0,
        providerRejectedResultCount: providerDiagnostics.rejectedResults || 0,
        providerRejectionReasons: providerDiagnostics.rejectionReasons || [],
        providerHttpStatuses: providerDiagnostics.httpStatuses || [],
        providerTimeoutClassification: providerDiagnostics.timeoutClassification,
        providerAbortReason: providerDiagnostics.abortReason,
        providerRetryCount: providerDiagnostics.retryCount || 0,
        providerRetryExhausted: providerDiagnostics.retryExhausted === true,
        providerRetryable: providerDiagnostics.retryable,
        providerRequestTrace: providerDiagnostics.requestTrace || [],
        independentHostCount,
        independentClusterCount: independence.independentSourcesCount || 0,
        verificationTasksCount: taskMerge.tasks.length,
        l2cVerificationTasksCount: taskMerge.l2cTaskCount,
      },
    }));
  }
}
