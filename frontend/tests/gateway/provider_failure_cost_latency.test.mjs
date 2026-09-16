import test from "node:test";
import assert from "node:assert/strict";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AIGatewayService } from "../../src/lib/ai-gateway/AIGatewayService.js";
import { AI_CAPABILITY, PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../../src/lib/ai-gateway/types.js";
import { IModelProvider } from "../../src/lib/ai-gateway/providers/IModelProvider.js";
import { AIGatewayReasoningProvider } from "../../src/lib/ai-trust/layer4/providers/AIGatewayReasoningProvider.js";
import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";

const VALID_DTO = JSON.stringify({
  verdictSignal: "UNCERTAIN",
  supportReasons: [],
  contradictionReasons: [],
  missingEvidence: ["Nguồn chính thức cần được kiểm tra thêm."],
  uncertainty: "Chưa đủ evidence để diễn giải mạnh hơn.",
  citationsUsed: [],
  provider: "gemini",
  model: "gemini-3.8-flash",
});
class MockGeminiProvider extends IModelProvider {
  constructor(mode = "success") {
    super(PROVIDER_FAMILY.GEMINI);
    this.mode = mode;
    this.calls = 0;
  }

  isConfigured() {
    return true;
  }

  async generate() {
    this.calls += 1;
    if (this.mode === "timeout") {
      const error = new Error("simulated timeout");
      error.gatewayErrorType = GATEWAY_ERROR_TYPE.TIMEOUT;
      throw error;
    }
    if (this.mode === "429") {
      const error = new Error("simulated rate limit");
      error.gatewayErrorType = GATEWAY_ERROR_TYPE.HTTP_ERROR;
      error.httpStatus = 429;
      throw error;
    }
    if (this.mode === "5xx") {
      const error = new Error("simulated upstream failure");
      error.gatewayErrorType = GATEWAY_ERROR_TYPE.HTTP_ERROR;
      error.httpStatus = 503;
      throw error;
    }
    if (this.mode === "invalid-json") return { text: "not-json", transport: "interactions", thinkingLevel: "low" };
    return { text: VALID_DTO, transport: "interactions", thinkingLevel: "low" };
  }
}

class NeverCalledOpenAIProvider extends IModelProvider {
  constructor() {
    super(PROVIDER_FAMILY.OPENAI_COMPATIBLE);
    this.calls = 0;
  }

  isConfigured() {
    return true;
  }

  async generate() {
    this.calls += 1;
    throw new Error("OpenAI must not be called in Gemini-only mode");
  }
}

function routeFor(mode) {
  const gemini = new MockGeminiProvider(mode);
  const openai = new NeverCalledOpenAIProvider();
  return {
    gemini,
    openai,
    router: new ModelRouter({
      [PROVIDER_FAMILY.GEMINI]: gemini,
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: openai,
    }),
  };
}

test("Gemini-only failure matrix retries bounded failures and never calls OpenAI", async () => {
  for (const [mode, expectedError] of [
    ["timeout", GATEWAY_ERROR_TYPE.TIMEOUT],
    ["429", GATEWAY_ERROR_TYPE.HTTP_ERROR],
    ["5xx", GATEWAY_ERROR_TYPE.HTTP_ERROR],
    ["invalid-json", GATEWAY_ERROR_TYPE.INVALID_JSON],
  ]) {
    const { router, gemini, openai } = routeFor(mode);
    const result = await AIGatewayService.generateStructured({
      capability: AI_CAPABILITY.DEEP_REASONING,
      systemPrompt: "test",
      userPrompt: "test",
      validate: () => true,
      options: { router },
    });
    assert.equal(result.ok, false, `${mode} must fail closed`);
    assert.equal(result.errorType, expectedError, `${mode} error should stay classified`);
    assert.equal(result.provider, null);
    assert.equal(openai.calls, 0, `OpenAI must not be called for ${mode}`);
    assert.equal(gemini.calls, 2, `${mode} must receive one bounded retry`);
  }
});

test("successful structured Gemini output is parsed, validated, and consumed", async () => {
  const { router, gemini, openai } = routeFor("success");
  const result = await AIGatewayService.generateStructured({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "test",
    userPrompt: "test",
    validate: (value) => value?.provider === "gemini" && value?.model === "gemini-3.8-flash",
    options: { router },
  });
  assert.equal(result.ok, true);
  assert.equal(result.provider, PROVIDER_FAMILY.GEMINI);
  assert.equal(result.model, "gemini-3.8-flash");
  assert.equal(result.json.provider, "gemini");
  assert.equal(result.providerMetadata.transport, "interactions");
  assert.equal(result.providerMetadata.thinkingLevel, "low");
  assert.equal(gemini.calls, 1);
  assert.equal(openai.calls, 0);
});

test("Layer 4 remains deterministic when Gemini is unavailable", async () => {
  const provider = new AIGatewayReasoningProvider({
    gateway: {
      async generateStructured() {
        return { ok: false, errorType: GATEWAY_ERROR_TYPE.TIMEOUT, errorMessage: "safe timeout", attempts: [] };
      },
    },
  });
  const result = await Layer4TrustService.evaluate({
    layer1Result: { status: "UNKNOWN", signals: [] },
    layer2Result: { status: "UNKNOWN", claims: [], contextSignals: [] },
    layer2AResult: { providerStatus: "NOT_APPLICABLE", finding: "NOT_APPLICABLE" },
    layer3Result: { status: "INSUFFICIENT", evidence: [], verificationCompleteness: 0 },
    options: { provider },
  });
  assert.equal(result.aiVerificationStatus, "UNAVAILABLE");
  assert.equal(result.aiVerification.provider, "gemini");
  assert.equal(result.enforcement, "REVIEW");
  assert.equal(result.metrics.providerStatus, "UNAVAILABLE");
});

test("cost and latency budgets remain explicit synthetic assumptions", () => {
  const profiles = [
    { mode: "FAST", calls: 1, input: 250, output: 60, p95: 196, sla: 500 },
    { mode: "NORMAL", calls: 1, input: 850, output: 220, p95: 532, sla: 1500 },
    { mode: "DEEP", calls: 1, input: 2400, output: 650, p95: 1183, sla: 2500 },
  ];
  for (const profile of profiles) {
    const cost = (profile.input * 0.15 + profile.output * 0.6) / 1_000_000;
    assert.ok(cost < 0.01, `${profile.mode} synthetic cost budget`);
    assert.ok(profile.calls >= 1);
    assert.ok(profile.p95 <= profile.sla, `${profile.mode} synthetic latency budget`);
  }
});
