import assert from "node:assert/strict";
import test from "node:test";
import { TavilyRetriever } from "../../src/lib/ai-trust/layer3/retrieval/TavilyRetriever.js";
import { isNetworkGuardedRetriever } from "../../src/lib/ai-trust/layer3/retrieval/NetworkGuard.js";

function jsonResponse(value, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "" },
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(value)).buffer,
  };
}

function sourceFetcher() {
  const calls = [];
  return {
    calls,
    async fetch(url) {
      calls.push(url);
      return {
        status: 200,
        textContent: "Nguồn công khai đã được fetch qua boundary an toàn.",
        publishedAt: new Date().toISOString(),
        sourceType: "SEARCH_RETRIEVAL",
        providerStatus: "SUCCESS",
        liveEvidence: true,
        retrievalOutcome: "SUCCESS",
      };
    },
  };
}

test("Tavily accepts bounded public candidates, rejects SSRF candidates, and keeps fetch guarded", async () => {
  let apiCalls = 0;
  const fetcher = sourceFetcher();
  const retriever = new TavilyRetriever({
    env: { TAVILY_API_KEY: "fixture-tavily-secret" },
    sourceFetcher: fetcher,
    fetchImpl: async () => {
      apiCalls += 1;
      return jsonResponse({
        results: [
          { title: "Public source", url: "https://example.com/public", published_date: "2026-09-01" },
          { title: "Private target", url: "http://127.0.0.1/admin" },
          { title: "Duplicate", url: "https://example.com/public" },
        ],
      });
    },
  });

  assert.equal(isNetworkGuardedRetriever(retriever), true);
  const sources = await retriever.search([{ query: "support" }, { query: "contradiction" }]);
  assert.equal(apiCalls, 2);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].url, "https://example.com/public");
  assert.equal(retriever.getRuntimeDiagnostics().acceptedResults, 1);
  assert.equal(retriever.getRuntimeDiagnostics().rawResultCount, 6);
  assert.equal(retriever.getRuntimeDiagnostics().rejectedResults, 5);
  assert.deepEqual(retriever.getRuntimeDiagnostics().rejectionReasons.sort(), ["DUPLICATE_URL", "SSRF_RESTRICTED"]);

  const fetched = await retriever.fetch(sources[0].url);
  assert.equal(fetched.liveEvidence, true);
  assert.deepEqual(fetcher.calls, ["https://example.com/public"]);
  assert.equal(JSON.stringify(retriever.getRuntimeDiagnostics()).includes("fixture-tavily-secret"), false);
});

test("Tavily preserves candidates beyond one provider batch while keeping each request at 20", async () => {
  const payloads = [];
  const retriever = new TavilyRetriever({
    env: { TAVILY_API_KEY: "fixture-tavily-secret" },
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      payloads.push(body);
      const offset = payloads.length === 1 ? 0 : 20;
      return jsonResponse({
        results: Array.from({ length: 20 }, (_, index) => ({
          title: `Source ${offset + index + 1}`,
          url: `https://example.com/source-${offset + index + 1}`,
        })),
      });
    },
  });

  const sources = await retriever.search([{ query: "first" }, { query: "second" }]);
  assert.equal(sources.length, 40);
  assert.deepEqual(payloads.map((payload) => payload.max_results), [20, 20]);
  assert.equal(new Set(sources.map((source) => source.url)).size, 40);
  assert.equal(retriever.getRuntimeDiagnostics().acceptedResults, 40);
});

test("Tavily preserves typed rate-limit status and bounded call diagnostics", async () => {
  const retriever = new TavilyRetriever({
    env: { TAVILY_API_KEY: "fixture-tavily-secret" },
    fetchImpl: async () => jsonResponse({ error: "rate limited" }, 429),
  });

  await assert.rejects(
    retriever.search([{ query: "one" }]),
    (error) => error.providerStatus === "RATE_LIMITED" && error.httpStatus === 429,
  );
  const diagnostics = retriever.getRuntimeDiagnostics();
  assert.equal(diagnostics.callCount, 1);
  assert.deepEqual(diagnostics.httpStatuses, [429]);
  assert.equal(diagnostics.lastErrorCode, "TAVILY_HTTP_429");
});

test("Tavily does not call the network when the server key is absent", async () => {
  let apiCalls = 0;
  const retriever = new TavilyRetriever({
    env: {},
    fetchImpl: async () => {
      apiCalls += 1;
      return jsonResponse({ results: [] });
    },
  });

  await assert.rejects(
    retriever.search([{ query: "must not be sent" }]),
    (error) => error.providerStatus === "NOT_CONFIGURED",
  );
  assert.equal(apiCalls, 0);
  assert.equal(retriever.getRuntimeDiagnostics().callCount, 0);
});

test("Tavily rejects malformed result payloads as INVALID_RESPONSE", async () => {
  const retriever = new TavilyRetriever({
    env: { TAVILY_API_KEY: "fixture-tavily-secret" },
    fetchImpl: async () => jsonResponse({ answer: "not a result list" }),
  });

  await assert.rejects(
    retriever.search([{ query: "malformed" }]),
    (error) => error.providerStatus === "INVALID_RESPONSE",
  );
});

test("Tavily retries one transient upstream failure with bounded diagnostics", async () => {
  let apiCalls = 0;
  const retriever = new TavilyRetriever({
    env: { TAVILY_API_KEY: "fixture-tavily-secret" },
    sleepImpl: async () => {},
    randomImpl: () => 0,
    fetchImpl: async () => {
      apiCalls += 1;
      return apiCalls === 1
        ? jsonResponse({ error: "temporarily unavailable" }, 503)
        : jsonResponse({ results: [{ title: "Recovered source", url: "https://example.com/recovered" }] });
    },
  });

  const sources = await retriever.search([{ query: "retry" }], { timeoutMs: 1000 });
  const diagnostics = retriever.getRuntimeDiagnostics();
  assert.equal(sources.length, 1);
  assert.equal(apiCalls, 2);
  assert.equal(diagnostics.callCount, 2);
  assert.equal(diagnostics.retryCount, 1);
  assert.deepEqual(diagnostics.httpStatuses, [503, 200]);
  assert.equal(diagnostics.requestTrace[0].classification, "OTHER");
  assert.equal(diagnostics.requestTrace[1].classification, "NONE");
});

test("Tavily classifies a local abort without fabricating upstream HTTP 504", async () => {
  const retriever = new TavilyRetriever({
    env: { TAVILY_API_KEY: "fixture-tavily-secret" },
    sleepImpl: async () => {},
    fetchImpl: async (_url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      }, { once: true });
    }),
  });

  await assert.rejects(
    retriever.search([{ query: "slow" }], { timeoutMs: 500 }),
    (error) => error.code === "TAVILY_LOCAL_TIMEOUT" &&
      error.timeoutClassification === "LOCAL_ADAPTER_TIMEOUT" &&
      error.httpStatus === null,
  );
  const diagnostics = retriever.getRuntimeDiagnostics();
  assert.equal(diagnostics.callCount, 1);
  assert.equal(diagnostics.providerRetryExhausted, false);
  assert.equal(diagnostics.providerRetryable, false);
  assert.equal(diagnostics.lastTimeoutClassification, "LOCAL_ADAPTER_TIMEOUT");
  assert.equal(diagnostics.requestTrace[0].httpStatus, null);
  assert.equal(diagnostics.requestTrace[0].abortReason, "local-adapter-timeout");
});
