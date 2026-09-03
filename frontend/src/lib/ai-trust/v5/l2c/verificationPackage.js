/**
 * L2C → L3 verification bridge.
 *
 * The domain model may request bounded checks, but it cannot create evidence.
 * Every task below is selected from a fixed taxonomy and is normalized at the
 * L3 boundary before it can influence retrieval.
 */

import { STUDENT_DOMAIN_CLASS_IDS, taxonomyEntry } from "./taxonomy.js";

export const STUDENT_DOMAIN_VERIFICATION_SCHEMA_VERSION = "l2c.verification.v1";

export const L2C_VERIFICATION_STATUS = Object.freeze({
  REQUIRED: "REQUIRED",
  NOT_REQUIRED: "NOT_REQUIRED",
  UNKNOWN: "UNKNOWN",
});

export const L2C_VERIFICATION_TASK_TYPES = Object.freeze({
  OFFICIAL_ANNOUNCEMENT_CHECK: "OFFICIAL_ANNOUNCEMENT_CHECK",
  INSTITUTION_FEE_REQUIREMENT_CHECK: "INSTITUTION_FEE_REQUIREMENT_CHECK",
  OFFICIAL_PAYMENT_CHANNEL_CHECK: "OFFICIAL_PAYMENT_CHANNEL_CHECK",
  SENDER_DOMAIN_MATCH_CHECK: "SENDER_DOMAIN_MATCH_CHECK",
  OFFICIAL_PAYMENT_INSTRUCTIONS_CHECK: "OFFICIAL_PAYMENT_INSTRUCTIONS_CHECK",
  OFFICIAL_DEADLINE_CHECK: "OFFICIAL_DEADLINE_CHECK",
  CLAIMED_DEPARTMENT_IDENTITY_CHECK: "CLAIMED_DEPARTMENT_IDENTITY_CHECK",
  OFFICIAL_SOURCE_EXISTENCE_CHECK: "OFFICIAL_SOURCE_EXISTENCE_CHECK",
});

export const L2C_VERIFICATION_SOURCE_SCOPES = Object.freeze({
  OFFICIAL_INSTITUTION: "OFFICIAL_INSTITUTION",
  OFFICIAL_SOURCE: "OFFICIAL_SOURCE",
});

const ORIGIN = "L2C_DOMAIN_AI";
const INPUT_TRUST = "UNTRUSTED_MODEL_OUTPUT";
const MAX_DOMAIN_CLAIMS = 8;
const MAX_TASKS = 12;
const MAX_SOURCE_PURPOSES = 12;
const MAX_EVIDENCE_REQUIREMENTS = 16;

const TASK_CATALOG = Object.freeze({
  [L2C_VERIFICATION_TASK_TYPES.OFFICIAL_ANNOUNCEMENT_CHECK]: Object.freeze({
    purpose: "official scholarship announcement existence",
    sourceScope: L2C_VERIFICATION_SOURCE_SCOPES.OFFICIAL_INSTITUTION,
    candidateSourcePurpose: "OFFICIAL_SCHOLARSHIP_ANNOUNCEMENT",
    targetClaim: "An official institution announcement exists for the claimed scholarship or student benefit.",
    evidenceRequirements: [
      "Current official institution announcement or notice",
      "Institution-owned source identity and publication date",
    ],
  }),
  [L2C_VERIFICATION_TASK_TYPES.INSTITUTION_FEE_REQUIREMENT_CHECK]: Object.freeze({
    purpose: "institution fee requirement",
    sourceScope: L2C_VERIFICATION_SOURCE_SCOPES.OFFICIAL_INSTITUTION,
    candidateSourcePurpose: "OFFICIAL_FEE_POLICY",
    targetClaim: "The institution officially requires the claimed fee, deposit, or processing payment.",
    evidenceRequirements: [
      "Official fee or scholarship policy stating the claimed requirement",
      "Matching scope, amount, and beneficiary conditions",
    ],
  }),
  [L2C_VERIFICATION_TASK_TYPES.OFFICIAL_PAYMENT_CHANNEL_CHECK]: Object.freeze({
    purpose: "official payment channel",
    sourceScope: L2C_VERIFICATION_SOURCE_SCOPES.OFFICIAL_INSTITUTION,
    candidateSourcePurpose: "OFFICIAL_PAYMENT_CHANNEL",
    targetClaim: "The requested payment account, QR destination, or channel is officially controlled by the institution.",
    evidenceRequirements: [
      "Official payment instructions naming the account or channel",
      "Independent match between the channel and the institution-owned source",
    ],
  }),
  [L2C_VERIFICATION_TASK_TYPES.SENDER_DOMAIN_MATCH_CHECK]: Object.freeze({
    purpose: "sender or domain matches official institution channel",
    sourceScope: L2C_VERIFICATION_SOURCE_SCOPES.OFFICIAL_INSTITUTION,
    candidateSourcePurpose: "OFFICIAL_SENDER_DOMAIN",
    targetClaim: "The sender identity and domain match an official institution communication channel.",
    evidenceRequirements: [
      "Official institution contact or domain directory",
      "Observed sender/domain compared without treating similarity as identity proof",
    ],
  }),
  [L2C_VERIFICATION_TASK_TYPES.OFFICIAL_PAYMENT_INSTRUCTIONS_CHECK]: Object.freeze({
    purpose: "official tuition payment instructions",
    sourceScope: L2C_VERIFICATION_SOURCE_SCOPES.OFFICIAL_INSTITUTION,
    candidateSourcePurpose: "OFFICIAL_TUITION_INSTRUCTIONS",
    targetClaim: "Official tuition payment instructions support the claimed recipient, process, and scope.",
    evidenceRequirements: [
      "Current official tuition payment instructions",
      "Institution-owned source with applicable term or academic year",
    ],
  }),
  [L2C_VERIFICATION_TASK_TYPES.OFFICIAL_DEADLINE_CHECK]: Object.freeze({
    purpose: "official tuition or payment deadline",
    sourceScope: L2C_VERIFICATION_SOURCE_SCOPES.OFFICIAL_INSTITUTION,
    candidateSourcePurpose: "OFFICIAL_PAYMENT_DEADLINE",
    targetClaim: "The claimed tuition or payment deadline matches the current official institution schedule.",
    evidenceRequirements: [
      "Current official deadline or academic calendar",
      "Temporal match for the claimed term and action",
    ],
  }),
  [L2C_VERIFICATION_TASK_TYPES.CLAIMED_DEPARTMENT_IDENTITY_CHECK]: Object.freeze({
    purpose: "claimed department identity",
    sourceScope: L2C_VERIFICATION_SOURCE_SCOPES.OFFICIAL_INSTITUTION,
    candidateSourcePurpose: "OFFICIAL_DEPARTMENT_IDENTITY",
    targetClaim: "The claimed finance, student-affairs, or academic department exists and issued the communication.",
    evidenceRequirements: [
      "Official institution directory or department notice",
      "Sender identity and contact channel matched to that department",
    ],
  }),
  [L2C_VERIFICATION_TASK_TYPES.OFFICIAL_SOURCE_EXISTENCE_CHECK]: Object.freeze({
    purpose: "official source existence",
    sourceScope: L2C_VERIFICATION_SOURCE_SCOPES.OFFICIAL_SOURCE,
    candidateSourcePurpose: "OFFICIAL_DOMAIN_SOURCE",
    targetClaim: "An authoritative official source exists for the high-impact domain claim.",
    evidenceRequirements: [
      "At least one authoritative source within the declared official scope",
      "Source provenance, freshness, and claim-specific excerpt",
    ],
  }),
});

const PROFILE_TASKS = Object.freeze({
  FAKE_SCHOLARSHIP: [
    L2C_VERIFICATION_TASK_TYPES.OFFICIAL_ANNOUNCEMENT_CHECK,
    L2C_VERIFICATION_TASK_TYPES.INSTITUTION_FEE_REQUIREMENT_CHECK,
    L2C_VERIFICATION_TASK_TYPES.OFFICIAL_PAYMENT_CHANNEL_CHECK,
    L2C_VERIFICATION_TASK_TYPES.SENDER_DOMAIN_MATCH_CHECK,
  ],
  TUITION_PAYMENT_SCAM: [
    L2C_VERIFICATION_TASK_TYPES.OFFICIAL_PAYMENT_INSTRUCTIONS_CHECK,
    L2C_VERIFICATION_TASK_TYPES.OFFICIAL_PAYMENT_CHANNEL_CHECK,
    L2C_VERIFICATION_TASK_TYPES.OFFICIAL_DEADLINE_CHECK,
    L2C_VERIFICATION_TASK_TYPES.CLAIMED_DEPARTMENT_IDENTITY_CHECK,
  ],
  UNIVERSITY_IMPERSONATION: [
    L2C_VERIFICATION_TASK_TYPES.OFFICIAL_SOURCE_EXISTENCE_CHECK,
    L2C_VERIFICATION_TASK_TYPES.SENDER_DOMAIN_MATCH_CHECK,
    L2C_VERIFICATION_TASK_TYPES.CLAIMED_DEPARTMENT_IDENTITY_CHECK,
  ],
  FACULTY_IMPERSONATION: [
    L2C_VERIFICATION_TASK_TYPES.OFFICIAL_SOURCE_EXISTENCE_CHECK,
    L2C_VERIFICATION_TASK_TYPES.CLAIMED_DEPARTMENT_IDENTITY_CHECK,
    L2C_VERIFICATION_TASK_TYPES.SENDER_DOMAIN_MATCH_CHECK,
  ],
  DEFAULT_HIGH_RISK: [
    L2C_VERIFICATION_TASK_TYPES.OFFICIAL_SOURCE_EXISTENCE_CHECK,
    L2C_VERIFICATION_TASK_TYPES.SENDER_DOMAIN_MATCH_CHECK,
  ],
});

function boundedString(value, maxLength = 500) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength) : "";
}

function uniqueStrings(values, maxLength) {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.trim()).map((value) => boundedString(value, 240))))
    .slice(0, maxLength);
}

function safeClassifications(classification, secondaryClassifications = []) {
  return Array.from(new Set([
    classification,
    ...(Array.isArray(secondaryClassifications) ? secondaryClassifications : []),
  ].filter((value) => typeof value === "string" && STUDENT_DOMAIN_CLASS_IDS.includes(value)))).slice(0, 8);
}

function taskTypesFor(classifications) {
  const types = [];
  for (const classification of classifications) {
    const profile = PROFILE_TASKS[classification] || PROFILE_TASKS.DEFAULT_HIGH_RISK;
    for (const type of profile) if (!types.includes(type)) types.push(type);
  }
  return types.slice(0, MAX_TASKS);
}

function importanceFor(classifications) {
  return classifications.some((classification) => taxonomyEntry(classification)?.highRisk) ? "high" : "medium";
}

function packageForClassifications(classifications) {
  const highImpact = classifications.filter((classification) => taxonomyEntry(classification)?.highRisk);
  const required = highImpact.length > 0;
  const taskTypes = required ? taskTypesFor(highImpact) : [];
  const importance = importanceFor(highImpact);
  const domainClaims = highImpact.slice(0, MAX_DOMAIN_CLAIMS).map((classification) => {
    const entry = taxonomyEntry(classification);
    return {
      claimId: `l2c-domain-${classification.toLowerCase()}`,
      classification,
      statement: boundedString(entry?.description || `Domain classification ${classification}.`, 500),
      importance,
      origin: ORIGIN,
      candidateOnly: true,
      inputTrust: INPUT_TRUST,
    };
  });
  const verificationTasks = taskTypes.map((type, index) => {
    const catalog = TASK_CATALOG[type];
    const owner = highImpact.find((classification) => (PROFILE_TASKS[classification] || PROFILE_TASKS.DEFAULT_HIGH_RISK).includes(type)) || highImpact[0];
    return {
      taskId: `l2c-${owner.toLowerCase()}-${type.toLowerCase()}`.slice(0, 180),
      type,
      classification: owner,
      priority: index < 4 ? "HIGH" : "MEDIUM",
      claimId: `l2c-domain-${owner.toLowerCase()}`,
      purpose: catalog.purpose,
      targetClaim: catalog.targetClaim,
      sourceScope: catalog.sourceScope,
      evidenceRequirements: catalog.evidenceRequirements.slice(0, 4),
      origin: ORIGIN,
      candidateOnly: true,
      inputTrust: INPUT_TRUST,
    };
  });
  return {
    schemaVersion: STUDENT_DOMAIN_VERIFICATION_SCHEMA_VERSION,
    status: required ? L2C_VERIFICATION_STATUS.REQUIRED : classifications.includes("UNKNOWN_STUDENT_RISK") ? L2C_VERIFICATION_STATUS.UNKNOWN : L2C_VERIFICATION_STATUS.NOT_REQUIRED,
    domainClaims: domainClaims.slice(0, MAX_DOMAIN_CLAIMS),
    verificationTasks: verificationTasks.slice(0, MAX_TASKS),
    candidateSourcePurposes: uniqueStrings(verificationTasks.map((task) => TASK_CATALOG[task.type].candidateSourcePurpose), MAX_SOURCE_PURPOSES),
    evidenceRequirements: uniqueStrings(verificationTasks.flatMap((task) => task.evidenceRequirements), MAX_EVIDENCE_REQUIREMENTS),
    candidateOnly: true,
    inputTrust: INPUT_TRUST,
  };
}

export function buildStudentDomainVerificationPackage({ classification, secondaryClassifications } = {}) {
  return packageForClassifications(safeClassifications(classification, secondaryClassifications));
}

function normalizedTask(type, classification, index) {
  const catalog = TASK_CATALOG[type];
  if (!catalog || !STUDENT_DOMAIN_CLASS_IDS.includes(classification)) return null;
  const owner = taxonomyEntry(classification)?.highRisk ? classification : "UNKNOWN_STUDENT_RISK";
  return {
    taskId: `l2c-${owner.toLowerCase()}-${type.toLowerCase()}-${index + 1}`.slice(0, 180),
    type,
    classification: owner,
    priority: index < 4 ? "HIGH" : "MEDIUM",
    claimId: `l2c-domain-${owner.toLowerCase()}`,
    purpose: catalog.purpose,
    targetClaim: catalog.targetClaim,
    sourceScope: catalog.sourceScope,
    evidenceRequirements: catalog.evidenceRequirements.slice(0, 4),
    origin: ORIGIN,
    candidateOnly: true,
    inputTrust: INPUT_TRUST,
  };
}

/**
 * Reconstructs only fixed-profile tasks. Arbitrary model-provided prose,
 * citations, sources, and evidence are deliberately discarded.
 */
export function normalizeStudentDomainVerificationPackage(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const rawClaims = Array.isArray(input.domainClaims) ? input.domainClaims : [];
  const rawTasks = Array.isArray(input.verificationTasks) ? input.verificationTasks : [];
  const classifications = safeClassifications(
    rawClaims[0]?.classification || rawTasks[0]?.classification,
    [...rawClaims.map((claim) => claim?.classification), ...rawTasks.map((task) => task?.classification)],
  ).filter((classification) => taxonomyEntry(classification)?.highRisk);
  const taskTypes = Array.from(new Set(rawTasks.map((task) => task?.type).filter((type) => Object.values(L2C_VERIFICATION_TASK_TYPES).includes(type)))).slice(0, MAX_TASKS);
  const highImpactClass = classifications[0] || "UNKNOWN_STUDENT_RISK";
  const tasks = taskTypes.map((type, index) => {
    const sourceTask = rawTasks.find((task) => task?.type === type);
    const taskClass = classifications.includes(sourceTask?.classification) ? sourceTask.classification : highImpactClass;
    return normalizedTask(type, taskClass, index);
  }).filter(Boolean);
  const domainClaims = classifications.slice(0, MAX_DOMAIN_CLAIMS).map((classification) => ({
    claimId: `l2c-domain-${classification.toLowerCase()}`,
    classification,
    statement: boundedString(taxonomyEntry(classification)?.description, 500),
    importance: "high",
    origin: ORIGIN,
    candidateOnly: true,
    inputTrust: INPUT_TRUST,
  }));
  const sourcePurposes = uniqueStrings(tasks.map((task) => TASK_CATALOG[task.type].candidateSourcePurpose), MAX_SOURCE_PURPOSES);
  const evidenceRequirements = uniqueStrings(tasks.flatMap((task) => task.evidenceRequirements), MAX_EVIDENCE_REQUIREMENTS);
  return {
    schemaVersion: STUDENT_DOMAIN_VERIFICATION_SCHEMA_VERSION,
    status: tasks.length > 0 || classifications.length > 0 ? L2C_VERIFICATION_STATUS.REQUIRED : L2C_VERIFICATION_STATUS.UNKNOWN,
    domainClaims,
    verificationTasks: tasks,
    candidateSourcePurposes: sourcePurposes,
    evidenceRequirements,
    candidateOnly: true,
    inputTrust: INPUT_TRUST,
  };
}

export function verificationTaskCatalog(type) {
  return TASK_CATALOG[type] || null;
}
