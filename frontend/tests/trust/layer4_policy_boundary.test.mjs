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

function validatedSafeReputation() {
  return markTrustedLayer2AResult({
    layer: "2A",
    providerStatus: "SUCCESS",
    finding: "NO_KNOWN_THREAT",
    securityClassification: "NO_KNOWN_THREAT",
    providerResults: [
      { provider: "Google Safe Browsing", success: true, verdict: "SAFE" },
      { provider: "Firefox Safe Browsing", success: true, verdict: "SAFE" },
    ],
    provenance: { noMatchIsSafetyProof: false },
  });
}

function validatedLiveUrl() {
  return markTrustedLayer3Result({
    layer: 3,
    status: "NOT_APPLICABLE",
    externalEvidence: true,
    sources: [{
      sourceId: "direct-chatgpt",
      url: "https://chatgpt.com/",
      sourceType: "USER_SUPPLIED",
      providerStatus: "SUCCESS",
      liveEvidence: true,
      sourceFingerprint: "sha256-direct-chatgpt",
      retrievalOutcome: "SUCCESS",
      httpStatus: 200,
      sourceScope: "direct_input",
    }],
    evidence: [],
    claims: [],
    conflicts: [],
    verificationCompleteness: 0,
  });
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

  it("does not turn an L2 cooldown/partial label into security suspicion", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: cleanLayer1(),
      layer2Result: {
        layer: 2,
        status: "SUSPICIOUS",
        classification: "UNKNOWN",
        claims: [],
        contextSignals: [],
        details: { providerStatus: "COOLDOWN" },
        metrics: { providerStatus: "COOLDOWN" },
      },
      layer2AResult: { layer: "2A", providerStatus: "NOT_APPLICABLE", finding: "NOT_APPLICABLE" },
      layer3Result: { layer: 3, status: "NOT_APPLICABLE", evidence: [], claims: [] },
    });

    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(result.enforcement, "REVIEW");
    assert.notEqual(result.riskAssessment.level, "MEDIUM");
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

  it("clears soft local suspicion after all reputation providers and Layer 3 validate the URL target", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: { ...cleanLayer1(), status: "SUSPICIOUS", signals: [{ type: "url_heuristic" }] },
      layer2Result: {
        layer: 2,
        status: "SUSPICIOUS",
        classification: "UNVERIFIED",
        claims: [],
        contextSignals: [],
      },
      layer2AResult: validatedSafeReputation(),
      layer3Result: validatedLiveUrl(),
    });

    assert.equal(result.securityClassification, "SAFE");
    assert.equal(result.enforcement, "ALLOW");
    assert.equal(result.riskAssessment.level, "LOW");
    assert.ok(result.auditTrail.policyPrecedence.includes("L2A_ALL_PROVIDERS_SAFE_PLUS_L3_LIVE_TARGET"));
    assert.match(result.userExplanation.verdictTitle, /AN TOÀN.*XÁC MINH/i);
    assert.match(result.userExplanation.why, /Layer 2A.*Layer 3/i);
  });

  it("never lets reputation clearance downgrade a credential hard negative", async () => {
    const result = await Layer4TrustService.evaluate({
      layer1Result: { ...cleanLayer1(), signals: [{ type: "credential_request" }] },
      layer2Result: { layer: 2, status: "PASS", classification: "BENIGN", claims: [], contextSignals: [] },
      layer2AResult: validatedSafeReputation(),
      layer3Result: validatedLiveUrl(),
    });

    assert.equal(result.securityClassification, "MALICIOUS");
    assert.equal(result.enforcement, "BLOCK");
    assert.equal(result.auditTrail.hardRuleTriggered, "HARD_RULE_2_CREDENTIAL_PHISHING");
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
          if (args.options?.responseSchema?.properties?.evidenceGaps) {
            return {
              ok: true,
              provider: "gemini",
              model: "gemini-3.8-flash",
              attempts: [],
              json: { needsMoreEvidence: false, evidenceGaps: [] },
            };
          }
          return {
            ok: true,
            provider: "gemini",
            model: "gemini-3.8-flash",
            attempts: [],
            providerMetadata: { transport: "interactions", thinkingLevel: "low" },
            json: {
              verdictSignal: "SUPPORTS",
              supportReasons: ["AI narrative"],
              contradictionReasons: [],
              missingEvidence: [],
              uncertainty: "Fixture uncertainty",
              citationsUsed: [],
              supportingSourceIds: ["fixture-evidence"],
              provider: "gemini",
              model: "gemini-3.8-flash",
            },
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
    assert.equal(result.aiVerificationStatus, "VERIFIED");
    assert.equal(result.aiVerification.supportReasons[0], "AI narrative");
    assert.notEqual(result.userExplanation.why, "AI narrative");
    assert.match(result.userExplanation.why, /không phát hiện|bằng chứng/i);
    assert.equal(captured.length, 2);
    assert.ok(captured.some((request) => /<untrusted-data>/.test(request.userPrompt)));
    assert.doesNotMatch(captured[1].systemPrompt, /Đại học Example/);
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
