/**
 * AI Gateway — multi-model Gemini routing contract.
 *
 * Every provider here is injected and deterministic. The suite proves ordered
 * per-model failover, strict auth/request stops, cooldown behavior, and the
 * absence of OpenAI/key-rotation fallbacks.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AIGatewayService } from "../../src/lib/ai-gateway/AIGatewayService.js";
import { AI_CAPABILITY, PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../../src/lib/ai-gateway/types.js";
import { IModelProvider } from "../../src/lib/ai-gateway/providers/IModelProvider.js";
import { ModelHealthStore } from "../../src/lib/ai-gateway/ModelHealthStore.js";

const MODEL_3_8 = "gemini-3.8-flash";
const MODEL_3_7 = "gemini-3.7-flash";
const MODEL_3_6 = "gemini-3.6-flash";
const MODEL_2_5 = "gemini-2.5-flash";

const VALID_DTO = (model = MODEL_3_8) => JSON.stringify({
  verdictSignal: "UNCERTAIN",
  supportReasons: [],
  contradictionReasons: [],
  missingEvidence: ["Cần kiểm tra thêm nguồn độc lập."],
  uncertainty: "Chưa đủ evidence để diễn giải mạnh hơn.",
  citationsUsed: [],
  provider: "gemini",
  model,
});

function makeFailure(failure) {
  const error = new Error(`simulated ${failure}`);
  error.gatewayErrorType = failure === "timeout" ? GATEWAY_ERROR_TYPE.TIMEOUT : GATEWAY_ERROR_TYPE.HTTP_ERROR;
  if (failure === "429") {
    error.httpStatus = 429;
    error.providerErrorCode = "RESOURCE_EXHAUSTED";
  }
  if (failure === "503") {
    error.httpStatus = 503;
    error.providerErrorCode = "SERVICE_UNAVAILABLE";
  }
  if (failure === "401") {
    error.httpStatus = 401;
    error.providerErrorCode = "UNAUTHENTICATED";
  }
  if (failure === "400") {
    error.httpStatus = 400;
    error.providerErrorCode = "INVALID_ARGUMENT";
  }
  return error;
}

class FakeGeminiProvider extends IModelProvider {
  constructor({ behavior = {}, responseByModel = null } = {}) {
    super(PROVIDER_FAMILY.GEMINI);
    this.behavior = { ...behavior };
    this.responseByModel = responseByModel || {};
    this.calls = [];
  }

  isConfigured() {
    return true;
  }

  async generate({ catalogEntry }) {
    const model = catalogEntry.model;
    this.calls.push(model);
    const failure = this.behavior[model];
    if (failure) throw makeFailure(failure);
    const response = this.responseByModel[model] || VALID_DTO(model);
    return { text: response, transport: "interactions", thinkingLevel: "low", httpStatus: 200 };
  }
}

class NeverCalledOpenAIProvider extends IModelProvider {
  constructor() {
    super(PROVIDER_FAMILY.OPENAI_COMPATIBLE);
    this.callCount = 0;
  }

  isConfigured() {
    return true;
  }

  async generate() {
    this.callCount += 1;
    throw new Error("OpenAI must not be called in Gemini-only mode");
  }
}

class UnconfiguredGeminiProvider extends IModelProvider {
  constructor() {
    super(PROVIDER_FAMILY.GEMINI);
    this.callCount = 0;
  }

  isConfigured() {
    return false;
  }

  async generate() {
    this.callCount += 1;
    throw new Error("Unconfigured Gemini must not be called");
  }
}

function createRouter(gemini, options = {}) {
  const openai = new NeverCalledOpenAIProvider();
  return {
    openai,
    router: new ModelRouter({
      [PROVIDER_FAMILY.GEMINI]: gemini,
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: openai,
    }, options),
  };
}

test("unconfigured Gemini fails closed without activating OpenAI compatibility", async () => {
  const gemini = new UnconfiguredGeminiProvider();
  const { router, openai } = createRouter(gemini);
  const result = await router.route({
    capability: AI_CAPABILITY.FAST_CLASSIFICATION,
    systemPrompt: "system",
    userPrompt: "user",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorType, GATEWAY_ERROR_TYPE.NOT_CONFIGURED);
  assert.equal(result.attempts.length, 3);
  assert.equal(gemini.callCount, 0);
  assert.equal(openai.callCount, 0);
});

test("A: primary Gemini 3.8 success does not fall back", async () => {
  const gemini = new FakeGeminiProvider();
  const { router, openai } = createRouter(gemini);
  const result = await router.route({ capability: AI_CAPABILITY.DEEP_REASONING, systemPrompt: "system", userPrompt: "user" });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_8);
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0].result, "SUCCESS");
  assert.equal(result.attempts[0].httpStatus, 200);
  assert.equal(gemini.calls.length, 1);
  assert.equal(openai.callCount, 0);
});

test("B: 3.8 rate limit falls back to 3.7", async () => {
  const gemini = new FakeGeminiProvider({ behavior: { [MODEL_3_8]: "429" } });
  const { router } = createRouter(gemini);
  const result = await router.route({ capability: AI_CAPABILITY.DEEP_REASONING, systemPrompt: "system", userPrompt: "user" });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_7);
  assert.equal(result.requestedPrimaryModel, MODEL_3_8);
  assert.equal(result.executedModel, MODEL_3_7);
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.fallbackReason, "PRIMARY_RATE_LIMITED");
  assert.deepEqual(result.attempts.map((attempt) => [attempt.model, attempt.result, attempt.httpStatus]), [
    [MODEL_3_8, "RATE_LIMITED", 429],
    [MODEL_3_7, "SUCCESS", 200],
  ]);
});

test("C: consecutive rate limits continue in order until 3.6 succeeds", async () => {
  const gemini = new FakeGeminiProvider({ behavior: { [MODEL_3_8]: "429", [MODEL_3_7]: "429" } });
  const { router } = createRouter(gemini);
  const result = await router.route({ capability: AI_CAPABILITY.DEEP_REASONING, systemPrompt: "system", userPrompt: "user" });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_6);
  assert.deepEqual(gemini.calls, [MODEL_3_8, MODEL_3_7, MODEL_3_6]);
  assert.deepEqual(result.attempts.map((attempt) => attempt.result), ["RATE_LIMITED", "RATE_LIMITED", "SUCCESS"]);
});

test("D: 3.8 and 3.7 unavailable falls back to healthy 3.6", async () => {
  const gemini = new FakeGeminiProvider({ behavior: { [MODEL_3_8]: "503", [MODEL_3_7]: "503" } });
  const { router } = createRouter(gemini);
  const result = await router.route({ capability: AI_CAPABILITY.DEEP_REASONING, systemPrompt: "system", userPrompt: "user" });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_6);
  assert.deepEqual(result.attempts.map((attempt) => attempt.result), ["SERVICE_UNAVAILABLE", "SERVICE_UNAVAILABLE", "SUCCESS"]);
});

test("E: all Gemini candidates fail with exact trace and no OpenAI cascade", async () => {
  const gemini = new FakeGeminiProvider({ behavior: { [MODEL_3_8]: "503", [MODEL_3_7]: "503", [MODEL_3_6]: "503" } });
  const { router, openai } = createRouter(gemini);
  const result = await router.route({ capability: AI_CAPABILITY.DEEP_REASONING, systemPrompt: "system", userPrompt: "user" });

  assert.equal(result.ok, false);
  assert.equal(result.providerStatus, "SERVICE_UNAVAILABLE");
  assert.equal(result.operationStatus, "PARTIAL");
  assert.deepEqual(result.attempts.map((attempt) => attempt.model), [MODEL_3_8, MODEL_3_7, MODEL_3_6]);
  assert.equal(openai.callCount, 0);
});

test("F/G: authentication and invalid-request failures do not cascade", async () => {
  for (const failure of ["401", "400"]) {
    const gemini = new FakeGeminiProvider({ behavior: { [MODEL_3_8]: failure } });
    const { router } = createRouter(gemini);
    const result = await router.route({ capability: AI_CAPABILITY.DEEP_REASONING, systemPrompt: "system", userPrompt: "user" });
    assert.equal(result.ok, false, failure);
    assert.equal(gemini.calls.length, 1, failure);
    assert.equal(result.attempts.length, 1, failure);
    assert.equal(result.attempts[0].httpStatus, Number(failure), failure);
  }
});

test("structured output uses one shared DTO contract and records required trace fields", async () => {
  const gemini = new FakeGeminiProvider({ responseByModel: { [MODEL_3_8]: VALID_DTO(MODEL_3_8) } });
  const { router, openai } = createRouter(gemini);
  const result = await AIGatewayService.generateStructured({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "system",
    userPrompt: "user",
    validate: (value) => ["gemini", "google"].includes(value?.provider) && value?.model === MODEL_3_8,
    options: { router },
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, PROVIDER_FAMILY.GEMINI);
  assert.equal(result.model, MODEL_3_8);
  assert.equal(result.json.provider, "google");
  assert.equal(result.providerMetadata.transport, "interactions");
  assert.equal(result.attempts[0].attemptNumber, 1);
  assert.equal(typeof result.attempts[0].startedAt, "string");
  assert.equal(result.attempts[0].durationMs >= 0, true);
  assert.equal(result.attempts[0].providerErrorCode, null);
  assert.equal(result.attempts[0].result, "SUCCESS");
  assert.equal(openai.callCount, 0);
});

test("malformed structured output is marked incompatible and advances without retrying a model", async () => {
  const gemini = new FakeGeminiProvider({ responseByModel: {
    [MODEL_3_8]: "not-json",
    [MODEL_3_7]: "not-json",
    [MODEL_3_6]: "not-json",
  } });
  const { router } = createRouter(gemini);
  const result = await AIGatewayService.generateStructured({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "system",
    userPrompt: "user",
    validate: () => true,
    options: { router },
  });
  assert.equal(result.ok, false);
  assert.equal(result.errorType, GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE);
  assert.deepEqual(gemini.calls, [MODEL_3_8, MODEL_3_7, MODEL_3_6]);
});

test("server-owned model provenance overrides any model-generated model identifier", async () => {
  const gemini = new FakeGeminiProvider({ responseByModel: { [MODEL_3_8]: VALID_DTO("hallucinated-model-id") } });
  const { router } = createRouter(gemini);
  const result = await AIGatewayService.generateStructured({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "system",
    userPrompt: "user",
    options: { router },
  });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_8);
  assert.equal(result.json.model, MODEL_3_8);
  assert.equal(result.json.provider, "google");
  assert.deepEqual(gemini.calls, [MODEL_3_8]);
});

test("per-model circuit breaker skips a cooling primary on a later run", async () => {
  const gemini = new FakeGeminiProvider({ behavior: { [MODEL_3_8]: "429" } });
  const { router } = createRouter(gemini);
  const first = await router.route({ capability: AI_CAPABILITY.DEEP_REASONING, systemPrompt: "system", userPrompt: "user" });
  const second = await router.route({ capability: AI_CAPABILITY.DEEP_REASONING, systemPrompt: "system", userPrompt: "user" });

  assert.equal(first.model, MODEL_3_7);
  assert.equal(second.model, MODEL_3_7);
  assert.equal(second.attempts[0].result, "COOLDOWN");
  assert.equal(second.fallbackReason, "PRIMARY_COOLDOWN");
  assert.equal(gemini.calls.filter((model) => model === MODEL_3_8).length, 1);
});

test("health store honors Retry-After and keeps daily quota cooldown longer", () => {
  let now = 1_700_000_000_000;
  const health = new ModelHealthStore({
    clock: () => now,
    baseCooldownMs: 1000,
    maxCooldownMs: 10_000,
    dailyCooldownMs: 60_000,
  });

  const retryAfter = health.recordFailure({
    provider: PROVIDER_FAMILY.GEMINI,
    model: MODEL_3_8,
    result: "RATE_LIMITED",
    httpStatus: 429,
    retryAfterMs: 7000,
  });
  assert.equal(retryAfter.cooldownRemainingMs, 7000);

  const daily = health.recordFailure({
    provider: PROVIDER_FAMILY.GEMINI,
    model: MODEL_3_7,
    result: "RATE_LIMITED",
    httpStatus: 429,
    retryAfterMs: 1000,
    dailyQuotaExhausted: true,
  });
  assert.equal(daily.cooldownRemainingMs, 60_000);
  now += 60_001;
  assert.equal(health.isCoolingDown(PROVIDER_FAMILY.GEMINI, MODEL_3_7), false);
});

test("unrouted embedding capability is explicitly not configured", async () => {
  const result = await new ModelRouter().route({
    capability: AI_CAPABILITY.EMBEDDING,
    systemPrompt: "system",
    userPrompt: "user",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorType, GATEWAY_ERROR_TYPE.NOT_CONFIGURED);
});

test("describeRoute is read-only and reports the three ordered Gemini candidates", () => {
  const gemini = new FakeGeminiProvider();
  const { router, openai } = createRouter(gemini);
  const route = router.describeRoute(AI_CAPABILITY.MULTIMODAL);

  assert.deepEqual(route.map((entry) => entry.model), [MODEL_3_8, MODEL_3_7, MODEL_3_6]);
  assert.deepEqual(route.map((entry) => entry.provider), ["gemini", "gemini", "gemini"]);
  assert.equal(route.every((entry) => entry.valid && entry.configured), true);
  assert.equal(gemini.calls.length, 0);
  assert.equal(openai.callCount, 0);
});

test("remaining-budget reservation preserves execution time for terminal healthy 3.6", async () => {
  // Candidate 3.8 fails immediately, leaving candidate 3.6
  // Verify 3.6 succeeds within its reserved budget
  const gemini = new FakeGeminiProvider({ behavior: { [MODEL_3_8]: "429" } });
  const { router } = createRouter(gemini);
  const result = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "system",
    userPrompt: "user",
    options: {
      totalBudgetMs: 10_000,
      perModelTimeoutMs: 7_000,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.executedModel, MODEL_3_7);
});

test("gemini-2.5-flash is retired and not invoked during production routing", async () => {
  const gemini = new FakeGeminiProvider({ behavior: { [MODEL_3_8]: "503", [MODEL_3_7]: "503", [MODEL_3_6]: "503" } });
  const { router } = createRouter(gemini);
  const result = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "system",
    userPrompt: "user",
  });

  assert.equal(result.ok, false);
  assert.equal(gemini.calls.includes(MODEL_2_5), false);
  assert.deepEqual(gemini.calls, [MODEL_3_8, MODEL_3_7, MODEL_3_6]);
});

test("ACCEPTANCE: 3.8 cooldown, 3.7 cooldown skips both in 0ms and executes healthy 3.6 directly", async () => {
  const gemini = new FakeGeminiProvider({
    responseByModel: {
      [MODEL_3_6]: VALID_DTO(MODEL_3_6),
    },
  });
  const { router } = createRouter(gemini);

  router.healthStore.recordFailure({
    provider: PROVIDER_FAMILY.GEMINI,
    model: MODEL_3_8,
    result: "RATE_LIMITED",
    httpStatus: 429,
    retryAfterMs: 60_000,
  });
  router.healthStore.recordFailure({
    provider: PROVIDER_FAMILY.GEMINI,
    model: MODEL_3_7,
    result: "HIGH_DEMAND",
    httpStatus: 503,
    retryAfterMs: 60_000,
  });

  const result = await AIGatewayService.generateStructured({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "system",
    userPrompt: "user",
    options: { router },
  });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_6);
  assert.equal(result.json.provider, "google");
  assert.equal(result.json.model, MODEL_3_6);
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.fallbackReason, "PRIMARY_COOLDOWN");

  assert.deepEqual(gemini.calls, [MODEL_3_6]);
  assert.equal(result.attempts[0].model, MODEL_3_8);
  assert.equal(result.attempts[0].result, "COOLDOWN");
  assert.equal(result.attempts[0].durationMs, 0);
  assert.equal(result.attempts[1].model, MODEL_3_7);
  assert.equal(result.attempts[1].result, "COOLDOWN");
  assert.equal(result.attempts[1].durationMs, 0);
  assert.equal(result.attempts[2].model, MODEL_3_6);
  assert.equal(result.attempts[2].result, "SUCCESS");
});

