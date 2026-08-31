import { STUDENT_DOMAIN_CLASS_IDS, STUDENT_DOMAIN_TAXONOMY_VERSION } from "./taxonomy.js";

export const STUDENT_DOMAIN_DATASET_VERSION = "studenthub-domain-dataset-contract-1.0.0";

const INPUT_TYPES = new Set(["text", "url", "image", "file"]);
const RESOLUTION_STATUSES = new Set(["UNRESOLVED", "RESOLVED", "DISPUTED", "RETRACTED"]);
const LABEL_AUTHORITIES = new Set(["UNKNOWN", "COMMUNITY_REPORT", "AI_SUGGESTION", "VERIFIED_HUMAN_REVIEW", "OFFICIAL_SOURCE"]);

function boundedString(value, limit) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, limit) : "";
}

function redact(value) {
  const source = boundedString(value, 16_000);
  const redactions = [];
  let sanitizedContent = source
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/giu, () => { redactions.push("EMAIL"); return "[REDACTED_EMAIL]"; })
    .replace(/(?<!\d)(?:\+?84|0)(?:\s|[-.]?\d){8,12}(?!\d)/gu, () => { redactions.push("PHONE"); return "[REDACTED_PHONE]"; })
    .replace(/\b(?:sv|mssv|student\s*id|ma\s*sv)\s*[:#-]?\s*[a-z0-9-]{4,24}\b/giu, () => { redactions.push("STUDENT_ID"); return "[REDACTED_STUDENT_ID]"; })
    .replace(/((?:^|[?&\s])(?:token|access_token|auth|code|key|signature)=)[^&\s]+/giu, "$1[REDACTED_QUERY]");
  if (sanitizedContent.length > 16_000) sanitizedContent = sanitizedContent.slice(0, 16_000);
  return { sanitizedContent, redactions: Array.from(new Set(redactions)) };
}

export function sanitizeStudentDomainCase(input = {}) {
  const value = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const redacted = redact(value.sanitizedContent ?? value.content ?? "");
  return {
    caseId: boundedString(value.caseId, 160),
    inputType: INPUT_TYPES.has(value.inputType) ? value.inputType : "text",
    sanitizedContent: redacted.sanitizedContent,
    features: value.features && typeof value.features === "object" && !Array.isArray(value.features) ? Object.fromEntries(Object.entries(value.features).slice(0, 32).map(([key, item]) => [boundedString(key, 80), typeof item === "number" && Number.isFinite(item) ? item : boundedString(item, 200)])) : {},
    label: STUDENT_DOMAIN_CLASS_IDS.includes(value.label) ? value.label : "UNKNOWN_STUDENT_RISK",
    secondaryLabels: Array.isArray(value.secondaryLabels) ? value.secondaryLabels.filter((item) => STUDENT_DOMAIN_CLASS_IDS.includes(item)).slice(0, 8) : [],
    evidenceRefs: Array.isArray(value.evidenceRefs) ? value.evidenceRefs.filter((item) => typeof item === "string").map((item) => boundedString(item, 240)).filter(Boolean).slice(0, 20) : [],
    labelAuthority: LABEL_AUTHORITIES.has(value.labelAuthority) ? value.labelAuthority : "UNKNOWN",
    resolutionStatus: RESOLUTION_STATUSES.has(value.resolutionStatus) ? value.resolutionStatus : "UNRESOLVED",
    resolutionTimestamp: typeof value.resolutionTimestamp === "string" ? value.resolutionTimestamp.slice(0, 80) : null,
    reviewerScope: boundedString(value.reviewerScope, 240),
    sourceTypes: Array.isArray(value.sourceTypes) ? value.sourceTypes.filter((item) => typeof item === "string").map((item) => boundedString(item, 80)).slice(0, 12) : [],
    language: boundedString(value.language, 32) || "vi",
    institutionContext: boundedString(value.institutionContext, 160) || null,
    modelEligible: value.modelEligible === true,
    privacyReview: {
      status: value.privacyReview?.status === "APPROVED" ? "APPROVED" : "REQUIRED",
      redactions: Array.from(new Set([...(Array.isArray(value.privacyReview?.redactions) ? value.privacyReview.redactions : []), ...redacted.redactions])).filter((item) => typeof item === "string").map((item) => item.slice(0, 80)).slice(0, 20),
      reviewer: boundedString(value.privacyReview?.reviewer, 120) || null,
    },
    datasetVersion: boundedString(value.datasetVersion, 120) || STUDENT_DOMAIN_DATASET_VERSION,
    taxonomyVersion: boundedString(value.taxonomyVersion, 120) || STUDENT_DOMAIN_TAXONOMY_VERSION,
  };
}

export function validateStudentDomainCase(input = {}) {
  const value = sanitizeStudentDomainCase(input);
  const errors = [];
  if (!value.caseId) errors.push("caseId_required");
  if (!value.sanitizedContent) errors.push("sanitizedContent_required");
  if (value.labelAuthority === "VERIFIED_HUMAN_REVIEW" && value.resolutionStatus !== "RESOLVED") errors.push("verified_label_requires_resolved_case");
  if (value.modelEligible && (value.labelAuthority !== "VERIFIED_HUMAN_REVIEW" || value.resolutionStatus !== "RESOLVED" || value.privacyReview.status !== "APPROVED" || value.evidenceRefs.length === 0)) errors.push("model_eligibility_requirements_missing");
  return { valid: errors.length === 0, errors, value };
}

export function isEligibleForFineTuning(input = {}) {
  const result = validateStudentDomainCase(input);
  return result.valid && result.value.modelEligible === true;
}
