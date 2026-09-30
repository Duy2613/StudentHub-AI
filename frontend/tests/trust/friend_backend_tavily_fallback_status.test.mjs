import assert from "node:assert/strict";
import test from "node:test";
import { tryFriendBackendTavilyFallback } from "../../src/lib/ai-trust/integrations/legacyVerification/FriendBackendTavilyFallback.js";

test("Tavily fallback reports plan quota exhaustion instead of wrapper success", async () => {
  const result = await tryFriendBackendTavilyFallback({
    input: { type: "text", content: "A claim that needs external evidence." },
    friendLayer3Result: {
      legacyIntegration: {
        providerStatus: "SUCCESS",
        rawResponse: { verdict: "UNKNOWN", reason: "no evidence", sources: [], evidence: [] },
      },
    },
    env: { TAVILY_API_KEY: "configured-for-test" },
    retriever: {
      isConfigured: () => true,
      lastSearchStatus: "QUOTA_EXHAUSTED",
      getRuntimeDiagnostics: () => ({
        callCount: 5,
        queriesRequested: 5,
        queriesExecuted: 5,
        rawResultCount: 0,
        acceptedResults: 0,
        acceptedHostCount: 0,
        httpStatuses: [432, 432, 432, 432, 432],
        lastErrorCode: "TAVILY_HTTP_432",
        providerAttempt: {
          provider: "TAVILY",
          status: "QUOTA_EXHAUSTED",
          httpStatus: 432,
          resultCount: 0,
          durationMs: 8,
          errorCategory: "PROVIDER_QUOTA",
          retryable: false,
        },
      }),
    },
    verifyEvidence: async () => ({
      status: "UNAVAILABLE",
      evidenceConfidence: 0,
      sources: [],
      evidence: [],
    }),
  });

  assert.equal(result.attempted, undefined);
  assert.equal(result.applied, false);
  assert.equal(result.normalized, null);
  assert.equal(result.metadata.attempted, true);
  assert.equal(result.metadata.applied, false);
  assert.equal(result.metadata.status, "QUOTA_EXHAUSTED");
  assert.equal(result.metadata.diagnostics.providerStatus, "QUOTA_EXHAUSTED");
  assert.equal(result.metadata.diagnostics.providerAttempt.httpStatus, 432);
  assert.equal(result.metadata.sourceCount, 0);
});

test("Tavily wrapper success with zero usable sources is not a successful fallback", async () => {
  const result = await tryFriendBackendTavilyFallback({
    input: { type: "text", content: "A claim without retrieved sources." },
    friendLayer3Result: {
      legacyIntegration: {
        providerStatus: "SUCCESS",
        rawResponse: { verdict: "UNKNOWN", reason: "no evidence", sources: [], evidence: [] },
      },
    },
    env: { TAVILY_API_KEY: "fixture-key", TAVILY_MODE: "SMOKE" },
    retriever: {
      isConfigured: () => true,
      lastSearchStatus: "SUCCESS",
      getRuntimeDiagnostics: () => ({
        callCount: 1,
        rawResultCount: 0,
        acceptedResults: 0,
        httpStatuses: [200],
        providerAttempt: { provider: "TAVILY", status: "SUCCESS", httpStatus: 200, resultCount: 0, retryable: false },
      }),
    },
    verifyEvidence: async () => ({ status: "COMPLETED", evidenceConfidence: null, sources: [], evidence: [] }),
  });

  assert.equal(result.applied, false);
  assert.equal(result.normalized, null);
  assert.equal(result.metadata.attempted, true);
  assert.equal(result.metadata.status, "NO_RESULTS");
  assert.equal(result.metadata.sourceCount, 0);
  assert.equal(result.metadata.evidenceCount, 0);
});
