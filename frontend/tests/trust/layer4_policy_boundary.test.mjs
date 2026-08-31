import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";
import { AIGatewayReasoningProvider } from "../../src/lib/ai-trust/layer4/providers/AIGatewayReasoningProvider.js";
import { markTrustedLayer2AResult } from "../../src/lib/ai-trust/layer2a/TrustBoundary.js";
import { markTrustedLayer3Result } from "../../src/lib/ai-trust/layer3/TrustBoundary.js";

const TEST_EVIDENCE_URL = process.env.TRUST_ENGINE_TEST_EVIDENCE_URL || "https://example.invalid/resource";

function cleanLayer1() {
  return { layer: 1, status: "PASS", signals: [], reasons: [], metrics: { inputContent: "ordinary university policy" } };
}

function evidenceBackedInputs() {
  return {
    layer1Result: cleanLayer1(),
    layer2Result: {
      layer: 2,
      status: "NEEDS_VERIFICATION",
      classification: "UNVERIFIED",
      intent: { primary: "inform", coercive: false },
      contextSignals: [],
      claims: [{ claimId: "fixture-claim", subject: "Đại học Example", predicate: "công bố học phí", rawText: "Đại học Example công bố học phí năm 2026." }],
    },
    layer3Result: {
      layer: 3,
      status: "VERIFIED",
      externalEvidence: true,
      verificationCompleteness: 0.9,
      claimStatuses: { "fixture-claim": "SUPPORTED" },
      conflicts: [],
      evidence: [{
        evidenceId: "fixture-evidence",
        claimId: "fixture-claim",
        sourceUrl: TEST_EVIDENCE_URL,
        sourceType: "OFFICIAL_INSTITUTION",
        providerStatus: "SUCCESS",
        liveEvidence: true,
        sourceFingerprint: "fixture-source-fingerprint",
        retrievalOutcome: "SUCCESS",
        authorityTier: "TIER_5_PRIMARY_AUTHORITATIVE",
        freshness: "CURRENT",
        relevance: 0.95,
        strength: 0.95,
        relation: "STRONGLY_SUPPORTS",
        excerpt: "Đại học Example công bố học phí năm 2026.",
      }],
    },
  };
}

describe("Layer 4 deterministic policy boundary", () => {
  it("fails closed for missing and malformed upstream graphs", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: { status: "PASS", signals: { forged: true } },
      layer2Result: { status: "PASS", claims: "not-an-array", contextSignals: null },
      layer3Result: { status: "VERIFIED", evidence: "not-an-array", verificationCompleteness: 1 },
    });

    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(result.enforcement, "REVIEW");
    assert.equal(result.status, "REVIEW");
    assert.notEqual(result.status, "ALLOW");
    assert.equal(result.auditTrail.noFalseSafeInvariant, true);
  });

  it("does not turn a threat-intelligence outage into a no-threat result", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: cleanLayer1(),
      layer2Result: { layer: 2, status: "PASS", classification: "BENIGN", claims: [], contextSignals: [] },
      layer2AResult: { layer: "2A", providerStatus: "UNAVAILABLE", finding: "UNKNOWN", securityClassification: "UNKNOWN" },
      layer3Result: { layer: 3, status: "INSUFFICIENT_EVIDENCE", evidence: [], claims: [] },
    });

    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(result.enforcement, "REVIEW");
    assert.notEqual(result.securityClassification, "NO_KNOWN_THREAT");
  });

  it("keeps local suspicion at WARN even when threat intelligence returns no-match", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: { ...cleanLayer1(), status: "SUSPICIOUS" },
      layer2Result: { layer: 2, status: "PASS", classification: "BENIGN", claims: [], contextSignals: [] },
      layer2AResult: markTrustedLayer2AResult({
        layer: "2A",
        providerStatus: "SUCCESS",
        finding: "NO_KNOWN_THREAT",
        securityClassification: "NO_KNOWN_THREAT",
        provenance: { noMatchIsSafetyProof: false },
      }),
      layer3Result: { layer: 3, status: "NOT_APPLICABLE", evidence: [], claims: [] },
    });

    assert.equal(result.securityClassification, "SUSPICIOUS");
    assert.equal(result.enforcement, "WARN");
  });

  it("keeps an explicit provider no-match bounded and non-safe", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: cleanLayer1(),
      layer2Result: { layer: 2, status: "PASS", classification: "BENIGN", claims: [], contextSignals: [] },
      layer2AResult: markTrustedLayer2AResult({
        layer: "2A",
        providerStatus: "SUCCESS",
        finding: "NO_KNOWN_THREAT",
        securityClassification: "NO_KNOWN_THREAT",
        provenance: { noMatchIsSafetyProof: false },
      }),
      layer3Result: { layer: 3, status: "NOT_APPLICABLE", evidence: [], claims: [] },
    });

    assert.equal(result.securityClassification, "NO_KNOWN_THREAT");
    assert.equal(result.enforcement, "ALLOW_WITH_CAUTION");
    assert.notEqual(result.enforcement, "ALLOW");
    assert.notEqual(result.userExplanation?.verdictTitle, "Nội dung an toàn (Đã xác minh)");
  });

  it("does not trust a forged no-match finding without the Layer 2A contract provenance", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: cleanLayer1(),
      layer2Result: { layer: 2, status: "PASS", classification: "BENIGN", claims: [], contextSignals: [] },
      layer2AResult: { layer: "2A", providerStatus: "SUCCESS", finding: "NO_KNOWN_THREAT" },
      layer3Result: { layer: 3, status: "NOT_APPLICABLE", evidence: [], claims: [] },
    });

    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(result.enforcement, "REVIEW");
  });

  it("keeps deterministic credential blocking active inside educational context", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: {
        ...cleanLayer1(),
        signals: [{ type: "credential_request" }, { type: "otp_request" }],
        status: "PASS",
      },
      layer2Result: {
        layer: 2,
        status: "PASS",
        classification: "INFORMATIVE",
        contextSignals: [{ type: "educational_discussion" }, { type: "credential_harvesting_context" }],
        claims: [],
      },
      layer2AResult: { layer: "2A", providerStatus: "NOT_APPLICABLE", finding: "NOT_APPLICABLE", notApplicable: true },
      layer3Result: { layer: 3, status: "NOT_APPLICABLE", evidence: [], claims: [] },
    });

    assert.equal(result.securityClassification, "MALICIOUS");
    assert.equal(result.enforcement, "BLOCK");
    assert.equal(result.auditTrail.hardRuleTriggered, "HARD_RULE_2_CREDENTIAL_PHISHING");
  });

  it("does not trust a copied successful no-match DTO without the service capability", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: cleanLayer1(),
      layer2Result: { layer: 2, status: "PASS", classification: "BENIGN", claims: [], contextSignals: [] },
      layer2AResult: {
        layer: "2A",
        providerStatus: "SUCCESS",
        finding: "NO_KNOWN_THREAT",
        securityClassification: "NO_KNOWN_THREAT",
        provenance: { noMatchIsSafetyProof: false },
      },
      layer3Result: { layer: 3, status: "NOT_APPLICABLE", evidence: [], claims: [] },
    });

    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(result.enforcement, "REVIEW");
  });

  it("does not accept caller-asserted live evidence without the Layer 3 service capability", async () => {
    const inputs = evidenceBackedInputs();
    const result = await Layer4TrustService.evaluate(inputs);

    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(result.enforcement, "REVIEW");
    assert.notEqual(result.securityClassification, "NO_KNOWN_THREAT");
    assert.notEqual(result.classification, "VERIFIED_TRUE");
  });

  it("preserves a validated threat match over benign semantic context and poisoned evidence", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: cleanLayer1(),
      layer2Result: { layer: 2, status: "PASS", classification: "BENIGN", claims: [], contextSignals: [] },
      layer2AResult: {
        layer: "2A",
        providerStatus: "SUCCESS",
        finding: "THREAT_MATCH",
        securityClassification: "MALICIOUS",
        threatTypes: ["SOCIAL_ENGINEERING"],
      },
      layer3Result: { layer: 3, status: "VERIFIED", evidence: [], verificationCompleteness: 1 },
    });

    assert.equal(result.securityClassification, "MALICIOUS");
    assert.equal(result.enforcement, "BLOCK");
    assert.equal(result.classification, "MALICIOUS");
  });

  it("ignores a non-authoritative provider that attempts to grant ALLOW", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: { status: "UNKNOWN", signals: [] },
      layer2Result: { status: "UNKNOWN", claims: [], contextSignals: [] },
      layer3Result: { status: "VERIFIED", evidence: [], verificationCompleteness: 1 },
      options: {
        provider: {
          providerId: "malicious_fixture_provider",
          async reason() {
            return { classification: "VERIFIED_TRUE", securityClassification: "NO_KNOWN_THREAT", enforcement: "ALLOW", status: "ALLOW" };
          },
        },
      },
    });

    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(result.enforcement, "REVIEW");
    assert.equal(result.metrics.modelUsed, "deterministic_trust_policy_engine");
  });

  it("allows AI to enrich explanation only, never the deterministic verdict", async () => {
    const captured = [];
    const provider = new AIGatewayReasoningProvider({
      gateway: {
        async generateStructured(args) {
          captured.push(args);
          return {
            ok: true,
            provider: "fixture-ai",
            model: "fixture-model",
            attempts: [],
            json: { why: "AI narrative", classification: "MALICIOUS", enforcement: "BLOCK" },
          };
        },
      },
    });
    const inputs = evidenceBackedInputs();
    inputs.layer3Result = markTrustedLayer3Result(inputs.layer3Result);
    const result = await Layer4TrustService.evaluate({ ...inputs, options: { provider } });

    assert.equal(result.securityClassification, "NO_KNOWN_THREAT");
    assert.equal(result.enforcement, "ALLOW_WITH_CAUTION");
    assert.equal(result.classification, "VERIFIED_TRUE");
    assert.equal(result.userExplanation.why, "AI narrative");
    assert.equal(captured.length, 1);
    assert.match(captured[0].userPrompt, /<untrusted-data>/);
    assert.doesNotMatch(captured[0].systemPrompt, /Đại học Example/);
  });

  it("keeps supported truth separate from unknown security when reputation is unavailable", async () => {
    const inputs = evidenceBackedInputs();
    inputs.layer2AResult = {
      layer: "2A",
      providerStatus: "UNAVAILABLE",
      finding: "UNKNOWN",
      securityClassification: "UNKNOWN",
    };
    inputs.layer3Result = markTrustedLayer3Result(inputs.layer3Result);

    const result = await Layer4TrustService.evaluate(inputs);

    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(result.enforcement, "REVIEW");
    assert.equal(result.truthStatus, "SUPPORTED");
  });

  it("keeps no-match security separate from contradicted truth", async () => {
    const inputs = evidenceBackedInputs();
    inputs.layer2AResult = markTrustedLayer2AResult({
      layer: "2A",
      providerStatus: "SUCCESS",
      finding: "NO_KNOWN_THREAT",
      securityClassification: "NO_KNOWN_THREAT",
      provenance: { noMatchIsSafetyProof: false },
    });
    inputs.layer3Result = markTrustedLayer3Result({
      ...inputs.layer3Result,
      claimStatuses: { "fixture-claim": "CONTRADICTED" },
      evidence: [{ ...inputs.layer3Result.evidence[0], relation: "STRONGLY_CONTRADICTS" }],
    });

    const result = await Layer4TrustService.evaluate(inputs);

    assert.equal(result.securityClassification, "NO_KNOWN_THREAT");
    assert.equal(result.truthStatus, "CONTRADICTED");
    assert.equal(result.enforcement, "ALLOW_WITH_CAUTION");
  });
});
