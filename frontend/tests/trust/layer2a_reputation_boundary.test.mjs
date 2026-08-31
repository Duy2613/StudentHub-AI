import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RenderLayer2AProvider,
  normalizeLayer2AProviderPayload,
} from "../../src/lib/ai-trust/layer2a/RenderLayer2AProvider.js";
import { createLayer2AResult } from "../../src/lib/ai-trust/layer2a/types.js";

const TEST_TARGET = process.env.TRUST_ENGINE_TEST_TARGET || "https://example.invalid/resource";

function responseFor(payload, status = 200, contentType = "application/json") {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        if (name === "content-type") return contentType;
        if (name === "content-length") return String(encoded.byteLength);
        return null;
      },
    },
    arrayBuffer: async () => encoded.buffer,
  };
}

function providerWith(fetchImpl, overrides = {}) {
  return new RenderLayer2AProvider({
    env: { STUDENTHUB_LAYER2_BASE_URL: "https://provider.invalid" },
    fetchImpl,
    sleep: async () => {},
    random: () => 0,
    ...overrides,
  });
}

describe("Layer 2A reputation boundary", () => {
  it("returns UNKNOWN when the real adapter is not configured", async () => {
    let calls = 0;
    const provider = new RenderLayer2AProvider({
      env: {},
      fetchImpl: async () => { calls += 1; },
    });

    const result = await provider.check({ url: TEST_TARGET, requestId: "l2a-not-configured" });
    assert.equal(result.providerStatus, "NOT_CONFIGURED");
    assert.equal(result.finding, "UNKNOWN");
    assert.equal(result.securityClassification, "UNKNOWN");
    assert.equal(calls, 0);
  });

  it("keeps a provider no-match bounded and cacheable without calling it safe", async () => {
    let calls = 0;
    const provider = providerWith(async (_endpoint, request) => {
      calls += 1;
      const body = JSON.parse(request.body);
      assert.equal(body.type, "url");
      assert.equal(body.content, TEST_TARGET);
      return responseFor({
        verdict: "SAFE",
        confidence: 0.95,
        cacheTtlSeconds: 60,
        providers: [{ provider: "google_safe_browsing", success: true, verdict: "SAFE", confidence: 0.95 }],
      });
    });

    const first = await provider.check({ url: TEST_TARGET, requestId: "l2a-no-match-1" });
    const second = await provider.check({ url: TEST_TARGET, requestId: "l2a-no-match-2" });
    assert.equal(first.finding, "NO_KNOWN_THREAT");
    assert.equal(first.securityClassification, "NO_KNOWN_THREAT");
    assert.equal(first.provenance.noMatchIsSafetyProof, false);
    assert.equal(first.providerConfidence, 0.95);
    assert.equal(second.cacheMetadata.hit, true);
    assert.equal(calls, 1);
  });

  it("retains a dangerous nested result when the top-level response contradicts it", () => {
    const normalized = normalizeLayer2AProviderPayload({
      verdict: "SAFE",
      confidence: 0.95,
      providers: [
        { provider: "google_safe_browsing", success: true, verdict: "DANGEROUS", threatTypes: ["SOCIAL_ENGINEERING"] },
      ],
    });

    assert.equal(normalized.ok, true);
    assert.equal(normalized.finding, "THREAT_MATCH");
    assert.equal(normalized.providerStatus, "INVALID_RESPONSE");
    assert.equal(normalized.contractViolation, "PROVIDER_CONTRACT_VIOLATION");
  });

  it("maps a real threat response to THREAT_MATCH without inventing a score", async () => {
    const provider = providerWith(async () => responseFor({
      verdict: "DANGEROUS",
      providers: [{ provider: "google_safe_browsing", success: true, verdict: "DANGEROUS", threatTypes: ["MALWARE"] }],
    }));

    const result = await provider.check({ url: TEST_TARGET, requestId: "l2a-threat" });
    assert.equal(result.finding, "THREAT_MATCH");
    assert.deepEqual(result.threatTypes, ["MALWARE"]);
    assert.equal(result.providerConfidence, null);
  });

  it("fails closed on malformed responses and does not cache the failure", async () => {
    let calls = 0;
    const provider = providerWith(async () => {
      calls += 1;
      return responseFor({ verdict: "SAFE", providers: [] });
    });

    const first = await provider.check({ url: TEST_TARGET, requestId: "l2a-malformed-1" });
    const second = await provider.check({ url: TEST_TARGET, requestId: "l2a-malformed-2" });
    assert.equal(first.providerStatus, "INVALID_RESPONSE");
    assert.equal(first.finding, "UNKNOWN");
    assert.equal(second.cacheMetadata.hit, false);
    assert.equal(calls, 2);
  });

  it("uses one bounded retry, then opens a circuit without converting failure to no-match", async () => {
    let calls = 0;
    const provider = providerWith(async () => {
      calls += 1;
      const error = new Error("simulated network loss");
      throw error;
    });

    const first = await provider.check({ url: TEST_TARGET, requestId: "l2a-outage-1" });
    assert.equal(first.finding, "UNKNOWN");
    assert.equal(first.providerStatus, "UNAVAILABLE");
    assert.equal(calls, 2);

    await provider.check({ url: TEST_TARGET, requestId: "l2a-outage-2" });
    await provider.check({ url: TEST_TARGET, requestId: "l2a-outage-3" });
    const fourth = await provider.check({ url: TEST_TARGET, requestId: "l2a-outage-4" });
    assert.equal(fourth.providerStatus, "CIRCUIT_OPEN");
    assert.equal(fourth.finding, "UNKNOWN");
    assert.equal(calls, 6);
  });

  it("rejects SSRF targets before any provider call", async () => {
    let calls = 0;
    const provider = providerWith(async () => { calls += 1; return responseFor({}); });
    const result = await provider.check({ url: "http://127.0.0.1/private" });
    assert.equal(result.providerStatus, "INVALID_INPUT");
    assert.equal(result.finding, "UNKNOWN");
    assert.equal(calls, 0);
  });

  it("strips arbitrary fields from nested provider DTOs", () => {
    const result = createLayer2AResult({
      providerStatus: "SUCCESS",
      finding: "NO_KNOWN_THREAT",
      providerResults: [{
        provider: "bounded-fixture",
        success: true,
        verdict: "SAFE",
        confidence: 0.8,
        message: "bounded",
        threatTypes: [],
        secret: "must-not-cross-boundary",
      }],
    });

    assert.deepEqual(result.providerResults, [{
      provider: "bounded-fixture",
      success: true,
      verdict: "SAFE",
      confidence: 0.8,
      message: "bounded",
      threatTypes: [],
    }]);
    assert.equal(JSON.stringify(result).includes("must-not-cross-boundary"), false);
  });
});
