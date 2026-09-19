/**
 * Bounded Gemini evidence-gap contract.
 *
 * This response is deliberately query-only: Gemini can request more evidence,
 * but it cannot provide a URL, citation, or source record. Tavily remains the
 * only retrieval authority.
 */

const URL_PATTERN = /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|org|edu|gov|vn|net)\b)/i;

function boundedText(value, maxLength = 700) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength)
    : "";
}

function safeGap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const reason = boundedText(value.reason, 500);
  const suggestedQuery = boundedText(value.suggestedQuery, 320);
  const preferredAuthority = boundedText(value.preferredAuthority, 180);
  const targetClaimId = boundedText(value.targetClaimId, 180);
  if (!reason || !suggestedQuery || URL_PATTERN.test(suggestedQuery)) return null;
  if (URL_PATTERN.test(preferredAuthority)) return null;
  return { reason, suggestedQuery, preferredAuthority, targetClaimId };
}

export const GEMINI_EVIDENCE_GAP_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["needsMoreEvidence", "evidenceGaps"],
  properties: {
    needsMoreEvidence: { type: "boolean" },
    evidenceGaps: {
      type: "array",
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["reason", "suggestedQuery", "preferredAuthority", "targetClaimId"],
        properties: {
          reason: { type: "string", maxLength: 500 },
          suggestedQuery: { type: "string", maxLength: 320 },
          preferredAuthority: { type: "string", maxLength: 180 },
          targetClaimId: { type: "string", maxLength: 180 },
        },
      },
    },
  },
});

export function isValidGeminiEvidenceGap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (typeof value.needsMoreEvidence !== "boolean") return false;
  if (!Array.isArray(value.evidenceGaps) || value.evidenceGaps.length > 2) return false;
  return value.evidenceGaps.every((gap) => Boolean(safeGap(gap)));
}

export function normalizeGeminiEvidenceGap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { needsMoreEvidence: false, evidenceGaps: [] };
  }
  const evidenceGaps = Array.isArray(value.evidenceGaps)
    ? value.evidenceGaps.slice(0, 2).map(safeGap).filter(Boolean)
    : [];
  return {
    needsMoreEvidence: value.needsMoreEvidence === true && evidenceGaps.length > 0,
    evidenceGaps,
  };
}

