/**
 * AI Gateway — GeminiProvider
 *
 * Adapter for Google Gemini (Generative Language API, direct REST).
 * Only participates in routing when GEMINI_API_KEY is configured; this is
 * the historical multimodal provider referenced in the atudent.pdf Trust
 * Engine seed, now normalized behind IModelProvider instead of being
 * called ad hoc from Layer 2/Layer 4.
 */

import { IModelProvider } from "./IModelProvider.js";
import { PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../types.js";

const GEMINI_ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiProvider extends IModelProvider {
  constructor() {
    super(PROVIDER_FAMILY.GEMINI);
  }

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }

  async generate({ catalogEntry, systemPrompt, userPrompt, jsonMode = false, timeoutMs = 2500, maxOutputTokens = 1024 }) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      const err = new Error("GEMINI_API_KEY not configured");
      err.gatewayErrorType = GATEWAY_ERROR_TYPE.NOT_CONFIGURED;
      throw err;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${GEMINI_ENDPOINT_BASE}/${catalogEntry.model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: {
            ...(jsonMode ? { responseMimeType: "application/json" } : {}),
            temperature: 0.1,
            maxOutputTokens,
          },
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        const err = new Error(`Gemini API HTTP ${response.status}: ${bodyText.slice(0, 300)}`);
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.HTTP_ERROR;
        err.httpStatus = response.status;
        throw err;
      }

      const json = await response.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        const err = new Error("Empty completion content from Gemini API");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.EMPTY_RESPONSE;
        throw err;
      }

      return { text };
    } catch (err) {
      if (err.name === "AbortError") {
        const timeoutErr = new Error(`Gemini API timed out after ${timeoutMs}ms`);
        timeoutErr.gatewayErrorType = GATEWAY_ERROR_TYPE.TIMEOUT;
        throw timeoutErr;
      }
      if (!err.gatewayErrorType) {
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.NETWORK_ERROR;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
