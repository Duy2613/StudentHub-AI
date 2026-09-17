import { GEMINI_PRODUCTION_MODEL_IDS, isApprovedGeminiProductionModel, isGemmaShadowModel } from "../../../ai-gateway/config/GeminiModelCatalog.js";

/**
 * Canonical structured contract for Gemini's Layer 4 advisory verification.
 *
 * Gemini may explain and organize evidence, but it never owns the final
 * security, truth, enforcement, or confidence decision. Citations are kept
 * only when the model echoes a real HTTP(S) URL already present in the input.
 */

export const GEMINI_TRUST_VERDICT_SIGNALS = Object.freeze([
  "SUPPORTS",
  "CONTRADICTS",
  "MIXED",
  "UNCERTAIN",
  "NO_SIGNAL",
]);

export const GEMINI_TRUST_VERIFICATION_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: [
    "verdictSignal",
    "supportReasons",
    "contradictionReasons",
    "missingEvidence",
    "uncertainty",
    "citationsUsed",
    "provider",
    "model",
  ],
  properties: {
    verdictSignal: { type: "string", enum: [...GEMINI_TRUST_VERDICT_SIGNALS] },
    supportReasons: { type: "array", items: { type: "string" }, maxItems: 12 },
    contradictionReasons: { type: "array", items: { type: "string" }, maxItems: 12 },
    missingEvidence: { type: "array", items: { type: "string" }, maxItems: 12 },
    uncertainty: { type: "string", maxLength: 700 },
    citationsUsed: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "url"],
        properties: {
          id: { type: "string", maxLength: 180 },
          url: { type: "string", format: "uri", maxLength: 4096 },
        },
      },
    },
    provider: { type: "string", maxLength: 80 },
    model: { type: "string", maxLength: 120 },
  },
});

const VERDICT_SET = new Set(GEMINI_TRUST_VERDICT_SIGNALS);

function boundedText(value, maxLength = 700) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength)
    : "";
}

function list(value, maxItems = 12) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((item) => {
      if (typeof item === "string") return boundedText(item);
      if (item && typeof item === "object" && !Array.isArray(item)) {
        return boundedText(item.reason || item.text || item.details || item.label);
      }
      return "";
    })
    .filter(Boolean);
}

function realHttpUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 4096) : null;
  } catch {
    return null;
  }
}

function citations(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const output = [];
  for (const item of value.slice(0, 20)) {
    const url = realHttpUrl(typeof item === "string" ? item : item?.url || item?.sourceUrl || item?.canonicalUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    output.push({
      id: boundedText(typeof item === "string" ? item : item?.id || item?.citationId || item?.sourceId, 180) || url,
      url,
    });
  }
  return output;
}

export function isValidGeminiTrustVerification(value, {
  allowedCitationUrls = null,
  allowedModels = GEMINI_PRODUCTION_MODEL_IDS,
  allowGemmaShadow = false,
} = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!VERDICT_SET.has(value.verdictSignal)) return false;
  if (!Array.isArray(value.supportReasons) || value.supportReasons.length > 12) return false;
  if (!Array.isArray(value.contradictionReasons) || value.contradictionReasons.length > 12) return false;
  if (!Array.isArray(value.missingEvidence) || value.missingEvidence.length > 12) return false;
  if (typeof value.uncertainty !== "string" || value.uncertainty.length > 700) return false;
  if (!Array.isArray(value.citationsUsed) || value.citationsUsed.length > 20) return false;
  const providerName = typeof value.provider === "string" ? value.provider.trim().toLowerCase() : "";
  if (providerName !== "gemini" && providerName !== "google") return false;
  if (typeof value.model !== "string") return false;
  const model = value.model.trim();
  const modelSet = new Set(Array.isArray(allowedModels) ? allowedModels : GEMINI_PRODUCTION_MODEL_IDS);
  const modelApproved = isApprovedGeminiProductionModel(model) || (allowGemmaShadow === true && isGemmaShadowModel(model));
  if (!modelSet.has(model) || !modelApproved) return false;
  return value.citationsUsed.every((citation) => {
    return citation && typeof citation === "object" && !Array.isArray(citation) &&
      typeof citation.id === "string" && citation.id.length <= 180 &&
      realHttpUrl(citation.url) !== null &&
      (!allowedCitationUrls || allowedCitationUrls.has(realHttpUrl(citation.url)));
  });
}

export function normalizeGeminiTrustVerification(value, {
  provider = "google",
  model = GEMINI_PRODUCTION_MODEL_IDS[0],
  fallbackUncertainty = "Gemini không công bố thêm certainty ngoài evidence hiện có.",
} = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const normalizedProvider = "google";
  const normalizedModel = boundedText(model, 120) || GEMINI_PRODUCTION_MODEL_IDS[0];
  if (!isApprovedGeminiProductionModel(normalizedModel)) return null;
  const verdictSignal = VERDICT_SET.has(value.verdictSignal) ? value.verdictSignal : "UNCERTAIN";
  return {
    verdictSignal,
    supportReasons: list(value.supportReasons),
    contradictionReasons: list(value.contradictionReasons),
    missingEvidence: list(value.missingEvidence),
    uncertainty: boundedText(value.uncertainty, 700) || fallbackUncertainty,
    citationsUsed: citations(value.citationsUsed),
    provider: normalizedProvider,
    model: normalizedModel,
  };
}
