/**
 * AI Gateway — GeminiProvider
 *
 * Direct Google Gemini adapter. The router owns model selection; this adapter
 * owns only the bounded request/response boundary. Every request uses the one
 * canonical `GEMINI_API_KEY` and never rotates credentials.
 */

import { IModelProvider } from "./IModelProvider.js";
import { PROVIDER_FAMILY, GATEWAY_ERROR_TYPE, normalizeProviderErrorCode } from "../types.js";
import {
  GEMINI_PRODUCTION_MODEL_IDS,
  GEMINI_EXTENDED_QA_MODEL_IDS,
  isApprovedGeminiProductionModel,
  isQaExtendedGeminiModel,
  isQaExtendedFallbackEnabled,
  isGemmaShadowModel,
  validateGeminiProductionRoute,
  validateGeminiModelIdentifier,
} from "../config/GeminiModelCatalog.js";

const GEMINI_INTERACTIONS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_GENERATE_CONTENT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 2500;
const MAX_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 8192;
const MAX_RETRY_AFTER_MS = 24 * 60 * 60 * 1000;

function createAbortError(reason) {
  const error = reason instanceof Error ? reason : new Error("AI provider request cancelled");
  error.name = "AbortError";
  return error;
}

function createTimeoutError() {
  const error = new Error("Gemini provider timed out");
  error.name = "TimeoutError";
  error.code = "ATTEMPT_TIMEOUT";
  error.gatewayErrorType = GATEWAY_ERROR_TYPE.TIMEOUT;
  return error;
}

function bindAbortSignal(controller, signal) {
  if (!signal || typeof signal.addEventListener !== "function") return () => {};
  const onAbort = () => controller.abort(signal.reason);
  if (signal.aborted) onAbort();
  else signal.addEventListener("abort", onAbort, { once: true });
  return () => signal.removeEventListener?.("abort", onAbort);
}

function safeProviderCode(value, fallback = null) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const known = new Set([
    "UNAUTHENTICATED",
    "PERMISSION_DENIED",
    "INVALID_ARGUMENT",
    "NOT_FOUND",
    "MODEL_NOT_FOUND",
    "RESOURCE_EXHAUSTED",
    "QUOTA_EXHAUSTED",
    "RATE_LIMITED",
    "UNAVAILABLE",
    "SERVICE_UNAVAILABLE",
    "DEADLINE_EXCEEDED",
    "MODEL_UNAVAILABLE",
    "NETWORK_TIMEOUT",
  ]);
  return known.has(normalized) ? normalized : normalizeProviderErrorCode(normalized) || fallback;
}

function parseRetryAfterValue(value, now = Date.now()) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    return Math.min(Number(raw) * 1000, MAX_RETRY_AFTER_MS);
  }
  const duration = raw.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h)$/i);
  if (duration) {
    const multiplier = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 }[duration[2].toLowerCase()];
    return Math.min(Number(duration[1]) * multiplier, MAX_RETRY_AFTER_MS);
  }
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) && timestamp > now
    ? Math.min(timestamp - now, MAX_RETRY_AFTER_MS)
    : null;
}

function nestedStrings(value, depth = 0) {
  if (depth > 3 || value === null || value === undefined) return [];
  if (typeof value === "string") return [value.slice(0, 500)];
  if (Array.isArray(value)) return value.slice(0, 16).flatMap((item) => nestedStrings(item, depth + 1));
  if (typeof value === "object") return Object.entries(value).slice(0, 24).flatMap(([key, item]) => [key, ...nestedStrings(item, depth + 1)]);
  return [];
}

function metadataFromErrorPayload(payload, response, now = Date.now()) {
  const errorPayload = payload?.error && typeof payload.error === "object" ? payload.error : payload;
  const status = Number(response?.status);
  const rawCode = errorPayload?.status || errorPayload?.reason || errorPayload?.code;
  let providerErrorCode = safeProviderCode(rawCode);
  if (!providerErrorCode && status === 401) providerErrorCode = "UNAUTHENTICATED";
  if (!providerErrorCode && status === 403) providerErrorCode = "PERMISSION_DENIED";
  if (!providerErrorCode && status === 404) providerErrorCode = "MODEL_NOT_FOUND";
  if (!providerErrorCode && status === 429) providerErrorCode = "RESOURCE_EXHAUSTED";
  if (!providerErrorCode && status === 503) providerErrorCode = "SERVICE_UNAVAILABLE";
  if (!providerErrorCode && status >= 400) providerErrorCode = `HTTP_${status}`;

  const strings = nestedStrings(errorPayload);
  const searchable = strings.join(" ").toLowerCase();
  const retryHeader = response?.headers?.get?.("retry-after") || response?.headers?.get?.("Retry-After");
  let retryAfterMs = parseRetryAfterValue(retryHeader, now);
  let quotaResetAt = null;
  for (const detail of Array.isArray(errorPayload?.details) ? errorPayload.details : []) {
    if (!retryAfterMs) retryAfterMs = parseRetryAfterValue(detail?.retryDelay || detail?.retry_after, now);
    const resetValue = detail?.quotaResetTime || detail?.quotaResetAt || detail?.resetAt;
    const reset = Date.parse(String(resetValue || ""));
    if (Number.isFinite(reset) && reset > now) quotaResetAt = reset;
  }
  if (!retryAfterMs && quotaResetAt) retryAfterMs = Math.min(quotaResetAt - now, MAX_RETRY_AFTER_MS);

  const quotaExhausted = status === 429 || ["RESOURCE_EXHAUSTED", "QUOTA_EXHAUSTED", "RATE_LIMITED"].includes(providerErrorCode);
  const dailyQuotaExhausted = quotaExhausted && /daily|per day|rpd|requests\s*\/\s*day|day quota/.test(searchable);
  return {
    providerErrorCode,
    retryAfterMs: retryAfterMs !== null && Number.isFinite(Number(retryAfterMs)) ? Math.max(0, Math.min(Number(retryAfterMs), MAX_RETRY_AFTER_MS)) : null,
    quotaExhausted,
    dailyQuotaExhausted,
    quotaResetAt,
  };
}

async function readJsonBounded(response) {
  const contentLength = Number(response?.headers?.get?.("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_PROVIDER_RESPONSE_BYTES) {
    throw new Error("Provider response exceeded the safe size limit");
  }
  if (typeof response?.arrayBuffer === "function") {
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_PROVIDER_RESPONSE_BYTES) throw new Error("Provider response exceeded the safe size limit");
    if (bytes.byteLength === 0) return null;
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  if (typeof response?.json === "function") return response.json();
  return null;
}

async function readErrorMetadata(response) {
  let payload = null;
  try {
    payload = await readJsonBounded(response);
  } catch {
    payload = null;
  }
  return metadataFromErrorPayload(payload, response);
}

function extractInteractionText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  const chunks = [];
  const steps = Array.isArray(payload?.steps)
    ? payload.steps.filter((step) => step?.type === "model_output")
    : Array.isArray(payload?.output) ? payload.output : [];
  for (const step of steps) {
    const content = Array.isArray(step?.content) ? step.content : [];
    for (const part of content) if (typeof part?.text === "string") chunks.push(part.text);
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
  if (!Array.isArray(inputParts) || inputParts.length === 0) return [{ text: String(userPrompt || "") }];
  return [
    { text: String(userPrompt || "") },
    ...inputParts.filter((part) => part && typeof part === "object").slice(0, 8).flatMap((part) => {
      if (part.type === "text" && typeof part.text === "string") return [{ text: part.text }];
      if ((part.type === "image" || part.type === "document") && typeof part.data === "string" && typeof part.mime_type === "string") {
        return [{ inlineData: { mimeType: part.mime_type, data: part.data } }];
      }
      if ((part.type === "image" || part.type === "document") && typeof part.uri === "string" && typeof part.mime_type === "string") {
        return [{ fileData: { mimeType: part.mime_type, fileUri: part.uri } }];
      }
      return [];
    }),
  ];
}

function providerError(message, metadata = {}) {
  const error = new Error(message);
  Object.assign(error, metadata);
  return error;
}

export class GeminiProvider extends IModelProvider {
  constructor({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
    super(PROVIDER_FAMILY.GEMINI);
    this.env = env;
    this.fetchImpl = fetchImpl;
    // This is intentionally static/no-network validation. Runtime HTTP
    // availability is recorded per model by ModelRouter.
    this.initialization = Object.freeze({
      provider: PROVIDER_FAMILY.GEMINI,
      canonicalKeyConfigured: this.isConfigured(),
      modelIdentifierPolicy: "ALLOWLISTED",
      modelIdentifierValidation: validateGeminiProductionRoute(GEMINI_PRODUCTION_MODEL_IDS),
    });
  }

  isConfigured() {
    return typeof this.env?.GEMINI_API_KEY === "string" && this.env.GEMINI_API_KEY.trim().length > 0;
  }

  validateModel(catalogEntry, { allowShadowCandidate = false, allowQaExtended = null } = {}) {
    const qaExtendedAllowed = typeof allowQaExtended === "boolean"
      ? allowQaExtended
      : isQaExtendedFallbackEnabled(this.env);
    const modelValidation = validateGeminiModelIdentifier(catalogEntry?.model, {
      allowGemmaShadow: true,
      allowQaExtended: qaExtendedAllowed,
    });
    if (!modelValidation.valid) return { ...modelValidation, compatible: false };
    if (isGemmaShadowModel(modelValidation.model) && !allowShadowCandidate) {
      return { ...modelValidation, valid: false, compatible: false, code: "GEMMA_COMPATIBILITY_GATE_REQUIRED" };
    }
    if (isGemmaShadowModel(modelValidation.model)) {
      return { ...modelValidation, compatible: true, shadowOnly: true, code: "GEMMA_SHADOW_PROBE_ONLY" };
    }
    const isPrimary = isApprovedGeminiProductionModel(modelValidation.model);
    const isExtended = isQaExtendedGeminiModel(modelValidation.model);
    const compatible = isPrimary || (isExtended && qaExtendedAllowed);
    return {
      ...modelValidation,
      compatible,
      code: compatible
        ? (isPrimary ? "MODEL_IDENTIFIER_VALID" : "MODEL_IDENTIFIER_VALID_QA_EXTENDED")
        : (isExtended ? "QA_EXTENDED_GATE_REQUIRED" : "MODEL_IDENTIFIER_UNAPPROVED"),
    };
  }

  getInitializationStatus() {
    return { ...this.initialization };
  }

  async generate({
    catalogEntry,
    systemPrompt,
    userPrompt,
    inputParts = null,
    jsonMode = false,
    responseSchema = null,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxOutputTokens = 1024,
    signal,
    allowShadowCandidate = false,
    allowQaExtended = null,
  } = {}) {
    if (signal?.aborted) throw createAbortError(signal.reason);
    const modelValidation = this.validateModel(catalogEntry, { allowShadowCandidate, allowQaExtended });
    if (!modelValidation.compatible) {
      throw providerError("Gemini model is not compatible with the active gateway contract", {
        gatewayErrorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE,
        providerErrorCode: modelValidation.code,
        model: modelValidation.model,
      });
    }
    const apiKey = typeof this.env?.GEMINI_API_KEY === "string" ? this.env.GEMINI_API_KEY.trim() : "";
    if (!apiKey) {
      throw providerError("GEMINI_API_KEY not configured", { gatewayErrorType: GATEWAY_ERROR_TYPE.NOT_CONFIGURED });
    }
    if (typeof this.fetchImpl !== "function") {
      throw providerError("Gemini fetch is unavailable", { gatewayErrorType: GATEWAY_ERROR_TYPE.NETWORK_ERROR });
    }

    const model = modelValidation.model;
    const boundedTimeout = Math.min(Math.max(Number(timeoutMs) || DEFAULT_TIMEOUT_MS, 250), MAX_TIMEOUT_MS);
    const boundedOutputTokens = Math.min(Math.max(Math.floor(Number(maxOutputTokens) || 1), 1), MAX_OUTPUT_TOKENS);
    const controller = new AbortController();
    const unbindAbort = bindAbortSignal(controller, signal);
    const timeoutId = setTimeout(() => controller.abort(createTimeoutError()), boundedTimeout);

    const interactionBody = {
      model,
      system_instruction: String(systemPrompt || ""),
      input: normalizeGeminiInputParts(userPrompt, inputParts),
      store: false,
      ...(jsonMode && (catalogEntry?.supportsJsonMode || allowShadowCandidate)
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
        thinking_level: catalogEntry?.thinkingLevel || "low",
        max_output_tokens: boundedOutputTokens,
      },
    };

    try {
      let transport = "interactions";
      let response = await this.fetchImpl(GEMINI_INTERACTIONS_ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(interactionBody),
      });
      if (signal?.aborted) throw createAbortError(signal.reason);

      // A 404 is a model-availability signal for the router and must not be
      // hidden by a second request. Only endpoint-not-supported statuses use
      // the legacy transport compatibility path.
      if (!response?.ok && [405, 501].includes(Number(response?.status))) {
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

      if (!response?.ok) {
        const metadata = await readErrorMetadata(response);
        throw providerError("Gemini provider returned an HTTP error", {
          gatewayErrorType: GATEWAY_ERROR_TYPE.HTTP_ERROR,
          httpStatus: Number.isInteger(Number(response?.status)) ? Number(response.status) : null,
          ...metadata,
        });
      }

      let json;
      try {
        json = await readJsonBounded(response);
      } catch {
        throw providerError("Gemini provider returned invalid JSON", {
          gatewayErrorType: GATEWAY_ERROR_TYPE.INVALID_JSON,
          httpStatus: Number.isInteger(Number(response?.status)) ? Number(response.status) : 200,
          providerErrorCode: "INVALID_JSON",
        });
      }
      if (signal?.aborted) throw createAbortError(signal.reason);
      const text = transport === "interactions" ? extractInteractionText(json) : extractGenerateContentText(json);
      if (!text) {
        throw providerError("Empty completion content from Gemini API", {
          gatewayErrorType: GATEWAY_ERROR_TYPE.EMPTY_RESPONSE,
          httpStatus: Number.isInteger(Number(response?.status)) ? Number(response.status) : 200,
          providerErrorCode: "EMPTY_RESPONSE",
        });
      }
      return {
        text,
        transport,
        thinkingLevel: catalogEntry?.thinkingLevel || "low",
        httpStatus: Number.isInteger(Number(response?.status)) ? Number(response.status) : 200,
        providerErrorCode: null,
      };
    } catch (error) {
      if (signal?.aborted && signal.reason?.name !== "TimeoutError" && signal.reason?.code !== "ATTEMPT_TIMEOUT") {
        throw createAbortError(signal.reason);
      }
      if (error?.name === "AbortError" || error?.name === "TimeoutError" || error?.code === "ATTEMPT_TIMEOUT") {
        throw createTimeoutError();
      }
      if (!error?.gatewayErrorType) error.gatewayErrorType = GATEWAY_ERROR_TYPE.NETWORK_ERROR;
      throw error;
    } finally {
      clearTimeout(timeoutId);
      unbindAbort();
    }
  }
}

export { validateGeminiModelIdentifier };
