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
const MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;

function createAbortError(reason) {
  const error = reason instanceof Error ? reason : new Error("AI provider request cancelled");
  error.name = "AbortError";
  return error;
}

function bindAbortSignal(controller, signal) {
  if (!signal || typeof signal.addEventListener !== "function") return () => {};
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

export class GeminiProvider extends IModelProvider {
  constructor({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
    super(PROVIDER_FAMILY.GEMINI);
    this.env = env;
    this.fetchImpl = fetchImpl;
  }

  isConfigured() {
    return Boolean(this.env.GEMINI_API_KEY || this.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }

  async generate({ catalogEntry, systemPrompt, userPrompt, jsonMode = false, timeoutMs = 2500, maxOutputTokens = 1024, signal }) {
    if (signal?.aborted) throw createAbortError(signal.reason);
    const apiKey = this.env.GEMINI_API_KEY || this.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      const err = new Error("GEMINI_API_KEY not configured");
      err.gatewayErrorType = GATEWAY_ERROR_TYPE.NOT_CONFIGURED;
      throw err;
    }

    const boundedTimeout = Math.min(Math.max(Number(timeoutMs) || 2500, 250), 30000);
    const boundedOutputTokens = Math.min(Math.max(Math.floor(Number(maxOutputTokens) || 1), 1), 8192);
    const controller = new AbortController();
    const unbindAbort = bindAbortSignal(controller, signal);
    const timeoutId = setTimeout(() => controller.abort(), boundedTimeout);

    try {
      const url = `${GEMINI_ENDPOINT_BASE}/${catalogEntry.model}:generateContent`;
      if (typeof this.fetchImpl !== "function") {
        const err = new Error("Gemini fetch is unavailable");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.NETWORK_ERROR;
        throw err;
      }

      const response = await this.fetchImpl(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          // Gemini's systemInstruction is a trusted channel. Keep all
          // user/evidence text in a separate user content part so retrieved
          // data cannot be promoted into trusted instructions.
          systemInstruction: { parts: [{ text: String(systemPrompt || "") }] },
          contents: [{ role: "user", parts: [{ text: String(userPrompt || "") }] }],
          generationConfig: {
            ...(jsonMode ? { responseMimeType: "application/json" } : {}),
            temperature: 0.1,
            maxOutputTokens: boundedOutputTokens,
          },
        }),
      });
      if (signal?.aborted) throw createAbortError(signal.reason);

      if (!response.ok) {
        const err = new Error("Gemini provider returned an HTTP error");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.HTTP_ERROR;
        err.httpStatus = response.status;
        throw err;
      }

      const json = await readJsonBounded(response);
      if (signal?.aborted) throw createAbortError(signal.reason);
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        const err = new Error("Empty completion content from Gemini API");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.EMPTY_RESPONSE;
        throw err;
      }

      return { text };
    } catch (err) {
      if (signal?.aborted) throw createAbortError(signal.reason);
      if (err.name === "AbortError") {
        const timeoutErr = new Error("Gemini provider timed out");
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
