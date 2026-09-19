import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TrustOrchestrator } from "../../src/lib/ai-trust/TrustOrchestrator.js";
import { createLayer2AResult } from "../../src/lib/ai-trust/layer2a/types.js";
import {
  normalizeLegacyLayer3Payload,
  normalizeLegacyLayer4Payload,
} from "../../src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js";
import { getLegacyVerificationConfig } from "../../src/lib/ai-trust/integrations/legacyVerification/config.js";

function localLayer4() {
  return {
    securityClassification: "UNKNOWN",
    truthStatus: "INSUFFICIENT_EVIDENCE",
    enforcement: "REVIEW",
    recommendedAction: "REVIEW",
    decisionConfidence: 0.2,
    verificationCompleteness: 0,
    keyReasons: ["Local deterministic policy requires review."],
    evidenceRefs: [],
    userExplanation: { uncertainties: ["Evidence is insufficient."] },
    metrics: { providerStatus: "DETERMINISTIC_POLICY" },
  };
}

function fixtureAdapter(calls) {
  return {
    enabled: true,
    layer2Provider() {
      return {
        check: async ({ requestId }) => {
          calls.push("layer2");
          return createLayer2AResult({
            providerStatus: "SUCCESS",
            finding: "NO_KNOWN_THREAT",
            rawVerdict: "SAFE",
            providerConfidence: 0.95,
            requestId,
          });
        },
      };
    },
    async verifyLayer3({ claims, requestId }) {
      calls.push("layer3");
      return normalizeLegacyLayer3Payload({
        verdict: "UNKNOWN",
        confidence: 0.5,
        stop: false,
        canContinueToLayer4: true,
        reason: "Layer 3 requires an independent synthesis.",
      }, { claims, requestId }).result;
    },
    async verifyLayer4({ requestId }) {
      calls.push("layer4");
      return normalizeLegacyLayer4Payload({
        verdict: "UNKNOWN",
        confidence: 0,
        stop: false,
        canContinueToLayer4: false,
        reason: "Independent synthesis is unavailable in the fixture.",
      }, { requestId }).result;
    },
  };
}

describe("Trust Render backend wiring", () => {
  it("accepts the existing friend-backend URL as a server-only compatibility alias", () => {
    const config = getLegacyVerificationConfig({
      FRIEND_BACKEND_API_URL: "https://studenthub-api-8fqp.onrender.com",
    });
    assert.equal(config.enabled, true);
    assert.equal(config.baseUrl, "https://studenthub-api-8fqp.onrender.com");
  });

  it("routes the four-layer pipeline through the configured adapter", async () => {
    const calls = [];
    const orchestrator = new TrustOrchestrator({
      legacyVerificationAdapter: fixtureAdapter(calls),
      services: {
        l1: async () => ({ status: "PASS", reasons: [], signals: [] }),
        l2b: async () => ({
          status: "NORMAL",
          classification: "INFORMATIVE",
          claims: [{ claimId: "claim-1", rawText: "A bounded claim" }],
          verificationPackage: { candidateSources: [] },
        }),
        l2c: async () => ({
          classification: "UNKNOWN_STUDENT_RISK",
          riskSignals: [],
          modelStatus: "AVAILABLE",
          verificationPackage: { verificationTasks: [] },
        }),
        l4: async () => localLayer4(),
      },
    });

    const result = await orchestrator.run(
      { type: "url", content: "https://example.com" },
      { requestId: "render-wiring-test" },
    );

    assert.deepEqual(calls, ["layer2", "layer3", "layer4"]);
    assert.equal(result.pipelineStatus, "COMPLETED");
    assert.equal(result.layerResults.layer3.legacyIntegration.status, "COMPLETED");
    assert.equal(result.layerResults.layer4.legacyIntegration.rawVerdict, "UNKNOWN");
    assert.equal(result.finalDecision.action, "REVIEW");
    assert.equal(result.mode, "LIVE");
  });
});
