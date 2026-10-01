import test from "node:test";
import assert from "node:assert/strict";
import {
  MISSION_LEVEL_POLICY,
  assertRoomTransition,
  assessSourceRevision,
  canServeQuestion,
  capReputationDelta,
  classifyRemoteRetrieval,
  deriveQuestionDifficulty,
  difficultyForMissionLevel,
  gradeExpertV5Question,
  proposeEvidenceRubricScore,
  reputationDeltaForScore,
  resolveMissionLevel,
  roomAnswerVisibility,
  selectIndependentSupervisor,
  validateQuestionActivation,
} from "../../src/lib/server/expert/ExpertV5Domain.js";

test("mission difficulty eligibility is server-owned and separate from credential/reputation stars", () => {
  assert.deepEqual(difficultyForMissionLevel(1), ["EASY"]);
  assert.deepEqual(difficultyForMissionLevel(2), ["EASY", "MEDIUM"]);
  assert.deepEqual(difficultyForMissionLevel(3), ["MEDIUM"]);
  assert.deepEqual(difficultyForMissionLevel(4), ["MEDIUM", "HARD"]);
  assert.deepEqual(difficultyForMissionLevel(5), ["HARD"]);
  assert.equal(resolveMissionLevel(14), 2);
  assert.equal(resolveMissionLevel(15), 3);
  assert.equal(MISSION_LEVEL_POLICY[5].completedMissionsRequired, 50);
});

test("difficulty derives deterministically from declared evidence properties", () => {
  assert.equal(deriveQuestionDifficulty({ sourceCount: 1, evidenceCount: 1 }), "EASY");
  assert.equal(deriveQuestionDifficulty({ sourceCount: 2, evidenceCount: 1 }), "MEDIUM");
  assert.equal(deriveQuestionDifficulty({ sourceCount: 2, evidenceCount: 3, ambiguity: 1, temporalReasoning: true }), "HARD");
});

test("login, paywall and anti-bot source outcomes remain blocked and cannot produce a Trust answer", () => {
  for (const marker of ["LOGIN_REQUIRED", "PAYWALL", "CLOUDFLARE", "ROBOTS_DENIED", "RATE_LIMITED"]) {
    assert.deepEqual(classifyRemoteRetrieval({ outcome: marker }), { remoteRetrieval: "BLOCKED", trustAnalysis: "N/A" });
  }
  assert.deepEqual(classifyRemoteRetrieval({ outcome: "SUCCESS" }), { remoteRetrieval: "SUCCESS", trustAnalysis: "PENDING" });
  assert.equal(classifyRemoteRetrieval({ httpStatus: 403 }).trustAnalysis, "N/A");
});

test("question activation requires fetched immutable source, evidence map and human review", () => {
  const question = {
    questionType: "SINGLE_CHOICE",
    prompt: "Which date is stated in the published public notice?",
    choices: [{ id: "a" }, { id: "b" }],
    answerKey: "b",
    explanation: "The cited excerpt states the date next to the official notice title.",
    difficulty: "EASY",
    domainCode: "PUBLIC_POLICY",
    evidenceRefs: [{ evidenceId: "ev_1" }],
  };
  const sourceSnapshot = {
    retrievalStatus: "SUCCESS",
    remoteRetrieval: "SUCCESS",
    canonicalUrl: "https://example.gov.vn/notice",
    contentHash: "a".repeat(64),
    evidenceItems: [{ id: "ev_1" }],
  };
  const reviewChecks = { sourceSupport: true, distractorsReviewed: true, domainFit: true, difficultyConfirmed: true };
  assert.deepEqual(validateQuestionActivation({ question, sourceSnapshot, reviewerId: "editor-id", reviewChecks }), {
    valid: true, status: "ACTIVE", reasons: [],
  });
  const unchecked = validateQuestionActivation({ question, sourceSnapshot, reviewerId: "editor-id" });
  assert.equal(unchecked.valid, false);
  assert.ok(unchecked.reasons.includes("SOURCE_SUPPORT_NOT_CONFIRMED"));
  const blocked = validateQuestionActivation({
    question,
    sourceSnapshot: { ...sourceSnapshot, remoteRetrieval: "BLOCKED", retrievalStatus: "BLOCKED" },
    reviewerId: "editor-id",
    reviewChecks,
  });
  assert.equal(blocked.status, "DRAFT");
  assert.ok(blocked.reasons.includes("SOURCE_NOT_RETRIEVED"));
});

test("scenario question activation requires current canonical claims, evidence links and explicit human grounding review", () => {
  const question = {
    scenarioId: "11111111-1111-4111-8111-111111111111",
    modality: "TEXT_URL_IMAGE",
    questionType: "SOURCE_RANKING",
    prompt: "Rank the supplied sources by authority for the stated tuition policy.",
    choices: [{ id: "official" }, { id: "news" }, { id: "social" }],
    answerKey: ["official", "news", "social"],
    explanation: "The official notice directly controls the policy and the other sources are secondary.",
    difficulty: "HARD",
    domainCode: "PUBLIC_POLICY",
    claimRefs: [{ claimId: "claim-1" }],
    evidenceRefs: [{ evidenceId: "evidence-1", claimIds: ["claim-1"] }],
    correctAnswerEvidenceIds: ["evidence-1"],
    uncertaintyMode: "CLEAR",
  };
  const sourceSnapshot = {
    status: "READY",
    packageDigest: "a".repeat(64),
    claimIds: ["claim-1"],
    evidenceItems: [{ id: "evidence-1" }],
    claimEvidenceMap: { "claim-1": ["evidence-1"] },
  };
  const reviewChecks = {
    sourceSupport: true, distractorsReviewed: true, domainFit: true,
    difficultyConfirmed: true, groundingConfirmed: true, ambiguityReviewed: true,
  };
  const validation = validateQuestionActivation({
    question, sourceSnapshot, reviewerId: "editor-id", reviewChecks,
  });
  assert.equal(validation.valid, true, validation.reasons.join(", "));
  assert.equal(validateQuestionActivation({
    question,
    sourceSnapshot: { ...sourceSnapshot, claimEvidenceMap: { "claim-1": ["different-evidence"] } },
    reviewerId: "editor-id", reviewChecks,
  }).valid, false);
  assert.ok(validateQuestionActivation({
    question, sourceSnapshot, reviewerId: "editor-id", reviewChecks: { ...reviewChecks, ambiguityReviewed: false },
  }).reasons.includes("AMBIGUITY_NOT_REVIEWED"));
});

test("objective evaluators are deterministic and unsupported item types fail closed", () => {
  assert.deepEqual(gradeExpertV5Question({ questionType: "SINGLE_CHOICE", answerKey: "b", answer: "b" }), {
    supported: true, correct: true, score: 100,
  });
  assert.equal(gradeExpertV5Question({ questionType: "SHORT_ANSWER", answerKey: "b", answer: "b" }).supported, false);
  assert.equal(gradeExpertV5Question({ questionType: "MULTIPLE_CHOICE", answerKey: ["a", "c"], answer: ["c", "a", "a"] }).correct, true);
});

test("question serving checks active state and freshness; changed or unavailable sources require revalidation", () => {
  const now = Date.parse("2026-09-29T12:00:00.000Z");
  assert.equal(canServeQuestion({ status: "ACTIVE", retrievedAt: "2026-09-10T00:00:00.000Z", now }), true);
  assert.equal(canServeQuestion({ status: "ACTIVE", retrievedAt: "2026-08-01T00:00:00.000Z", now }), false);
  assert.equal(assessSourceRevision({ storedHash: "a", currentHash: "a", retrievalStatus: "SUCCESS" }), "CURRENT");
  assert.equal(assessSourceRevision({ storedHash: "a", currentHash: "b", retrievalStatus: "SUCCESS" }), "REVALIDATION_REQUIRED");
  assert.equal(assessSourceRevision({ storedHash: "a", currentHash: "a", retrievalStatus: "BLOCKED" }), "REVALIDATION_REQUIRED");
});

test("room transitions reject shortcuts around trust and human adjudication", () => {
  assert.equal(assertRoomTransition("QUESTION_ACTIVE", "ANSWER_LOCKED"), "ANSWER_LOCKED");
  assert.throws(() => assertRoomTransition("QUESTION_ACTIVE", "SETTLED"), { code: "EXPERT_ROOM_TRANSITION_INVALID" });
  assert.throws(() => assertRoomTransition("SUPERVISOR_CONFIRMATION", "SETTLED"), { code: "EXPERT_ROOM_TRANSITION_INVALID" });
});

test("supervisor lottery excludes host, participants, conflicts, other domains and stale presence", () => {
  const now = Date.parse("2026-09-29T12:00:00.000Z");
  const candidates = [
    { userId: "00000000-0000-4000-8000-000000000001", isVerified: true, hasConflict: false, domainCode: "AI", lastSeenAt: new Date(now).toISOString() },
    { userId: "00000000-0000-4000-8000-000000000002", isVerified: true, hasConflict: false, domainCode: "AI", lastSeenAt: new Date(now).toISOString() },
    { userId: "00000000-0000-4000-8000-000000000003", isVerified: true, hasConflict: true, domainCode: "AI", lastSeenAt: new Date(now).toISOString() },
  ];
  const chosen = selectIndependentSupervisor({
    candidates, hostId: candidates[0].userId, participantIds: [candidates[1].userId], domainCode: "AI", now,
  });
  assert.equal(chosen, null);
  const selected = selectIndependentSupervisor({ candidates, hostId: "00000000-0000-4000-8000-000000000010", domainCode: "AI", now, randomIndex: () => 0 });
  assert.equal(selected.userId, candidates[0].userId);
});

test("answers stay hidden before lock except from their owner and outsiders never read them", () => {
  assert.equal(roomAnswerVisibility({ phase: "QUESTION_ACTIVE", viewerId: "host", answerOwnerId: "expert", isRoomMember: true, role: "HOST" }), false);
  assert.equal(roomAnswerVisibility({ phase: "QUESTION_ACTIVE", viewerId: "expert", answerOwnerId: "expert", isRoomMember: true, role: "PARTICIPANT_EXPERT" }), true);
  assert.equal(roomAnswerVisibility({ phase: "ANSWER_LOCKED", viewerId: "host", answerOwnerId: "expert", isRoomMember: true, role: "HOST" }), true);
  assert.equal(roomAnswerVisibility({ phase: "SETTLED", viewerId: "outsider", answerOwnerId: "expert", isRoomMember: false, role: "HOST" }), false);
});

test("room system proposal requires evidence refs and uses a versioned deterministic rubric", () => {
  const proposal = proposeEvidenceRubricScore({
    ratings: { SOURCE_ALIGNMENT: 100, EVIDENCE_USE: 50, UNCERTAINTY_CALIBRATION: 100 },
    evidenceIds: ["e1", "not-a-real-evidence"], availableEvidenceIds: ["e1", "e2"],
  });
  assert.deepEqual(proposal, {
    valid: true, score: 85, rubricVersion: "expert-room-evidence-rubric.v1", evidenceIds: ["e1"],
  });
  assert.equal(proposeEvidenceRubricScore({ ratings: { SOURCE_ALIGNMENT: 0 }, evidenceIds: ["e1"], availableEvidenceIds: ["e1"] }).valid, false);
});

test("reputation thresholds and daily cap never penalize an ordinary wrong answer", () => {
  assert.equal(reputationDeltaForScore(69.99), 0);
  assert.equal(reputationDeltaForScore(70), 1);
  assert.equal(reputationDeltaForScore(94.99), 1);
  assert.equal(reputationDeltaForScore(95), 2);
  assert.equal(reputationDeltaForScore(100), 2);
  assert.equal(reputationDeltaForScore(101), null);
  assert.equal(capReputationDelta({ earnedToday: 4, requestedDelta: 2, dailyCap: 5 }), 1);
  assert.equal(capReputationDelta({ earnedToday: 6, requestedDelta: 2, dailyCap: 5 }), 0);
});
