/**
 * AI Gateway — Comprehensive Automated Test Suite
 *
 * Verifies ModelRouter + AIGatewayService capability-based routing,
 * fallback-chain behavior, retry policy, and structured-output validation.
 *
 * IMPORTANT: Every test in this file uses INJECTED FAKE PROVIDERS
 * (test doubles implementing IModelProvider). No real network call is ever
 * made — this suite is safe and deterministic to run in CI regardless of
 * whether OPENAI_API_KEY / GEMINI_API_KEY are configured in the environment.
 */

import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AIGatewayService } from "../../src/lib/ai-gateway/AIGatewayService.js";
import { AI_CAPABILITY, PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../../src/lib/ai-gateway/types.js";
import { IModelProvider } from "../../src/lib/ai-gateway/providers/IModelProvider.js";

// ─── Fake Provider Test Doubles ───────────────────────────────────────────

class AlwaysConfiguredOkProvider extends IModelProvider {
  constructor(family, text) {
    super(family);
    this.text = text;
    this.callCount = 0;
  }
  isConfigured() {
    return true;
  }
  async generate() {
    this.callCount += 1;
    return { text: this.text };
  }
}

class NeverConfiguredProvider extends IModelProvider {
  isConfigured() {
    return false;
  }
  async generate() {
    throw new Error("Should never be called — not configured");
  }
}

class FailsNTimesThenSucceedsProvider extends IModelProvider {
  constructor(family, failCount, successText) {
    super(family);
    this.failCount = failCount;
    this.successText = successText;
    this.callCount = 0;
  }
  isConfigured() {
    return true;
  }
  async generate() {
    this.callCount += 1;
    if (this.callCount <= this.failCount) {
      const err = new Error(`Simulated transient failure #${this.callCount}`);
      err.gatewayErrorType = GATEWAY_ERROR_TYPE.TIMEOUT;
      throw err;
    }
    return { text: this.successText };
  }
}

class AlwaysFailsProvider extends IModelProvider {
  constructor(family, errorType = GATEWAY_ERROR_TYPE.HTTP_ERROR) {
    super(family);
    this.errorType = errorType;
    this.callCount = 0;
  }
  isConfigured() {
    return true;
  }
  async generate() {
    this.callCount += 1;
    const err = new Error("Simulated permanent provider failure");
    err.gatewayErrorType = this.errorType;
    throw err;
  }
}

// ─── Test Suite ────────────────────────────────────────────────────────────

async function runAIGatewayTestSuite() {
  let passed = 0;
  let failed = 0;

  function check(name, condition, detail = "") {
    if (condition) {
      passed += 1;
      console.log(`✅ [PASS] ${name}`);
    } else {
      failed += 1;
      console.error(`❌ [FAIL] ${name} ${detail}`);
    }
  }

  // 1. No configured provider for a capability -> NOT_CONFIGURED, ok:false
  {
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: new NeverConfiguredProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE),
      [PROVIDER_FAMILY.GEMINI]: new NeverConfiguredProvider(PROVIDER_FAMILY.GEMINI),
    });
    const result = await router.route({
      capability: AI_CAPABILITY.FAST_CLASSIFICATION,
      systemPrompt: "sys",
      userPrompt: "user",
    });
    check(
      "1. Zero configured providers -> ok:false, NOT_CONFIGURED",
      result.ok === false && result.attempts.every((a) => a.errorType === GATEWAY_ERROR_TYPE.NOT_CONFIGURED),
      JSON.stringify(result)
    );
  }

  // 2. First candidate unconfigured, second configured -> falls through and succeeds
  {
    const okProvider = new AlwaysConfiguredOkProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, "hello-from-fallback");
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: okProvider,
      [PROVIDER_FAMILY.GEMINI]: new NeverConfiguredProvider(PROVIDER_FAMILY.GEMINI),
    });
    const result = await router.route({
      capability: AI_CAPABILITY.FAST_CLASSIFICATION, // chain: GPT_5_NANO, GEMINI_FLASH, GPT_5_MINI
      systemPrompt: "sys",
      userPrompt: "user",
    });
    check(
      "2. Skips unconfigured Gemini candidate, succeeds on OpenAI-compatible candidate",
      result.ok === true && result.text === "hello-from-fallback" && result.provider === PROVIDER_FAMILY.OPENAI_COMPATIBLE,
      JSON.stringify(result)
    );
  }

  // 3. Transient error retried once per candidate, then falls through to next candidate
  {
    const flakyOpenAI = new FailsNTimesThenSucceedsProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, 99, "unused");
    const okGemini = new AlwaysConfiguredOkProvider(PROVIDER_FAMILY.GEMINI, "gemini-succeeded");
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: flakyOpenAI,
      [PROVIDER_FAMILY.GEMINI]: okGemini,
    });
    const result = await router.route({
      capability: AI_CAPABILITY.CLAIM_EXTRACTION, // chain: GPT_5_MINI(openai), GEMINI_FLASH(gemini), GPT_5_1(openai)
      systemPrompt: "sys",
      userPrompt: "user",
    });
    check(
      "3. First OpenAI candidate retried exactly once (2 attempts) before moving to Gemini candidate",
      result.ok === true &&
        result.provider === PROVIDER_FAMILY.GEMINI &&
        result.attempts.filter((a) => a.provider === PROVIDER_FAMILY.OPENAI_COMPATIBLE && !a.ok).length === 2,
      JSON.stringify(result.attempts)
    );
  }

  // 4. Whole chain exhausted -> ok:false with last error preserved
  {
    const failingOpenAI = new AlwaysFailsProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, GATEWAY_ERROR_TYPE.HTTP_ERROR);
    const failingGemini = new AlwaysFailsProvider(PROVIDER_FAMILY.GEMINI, GATEWAY_ERROR_TYPE.NETWORK_ERROR);
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: failingOpenAI,
      [PROVIDER_FAMILY.GEMINI]: failingGemini,
    });
    const result = await router.route({
      capability: AI_CAPABILITY.MULTIMODAL, // chain: GEMINI_FLASH(gemini), GPT_5_MINI(openai)
      systemPrompt: "sys",
      userPrompt: "user",
    });
    check(
      "4. Entire fallback chain exhausted -> ok:false, no exception thrown",
      result.ok === false && typeof result.errorMessage === "string",
      JSON.stringify(result)
    );
  }

  // 5. AIGatewayService.generateText happy path via injected router
  {
    const okProvider = new AlwaysConfiguredOkProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, "plain text result");
    const router = new ModelRouter({ [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: okProvider });
    const result = await AIGatewayService.generateText({
      capability: AI_CAPABILITY.DEEP_REASONING,
      systemPrompt: "sys",
      userPrompt: "user",
      options: { router },
    });
    check(
      "5. AIGatewayService.generateText returns normalized ok result",
      result.ok === true && result.text === "plain text result" && result.schemaVersion === "ai-gateway-v1",
      JSON.stringify(result)
    );
  }

  // 6. AIGatewayService.generateStructured — valid JSON + passing validator
  {
    const jsonProvider = new AlwaysConfiguredOkProvider(
      PROVIDER_FAMILY.OPENAI_COMPATIBLE,
      JSON.stringify({ classification: "BENIGN", reason: "no threat indicators" })
    );
    const router = new ModelRouter({ [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: jsonProvider });
    const result = await AIGatewayService.generateStructured({
      capability: AI_CAPABILITY.CLAIM_EXTRACTION,
      systemPrompt: "sys",
      userPrompt: "user",
      validate: (j) => typeof j.classification === "string" && typeof j.reason === "string",
      options: { router },
    });
    check(
      "6. generateStructured parses valid JSON and passes validation",
      result.ok === true && result.json.classification === "BENIGN",
      JSON.stringify(result)
    );
  }

  // 7. AIGatewayService.generateStructured — malformed JSON -> INVALID_JSON, not thrown
  {
    const badJsonProvider = new AlwaysConfiguredOkProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE, "not-json-at-all{{{");
    const router = new ModelRouter({ [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: badJsonProvider });
    const result = await AIGatewayService.generateStructured({
      capability: AI_CAPABILITY.CLAIM_EXTRACTION,
      systemPrompt: "sys",
      userPrompt: "user",
      options: { router },
    });
    check(
      "7. generateStructured handles malformed JSON gracefully",
      result.ok === false && result.errorType === GATEWAY_ERROR_TYPE.INVALID_JSON,
      JSON.stringify(result)
    );
  }

  // 8. AIGatewayService.generateStructured — valid JSON but fails schema validator
  {
    const wrongShapeProvider = new AlwaysConfiguredOkProvider(
      PROVIDER_FAMILY.OPENAI_COMPATIBLE,
      JSON.stringify({ unexpected: "shape" })
    );
    const router = new ModelRouter({ [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: wrongShapeProvider });
    const result = await AIGatewayService.generateStructured({
      capability: AI_CAPABILITY.CLAIM_EXTRACTION,
      systemPrompt: "sys",
      userPrompt: "user",
      validate: (j) => typeof j.classification === "string",
      options: { router },
    });
    check(
      "8. generateStructured rejects schema-invalid JSON without throwing",
      result.ok === false && result.errorType === GATEWAY_ERROR_TYPE.INVALID_JSON,
      JSON.stringify(result)
    );
  }

  // 9. describeRoute never triggers a network call and reports configured=false correctly
  {
    const router = new ModelRouter({
      [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: new NeverConfiguredProvider(PROVIDER_FAMILY.OPENAI_COMPATIBLE),
      [PROVIDER_FAMILY.GEMINI]: new AlwaysConfiguredOkProvider(PROVIDER_FAMILY.GEMINI, "unused"),
    });
    const route = router.describeRoute(AI_CAPABILITY.MULTIMODAL);
    const geminiEntry = route.find((r) => r.provider === PROVIDER_FAMILY.GEMINI);
    const openaiEntry = route.find((r) => r.provider === PROVIDER_FAMILY.OPENAI_COMPATIBLE);
    check(
      "9. describeRoute reports per-candidate configured status without calling generate()",
      Array.isArray(route) && geminiEntry?.configured === true && openaiEntry?.configured === false,
      JSON.stringify(route)
    );
  }

  // 10. Capability with no routes configured (EMBEDDING) -> ok:false NOT_CONFIGURED, no throw
  {
    const router = new ModelRouter();
    const result = await router.route({
      capability: AI_CAPABILITY.EMBEDDING,
      systemPrompt: "sys",
      userPrompt: "user",
    });
    check(
      "10. Unrouted capability (EMBEDDING) returns NOT_CONFIGURED instead of throwing",
      result.ok === false && result.errorType === GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
      JSON.stringify(result)
    );
  }

  const total = passed + failed;
  const accuracy = ((passed / total) * 100).toFixed(1);

  console.log("\n======================================================================");
  console.log("🎯 AI GATEWAY FINAL EVALUATION SUMMARY");
  console.log("======================================================================");
  console.log(`Total Test Scenarios Evaluated : ${total}`);
  console.log(`Passed                         : ${passed} / ${total}`);
  console.log(`Failed                         : ${failed}`);
  console.log(`Overall Accuracy               : ${accuracy}%`);
  console.log("======================================================================\n");

  return { passed, failed, total, accuracy };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith("ai_gateway_router.test.mjs")) {
  runAIGatewayTestSuite().then(({ failed }) => {
    if (failed > 0) process.exit(1);
    else process.exit(0);
  });
}

export { runAIGatewayTestSuite };
