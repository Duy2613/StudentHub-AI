import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Layer1ScreenService } from "../../src/lib/ai-trust/layer1/Layer1ScreenService.js";
import { Layer2AReputationService } from "../../src/lib/ai-trust/layer2a/Layer2AReputationService.js";
import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";
import { MockReputationProvider } from "./fixtures/MockReputationProvider.mjs";

describe("Trust Engine M3 false-safe regression", () => {
  it("FALSE_SAFE_GOOGLE_CANARY_P0", async () => {
    // This is an injected provider-contract fixture, not a fake provider or
    // a hard-coded network canary. The live canary URL is supplied only to
    // the external probe and is never used as a production decision switch.
    const layer1Result = await Layer1ScreenService.screen({
      type: "text",
      content: "A routine university announcement for students.",
      options: { requestId: "FALSE_SAFE_GOOGLE_CANARY_P0" },
    });

    const finalResult = await Layer4TrustService.evaluate({
      layer1Result,
      layer2Result: {
        layer: 2,
        status: "PASS",
        classification: "BENIGN",
        claims: [],
        contextSignals: [],
      },
      // Deliberately poisoned downstream evidence must not erase an
      // authoritative threat match from Layer 2A.
      layer3Result: {
        layer: 3,
        status: "VERIFIED",
        claims: [],
        evidence: [],
        conflicts: [],
        verificationCompleteness: 1,
      },
      layer2AResult: {
        layer: "2A",
        provider: "google_safe_browsing",
        providerStatus: "SUCCESS",
        finding: "THREAT_MATCH",
        threatTypes: ["SOCIAL_ENGINEERING"],
        rawVerdict: "DANGEROUS",
        providerConfidence: 0.99,
      },
    });

    assert.equal(finalResult.securityClassification, "MALICIOUS");
    assert.equal(finalResult.enforcement, "BLOCK");
    assert.notEqual(finalResult.status, "ALLOW");
    assert.notEqual(finalResult.classification, "VERIFIED_TRUE");
    assert.match(finalResult.userExplanation?.verdictTitle || "", /NGUY HIỂM/i);
  });

  it("MOCK_REQUIRED_L2A_PIPELINE_REMAINS_UNKNOWN_AND_REVIEW_ONLY", async () => {
    const layer1Result = await Layer1ScreenService.screen({
      type: "text",
      content: "A routine university announcement for students.",
      options: { requestId: "MOCK_REQUIRED_L2A_PIPELINE_REMAINS_UNKNOWN_AND_REVIEW_ONLY" },
    });
    const layer2AResult = await Layer2AReputationService.verify({
      url: process.env.TRUST_ENGINE_TEST_TARGET || "https://example.invalid/resource",
      requestId: "MOCK_REQUIRED_L2A_PIPELINE_REMAINS_UNKNOWN_AND_REVIEW_ONLY",
      options: { provider: new MockReputationProvider() },
    });
    const result = await Layer4TrustService.evaluate({
      layer1Result,
      layer2Result: { layer: 2, status: "PASS", classification: "BENIGN", claims: [], contextSignals: [] },
      layer2AResult,
      layer3Result: { layer: 3, status: "NOT_APPLICABLE", claims: [], evidence: [] },
    });

    assert.equal(layer2AResult.provider, "mock_reputation_provider_test_only");
    assert.equal(layer2AResult.finding, "UNKNOWN");
    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(result.enforcement, "REVIEW");
    assert.notEqual(result.securityClassification, "NO_KNOWN_THREAT");
  });
});
