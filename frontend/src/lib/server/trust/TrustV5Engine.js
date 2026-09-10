/**
 * StudentHub AI — TrustV5Engine (Master Native Trust V5 Orchestrator)
 *
 * Implements the complete 5 Macro-Layer Architecture:
 * - LAYER 1: CLAIM INTELLIGENCE (normalization, entity extraction, claim decomposition)
 * - LAYER 2: EVIDENCE DISCOVERY (multi-strategy queries, SSRF safety, canonical URLs, SHA-256 snapshots)
 * - LAYER 3: EVIDENCE FORENSICS (source clustering, independence graph, claim-source relations, sufficiency)
 * - LAYER 4: MULTI-AI VERIFICATION (Luna classifier/critic/relation, Gemini extraction/synthesis, citation validation)
 * - LAYER 5: DECISION INTELLIGENCE (verdict policy, Decision Twin, next actions, immutable Evidence Passport)
 *
 * Produces Canonical Trust DTO matching Section 54 UX requirements.
 */

import { createHash, randomUUID } from "node:crypto";
import { NormalizationService } from "../../ai-trust/layer1/normalization/NormalizationService.js";
import { FraudRiskEngine } from "../../intelligence/fraud/fraudRiskEngine.js";
import { EntityResolutionService } from "./EntityResolutionService.js";
import { EvidenceDiscoveryService } from "./EvidenceDiscoveryService.js";
import { EvidenceForensicsService } from "./EvidenceForensicsService.js";
import { MultiModelVerifier } from "./MultiModelVerifier.js";
import { VerdictPolicyEngine } from "./VerdictPolicyEngine.js";
import { DecisionTwinService } from "./DecisionTwinService.js";
import { NextActionEngine } from "./NextActionEngine.js";
import { EvidencePassportService } from "./EvidencePassportService.js";
import { EvidenceCandidatePool } from "./EvidenceCandidatePool.js";
import { AuthorityLadderRanking } from "./AuthorityLadderRanking.js";

export const TRUST_V5_PRODUCTION_PATH = Object.freeze([
  "CLAIM_INTELLIGENCE",
  "EVIDENCE_DISCOVERY",
  "EVIDENCE_FORENSICS",
  "MULTI_MODEL_VERIFICATION",
  "CITATION_VALIDATION",
  "VERDICT_POLICY_ENGINE",
  "DECISION_TWIN",
]);

const PRODUCTION_PATH_CONTRACT_VERSION = "trust-v5-production-path-v2";

function stablePathFingerprint() {
  return createHash("sha256")
    .update(JSON.stringify({
      contractVersion: PRODUCTION_PATH_CONTRACT_VERSION,
      stages: TRUST_V5_PRODUCTION_PATH,
      evidenceBoundary: "RUNTIME_SOURCE_ALLOWLIST_V1",
      criticAblation: "ONLY_INDEPENDENT_CRITIC_TOGGLE",
    }))
    .digest("hex");
}

export class TrustV5Engine {
  /**
   * Executes the full 5-layer Trust V5 verification pipeline.
   * @param {object} params
   * @param {"text"|"url"|"image"|"file"} [params.type="text"]
   * @param {string} params.content
   * @param {object} [params.metadata={}]
   * @param {string} [params.caseId]
   * @param {number} [params.revision=1]
   * @param {AbortSignal} [params.signal]
   * @param {object|null} [params.officialDiscoveryAdapter]
   * @param {boolean} [params.includeOfficialDiscovery=false]
   * @param {object|null} [params.publicApiDiscoveryAdapter]
   * @param {boolean} [params.includePublicApiDiscovery=false]
   * @returns {Promise<object>} Canonical Trust DTO
   */
  static async verify({
    type = "text",
    content = "",
    metadata = {},
    caseId = null,
    revision = 1,
    signal,
    disableCritic = false,
    sourcesFixture = null,
    officialDiscoverySources = [],
    officialDiscoveryAdapter = null,
    includeOfficialDiscovery = false,
    publicApiDiscoverySources = [],
    publicApiDiscoveryAdapter = null,
    includePublicApiDiscovery = false,
    expertAssessments = [],
    issuedAt = null,
  } = {}) {
    const runId = `run-${randomUUID()}`;
    const effectiveCaseId = caseId || `case-${randomUUID()}`;
    const startedAt = Date.now();

    // ──────────────────────────────────────────────────────────────────────────
    // LAYER 1: CLAIM INTELLIGENCE
    // ──────────────────────────────────────────────────────────────────────────
    const normalizedInput = NormalizationService.normalizeText(content || metadata.ocrText || "");
    const cleanText = normalizedInput.normalized || String(content || "").trim();

    const resolvedEntities = EntityResolutionService.resolveEntitiesDetailed(cleanText);
    const entities = resolvedEntities.matches.map((m) => ({
      name: m.canonicalName,
      domain: m.officialDomain,
      entityId: m.entityId,
      status: resolvedEntities.status,
    }));
    const claimEntityReferences = entities.length > 0
      ? entities
      : [{ name: null, domain: null, entityId: null, status: resolvedEntities.status }];

    // Decompose into structured atomic claims
    const claimSentences = cleanText
      .split(/(?<=[.?!;\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    const rawClaims = claimSentences.length > 0 ? claimSentences : [cleanText || "Đầu vào kiểm tra"];

    const claims = rawClaims.slice(0, 5).map((sentence, idx) => ({
      claimId: `claim-${idx + 1}`,
      inputRevision: revision,
      text: sentence,
      normalizedText: sentence.toLowerCase(),
      type: sentence.toLowerCase().includes("học bổng")
        ? "SCHOLARSHIP_BENEFIT"
        : sentence.toLowerCase().includes("học phí")
        ? "TUITION_POLICY"
        : sentence.toLowerCase().includes("chuyển") || sentence.toLowerCase().includes("tiền")
        ? "PAYMENT_REQUIREMENT"
        : "FACTUAL_STATEMENT",
      riskDomain: "STUDENT_ACADEMIC_FINANCIAL",
      materiality: idx === 0 ? "HIGH" : "MEDIUM",
      entities: claimEntityReferences,
      entityStatus: resolvedEntities.status,
      evidenceRequirement: "OFFICIAL_UNIVERSITY_POLICY_OR_NOTICE",
    }));

    // Domain specialist advisory risk scan
    const fraudEvaluation = FraudRiskEngine.evaluateRisk({
      text: cleanText,
      url: type === "url" ? cleanText : metadata.url || "",
    });

    // ──────────────────────────────────────────────────────────────────────────
    // LAYER 2: EVIDENCE DISCOVERY
    // ──────────────────────────────────────────────────────────────────────────
    let sources = [];
    let candidatePoolTrace;
    if (Array.isArray(sourcesFixture)) {
      const fixturePool = EvidenceCandidatePool.safeDedup(
        EvidenceCandidatePool.sanitizeSources(sourcesFixture)
      );
      sources = fixturePool.sources;
      candidatePoolTrace = {
        candidatePool: "SAFE_DEDUP(RUNTIME_SOURCE_FIXTURE)",
        inputCounts: { RUNTIME_SOURCE_FIXTURE: sourcesFixture.length },
        retainedCount: sources.length,
        duplicateCount: fixturePool.dropped.length,
        dropped: fixturePool.dropped,
        unknownEntityPolicy: "RETAIN_AND_RANK_SOFTLY",
        liveCandidatesDeletedForUnknownEntity: 0,
        forbiddenEvaluationFieldsStripped: true,
      };
    } else {
      const discoveryResult = await EvidenceDiscoveryService.discoverEvidenceForClaims({
        claims,
        runId,
        revision,
        officialDiscoverySources,
        officialDiscoveryAdapter,
        includeOfficialDiscovery,
        publicApiDiscoverySources,
        publicApiDiscoveryAdapter,
        includePublicApiDiscovery,
        signal,
      });
      sources = discoveryResult.sources;
      candidatePoolTrace = {
        ...discoveryResult.candidatePoolTrace,
        officialDiscovery: discoveryResult.officialDiscoveryTrace,
        publicApiDiscovery: discoveryResult.publicApiDiscoveryTrace,
      };
    }

    // Rank only after the complete candidate pool has been preserved. Entity
    // resolution is a soft ranking feature; it is never a candidate filter.
    sources = AuthorityLadderRanking.rankSources(
      sources,
      resolvedEntities.matches,
      new Date().getFullYear(),
      cleanText,
    );

    // ──────────────────────────────────────────────────────────────────────────
    // LAYER 3: EVIDENCE FORENSICS
    // ──────────────────────────────────────────────────────────────────────────
    const clusters = EvidenceForensicsService.clusterSources(sources);
    const independenceGroups = EvidenceForensicsService.buildIndependenceGraph(sources, clusters);
    const relationships = EvidenceForensicsService.evaluateClaimRelations(claims, sources);
    const sufficiency = EvidenceForensicsService.evaluateSufficiency(claims, relationships, sources);

    // ──────────────────────────────────────────────────────────────────────────
    // LAYER 4: MULTI-AI VERIFICATION
    // ──────────────────────────────────────────────────────────────────────────
    const multiModelResult = await MultiModelVerifier.verify({
      claims,
      evidence: sources,
      relationships,
      sufficiency,
      runId,
      revision,
      signal,
      disableCritic,
    });

    // ──────────────────────────────────────────────────────────────────────────
    // LAYER 5: DECISION INTELLIGENCE
    // ──────────────────────────────────────────────────────────────────────────
    const verdictAdjudication = VerdictPolicyEngine.adjudicate({
      claims,
      evidence: sources,
      relationships,
      sufficiency,
      multiModelResult,
      domainSpecialistFinding: fraudEvaluation,
    });

    const decisionTwin = DecisionTwinService.buildDecisionTwin({
      verdict: verdictAdjudication.verdict,
      claims,
      evidence: sources,
      relationships,
      unknowns: multiModelResult.unknowns,
    });

    const nextActions = NextActionEngine.determineNextActions({
      verdict: verdictAdjudication.verdict,
      evidence: sources,
      claims,
      caseId: effectiveCaseId,
    });

    const passport = EvidencePassportService.issuePassport({
      caseId: effectiveCaseId,
      runId,
      revision,
      claims,
      sources,
      relationships,
      independenceGroups,
      modelTraces: multiModelResult.modelTraces,
      verdictResult: verdictAdjudication,
      decisionTwin,
      expertAssessments,
      issuedAt,
    });

    const latencyTotalMs = Date.now() - startedAt;

    // ──────────────────────────────────────────────────────────────────────────
    // CANONICAL TRUST DTO (Section 54)
    // ──────────────────────────────────────────────────────────────────────────
    return {
      caseId: effectiveCaseId,
      runId,
      revision,
      status: "COMPLETED",
      latencyMs: latencyTotalMs,
      claims,
      evidence: {
        sources: sources.map((s) => ({
          ...s,
          quality: EvidenceForensicsService.explainSourceQuality(s),
        })),
        relationships,
        independenceGroups,
      },
      verification: {
        sufficiency: sufficiency.status,
        sufficiencyReason: sufficiency.reason,
        freshness: sources.every((s) => s.publishedAt?.includes("2026")) ? "CURRENT_ACADEMIC_YEAR" : "RECENT",
        sourceAgreement: relationships.every((r) => r.relation !== "CONTRADICTS") ? "CONSISTENT" : "CONTRADICTED",
        modelsUsed: multiModelResult.modelTraces.map((t) => ({
          role: t.role,
          provider: t.provider,
          model: t.model,
          latencyMs: t.latencyMs,
        })),
        productionPath: {
          contractVersion: PRODUCTION_PATH_CONTRACT_VERSION,
          stages: TRUST_V5_PRODUCTION_PATH,
          baseFingerprint: stablePathFingerprint(),
          critic: {
            enabled: !disableCritic,
            executionMode: disableCritic ? "ABLATION_DISABLED" : "PRODUCTION_ENABLED",
          },
        },
        retrieval: candidatePoolTrace,
      },
      verdict: {
        label: verdictAdjudication.verdict,
        headline: verdictAdjudication.headline,
        reasons: multiModelResult.reasons.length > 0 ? multiModelResult.reasons : [verdictAdjudication.explanation],
        citationIds: multiModelResult.validatedCitationIds,
        rejectedCitationCount: multiModelResult.rejectedCitations.length,
        unknowns: multiModelResult.unknowns,
        limitations: [
          "Bằng chứng được giữ lại từ toàn bộ candidate pool; entity resolution chỉ được dùng để xếp hạng mềm.",
          "Ý kiến phản biện của Independent Critic được lưu trữ đầy đủ trong Passport.",
        ],
        confidenceScore: verdictAdjudication.confidenceScore,
        evidenceSufficiency: verdictAdjudication.evidenceSufficiency,
        sourceAgreement: verdictAdjudication.sourceAgreement,
        uncertainty: verdictAdjudication.uncertainty,
        policyApplied: verdictAdjudication.policyApplied,
      },
      decisionTwin,
      nextActions,
      passport: {
        passportId: passport.passportId,
        revision: passport.revision,
        artifactHash: passport.artifactHash,
        issuedAt: passport.issuedAt,
        expertAssessmentLineage: passport.expertAssessmentLineage,
      },
    };
  }
}
