import assert from "node:assert/strict";
import test from "node:test";

import { TrustOrchestrator } from "../../src/lib/ai-trust/TrustOrchestrator.js";
import { TrustPersistenceMapper } from "../../src/lib/ai-trust/v5/TrustPersistenceMapper.js";

function richFixtureServices() {
  return {
    l1: async () => ({
      status: "PASS",
      reasons: ["Local screen completed."],
      signals: [{ code: "INPUT_NORMALIZED", details: "Input normalized." }],
      metrics: { detectorsExecuted: ["InputNormalizer", "DecisionEngine"], signalCount: 1 },
    }),
    l2a: async () => ({
      provider: "studenthub-threat-fixture",
      providerStatus: "SUCCESS",
      finding: "NO_KNOWN_THREAT",
      providerResults: [{ provider: "studenthub-threat-fixture", status: "SUCCESS", finding: "NO_KNOWN_THREAT", success: true }],
    }),
    l2b: async () => ({
      status: "PASS",
      classification: "INFORMATIVE",
      confidence: 0.74,
      claims: [{ claimId: "claim-rich-1", rawText: "A bounded fixture claim" }],
      entities: [{ type: "ORGANIZATION", value: "StudentHub" }],
      contextSignals: [],
      details: { confidenceKind: "SEMANTIC_CANDIDATE_SCORE_NON_PROBABILISTIC", providerId: "studenthub-semantic-fixture", providerStatus: "SUCCESS" },
      verificationPackage: { status: "REQUIRED", candidateOnly: true, verificationTasks: [] },
    }),
    l2c: async () => ({
      classification: "NO_MATERIAL_STUDENT_RISK",
      modelStatus: "BASELINE_RULE_MODEL",
      riskSignals: [],
      verificationPackage: { status: "NOT_REQUIRED", candidateOnly: true, verificationTasks: [] },
    }),
    l3: async () => ({
      status: "SUPPORTED",
      executionStatus: "COMPLETED",
      retrievalExecuted: true,
      retrievalStatus: "SUCCESS",
      retrievalMode: "EXTERNAL_RETRIEVER",
      externalEvidence: true,
      claims: [{ claimId: "claim-rich-1", rawText: "A bounded fixture claim" }],
      sources: [
        { sourceId: "safe-source", url: "https://example.com/official", title: "Safe source", liveEvidence: true, retrievalOutcome: "SUCCESS", authorityScore: 0.9, providerStatus: "SUCCESS" },
        { sourceId: "unsafe-source", url: "javascript:alert(1)", title: "Unsafe source", liveEvidence: true, retrievalOutcome: "SUCCESS", authorityScore: 1 },
      ],
      evidence: [{ evidenceId: "evidence-rich-1", sourceId: "safe-source", sourceTitle: "Safe source", sourceUrl: "https://example.com/official", claimId: "claim-rich-1", excerpt: "Supporting fixture evidence", liveEvidence: true, retrievalOutcome: "SUCCESS", providerStatus: "SUCCESS" }],
      conflicts: [],
      verificationCompleteness: 0.9,
      evidenceConfidence: 0.88,
      crossSourceAgreement: { agreementScore: 0.9, unresolved: false },
      metrics: { retrievalProvider: "tavily_fixture", providerCallCount: 1, sourcesRetrievedCount: 2, evidenceItemsCount: 1, finalValidatedSourceCount: 1 },
    }),
    l4: async () => ({
      securityClassification: "NO_KNOWN_THREAT",
      truthStatus: "SUPPORTED",
      enforcement: "ALLOW_WITH_CAUTION",
      recommendedAction: "ALLOW_WITH_CAUTION",
      decisionConfidence: 0.86,
      keyReasons: ["Live fixture evidence supports the bounded claim."],
      evidenceRefs: ["evidence-rich-1"],
      limitations: ["Fixture only."],
      aiVerificationStatus: "VERIFIED",
      aiProviderStatus: "SUCCESS",
      aiOperationStatus: "COMPLETED",
      aiRequestedPrimaryModel: "gemini-3.8-flash",
      aiExecutedModel: "gemini-3.8-flash",
      aiVerification: { provider: "google", model: "gemini-3.8-flash", verdictSignal: "SUPPORTED", supportReasons: ["Evidence supports the claim."], citationsUsed: [] },
      policyPrecedence: ["HARD_NEGATIVE", "EVIDENCE_BOUND_TRUTH", "DEFAULT_REVIEW"],
      auditTrail: { ruleVersion: "trust-policy-fixture", fusedEvidenceCount: 1, evidenceBound: true },
    }),
  };
}

test("canonical Trust does not construct friend Render adapter by default", () => {
  const orchestrator = new TrustOrchestrator();
  assert.equal(orchestrator.legacyVerificationEnabled, false);
  assert.equal(orchestrator.legacyVerificationAdapter, null);
});

test("rich response contract exposes bounded stage provenance and deterministic final predict", async () => {
  const transitions = [];
  const result = await new TrustOrchestrator({ services: richFixtureServices() }).run(
    { type: "text", content: "A bounded fixture claim." },
    { requestId: "rich-contract-fixture", onTransition: (transition) => transitions.push(transition) },
  );

  assert.equal(result.responseContractVersion, "trust.rich.v1");
  assert.deepEqual(Object.keys(result.stages), ["l1", "l2", "l3", "l4"]);
  for (const stage of Object.values(result.stages)) {
    for (const field of ["stageId", "stageName", "operationStatus", "verdict", "finding", "confidenceKind", "confidenceExplanation", "summary", "providers", "sources", "evidence", "metrics", "limitations", "startedAt", "completedAt", "latencyMs", "requestId"]) {
      assert.ok(Object.hasOwn(stage, field), `${stage.stageId} missing ${field}`);
    }
  }
  assert.equal(result.stages.l1.confidence, null);
  assert.equal(result.stages.l1.confidenceKind, "NOT_DISCLOSED");
  assert.match(result.stages.l1.confidenceExplanation, /không công bố|không phải xác suất/i);
  assert.equal(result.stages.l3.confidenceKind, "EVIDENCE_CONFIDENCE_NON_PROBABILISTIC");
  assert.equal(result.stages.l3.sourceQuality, 0.9);
  assert.equal(result.stages.l3.crossSourceAgreement.agreementScore, 0.9);
  assert.equal(result.stages.l3.evidence[0].sourceTitle, "Safe source");
  assert.equal(result.stages.l3.sources.some((source) => source.url === "javascript:alert(1)"), false);
  assert.equal(result.layerResults.layer3.sources.some((source) => source.url === "javascript:alert(1)"), false);
  assert.equal(result.layerResults.layer4.ai.provider, "google");
  assert.equal(result.layerResults.layer4.ai.executedModel, "gemini-3.8-flash");
  assert.equal(result.layerResults.layer4.policy.authoritative, true);
  assert.equal(result.layerResults.layer4.policy.ruleVersion, "trust-policy-fixture");
  assert.deepEqual(result.layerResults.layer4.policy.precedence, ["HARD_NEGATIVE", "EVIDENCE_BOUND_TRUTH", "DEFAULT_REVIEW"]);
  assert.equal(result.finalPredict.authoritativeComponent, "STUDENTHUB_DETERMINISTIC_FINAL_PREDICT");
  assert.equal(result.finalPredict.confidence, result.finalPredict.decisionConfidence);
  assert.equal(result.finalPredict.confidenceKind, "DETERMINISTIC_POLICY_SCORE_NON_PROBABILISTIC");
  assert.equal(result.finalPredict.topEvidence[0].url, "https://example.com/official");
  assert.equal(result.finalDecision.aiOverride, false);

  assert.ok(transitions.some((item) => item.event === "STAGE_PROGRESS"));
  const completed = transitions.find((item) => item.event === "STAGE_COMPLETED" && item.stageId === "l3");
  assert.equal(completed.stage.stageId, "l3");
  assert.equal(completed.stage.operationStatus, "COMPLETED");
  const final = transitions.find((item) => item.event === "FINAL_PREDICT_READY");
  assert.equal(final.stage.authoritativeComponent, "STUDENTHUB_DETERMINISTIC_FINAL_PREDICT");
});

test("persistence keeps a bounded rich stage summary for four-layer runs", async () => {
  const pipeline = await new TrustOrchestrator({ services: richFixtureServices() }).run(
    { type: "text", content: "A bounded fixture claim." },
    { requestId: "rich-persistence-fixture" },
  );
  const dto = TrustPersistenceMapper.mapPipelineToDurableRecord({
    pipelineResult: pipeline,
    input: { type: "text", content: "A bounded fixture claim." },
    principal: { subjectId: "11111111-1111-4111-8111-111111111111" },
    requestId: "rich-persistence-fixture",
  });

  assert.equal(dto.stageRuns.length, 4);
  assert.equal(dto.stageRuns.find((item) => item.stageId === "l3").summary.confidenceKind, "EVIDENCE_CONFIDENCE_NON_PROBABILISTIC");
  assert.equal(Object.hasOwn(dto.stageRuns[0].summary, "rawMetadata"), false);
  assert.ok(dto.stageRuns.find((item) => item.stageId === "l3").summary.topSourceRefs.includes("safe-source"));
});
