import assert from "node:assert/strict";
import test from "node:test";
import { Layer3EvidenceService } from "../../src/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";
import { AIGatewayReasoningProvider } from "../../src/lib/ai-trust/layer4/providers/AIGatewayReasoningProvider.js";
import { markNetworkGuardedRetriever } from "../../src/lib/ai-trust/layer3/retrieval/NetworkGuard.js";

function liveFixture() {
  return markNetworkGuardedRetriever({
    retrieverId: "live_multimodal_fixture",
    async search() { return []; },
    async fetch(url) {
      return {
        status: 200,
        finalUrl: url,
        textContent: "Public page fetched for multimodal URL provenance.",
        liveEvidence: true,
        providerStatus: "SUCCESS",
        retrievalOutcome: "SUCCESS",
      };
    },
  });
}

test("L3 completes image OCR URL retrieval with direct multimodal provenance", async () => {
  const result = await Layer3EvidenceService.verify({
    input: {
      type: "image",
      content: "OCR: https://example.invalid/image-captured-link",
      metadata: { inputKind: "IMAGE", extractionAuthority: "CLIENT_OCR_HINT" },
    },
    claims: [],
    candidateSources: [],
    options: { retriever: liveFixture(), requestId: "l3-image-completion" },
  });

  assert.equal(result.executionStatus, "COMPLETED");
  assert.equal(result.retrievalExecuted, true);
  assert.equal(result.status, "NOT_APPLICABLE");
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].retrievalOrigin, "DIRECT_INPUT");
  assert.equal(result.sources[0].sourceScope, "multimodal_extracted_url");
  assert.equal(result.sources[0].httpStatus, 200);
});

test("L3 completes QR payload retrieval with direct URL provenance", async () => {
  const result = await Layer3EvidenceService.verify({
    input: {
      type: "qr",
      content: "https://example.invalid/qr-captured-link",
      metadata: {
        inputKind: "QR",
        qrContent: "https://example.invalid/qr-captured-link",
        qrIntake: { status: "PASS", securityStatus: "PASS", normalizedValue: "https://example.invalid/qr-captured-link" },
      },
    },
    claims: [],
    options: { retriever: liveFixture(), requestId: "l3-qr-completion" },
  });

  assert.equal(result.executionStatus, "COMPLETED");
  assert.equal(result.retrievalExecuted, true);
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].sourceScope, "multimodal_extracted_url");
  assert.equal(result.sources[0].liveEvidence, true);
});

test("L3 returns a completed provider-failure envelope instead of disappearing", async () => {
  const result = await Layer3EvidenceService.verify({
    claims: [{ claimId: "provider-loss-claim", rawText: "A claim requiring external evidence." }],
    options: {
      retriever: {
        retrieverId: "multimodal_provider_failure_fixture",
        networkGuarded: true,
        async search() { throw new Error("fixture retriever unavailable"); },
        async fetch() { throw new Error("fetch must not run"); },
      },
      allowLocalFallback: false,
      requestId: "l3-provider-failure-completion",
    },
  });

  assert.equal(result.executionStatus, "COMPLETED");
  assert.equal(result.retrievalExecuted, true);
  assert.equal(result.retrievalStatus, "UNAVAILABLE");
  assert.notEqual(result.status, "VERIFIED");
  assert.ok(result.auditEvents.some((event) => event.type === "RETRIEVER_FAILURE"));
});

test("L4 always returns deterministic result after bounded model chain fallback", async () => {
  const calls = [];
  const provider = new AIGatewayReasoningProvider({
    gateway: {
      async generateStructured(request) {
        calls.push(request);
        return {
          ok: false,
          errorType: "HTTP_ERROR",
          httpStatus: 401,
          errorMessage: "fixture provider unavailable",
          attempts: [
            { model: "gemini-3.8-flash", result: "AUTH_FAILED", attemptNumber: 1 },
            { model: "gemini-3.7-flash", result: "AUTH_FAILED", attemptNumber: 2 },
          ],
          totalLatencyMs: 12,
        };
      },
    },
  });
  const result = await Layer4TrustService.evaluate({
    layer1Result: { status: "PASS", signals: [] },
    layer2Result: { status: "UNKNOWN", claims: [], contextSignals: [] },
    layer2AResult: { providerStatus: "NOT_APPLICABLE", finding: "NOT_APPLICABLE" },
    layer3Result: { status: "NOT_APPLICABLE", sources: [], evidence: [], verificationCompleteness: 0 },
    options: {
      provider,
      allowQaExtended: true,
      inputParts: [{ type: "image", mime_type: "image/png", data: "AA==" }],
      requestId: "l4-fallback-completion",
    },
  });

  assert.equal(calls.length, 2);
  assert.ok(calls.every((call) => call.inputParts?.[0]?.type === "image"));
  assert.equal(result.executionStatus, "COMPLETED_WITH_FALLBACK");
  assert.equal(result.aiVerificationStatus, "FALLBACK_DETERMINISTIC");
  assert.equal(result.aiOperationStatus, "COMPLETED");
  assert.equal(result.aiFallbackUsed, true);
  assert.equal(result.aiExecutedModel, "deterministic_trust_policy");
  assert.equal(result.enforcement, "REVIEW");
});
