import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCorrectionQualitySignal,
  buildDataCandidate,
  buildGroundedDiscussionSummary,
  buildRiskSignalFingerprintInput,
  buildSourceIndependenceProjection,
  buildTransparentCommunityRanking,
  communityAuthorityBoundary,
  deriveCampusProjection,
  deriveVerificationFreshness,
  detectHighValueDisagreement,
  isSafePublicUrl,
  normalizePublicUrl,
  validateClaimDiscussionInput,
  validateComposerInput,
} from "../../src/lib/communityMax/communityMaxDomain.js";

const contributionId = "11111111-1111-4111-8111-111111111111";
const claimId = "22222222-2222-4222-8222-222222222222";
const discussionId = "33333333-3333-4333-8333-333333333333";

test("Wave 1 composer preserves epistemic intent and blocks unsafe sources", () => {
  const valid = validateComposerInput({
    intent: "FOUND_SOURCE",
    statement: "This source reports the policy change and needs independent checking.",
    claimId,
    sourceRefs: ["https://example.edu/policy?utm_source=studenthub"],
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.normalized.intent, "FOUND_SOURCE");
  assert.equal(valid.normalized.sourceRefs[0].canonicalUrl, "https://example.edu/policy");
  assert.equal(valid.privacy.blocked, false);

  for (const unsafe of [
    "javascript:alert(1)",
    "http://127.0.0.1/internal",
    "http://192.168.1.5/admin",
    "https://user:password@example.com/private",
    "http://localhost:3000/debug",
  ]) assert.equal(isSafePublicUrl(unsafe), false, unsafe);

  const blocked = validateComposerInput({
    intent: "DIRECT_EXPERIENCE",
    statement: "My student ID is SV: 24110001 and this must not be published.",
  });
  assert.equal(blocked.ok, true);
  assert.equal(blocked.privacy.hasPII, true);
  assert.match(blocked.normalized.statement, /REDACTED_STUDENT_ID/);
});

test("Wave 1 claim discussion is typed, bounded, and revision-aware", () => {
  const valid = validateClaimDiscussionInput({
    contributionId,
    claimId,
    contributionRevision: 2,
    action: "CHALLENGE",
    body: "The claim needs a second source because the cited policy is outdated.",
    evidenceReferenceIds: ["44444444-4444-4444-8444-444444444444"],
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.normalized.action, "CHALLENGE");
  assert.equal(valid.normalized.contributionRevision, 2);
  assert.equal(validateClaimDiscussionInput({ ...valid.normalized, action: "UNKNOWN" }).ok, false);
});

test("Wave 1 source independence counts families, not truth", () => {
  const projection = buildSourceIndependenceProjection([
    { id: "a", url: "https://one.example/a", independenceKey: "publisher-a" },
    { id: "b", url: "https://one.example/b", independenceKey: "publisher-a" },
    { id: "c", url: "https://two.example/a", independenceKey: "publisher-b" },
  ]);
  assert.equal(projection.totalSources, 3);
  assert.equal(projection.independentSourceFamilies, 2);
  assert.equal(projection.isTruthVerdict, false);
  assert.equal(normalizePublicUrl("https://example.com/a?fbclid=secret"), "https://example.com/a");
});

test("Wave 1 freshness makes revision and source changes visible", () => {
  assert.equal(deriveVerificationFreshness({ currentRevision: 3, boundRevision: 2 }).state, "CONTEXT_CHANGED");
  assert.equal(deriveVerificationFreshness({ currentRevision: 2, boundRevision: 2, sourceStates: ["RETRACTED"], lastCheckedAt: new Date().toISOString() }).state, "SOURCE_RETRACTED");
  assert.equal(deriveVerificationFreshness({ currentRevision: 2, boundRevision: 2, sourceStates: ["AVAILABLE"], lastCheckedAt: new Date().toISOString() }).state, "FRESH");
});

test("Wave 2 disagreement queues a review candidate without selecting a winner", () => {
  const result = detectHighValueDisagreement({
    supportSignals: [{ id: "support-1" }],
    challengeSignals: [{ id: "challenge-1" }],
    evidenceStates: ["MIXED"],
    discussionCount: 4,
  });
  assert.equal(result.highValue, true);
  assert.ok(result.priority > 0);
  assert.equal(result.nextAction, "QUEUE_REVIEW_OR_EXPERT_REQUEST");
  assert.equal(result.isTruthVerdict, false);
});

test("Wave 2 summary is grounded and explicitly non-authoritative", () => {
  const summary = buildGroundedDiscussionSummary({
    contributionRevision: 1,
    discussions: [{ id: discussionId, action: "SUPPORT", body: "A second student confirmed the date.", status: "PUBLISHED" }],
    sources: [{ id: "55555555-5555-4555-8555-555555555555" }],
  });
  assert.match(summary.summaryText, /SUPPORT=1/);
  assert.deepEqual(summary.discussionIds, [discussionId]);
  assert.equal(summary.providerStatus, "RULE_GROUNDED");
  assert.equal(summary.finalVerdict, false);
  assert.equal(summary.isAuthoritative, false);
});

test("Wave 2 ranking is transparent and has no truth/popularity authority", () => {
  const [ranked] = buildTransparentCommunityRanking([{ id: contributionId, relevance: 1, evidenceQuality: 0.8, verificationFreshness: 0.5 }]);
  assert.equal(ranked.id, contributionId);
  assert.ok(ranked.reasons.length > 0);
  assert.equal(ranked.isTruthVerdict, false);
  assert.equal(Object.hasOwn(ranked.factors, "popularity"), false);
});

test("Wave 3 consent, risk, correction, and data flywheel boundaries hold", () => {
  const withoutConsent = deriveCampusProjection({ universityLabel: "HCMUTE", visibility: "PUBLIC", consent: false });
  assert.equal(withoutConsent.ok, false);
  assert.equal(withoutConsent.publicProjection, null);

  const consented = deriveCampusProjection({ universityLabel: "HCMUTE", faculty: "Engineering", visibility: "PUBLIC", consent: true });
  assert.equal(consented.ok, true);
  assert.equal(consented.inferred, false);
  assert.equal(consented.publicProjection.universityLabel, "HCMUTE");

  const risk = buildRiskSignalFingerprintInput({ riskType: "SOURCE_RETRACTION", signalType: "MISMATCH", topic: "financial aid" });
  assert.equal(risk.rawContentIncluded, false);
  assert.equal(risk.piiIncluded, false);

  const correction = buildCorrectionQualitySignal({ correctionType: "SELF_CORRECTION" });
  assert.equal(correction.pointDelta, 0);
  assert.equal(correction.affectsTrustVerdict, false);

  const candidate = buildDataCandidate({ contributionId, contributionRevision: 2, candidateType: "CORRECTION_EXAMPLE" });
  assert.equal(candidate.trainingEligible, false);
  assert.equal(candidate.automaticTraining, false);
  assert.equal(candidate.consentState, "NOT_PROVIDED");
});

test("Community hard authority boundary stays closed", () => {
  const boundary = communityAuthorityBoundary();
  for (const key of ["canWriteTrustVerdict", "canWriteTrustEvidence", "canWriteEvidencePassport", "canGrantExpertAuthority", "canSetVoteWeight", "canSetTruthFromPopularity", "canTurnBelieveIntoVerified", "canTrainAutomatically"]) {
    assert.equal(boundary[key], false, key);
  }
  assert.equal(boundary.authorityOwner, "TRUST_V5");
});
