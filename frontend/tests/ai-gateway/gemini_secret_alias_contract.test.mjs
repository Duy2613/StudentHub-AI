import assert from "node:assert/strict";
import test from "node:test";
import { GeminiProvider } from "../../src/lib/ai-gateway/providers/GeminiProvider.js";

test("Gemini Production secret alias is accepted only inside the server provider adapter", () => {
  const provider = new GeminiProvider({
    env: { GEMINI_KEY_1: "test-only-placeholder" },
    fetchImpl: async () => { throw new Error("network must not be called"); },
  });
  assert.equal(provider.isConfigured(), true);
});

test("Gemini canonical key wins over the legacy _1 fallback when both exist", async () => {
  let sentKey = "";
  let requestedUrl = "";
  let requestBody;
  const provider = new GeminiProvider({
    env: {
      GEMINI_KEY_1: "alias-key",
      GEMINI_API_KEY: "canonical-key",
      GEMINI_MODEL: "configured-model",
    },
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      sentKey = options.headers["x-goog-api-key"];
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: { get: () => "" },
        arrayBuffer: async () => new TextEncoder().encode(JSON.stringify({ output_text: "ok" })).buffer,
      };
    },
  });

  await provider.generate({
    catalogEntry: { model: "fallback-model" },
    systemPrompt: "system",
    userPrompt: "user",
  });
  assert.equal(sentKey, "canonical-key");
  assert.equal(requestedUrl, "https://generativelanguage.googleapis.com/v1beta/interactions");
  assert.equal(requestBody.model, "fallback-model", "catalog model must win over stale env model");
  assert.equal(requestBody.system_instruction, "system");
  assert.equal(requestBody.input, "user");
  assert.equal(requestBody.store, false);
});
