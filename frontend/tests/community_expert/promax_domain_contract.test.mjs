import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CONTRIBUTION_TYPES,
  EVIDENCE_STATES,
  EXPERT_ROLES,
  PUBLICATION_STATES,
  QUALIFICATION_STATES,
  REACTION_KINDS,
  REVIEW_STATES,
  buildAssessmentContract,
  calculateCommunityTrackRecord,
  calculateQualityScore,
  canAppeal,
  canSubmitAssessment,
  clusterSource,
  createPreview,
  detectPII,
  rankCommunityContribution,
  redactText,
  resolveAssessmentDisagreement,
  transitionState,
  validateContributionInput,
} from "../../src/lib/communityExpert/promaxDomain.js";
import { GOLDEN_SCHOLARSHIP_CASE, assertGoldenCaseSeparation } from "../../src/lib/communityExpert/goldenCaseFixture.js";

const STARTER_FIXTURES = JSON.parse(readFileSync(new URL("./fixtures/promax_starter_cases.json", import.meta.url), "utf8"));

test("Promax state machines keep publication, evidence, review, and qualification separate", () => {
  assert.deepEqual(PUBLICATION_STATES, ["DRAFT", "PRIVACY_SCAN_PENDING", "PREVIEW_READY", "PUBLISHED", "EDITED", "WITHDRAWN", "MODERATED", "BLOCKED"]);
  assert.ok(EVIDENCE_STATES.includes("CONTRADICTORY"));
  assert.ok(REVIEW_STATES.includes("NEEDS_THIRD_REVIEW"));
  assert.ok(QUALIFICATION_STATES.includes("PRACTICE_REVIEW"));
  assert.ok(EXPERT_ROLES.includes("COORDINATOR_APPEALS_REVIEWER"));
  assert.equal(transitionState("publication", "DRAFT", "PRIVACY_SCAN_PENDING").ok, true);
  assert.equal(transitionState("publication", "PUBLISHED", "PREVIEW_READY").code, "STATE_TRANSITION_INVALID");
  assert.equal(transitionState("review", "CONFLICT", "NEEDS_THIRD_REVIEW").ok, true);
});

test("golden scholarship contribution requires a claim binding", () => {
  assert.equal(assertGoldenCaseSeparation(GOLDEN_SCHOLARSHIP_CASE), true);
  const invalid = validateContributionInput({
    caseId: "case-scholarship-2026",
    caseRevision: 4,
    contributionType: "SUPPORTING_EVIDENCE",
    statement: "Thông báo học bổng yêu cầu sinh viên chuyển tiền trước khi nhận hồ sơ.",
  });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.includes("claimId"));

  const valid = validateContributionInput({
    caseId: "case-scholarship-2026",
    caseRevision: 4,
    claimId: "claim-money-transfer-required",
    contributionType: "CONTRADICTING_EVIDENCE",
    statement: "Trang chính thức của trường ghi rõ không thu bất kỳ khoản chuyển tiền cá nhân nào.",
    evidenceRefs: ["evidence-official-notice-v2"],
  });
  assert.equal(valid.ok, true);
});

test("privacy scan catches text, image, QR, and location identifiers before publication", () => {
  const scan = detectPII("Liên hệ 0901234567 hoặc student@example.edu.vn để chuyển khoản.", { imageVisibleIdentifiers: true, locationMetadata: true });
  assert.equal(scan.hasPII, true);
  assert.equal(scan.blocked, true);
  assert.match(redactText("email student@example.edu.vn phone 0901234567"), /REDACTED_EMAIL/);
  assert.match(redactText("email student@example.edu.vn phone 0901234567"), /REDACTED_PHONE/);
});

test("source clustering does not mistake reposted accounts for independent evidence", () => {
  const first = clusterSource({ url: "https://example.edu/notice?id=7&utm_source=copy", publisher: "example.edu", independenceKey: "example.edu" });
  const second = clusterSource({ url: "https://example.edu/notice?id=7", publisher: "example.edu", independenceKey: "example.edu" });
  assert.equal(first.sourceClusterKey, second.sourceClusterKey);
  assert.equal(first.isIndependentFrom({ url: "https://example.edu/notice?id=7", independenceKey: "example.edu" }), false);
  const syndicated = clusterSource({ url: "https://copy.example.net/post/7", publisher: "copy.example.net", originalSource: "https://example.edu/notice?id=7" });
  assert.equal(syndicated.independenceKey, "https://example.edu/notice?id=7");
  const mirrored = clusterSource({ url: "https://mirror.example.net/post/7", publisher: "mirror.example.net", contentDigest: "a".repeat(64) });
  assert.equal(mirrored.isIndependentFrom({ url: "https://other.example.net/post/7", contentDigest: "a".repeat(64) }), false);
});

test("strong fresh primary evidence can outrank a famous contributor with stale evidence", () => {
  const now = Date.parse("2026-09-09T00:00:00.000Z");
  const newPrimary = rankCommunityContribution({ relevance: 0.9, observedAt: "2026-09-08T00:00:00.000Z", independentHelpfulness: 0.25, authorDomainReliability: 0.2, evidence: [{ relationship: "SUPPORTS", provenanceQuality: 1, sourceTypeQuality: 1, freshness: 1, independence: 1, contextCompleteness: 1 }] }, now);
  const famousStale = rankCommunityContribution({ relevance: 0.75, observedAt: "2022-01-01T00:00:00.000Z", independentHelpfulness: 0.9, authorDomainReliability: 0.95, evidence: [{ relationship: "SUPPORTS", provenanceQuality: 0.25, sourceTypeQuality: 0.3, freshness: 0.1, independence: 0.3, contextCompleteness: 0.4 }] }, now);
  assert.ok(newPrimary.score > famousStale.score);
  assert.equal(newPrimary.policyVersion, "community-ranking-v1");
});

test("reactions remain typed signals and quality retries do not inflate reputation", () => {
  assert.deepEqual(REACTION_KINDS, ["HELPFUL", "ADD_EVIDENCE", "CHALLENGE", "INSUFFICIENT_INFORMATION", "REPORT_ABUSE"]);
  const quality = calculateQualityScore([
    { eventType: "ADJUDICATION", outcome: "SUPPORT", weight: 1, idempotencyKey: "same" },
    { eventType: "ADJUDICATION", outcome: "SUPPORT", weight: 1, idempotencyKey: "same" },
    { eventType: "ADJUDICATION", outcome: "CONTRADICT", weight: 1, idempotencyKey: "different" },
  ], { minSample: 3 });
  assert.equal(quality.sampleSize, 2);
  assert.equal(quality.insufficientData, true);
  assert.equal(quality.label, "INSUFFICIENT_DATA");
  const reversed = calculateQualityScore([
    { eventType: "ADJUDICATION", outcome: "SUPPORT", weight: 1, idempotencyKey: "a" },
    { eventType: "REVERSE_ADJUDICATION", outcome: "SUPPORT", weight: 1, idempotencyKey: "b", supersedesEventId: "a" },
  ]);
  assert.equal(reversed.score, 0.5);
  const correlated = calculateQualityScore([
    { eventType: "ADJUDICATION", outcome: "SUPPORT", weight: 1, idempotencyKey: "c1", incidentClusterId: "incident-a" },
    { eventType: "ADJUDICATION", outcome: "SUPPORT", weight: 1, idempotencyKey: "c2", incidentClusterId: "incident-a" },
  ], { minSample: 2 });
  assert.equal(correlated.sampleSize, 1);
  assert.equal(correlated.insufficientData, true);
});

test("community track record is a bounded candidate signal, never expert authority", () => {
  const candidate = calculateCommunityTrackRecord({
    publishedContributions: 5,
    evidenceLinkedContributions: 4,
    distinctCases: 5,
    helpfulReactions: 10,
    challengeReactions: 0,
    qualityEventCount: 19,
  });
  assert.equal(candidate.points, 100);
  assert.equal(candidate.stars, 5);
  assert.equal(candidate.expertCandidate, true);
  assert.equal(candidate.qualificationGate, "HUMAN_QUALIFICATION_REQUIRED");
  assert.equal(candidate.authority, "NON_AUTHORITATIVE");
  assert.equal(candidate.trustVerdictMutation, false);

  const incomplete = calculateCommunityTrackRecord({ publishedContributions: 1000, evidenceLinkedContributions: 0 });
  assert.equal(incomplete.points, 50);
  assert.equal(incomplete.expertCandidate, false);
  assert.equal(incomplete.stars, 2);
});

test("assessment and appeal checks fail closed for revoked, unassigned, and self actors", () => {
  assert.equal(canSubmitAssessment({ expertId: "e1", verifiedDomain: "CYBERSECURITY", domainStatus: "REVOKED", assignment: null, caseRevision: 1, coiDeclared: true }).code, "DOMAIN_NOT_VERIFIED");
  assert.equal(canSubmitAssessment({ expertId: "e1", verifiedDomain: "CYBERSECURITY", domainStatus: "VERIFIED", assignment: null, caseRevision: 1, coiDeclared: true }).code, "ASSIGNMENT_REQUIRED");
  assert.equal(canSubmitAssessment({ expertId: "e1", verifiedDomain: "CYBERSECURITY", domainStatus: "VERIFIED", assignment: { expertId: "e1", status: "ASSIGNED", caseRevision: 1 }, caseRevision: 1, coiDeclared: false }).code, "CONFLICT_OF_INTEREST");
  assert.equal(canAppeal({ requesterId: "e1", assessmentExpertId: "e1", currentReviewState: "RESOLVED" }).code, "SELF_APPEAL_FORBIDDEN");
  const contract = buildAssessmentContract({ expertId: "e1", verifiedDomain: "CYBERSECURITY", assignmentId: "a1", caseId: "c1", caseRevision: 2, claimId: "claim-b", evidenceRevisionIds: ["ev-2"], conclusionWithinScope: "Không kết luận yêu cầu chuyển tiền là hợp pháp.", uncertainty: "Thiếu xác nhận từ phòng công tác sinh viên.", coiDeclared: true });
  assert.equal(contract.assignmentId, "a1");
  assert.equal(contract.caseRevision, 2);
});

test("privacy preview digest binds the exact case, claim, and evidence revision set", () => {
  const first = createPreview({
    statement: "Nguồn trường xác nhận chương trình học bổng tồn tại nhưng không yêu cầu chuyển tiền.",
    caseId: "case-1",
    caseRevision: 1,
    claimId: "claim-1",
    contributionType: "FOUND_SOURCE",
    evidenceRefs: ["official"],
    evidenceRevisionIds: ["evidence-1"],
  });
  const second = createPreview({
    statement: "Nguồn trường xác nhận chương trình học bổng tồn tại nhưng không yêu cầu chuyển tiền.",
    caseId: "case-1",
    caseRevision: 1,
    claimId: "claim-1",
    contributionType: "FOUND_SOURCE",
    evidenceRefs: ["official"],
    evidenceRevisionIds: ["evidence-2"],
  });
  assert.notEqual(first.previewDigest, second.previewDigest);
  const ocrPreview = createPreview({
    statement: "Thông báo học bổng cần được kiểm tra trước khi chia sẻ.",
    caseId: "case-1",
    caseRevision: 1,
    claimId: "claim-1",
    contributionType: "FOUND_SOURCE",
    ocrText: "Tài khoản ngân hàng: 123456789012",
  });
  assert.equal(ocrPreview.state, "BLOCKED");
});

test("assessment disagreement stays explicit and escalates to an independent third review", () => {
  const assessments = [
    { id: "a1", expert_id: "expert-1", conclusion_within_scope: "TRANSFER_NOT_SUPPORTED" },
    { id: "a2", expert_id: "expert-2", conclusion_within_scope: "TRANSFER_SUPPORTED" },
  ];
  const first = resolveAssessmentDisagreement(assessments, [{ id: "r1", reviewer_id: "reviewer-1", decision: "DISAGREE" }]);
  assert.equal(first.state, "CONFLICT");
  assert.equal(first.majorityApplied, false);
  const escalated = resolveAssessmentDisagreement(assessments, [
    { id: "r1", reviewer_id: "reviewer-1", decision: "DISAGREE" },
    { id: "r2", reviewer_id: "reviewer-2", decision: "DISAGREE" },
  ]);
  assert.equal(escalated.state, "NEEDS_THIRD_REVIEW");
  assert.equal(escalated.nextAction, "REQUEST_INDEPENDENT_THIRD_REVIEW");
});

test("starter evaluation fixtures are synthetic, revision-bound, and claim-addressable", () => {
  assert.equal(STARTER_FIXTURES.status, "CONTROLLED_SYNTHETIC_STARTER");
  assert.equal(STARTER_FIXTURES.authority, "TEST_ONLY");
  assert.equal(STARTER_FIXTURES.cases.length, 3);
  for (const fixture of STARTER_FIXTURES.cases) {
    assert.match(fixture.caseId, /^[0-9a-f-]{36}$/i);
    assert.ok(Number.isInteger(fixture.revision) && fixture.revision >= 1);
    assert.ok(fixture.claims.length >= 1);
    assert.ok(fixture.evidence.length >= 1);
    assert.ok(fixture.claims.every((claim) => /^[0-9a-f-]{36}$/i.test(claim.claimId)));
    assert.ok(fixture.evidence.every((evidence) => /^[0-9a-f-]{36}$/i.test(evidence.evidenceId)));
  }
});
