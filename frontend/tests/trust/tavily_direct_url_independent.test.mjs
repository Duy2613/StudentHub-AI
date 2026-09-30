import assert from "node:assert/strict";
import test from "node:test";
import { Layer3EvidenceService } from "../../src/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { resetTavilyRuntimeForTests, TavilyRetriever } from "../../src/lib/ai-trust/layer3/retrieval/TavilyRetriever.js";

test("StudentHub direct URL retrieval still runs with Tavily explicitly OFF", async () => {
  resetTavilyRuntimeForTests();
  let tavilyCalls = 0;
  const directFetches = [];
  const retriever = new TavilyRetriever({
    env: { TAVILY_API_KEY: "test-only-key", TAVILY_MODE: "OFF" },
    fetchImpl: async () => {
      tavilyCalls += 1;
      return { ok: true, status: 200, json: async () => ({ results: [] }) };
    },
    sourceFetcher: {
      async fetch(url) {
        directFetches.push(url);
        return {
          status: 200,
          textContent: "TEST_ONLY recorded public page content for the direct URL contract.",
          liveEvidence: false,
          providerStatus: "TEST_ONLY",
          retrievalOutcome: "TEST_ONLY",
          sourceType: "USER_SUPPLIED",
        };
      },
    },
  });

  const result = await Layer3EvidenceService.verify({
    input: { type: "url", content: "https://example.com/public-article" },
    options: { requestId: "req_direct_url_tavily_off", retriever, allowLocalFallback: false, maxRetrievalQueries: 1 },
  });

  assert.equal(tavilyCalls, 0);
  assert.deepEqual(directFetches, ["https://example.com/public-article"]);
  assert.equal(result.retrievalStatus, "DISABLED");
  assert.equal(result.externalEvidence, false);
  assert.ok(result.sources.some((source) => source.url === "https://example.com/public-article"));
  assert.ok(result.limitations.some((item) => /factual claim|verdict claim-specific/i.test(item)));
  assert.doesNotMatch(result.limitations.join(" "), /Tavily.*tìm kiếm tự do/i);
});
