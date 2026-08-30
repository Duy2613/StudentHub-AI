/**
 * Layer 2 — GeminiSemanticModelProvider
 * 
 * Multimodal structured reasoning provider utilizing Google Gemini models.
 * Implements strict JSON schema extraction, 3000ms SLA timeout, and seamless fallback.
 */

import { ISemanticVerificationProvider } from "./ISemanticVerificationProvider.js";
import { DeterministicSemanticProvider } from "./DeterministicSemanticProvider.js";
import { LAYER_2_CONFIG } from "../config/Layer2Config.js";
import { validateRemoteUrlSync } from "../../../security/hardening/SafeRemoteUrl.js";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

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

      if (!validateRemoteUrlSync(GEMINI_ENDPOINT).ok) {
        throw new Error("Gemini endpoint failed URL policy validation");
      }

      const boundedParams = {
        ...params,
        text: String(params?.text || "").slice(0, LAYER_2_CONFIG.LIMITS.MAX_TEXT_CHARACTERS),
        ocrText: String(params?.ocrText || "").slice(0, LAYER_2_CONFIG.LIMITS.MAX_OCR_CHARACTERS),
        url: String(params?.url || "").slice(0, 2048),
        qrPayload: String(params?.qrPayload || "").slice(0, 4096)
      };
      const prompt = this.buildStructuredPrompt(boundedParams);

      const response = await fetch(
        `${GEMINI_ENDPOINT}/${encodeURIComponent(LAYER_2_CONFIG.MODEL.GEMINI_MODEL)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
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

      const contentLength = Number(response.headers.get("content-length") || 0);
      if (Number.isFinite(contentLength) && contentLength > 2 * 1024 * 1024) {
        throw new Error("Gemini response exceeded the size limit");
      }
      const raw = await response.arrayBuffer();
      if (raw.byteLength > 2 * 1024 * 1024) throw new Error("Gemini response exceeded the size limit");
      const json = JSON.parse(new TextDecoder().decode(raw));
      const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) throw new Error("Empty model response");

      const parsed = JSON.parse(textOutput);
      return {
        ...parsed,
        providerId: this.providerId,
      };
    } catch (err) {
      console.warn(`[Layer2 Gemini Provider Warning] Falling back to deterministic engine (${err?.name || "provider_error"})`);
      const fallbackResult = await this.fallbackEngine.analyzeSemantics(params);
      return {
        ...fallbackResult,
        modelStatus: "fallback_used",
        fallbackReason: err?.name === "AbortError" ? "TIMEOUT" : "GEMINI_PROVIDER_UNAVAILABLE",
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
