import crypto from "node:crypto";

export const PASSPORT_STATUS = Object.freeze({
  UNKNOWN: "UNKNOWN",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  SUPPORTED: "SUPPORTED",
  SAFE_WITHIN_SCOPE: "SAFE_WITHIN_SCOPE",
  SUSPICIOUS: "SUSPICIOUS",
  HIGH_RISK: "HIGH_RISK",
  DANGEROUS: "DANGEROUS",
  DISPUTED: "DISPUTED",
  RESOLVED: "RESOLVED",
});

export const PASSPORT_EVENT_TYPE = Object.freeze({
  CREATED: "CREATED",
  USER_NOTE: "USER_NOTE",
  TRUST_RESULT: "TRUST_RESULT",
  COMMUNITY_UPDATE: "COMMUNITY_UPDATE",
  EXPERT_REVIEW: "EXPERT_REVIEW",
  OFFICIAL_UPDATE: "OFFICIAL_UPDATE",
  RESULT_CHANGED: "RESULT_CHANGED",
  RESOLVED: "RESOLVED",
});

export const PROVENANCE_CLASS = Object.freeze({
  OFFICIAL: "OFFICIAL",
  TRUST_ENGINE: "TRUST_ENGINE",
  COMMUNITY: "COMMUNITY",
  EXPERT: "EXPERT",
  DETERMINISTIC_RULE: "DETERMINISTIC_RULE",
  MODEL_ESTIMATE: "MODEL_ESTIMATE",
  USER_SUBMISSION: "USER_SUBMISSION",
  DEMO_FIXTURE: "DEMO_FIXTURE",
});

const VALID_STATUSES = new Set(Object.values(PASSPORT_STATUS));
const VALID_EVENT_TYPES = new Set(Object.values(PASSPORT_EVENT_TYPE));
const VALID_PROVENANCE = new Set(Object.values(PROVENANCE_CLASS));
const STATUS_CHANGING_EVENTS = new Set([
  PASSPORT_EVENT_TYPE.TRUST_RESULT,
  PASSPORT_EVENT_TYPE.OFFICIAL_UPDATE,
  PASSPORT_EVENT_TYPE.RESULT_CHANGED,
  PASSPORT_EVENT_TYPE.RESOLVED,
]);

export class EvidencePassportValidationError extends Error {
  constructor(message, code = "INVALID_EVIDENCE_PASSPORT") {
    super(message);
    this.name = "EvidencePassportValidationError";
    this.code = code;
  }
}

function requiredText(value, field, max = 500) {
  const clean = String(value || "").trim();
  if (!clean) throw new EvidencePassportValidationError(`${field} is required.`);
  if (clean.length > max) throw new EvidencePassportValidationError(`${field} exceeds ${max} characters.`);
  return clean;
}

function isoDate(value, field) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new EvidencePassportValidationError(`${field} must be a valid date.`);
  return date.toISOString();
}

function validateStatus(status) {
  if (!VALID_STATUSES.has(status)) throw new EvidencePassportValidationError(`Unsupported passport status: ${status}.`);
  return status;
}

export function createEvidencePassport({
  id,
  ownerId,
  title,
  subjectType = "TRUST_CASE",
  subjectId,
  initialStatus = PASSPORT_STATUS.INSUFFICIENT_EVIDENCE,
  createdAt = new Date().toISOString(),
  demo = false,
}) {
  const timestamp = isoDate(createdAt, "createdAt");
  const passport = {
    id: requiredText(id, "id", 120),
    ownerId: requiredText(ownerId, "ownerId", 160),
    title: requiredText(title, "title", 200),
    subjectType: requiredText(subjectType, "subjectType", 80),
    subjectId: requiredText(subjectId, "subjectId", 160),
    currentStatus: validateStatus(initialStatus),
    revision: 1,
    demo: Boolean(demo),
    createdAt: timestamp,
    updatedAt: timestamp,
    events: [],
  };

  return appendEvidenceEvent(passport, {
    id: `${passport.id}:created`,
    type: PASSPORT_EVENT_TYPE.CREATED,
    provenanceClass: demo ? PROVENANCE_CLASS.DEMO_FIXTURE : PROVENANCE_CLASS.USER_SUBMISSION,
    summary: "Evidence Passport created.",
    occurredAt: timestamp,
    previousStatus: initialStatus,
    newStatus: initialStatus,
    material: false,
    references: [],
  }, { preserveInitialRevision: true });
}

export function appendEvidenceEvent(passport, rawEvent, options = {}) {
  if (!passport || typeof passport !== "object") throw new EvidencePassportValidationError("passport is required.");
  if (!VALID_EVENT_TYPES.has(rawEvent?.type)) throw new EvidencePassportValidationError(`Unsupported event type: ${rawEvent?.type}.`);
  if (!VALID_PROVENANCE.has(rawEvent?.provenanceClass)) throw new EvidencePassportValidationError(`Unsupported provenance class: ${rawEvent?.provenanceClass}.`);
  if (passport.demo && rawEvent.provenanceClass !== PROVENANCE_CLASS.DEMO_FIXTURE) {
    throw new EvidencePassportValidationError("Demo passports may only contain DEMO_FIXTURE events.", "DEMO_PROVENANCE_MISMATCH");
  }
  if (!passport.demo && rawEvent.provenanceClass === PROVENANCE_CLASS.DEMO_FIXTURE) {
    throw new EvidencePassportValidationError("Demo evidence cannot be appended to a live passport.", "DEMO_DATA_REJECTED");
  }

  const occurredAt = isoDate(rawEvent.occurredAt || new Date().toISOString(), "occurredAt");
  const lastEvent = passport.events?.at(-1);
  if (lastEvent && new Date(occurredAt) < new Date(lastEvent.occurredAt)) {
    throw new EvidencePassportValidationError("Passport events must be appended in chronological order.", "NON_MONOTONIC_EVENT");
  }
  if (passport.events?.some((event) => event.id === rawEvent.id)) {
    throw new EvidencePassportValidationError("Passport event id already exists.", "DUPLICATE_EVENT");
  }

  const requestedStatus = rawEvent.newStatus || passport.currentStatus;
  validateStatus(requestedStatus);
  if (requestedStatus !== passport.currentStatus && !STATUS_CHANGING_EVENTS.has(rawEvent.type)) {
    throw new EvidencePassportValidationError(`${rawEvent.type} cannot change the passport result.`, "INVALID_STATUS_TRANSITION");
  }
  if (rawEvent.type === PASSPORT_EVENT_TYPE.RESOLVED && ![PROVENANCE_CLASS.OFFICIAL, PROVENANCE_CLASS.DETERMINISTIC_RULE, PROVENANCE_CLASS.DEMO_FIXTURE].includes(rawEvent.provenanceClass)) {
    throw new EvidencePassportValidationError("Resolution requires official or deterministic provenance.", "UNSCOPED_RESOLUTION");
  }

  const statusChanged = requestedStatus !== passport.currentStatus;
  const event = {
    id: requiredText(rawEvent.id, "event.id", 180),
    type: rawEvent.type,
    provenanceClass: rawEvent.provenanceClass,
    summary: requiredText(rawEvent.summary, "event.summary", 600),
    occurredAt,
    previousStatus: rawEvent.previousStatus || passport.currentStatus,
    newStatus: requestedStatus,
    material: Boolean(rawEvent.material || statusChanged),
    changeReason: rawEvent.changeReason ? requiredText(rawEvent.changeReason, "event.changeReason", 600) : null,
    references: Array.isArray(rawEvent.references) ? rawEvent.references.map((reference) => ({
      id: requiredText(reference.id, "reference.id", 180),
      label: requiredText(reference.label, "reference.label", 240),
      sourceType: requiredText(reference.sourceType || rawEvent.provenanceClass, "reference.sourceType", 80),
    })) : [],
    metadata: rawEvent.metadata && typeof rawEvent.metadata === "object" ? { ...rawEvent.metadata } : {},
  };

  const prevHash = lastEvent?.metadata?.hash || "GENESIS";
  event.metadata.hash = computeEventHash(prevHash, event);

  return {
    ...passport,
    currentStatus: requestedStatus,
    revision: options.preserveInitialRevision ? passport.revision : passport.revision + 1,
    updatedAt: occurredAt,
    events: [...(passport.events || []), event],
  };
}

export function computeEventHash(prevHash, event) {
  const payload = [
    prevHash || "GENESIS",
    event.id,
    event.type,
    event.provenanceClass,
    event.previousStatus,
    event.newStatus,
    event.occurredAt,
  ].join("|");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function verifyPassportIntegrity(passport) {
  if (!passport || !Array.isArray(passport.events) || passport.events.length === 0) {
    return { valid: false, reason: "EMPTY_PASSPORT" };
  }

  let expectedPrevHash = "GENESIS";
  for (let i = 0; i < passport.events.length; i += 1) {
    const event = passport.events[i];
    const eventHash = event.metadata?.hash;
    const computed = computeEventHash(expectedPrevHash, event);
    if (eventHash && eventHash !== computed) {
      return {
        valid: false,
        reason: "TAMPER_DETECTED",
        tamperedEventId: event.id,
        tamperedRevision: i + 1,
      };
    }
    expectedPrevHash = computed;
  }
  return { valid: true, eventCount: passport.events.length };
}

export function passportChangeSummary(passport) {
  const materialEvents = (passport?.events || []).filter((event) => event.material);
  const latest = materialEvents.at(-1) || null;
  return {
    changed: materialEvents.length > 0,
    materialChangeCount: materialEvents.length,
    oldResult: latest?.previousStatus || passport?.currentStatus || PASSPORT_STATUS.UNKNOWN,
    newResult: latest?.newStatus || passport?.currentStatus || PASSPORT_STATUS.UNKNOWN,
    why: latest?.changeReason || null,
    newEvidence: latest?.references || [],
    changedAt: latest?.occurredAt || null,
  };
}
