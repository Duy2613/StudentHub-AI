import assert from "node:assert/strict";
import test from "node:test";
import { OpenAICompatibleProvider } from "../../src/lib/ai-gateway/providers/OpenAICompatibleProvider.js";

test("OpenAI compatibility adapter is intentionally disabled by default", () => {
  const provider = new OpenAICompatibleProvider({
    env: { OPEN_AI_KEY_1: "test-only-placeholder", OPENAI_API_KEY: "fallback-placeholder" },
    fetchImpl: async () => { throw new Error("OpenAI network must not be called"); },
  });
  assert.equal(provider.isConfigured(), false);
});

test("OpenAI compatibility adapter is unconfigured without a key or enabled runtime", () => {
  const provider = new OpenAICompatibleProvider({ env: {}, fetchImpl: async () => null });
  assert.equal(provider.isConfigured(), false);
});

test("disabled OpenAI generate fails closed before fetch", async () => {
  let fetchCalls = 0;
  const provider = new OpenAICompatibleProvider({
    env: { OPENAI_API_KEY: "test-only-placeholder" },
    fetchImpl: async () => {
      fetchCalls += 1;
      return null;
    },
  });

  await assert.rejects(
    provider.generate({ catalogEntry: { model: "gpt-4o-mini" }, systemPrompt: "system", userPrompt: "user" }),
    (error) => error?.gatewayErrorType === "NOT_CONFIGURED"
  );
  assert.equal(fetchCalls, 0);
});
