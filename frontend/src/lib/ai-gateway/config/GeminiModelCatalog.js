/**
 * Google model identifier policy for the StudentHub AI Gateway.
 *
 * The gateway never accepts a model identifier from an environment variable or
 * a caller as an arbitrary URL path.  Catalog entries are checked against this
 * allow-list before a provider can make a request.  Gemma identifiers are
 * intentionally separate: they are shadow candidates until the Layer 4
 * compatibility gate has passed.
 */

export const GEMINI_PRODUCTION_MODEL_IDS = Object.freeze([
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
]);

export const GEMINI_EXTENDED_QA_MODEL_IDS = Object.freeze([
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
]);

export const RETIRED_GEMINI_MODEL_IDS = Object.freeze([
  "gemini-2.5-flash",
]);

export const GEMMA_SHADOW_MODEL_IDS = Object.freeze([
  "gemma-4-31b-it",
  "gemma-4-26b-a4b-it",
]);

const GEMINI_MODEL_ID_SET = new Set([
  ...GEMINI_PRODUCTION_MODEL_IDS,
  ...GEMINI_EXTENDED_QA_MODEL_IDS,
  ...RETIRED_GEMINI_MODEL_IDS,
  ...GEMMA_SHADOW_MODEL_IDS,
]);
const GEMINI_PRODUCTION_MODEL_ID_SET = new Set(GEMINI_PRODUCTION_MODEL_IDS);
const GEMINI_EXTENDED_QA_MODEL_ID_SET = new Set(GEMINI_EXTENDED_QA_MODEL_IDS);
const RETIRED_GEMINI_MODEL_ID_SET = new Set(RETIRED_GEMINI_MODEL_IDS);
const GEMMA_SHADOW_MODEL_ID_SET = new Set(GEMMA_SHADOW_MODEL_IDS);

function normalizedModelId(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isQaExtendedFallbackEnabled(env = process.env) {
  const value = env?.ALLOW_QA_EXTENDED_MODEL_FALLBACK;
  return value === "true" || value === "1" || value === true;
}

export function isGeminiModelIdentifier(value) {
  return GEMINI_MODEL_ID_SET.has(normalizedModelId(value));
}

export function isApprovedGeminiProductionModel(value) {
  return GEMINI_PRODUCTION_MODEL_ID_SET.has(normalizedModelId(value));
}

export function isQaExtendedGeminiModel(value) {
  return GEMINI_EXTENDED_QA_MODEL_ID_SET.has(normalizedModelId(value));
}

export function isRetiredGeminiModel(value) {
  return RETIRED_GEMINI_MODEL_ID_SET.has(normalizedModelId(value));
}

export function isGemmaShadowModel(value) {
  return GEMMA_SHADOW_MODEL_ID_SET.has(normalizedModelId(value));
}

export function validateGeminiModelIdentifier(value, { allowGemmaShadow = true, allowQaExtended = null } = {}) {
  const model = normalizedModelId(value);
  if (!model) return { valid: false, model: null, code: "MODEL_IDENTIFIER_MISSING" };
  if (!/^[a-z0-9][a-z0-9.-]{0,119}$/.test(model)) {
    return { valid: false, model, code: "MODEL_IDENTIFIER_INVALID" };
  }
  if (isApprovedGeminiProductionModel(model)) {
    return { valid: true, model, code: "MODEL_IDENTIFIER_VALID", production: true, shadowOnly: false };
  }
  if (isRetiredGeminiModel(model)) {
    return { valid: false, model, code: "UNAVAILABLE_TO_NEW_USERS", production: false, shadowOnly: true, retired: true };
  }
  const qaExtendedAllowed = typeof allowQaExtended === "boolean" ? allowQaExtended : isQaExtendedFallbackEnabled();
  if (isQaExtendedGeminiModel(model)) {
    if (qaExtendedAllowed) {
      return { valid: true, model, code: "MODEL_IDENTIFIER_VALID_QA_EXTENDED", production: false, qaExtended: true, shadowOnly: false };
    }
    return { valid: false, model, code: "QA_EXTENDED_GATE_REQUIRED", production: false, qaExtended: true, shadowOnly: false };
  }
  if (allowGemmaShadow && isGemmaShadowModel(model)) {
    return { valid: true, model, code: "MODEL_IDENTIFIER_VALID_SHADOW", production: false, shadowOnly: true };
  }
  if (isGemmaShadowModel(model)) {
    return { valid: false, model, code: "GEMMA_COMPATIBILITY_GATE_REQUIRED", production: false, shadowOnly: true };
  }
  return { valid: false, model, code: "MODEL_IDENTIFIER_UNAPPROVED" };
}

export function validateGeminiProductionRoute(modelIds = GEMINI_PRODUCTION_MODEL_IDS) {
  const ids = Array.isArray(modelIds) ? modelIds : [];
  const expected = GEMINI_PRODUCTION_MODEL_IDS;
  const records = ids.map((model) => validateGeminiModelIdentifier(model, { allowGemmaShadow: false, allowQaExtended: false }));
  const valid = ids.length === expected.length
    && ids.every((model, index) => model === expected[index])
    && records.every((record) => record.valid);
  return Object.freeze({
    valid,
    expected: [...expected],
    models: records,
    code: valid ? "PRODUCTION_ROUTE_VALID" : "PRODUCTION_ROUTE_INVALID",
  });
}

export function validateGeminiExtendedQaRoute(modelIds = GEMINI_EXTENDED_QA_MODEL_IDS) {
  const ids = Array.isArray(modelIds) ? modelIds : [];
  const expected = GEMINI_EXTENDED_QA_MODEL_IDS;
  const records = ids.map((model) => validateGeminiModelIdentifier(model, { allowGemmaShadow: false, allowQaExtended: true }));
  const valid = ids.length === expected.length
    && ids.every((model, index) => model === expected[index])
    && records.every((record) => record.valid);
  return Object.freeze({
    valid,
    expected: [...expected],
    models: records,
    code: valid ? "EXTENDED_QA_ROUTE_VALID" : "EXTENDED_QA_ROUTE_INVALID",
  });
}

