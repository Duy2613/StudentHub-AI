/**
 * AI Gateway — GeminiProvider
 *
 * Adapter for Google Gemini (Interactions API, direct REST).
 *
 * The legacy generateContent endpoint is used only as a compatibility
 * fallback when the Interactions endpoint is unavailable for a model.
 * Only participates in routing when a Gemini key alias is configured; this is
 * the historical multimodal provider referenced in the atudent.pdf Trust
 * Engine seed, now normalized behind IModelProvider instead of being
 * called ad hoc from Layer 2/Layer 4.
 */

import { IModelProvider } from "./IModelProvider.js";
import { PROVIDER_FAMILY, GATEWAY_ERROR_TYPE } from "../types.js";

const GEMINI_INTERACTIONS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_GENERATE_CONTENT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;
const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

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

function extractInteractionText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const chunks = [];
  const hasInteractionSteps = Array.isArray(payload?.steps);
  const steps = hasInteractionSteps
    ? payload.steps.filter((step) => step?.type === "model_output")
    : Array.isArray(payload?.output)
      ? payload.output
      : [];
  for (const step of steps) {
    const content = Array.isArray(step?.content) ? step.content : [];
    for (const part of content) {
      if (typeof part?.text === "string") chunks.push(part.text);
    }
    if (typeof step?.text === "string") chunks.push(step.text);
  }
  return chunks.join("").trim();
}

function extractGenerateContentText(payload) {
  return Array.isArray(payload?.candidates)
    ? payload.candidates
      .flatMap((candidate) => Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [])
      .map((part) => typeof part?.text === "string" ? part.text : "")
      .join("")
      .trim()
    : "";
}

function normalizeGeminiInputParts(userPrompt, inputParts) {
  if (!Array.isArray(inputParts) || inputParts.length === 0) return String(userPrompt || "");
  return [
    { type: "text", text: String(userPrompt || "") },
    ...inputParts.filter((part) => part && typeof part === "object").slice(0, 8),
  ];
}

function toGenerateContentParts(userPrompt, inputParts) {
  if (!Array.isArray(inputParts) || inputParts.length === 0) {
    return [{ text: String(userPrompt || "") }];
  }

  return [
    { text: String(userPrompt || "") },
    ...inputParts.filter((part) => part && typeof part === "object").slice(0, 8).flatMap((part) => {
      if (part.type === "text" && typeof part.text === "string") return [{ text: part.text }];
      if (part.type === "image" && typeof part.data === "string" && typeof part.mime_type === "string") {
        return [{ inlineData: { mimeType: part.mime_type, data: part.data } }];
      }
      if (part.type === "document" && typeof part.data === "string" && typeof part.mime_type === "string") {
        return [{ inlineData: { mimeType: part.mime_type, data: part.data } }];
      }
      if ((part.type === "image" || part.type === "document") && typeof part.uri === "string" && typeof part.mime_type === "string") {
        return [{ fileData: { mimeType: part.mime_type, fileUri: part.uri } }];
      }
      return [];
    }),
  ];
}

export class GeminiProvider extends IModelProvider {
  constructor({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
    super(PROVIDER_FAMILY.GEMINI);
    this.env = env;
    this.fetchImpl = fetchImpl;
  }

  isConfigured() {
    return Boolean(this.env.GEMINI_API_KEY || this.env.GEMINI_KEY_1);
  }

  async generate({ catalogEntry, systemPrompt, userPrompt, inputParts = null, jsonMode = false, responseSchema = null, timeoutMs = 2500, maxOutputTokens = 1024, signal }) {
    if (signal?.aborted) throw createAbortError(signal.reason);
    const apiKey = this.env.GEMINI_API_KEY || this.env.GEMINI_KEY_1;

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
      // The catalog is authoritative.  GEMINI_MODEL is retained only as a
      // legacy environment diagnostic and must not silently replace a tested
      // route entry.
      const model = catalogEntry?.model || DEFAULT_GEMINI_MODEL;
      if (typeof this.fetchImpl !== "function") {
        const err = new Error("Gemini fetch is unavailable");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.NETWORK_ERROR;
        throw err;
      }

      const interactionBody = {
        model,
        system_instruction: String(systemPrompt || ""),
        input: normalizeGeminiInputParts(userPrompt, inputParts),
        // Trust/PII prompts should not be retained for server-side
        // conversation state unless a future caller explicitly opts in.
        store: false,
        ...(jsonMode && catalogEntry?.supportsJsonMode
          ? {
            response_format: {
              type: "text",
              mime_type: "application/json",
              schema: responseSchema || { type: "object" },
            },
          }
          : {}),
        generation_config: {
          temperature: 0.1,
          // Keep the default live Trust/mentor path within its latency budget;
          // callers can select a deeper model/capability when more reasoning
          // budget is justified.
          thinking_level: catalogEntry?.thinkingLevel || "low",
          max_output_tokens: boundedOutputTokens,
        },
      };

      let transport = "interactions";
      let response = await this.fetchImpl(GEMINI_INTERACTIONS_ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(interactionBody),
      });
      if (signal?.aborted) throw createAbortError(signal.reason);

      // Interactions is the canonical path.  Some model aliases/projects may
      // still expose only generateContent; keep that fallback explicit and
      // limited to endpoint-not-supported responses.
      if (!response.ok && [404, 405, 501].includes(response.status)) {
        transport = "generateContent_compatibility_fallback";
        const legacyUrl = `${GEMINI_GENERATE_CONTENT_ENDPOINT}/${encodeURIComponent(model)}:generateContent`;
        response = await this.fetchImpl(legacyUrl, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: String(systemPrompt || "") }] },
            contents: [{ role: "user", parts: toGenerateContentParts(userPrompt, inputParts) }],
            generationConfig: {
              ...(jsonMode ? { responseMimeType: "application/json" } : {}),
              ...(responseSchema ? { responseSchema } : {}),
              temperature: 0.1,
              maxOutputTokens: boundedOutputTokens,
            },
          }),
        });
      }
      if (signal?.aborted) throw createAbortError(signal.reason);

      if (!response.ok) {
        const err = new Error("Gemini provider returned an HTTP error");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.HTTP_ERROR;
        err.httpStatus = response.status;
        throw err;
      }

      const json = await readJsonBounded(response);
      if (signal?.aborted) throw createAbortError(signal.reason);
      const text = transport === "interactions"
        ? extractInteractionText(json)
        : extractGenerateContentText(json);

      if (!text) {
        const err = new Error("Empty completion content from Gemini API");
        err.gatewayErrorType = GATEWAY_ERROR_TYPE.EMPTY_RESPONSE;
        throw err;
      }

      return {
        text,
        transport,
        thinkingLevel: catalogEntry?.thinkingLevel || "low",
      };
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
