/**
 * Layer 4 — Layer4TrustService
 * 
 * Central coordinator and orchestrator for Final Trust Reasoning.
 * Ingests Layers 1–3, coordinates Evidence Fusion, applies Hard Decision Policies,
 * and produces the Final Trust Verdict and auditable explanation.
 */

import { EvidenceFusionEngine } from "./fusion/EvidenceFusionEngine.js";
import { DeterministicTrustPolicyProvider } from "./providers/DeterministicTrustPolicyProvider.js";
import { GeminiTrustReasoningProvider } from "./providers/GeminiTrustReasoningProvider.js";
import { GlobalIntelligenceEngine } from "../engine/GlobalIntelligenceEngine.js";
import { createLayer4Result } from "./types.js";
import { LAYER_4_CONFIG } from "./config/Layer4Config.js";

export class Layer4TrustService {
  /**
   * Evaluates final trust reasoning across all layers
   * @param {object} params
   * @param {object} params.layer1Result - Result DTO from Layer 1
   * @param {object} params.layer2Result - Result DTO from Layer 2
   * @param {object} params.layer3Result - Result DTO from Layer 3
   * @param {object} params.options - Custom provider or configuration overrides
   * @returns {Promise<object>} Layer 4 Result DTO
   */
  static async evaluate({
    layer1Result = null,
    layer2Result = null,
    layer3Result = null,
    options = {},
  }) {
    const startTime = performance.now();
    const provider = options.provider || new DeterministicTrustPolicyProvider();

    // 1. Evidence Fusion: Merge signals, semantics, and external evidence
    const {
      fusedGraph: _fusedGraph,
      totalEvidenceItems,
      totalSignals,
      shouldAbstain,
      abstentionReason,
      isHardNegative,
      hardNegativeContext,
      interactionMultiplier,
      triggeredInteractionCount,
      uncertainty,
    } = EvidenceFusionEngine.fuse({
      layer1Result,
      layer2Result,
      layer3Result,
      documentContext: options.documentContext || null,
      conversationContext: options.conversationContext || null,
    });

    // Attach fusion metadata to fusedGraph so the reasoning provider can access it
    const fusedGraph = {
      ..._fusedGraph,
      shouldAbstain,
      abstentionReason,
      isHardNegative,
      hardNegativeContext,
      interactionMultiplier,
    };

    // 2. Global Intelligence & International Standards Correlation
    const globalIntelligence = GlobalIntelligenceEngine.correlate({
      fusedGraph,
      url: layer1Result?.metrics?.inputContent || "",
    });

    // 3. Execute Reasoning Provider
    let assessment;
    try {
      assessment = await provider.reason(fusedGraph);
    } catch (err) {
      console.warn(`[Layer 4 Service Provider Error]: ${err.message}, falling back to deterministic policy`);
      const fallback = new DeterministicTrustPolicyProvider();
      assessment = await fallback.reason(fusedGraph);
    }

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return createLayer4Result({
      classification: assessment.classification,
      status: assessment.status,
      truthAssessment: assessment.truthAssessment,
      riskAssessment: assessment.riskAssessment,
      decisionConfidence: assessment.decisionConfidence,
      verificationCompleteness: assessment.verificationCompleteness,
      claims: assessment.claims,
      keyReasons: assessment.keyReasons,
      evidenceRefs: assessment.evidenceRefs,
      conflicts: assessment.conflicts,
      limitations: assessment.limitations,
      recommendedAction: assessment.recommendedAction,
      userExplanation: {
        ...assessment.userExplanation,
        globalComplianceSummary: globalIntelligence.globalAuditSummary,
        matchedStandards: globalIntelligence.matchedStandards,
        matchedUniversity: globalIntelligence.matchedUniversity?.name || null,
      },
      auditTrail: {
        ruleVersion: LAYER_4_CONFIG.VERSION,
        fusedEvidenceCount: totalEvidenceItems,
        hardRuleTriggered: assessment.hardRuleTriggered,
        globalFrameworkCount: globalIntelligence.frameworkCount,
        isAccreditedEcosystem: globalIntelligence.isAccreditedEcosystem,
      },
      metrics: {
        executionTimeMs,
        modelUsed: provider.providerId,
        providerStatus: "healthy",
      },
    });
  }
}
