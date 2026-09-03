import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  InvestigationBudgetExceededError,
  createInvestigationBudget,
} from "../../src/lib/ai-trust/v5/investigationBudget.js";

describe("bounded investigation budget", () => {
  it("accounts for provider calls and fails closed at the configured limit", () => {
    const budget = createInvestigationBudget({ limits: { maxProviderCalls: 1 } });
    assert.equal(budget.tryConsume("providerCalls").allowed, true);
    const blocked = budget.tryConsume("providerCalls");
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.code, "MAX_PROVIDER_CALLS");
    assert.equal(blocked.snapshot.usage.providerCalls, 1);
  });

  it("bounds elapsed time and exposes safe usage snapshots", () => {
    let now = 1_000;
    const budget = createInvestigationBudget({ limits: { maxElapsedMs: 50 }, clock: () => now, startedAt: now });
    assert.equal(budget.tryConsume("results", 2).allowed, true);
    now += 51;
    const blocked = budget.tryConsume("results");
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.code, "MAX_ELAPSED_MS");
    assert.equal(blocked.snapshot.usage.results, 2);
  });

  it("provides a typed assertion for callers that cannot continue", () => {
    const budget = createInvestigationBudget({ limits: { maxAiTokens: 0 } });
    assert.throws(() => budget.assertCanConsume("aiTokens", 1), (error) => {
      assert.ok(error instanceof InvestigationBudgetExceededError);
      assert.equal(error.code, "MAX_AI_TOKENS");
      return true;
    });
  });
});
