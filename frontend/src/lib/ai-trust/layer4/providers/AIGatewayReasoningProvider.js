/**
 * Layer 4 — AIGatewayReasoningProvider
 *
 * Multi-vendor replacement for the historical single-vendor
 * GeminiTrustReasoningProvider (which was dead code: it built a Gemini
 * prompt but never actually called any API and always delegated to the
 * deterministic provider).
 *
 * DESIGN RULE (Master Prompt Section J1 / G4 applied to Layer 4):
 *   AI may EXPLAIN. AI must NEVER determine classification, risk level,
 *   recommended action, or confidence — those remain 100% deterministic,
 *   computed by DeterministicTrustPolicyProvider (HardDecisionPolicy,
 *   RiskAssessmentEngine, TruthAssessmentEngine, ConfidenceCalibrationEngine).
 *
 * This provider always runs the deterministic policy FIRST to obtain the
 * authoritative verdict, then — only if an AI Gateway model is configured
 * and responds successfully — asks it to produce a friendlier Vietnamese
 * narrative for `userExplanation.why`. If the AI call fails, is
 * unconfigured, or returns an invalid shape, the original deterministic
 * explanation is used unchanged. The verdict itself is never at risk.
 *
 * OPT-IN: Layer4TrustService still defaults to DeterministicTrustPolicyProvider
 * unless the caller explicitly passes `options.provider = new AIGatewayReasoningProvider()`.
 */

import { ITrustReasoningModel } from "./ITrustReasoningModel.js";
import { DeterministicTrustPolicyProvider } from "./DeterministicTrustPolicyProvider.js";
import { AIGatewayService, AI_CAPABILITY } from "../../../ai-gateway/index.js";

function isValidNarrativeShape(json) {
  return json && typeof json.why === "string" && json.why.trim().length > 0;
}

export class AIGatewayReasoningProvider extends ITrustReasoningModel {
  constructor() {
    super("ai_gateway_multi_vendor_trust_reasoning");
    this.deterministicProvider = new DeterministicTrustPolicyProvider();
  }

  async reason(fusedGraph) {
    // 1. Authoritative deterministic verdict — never bypassed.
    const deterministic = await this.deterministicProvider.reason(fusedGraph);

    // 2. Hard-blocked / abstained results are never narratively "softened".
    if (deterministic.hardRuleTriggered || deterministic.classification === "INSUFFICIENT_EVIDENCE") {
      return deterministic;
    }

    // 3. Attempt AI-generated narrative enrichment (best-effort only).
    const systemPrompt =
      "You are a Vietnamese-language explanation writer for StudentHubAI's Trust Engine. " +
      "You are given an ALREADY-DECIDED verdict and its supporting evidence. You must NOT " +
      "change the verdict. Write a clear, concise Vietnamese explanation (2-4 sentences) of " +
      "WHY this verdict was reached, referencing the evidence provided. " +
      'Respond ONLY with JSON: {"why": "Vietnamese explanation text"}';

    const userPrompt = `VERDICT (fixed, do not change): ${deterministic.classification}
RISK LEVEL (fixed): ${deterministic.riskAssessment?.level}
RECOMMENDED ACTION (fixed): ${deterministic.status}
KEY REASONS: ${JSON.stringify(deterministic.keyReasons || [])}
EVIDENCE COUNT: ${(fusedGraph.layer3Evidence || []).length}
CLAIMS: ${JSON.stringify((fusedGraph.layer2Claims || []).slice(0, 5).map((c) => c.rawText))}`;

    const enrichment = await AIGatewayService.generateStructured({
      capability: AI_CAPABILITY.DEEP_REASONING,
      systemPrompt,
      userPrompt,
      validate: isValidNarrativeShape,
    });

    if (!enrichment.ok) {
      return {
        ...deterministic,
        aiNarrativeStatus: "fallback_deterministic_only",
        aiNarrativeError: enrichment.errorMessage,
      };
    }

    return {
      ...deterministic,
      userExplanation: {
        ...deterministic.userExplanation,
        why: enrichment.json.why,
      },
      aiNarrativeStatus: "ai_gateway_enriched",
      aiNarrativeProvider: enrichment.provider,
      aiNarrativeModel: enrichment.model,
    };
  }
}
