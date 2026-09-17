import assert from "node:assert/strict";
import test from "node:test";
import { GeminiProvider } from "../../src/lib/ai-gateway/providers/GeminiProvider.js";
import { ModelRouter } from "../../src/lib/ai-gateway/ModelRouter.js";
import { AI_CAPABILITY, PROVIDER_FAMILY } from "../../src/lib/ai-gateway/types.js";

test("Gemini requires the existing canonical GEMINI_API_KEY", () => {
  const provider = new GeminiProvider({
    env: { GEMINI_KEY_1: "must-not-be-used" },
    fetchImpl: async () => { throw new Error("network must not be called"); },
  });
  assert.equal(provider.isConfigured(), false);
});

test("Gemini sends only the canonical key and the catalog model wins over environment model text", async () => {
  let sentKey = "";
  let requestBody;
  const provider = new GeminiProvider({
    env: {
      GEMINI_API_KEY: "canonical-key",
      GEMINI_KEY_1: "must-not-be-used",
      GEMINI_MODEL: "configured-model",
    },
    fetchImpl: async (_url, options) => {
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
    catalogEntry: { model: "gemini-3.8-flash", supportsJsonMode: true },
    systemPrompt: "system",
    userPrompt: "user",
  });
  assert.equal(sentKey, "canonical-key");
  assert.equal(requestBody.model, "gemini-3.8-flash");
  assert.equal(requestBody.system_instruction, "system");
  assert.equal(requestBody.input, "user");
  assert.equal(requestBody.store, false);
});

test("key-like aliases never appear in router telemetry", async () => {
  const provider = new GeminiProvider({
    env: { GEMINI_API_KEY: "secret-canonical", GEMINI_KEY_1: "secret-alias" },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: { get: () => "" },
      arrayBuffer: async () => new TextEncoder().encode(JSON.stringify({ output_text: "ok" })).buffer,
    }),
  });
  const router = new ModelRouter({ [PROVIDER_FAMILY.GEMINI]: provider });
  const result = await router.route({ capability: AI_CAPABILITY.DEEP_REASONING, systemPrompt: "system", userPrompt: "user" });
  assert.equal(result.ok, true);
  assert.equal(result.attempts[0].providerErrorCode, null);
  assert.equal(JSON.stringify(result).includes("secret-canonical"), false);
  assert.equal(JSON.stringify(result).includes("secret-alias"), false);
  assert.equal(Object.hasOwn(result, "credentialAlias"), false);
});

