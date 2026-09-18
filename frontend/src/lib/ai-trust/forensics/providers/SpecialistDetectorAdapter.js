/**
 * StudentHub AI — SpecialistDetectorAdapter (Forensic Provider Contracts)
 * 
 * Defines canonical forensic detector enums, provider result contracts,
 * and standard evaluation boundaries.
 * 
 * STRICT SEMANTIC SEPARATION:
 * - GenAI detection: "Was the image likely synthesized using generative AI?"
 * - Deepfake detection: "Does facial media show deepfake or face-swap manipulation?"
 * - Manipulation detection: "Are there structural tampering/splicing artifacts?"
 * These answer three distinct questions and are NEVER conflated.
 */

export const FORENSIC_DETECTOR_TYPES = Object.freeze({
  GENAI_DETECTION: "GENAI_DETECTION",
  DEEPFAKE_DETECTION: "DEEPFAKE_DETECTION",
  IMAGE_MANIPULATION: "IMAGE_MANIPULATION",
});

export const GENAI_VERDICTS = Object.freeze({
  LIKELY_AI_GENERATED: "LIKELY_AI_GENERATED",
  POSSIBLY_AI_GENERATED: "POSSIBLY_AI_GENERATED",
  NO_STRONG_AI_SIGNAL: "NO_STRONG_AI_SIGNAL",
  UNCERTAIN: "UNCERTAIN",
  UNKNOWN: "UNKNOWN",
});

export const DEEPFAKE_VERDICTS = Object.freeze({
  LIKELY_DEEPFAKE: "LIKELY_DEEPFAKE",
  POSSIBLY_DEEPFAKE: "POSSIBLY_DEEPFAKE",
  NO_STRONG_DEEPFAKE_SIGNAL: "NO_STRONG_DEEPFAKE_SIGNAL",
  NOT_APPLICABLE: "NOT_APPLICABLE",
  UNCERTAIN: "UNCERTAIN",
  UNKNOWN: "UNKNOWN",
});

export const MANIPULATION_VERDICTS = Object.freeze({
  LIKELY_MANIPULATED: "LIKELY_MANIPULATED",
  POSSIBLY_MANIPULATED: "POSSIBLY_MANIPULATED",
  NO_STRONG_MANIPULATION_SIGNAL: "NO_STRONG_MANIPULATION_SIGNAL",
  UNCERTAIN: "UNCERTAIN",
  UNKNOWN: "UNKNOWN",
});

export const CONFIDENCE_TYPES = Object.freeze({
  PROVIDER_SCORE: "PROVIDER_SCORE",
  CALIBRATED_CONFIDENCE: "CALIBRATED_CONFIDENCE",
  EVIDENCE_CONFIDENCE: "EVIDENCE_CONFIDENCE",
  QUALITY_SCORE: "QUALITY_SCORE",
});

export const DETECTOR_STATUS = Object.freeze({
  SUCCESS: "SUCCESS",
  PARTIAL: "PARTIAL",
  FAILED: "FAILED",
  TIMEOUT: "TIMEOUT",
  RATE_LIMITED: "RATE_LIMITED",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  NOT_SUPPORTED: "NOT_SUPPORTED",
});

/**
 * Standardized provider result contract.
 */
export function createProviderResult({
  provider = "unknown",
  detector = FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
  status = DETECTOR_STATUS.NOT_CONFIGURED,
  verdict = "UNKNOWN",
  providerScore = null,
  calibratedConfidence = null,
  confidenceType = CONFIDENCE_TYPES.PROVIDER_SCORE,
  reasonCode = "NOT_EVALUATED",
  humanExplanation = "Chưa có đánh giá từ detector.",
  durationMs = 0,
  httpStatus = null,
  modelVersion = null,
  providerVersion = null,
  warnings = [],
} = {}) {
  // Sanitize HTTP status: integer 100-599 or null
  const cleanHttpStatus = Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599
    ? httpStatus
    : null;

  // Enforce score boundaries
  const cleanProviderScore = typeof providerScore === "number" && Number.isFinite(providerScore)
    ? Math.max(0, Math.min(1, Number(providerScore.toFixed(4))))
    : null;

  const cleanCalibratedConfidence = typeof calibratedConfidence === "number" && Number.isFinite(calibratedConfidence)
    ? Math.max(0, Math.min(1, Number(calibratedConfidence.toFixed(4))))
    : null;

  return {
    provider: String(provider || "unknown").slice(0, 80),
    detector,
    status,
    verdict,
    providerScore: cleanProviderScore,
    calibratedConfidence: cleanCalibratedConfidence,
    confidenceType,
    reasonCode: String(reasonCode || "UNKNOWN").slice(0, 80),
    humanExplanation: String(humanExplanation || "").slice(0, 500),
    durationMs: Math.max(0, Math.round(Number(durationMs) || 0)),
    httpStatus: cleanHttpStatus,
    modelVersion: modelVersion ? String(modelVersion).slice(0, 80) : null,
    providerVersion: providerVersion ? String(providerVersion).slice(0, 80) : null,
    warnings: Array.isArray(warnings) ? warnings.slice(0, 10).map(w => String(w).slice(0, 200)) : [],
  };
}
