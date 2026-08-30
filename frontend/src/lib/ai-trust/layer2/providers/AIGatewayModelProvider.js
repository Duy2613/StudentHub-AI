/**
 * Layer 2 — AIGatewayModelProvider
 *
 * Multi-vendor replacement for the historical single-vendor
 * GeminiSemanticModelProvider. Routes through the shared AI Gateway
 * (docs/AI-MODEL-ROUTER.md) which capability-routes across every
 * configured provider (GenSpark OpenAI-compatible proxy, Gemini, ...)
 * with automatic fallback, instead of hard-coding one vendor.
 *
 * Falls back to DeterministicSemanticProvider whenever:
 *  - no provider is configured,
 *  - every candidate in the fallback chain fails,
 *  - the model output fails JSON schema validation.
 *
 * This provider is OPT-IN: Layer2SemanticService still defaults to
 * DeterministicSemanticProvider unless the caller explicitly passes
 * `options.provider = new AIGatewayModelProvider()` or `options.useAIGateway`.
 */

import { ISemanticVerificationProvider } from "./ISemanticVerificationProvider.js";
import { DeterministicSemanticProvider } from "./DeterministicSemanticProvider.js";
import { AIGatewayService, AI_CAPABILITY } from "../../../ai-gateway/index.js";

const RESPONSE_SCHEMA_HINT = `Respond ONLY with valid JSON matching this schema:
{
  "semanticSummary": "Short explanation in Vietnamese",
  "intent": { "primary": "inform|request_action|request_credentials|request_payment|impersonate|educate", "secondary": null },
  "entities": [{ "name": "string", "type": "university|bank|government|tech", "isClaimedAuthor": boolean }],
  "claims": [{ "claimId": "string", "subject": "string", "predicate": "string", "object": "string", "importance": "critical|high|medium|low", "verificationRequired": boolean }],
  "contextSignals": [{ "type": "string", "severity": "critical|high|medium|low|info", "details": "string" }],
  "consistencyFindings": [],
  "crossModalFindings": [],
  "classification": "BENIGN|INFORMATIVE|AMBIGUOUS|MISLEADING|DECEPTIVE|MALICIOUS|UNVERIFIED"
}`;

function isValidLayer2Shape(json) {
  return (
    json &&
    typeof json.semanticSummary === "string" &&
    typeof json.classification === "string" &&
    Array.isArray(json.claims) &&
    Array.isArray(json.entities) &&
    Array.isArray(json.contextSignals)
  );
}

export class AIGatewayModelProvider extends ISemanticVerificationProvider {
  constructor() {
    super("ai_gateway_multi_vendor_reasoning");
    this.fallbackEngine = new DeterministicSemanticProvider();
  }

  async analyzeSemantics(params) {
    const { text = "", url = "", ocrText = "", qrPayload = "", layer1Result = {} } = params;

    const systemPrompt =
      "You are Layer 2 of the StudentHubAI Trust Pipeline. Analyze the content for semantic " +
      "meaning, intent, factual claims, and contextual manipulation. " +
      RESPONSE_SCHEMA_HINT;

    const userPrompt = `CONTENT TO ANALYZE:
- Text: ${text || "(none)"}
- URL: ${url || "(none)"}
- OCR Image Text: ${ocrText || "(none)"}
- QR Code Payload: ${qrPayload || "(none)"}
- Layer 1 Status: ${layer1Result?.status || "UNKNOWN"}`;

    const result = await AIGatewayService.generateStructured({
      capability: AI_CAPABILITY.CLAIM_EXTRACTION,
      systemPrompt,
      userPrompt,
      validate: isValidLayer2Shape,
    });

    if (!result.ok) {
      const fallback = await this.fallbackEngine.analyzeSemantics(params);
      return {
        ...fallback,
        modelStatus: "fallback_used",
        fallbackReason: result.errorMessage,
        gatewayAttempts: result.attempts,
      };
    }

    return {
      ...result.json,
      providerId: this.providerId,
      modelUsed: result.model,
      modelProvider: result.provider,
      gatewayAttempts: result.attempts,
    };
  }
}
