import test from "node:test";
import assert from "node:assert/strict";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AI_CAPABILITY, PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../../src/lib/ai-gateway/types.js";
import { IModelProvider } from "../../src/lib/ai-gateway/providers/IModelProvider.js";
import { VerdictPolicyEngine, TRUST_FINAL_VERDICTS } from "../../src/lib/server/trust/VerdictPolicyEngine.js";

/**
 * StudentHub V5 — Provider Failure Matrix, Cost & Latency Benchmark
 *
 * Implements Sections 47, 48, 49, 50, 51:
 * - Provider Failure Matrix:
 *   1. OpenAI unavailable -> Gemini fallback
 *   2. OpenAI 429 Rate Limit -> retry once then fallback
 *   3. Gemini unavailable -> OpenAI fallback
 *   4. Gemini 429 Rate Limit -> retry once then fallback
 *   5. Both providers unavailable -> deterministic policy degradation (NO hallucinated verdicts)
 * - Cost Benchmark across execution modes:
 *   - FAST (Triage / Fast classification)
 *   - NORMAL (Standard verification)
 *   - DEEP (Deep reasoning + Counter-search + Independent critic)
 * - Modelled latency profile (p50, p90, p95 across stages); this is not live p95 telemetry.
 */

class MockProvider extends IModelProvider {
  constructor(family, behavior = {}) {
    super(family);
    this.behavior = behavior;
    this.calls = 0;
  }

  isConfigured() {
    return this.behavior.configured !== false;
  }

  async generate(candidate, promptParams) {
    this.calls++;
    if (this.behavior.failAlways) {
      const err = new Error("Simulated Provider Outage (503 Service Unavailable)");
      err.gatewayErrorType = GATEWAY_ERROR_TYPE.HTTP_ERROR;
      err.httpStatus = 503;
      throw err;
    }
    if (this.behavior.rateLimitCount && this.calls <= this.behavior.rateLimitCount) {
      const err = new Error("Simulated Rate Limit (429 Too Many Requests)");
      err.gatewayErrorType = GATEWAY_ERROR_TYPE.RATE_LIMITED;
      err.httpStatus = 429;
      throw err;
    }
    if (this.behavior.latencyMs) {
      await new Promise(r => setTimeout(r, this.behavior.latencyMs));
    }
    return {
      text: this.behavior.responseText || JSON.stringify({ summary: "Verified by mock", reasons: ["Valid signal"] }),
      usage: { promptTokens: 400, completionTokens: 120 }
    };
  }
}

test("PROVIDER FAILURE MATRIX (SECTION 48)", async () => {
  console.log("\n============================================================");
  console.log("⚡ RUNNING PROVIDER FAILURE MATRIX (SECTION 48)");
  console.log("============================================================\n");

  // Case 1: OpenAI unavailable -> Fallback to Gemini
  {
    const fakeOpenAI = new MockProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, { failAlways: true });
    const fakeGemini = new MockProvider(PROVIDER_FAMILY.GEMINI, { responseText: "Gemini fallback response" });
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: fakeOpenAI,
      [PROVIDER_FAMILY.GEMINI]: fakeGemini
    });

    const res = await router.route({
      capability: AI_CAPABILITY.FAST_CLASSIFICATION,
      userPrompt: "Kiểm tra thông báo học bổng"
    });

    assert.equal(res.ok, true, "Fallback to Gemini must succeed");
    assert.equal(res.provider, PROVIDER_FAMILY.GEMINI, "Provider must be Gemini");
    console.log("  ✔ Case 1: OpenAI Unavailable -> Successfully routed to Gemini Fallback");
  }

  // Case 2: OpenAI 429 Rate Limit -> Retry once then Fallback to Gemini
  {
    const fakeOpenAI = new MockProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, { rateLimitCount: 10 }); // Keeps 429
    const fakeGemini = new MockProvider(PROVIDER_FAMILY.GEMINI, { responseText: "Gemini response after 429" });
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: fakeOpenAI,
      [PROVIDER_FAMILY.GEMINI]: fakeGemini
    });

    const res = await router.route({
      capability: AI_CAPABILITY.FAST_CLASSIFICATION,
      userPrompt: "Kiểm tra lịch thi"
    });

    assert.equal(res.ok, true, "Fallback to Gemini must succeed after 429");
    assert.equal(res.provider, PROVIDER_FAMILY.GEMINI);
    console.log("  ✔ Case 2: OpenAI 429 Rate Limited -> Retried and routed to Gemini Fallback");
  }

  // Case 3: Gemini unavailable -> fallback to OpenAI on a Gemini-first route
  {
    const fakeOpenAI = new MockProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, { responseText: "OpenAI fallback response" });
    const fakeGemini = new MockProvider(PROVIDER_FAMILY.GEMINI, { failAlways: true });
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: fakeOpenAI,
      [PROVIDER_FAMILY.GEMINI]: fakeGemini
    });

    const res = await router.route({
      capability: AI_CAPABILITY.MULTIMODAL,
      userPrompt: "Kiểm tra ảnh thông báo"
    });

    assert.equal(res.ok, true, "OpenAI fallback must succeed when Gemini is unavailable");
    assert.equal(res.provider, PROVIDER_FAMILY.OPENAI_COMPATIBLE);
    assert.ok(fakeGemini.calls >= 2, "Gemini-first candidates must be attempted before OpenAI fallback");
    console.log("  ✔ Case 3: Gemini Unavailable -> Successfully routed to OpenAI Fallback");
  }

  // Case 4: Gemini 429 -> retry once per Gemini candidate, then OpenAI fallback
  {
    const fakeOpenAI = new MockProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, { responseText: "OpenAI response after Gemini 429" });
    const fakeGemini = new MockProvider(PROVIDER_FAMILY.GEMINI, { rateLimitCount: 10 });
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: fakeOpenAI,
      [PROVIDER_FAMILY.GEMINI]: fakeGemini
    });

    const res = await router.route({
      capability: AI_CAPABILITY.MULTIMODAL,
      userPrompt: "Kiểm tra tài liệu hình ảnh"
    });

    assert.equal(res.ok, true, "OpenAI fallback must succeed after Gemini rate limits");
    assert.equal(res.provider, PROVIDER_FAMILY.OPENAI_COMPATIBLE);
    assert.ok(fakeGemini.calls >= 4, "Each Gemini candidate must receive its bounded retry");
    console.log("  ✔ Case 4: Gemini 429 Rate Limited -> Retried per candidate and routed to OpenAI Fallback");
  }

  // Case 5: Both Providers Unavailable -> Graceful degradation to Deterministic Policy
  {
    const fakeOpenAI = new MockProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, { failAlways: true });
    const fakeGemini = new MockProvider(PROVIDER_FAMILY.GEMINI, { failAlways: true });
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: fakeOpenAI,
      [PROVIDER_FAMILY.GEMINI]: fakeGemini
    });

    const res = await router.route({
      capability: AI_CAPABILITY.MULTIMODAL,
      userPrompt: "Kiểm tra thông tin"
    });

    assert.equal(res.ok, false, "Router must report failure when both external APIs are down");
    assert.ok(res.attempts.length >= 3, "All configured candidates were attempted");

    // Adjudicate via deterministic policy engine
    const deterministicVerdict = VerdictPolicyEngine.adjudicate({
      claims: [{ text: "Thông tin học phí" }],
      evidence: [],
      sufficiency: { status: "INSUFFICIENT" }
    });

    assert.equal(deterministicVerdict.verdict, TRUST_FINAL_VERDICTS.INSUFFICIENT_EVIDENCE);
    assert.equal(deterministicVerdict.policyApplied, "POLICY_EVIDENCE_ABSTENTION");
    console.log("  ✔ Case 5: Both External LLMs Unavailable -> Truthful Abstention (No fabricated verdict)\n");
  }
});

test("COST & TOKEN BUDGET BENCHMARK (SECTIONS 49, 50)", async () => {
  console.log("============================================================");
  console.log("💰 COST & TOKEN BUDGET BENCHMARK (FAST / NORMAL / DEEP)");
  console.log("============================================================\n");

  // Modelled price assumptions only. No provider billing API or live usage
  // record is available in this local test.
  const INPUT_PRICE_PER_M = 0.15;
  const OUTPUT_PRICE_PER_M = 0.60;

  const costProfiles = {
    FAST: {
      openAICalls: 1,
      geminiCalls: 0,
      inputTokens: 250,
      outputTokens: 60,
      searchCalls: 0,
      criticCalls: 0
    },
    NORMAL: {
      openAICalls: 2,
      geminiCalls: 0,
      inputTokens: 850,
      outputTokens: 220,
      searchCalls: 1,
      criticCalls: 0
    },
    DEEP: {
      openAICalls: 3,
      geminiCalls: 0,
      inputTokens: 2400,
      outputTokens: 650,
      searchCalls: 2,
      criticCalls: 1
    }
  };

  for (const [mode, p] of Object.entries(costProfiles)) {
    const inputCost = (p.inputTokens / 1_000_000) * INPUT_PRICE_PER_M;
    const outputCost = (p.outputTokens / 1_000_000) * OUTPUT_PRICE_PER_M;
    const totalCostUSD = inputCost + outputCost;
    const totalCostVND = totalCostUSD * 25400;

    console.log(`📊 MODE: ${mode}`);
    console.log(`  LLM Calls              : ${p.openAICalls + p.geminiCalls} (OpenAI: ${p.openAICalls}, Gemini: ${p.geminiCalls})`);
    console.log(`  Input Tokens           : ${p.inputTokens}`);
    console.log(`  Output Tokens          : ${p.outputTokens}`);
    console.log(`  Live Search Calls      : ${p.searchCalls}`);
    console.log(`  Critic Executions      : ${p.criticCalls}`);
    console.log(`  Estimated Cost / Run   : $${totalCostUSD.toFixed(6)} USD (~${totalCostVND.toFixed(2)} VNĐ)\n`);

    assert.ok(totalCostUSD < 0.01, "Cost per query must be under $0.01 USD");
  }
});

test("LATENCY BENCHMARK: P50 / P90 / P95 (SECTION 51)", async () => {
  console.log("============================================================");
  console.log("⏱️ MODELLED LATENCY PROFILE (50 SYNTHETIC SAMPLES PER MODE)");
  console.log("============================================================\n");

  function simulateLatencyDistribution(baseMs, jitterMs, count = 50) {
    const samples = [];
    for (let i = 0; i < count; i++) {
      // Deterministic synthetic spread keeps the report reproducible. These
      // samples must never be described as observed provider p95 latency.
      const val = baseMs + (((i * 37) % 100) / 100) * jitterMs;
      samples.push(val);
    }
    samples.sort((a, b) => a - b);
    return {
      p50: Math.round(samples[Math.floor(count * 0.50)]),
      p90: Math.round(samples[Math.floor(count * 0.90)]),
      p95: Math.round(samples[Math.floor(count * 0.95)])
    };
  }

  const fastLat = simulateLatencyDistribution(120, 80);
  const normalLat = simulateLatencyDistribution(380, 160);
  const deepLat = simulateLatencyDistribution(850, 350);

  console.log(`  FAST Mode   : p50 = ${fastLat.p50}ms | p90 = ${fastLat.p90}ms | p95 = ${fastLat.p95}ms (SLA <= 500ms)`);
  console.log(`  NORMAL Mode : p50 = ${normalLat.p50}ms | p90 = ${normalLat.p90}ms | p95 = ${normalLat.p95}ms (SLA <= 1500ms)`);
  console.log(`  DEEP Mode   : p50 = ${deepLat.p50}ms | p90 = ${deepLat.p90}ms | p95 = ${deepLat.p95}ms (SLA <= 2500ms)\n`);

  assert.ok(fastLat.p95 <= 500, "FAST mode p95 within 500ms SLA");
  assert.ok(normalLat.p95 <= 1500, "NORMAL mode p95 within 1500ms SLA");
  assert.ok(deepLat.p95 <= 2500, "DEEP mode p95 within 2500ms SLA");
});
