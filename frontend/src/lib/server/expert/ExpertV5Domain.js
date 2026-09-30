import { randomInt } from "node:crypto";

export const EXPERT_V5_DIFFICULTIES = Object.freeze(["EASY", "MEDIUM", "HARD"]);
export const EXPERT_V5_QUESTION_TYPES = Object.freeze(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"]);
export const EXPERT_V5_QUESTION_STATES = Object.freeze(["DRAFT", "ACTIVE", "REVALIDATION_REQUIRED", "RETIRED"]);
export const EXPERT_V5_ROOM_STATES = Object.freeze([
  "WAITING_FOR_SUPERVISOR", "LOBBY", "QUESTION_ACTIVE", "ANSWER_LOCKED", "TRUST_ANALYZING",
  "ADJUDICATION", "SUPERVISOR_CONFIRMATION", "HOST_ACKNOWLEDGEMENT", "DISPUTED", "SETTLED",
  "CLOSED", "CANCELLED", "TRUST_UNAVAILABLE", "ADJUDICATION_BLOCKED",
]);

export const MISSION_LEVEL_POLICY = Object.freeze({
  1: Object.freeze({ completedMissionsRequired: 0, allowedDifficulties: Object.freeze(["EASY"]) }),
  2: Object.freeze({ completedMissionsRequired: 5, allowedDifficulties: Object.freeze(["EASY", "MEDIUM"]) }),
  3: Object.freeze({ completedMissionsRequired: 15, allowedDifficulties: Object.freeze(["MEDIUM"]) }),
  4: Object.freeze({ completedMissionsRequired: 30, allowedDifficulties: Object.freeze(["MEDIUM", "HARD"]) }),
  5: Object.freeze({ completedMissionsRequired: 50, allowedDifficulties: Object.freeze(["HARD"]) }),
});

export const ROOM_RUBRIC = Object.freeze({
  version: "expert-room-evidence-rubric.v1",
  dimensions: Object.freeze([
    Object.freeze({ id: "SOURCE_ALIGNMENT", weight: 0.5 }),
    Object.freeze({ id: "EVIDENCE_USE", weight: 0.3 }),
    Object.freeze({ id: "UNCERTAINTY_CALIBRATION", weight: 0.2 }),
  ]),
  allowedRatings: Object.freeze([0, 50, 100]),
});

const ROOM_TRANSITIONS = Object.freeze({
  WAITING_FOR_SUPERVISOR: new Set(["LOBBY", "CANCELLED", "CLOSED"]),
  LOBBY: new Set(["QUESTION_ACTIVE", "CANCELLED", "CLOSED"]),
  QUESTION_ACTIVE: new Set(["ANSWER_LOCKED", "CANCELLED", "CLOSED"]),
  ANSWER_LOCKED: new Set(["TRUST_ANALYZING", "CANCELLED", "CLOSED"]),
  TRUST_ANALYZING: new Set(["ADJUDICATION", "TRUST_UNAVAILABLE", "ADJUDICATION_BLOCKED", "CLOSED"]),
  ADJUDICATION: new Set(["SUPERVISOR_CONFIRMATION", "ADJUDICATION_BLOCKED", "DISPUTED", "CLOSED"]),
  SUPERVISOR_CONFIRMATION: new Set(["HOST_ACKNOWLEDGEMENT", "DISPUTED", "CLOSED"]),
  HOST_ACKNOWLEDGEMENT: new Set(["SETTLED", "DISPUTED", "CLOSED"]),
  TRUST_UNAVAILABLE: new Set(["CLOSED"]),
  ADJUDICATION_BLOCKED: new Set(["CLOSED"]),
  DISPUTED: new Set(["CLOSED"]),
  SETTLED: new Set(["CLOSED"]),
  CLOSED: new Set(),
  CANCELLED: new Set(),
});

const BLOCKED_RETRIEVAL_MARKERS = new Set([
  "BLOCKED", "AUTH_FAILED", "AUTH_REQUIRED", "LOGIN_REQUIRED", "PAYWALL", "CAPTCHA",
  "ANTI_BOT", "CLOUDFLARE", "ROBOTS_DENIED", "RATE_LIMITED", "PERMISSION_DENIED",
]);

function normalizedText(value, maxLength = 2_000) {
  return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, maxLength) : "";
}

export function difficultyForMissionLevel(level) {
  const numeric = Math.max(1, Math.min(5, Number(level) || 1));
  return MISSION_LEVEL_POLICY[numeric].allowedDifficulties;
}

export function resolveMissionLevel(completedMissions) {
  const completed = Math.max(0, Number(completedMissions) || 0);
  return Object.entries(MISSION_LEVEL_POLICY)
    .map(([level, policy]) => [Number(level), policy])
    .filter(([, policy]) => completed >= policy.completedMissionsRequired)
    .reduce((highest, [level]) => Math.max(highest, level), 1);
}

/** Difficulty is deterministic and derived from explicit, reviewable evidence properties. */
export function deriveQuestionDifficulty({ sourceCount = 1, evidenceCount = 1, ambiguity = 0, temporalReasoning = false } = {}) {
  const sources = Math.max(1, Math.trunc(Number(sourceCount) || 1));
  const evidence = Math.max(1, Math.trunc(Number(evidenceCount) || 1));
  const ambiguityScore = Math.max(0, Math.min(2, Math.trunc(Number(ambiguity) || 0)));
  const score = (sources > 1 ? 2 : 0) + (evidence >= 3 ? 1 : 0) + ambiguityScore + (temporalReasoning ? 1 : 0);
  if (score >= 5) return "HARD";
  if (score >= 2) return "MEDIUM";
  return "EASY";
}

export function classifyRemoteRetrieval({ outcome, status, httpStatus, reason } = {}) {
  const normalizedOutcome = String(outcome || status || "").trim().toUpperCase();
  const normalizedReason = String(reason || "").trim().toUpperCase();
  const code = Number(httpStatus);
  if (BLOCKED_RETRIEVAL_MARKERS.has(normalizedOutcome) || BLOCKED_RETRIEVAL_MARKERS.has(normalizedReason)
    || [401, 402, 403, 407, 429].includes(code)) {
    return { remoteRetrieval: "BLOCKED", trustAnalysis: "N/A" };
  }
  if (["SUCCESS", "SUCCEEDED", "RETRIEVED", "LIVE_SUCCESS"].includes(normalizedOutcome)) {
    return { remoteRetrieval: "SUCCESS", trustAnalysis: "PENDING" };
  }
  return { remoteRetrieval: "UNAVAILABLE", trustAnalysis: "N/A" };
}

export function classifyRoomTrustRetrieval({ inputType, directSource, fallbackStatus, httpStatus } = {}) {
  if (String(inputType || "").toUpperCase() !== "URL") {
    return { remoteRetrieval: "NOT_APPLICABLE", trustAnalysis: "PENDING" };
  }
  if (!directSource) {
    const fallback = classifyRemoteRetrieval({ outcome: fallbackStatus, status: fallbackStatus, httpStatus });
    return fallback.remoteRetrieval === "BLOCKED"
      ? fallback
      : { remoteRetrieval: "UNAVAILABLE", trustAnalysis: "N/A" };
  }
  return classifyRemoteRetrieval({
    outcome: directSource.retrievalOutcome,
    status: directSource.providerStatus || directSource.retrievalOutcome,
    httpStatus: directSource.httpStatus ?? httpStatus,
    reason: directSource.blockingReason || directSource.errorCode || directSource.providerStatus,
  });
}

export function validateQuestionActivation({ question, sourceSnapshot, reviewerId, reviewChecks } = {}) {
  const reasons = [];
  const q = question && typeof question === "object" ? question : {};
  const source = sourceSnapshot && typeof sourceSnapshot === "object" ? sourceSnapshot : {};
  const type = String(q.questionType || "").toUpperCase();
  if (!EXPERT_V5_QUESTION_TYPES.includes(type)) reasons.push("UNSUPPORTED_QUESTION_TYPE");
  if (normalizedText(q.prompt, 1_001).length < 20) reasons.push("QUESTION_TEXT_TOO_SHORT");
  if (!EXPERT_V5_DIFFICULTIES.includes(String(q.difficulty || "").toUpperCase())) reasons.push("DIFFICULTY_REQUIRED");
  if (!/^[A-Z][A-Z0-9_:-]{1,79}$/.test(String(q.domainCode || ""))) reasons.push("DOMAIN_REQUIRED");
  if (source.retrievalStatus !== "SUCCESS" || source.remoteRetrieval !== "SUCCESS") reasons.push("SOURCE_NOT_RETRIEVED");
  if (!/^https:\/\//i.test(String(source.canonicalUrl || ""))) reasons.push("CANONICAL_HTTPS_SOURCE_REQUIRED");
  if (!/^[a-f0-9]{64}$/i.test(String(source.contentHash || ""))) reasons.push("SOURCE_HASH_REQUIRED");
  if (!Array.isArray(source.evidenceItems) || source.evidenceItems.length === 0) reasons.push("SOURCE_EVIDENCE_REQUIRED");
  if (!normalizedText(reviewerId, 120)) reasons.push("EDITORIAL_REVIEW_REQUIRED");
  const checks = reviewChecks && typeof reviewChecks === "object" ? reviewChecks : {};
  if (checks.sourceSupport !== true) reasons.push("SOURCE_SUPPORT_NOT_CONFIRMED");
  if (checks.distractorsReviewed !== true) reasons.push("DISTRACTORS_NOT_REVIEWED");
  if (checks.domainFit !== true) reasons.push("DOMAIN_FIT_NOT_CONFIRMED");
  if (checks.difficultyConfirmed !== true) reasons.push("DIFFICULTY_NOT_CONFIRMED");

  const choices = Array.isArray(q.choices) ? q.choices : [];
  if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
    if (choices.length < 2 || choices.length > 6) reasons.push("CHOICES_INVALID");
    const ids = choices.map((choice) => normalizedText(choice?.id, 32));
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) reasons.push("CHOICE_IDS_INVALID");
    const answerIds = type === "SINGLE_CHOICE"
      ? [normalizedText(q.answerKey, 32)]
      : Array.isArray(q.answerKey) ? q.answerKey.map((id) => normalizedText(id, 32)) : [];
    if (!answerIds.length || answerIds.some((id) => !ids.includes(id))) reasons.push("ANSWER_KEY_INVALID");
  } else if (type === "TRUE_FALSE" && !["TRUE", "FALSE"].includes(String(q.answerKey).toUpperCase())) {
    reasons.push("ANSWER_KEY_INVALID");
  }

  const sourceEvidenceIds = new Set((source.evidenceItems || []).map((item) => String(item?.id || "")));
  const refs = Array.isArray(q.evidenceRefs) ? q.evidenceRefs : [];
  if (!refs.length || refs.some((ref) => !sourceEvidenceIds.has(String(ref?.evidenceId || "")))) reasons.push("EVIDENCE_MAPPING_INVALID");
  if (normalizedText(q.explanation, 1_601).length < 20) reasons.push("EXPLANATION_REQUIRED");
  return { valid: reasons.length === 0, status: reasons.length ? "DRAFT" : "ACTIVE", reasons };
}

export function gradeExpertV5Question({ questionType, answerKey, answer } = {}) {
  const type = String(questionType || "").toUpperCase();
  if (!EXPERT_V5_QUESTION_TYPES.includes(type)) return { supported: false, correct: null, score: null };
  const normalizeSet = (value) => [...new Set((Array.isArray(value) ? value : [value]).map((entry) => String(entry).trim()).filter(Boolean))].sort();
  const expected = normalizeSet(type === "TRUE_FALSE" ? String(answerKey).toUpperCase() : answerKey);
  const actual = normalizeSet(type === "TRUE_FALSE" ? String(answer).toUpperCase() : answer);
  const correct = expected.length > 0 && expected.length === actual.length && expected.every((value, index) => value === actual[index]);
  return { supported: true, correct, score: correct ? 100 : 0 };
}

export function canServeQuestion({ status, retrievedAt, validityDays = 30, now = Date.now() } = {}) {
  if (status !== "ACTIVE") return false;
  const at = new Date(retrievedAt || 0).getTime();
  return Number.isFinite(at) && at > 0 && now - at <= Math.max(1, validityDays) * 86_400_000;
}

export function assessSourceRevision({ storedHash, currentHash, retrievalStatus } = {}) {
  if (retrievalStatus !== "SUCCESS") return "REVALIDATION_REQUIRED";
  if (!storedHash || !currentHash || String(storedHash).toLowerCase() !== String(currentHash).toLowerCase()) return "REVALIDATION_REQUIRED";
  return "CURRENT";
}

export function assertRoomTransition(from, to) {
  const current = String(from || "").toUpperCase();
  const next = String(to || "").toUpperCase();
  if (!EXPERT_V5_ROOM_STATES.includes(current) || !ROOM_TRANSITIONS[current]?.has(next)) {
    const error = new Error(`Invalid Expert V5 room transition: ${current} -> ${next}`);
    error.code = "EXPERT_ROOM_TRANSITION_INVALID";
    throw error;
  }
  return next;
}

export function selectIndependentSupervisor({ candidates = [], hostId, participantIds = [], domainCode, now = Date.now(), onlineWindowMs = 45_000, randomIndex = randomInt } = {}) {
  const host = String(hostId || "").toLowerCase();
  const participants = new Set(participantIds.map((id) => String(id).toLowerCase()));
  const eligible = candidates.filter((candidate) => {
    const id = String(candidate?.userId || "").toLowerCase();
    const seen = new Date(candidate?.lastSeenAt || 0).getTime();
    return /^[0-9a-f-]{36}$/i.test(id) && id !== host && !participants.has(id)
      && candidate?.isVerified === true && candidate?.hasConflict !== true
      && String(candidate?.domainCode || "").toUpperCase() === String(domainCode || "").toUpperCase()
      && Number.isFinite(seen) && now - seen >= 0 && now - seen <= onlineWindowMs;
  });
  if (!eligible.length) return null;
  return eligible[randomIndex(eligible.length)];
}

export function roomAnswerVisibility({ phase, viewerId, answerOwnerId, isRoomMember, role } = {}) {
  if (!isRoomMember) return false;
  if (String(viewerId || "") === String(answerOwnerId || "")) return true;
  const locked = ["ANSWER_LOCKED", "TRUST_ANALYZING", "ADJUDICATION", "SUPERVISOR_CONFIRMATION", "HOST_ACKNOWLEDGEMENT", "DISPUTED", "SETTLED", "CLOSED"].includes(String(phase || "").toUpperCase());
  if (!locked) return false;
  return ["HOST", "PARTICIPANT_EXPERT", "SUPERVISOR_EXPERT"].includes(String(role || "").toUpperCase());
}

export function proposeEvidenceRubricScore({ ratings, evidenceIds = [], availableEvidenceIds = [] } = {}) {
  const rubricRatings = ratings && typeof ratings === "object" ? ratings : {};
  const allowedEvidence = new Set(availableEvidenceIds.map(String));
  const linkedEvidence = [...new Set(evidenceIds.map(String))].filter((id) => allowedEvidence.has(id));
  const required = ROOM_RUBRIC.dimensions.map(({ id }) => id);
  if (required.some((id) => !ROOM_RUBRIC.allowedRatings.includes(Number(rubricRatings[id])))) {
    return { valid: false, code: "RUBRIC_RATINGS_INVALID", score: null, rubricVersion: ROOM_RUBRIC.version };
  }
  if (!linkedEvidence.length) return { valid: false, code: "RUBRIC_EVIDENCE_REQUIRED", score: null, rubricVersion: ROOM_RUBRIC.version };
  const weighted = ROOM_RUBRIC.dimensions.reduce((sum, dimension) => sum + Number(rubricRatings[dimension.id]) * dimension.weight, 0);
  return { valid: true, score: Math.round(weighted), rubricVersion: ROOM_RUBRIC.version, evidenceIds: linkedEvidence };
}

export function reputationDeltaForScore(score) {
  const value = Number(score);
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  if (value < 70) return 0;
  if (value < 95) return 1;
  return 2;
}

export function capReputationDelta({ earnedToday = 0, requestedDelta, dailyCap = null } = {}) {
  const delta = Math.max(0, Number(requestedDelta) || 0);
  if (dailyCap === null || dailyCap === undefined) return delta;
  const cap = Math.max(0, Number(dailyCap) || 0);
  const earned = Math.max(0, Number(earnedToday) || 0);
  return Math.max(0, Math.min(delta, cap - earned));
}
