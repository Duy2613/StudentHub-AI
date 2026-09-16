/**
 * AI Gateway — OpenAICompatibleProvider
 *
 * Adapter for the official OpenAI Responses API, with a compatibility path
 * for an explicitly configured approved proxy. Uses plain `fetch` so this
 * module has zero extra runtime dependencies.
 *
 * Configuration (see .env.example):
 *   OPEN_AI_KEY_1  — preferred bearer token for the current production release
 *   OPENAI_API_KEY  — canonical fallback bearer token
 *   OPENAI_BASE_URL — optional approved proxy endpoint; official OpenAI is the
 *                       default when OPEN_AI_KEY_1 is present
 */

import { IModelProvider } from "./IModelProvider.js";
import { PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../types.js";
import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";

const MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;
const OFFICIAL_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

function createAbortError(reason) {
  const error = reason instanceof Error ? reason : new Error("AI provider request cancelled");
  error.name = "AbortError";
  return error;
}

function bindAbortSignal(controller, signal) {
  if (!signal || typeof signal.addEventListener !== "function") return () => { };
  const onAbort = () => controller.abort(signal.reason);
  if (signal.aborted) onAbort();
  else signal.addEventListener("abort", onAbort, { once: true });
  return () => signal.removeEventListener?.("abort", onAbort);
}

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

function isOfficialOpenAIBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "") === OFFICIAL_OPENAI_BASE_URL;
}

function extractResponsesText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const chunks = [];
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (typeof content?.text === "string" && (content.type === "output_text" || !content.type)) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("").trim();
}

function extractChatCompletionText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return "";
}

export class OpenAICompatibleProvider extends IModelProvider {
  constructor({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
    super(PROVIDER_FAMILY.OPENAI_COMPATIBLE);
    this.env = env;
    this.fetchImpl = fetchImpl;
  }

  isConfigured() {
    if (String(this.env.OPENAI_RUNTIME || "DISABLED_INTENTIONALLY").toUpperCase() !== "ENABLED") return false;
    const apiKey = this.env.OPEN_AI_KEY_1 || this.env.OPENAI_API_KEY;
    const baseUrl = this.env.OPENAI_BASE_URL || (apiKey ? "https://api.openai.com/v1" : "");
    return Boolean(
      apiKey &&
      validateRemoteUrlSync(baseUrl).ok
    );
  }

  async generate({ catalogEntry, systemPrompt, userPrompt, inputParts = null, jsonMode = false, responseSchema = null, timeoutMs = 2500, maxOutputTokens = 1024, signal }) {
    if (signal?.aborted) throw createAbortError(signal.reason);
    if (String(this.env.OPENAI_RUNTIME || "DISABLED_INTENTIONALLY").toUpperCase() !== "ENABLED") {
      const err = new Error("OpenAI runtime is disabled intentionally");
      err.gatewayErrorType = GATEWAY_ERROR_TYPE.NOT_CONFIGURED;
      throw err;
    }
    const apiKey = this.env.OPEN_AI_KEY_1 || this.env.OPENAI_API_KEY;
    const baseUrl = (this.env.OPENAI_BASE_URL || (apiKey ? "https://api.openai.com/v1" : "")).replace(/\/+$/, "");

    if (!apiKey || !validateRemoteUrlSync(baseUrl).ok) {
      const err = new Error("OpenAI-compatible provider is not configured");
      err.gatewayErrorType = GATEWAY_ERROR_TYPE.NOT_CONFIGURED;
      throw err;
    }

    const boundedTimeout = Math.min(Math.max(Number(timeoutMs) || 2500, 250), 30000);
    const boundedOutputTokens = Math.min(Math.max(Math.floor(Number(maxOutputTokens) || 1), 1), 8192);
    const controller = new AbortController();
    const unbindAbort = bindAbortSignal(controller, signal);
    const timeoutId = setTimeout(() => controller.abort(), boundedTimeout);

    try {
      if (typeof this.fetchImpl !== "function") {
        const err = new Error("OpenAI-compatible fetch is unavailable");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.NETWORK_ERROR;
        throw err;
      }
      const model = catalogEntry?.model || DEFAULT_OPENAI_MODEL;
      const useResponsesApi = isOfficialOpenAIBaseUrl(baseUrl);
      const responseUrl = useResponsesApi ? `${baseUrl}/responses` : `${baseUrl}/chat/completions`;
      const responseBody = useResponsesApi
        ? {
          model,
          instructions: String(systemPrompt || ""),
          input: Array.isArray(inputParts) && inputParts.length > 0 ? inputParts : String(userPrompt || ""),
          store: false,
          ...(jsonMode && catalogEntry?.supportsJsonMode
            ? {
              text: responseSchema
                ? {
                  format: {
                    type: "json_schema",
                    name: "studenthub_gateway_response",
                    strict: true,
                    schema: responseSchema,
                  },
                }
                : { format: { type: "json_object" } },
            }
            : {}),
          max_output_tokens: boundedOutputTokens,
        }
        : {
          // Explicit proxy path retained for deployments that provide an
          // OpenAI-compatible endpoint instead of api.openai.com.
          model,
          messages: [
            { role: "system", content: String(systemPrompt || "") },
            { role: "user", content: String(userPrompt || "") },
          ],
          ...(jsonMode && catalogEntry?.supportsJsonMode
            ? { response_format: { type: "json_object" } }
            : {}),
          max_completion_tokens: boundedOutputTokens,
        };

      const response = await this.fetchImpl(responseUrl, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(responseBody),
      });
      if (signal?.aborted) throw createAbortError(signal.reason);

      if (!response.ok) {
        const err = new Error("OpenAI-compatible provider returned an HTTP error");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.HTTP_ERROR;
        err.httpStatus = response.status;
        throw err;
      }

      const json = await readJsonBounded(response);
      if (signal?.aborted) throw createAbortError(signal.reason);
      const text = useResponsesApi
        ? extractResponsesText(json)
        : extractChatCompletionText(json);

      if (!text) {
        const err = new Error("Empty completion content from OpenAI provider");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.EMPTY_RESPONSE;
        throw err;
      }

      return { text };
    } catch (err) {
      if (signal?.aborted) throw createAbortError(signal.reason);
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
      unbindAbort();
    }
  }
}
