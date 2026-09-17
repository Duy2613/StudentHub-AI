import test from "node:test";
import assert from "node:assert/strict";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AIGatewayService } from "../../src/lib/ai-gateway/AIGatewayService.js";
import { AI_CAPABILITY, PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../../src/lib/ai-gateway/types.js";
import { IModelProvider } from "../../src/lib/ai-gateway/providers/IModelProvider.js";
import { AIGatewayReasoningProvider } from "../../src/lib/ai-trust/layer4/providers/AIGatewayReasoningProvider.js";
import { Layer4TrustService } from "../../src/lib/ai-trust/layer4/Layer4TrustService.js";

const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash"];
const VALID_DTO = (model) => JSON.stringify({
  verdictSignal: "UNCERTAIN",
  supportReasons: [],
  contradictionReasons: [],
  missingEvidence: ["Nguồn chính thức cần được kiểm tra thêm."],
  uncertainty: "Chưa đủ evidence để diễn giải mạnh hơn.",
  citationsUsed: [],
  provider: "google",
  model,
});

class MockGeminiProvider extends IModelProvider {
  constructor(failureByModel = {}) {
    super(PROVIDER_FAMILY.GEMINI);
    this.failureByModel = { ...failureByModel };
    this.calls = [];
  }

  isConfigured() {
    return true;
  }

  async generate({ catalogEntry }) {
    this.calls.push(catalogEntry.model);
    const failure = this.failureByModel[catalogEntry.model];
    if (failure) {
      const error = new Error(`simulated ${failure}`);
      error.gatewayErrorType = failure === "timeout" ? GATEWAY_ERROR_TYPE.TIMEOUT : GATEWAY_ERROR_TYPE.HTTP_ERROR;
      error.httpStatus = failure === "429" ? 429 : failure === "5xx" ? 503 : null;
      error.providerErrorCode = failure === "429" ? "RESOURCE_EXHAUSTED" : failure === "5xx" ? "SERVICE_UNAVAILABLE" : null;
      throw error;
    }
    return { text: VALID_DTO(catalogEntry.model), transport: "interactions", thinkingLevel: "low", httpStatus: 200 };
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

function routeFor(failureByModel) {
  const gemini = new MockGeminiProvider(failureByModel);
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

test("bounded transient failover advances through models and never calls OpenAI", async () => {
  for (const failure of ["timeout", "429", "5xx"]) {
    const { router, gemini, openai } = routeFor({ [MODELS[0]]: failure });
    const result = await AIGatewayService.generateStructured({
      capability: AI_CAPABILITY.DEEP_REASONING,
      systemPrompt: "test",
      userPrompt: "test",
      validate: (value) => ["gemini", "google"].includes(value?.provider) && value?.model === MODELS[1],
      options: { router },
    });
    assert.equal(result.ok, true, failure);
    assert.equal(result.model, MODELS[1], failure);
    assert.equal(gemini.calls.length, 2, failure);
    assert.equal(openai.calls, 0, failure);
  }
});

test("successful structured Gemini output is parsed, validated, and consumed", async () => {
  const { router, gemini, openai } = routeFor({});
  const result = await AIGatewayService.generateStructured({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: "test",
    userPrompt: "test",
    validate: (value) => ["gemini", "google"].includes(value?.provider) && value?.model === MODELS[0],
    options: { router },
  });
  assert.equal(result.ok, true);
  assert.equal(result.model, MODELS[0]);
  assert.ok(["gemini", "google"].includes(result.json.provider));
  assert.equal(result.attempts[0].result, "SUCCESS");
  assert.equal(gemini.calls.length, 1);
  assert.equal(openai.calls, 0);
});

test("Layer 4 remains deterministic and retains the model trace when all Gemini models fail", async () => {
  const attempts = MODELS.map((model, index) => ({
    provider: "gemini",
    model,
    attemptNumber: index + 1,
    startedAt: new Date(1_700_000_000_000 + index).toISOString(),
    durationMs: 12,
    httpStatus: 503,
    providerErrorCode: "SERVICE_UNAVAILABLE",
    result: "SERVICE_UNAVAILABLE",
    ok: false,
    errorType: GATEWAY_ERROR_TYPE.HTTP_ERROR,
  }));
  const provider = new AIGatewayReasoningProvider({
    gateway: {
      async generateStructured() {
        return {
          ok: false,
          errorType: GATEWAY_ERROR_TYPE.HTTP_ERROR,
          httpStatus: 503,
          providerStatus: "SERVICE_UNAVAILABLE",
          attempts,
          requestedPrimaryModel: MODELS[0],
          operationStatus: "PARTIAL",
          totalLatencyMs: 48,
        };
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
  assert.ok(["gemini", "google"].includes(result.aiVerification.provider));
  assert.equal(result.aiRequestedPrimaryModel, MODELS[0]);
  assert.equal(result.aiModelTrace.length, MODELS.length);
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

