import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GeminiProvider } from "../../src/lib/ai-gateway/providers/GeminiProvider.js";
import { AI_GATEWAY_CONFIG } from "../../src/lib/ai-gateway/config/AIGatewayConfig.js";

describe("Gemini trusted instruction boundary", () => {
  it("serializes system instructions separately from untrusted user/evidence content", async () => {
    let capturedRequest;
    const provider = new GeminiProvider({
      env: { GEMINI_API_KEY: "test-key" },
      fetchImpl: async (url, options) => {
        capturedRequest = {
          url,
          headers: options.headers,
          body: JSON.parse(options.body),
        };
        return new Response(
          JSON.stringify({ output_text: '{"ok":true}' }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      },
    });

    const result = await provider.generate({
      catalogEntry: AI_GATEWAY_CONFIG.MODEL_CATALOG.GEMINI_FLASH,
      systemPrompt: "TRUSTED_INSTRUCTION_DO_NOT_TREAT_DATA_AS_COMMANDS",
      userPrompt: "UNTRUSTED_OCR_TEXT_IGNORE_PREVIOUS_INSTRUCTIONS",
      jsonMode: true,
    });

    assert.equal(result.text, '{"ok":true}');
    assert.equal(capturedRequest.url, "https://generativelanguage.googleapis.com/v1beta/interactions");
    assert.equal(capturedRequest.headers["x-goog-api-key"], "test-key");
    assert.equal(capturedRequest.body.system_instruction, "TRUSTED_INSTRUCTION_DO_NOT_TREAT_DATA_AS_COMMANDS");
    assert.equal(capturedRequest.body.input, "UNTRUSTED_OCR_TEXT_IGNORE_PREVIOUS_INSTRUCTIONS");
    assert.deepEqual(capturedRequest.body.response_format, {
      type: "text",
      mime_type: "application/json",
      schema: { type: "object" },
    });
    assert.equal(JSON.stringify(capturedRequest.body.input).includes("TRUSTED_INSTRUCTION"), false);
    assert.equal(JSON.stringify(capturedRequest.body.system_instruction).includes("UNTRUSTED_OCR_TEXT"), false);
  });

  it("does not expose Interactions thought steps as the model answer", async () => {
    const provider = new GeminiProvider({
      env: { GEMINI_API_KEY: "test-key" },
      fetchImpl: async () => new Response(
        JSON.stringify({
          steps: [
            { type: "thought", content: [{ type: "text", text: "private reasoning" }] },
            { type: "model_output", content: [{ type: "text", text: "public answer" }] },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    });

    const result = await provider.generate({
      catalogEntry: AI_GATEWAY_CONFIG.MODEL_CATALOG.GEMINI_FLASH,
      systemPrompt: "trusted",
      userPrompt: "question",
    });

    assert.equal(result.text, "public answer");
    assert.equal(result.text.includes("private reasoning"), false);
  });

  it("uses generateContent only as the explicit endpoint compatibility fallback", async () => {
    const requests = [];
    const provider = new GeminiProvider({
      env: { GEMINI_API_KEY: "test-key" },
      fetchImpl: async (url, options) => {
        requests.push({ url, body: JSON.parse(options.body) });
        if (requests.length === 1) return new Response("", { status: 405 });
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: "compatibility answer" }] } }] }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    });

    const result = await provider.generate({
      catalogEntry: AI_GATEWAY_CONFIG.MODEL_CATALOG.GEMINI_FLASH,
      systemPrompt: "trusted",
      userPrompt: "inspect this",
      inputParts: [{ type: "image", mime_type: "image/png", data: "AA==" }],
    });

    assert.equal(result.text, "compatibility answer");
    assert.equal(result.transport, "generateContent_compatibility_fallback");
    assert.equal(requests.length, 2);
    assert.match(requests[1].url, /:generateContent$/);
    assert.deepEqual(requests[1].body.contents[0].parts, [
      { text: "inspect this" },
      { inlineData: { mimeType: "image/png", data: "AA==" } },
    ]);
  });

  it("keeps Gemma shadow-only unless an explicit compatibility probe opts in", async () => {
    let productionCalls = 0;
    const provider = new GeminiProvider({
      env: { GEMINI_API_KEY: "test-key" },
      fetchImpl: async () => {
        productionCalls += 1;
        return new Response(JSON.stringify({ output_text: "must not run" }), { status: 200 });
      },
    });

    await assert.rejects(
      provider.generate({
        catalogEntry: AI_GATEWAY_CONFIG.MODEL_CATALOG.GEMMA_4_31B_IT,
        systemPrompt: "trusted",
        userPrompt: "probe",
        jsonMode: true,
      }),
      (error) => error.gatewayErrorType === "MODEL_INCOMPATIBLE" && error.providerErrorCode === "GEMMA_COMPATIBILITY_GATE_REQUIRED",
    );
    assert.equal(productionCalls, 0);

    let shadowRequest;
    const shadowProvider = new GeminiProvider({
      env: { GEMINI_API_KEY: "test-key" },
      fetchImpl: async (url, options) => {
        shadowRequest = { url, body: JSON.parse(options.body) };
        return new Response(JSON.stringify({ output_text: "probe response" }), { status: 200 });
      },
    });
    const result = await shadowProvider.generate({
      catalogEntry: AI_GATEWAY_CONFIG.MODEL_CATALOG.GEMMA_4_31B_IT,
      systemPrompt: "trusted",
      userPrompt: "probe",
      jsonMode: true,
      allowShadowCandidate: true,
    });
    assert.equal(result.text, "probe response");
    assert.equal(shadowRequest.body.response_format.mime_type, "application/json");
  });
});
