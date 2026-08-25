/**
 * Layer 2 — GeminiSemanticModelProvider
 * 
 * Multimodal structured reasoning provider utilizing Google Gemini models.
 * Implements strict JSON schema extraction, 3000ms SLA timeout, and seamless fallback.
 */

import { ISemanticVerificationProvider } from "./ISemanticVerificationProvider.js";
import { DeterministicSemanticProvider } from "./DeterministicSemanticProvider.js";
import { LAYER_2_CONFIG } from "../config/Layer2Config.js";

export class GeminiSemanticModelProvider extends ISemanticVerificationProvider {
  constructor(apiKey = null) {
    super("gemini_multimodal_reasoning");
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || null;
    this.fallbackEngine = new DeterministicSemanticProvider();
  }

  /**
   * Performs multimodal semantic reasoning via Gemini with safety fallback
   */
  async analyzeSemantics(params) {
    // If no API key is provided in environment, cleanly use deterministic provider
    if (!this.apiKey) {
      return this.fallbackEngine.analyzeSemantics(params);
    }

    try {
      // Execute with timeout constraint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LAYER_2_CONFIG.SLA.MAX_TIMEOUT_MS);

      const prompt = this.buildStructuredPrompt(params);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${LAYER_2_CONFIG.MODEL.GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: LAYER_2_CONFIG.MODEL.TEMPERATURE,
              maxOutputTokens: LAYER_2_CONFIG.MODEL.MAX_OUTPUT_TOKENS,
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const json = await response.json();
      const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) throw new Error("Empty model response");

      const parsed = JSON.parse(textOutput);
      return {
        ...parsed,
        providerId: this.providerId,
      };
    } catch (err) {
      console.warn(`[Layer2 Gemini Provider Warning] Falling back to deterministic engine: ${err.message}`);
      const fallbackResult = await this.fallbackEngine.analyzeSemantics(params);
      return {
        ...fallbackResult,
        modelStatus: "fallback_used",
        fallbackReason: err.message,
      };
    }
  }

  buildStructuredPrompt({ text, url, ocrText, qrPayload, layer1Result }) {
    return `You are Layer 2 of the AI Trust Pipeline. Analyze the following content for semantic meaning, intent, factual claims, and contextual manipulation.
Respond ONLY with valid JSON matching this schema:
{
  "semanticSummary": "Short explanation in Vietnamese",
  "intent": { "primary": "inform|request_action|request_credentials|request_payment|impersonate|educate", "secondary": null },
  "entities": [{ "name": "string", "type": "university|bank|government|tech", "isClaimedAuthor": boolean }],
  "claims": [{ "claimId": "string", "subject": "string", "predicate": "string", "object": "string", "importance": "critical|high|medium|low", "verificationRequired": boolean }],
  "contextSignals": [{ "type": "string", "severity": "critical|high|medium|low|info", "details": "string" }],
  "consistencyFindings": [],
  "crossModalFindings": [],
  "classification": "BENIGN|INFORMATIVE|AMBIGUOUS|MISLEADING|DECEPTIVE|MALICIOUS|UNVERIFIED"
}

CONTENT TO ANALYZE:
- Text: ${text || "(none)"}
- URL: ${url || "(none)"}
- OCR Image Text: ${ocrText || "(none)"}
- QR Code Payload: ${qrPayload || "(none)"}
- Layer 1 Status: ${layer1Result?.status || "UNKNOWN"}`;
  }
}
