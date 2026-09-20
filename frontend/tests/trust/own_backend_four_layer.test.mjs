import assert from "node:assert/strict";
import test from "node:test";

import { OwnBackendTrustOrchestrator } from "../../src/lib/ai-trust/OwnBackendTrustOrchestrator.js";
import { Layer3EvidenceService } from "../../src/lib/ai-trust/layer3/Layer3EvidenceService.js";

function servicesWithLiveEvidence(calls) {
  return {
    l1: async () => ({
      status: "PASS",
      reasons: ["Deterministic fixture passed."],
      signals: [],
      metrics: { detectorsExecuted: ["InputNormalizer", "DecisionEngine"] },
    }),
    l2a: async () => ({
      provider: "fixture-threat-provider",
      providerStatus: "SUCCESS",
      finding: "NO_KNOWN_THREAT",
      message: "No match in the fixture provider observation.",
      providerResults: [{
        provider: "fixture-threat-provider",
        providerId: "fixture-threat-provider",
        status: "SUCCESS",
        finding: "NO_KNOWN_THREAT",
        verdict: "NO_KNOWN_THREAT",
        success: true,
        message: "No match in this fixture observation.",
      }],
    }),
    l2b: async (params) => {
      calls.l2bOptions = params?.options || {};
      return {
        status: "PASS",
        classification: "BENIGN",
        confidence: 0.8,
        semanticSummary: "No material semantic signal in the fixture input.",
        contextSignals: [],
        claims: [],
        entities: [],
      };
    },
    l2c: async () => ({
      classification: "NO_MATERIAL_STUDENT_RISK",
      modelStatus: "BASELINE_RULE_MODEL",
      riskSignals: [],
      explanation: "No material domain signal in the fixture.",
    }),
    l3: async () => ({
      status: "SUPPORTED",
      retrievalStatus: "SUCCESS",
      retrievalMode: "EXTERNAL_RETRIEVER",
      externalEvidence: true,
      sources: [{
        sourceId: "fixture-source-1",
        url: "https://example.com/official-record",
        title: "Official fixture record",
        publisher: "Fixture publisher",
        domain: "example.com",
        liveEvidence: true,
        retrievalOutcome: "SUCCESS",
        authorityScore: 0.9,
      }],
      evidence: [{
        evidenceId: "fixture-evidence-1",
        sourceId: "fixture-source-1",
        claimId: "fixture-claim-1",
        sourceUrl: "https://example.com/official-record",
        liveEvidence: true,
        retrievalOutcome: "SUCCESS",
        excerpt: "The live fixture record supports the claim.",
      }],
      conflicts: [],
      limitations: [],
      crossSourceAgreement: { agreementScore: 0.9, unresolved: false },
      verificationCompleteness: 0.9,
      evidenceConfidence: 0.9,
      metrics: {
        retrievalProvider: "tavily_fixture",
        retrievalStatus: "SUCCESS",
        retrievalMode: "EXTERNAL_RETRIEVER",
        externalEvidence: true,
        providerCallCount: 1,
        sourcesRetrievedCount: 1,
        evidenceItemsCount: 1,
      },
    }),
    l4: async () => {
      calls.l4 += 1;
      return {
        securityClassification: "NO_KNOWN_THREAT",
        truthStatus: "SUPPORTED",
        enforcement: "ALLOW",
        recommendedAction: "ALLOW",
        decisionConfidence: 0.9,
        keyReasons: ["The deterministic fixture has live supporting evidence."],
        aiVerificationStatus: "VERIFIED",
        aiExecutedModel: "gemini-fixture-model",
        aiVerification: {
          verdictSignal: "SUPPORTED",
          supportReasons: ["Fixture evidence supports the claim."],
          contradictionReasons: [],
          missingEvidence: [],
          uncertainty: "No additional uncertainty in this fixture.",
          citationsUsed: [],
          provider: "google",
          model: "gemini-fixture-model",
        },
      };
    },
  };
}

test("own backend publishes exactly four stages and deterministic Final Predict", async () => {
  const calls = { l4: 0 };
  const events = [];
  const orchestrator = new OwnBackendTrustOrchestrator({ services: servicesWithLiveEvidence(calls) });

  const result = await orchestrator.run({ type: "text", content: "A fixture claim." }, {
    requestId: "req_four_layer_fixture",
    onTransition: (transition) => events.push({ event: transition.event, stageId: transition.stageId }),
  });

  assert.equal(result.pipelineModel, "FOUR_LAYER");
  assert.equal(result.publicLayerCount, 4);
  assert.deepEqual(Object.keys(result.stages), ["l1", "l2", "l3", "l4"]);
  assert.deepEqual(Object.keys(result.layerResults), ["layer1", "layer2", "layer3", "layer4"]);
  assert.equal(Object.hasOwn(result.stages, "l5"), false);
  assert.equal(result.finalDecision.decisionAuthority, "FINAL_PREDICT_DETERMINISTIC");
  assert.equal(result.finalDecision.aiOverride, false);
  assert.equal(result.finalPredict.status, "READY");
  assert.equal(result.finalPredict.calls.finalPredict, 0);
  assert.equal(calls.l4, 1);
  assert.equal(calls.l2bOptions.useAIGateway, true);
  assert.equal(calls.l2bOptions.aiMode, "GEMINI_ONLY");
  assert.equal(result.finalPredict.independentSourceCount, 1);
  assert.equal(result.finalPredict.evidenceSufficiency, "SUFFICIENT");
  assert.ok(events.some((item) => item.event === "FINAL_PREDICT_READY"));
  assert.ok(events.some((item) => item.event === "PIPELINE_COMPLETED"));
  assert.equal(events.some((item) => item.stageId === "l5"), false);
  assert.equal(JSON.stringify(result).includes('"l5"'), false);
});

test("own backend does not substitute local corpus when canonical retrieval is unavailable", async () => {
  const retriever = {
    retrieverId: "tavily_fixture_unavailable",
    async search() {
      throw new Error("TAVILY_FIXTURE_UNAVAILABLE");
    },
    async fetch() {
      throw new Error("FETCH_MUST_NOT_RUN");
    },
  };

  const result = await Layer3EvidenceService.verify({
    claims: [{ claimId: "claim-1", rawText: "A claim that needs external evidence." }],
    options: { requestId: "req_tavily_unavailable_fixture", retriever, allowLocalFallback: false },
  });

  assert.equal(result.retrievalMode, "TAVILY_UNAVAILABLE");
  assert.equal(result.retrievalStatus, "UNAVAILABLE");
  assert.equal(result.externalEvidence, false);
  assert.deepEqual(result.sources, []);
  assert.deepEqual(result.evidence, []);
  assert.equal(result.metrics.providerIndependent, false);
  assert.ok(result.auditEvents.some((event) => event.type === "RETRIEVER_FAILURE"));
});
