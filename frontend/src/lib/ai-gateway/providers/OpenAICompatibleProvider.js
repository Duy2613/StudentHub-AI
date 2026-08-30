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
import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";

const MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;

async function readJsonBounded(response) {
  const contentLength = Number(response?.headers?.get?.("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_PROVIDER_RESPONSE_BYTES) {
    throw new Error("Provider response exceeded the safe size limit");
  }
  if (typeof response?.arrayBuffer === "function") {
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_PROVIDER_RESPONSE_BYTES) throw new Error("Provider response exceeded the safe size limit");
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  return response.json();
}

export class OpenAICompatibleProvider extends IModelProvider {
  constructor() {
    super(PROVIDER_FAMILY.OPENAI_COMPATIBLE);
  }

  isConfigured() {
    return Boolean(
      process.env.OPENAI_API_KEY &&
      validateRemoteUrlSync(process.env.OPENAI_BASE_URL || "").ok
    );
  }

  async generate({ catalogEntry, systemPrompt, userPrompt, jsonMode = false, timeoutMs = 2500, maxOutputTokens = 1024 }) {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = (process.env.OPENAI_BASE_URL || "").replace(/\/+$/, "");

    if (!apiKey || !validateRemoteUrlSync(baseUrl).ok) {
      const err = new Error("OpenAI-compatible provider is not configured");
      err.gatewayErrorType = GATEWAY_ERROR_TYPE.NOT_CONFIGURED;
      throw err;
    }

    const boundedTimeout = Math.min(Math.max(Number(timeoutMs) || 2500, 250), 30000);
    const boundedOutputTokens = Math.min(Math.max(Math.floor(Number(maxOutputTokens) || 1), 1), 8192);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), boundedTimeout);

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
          max_completion_tokens: boundedOutputTokens,
        }),
      });

      if (!response.ok) {
        const err = new Error("OpenAI-compatible provider returned an HTTP error");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.HTTP_ERROR;
        err.httpStatus = response.status;
        throw err;
      }

      const json = await readJsonBounded(response);
      const text = json?.choices?.[0]?.message?.content;

      if (!text) {
        const err = new Error("Empty completion content from OpenAI-compatible proxy");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.EMPTY_RESPONSE;
        throw err;
      }

      return { text };
    } catch (err) {
      if (err.name === "AbortError") {
        const timeoutErr = new Error("OpenAI-compatible provider timed out");
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
