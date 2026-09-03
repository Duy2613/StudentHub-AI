/**
 * Layer 4 — Layer4TrustService
 * 
 * Central coordinator and orchestrator for Final Trust Reasoning.
 * Ingests Layers 1–3, coordinates Evidence Fusion, applies Hard Decision Policies,
 * and produces the Final Trust Verdict and auditable explanation.
 */

import { EvidenceFusionEngine } from "./fusion/EvidenceFusionEngine.js";
import { DeterministicTrustPolicyProvider } from "./providers/DeterministicTrustPolicyProvider.js";
import { AIGatewayReasoningProvider } from "./providers/AIGatewayReasoningProvider.js";

import { GlobalIntelligenceEngine } from "../engine/GlobalIntelligenceEngine.js";
import { createLayer4Result } from "./types.js";
import { LAYER_4_CONFIG } from "./config/Layer4Config.js";

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function nowMs() {
  return typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now();
}

function safeNarrative(candidate, fallback) {
  const narrative = safeObject(candidate?.userExplanation);
  if (!narrative || typeof narrative.why !== "string" || !narrative.why.trim()) return fallback;
  return {
    ...fallback,
    why: narrative.why.slice(0, 1200),
  };
}

function emptyGlobalIntelligence() {
  return {
    matchedStandards: [],
    matchedUniversity: null,
    frameworkCount: 0,
    isAccreditedEcosystem: false,
    globalAuditSummary: "Không có ánh xạ khung tham chiếu đủ điều kiện từ bằng chứng hiện tại.",
  };
}

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
  static async evaluate(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const layer1Result = safeObject(input.layer1Result);
    const layer2Result = safeObject(input.layer2Result);
    const layer2AResult = safeObject(input.layer2AResult);
    const layer2CResult = safeObject(input.layer2CResult);
    const layer3Result = safeObject(input.layer3Result);
    const options = safeObject(input.options) || {};
    const startTime = nowMs();
    const deterministicProvider = new DeterministicTrustPolicyProvider();
    // Any model/provider supplied by a caller is non-authoritative. It may
    // only enrich the deterministic explanation after the policy decision.
    const narrativeProvider = options.provider || (options.useAIGateway ? new AIGatewayReasoningProvider() : null);

    // 1. Evidence Fusion: Merge signals, semantics, and external evidence
    let fusion;
    try {
      fusion = EvidenceFusionEngine.fuse({
        layer1Result,
        layer2Result,
        layer2AResult,
        layer2CResult,
        layer3Result,
        documentContext: options.documentContext || null,
        conversationContext: options.conversationContext || null,
      });
    } catch (error) {
      fusion = {
        fusedGraph: {
          layer1Signals: [],
          layer1Status: layer1Result?.status || "UNKNOWN",
          layer2ContextSignals: [],
          layer2Claims: [],
          layer2CrossModalFindings: [],
          layer2Status: layer2Result?.status || "UNKNOWN",
          layer2Classification: "UNKNOWN",
          layer2CResult,
          layer2CClassification: layer2CResult?.classification || "UNKNOWN_STUDENT_RISK",
          layer2CDomainSignals: Array.isArray(layer2CResult?.riskSignals) ? layer2CResult.riskSignals : [],
          layer2AResult,
          layer2AFinding: layer2AResult?.finding || "UNKNOWN",
          layer2AProviderStatus: layer2AResult?.providerStatus || "NOT_APPLICABLE",
          layer2ASecurityClassification: layer2AResult?.securityClassification || "UNKNOWN",
          layer3Sources: [],
          layer3Evidence: [],
          layer3Result,
          layer3ResultTrusted: false,
          layer3ClaimStatuses: {},
          layer3Conflicts: [],
          layer3Completeness: 0,
          layer3Status: "INSUFFICIENT_EVIDENCE",
        },
        totalEvidenceItems: 0,
        totalSignals: 0,
        shouldAbstain: true,
        abstentionReason: "FUSION_FAILURE",
        isHardNegative: false,
        hardNegativeContext: null,
        interactionMultiplier: 1,
        triggeredInteractionCount: 0,
        uncertainty: { fusion: "HIGH" },
        fusionError: error?.name || "FUSION_FAILURE",
      };
    }
    const {
      fusedGraph: _fusedGraph,
      totalEvidenceItems,
      shouldAbstain,
      abstentionReason,
      isHardNegative,
      hardNegativeContext,
      interactionMultiplier,
    } = fusion;

    // Attach fusion metadata to fusedGraph so the reasoning provider can access it
    const fusedGraph = {
      ..._fusedGraph,
      shouldAbstain,
      abstentionReason,
      isHardNegative,
      hardNegativeContext,
      interactionMultiplier,
    };

    // 2. Global mappings are audit metadata only; they never decide trust.
    let globalIntelligence = emptyGlobalIntelligence();
    try {
      globalIntelligence = GlobalIntelligenceEngine.correlate({
        fusedGraph,
        url: typeof layer1Result?.metrics?.inputContent === "string" ? layer1Result.metrics.inputContent : "",
      });
    } catch {
      globalIntelligence = emptyGlobalIntelligence();
    }

    // 3. Execute deterministic policy first and keep it authoritative.
    const deterministicAssessment = await deterministicProvider.reason(fusedGraph);
    let assessment = deterministicAssessment;
    try {
      if (narrativeProvider && typeof narrativeProvider.reason === "function") {
        const candidate = await narrativeProvider.reason(fusedGraph, {
          requestId: layer1Result?.requestId || layer2Result?.requestId || layer2AResult?.requestId || layer3Result?.requestId,
          signal: options.signal,
          budget: options.budget,
        });
        // Preserve every security/truth/action/confidence field from the
        // deterministic result. Only a bounded narrative may cross this
        // optional boundary.
        assessment = {
          ...deterministicAssessment,
          userExplanation: safeNarrative(candidate, deterministicAssessment.userExplanation),
          aiNarrativeStatus: candidate?.aiNarrativeStatus || "provider_output_ignored_for_policy",
          aiNarrativeProvider: typeof candidate?.aiNarrativeProvider === "string" ? candidate.aiNarrativeProvider.slice(0, 120) : undefined,
          aiNarrativeModel: typeof candidate?.aiNarrativeModel === "string" ? candidate.aiNarrativeModel.slice(0, 120) : undefined,
          aiNarrativeUsage: candidate?.aiNarrativeUsage || null,
          aiNarrativeEstimatedCostCents: Number.isFinite(Number(candidate?.aiNarrativeEstimatedCostCents))
            ? Math.max(0, Math.min(1_000_000, Math.floor(Number(candidate.aiNarrativeEstimatedCostCents))))
            : null,
        };
      }
    } catch (err) {
      assessment = {
        ...deterministicAssessment,
        userExplanation: deterministicAssessment.userExplanation,
        aiNarrativeStatus: "fallback_deterministic_only",
        aiNarrativeError: err?.name || "provider_error",
      };
    }

    const executionTimeMs = Number((nowMs() - startTime).toFixed(2));

    return createLayer4Result({
      classification: assessment.classification,
      status: assessment.status,
      securityClassification: assessment.securityClassification,
      truthStatus: assessment.truthStatus,
      enforcement: assessment.enforcement,
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
        requestId: layer1Result?.requestId || layer2Result?.requestId || layer2AResult?.requestId || layer3Result?.requestId || null,
        ruleVersion: LAYER_4_CONFIG.VERSION,
        fusedEvidenceCount: totalEvidenceItems,
        hardRuleTriggered: assessment.hardRuleTriggered,
        policyPrecedence: assessment.policyPrecedence || [],
        evidenceBound: true,
        globalFrameworkCount: globalIntelligence.frameworkCount,
        isAccreditedEcosystem: globalIntelligence.isAccreditedEcosystem,
      },
      metrics: {
        executionTimeMs,
        modelUsed: deterministicProvider.providerId,
        providerStatus: narrativeProvider
          ? (assessment.aiNarrativeStatus || "NARRATIVE_PROVIDER_ATTEMPTED")
          : "LOCAL_DETERMINISTIC",
        confidenceBasis: assessment.confidenceBasis || "deterministic_policy",
      },
    });
  }
}
