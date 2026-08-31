import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GeminiProvider } from "../../src/lib/ai-gateway/providers/GeminiProvider.js";
import { AI_GATEWAY_CONFIG } from "../../src/lib/ai-gateway/config/AIGatewayConfig.js";

describe("Gemini trusted instruction boundary", () => {
  it("serializes system instructions separately from untrusted user/evidence content", async () => {
    let capturedRequest;
    const provider = new GeminiProvider({
      env: { GEMINI_API_KEY: "test-key" },
      fetchImpl: async (_url, options) => {
        capturedRequest = {
          headers: options.headers,
          body: JSON.parse(options.body),
        };
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }),
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
    assert.equal(capturedRequest.headers["x-goog-api-key"], "test-key");
    assert.deepEqual(capturedRequest.body.systemInstruction, {
      parts: [{ text: "TRUSTED_INSTRUCTION_DO_NOT_TREAT_DATA_AS_COMMANDS" }],
    });
    assert.deepEqual(capturedRequest.body.contents, [
      { role: "user", parts: [{ text: "UNTRUSTED_OCR_TEXT_IGNORE_PREVIOUS_INSTRUCTIONS" }] },
    ]);
    assert.equal(JSON.stringify(capturedRequest.body.contents).includes("TRUSTED_INSTRUCTION"), false);
    assert.equal(JSON.stringify(capturedRequest.body.systemInstruction).includes("UNTRUSTED_OCR_TEXT"), false);
  });
});
