import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ModelRouter } from '../../src/lib/ai-gateway/ModelRouter.js';
import { PROVIDER_FAMILY, AI_CAPABILITY } from '../../src/lib/ai-gateway/types.js';

class MockGeminiProvider {
  constructor(behaviorMap = {}) {
    this.behaviorMap = behaviorMap;
    this.invokedModels = [];
  }

  isConfigured() {
    return true;
  }

  validateModel() {
    return { valid: true, compatible: true };
  }

  async generate({ catalogEntry }) {
    this.invokedModels.push(catalogEntry.model);
    const behavior = this.behaviorMap[catalogEntry.model];
    if (!behavior || behavior.status === 'SUCCESS') {
      return {
        text: JSON.stringify({ verdict: 'FALSE', confidence: 0.95, citations: [] }),
        httpStatus: 200,
        providerErrorCode: null,
      };
    }
    if (behavior.status === '429') {
      const err = new Error('Resource exhausted');
      err.httpStatus = 429;
      err.providerErrorCode = 'RESOURCE_EXHAUSTED';
      throw err;
    }
    if (behavior.status === '503') {
      const err = new Error('Model high demand');
      err.httpStatus = 503;
      err.providerErrorCode = 'HIGH_DEMAND';
      throw err;
    }
    if (behavior.status === 'TIMEOUT') {
      const err = new Error('Attempt timed out');
      err.name = 'TimeoutError';
      throw err;
    }
    const err = new Error(behavior.status);
    err.httpStatus = 500;
    throw err;
  }
}

test('P26 Scenario A: 3.8 SUCCESS selects 3.8', async () => {
  const provider = new MockGeminiProvider({ 'gemini-3.8-flash': { status: 'SUCCESS' } });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const res = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: 'sys',
    userPrompt: 'user',
    resultPriority: 'DEMO',
  });
  assert.equal(res.ok, true);
  assert.equal(res.executedModel, 'gemini-3.8-flash');
  assert.deepEqual(provider.invokedModels, ['gemini-3.8-flash']);
});

test('P26 Scenario B: 3.8 429 -> 3.7 SUCCESS selects 3.7', async () => {
  const provider = new MockGeminiProvider({
    'gemini-3.8-flash': { status: '429' },
    'gemini-3.7-flash': { status: 'SUCCESS' },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const res = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: 'sys',
    userPrompt: 'user',
    resultPriority: 'DEMO',
  });
  assert.equal(res.ok, true);
  assert.equal(res.executedModel, 'gemini-3.7-flash');
  assert.deepEqual(provider.invokedModels, ['gemini-3.8-flash', 'gemini-3.7-flash']);
});

test('P26 Scenario C: 3.8 429, 3.7 503 -> 3.6 SUCCESS selects 3.6', async () => {
  const provider = new MockGeminiProvider({
    'gemini-3.8-flash': { status: '429' },
    'gemini-3.7-flash': { status: '503' },
    'gemini-3.6-flash': { status: 'SUCCESS' },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const res = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: 'sys',
    userPrompt: 'user',
    resultPriority: 'DEMO',
  });
  assert.equal(res.ok, true);
  assert.equal(res.executedModel, 'gemini-3.6-flash');
  assert.deepEqual(provider.invokedModels, ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash']);
});

test('P26 Scenario D: 3.8, 3.7, 3.6 fail -> fallback to 3.5 Flash', async () => {
  const provider = new MockGeminiProvider({
    'gemini-3.8-flash': { status: '429' },
    'gemini-3.7-flash': { status: '503' },
    'gemini-3.6-flash': { status: 'TIMEOUT' },
    'gemini-3.5-flash': { status: 'SUCCESS' },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const res = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: 'sys',
    userPrompt: 'user',
    resultPriority: 'DEMO',
  });
  assert.equal(res.ok, true);
  assert.equal(res.executedModel, 'gemini-3.5-flash');
  assert.equal(res.qaExtendedFallback, true);
});

test('P26 Scenario E: 3.8–3.5 unavailable -> selects 3.5 Flash-Lite', async () => {
  const provider = new MockGeminiProvider({
    'gemini-3.8-flash': { status: '429' },
    'gemini-3.7-flash': { status: '503' },
    'gemini-3.6-flash': { status: 'TIMEOUT' },
    'gemini-3.5-flash': { status: '503' },
    'gemini-3.5-flash-lite': { status: 'SUCCESS' },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const res = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: 'sys',
    userPrompt: 'user',
    resultPriority: 'DEMO',
  });
  assert.equal(res.ok, true);
  assert.equal(res.executedModel, 'gemini-3.5-flash-lite');
});

test('P26 Scenario F: all except 3.1-lite fail -> selects 3.1 Flash-Lite', async () => {
  const provider = new MockGeminiProvider({
    'gemini-3.8-flash': { status: '429' },
    'gemini-3.7-flash': { status: '503' },
    'gemini-3.6-flash': { status: 'TIMEOUT' },
    'gemini-3.5-flash': { status: '503' },
    'gemini-3.5-flash-lite': { status: '429' },
    'gemini-3.1-flash-lite': { status: 'SUCCESS' },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const res = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: 'sys',
    userPrompt: 'user',
    resultPriority: 'DEMO',
  });
  assert.equal(res.ok, true);
  assert.equal(res.executedModel, 'gemini-3.1-flash-lite');
});

test('P26 Scenario G: all fail -> clean failure trace, no crash', async () => {
  const provider = new MockGeminiProvider({
    'gemini-3.8-flash': { status: '429' },
    'gemini-3.7-flash': { status: '503' },
    'gemini-3.6-flash': { status: 'TIMEOUT' },
    'gemini-3.5-flash': { status: '503' },
    'gemini-3.5-flash-lite': { status: '429' },
    'gemini-3.1-flash-lite': { status: '503' },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const res = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: 'sys',
    userPrompt: 'user',
    resultPriority: 'DEMO',
  });
  assert.equal(res.ok, false);
  assert.equal(res.attempts.length, 6);
});

test('P26 Dynamic Order: dead 3.8 and 3.7 are skipped immediately when cooling down', async () => {
  const provider = new MockGeminiProvider({
    'gemini-3.6-flash': { status: 'SUCCESS' },
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  // Record cooldown for 3.8 and 3.7
  router.healthStore.recordFailure({
    provider: PROVIDER_FAMILY.GEMINI,
    model: 'gemini-3.8-flash',
    result: 'RATE_LIMITED',
    httpStatus: 429,
    dailyQuotaExhausted: true,
  });
  router.healthStore.recordFailure({
    provider: PROVIDER_FAMILY.GEMINI,
    model: 'gemini-3.7-flash',
    result: 'HIGH_DEMAND',
    httpStatus: 503,
  });
  // Record recent success for 3.6
  router.healthStore.recordSuccess(PROVIDER_FAMILY.GEMINI, 'gemini-3.6-flash', { latencyMs: 2100 });

  const res = await router.route({
    capability: AI_CAPABILITY.DEEP_REASONING,
    systemPrompt: 'sys',
    userPrompt: 'user',
    resultPriority: 'DEMO',
  });

  assert.equal(res.ok, true);
  assert.equal(res.executedModel, 'gemini-3.6-flash');
  // 3.6 was attempted directly first without wasting time on 3.8 and 3.7
  assert.deepEqual(provider.invokedModels, ['gemini-3.6-flash']);
});
