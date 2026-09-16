/**
 * AI Gateway — Gemini-only routing contract.
 *
 * Every provider here is an injected fake. This file never makes a network
 * request and proves that OpenAI compatibility metadata cannot become an
 * active candidate while the production runtime is intentionally disabled.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AIGatewayService } from "../../src/lib/ai-gateway/AIGatewayService.js";
import { AI_CAPABILITY, PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../../src/lib/ai-gateway/types.js";
import { IModelProvider } from "../../src/lib/ai-gateway/providers/IModelProvider.js";

const VALID_DTO = JSON.stringify({
  verdictSignal: "UNCERTAIN",
  supportReasons: [],
  contradictionReasons: [],
  missingEvidence: ["Cần kiểm tra thêm nguồn độc lập."],
  uncertainty: "Chưa đủ evidence để diễn giải mạnh hơn.",
  citationsUsed: [],
  provider: "gemini",
  model: "gemini-3.8-flash",
});

class FakeGeminiProvider extends IModelProvider {
  constructor({ response = "gemini-response", failures = [] } = {}) {
    super(PROVIDER_FAMILY.GEMINI);
    this.response = response;
    this.failures = [...failures];
    this.callCount = 0;
  }

  isConfigured() {
    return true;
  }

  async generate() {
    this.callCount += 1;
    const failure = this.failures.shift();
    if (failure) {
      const error = new Error(`simulated ${failure}`);
      error.gatewayErrorType = failure === "timeout"
        ? GATEWAY_ERROR_TYPE.TIMEOUT
        : GATEWAY_ERROR_TYPE.HTTP_ERROR;
      if (failure === "429") error.httpStatus = 429;
      if (failure === "5xx") error.httpStatus = 503;
      throw error;
    }
    return { text: this.response, transport: "interactions", thinkingLevel: "low" };
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
  }

  isConfigured() {
    return false;
  }

  async generate() {
    throw new Error("Unconfigured Gemini must not be called");
  }
}

function createRouter(gemini) {
  const openai = new NeverCalledOpenAIProvider();
  return {
    openai,
    router: new ModelRouter({
      [PROVIDER_FAMILY.GEMINI]: gemini,
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: openai,
    }),
  };
}

test("unconfigured Gemini fails closed without activating OpenAI compatibility", async () => {
  const { router, openai } = createRouter(new UnconfiguredGeminiProvider());
  const result = await router.route({
    capability: AI_CAPABILITY.FAST_CLASSIFICATION,
    systemPrompt: "system",
    userPrompt: "user",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorType, GATEWAY_ERROR_TYPE.NOT_CONFIGURED);
  assert.equal(openai.callCount, 0);
});

test("Gemini is the sole active candidate and OpenAI is never called", async () => {
  const gemini = new FakeGeminiProvider({ response: "gemini-success" });
  const { router, openai } = createRouter(gemini);
  const result = await router.route({
    capability: AI_CAPABILITY.FAST_CLASSIFICATION,
    systemPrompt: "system",
    userPrompt: "user",
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, PROVIDER_FAMILY.GEMINI);
  assert.equal(result.model, "gemini-3.8-flash");
  assert.equal(result.text, "gemini-success");
  assert.equal(gemini.callCount, 1);
  assert.equal(openai.callCount, 0);
});

test("transient Gemini failures retry once on the same candidate", async () => {
  for (const failure of ["timeout", "429", "5xx"]) {
    const gemini = new FakeGeminiProvider({ failures: [failure], response: "recovered" });
    const { router, openai } = createRouter(gemini);
    const result = await router.route({
      capability: AI_CAPABILITY.DEEP_REASONING,
      systemPrompt: "system",
      userPrompt: "user",
    });

    assert.equal(result.ok, true, failure);
    assert.equal(gemini.callCount, 2, failure);
    assert.equal(openai.callCount, 0, failure);
  }
});

test("generateStructured parses and validates the canonical Gemini DTO", async () => {
  const gemini = new FakeGeminiProvider({ response: VALID_DTO });
  const { router, openai } = createRouter(gemini);
  const result = await AIGatewayService.generateStructured({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "system",
    userPrompt: "user",
    validate: (value) => value?.provider === "gemini" && value?.model === "gemini-3.8-flash",
    options: { router },
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, PROVIDER_FAMILY.GEMINI);
  assert.equal(result.model, "gemini-3.8-flash");
  assert.equal(result.json.provider, "gemini");
  assert.equal(result.providerMetadata.transport, "interactions");
  assert.equal(result.providerMetadata.thinkingLevel, "low");
  assert.equal(openai.callCount, 0);
});

test("invalid Gemini JSON retries once and then fails closed", async () => {
  const gemini = new FakeGeminiProvider({ response: "not-json" });
  const { router, openai } = createRouter(gemini);
  const result = await AIGatewayService.generateStructured({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "system",
    userPrompt: "user",
    validate: () => true,
    options: { router },
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorType, GATEWAY_ERROR_TYPE.INVALID_JSON);
  assert.equal(gemini.callCount, 2);
  assert.equal(openai.callCount, 0);
});

test("schema-invalid Gemini JSON retries once and then fails closed", async () => {
  const gemini = new FakeGeminiProvider({ response: JSON.stringify({ unexpected: true }) });
  const { router, openai } = createRouter(gemini);
  const result = await AIGatewayService.generateStructured({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "system",
    userPrompt: "user",
    validate: () => false,
    options: { router },
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorType, GATEWAY_ERROR_TYPE.SCHEMA_VALIDATION_FAILED);
  assert.equal(gemini.callCount, 2);
  assert.equal(openai.callCount, 0);
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

test("describeRoute is read-only and reports only Gemini as active", () => {
  const gemini = new FakeGeminiProvider();
  const { router, openai } = createRouter(gemini);
  const route = router.describeRoute(AI_CAPABILITY.MULTIMODAL);

  assert.equal(route.length, 1);
  assert.equal(route[0].provider, PROVIDER_FAMILY.GEMINI);
  assert.equal(route[0].configured, true);
  assert.equal(gemini.callCount, 0);
  assert.equal(openai.callCount, 0);
});
