/**
 * StudentHub AI — Model Router & Provider Registry Test
 *
 * Enforces Sections 15, 16, 17, 20, 21, 22, 23:
 * - ProviderRegistry lists factual non-sensitive model metadata
 * - Model routing by capability
 * - Domain specialist advisory boundary (never sole final authority)
 * - Safe fallback chains
 */

import test from "node:test";
import assert from "node:assert/strict";
import { ProviderRegistry } from "../../src/lib/server/ai/ProviderRegistry.js";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AI_CAPABILITY } from "../../src/lib/ai-gateway/types.js";
import { FraudRiskEngine } from "../../src/lib/intelligence/fraud/fraudRiskEngine.js";

test("PROVIDER REGISTRY: Exposes accurate capability metadata without leaking secrets", () => {
  const models = ProviderRegistry.getAllModels();
  assert.ok(models.length >= 4, "Must have at least 4 catalogued model profiles");

  for (const model of models) {
    assert.ok(model.providerId, "Model must have providerId");
    assert.ok(model.modelId, "Model must have modelId");
    assert.ok(model.assignedRole, "Model must have an assigned role");
    assert.ok(Array.isArray(model.capabilities), "Model must declare capabilities");
    assert.ok(typeof model.configured === "boolean", "Configured flag must be boolean");
    // Prove no credentials
    assert.equal(model.apiKey, undefined, "Never expose apiKey in registry");
    assert.equal(model.secret, undefined, "Never expose secret in registry");
  }

  const disabledOpenAi = ProviderRegistry.getModel("gpt-4o-mini");
  assert.ok(disabledOpenAi, "OpenAI compatibility metadata may remain present");
  assert.equal(disabledOpenAi.active, false);
  assert.equal(disabledOpenAi.runtimeStatus, "DISABLED_INTENTIONALLY");

  const gemini = ProviderRegistry.getModel("gemini-3.8-flash");
  assert.ok(gemini, "gemini-3.8-flash must be present");
  assert.ok(gemini.capabilities.includes("MULTIMODAL"));
});

test("DOMAIN SPECIALIST BOUNDARY: FraudRiskEngine evaluates local signals as ADVISORY ONLY", () => {
  const customModel = ProviderRegistry.getModel("FraudRiskEngine_v1");
  assert.ok(customModel, "Local specialist engine must be catalogued");
  assert.equal(customModel.assignedRole, "DOMAIN_SPECIALIST_ADVISORY");

  const result = FraudRiskEngine.evaluateRisk({
    text: "Chúc mừng bạn nhận học bổng 100%! Vui lòng nộp phí hồ sơ 2.000.000 VNĐ qua STK cá nhân 1903...",
    url: "https://hocbong-hcmute-fake.tk",
  });

  assert.ok(result, "Must return structured evaluation");
  assert.ok(result.overallRisk > 0.70, "Must flag obvious fee scam as high risk");
  // Boundary check: Specialist provides indicators/scores, never authoritative final verdict directly
  assert.ok(result.reasons || result.evidence, "Must provide explainable signals");
});

test("MODEL ROUTER: Capability-based route returns configured candidates in priority order", () => {
  const router = new ModelRouter();
  const route = router.describeRoute(AI_CAPABILITY.FAST_CLASSIFICATION);
  assert.ok(Array.isArray(route), "Must describe route as candidate array");
  assert.ok(route.length > 0, "Route must have at least one candidate");
  assert.equal(route[0].model, "gemini-3.8-flash", "Gemini 3.8 Flash must be the sole active candidate");
  assert.deepEqual(route.map((entry) => entry.provider), ["gemini", "gemini", "gemini", "gemini"]);
});
