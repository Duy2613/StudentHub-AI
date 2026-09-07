import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TrustOrchestrator } from "../../src/lib/ai-trust/TrustOrchestrator.js";

const INPUT = {
  type: "text",
  content: "Thông báo học tập bình thường từ nhà trường.",
};

function createAdapter({ layer2, layer3, layer4 } = {}) {
  const calls = [];
  return {
    calls,
    get isConfigured() {
      return true;
    },
    async verifyLayer2(args) {
      calls.push({ layer: "l2", args });
      return layer2;
    },
    async verifyLayer3(args) {
      calls.push({ layer: "l3", args });
      return layer3;
    },
    async verifyLayer4(args) {
      calls.push({ layer: "l4", args });
      return layer4;
    },
  };
}

function layer2Safe() {
  return {
    layer: "2A",
    provider: "google-safe-browsing",
    providerStatus: "SUCCESS",
    finding: "NO_KNOWN_THREAT",
    rawVerdict: "SAFE",
    providerConfidence: 0.98,
    threatTypes: [],
    message: "No known match in the provider response.",
  };
}

function layer2Dangerous() {
  return {
    layer: "2A",
    provider: "google-safe-browsing",
    providerStatus: "SUCCESS",
    finding: "THREAT_MATCH",
    rawVerdict: "DANGEROUS",
    providerConfidence: 0.99,
    threatTypes: ["MALWARE"],
    message: "Known malicious target.",
  };
}

function layer3Supported({ canContinueToLayer4 = true } = {}) {
  return {
    status: "VERIFIED",
    providerStatus: "SUCCESS",
    retrievalStatus: "SUCCESS",
    retrievalMode: "TAVILY",
    evidenceConfidence: 0.9,
    sources: [{ sourceId: "source-1", title: "Official university portal", url: "https://university.example/notice" }],
    evidence: [{ evidenceId: "evidence-1", sourceId: "source-1", excerpt: "The notice is published by the university." }],
    legacyIntegration: {
      status: "VERIFIED",
      providerStatus: "SUCCESS",
      rawVerdict: "TRUE",
      legacyAssessmentConfidence: 0.9,
      reason: "Independent source supports the claim.",
      stop: false,
      canContinueToLayer4,
    },
  };
}

function layer3Contradicted() {
  return {
    status: "CONTRADICTED",
    providerStatus: "SUCCESS",
    retrievalStatus: "SUCCESS",
    retrievalMode: "TAVILY",
    evidenceConfidence: 0.86,
    sources: [{ sourceId: "source-2", title: "Official university portal", url: "https://university.example/notice" }],
    evidence: [{ evidenceId: "evidence-2", sourceId: "source-2", excerpt: "The official portal contradicts the submitted claim." }],
    legacyIntegration: {
      status: "CONTRADICTED",
      providerStatus: "SUCCESS",
      rawVerdict: "FALSE",
      legacyAssessmentConfidence: 0.86,
      reason: "The official source contradicts the claim.",
      stop: true,
      canContinueToLayer4: false,
    },
  };
}

function layer3Unavailable() {
  return {
    status: "UNAVAILABLE",
    providerStatus: "UNAVAILABLE",
    retrievalStatus: "UNAVAILABLE",
    sources: [],
    evidence: [],
    legacyIntegration: {
      status: "UNAVAILABLE",
      providerStatus: "UNAVAILABLE",
      rawVerdict: null,
      reason: "Tavily is unavailable.",
      stop: false,
      canContinueToLayer4: true,
    },
  };
}

function layer4Supported() {
  return {
    status: "VERIFIED",
    providerStatus: "SUCCESS",
    providerId: "friend_backend_layer4",
    rawVerdict: "TRUE",
    assessmentConfidence: 0.92,
    evidenceAgreement: 0.94,
    sourceQuality: 0.91,
    stop: true,
    canContinueToLayer4: false,
    mode: "user",
    geminiModel: "gemini-2.5-flash",
    groqModel: null,
    reason: "Independent synthesis supports the claim.",
    sources: [{ sourceId: "l4-source-1", title: "Independent research source", url: "https://independent.example/notice" }],
    contradictoryEvidence: [],
  };
}

describe("TrustOrchestrator Friend Backend sequential contract", () => {
  it("hard-stops after a determinate dangerous Layer 2 result", async () => {
    const adapter = createAdapter({ layer2: layer2Dangerous() });
    const result = await new TrustOrchestrator({ friendBackendAdapter: adapter }).run(INPUT, { requestId: "seq-danger" });

    assert.deepEqual(adapter.calls.map(({ layer }) => layer), ["l2"]);
    assert.equal(result.pipelineStatus, "COMPLETED");
    assert.equal(result.stages.l3.operationStatus, "SKIPPED");
    assert.equal(result.stages.l4.operationStatus, "SKIPPED");
    assert.equal(result.finalDecision.security, "MALICIOUS");
    assert.equal(result.finalDecision.truth, "CONTRADICTED");
    assert.equal(result.finalDecision.action, "BLOCK");
  });

  it("does not run Layer 4 when Layer 3 explicitly stops continuation", async () => {
    const layer3 = layer3Contradicted();
    const adapter = createAdapter({ layer2: layer2Safe(), layer3 });
    const result = await new TrustOrchestrator({ friendBackendAdapter: adapter }).run(INPUT, { requestId: "seq-l3-stop" });

    assert.deepEqual(adapter.calls.map(({ layer }) => layer), ["l2", "l3"]);
    assert.equal(result.stages.l3.operationStatus, "COMPLETED");
    assert.equal(result.stages.l4.operationStatus, "SKIPPED");
    assert.equal(result.finalDecision.security, "SUSPICIOUS");
    assert.equal(result.finalDecision.truth, "CONTRADICTED");
    assert.equal(result.finalDecision.action, "WARN");
  });

  it("keeps the pipeline partial and blocks Layer 4 on an unavailable Layer 3 provider", async () => {
    const adapter = createAdapter({ layer2: layer2Safe(), layer3: layer3Unavailable() });
    const result = await new TrustOrchestrator({ friendBackendAdapter: adapter }).run(INPUT, { requestId: "seq-l3-unavailable" });

    assert.deepEqual(adapter.calls.map(({ layer }) => layer), ["l2", "l3"]);
    assert.equal(result.pipelineStatus, "PARTIAL");
    assert.equal(result.stages.l3.operationStatus, "PARTIAL");
    assert.equal(result.stages.l4.operationStatus, "SKIPPED");
    assert.equal(result.finalDecision.security, "UNKNOWN");
    assert.equal(result.finalDecision.truth, "INSUFFICIENT_EVIDENCE");
    assert.equal(result.finalDecision.action, "REVIEW");
  });

  it("passes the exact Layer 3 response into Layer 4 and preserves independent synthesis", async () => {
    const layer3 = layer3Supported();
    const layer4 = layer4Supported();
    const adapter = createAdapter({ layer2: layer2Safe(), layer3, layer4 });
    const result = await new TrustOrchestrator({ friendBackendAdapter: adapter }).run(INPUT, { requestId: "seq-all-layers" });

    assert.deepEqual(adapter.calls.map(({ layer }) => layer), ["l2", "l3", "l4"]);
    assert.deepEqual(adapter.calls.find(({ layer }) => layer === "l4").args.layer3Result, layer3);
    assert.equal(result.pipelineStatus, "COMPLETED");
    assert.equal(result.stages.l2a.operationStatus, "COMPLETED");
    assert.equal(result.stages.l3.operationStatus, "COMPLETED");
    assert.equal(result.stages.l4.operationStatus, "COMPLETED");
    assert.equal(result.finalDecision.security, "SAFE");
    assert.equal(result.finalDecision.truth, "VERIFIED_TRUE");
    assert.equal(result.finalDecision.action, "ALLOW_WITH_CAUTION");
    assert.equal(result.assurance.status, "INCONCLUSIVE");
    assert.equal(result.layerResults.layer4.geminiModel, "gemini-2.5-flash");
  });
});
