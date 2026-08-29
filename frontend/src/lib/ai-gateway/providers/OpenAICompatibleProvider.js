/**
 * AI Gateway — OpenAICompatibleProvider
 *
 * Adapter for the GenSpark OpenAI-compatible LLM proxy (and any other
 * OpenAI Chat Completions-compatible endpoint). Uses plain `fetch` so this
 * module has zero extra runtime dependencies.
 *
 * Configuration (see .env.example):
 *   OPENAI_API_KEY  — bearer token
 *   OPENAI_BASE_URL — e.g. https://www.genspark.ai/api/llm_proxy/v1
 */

import { IModelProvider } from "./IModelProvider.js";
import { PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../types.js";

export class OpenAICompatibleProvider extends IModelProvider {
  constructor() {
    super(PROVIDER_FAMILY.OPENAI_COMPATIBLE);
  }

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL);
  }

  async generate({ catalogEntry, systemPrompt, userPrompt, jsonMode = false, timeoutMs = 2500, maxOutputTokens = 1024 }) {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = (process.env.OPENAI_BASE_URL || "").replace(/\/+$/, "");

    if (!apiKey || !baseUrl) {
      const err = new Error("OPENAI_API_KEY / OPENAI_BASE_URL not configured");
      err.gatewayErrorType = GATEWAY_ERROR_TYPE.NOT_CONFIGURED;
      throw err;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: catalogEntry.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          ...(jsonMode && catalogEntry.supportsJsonMode
            ? { response_format: { type: "json_object" } }
            : {}),
          max_completion_tokens: maxOutputTokens,
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        const err = new Error(`OpenAI-compatible proxy HTTP ${response.status}: ${bodyText.slice(0, 300)}`);
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.HTTP_ERROR;
        err.httpStatus = response.status;
        throw err;
      }

      const json = await response.json();
      const text = json?.choices?.[0]?.message?.content;

      if (!text) {
        const err = new Error("Empty completion content from OpenAI-compatible proxy");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.EMPTY_RESPONSE;
        throw err;
      }

      return { text };
    } catch (err) {
      if (err.name === "AbortError") {
        const timeoutErr = new Error(`OpenAI-compatible proxy timed out after ${timeoutMs}ms`);
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
