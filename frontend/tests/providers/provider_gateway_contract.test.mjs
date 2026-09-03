import test from "node:test";
import assert from "node:assert/strict";
import {
  ProviderGateway,
  PROVIDER_CAPABILITY,
  GATEWAY_MODE,
} from "../../src/lib/server/providers/ProviderGateway.js";
import { Redactor } from "../../src/lib/server/providers/Redactor.js";
import {
  CircuitBreaker,
  CIRCUIT_STATE,
} from "../../src/lib/server/providers/CircuitBreaker.js";
import { CostBudgetTracker } from "../../src/lib/server/providers/CostBudgetTracker.js";
import {
  ProviderError,
  ProviderTimeoutError,
  ProviderCancelledError,
  CircuitBreakerOpenError,
  BudgetExceededError,
} from "../../src/lib/server/providers/ProviderErrors.js";

test("PHASE 3 GATE 1: Provider contract returns canonical DTO", async () => {
  const gateway = new ProviderGateway();
  gateway.registerAdapter(PROVIDER_CAPABILITY.REPUTATION, {
    name: "mock-reputation-provider",
    execute: async (payload) => ({
      data: { score: 0.95, threats: [] },
      tokensUsed: 10,
    }),
    nativeFallback: async () => ({ score: 0.5, threats: ["UNKNOWN"] }),
  });

  const res = await gateway.execute(PROVIDER_CAPABILITY.REPUTATION, { url: "https://example.edu.vn" });
  assert.equal(res.success, true);
  assert.equal(res.capability, PROVIDER_CAPABILITY.REPUTATION);
  assert.equal(res.provider, "mock-reputation-provider");
  assert.equal(res.degraded, false);
  assert.equal(res.data.score, 0.95);
  assert.ok(typeof res.latencyMs === "number");
});

test("PHASE 3 GATE 2: Timeout handling produces degraded response without crashing", async () => {
  const gateway = new ProviderGateway({ defaultTimeoutMs: 50, maxRetries: 0 });
  gateway.registerAdapter(PROVIDER_CAPABILITY.SEARCH, {
    name: "slow-search-provider",
    execute: async () => new Promise((resolve) => setTimeout(resolve, 200)),
    nativeFallback: async () => ({ results: [], source: "NATIVE_CACHE" }),
  });

  const res = await gateway.execute(PROVIDER_CAPABILITY.SEARCH, { query: "tuition" }, { timeoutMs: 50 });
  assert.equal(res.success, true);
  assert.equal(res.mode, GATEWAY_MODE.DEGRADED);
  assert.equal(res.degraded, true);
  assert.equal(res.data.source, "NATIVE_CACHE");
  assert.ok(res.degradationReason.includes("timed out"));
});

test("PHASE 3 GATE 3: Cancellation via AbortSignal throws ProviderCancelledError", async () => {
  const gateway = new ProviderGateway();
  gateway.registerAdapter(PROVIDER_CAPABILITY.AI, {
    name: "mock-ai-provider",
    execute: async () => ({ text: "ok" }),
  });

  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    async () => gateway.execute(PROVIDER_CAPABILITY.AI, {}, { signal: controller.signal }),
    (err) => err instanceof ProviderCancelledError
  );
});

test("PHASE 3 GATE 4: Retry bounds: Retries exactly maxRetries before failing over", async () => {
  let attempts = 0;
  const gateway = new ProviderGateway({ maxRetries: 2, defaultTimeoutMs: 1000 });
  gateway.registerAdapter(PROVIDER_CAPABILITY.REPUTATION, {
    name: "flaky-provider",
    execute: async () => {
      attempts += 1;
      throw new Error("503 Service Unavailable");
    },
    nativeFallback: async () => ({ status: "DEGRADED_HEURISTIC" }),
  });

  const res = await gateway.execute(PROVIDER_CAPABILITY.REPUTATION, {});
  assert.equal(attempts, 3, "Should execute initial attempt + 2 retries = 3 attempts total");
  assert.equal(res.degraded, true);
  assert.equal(res.data.status, "DEGRADED_HEURISTIC");
});

test("PHASE 3 GATE 5: Circuit breaker trips after threshold and fast-fails", async () => {
  let executedCount = 0;
  const cb = new CircuitBreaker({ provider: "test-svc", failureThreshold: 3, resetTimeoutMs: 10000 });

  const failOperation = () => {
    cb.assertAvailable();
    executedCount += 1;
    cb.recordFailure();
  };

  // 3 operations executed and failed
  failOperation();
  failOperation();
  failOperation();
  assert.equal(cb.getState(), CIRCUIT_STATE.OPEN);

  // 4th call: Rejected immediately by circuit breaker without executing operation
  assert.throws(() => cb.assertAvailable(), (err) => err instanceof CircuitBreakerOpenError);
  assert.equal(executedCount, 3, "No 4th operation execution when circuit is OPEN");
});

test("PHASE 3 GATE 6: Redaction sanitizes tokens, API keys, and sensitive headers", () => {
  const raw = {
    apiKey: "AIzaSyD-1234567890abcdefghijklmnopqrst",
    authorization: "Bearer secret_session_token_123456",
    nested: {
      password: "SuperSecretPassword!",
      normalField: "safe content",
      groqToken: "gsk_1234567890123456789012",
    },
  };

  const sanitized = Redactor.redact(raw);
  assert.equal(sanitized.apiKey, "[REDACTED]");
  assert.equal(sanitized.authorization, "[REDACTED]");
  assert.equal(sanitized.nested.password, "[REDACTED]");
  assert.equal(sanitized.nested.normalField, "safe content");
  assert.equal(sanitized.nested.groqToken, "[REDACTED]");
});

test("PHASE 3 GATE 7: Native authority preserved on complete provider outage", async () => {
  const gateway = new ProviderGateway({ maxRetries: 0 });
  gateway.registerAdapter(PROVIDER_CAPABILITY.REPUTATION, {
    name: "down-provider",
    execute: async () => { throw new Error("ECONNREFUSED"); },
    nativeFallback: async (payload) => ({
      finding: "UNVERIFIED_SOURCE",
      confidence: 0.5,
      authority: "NATIVE_RULE_ENGINE",
    }),
  });

  const res = await gateway.execute(PROVIDER_CAPABILITY.REPUTATION, { domain: "suspicious.com" });
  assert.equal(res.degraded, true);
  assert.equal(res.data.authority, "NATIVE_RULE_ENGINE");
  // Verification that downstream policy engine receives explicit degraded finding, not false positive
  assert.equal(res.data.finding, "UNVERIFIED_SOURCE");
});
