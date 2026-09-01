import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TrustPipelineOrchestrator } from "../../src/lib/ai-trust/v5/TrustPipelineOrchestrator.js";
import { createLayer2AResult } from "../../src/lib/ai-trust/layer2a/types.js";
import { normalizeLegacyLayer3Payload } from "../../src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js";

function layer4Policy() {
  return {
    securityClassification: "UNKNOWN",
    truthStatus: "INSUFFICIENT_EVIDENCE",
    enforcement: "REVIEW",
    recommendedAction: "REVIEW",
    decisionConfidence: 0.2,
    verificationCompleteness: 0,
    claims: [],
    keyReasons: ["Evidence is not sufficient."],
    evidenceRefs: [],
    conflicts: [],
    limitations: ["Review required."],
    userExplanation: { verdictTitle: "Review", why: "Review required.", riskSummary: "Unknown.", recommendedActionNote: "Review." },
    auditTrail: { ruleVersion: "test-policy" },
    metrics: { providerStatus: "LOCAL_DETERMINISTIC" },
  };
}

function assurance() {
  return {
    status: "ASSURANCE_PASS",
    anomalies: [],
    assuranceReasons: [],
    recommendedRechecks: [],
    auditVersion: "test-assurance",
    downgradeOnly: true,
  };
}

function createFixtureAdapter({ continueToLayer4 = true, layer4Result = null, calls }) {
  return {
    enabled: true,
    layer2Provider() {
      return {
        check: async ({ requestId }) => {
          calls.push("l2");
          return createLayer2AResult({ providerStatus: "SUCCESS", finding: "NO_KNOWN_THREAT", rawVerdict: "SAFE", providerConfidence: 0.91, requestId });
        },
      };
    },
    async verifyLayer3({ claims, requestId }) {
      calls.push("l3");
      const normalized = normalizeLegacyLayer3Payload({ verdict: "UNKNOWN", stop: !continueToLayer4, canContinueToLayer4: continueToLayer4, reason: "Needs corroboration" }, { claims, requestId });
      return normalized.result;
    },
    async verifyLayer4({ requestId }) {
      calls.push("l4");
      return layer4Result || {
        status: "COMPLETED",
        providerStatus: "SUCCESS",
        providerId: "legacy-layer4-fixture",
        requestId,
        rawVerdict: "TRUE",
        assessmentConfidence: 0.96,
        evidenceAgreement: "MIXED",
        sourceQuality: "UNKNOWN",
        stop: false,
        canContinueToLayer4: false,
        reason: "Candidate synthesis only.",
        contradictoryEvidence: ["A source needs review."],
        sources: [],
        sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
        limitations: ["Does not override local policy."],
      };
    },
  };
}

function orchestrator(adapter) {
  return new TrustPipelineOrchestrator({
    legacyVerificationAdapter: adapter,
    maxRetriesPerStage: 0,
    services: {
      l1: async () => ({ status: "PASS", reasons: [], signals: [] }),
      l2b: async () => ({ status: "NORMAL", classification: "INFORMATIVE", claims: [{ claimId: "claim-1", rawText: "A bounded claim" }], verificationPackage: { candidateSources: [] } }),
      l2c: async () => ({ classification: "UNKNOWN_STUDENT_RISK", riskSignals: [], verificationPackage: { verificationTasks: [] } }),
      l4: async () => layer4Policy(),
      l5: async () => assurance(),
    },
  });
}

describe("canonical Trust orchestrator and legacy layer boundary", () => {
  it("runs legacy L2/L3/L4 behind the server orchestrator and retains canonical projections", async () => {
    const calls = [];
    const result = await orchestrator(createFixtureAdapter({ calls })).run({ type: "url", content: "https://example.com" }, { requestId: "orchestrator-run-1" });
    assert.deepEqual(calls, ["l2", "l3", "l4"]);
    assert.equal(result.pipelineStatus, "COMPLETED");
    assert.equal(result.layerResults.layer3.legacyIntegration.rawVerdict, "UNKNOWN");
    assert.equal(result.layerResults.layer4.legacyIntegration.rawVerdict, "TRUE");
    assert.equal(result.layerResults.layer4.legacyIntegration.assessmentConfidence, 0.96);
    assert.equal(result.finalDecision.action, "REVIEW");
    assert.equal(result.mode, "LIVE");
    assert.equal(result.passport.appendOnly, true);
    assert.ok(Array.isArray(result.evidence));
    assert.ok(result.graph.nodes.every((node) => node.origin || node.kind === "INPUT"));
  });

  it("enforces Layer 3 continuation server-side and skips legacy synthesis without treating it as pass", async () => {
    const calls = [];
    const result = await orchestrator(createFixtureAdapter({ calls, continueToLayer4: false })).run({ type: "text", content: "Claim needs review" }, { requestId: "orchestrator-stop" });
    assert.deepEqual(calls, ["l3"]);
    assert.equal(result.layerResults.layer3.legacyIntegration.canContinueToLayer4, false);
    assert.equal(result.layerResults.layer4.legacyIntegration.status, "SKIPPED");
    assert.equal(result.layerResults.layer4.legacyIntegration.rawVerdict, null);
    assert.equal(result.finalDecision.action, "REVIEW");
  });

  it("marks an optional legacy Layer 4 outage as partial while preserving local deterministic policy", async () => {
    const calls = [];
    const result = await orchestrator(createFixtureAdapter({
      calls,
      layer4Result: {
        status: "UNAVAILABLE",
        providerStatus: "UNAVAILABLE",
        providerId: "legacy-layer4",
        requestId: "orchestrator-outage",
        rawVerdict: null,
        assessmentConfidence: null,
        evidenceAgreement: null,
        sourceQuality: null,
        stop: true,
        canContinueToLayer4: false,
        reason: "Provider unavailable.",
        contradictoryEvidence: [],
        sources: [],
        sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
        limitations: ["Unavailable is not safe."],
      },
    })).run({ type: "url", content: "https://example.com" }, { requestId: "orchestrator-outage" });
    assert.deepEqual(calls, ["l2", "l3", "l4"]);
    assert.equal(result.pipelineStatus, "PARTIAL");
    assert.equal(result.stages.l4.operationStatus, "PARTIAL");
    assert.equal(result.finalDecision.action, "REVIEW");
    assert.equal(result.layerResults.layer4.legacyIntegration.status, "UNAVAILABLE");
  });
});
