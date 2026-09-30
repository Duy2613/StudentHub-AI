import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { resetTavilyRuntimeForTests, TavilyRetriever } from "../../src/lib/ai-trust/layer3/retrieval/TavilyRetriever.js";
import { isNetworkGuardedRetriever } from "../../src/lib/ai-trust/layer3/retrieval/NetworkGuard.js";

beforeEach(() => resetTavilyRuntimeForTests());

function tavilyEnv(overrides = {}) {
  return { TAVILY_API_KEY: "fixture-tavily-secret", TAVILY_MODE: "SMOKE", ...overrides };
}

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
    env: tavilyEnv(),
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
    env: tavilyEnv(),
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

test("Tavily applies entity-scoped domains and fuses candidates by provider relevance", async () => {
  const payloads = [];
  const retriever = new TavilyRetriever({
    env: tavilyEnv(),
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      payloads.push(body);
      return jsonResponse({ results: body.query === "entity scoped"
        ? [{ title: "Official source", url: "https://docs.github.com/pull-requests?utm_source=search#top", score: 0.72 }]
        : [
          { title: "High relevance duplicate", url: "https://docs.github.com/pull-requests?fbclid=tracking", score: 0.91 },
          { title: "Independent source", url: "https://example.org/relevant", score: 0.84 },
        ],
      });
    },
  });

  const sources = await retriever.search([
    { query: "entity scoped", includeDomains: ["docs.github.com", "https://bad.example", "docs.github.com"] },
    { query: "broad search" },
  ]);

  assert.deepEqual(payloads[0].include_domains, ["docs.github.com"]);
  assert.equal(payloads[0].include_domains_mode, "restrict");
  assert.equal("include_domains" in payloads[1], false);
  assert.equal(sources.length, 2);
  assert.equal(sources[0].url, "https://docs.github.com/pull-requests");
  assert.equal(sources[0].providerScore, 0.91);
  assert.equal(sources[1].url, "https://example.org/relevant");
  assert.equal(sources[1].providerScore, 0.84);
});

test("Tavily preserves typed rate-limit status and bounded call diagnostics", async () => {
  const retriever = new TavilyRetriever({
    env: tavilyEnv(),
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

test("Tavily classifies HTTP 432 as QUOTA_EXHAUSTED and opens a per-key circuit", async () => {
  const retriever = new TavilyRetriever({
    env: tavilyEnv(),
    fetchImpl: async () => jsonResponse({ detail: { error: "plan usage limit exceeded" } }, 432),
  });

  await assert.rejects(
    retriever.search([{ query: "quota boundary" }]),
    (error) => error.providerStatus === "QUOTA_EXHAUSTED" && error.httpStatus === 432 && error.retryable === false,
  );
  const diagnostics = retriever.getRuntimeDiagnostics();
  assert.equal(retriever.lastSearchStatus, "QUOTA_EXHAUSTED");
  assert.equal(diagnostics.lastErrorCode, "TAVILY_HTTP_432");
  assert.deepEqual(diagnostics.httpStatuses, [432]);
  assert.equal(diagnostics.providerAttempt.provider, "TAVILY");
  assert.equal(diagnostics.providerAttempt.status, "QUOTA_EXHAUSTED");
  assert.equal(diagnostics.providerAttempt.httpStatus, 432);
  assert.equal(diagnostics.providerAttempt.errorCategory, "PROVIDER_QUOTA");
  assert.equal(diagnostics.providerAttempt.retryable, false);
  assert.equal(diagnostics.circuit.state, "OPEN");

  await assert.rejects(
    retriever.search([{ query: "second query after quota" }]),
    (error) => error.providerStatus === "QUOTA_EXHAUSTED" && error.code === "TAVILY_QUOTA_CIRCUIT_OPEN",
  );
  assert.equal(retriever.getRuntimeDiagnostics().budget.callsAttempted, 1);
});

test("Tavily auth failure opens the same per-key circuit without retry", async () => {
  let apiCalls = 0;
  const retriever = new TavilyRetriever({
    env: tavilyEnv(),
    fetchImpl: async () => {
      apiCalls += 1;
      return jsonResponse({ error: "unauthorized" }, 401);
    },
  });

  await assert.rejects(
    retriever.search([{ query: "auth failure" }]),
    (error) => error.providerStatus === "AUTH_FAILED" && error.retryable === false,
  );
  await assert.rejects(
    retriever.search([{ query: "same key remains open" }]),
    (error) => error.providerStatus === "AUTH_FAILED" && error.code === "TAVILY_AUTH_CIRCUIT_OPEN",
  );
  assert.equal(apiCalls, 1);
  assert.equal(retriever.getRuntimeDiagnostics().circuit.state, "OPEN");
});

test("Tavily OFF mode does not call the network even when a server key exists", async () => {
  let apiCalls = 0;
  const retriever = new TavilyRetriever({
    env: tavilyEnv({ TAVILY_MODE: "OFF" }),
    fetchImpl: async () => {
      apiCalls += 1;
      return jsonResponse({ results: [] });
    },
  });

  await assert.rejects(
    retriever.search([{ query: "must remain off" }]),
    (error) => error.providerStatus === "DISABLED",
  );
  assert.equal(apiCalls, 0);
  assert.equal(retriever.getRuntimeDiagnostics().budget.callsAttempted, 0);
});

test("Tavily smoke mode with a zero call budget blocks before network access", async () => {
  let apiCalls = 0;
  const retriever = new TavilyRetriever({
    env: tavilyEnv({ TAVILY_MAX_CALLS_PER_RUN: "0" }),
    fetchImpl: async () => {
      apiCalls += 1;
      return jsonResponse({ results: [] });
    },
  });

  await assert.rejects(
    retriever.search([{ query: "budget zero" }]),
    (error) => error.providerStatus === "BUDGET_EXHAUSTED" && error.errorCategory === "CALL_BUDGET",
  );
  assert.equal(apiCalls, 0);
  assert.equal(retriever.getRuntimeDiagnostics().budget.callsAttempted, 0);
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
    env: tavilyEnv(),
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
    env: tavilyEnv(),
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
    env: tavilyEnv(),
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

test("Tavily enforces the smoke budget and reuses exact normalized queries", async () => {
  let apiCalls = 0;
  const retriever = new TavilyRetriever({
    env: tavilyEnv(),
    fetchImpl: async (_url, options) => {
      apiCalls += 1;
      const body = JSON.parse(options.body);
      return jsonResponse({ results: [{ title: body.query, url: `https://example.com/${apiCalls}` }] });
    },
  });

  const first = await retriever.search([{ query: "  NASA   Mars 2026 " }, { query: "nasa mars 2026" }]);
  const second = await retriever.search([
    { query: "distinct two" },
    { query: "distinct three" },
    { query: "fourth must be blocked" },
  ]);
  const diagnostics = retriever.getRuntimeDiagnostics();
  assert.equal(first.length, 1);
  assert.equal(second.length, 2);
  assert.equal(apiCalls, 3);
  assert.equal(diagnostics.budget.callsAttempted, 3);
  assert.equal(diagnostics.budget.callsSkippedByCache, 1);
  assert.equal(diagnostics.budget.callsBlockedByBudget, 1);
  assert.equal(diagnostics.providerAttempt.status, "PARTIAL");
  assert.equal(diagnostics.providerAttempt.errorCategory, "CALL_BUDGET");
  assert.match(diagnostics.budget.callRecords[0].queryHash, /^[a-f0-9]{64}$/);
  const serializedDiagnostics = JSON.stringify(diagnostics).toLowerCase();
  assert.equal(serializedDiagnostics.includes("fixture-tavily-secret"), false);
  assert.equal(serializedDiagnostics.includes("nasa"), false);
  assert.equal(serializedDiagnostics.includes("distinct"), false);
});

test("Tavily quota circuit is scoped to the selected credential without automatic key rotation", async () => {
  let blockedKeyCalls = 0;
  const exhausted = new TavilyRetriever({
    env: tavilyEnv(),
    fetchImpl: async () => {
      blockedKeyCalls += 1;
      return jsonResponse({ detail: { error: "usage limit" } }, 432);
    },
  });
  await assert.rejects(exhausted.search([{ query: "quota key" }]), (error) => error.providerStatus === "QUOTA_EXHAUSTED");

  let newKeyCalls = 0;
  const explicitlySelectedNewKey = new TavilyRetriever({
    env: tavilyEnv({ TAVILY_API_KEY: "separately-selected-fixture-key" }),
    fetchImpl: async () => {
      newKeyCalls += 1;
      return jsonResponse({ results: [] });
    },
  });
  await explicitlySelectedNewKey.search([{ query: "new selected key" }]);
  assert.equal(blockedKeyCalls, 1);
  assert.equal(newKeyCalls, 1);
});
