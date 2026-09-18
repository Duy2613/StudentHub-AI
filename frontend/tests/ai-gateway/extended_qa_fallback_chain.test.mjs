/**
 * AI Gateway — Extended Lower-Tier QA Fallback Chain Test Suite
 *
 * Verifies:
 * - Extended model catalog & metadata
 * - Server-owned QA feature gate (ALLOW_QA_EXTENDED_MODEL_FALLBACK)
 * - Capability admission & route resolution
 * - Ordered fallback (3.8 -> 3.7 -> 3.6 -> 3.5 -> 3.5-lite -> 3.1-lite -> deterministic fallback)
 * - Lightweight capability routing (3.5-lite -> 3.1-lite -> 3.5 -> 3.8 -> 3.7 -> 3.6)
 * - Health-aware ~0ms skip & daily quota cooldown
 * - Schema quality floor validation
 * - Academic Timetable & Trust L4 integration with model provenance
 */

import test from "node:test";
import assert from "node:assert/strict";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AIGatewayService } from "../../src/lib/ai-gateway/AIGatewayService.js";
import { AI_CAPABILITY, PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../../src/lib/ai-gateway/types.js";
import { IModelProvider } from "../../src/lib/ai-gateway/providers/IModelProvider.js";
import { ModelHealthStore } from "../../src/lib/ai-gateway/ModelHealthStore.js";
import {
  GEMINI_PRODUCTION_MODEL_IDS,
  GEMINI_EXTENDED_QA_MODEL_IDS,
  RETIRED_GEMINI_MODEL_IDS,
  isQaExtendedFallbackEnabled,
  isQaExtendedGeminiModel,
  isApprovedGeminiProductionModel,
  validateGeminiModelIdentifier,
  validateGeminiProductionRoute,
  validateGeminiExtendedQaRoute,
} from "../../src/lib/ai-gateway/config/GeminiModelCatalog.js";
import {
  AI_GATEWAY_CONFIG,
  GEMINI_PRODUCTION_CHAIN_ENTRY_IDS,
  GEMINI_EXTENDED_QA_CHAIN_ENTRY_IDS,
  resolveCapabilityRoute,
  validateCatalogModelEntry,
} from "../../src/lib/ai-gateway/config/AIGatewayConfig.js";
import { TimetableVisionExtractor } from "../../src/lib/server/academic/TimetableVisionExtractor.js";
import { AIGatewayReasoningProvider } from "../../src/lib/ai-trust/layer4/providers/AIGatewayReasoningProvider.js";

const MODEL_3_8 = "gemini-3.8-flash";
const MODEL_3_7 = "gemini-3.7-flash";
const MODEL_3_6 = "gemini-3.6-flash";
const MODEL_3_5 = "gemini-3.5-flash";
const MODEL_3_5_LITE = "gemini-3.5-flash-lite";
const MODEL_3_1_LITE = "gemini-3.1-flash-lite";

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
  return error;
}

class FakeMultiModelProvider extends IModelProvider {
  constructor({ behavior = {}, responseByModel = {} } = {}) {
    super(PROVIDER_FAMILY.GEMINI);
    this.behavior = { ...behavior };
    this.responseByModel = { ...responseByModel };
    this.calls = [];
  }

  isConfigured() {
    return true;
  }

  validateModel(catalogEntry, { allowQaExtended = false } = {}) {
    return validateGeminiModelIdentifier(catalogEntry?.model, { allowGemmaShadow: false, allowQaExtended });
  }

  async generate({ catalogEntry }) {
    const model = catalogEntry.model;
    this.calls.push(model);
    const failure = this.behavior[model];
    if (failure) throw makeFailure(failure);
    const text = this.responseByModel[model] || JSON.stringify({
      verdictSignal: "UNCERTAIN",
      supportReasons: ["Lý do hợp lệ"],
      contradictionReasons: [],
      missingEvidence: [],
      uncertainty: "Độ tin cậy vừa phải",
      citationsUsed: [],
      provider: "google",
      model,
    });
    return { text, transport: "interactions", thinkingLevel: "low", httpStatus: 200 };
  }
}

test("1. Model Catalog: declares all required metadata fields for primary and extended QA tiers", () => {
  assert.deepEqual([...GEMINI_PRODUCTION_MODEL_IDS], [MODEL_3_8, MODEL_3_7, MODEL_3_6]);
  assert.deepEqual([...GEMINI_EXTENDED_QA_MODEL_IDS], [MODEL_3_5, MODEL_3_5_LITE, MODEL_3_1_LITE]);
  assert.equal(RETIRED_GEMINI_MODEL_IDS.includes("gemini-2.5-flash"), true);

  const allEntries = [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS, ...GEMINI_EXTENDED_QA_CHAIN_ENTRY_IDS];
  for (const entryId of allEntries) {
    const entry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
    assert.ok(entry, `Entry ${entryId} must exist in MODEL_CATALOG`);
    assert.equal(entry.provider, PROVIDER_FAMILY.GEMINI);
    assert.equal(typeof entry.model, "string");
    assert.equal(entry.active, true);
    assert.ok(["PRIMARY", "EXTENDED_QA"].includes(entry.productionTier));
    assert.equal(entry.qaFallbackEligible, true);
    assert.ok(Array.isArray(entry.capabilities) && entry.capabilities.length > 0);
    assert.equal(entry.supportsImageInput, true);
    assert.equal(entry.supportsStructuredOutput, true);
    assert.equal(typeof entry.priority, "number");
    assert.ok(["HIGH", "MEDIUM", "LIGHT"].includes(entry.strengthClass));
    assert.ok(["LOW", "VERY_LOW"].includes(entry.costClass));
    assert.ok(["MEDIUM", "FAST", "ULTRA_FAST"].includes(entry.latencyClass));
    assert.ok(entry.cooldownPolicy && entry.cooldownPolicy.baseCooldownMs > 0);
    assert.equal(typeof entry.admittedAt, "string");
    assert.equal(entry.probeStatus, "PROVEN");
  }
});

test("2. QA-only gate: extended models reject in production mode and admit under QA flag", () => {
  // Gate closed (production)
  for (const model of GEMINI_EXTENDED_QA_MODEL_IDS) {
    const validation = validateGeminiModelIdentifier(model, { allowQaExtended: false });
    assert.equal(validation.valid, false);
    assert.equal(validation.code, "QA_EXTENDED_GATE_REQUIRED");
  }

  // Gate open (QA mode)
  for (const model of GEMINI_EXTENDED_QA_MODEL_IDS) {
    const validation = validateGeminiModelIdentifier(model, { allowQaExtended: true });
    assert.equal(validation.valid, true);
    assert.equal(validation.code, "MODEL_IDENTIFIER_VALID_QA_EXTENDED");
    assert.equal(validation.qaExtended, true);
  }

  // Primary models are always valid
  for (const model of GEMINI_PRODUCTION_MODEL_IDS) {
    const validation = validateGeminiModelIdentifier(model, { allowQaExtended: false });
    assert.equal(validation.valid, true);
    assert.equal(validation.production, true);
  }
});

test("3. Route resolution: production returns 3 models; QA returns full capability-ordered chains", () => {
  // Production routes
  const prodMultimodal = resolveCapabilityRoute(AI_CAPABILITY.MULTIMODAL, { allowQaExtended: false });
  assert.deepEqual(prodMultimodal, ["GEMINI_3_8_FLASH", "GEMINI_3_7_FLASH", "GEMINI_3_6_FLASH"]);

  // QA Multimodal chain
  const qaMultimodal = resolveCapabilityRoute(AI_CAPABILITY.MULTIMODAL, { allowQaExtended: true });
  assert.deepEqual(qaMultimodal, [
    "GEMINI_3_8_FLASH",
    "GEMINI_3_7_FLASH",
    "GEMINI_3_6_FLASH",
    "GEMINI_3_5_FLASH",
    "GEMINI_3_5_FLASH_LITE",
    "GEMINI_3_1_FLASH_LITE",
  ]);

  // QA Lightweight simple extraction chain (cheaper models earlier)
  const qaSimple = resolveCapabilityRoute(AI_CAPABILITY.FAST_CLASSIFICATION, { allowQaExtended: true });
  assert.deepEqual(qaSimple, [
    "GEMINI_3_5_FLASH_LITE",
    "GEMINI_3_1_FLASH_LITE",
    "GEMINI_3_5_FLASH",
    "GEMINI_3_8_FLASH",
    "GEMINI_3_7_FLASH",
    "GEMINI_3_6_FLASH",
  ]);
});

test("4. CASE A: 3.8 healthy executes without fallback (qaExtendedFallback=false)", async () => {
  const provider = new FakeMultiModelProvider();
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const result = await router.route({
    capability: AI_CAPABILITY.MULTIMODAL,
    userPrompt: "test",
    allowQaExtended: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_8);
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.qaExtendedFallback, false);
  assert.deepEqual(provider.calls, [MODEL_3_8]);
});

test("5. CASE B & C: Primary failovers to 3.7 and 3.6 (qaExtendedFallback=false)", async () => {
  const provider = new FakeMultiModelProvider({
    behavior: { [MODEL_3_8]: "429", [MODEL_3_7]: "503" },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const result = await router.route({
    capability: AI_CAPABILITY.MULTIMODAL,
    userPrompt: "test",
    allowQaExtended: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_6);
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.qaExtendedFallback, false);
  assert.deepEqual(provider.calls, [MODEL_3_8, MODEL_3_7, MODEL_3_6]);
});

test("6. CASE D: 3.8 + 3.7 + 3.6 unavailable -> 3.5 Flash executes (qaExtendedFallback=true)", async () => {
  const provider = new FakeMultiModelProvider({
    behavior: { [MODEL_3_8]: "429", [MODEL_3_7]: "429", [MODEL_3_6]: "429" },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const result = await router.route({
    capability: AI_CAPABILITY.MULTIMODAL,
    userPrompt: "test",
    allowQaExtended: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_5);
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.qaExtendedFallback, true);
  assert.deepEqual(provider.calls, [MODEL_3_8, MODEL_3_7, MODEL_3_6, MODEL_3_5]);
});

test("7. CASE E: higher Flash models unavailable -> 3.5 Flash-Lite executes", async () => {
  const provider = new FakeMultiModelProvider({
    behavior: { [MODEL_3_8]: "429", [MODEL_3_7]: "429", [MODEL_3_6]: "429", [MODEL_3_5]: "503" },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const result = await router.route({
    capability: AI_CAPABILITY.MULTIMODAL,
    userPrompt: "test",
    allowQaExtended: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_5_LITE);
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.qaExtendedFallback, true);
  assert.deepEqual(provider.calls, [MODEL_3_8, MODEL_3_7, MODEL_3_6, MODEL_3_5, MODEL_3_5_LITE]);
});

test("8. CASE F: all above unavailable -> 3.1 Flash-Lite executes", async () => {
  const provider = new FakeMultiModelProvider({
    behavior: {
      [MODEL_3_8]: "429",
      [MODEL_3_7]: "429",
      [MODEL_3_6]: "429",
      [MODEL_3_5]: "503",
      [MODEL_3_5_LITE]: "429",
    },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const result = await router.route({
    capability: AI_CAPABILITY.MULTIMODAL,
    userPrompt: "test",
    allowQaExtended: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_1_LITE);
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.qaExtendedFallback, true);
  assert.deepEqual(provider.calls, [MODEL_3_8, MODEL_3_7, MODEL_3_6, MODEL_3_5, MODEL_3_5_LITE, MODEL_3_1_LITE]);
});

test("9. CASE G: all eligible models fail -> returns clean failure trace without crash", async () => {
  const provider = new FakeMultiModelProvider({
    behavior: {
      [MODEL_3_8]: "503",
      [MODEL_3_7]: "503",
      [MODEL_3_6]: "503",
      [MODEL_3_5]: "503",
      [MODEL_3_5_LITE]: "503",
      [MODEL_3_1_LITE]: "503",
    },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const result = await router.route({
    capability: AI_CAPABILITY.MULTIMODAL,
    userPrompt: "test",
    allowQaExtended: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.attempts.length, 6);
  assert.equal(result.qaExtendedFallback, true);
  assert.equal(result.providerStatus, "SERVICE_UNAVAILABLE");
});

test("10. Health-aware circuit breaker: cooling models skip in ~0ms", async () => {
  const provider = new FakeMultiModelProvider();
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });

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
    result: "RATE_LIMITED",
    httpStatus: 429,
    retryAfterMs: 60_000,
  });
  router.healthStore.recordFailure({
    provider: PROVIDER_FAMILY.GEMINI,
    model: MODEL_3_6,
    result: "RATE_LIMITED",
    httpStatus: 429,
    retryAfterMs: 60_000,
  });

  const result = await router.route({
    capability: AI_CAPABILITY.MULTIMODAL,
    userPrompt: "test",
    allowQaExtended: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_5);
  // Attempts 0, 1, 2 must have durationMs = 0 (skipped in 0ms)
  assert.equal(result.attempts[0].result, "COOLDOWN");
  assert.equal(result.attempts[0].durationMs, 0);
  assert.equal(result.attempts[1].result, "COOLDOWN");
  assert.equal(result.attempts[1].durationMs, 0);
  assert.equal(result.attempts[2].result, "COOLDOWN");
  assert.equal(result.attempts[2].durationMs, 0);
  assert.equal(result.attempts[3].model, MODEL_3_5);
  assert.equal(result.attempts[3].result, "SUCCESS");
});

test("11. Schema quality floor: invalid JSON advances to next candidate instead of accepting bad output", async () => {
  const provider = new FakeMultiModelProvider({
    responseByModel: {
      [MODEL_3_8]: "NOT_JSON_AT_ALL",
      [MODEL_3_7]: "{\"invalid_schema\": true}",
    },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const result = await router.route({
    capability: AI_CAPABILITY.MULTIMODAL,
    userPrompt: "test",
    parseResponse: (text) => JSON.parse(text),
    validateResponse: (json) => Boolean(json && json.verdictSignal),
    allowQaExtended: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.model, MODEL_3_6);
  assert.equal(result.attempts[0].result, "MODEL_INCOMPATIBLE");
  assert.equal(result.attempts[1].result, "MODEL_INCOMPATIBLE");
  assert.equal(result.attempts[2].result, "SUCCESS");
});

test("12. Academic Timetable Extractor: seamlessly uses extended QA fallback and manual fallback", async () => {
  // Sub-scenario 1: 3.8/3.7/3.6 down, 3.5-lite succeeds with timetable draft
  const provider = new FakeMultiModelProvider({
    behavior: { [MODEL_3_8]: "429", [MODEL_3_7]: "429", [MODEL_3_6]: "429", [MODEL_3_5]: "429" },
    responseByModel: {
      [MODEL_3_5_LITE]: JSON.stringify({
        timetableName: "TKB HK2",
        academicTerm: "2026-2027",
        warnings: [],
        entries: [{
          courseName: "Giải tích 1",
          courseCode: "MATH101",
          dayOfWeek: 2,
          startTime: "07:30",
          endTime: "09:30",
          periodStart: 1,
          periodEnd: 2,
          room: "B204",
          building: "B",
          lecturer: "TS. Nguyễn Văn A",
          classGroup: "CC01",
          weekRange: "1-15",
          notes: null,
          confidence: { courseName: 0.95, dayOfWeek: 0.99, time: 0.92, room: 0.88 },
        }],
      }),
    },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const customGateway = {
    generateStructured: (args) => AIGatewayService.generateStructured({ ...args, options: { ...(args.options || {}), router } }),
  };
  const extractor = new TimetableVisionExtractor({ gateway: customGateway });
  const res = await extractor.extract({
    bytes: Buffer.from("fake-image"),
    mimeType: "image/png",
    allowQaExtended: true,
  });

  assert.equal(res.success, true);
  assert.equal(res.importState, "DRAFT_READY");
  assert.equal(res.model, MODEL_3_5_LITE);
  assert.equal(res.fallbackUsed, true);
  assert.equal(res.qaExtendedFallback, true);
  assert.equal(res.draft.entries[0].courseName, "Giải tích 1");
  assert.equal(res.sourcePersisted, false);

  // Sub-scenario 2: All models down -> manual fallback cleanly returned
  const allDownProvider = new FakeMultiModelProvider({
    behavior: {
      [MODEL_3_8]: "503", [MODEL_3_7]: "503", [MODEL_3_6]: "503",
      [MODEL_3_5]: "503", [MODEL_3_5_LITE]: "503", [MODEL_3_1_LITE]: "503",
    },
  });
  const allDownRouter = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: allDownProvider });
  const allDownGateway = {
    generateStructured: (args) => AIGatewayService.generateStructured({ ...args, options: { ...(args.options || {}), router: allDownRouter } }),
  };
  const allDownExtractor = new TimetableVisionExtractor({ gateway: allDownGateway });
  const fallbackRes = await allDownExtractor.extract({
    bytes: Buffer.from("fake-image"),
    mimeType: "image/png",
    allowQaExtended: true,
  });

  assert.equal(fallbackRes.success, true);
  assert.equal(fallbackRes.importState, "MANUAL_FALLBACK");
  assert.equal(fallbackRes.fallbackUsed, true);
  assert.equal(fallbackRes.qaExtendedFallback, true);
  assert.equal(fallbackRes.draft.entries.length, 0);
});

test("13. Trust Layer 4: preserves deterministic policy authority and tags qaExtendedFallback", async () => {
  const provider = new FakeMultiModelProvider({
    behavior: { [MODEL_3_8]: "429", [MODEL_3_7]: "429", [MODEL_3_6]: "429" },
    responseByModel: {
      [MODEL_3_5]: JSON.stringify({
        verdictSignal: "SUPPORTS",
        supportReasons: ["Bằng chứng khớp với dữ liệu gốc"],
        contradictionReasons: [],
        missingEvidence: [],
        uncertainty: "Độ tin cậy cao",
        citationsUsed: [{ id: "c1", url: "https://hub.edu.vn/rules" }],
        provider: "google",
        model: MODEL_3_5,
      }),
    },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const customGateway = {
    generateStructured: (args) => AIGatewayService.generateStructured({ ...args, options: { ...(args.options || {}), router } }),
  };
  const l4Provider = new AIGatewayReasoningProvider({ gateway: customGateway });

  const fusedGraph = {
    canonicalUrl: "https://hub.edu.vn/rules",
    layer3Evidence: [{
      id: "ev1",
      sourceUrl: "https://hub.edu.vn/rules",
      title: "Quy định",
      excerpt: "Nội dung quy định",
    }],
  };

  const decision = await l4Provider.reason(fusedGraph, { allowQaExtended: true });

  assert.equal(decision.aiVerificationStatus, "VERIFIED");
  assert.equal(decision.aiExecutedModel, MODEL_3_5);
  assert.equal(decision.qaExtendedFallback, true);
  assert.equal(decision.aiVerification.model, MODEL_3_5);
  assert.equal(decision.aiVerification.provider, "google");
  assert.equal(decision.classification, "INSUFFICIENT_EVIDENCE"); // Preserves deterministic decision!
});
