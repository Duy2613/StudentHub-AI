import assert from "node:assert/strict";
import test from "node:test";

import { OwnBackendTrustOrchestrator } from "../../src/lib/ai-trust/OwnBackendTrustOrchestrator.js";
import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";
import { Layer3EvidenceService } from "../../src/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { markTrustedLayer2AResult } from "../../src/lib/ai-trust/layer2a/TrustBoundary.js";
import { markTrustedLayer3Result } from "../../src/lib/ai-trust/layer3/TrustBoundary.js";

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

function servicesWithPartialLayer2() {
  return {
    l1: async () => ({
      status: "PASS",
      reasons: [],
      signals: [],
      metrics: { detectorsExecuted: ["InputNormalizer", "DecisionEngine"] },
    }),
    l2a: async () => ({
      provider: "fixture-threat-provider",
      providerStatus: "NOT_APPLICABLE",
      finding: "NOT_APPLICABLE",
      message: "Threat lookup is not applicable to this text fixture.",
      providerResults: [],
    }),
    l2b: async () => ({
      status: "UNKNOWN",
      classification: "UNKNOWN",
      confidence: 0,
      semanticSummary: "Semantic provider was unavailable; no semantic finding was established.",
      contextSignals: [],
      claims: [],
      entities: [],
      details: { providerStatus: "UNAVAILABLE", providerIndependent: true },
      metrics: { providerStatus: "UNAVAILABLE", modelUsed: "fixture-semantic-unavailable" },
    }),
    l2c: async () => ({
      classification: "UNKNOWN_STUDENT_RISK",
      modelStatus: "UNAVAILABLE",
      riskSignals: [],
      explanation: "Student context model was unavailable; no domain risk finding was established.",
    }),
    l3: async () => ({
      status: "UNAVAILABLE",
      retrievalStatus: "UNAVAILABLE",
      retrievalMode: "TAVILY_UNAVAILABLE",
      externalEvidence: false,
      sources: [],
      evidence: [],
      conflicts: [],
      limitations: ["Fixture retrieval outage."],
      metrics: { providerCallCount: 0 },
    }),
    l4: async () => ({
      securityClassification: "UNKNOWN",
      truthStatus: "INSUFFICIENT_EVIDENCE",
      enforcement: "REVIEW",
      recommendedAction: "REVIEW",
      decisionConfidence: 0,
      keyReasons: ["No provider returned enough information to clear the input."],
      aiVerificationStatus: "FALLBACK_DETERMINISTIC",
      aiVerification: { verdictSignal: "UNCERTAIN", citationsUsed: [] },
    }),
  };
}

function servicesWithGeminiValidatedSafeUrl() {
  return {
    l1: async () => ({ status: "PASS", reasons: [], signals: [], metrics: {} }),
    l2a: async () => ({
      provider: "fixture-threat-provider",
      providerStatus: "NOT_APPLICABLE",
      finding: "NOT_APPLICABLE",
      message: "Threat lookup is not applicable to this URL fixture.",
      providerResults: [],
    }),
    l2b: async () => ({
      status: "PASS",
      classification: "BENIGN",
      confidence: 0.8,
      semanticSummary: "No material semantic risk in the fixture URL.",
      contextSignals: [],
      claims: [],
      entities: [],
      details: { providerStatus: "SUCCESS", providerIndependent: true },
      metrics: { providerStatus: "SUCCESS", modelUsed: "fixture-semantic" },
    }),
    l2c: async () => ({
      classification: "NO_MATERIAL_STUDENT_RISK",
      modelStatus: "BASELINE_RULE_MODEL",
      riskSignals: [],
      explanation: "No material domain risk in the fixture URL.",
    }),
    l3: async () => ({
      status: "INSUFFICIENT",
      retrievalStatus: "SUCCESS",
      retrievalMode: "EXTERNAL_RETRIEVER",
      externalEvidence: false,
      sources: [],
      evidence: [],
      conflicts: [],
      limitations: ["No claim-specific Layer 3 evidence was available in this fixture."],
      metrics: { providerCallCount: 1 },
    }),
    l4: async () => ({
      securityClassification: "UNKNOWN",
      truthStatus: "INSUFFICIENT_EVIDENCE",
      enforcement: "REVIEW",
      recommendedAction: "REVIEW",
      decisionConfidence: 0.9,
      keyReasons: ["Gemini reviewed the public URL and returned a validated citation."],
      aiVerificationStatus: "VERIFIED",
      aiExecutedModel: "gemini-fixture-model",
      aiVerification: {
        verdictSignal: "SUPPORTS",
        supportReasons: ["The validated public URL is consistent with the safe-target decision."],
        contradictionReasons: [],
        missingEvidence: [],
        uncertainty: "The URL is reachable, but reachability does not prove every factual claim.",
        citationsUsed: [{ id: "fixture-zalo", url: "https://zalo.me/fixture", validationStatus: "REACHABLE" }],
        citationValidation: {
          checkedCount: 1,
          acceptedCount: 1,
          rejectedCount: 0,
          allLinksValidated: true,
        },
        provider: "google",
        model: "gemini-fixture-model",
      },
    }),
  };
}

function servicesWithGeminiValidatedClaimEvidence() {
  const services = servicesWithGeminiValidatedSafeUrl();
  services.l3 = async () => ({
    status: "SUPPORTED",
    retrievalStatus: "SUCCESS",
    retrievalMode: "EXTERNAL_RETRIEVER",
    externalEvidence: true,
    sources: [{
      sourceId: "fixture-zalo",
      url: "https://zalo.me/fixture",
      title: "Fixture public source",
      publisher: "Fixture publisher",
      domain: "zalo.me",
      liveEvidence: true,
      retrievalOutcome: "SUCCESS",
      providerStatus: "SUCCESS",
      authorityScore: 0.8,
    }],
    evidence: [{
      evidenceId: "fixture-zalo-evidence",
      sourceId: "fixture-zalo",
      claimId: "fixture-claim-1",
      sourceUrl: "https://zalo.me/fixture",
      evidenceScope: "claim_specific",
      liveEvidence: true,
      retrievalOutcome: "SUCCESS",
      excerpt: "The fixture source contains claim-specific supporting context.",
    }],
    conflicts: [],
    limitations: [],
    crossSourceAgreement: { agreementScore: 0.8, unresolved: false },
    verificationCompleteness: 0.8,
    evidenceConfidence: 0.8,
    metrics: { providerCallCount: 1, retrievalStatus: "SUCCESS" },
  });
  return services;
}

function servicesWithReputationValidatedSafeUrl() {
  return {
    l1: async () => ({ status: "SUSPICIOUS", reasons: ["Fixture URL heuristic."], signals: [], metrics: {} }),
    l2a: async () => markTrustedLayer2AResult({
      provider: "fixture-reputation-aggregator",
      providerStatus: "SUCCESS",
      finding: "NO_KNOWN_THREAT",
      securityClassification: "NO_KNOWN_THREAT",
      providerResults: [
        { provider: "Google Safe Browsing", success: true, verdict: "SAFE" },
        { provider: "Firefox Safe Browsing", success: true, verdict: "SAFE" },
      ],
      provenance: { noMatchIsSafetyProof: false },
    }),
    l2b: async () => ({
      status: "PASS",
      classification: "BENIGN",
      confidence: 0.8,
      semanticSummary: "No material semantic risk in the fixture URL.",
      contextSignals: [],
      claims: [],
      entities: [],
      details: { providerStatus: "SUCCESS", providerIndependent: true },
    }),
    l2c: async () => ({
      classification: "NO_MATERIAL_STUDENT_RISK",
      modelStatus: "BASELINE_RULE_MODEL",
      riskSignals: [],
      explanation: "No material domain risk in the fixture URL.",
    }),
    l3: async () => markTrustedLayer3Result({
      status: "NOT_APPLICABLE",
      retrievalStatus: "SUCCESS",
      retrievalMode: "EXTERNAL_RETRIEVER",
      externalEvidence: true,
      sources: [{
        sourceId: "fixture-chatgpt",
        url: "https://chatgpt.com/",
        sourceType: "USER_SUPPLIED",
        providerStatus: "SUCCESS",
        liveEvidence: true,
        sourceFingerprint: "sha256-fixture-chatgpt",
        retrievalOutcome: "SUCCESS",
        httpStatus: 200,
        sourceScope: "direct_input",
      }],
      evidence: [],
      conflicts: [],
      verificationCompleteness: 0,
      metrics: { retrievalStatus: "SUCCESS", providerCallCount: 1 },
    }),
    l4: async () => ({
      securityClassification: "SUSPICIOUS",
      truthStatus: "NOT_APPLICABLE",
      enforcement: "WARN",
      recommendedAction: "WARN",
      riskAssessment: { level: "MEDIUM", confidence: 0.45, primaryVectors: ["local_or_semantic_suspicion"] },
      decisionConfidence: 0.45,
      keyReasons: ["Soft URL heuristic only."],
      aiVerificationStatus: "FALLBACK_DETERMINISTIC",
      aiVerification: { verdictSignal: "UNCERTAIN", citationsUsed: [] },
    }),
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

test("own backend labels Layer 2 provider outage as partial, not suspicious", async () => {
  const orchestrator = new OwnBackendTrustOrchestrator({ services: servicesWithPartialLayer2() });

  const result = await orchestrator.run({ type: "text", content: "A neutral fixture input." }, {
    requestId: "req_layer2_partial_fixture",
  });

  assert.equal(result.stages.l2.finding, "PARTIAL");
  assert.equal(result.stages.l2.operationStatus, "PARTIAL");
  assert.equal(result.stages.l2.severity, "MEDIUM");
  assert.notEqual(result.stages.l2.finding, "SEMANTIC_SUSPICIOUS");
  assert.equal(result.finalPredict.securityClassification, "UNKNOWN");
  assert.equal(result.finalPredict.recommendedAction, "REVIEW");
  assert.equal(result.finalPredict.securityEvidenceStatus, "INSUFFICIENT");
});

test("own backend allows a claimless direct URL after L3 live validation despite an operational L2A partial", async () => {
  const services = servicesWithPartialLayer2();
  services.l2a = async () => ({
    provider: "fixture-threat-provider",
    providerStatus: "UNAVAILABLE",
    finding: "UNKNOWN",
    message: "One threat provider is temporarily unavailable.",
    providerResults: [],
  });
  services.l3 = async () => markTrustedLayer3Result({
    status: "NOT_APPLICABLE",
    retrievalStatus: "SUCCESS",
    retrievalMode: "EXTERNAL_RETRIEVER",
    externalEvidence: true,
    sources: [{
      sourceId: "src_direct_input_chatgpt",
      url: "https://chatgpt.com/",
      sourceScope: "direct_input",
      sourceType: "USER_SUPPLIED",
      providerStatus: "SUCCESS",
      liveEvidence: true,
      sourceFingerprint: "sha256-chatgpt-fixture",
      retrievalOutcome: "SUCCESS",
      httpStatus: 200,
    }],
    evidence: [],
    conflicts: [],
    claims: [],
    verificationCompleteness: 0,
    metrics: { retrievalStatus: "SUCCESS", providerCallCount: 1 },
  });
  services.l4 = async (params) => Layer4TrustService.evaluate({
    ...params,
    options: { ...params.options, useAIGateway: false },
  });

  const result = await new OwnBackendTrustOrchestrator({ services }).run({
    type: "url",
    content: "https://chatgpt.com/",
  }, { requestId: "req_claimless_direct_url_partial_l2a" });

  assert.equal(result.stages.l2.finding, "PARTIAL");
  assert.equal(result.stages.l3.operationStatus, "COMPLETED");
  assert.equal(result.stages.l4.operationStatus, "COMPLETED");
  assert.equal(result.layerResults.layer4.securityClassification, "SAFE");
  assert.equal(result.layerResults.layer4.enforcement, "ALLOW_WITH_CAUTION");
  assert.equal(result.finalPredict.securityClassification, "SAFE");
  assert.equal(result.finalPredict.recommendedAction, "ALLOW_WITH_CAUTION");
  assert.equal(result.finalPredict.truthStatus, "NOT_APPLICABLE");
  assert.equal(result.finalPredict.securityEvidenceStatus, "LAYER4_POLICY");
});

test("own backend completes L2 when semantic gateway fails but deterministic fallback is valid", async () => {
  const orchestrator = new OwnBackendTrustOrchestrator({
    services: {
      l1: async () => ({ status: "PASS", reasons: [], signals: [], metrics: {} }),
      l2a: async () => ({ providerStatus: "NOT_APPLICABLE", finding: "NOT_APPLICABLE", providerResults: [] }),
      l2b: async () => ({
        status: "PASS",
        classification: "BENIGN",
        confidence: 0.5,
        semanticSummary: "Deterministic baseline completed.",
        contextSignals: [],
        claims: [],
        entities: [],
        details: {
          providerStatus: "NETWORK_ERROR",
          upstreamProviderStatus: "NETWORK_ERROR",
          deterministicFallbackAvailable: true,
        },
        metrics: {
          providerStatus: "NETWORK_ERROR",
          deterministicFallbackAvailable: true,
        },
      }),
      l2c: async () => ({ classification: "NO_MATERIAL_STUDENT_RISK", modelStatus: "BASELINE_RULE_MODEL", riskSignals: [] }),
      l3: async () => ({ status: "INSUFFICIENT_EVIDENCE", retrievalStatus: "UNAVAILABLE", externalEvidence: false, sources: [], evidence: [], claims: [], conflicts: [] }),
      l4: async () => ({
        securityClassification: "UNKNOWN",
        truthStatus: "NOT_APPLICABLE",
        enforcement: "REVIEW",
        recommendedAction: "REVIEW",
        decisionConfidence: 0,
        riskAssessment: { level: "LOW", primaryVectors: ["threat_intelligence_unavailable"] },
        aiVerification: { verdictSignal: "UNCERTAIN", citationsUsed: [] },
      }),
    },
  });

  const result = await orchestrator.run({ type: "text", content: "ordinary input" }, { requestId: "req_l2_gateway_fallback" });

  assert.equal(result.stages.l2.operationStatus, "COMPLETED");
  assert.equal(result.stages.l2.finding, "NO_KNOWN_THREAT");
  assert.equal(result.stages.l2.providers.some((item) => item.status === "NETWORK_ERROR"), true);
});

test("L2C advisory outage does not make the completed semantic/threat composite partial", async () => {
  const orchestrator = new OwnBackendTrustOrchestrator({
    services: {
      l1: async () => ({ status: "PASS", reasons: [], signals: [], metrics: {} }),
      l2a: async () => ({ providerStatus: "NOT_APPLICABLE", finding: "NOT_APPLICABLE", providerResults: [] }),
      l2b: async () => ({ status: "PASS", classification: "BENIGN", semanticSummary: "Baseline completed.", contextSignals: [], claims: [], entities: [], details: { providerStatus: "LOCAL_DETERMINISTIC" }, metrics: { providerStatus: "LOCAL_DETERMINISTIC" } }),
      l2c: async () => ({ classification: "UNKNOWN_STUDENT_RISK", modelStatus: "UNAVAILABLE", riskSignals: [] }),
      l3: async () => ({ status: "INSUFFICIENT_EVIDENCE", retrievalStatus: "UNAVAILABLE", externalEvidence: false, sources: [], evidence: [], claims: [], conflicts: [] }),
      l4: async () => ({ securityClassification: "UNKNOWN", truthStatus: "NOT_APPLICABLE", enforcement: "REVIEW", recommendedAction: "REVIEW", decisionConfidence: 0, riskAssessment: { level: "LOW", primaryVectors: ["threat_intelligence_unavailable"] }, aiVerification: { verdictSignal: "UNCERTAIN", citationsUsed: [] } }),
    },
  });

  const result = await orchestrator.run({ type: "text", content: "ordinary input" }, { requestId: "req_l2c_advisory_outage" });

  assert.equal(result.stages.l2.operationStatus, "COMPLETED");
  assert.equal(result.stages.l2.finding, "NO_KNOWN_THREAT");
  assert.equal(result.stages.l2.providers.some((item) => item.status === "UNAVAILABLE"), true);
});

test("Final Predict consumes verified Gemini URL evidence for a cautious safe-target decision", async () => {
  const orchestrator = new OwnBackendTrustOrchestrator({ services: servicesWithGeminiValidatedSafeUrl() });

  const result = await orchestrator.run({
    type: "url",
    content: "https://zalo.me/fixture",
    metadata: { url: "https://zalo.me/fixture" },
  }, { requestId: "req_gemini_validated_safe_target" });

  assert.equal(result.finalPredict.securityClassification, "NO_KNOWN_THREAT");
  assert.equal(result.finalPredict.recommendedAction, "ALLOW_WITH_CAUTION");
  assert.equal(result.finalPredict.securityEvidenceStatus, "GEMINI_VALIDATED");
  assert.equal(result.finalPredict.geminiVerdictSignal, "SUPPORTS");
  assert.equal(result.finalPredict.geminiCitationCount, 1);
  assert.equal(result.finalPredict.geminiCitationsValidated, true);
  assert.equal(result.finalPredict.truthStatus, "INSUFFICIENT_EVIDENCE");
  assert.equal(result.finalPredict.evidenceSufficiency, "INSUFFICIENT");
  assert.ok(result.finalPredict.sources.some((source) => source.url === "https://zalo.me/fixture"));
});

test("Final Predict uses multi-provider Layer 2A clearance plus a live Layer 3 URL to clear a soft warning", async () => {
  const orchestrator = new OwnBackendTrustOrchestrator({ services: servicesWithReputationValidatedSafeUrl() });

  const result = await orchestrator.run({
    type: "url",
    content: "https://chatgpt.com/",
    metadata: { url: "https://chatgpt.com/" },
  }, { requestId: "req_l2a_l3_safe_target" });

  assert.equal(result.finalPredict.securityClassification, "SAFE");
  assert.equal(result.finalPredict.recommendedAction, "ALLOW");
  assert.equal(result.finalPredict.securityEvidenceStatus, "L2_REPUTATION_L3_LIVE");
  assert.equal(result.finalPredict.securityRisk, "LOW");
  assert.equal(result.finalPredict.validatedSecuritySourceCount, 1);
  assert.equal(result.finalDecision.security, "SAFE");
  assert.equal(result.finalDecision.action, "ALLOW");
});

test("Final Predict lets validated Gemini evidence refine an unresolved truth status only when Layer 3 is sufficient", async () => {
  const orchestrator = new OwnBackendTrustOrchestrator({ services: servicesWithGeminiValidatedClaimEvidence() });

  const result = await orchestrator.run({
    type: "text",
    content: "A fixture claim with independently retrieved evidence.",
  }, { requestId: "req_gemini_truth_refinement" });

  assert.equal(result.finalPredict.truthStatus, "SUPPORTED");
  assert.equal(result.finalPredict.truthVerdict, "SUPPORTED");
  assert.equal(result.finalPredict.truthAssessment, "SUPPORTED");
  assert.equal(result.finalPredict.evidenceSufficiency, "SUFFICIENT");
  assert.equal(result.finalPredict.geminiVerdictSignal, "SUPPORTS");
});

test("Final Predict never downgrades a Layer 1 hard block because Gemini cites a URL", async () => {
  const services = servicesWithGeminiValidatedSafeUrl();
  services.l1 = async () => ({
    status: "BLOCK",
    reasons: ["Fixture hard block."],
    signals: [{ type: "LOCAL_BLOCK", severity: "critical" }],
    metrics: {},
  });
  const orchestrator = new OwnBackendTrustOrchestrator({ services });

  const result = await orchestrator.run({
    type: "url",
    content: "https://zalo.me/fixture",
    metadata: { url: "https://zalo.me/fixture" },
  }, { requestId: "req_gemini_cannot_downgrade_l1" });

  assert.equal(result.finalPredict.securityClassification, "MALICIOUS");
  assert.equal(result.finalPredict.recommendedAction, "BLOCK");
  assert.notEqual(result.finalPredict.securityEvidenceStatus, "GEMINI_VALIDATED");
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
