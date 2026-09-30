import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FriendBackendTrustOrchestrator } from "../../src/lib/ai-trust/FriendBackendTrustOrchestrator.js";
import { LegacyVerificationAdapter } from "../../src/lib/ai-trust/integrations/legacyVerification/LegacyVerificationAdapter.js";

function responseFor(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return {
    ok: true,
    status: 200,
    headers: {
      get(name) {
        if (name === "content-type") return "application/json";
        if (name === "content-length") return String(bytes.byteLength);
        return null;
      },
    },
    arrayBuffer: async () => bytes.buffer,
  };
}

describe("friend backend authoritative trust pipeline", () => {
  it("sends the PowerShell text contract and never replaces the friend's final verdict", async () => {
    const requests = [];
    const adapter = new LegacyVerificationAdapter({
      env: {
        STUDENTHUB_LEGACY_VERIFICATION_BASE_URL: "https://friend.example.test",
        STUDENTHUB_LEGACY_VERIFICATION_RESOLVE_DNS: "false",
      },
      resolveDns: false,
      fetchImpl: async (endpoint, init) => {
        requests.push({ endpoint, init });
        if (endpoint.endsWith("/layer2")) return responseFor({
          verdict: "UNKNOWN",
          confidence: 0,
          canContinueToLayer3: true,
          results: [{ provider: "Google Fact Check", verdict: "UNKNOWN", confidence: 0, reason: "No claim review." }],
        });
        if (endpoint.endsWith("/layer3")) return responseFor({ verdict: "UNKNOWN", confidence: 0.5, stop: false, canContinueToLayer4: true, reason: "Web research completed.", evidence: [], sources: [] });
        return responseFor({ verdict: "FAKE", confidence: 0.92, evidenceAgreement: 0.1, sourceQuality: 0.6, stop: false, canContinueToLayer4: true, mode: "user", reason: "Friend backend final verdict." , contradictoryEvidence: [], sources: [] });
      },
    });

    const result = await new FriendBackendTrustOrchestrator({ adapter }).run(
      { type: "text", content: "A bounded claim." },
      { requestId: "friend-authority-text" },
    );

    const l2Body = JSON.parse(requests[0].init.body);
    const l3Body = JSON.parse(requests[1].init.body);
    const l4Body = JSON.parse(requests[2].init.body);
    assert.deepEqual(Object.keys(l2Body).sort(), ["content", "type"]);
    assert.deepEqual(Object.keys(l3Body).sort(), ["content", "layer2", "type"]);
    assert.deepEqual(Object.keys(l4Body).sort(), ["content", "layer3", "mode", "type"]);
    assert.equal("layer2" in l4Body, false);
    assert.equal(result.friendBackend.sourceMode, "FRIEND_BACKEND");
    assert.equal(result.friendBackend.layers.layer2.results[0].provider, "Google Fact Check");
    assert.equal(result.layerResults.layer2.providers[0].provider, "Google Fact Check");
    assert.equal(result.friendBackend.layers.layer4.verdict, "FAKE");
    assert.equal(result.finalDecision.security, "FAKE");
    assert.equal(result.finalPredict.securityClassification, "FAKE");
    assert.equal(result.finalPredict.authoritativeComponent, "FRIEND_BACKEND");
    assert.equal(result.legacyResponse.layer4.verdict, "FAKE");
  });

  it("uses local Tavily only as Layer 3 evidence recovery and keeps friend L4 authoritative", async () => {
    const layer4Inputs = [];
    const friendLayer3 = {
      verdict: "UNKNOWN",
      confidence: 0,
      stop: false,
      canContinueToLayer4: true,
      reason: "Tavily request failed: HTTP 432",
      evidence: [],
      sources: [],
    };
    const adapter = {
      config: { baseUrl: "https://friend.example.test" },
      async verifyLayer2() {
        return { rawVerdict: "UNKNOWN", assessmentConfidence: 0, rawResponse: { verdict: "UNKNOWN", confidence: 0, results: [] } };
      },
      async verifyLayer3() {
        return {
          status: "COMPLETED",
          providerStatus: "SUCCESS",
          rawVerdict: "UNKNOWN",
          legacyIntegration: {
            status: "COMPLETED",
            providerStatus: "SUCCESS",
            rawVerdict: "UNKNOWN",
            reason: friendLayer3.reason,
            rawResponse: friendLayer3,
          },
        };
      },
      async verifyLayer4({ layer3Result }) {
        layer4Inputs.push(layer3Result?.legacyIntegration?.rawResponse);
        return {
          rawVerdict: "FAKE",
          assessmentConfidence: 0.92,
          rawResponse: { verdict: "FAKE", confidence: 0.92, stop: false, canContinueToLayer4: true, sources: [] },
        };
      },
    };
    const retriever = {
      isConfigured: () => true,
      lastSearchStatus: "SUCCESS",
      getRuntimeDiagnostics: () => ({ callCount: 1, queriesRequested: 1, queriesExecuted: 1, rawResultCount: 1, acceptedResults: 1, acceptedHostCount: 1, httpStatuses: [200] }),
    };
    const localEvidence = {
      status: "INSUFFICIENT_EVIDENCE",
      evidenceConfidence: 0.25,
      externalEvidence: false,
      sources: [{ sourceId: "local-source-1", url: "https://example.com/source", title: "Local Tavily source" }],
      evidence: [{ evidenceId: "local-evidence-1", sourceId: "local-source-1", sourceUrl: "https://example.com/source", sourceTitle: "Local Tavily source", excerpt: "A bounded evidence excerpt." }],
    };

    const result = await new FriendBackendTrustOrchestrator({
      adapter,
      tavilyFallbackOptions: {
        env: { TAVILY_API_KEY: "configured-for-test" },
        retriever,
        verifyEvidence: async () => localEvidence,
      },
    }).run({ type: "text", content: "A claim that needs a source." }, { requestId: "friend-tavily-fallback" });

    assert.equal(result.friendBackend.layers.layer3.reason, friendLayer3.reason);
    assert.equal(result.friendBackend.fallbacks.layer3.sourceMode, "FRIEND_BACKEND_WITH_LOCAL_TAVILY_FALLBACK");
    assert.equal(result.layerResults.layer3.providerStatus, "LOCAL_TAVILY_FALLBACK");
    assert.equal(result.layerResults.layer3.sources.length, 1);
    assert.equal(layer4Inputs[0].evidence.length, 1);
    assert.equal(result.friendBackend.layers.layer4.verdict, "FAKE");
    assert.equal(result.finalPredict.verdict, "FAKE");
    assert.equal(result.finalPredict.authoritativeComponent, "FRIEND_BACKEND");
  });

  it("fires the L1 handoff with the user's original Trust input", async () => {
    const adapter = {
      config: { baseUrl: "https://friend.example.test" },
      async verifyLayer2() {
        return { rawVerdict: "UNKNOWN", assessmentConfidence: 0, rawResponse: { verdict: "UNKNOWN", confidence: 0, results: [] } };
      },
      async verifyLayer3() {
        return { rawVerdict: "UNKNOWN", assessmentConfidence: 0.5, rawResponse: { verdict: "UNKNOWN", confidence: 0.5, evidence: [], sources: [] } };
      },
      async verifyLayer4() {
        return { rawVerdict: "FAKE", assessmentConfidence: 0.9, rawResponse: { verdict: "FAKE", confidence: 0.9, sources: [] } };
      },
    };
    const handoffs = [];
    const userText = "Nội dung người dùng gửi vào Trust Engine để expert xem lại.";
    await new FriendBackendTrustOrchestrator({ adapter }).run(
      { type: "text", content: userText },
      {
        requestId: "friend-expert-handoff",
        onL1ClaimReady: (handoff) => handoffs.push(handoff),
      },
    );

    assert.equal(handoffs.length, 1);
    assert.equal(handoffs[0].input.content, userText);
    assert.equal(handoffs[0].l1Result.status, "PASS");
  });
});
