/**
 * Layer 3 — Layer3EvidenceService
 * 
 * Central orchestrator for External Evidence & Source Verification.
 * Coordinates query generation, retrieval, source authority, passage extraction,
 * temporal verification, source independence clustering, conflict detection, and Layer 4 packaging.
 */

import { QueryGenerator } from "./query/QueryGenerator.js";
import { KnowledgeBaseRetriever } from "./retrieval/KnowledgeBaseRetriever.js";
import { WebSearchRetriever } from "./retrieval/WebSearchRetriever.js";
import { SourceAuthorityRegistry } from "./registry/SourceAuthorityRegistry.js";
import { EvidenceExtractor } from "./extractors/EvidenceExtractor.js";
import { TemporalEvaluator } from "./extractors/TemporalEvaluator.js";
import { SourceIndependenceAnalyzer } from "./extractors/SourceIndependenceAnalyzer.js";
import { ClaimEvidenceMatcher } from "./extractors/ClaimEvidenceMatcher.js";
import { SourceConflictDetector } from "./engine/SourceConflictDetector.js";
import { CompletenessEngine } from "./engine/CompletenessEngine.js";
import { Layer3DecisionEngine } from "./engine/Layer3DecisionEngine.js";
import { createEvidence, createSource, createLayer3Result, FRESHNESS_STATUS } from "./types.js";
import { LAYER_3_CONFIG } from "./config/Layer3Config.js";

export class Layer3EvidenceService {
  /**
   * Performs external evidence verification for claims from Layer 2
   * @param {object} params
   * @param {Array<object>} params.claims - Claims requiring verification from Layer 2
   * @param {Array<object>} params.candidateSources - Official sources identified by Layer 2
   * @param {object} params.layer2Result - Full Layer 2 result DTO
   * @param {object} params.options - Custom options (e.g. custom retriever)
   * @returns {Promise<object>} Layer 3 Result DTO
   */
  static async verify({
    claims = [],
    candidateSources = [],
    layer2Result = null,
    options = {},
  }) {
    const startTime = performance.now();
    const retriever = options.retriever || new KnowledgeBaseRetriever();

    // 1. Resolve claims from Layer 2 verificationPackage if not passed directly
    const targetClaims =
      claims.length > 0
        ? claims
        : layer2Result?.verificationPackage?.claims || layer2Result?.claims || [];

    const targetCandidates =
      candidateSources.length > 0
        ? candidateSources
        : layer2Result?.verificationPackage?.candidateSources || [];

    // 2. Generate multi-strategy search queries
    const allQueries = [];
    for (const claim of targetClaims) {
      const claimQueries = QueryGenerator.generateQueries(claim, targetCandidates);
      allQueries.push(...claimQueries);
    }

    // 3. Search and Retrieve candidate sources
    let retrievedSources = [];
    try {
      retrievedSources = await retriever.search(allQueries);
    } catch (err) {
      console.warn(`[Layer 3 Search Error]: ${err.message}, falling back to Knowledge Base`);
      const fallbackRetriever = new KnowledgeBaseRetriever();
      retrievedSources = await fallbackRetriever.search(allQueries);
    }

    // 4. Extract evidence, evaluate freshness, and match relations
    const evidenceItems = [];
    const processedSources = [];

    for (const src of retrievedSources) {
      let fetchResult = { html: "", textContent: "", status: 500 };
      try {
        fetchResult = await retriever.fetch(src.url);
        if (!fetchResult || fetchResult.status !== 200 || !fetchResult.textContent) {
          const fallback = new KnowledgeBaseRetriever();
          fetchResult = await fallback.fetch(src.url);
        }
      } catch {
        const fallback = new KnowledgeBaseRetriever();
        fetchResult = await fallback.fetch(src.url);
      }

      const textContent = fetchResult.textContent || "";

      // Evaluate authority
      const authority = SourceAuthorityRegistry.evaluateAuthority(src.domain);
      const sourceDto = createSource({
        sourceId: src.sourceId,
        url: src.url,
        domain: src.domain,
        title: src.title,
        publisher: src.publisher,
        authorityTier: authority.tier,
        authorityScore: authority.score,
        authorityBasis: authority.basis,
        publishedAt: fetchResult.publishedAt || src.publishedAt,
        clusterId: src.clusterId,
        isOfficial: authority.isOfficial,
      });
      processedSources.push(sourceDto);

      // Match against each claim
      for (const claim of targetClaims) {
        const excerpt = EvidenceExtractor.extractRelevantPassage(textContent, claim);
        if (!excerpt || excerpt.length < LAYER_3_CONFIG.LIMITS.MIN_EXCERPT_LENGTH) continue;

        // Check temporal validity
        const temporal = TemporalEvaluator.evaluate({
          publishedAt: fetchResult.publishedAt || src.publishedAt,
          claim,
        });

        // Match relation
        const matchResult = ClaimEvidenceMatcher.match(claim, excerpt, sourceDto);

        evidenceItems.push(
          createEvidence({
            claimId: claim.claimId,
            sourceId: src.sourceId,
            sourceUrl: src.url,
            sourceTitle: src.title,
            excerpt,
            relation: matchResult.relation,
            relevance: matchResult.relevance,
            strength: matchResult.strength,
            publishedAt: fetchResult.publishedAt || src.publishedAt,
            freshness: temporal.freshness,
            authorityTier: authority.tier,
            clusterId: src.clusterId,
          })
        );
      }
    }

    // 5. Analyze source independence and lineage clustering
    const independence = SourceIndependenceAnalyzer.analyzeIndependence(processedSources, evidenceItems);

    // 6. Detect source conflicts
    const conflicts = SourceConflictDetector.detectConflicts(evidenceItems);

    // 7. Calculate completeness, agreement & confidence
    const { verificationCompleteness, evidenceConfidence, crossSourceAgreement } =
      CompletenessEngine.calculateCompleteness({
        claims: targetClaims,
        evidence: evidenceItems,
        sources: processedSources,
        independence,
      });

    // 8. Resolve Layer 3 Decision Status
    const { status, claimStatuses, limitations } = Layer3DecisionEngine.resolveStatus({
      claims: targetClaims,
      evidence: evidenceItems,
      conflicts,
      completeness: verificationCompleteness,
    });

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return createLayer3Result({
      status,
      claims: targetClaims,
      claimStatuses,
      sources: processedSources,
      evidence: evidenceItems,
      sourceAuthority: {
        totalEvaluated: processedSources.length,
        primaryCount: processedSources.filter((s) => s.isOfficial).length,
      },
      sourceIndependence: independence,
      crossSourceAgreement,
      conflicts,
      temporalAssessment: {
        allCurrent: evidenceItems.every((e) => e.freshness === FRESHNESS_STATUS.CURRENT),
        outdatedEvidenceCount: evidenceItems.filter((e) => e.freshness === FRESHNESS_STATUS.OUTDATED).length,
      },
      verificationCompleteness,
      evidenceConfidence,
      limitations,
      nextLayer: 4,
      metrics: {
        executionTimeMs,
        queriesExecutedCount: allQueries.length,
        retrievalProvider: retriever.retrieverId,
      },
    });
  }
}
