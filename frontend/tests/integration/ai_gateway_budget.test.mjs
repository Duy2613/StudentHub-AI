import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AIGatewayService } from "../../src/lib/ai-gateway/AIGatewayService.js";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { IModelProvider } from "../../src/lib/ai-gateway/providers/IModelProvider.js";
import { AI_CAPABILITY, GATEWAY_ERROR_TYPE, PROVIDER_FAMILY } from "../../src/lib/ai-gateway/types.js";
import { createInvestigationBudget } from "../../src/lib/ai-trust/v5/investigationBudget.js";

class UsageProvider extends IModelProvider {
  constructor() {
    super(PROVIDER_FAMILY.OPENAI_COMPATIBLE);
    this.calls = 0;
  }

  isConfigured() {
    return true;
  }

  async generate() {
    this.calls += 1;
    return {
      text: "bounded result",
      usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
    };
  }
}

class TimeoutProvider extends IModelProvider {
  constructor() {
    super(PROVIDER_FAMILY.OPENAI_COMPATIBLE);
    this.calls = 0;
  }

  isConfigured() {
    return true;
  }

  async generate() {
    this.calls += 1;
    const error = new Error("fixture timeout");
    error.gatewayErrorType = GATEWAY_ERROR_TYPE.TIMEOUT;
    throw error;
  }
}

describe("AI Gateway investigation accounting", () => {
  it("records safe AI usage and relative cost while admitting a bounded call", async () => {
    const provider = new UsageProvider();
    const budget = createInvestigationBudget({ limits: { maxAiTokens: 10, maxEstimatedCostCents: 2 } });
    const router = new ModelRouter({ [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: provider });
    const result = await AIGatewayService.generateText({
      capability: AI_CAPABILITY.FAST_CLASSIFICATION,
      systemPrompt: "sys",
      userPrompt: "user",
      options: { router, budget, maxOutputTokens: 4 },
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.usage, { inputTokens: 2, outputTokens: 3, totalTokens: 5, source: "provider" });
    assert.equal(result.estimatedCostCents, 1);
    assert.equal(result.attempts[0].usage.totalTokens, 5);
    assert.equal(budget.snapshot().usage.aiCalls, 1);
    assert.equal(budget.snapshot().usage.aiTokens, 6);
    assert.equal(budget.snapshot().usage.estimatedCostCents, 1);
    assert.equal(provider.calls, 1);
  });

  it("refuses the next model attempt when the cost ceiling is exhausted", async () => {
    const provider = new TimeoutProvider();
    const budget = createInvestigationBudget({ limits: { maxEstimatedCostCents: 8 } });
    const router = new ModelRouter({ [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: provider });
    const result = await router.route({
      capability: AI_CAPABILITY.DEEP_REASONING,
      systemPrompt: "sys",
      userPrompt: "user",
      maxOutputTokens: 4,
      budget,
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorType, GATEWAY_ERROR_TYPE.BUDGET_EXCEEDED);
    assert.equal(provider.calls, 1);
    assert.equal(budget.snapshot().blockedBy, "MAX_ESTIMATED_COST_CENTS");
    assert.equal(budget.snapshot().usage.aiCalls, 1);
  });
});
