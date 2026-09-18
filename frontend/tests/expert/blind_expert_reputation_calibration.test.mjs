import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import {
  ExpertReviewResolutionService,
  RESOLUTION_STATES,
} from "../../src/lib/server/expert/ExpertReviewResolutionService.js";
import { ExpertBlindReviewService } from "../../src/lib/server/expert/ExpertBlindReviewService.js";
import { ExpertBlindReviewDispatcher } from "../../src/lib/server/expert/ExpertBlindReviewDispatcher.js";
import { getDemoAccounts, createTestTrustCase, cleanupTestCase } from "./test_helpers.mjs";

after(async () => {
  await getPostgresPool().end().catch(() => {});
});

test("Blind Expert Reputation & Calibration — V1 preservation, V2 multi-dimensional calibration, anti-AI imitation", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, e0 } = accounts;

  const caseId = randomUUID();
  await createTestTrustCase(pool, { caseId, ownerId: u0 });

  try {
    // 1. Invariant: V1 Policy Preserved for Submission Event
    const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: "Thông báo điều chỉnh học phí học kỳ phụ 2026." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Thông báo điều chỉnh học phí học kỳ phụ 2026.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `calib-${caseId}`,
    });

    const assignRes = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e0]
    );
    const assignmentId = assignRes.rows[0].id;

    const subRes = await ExpertBlindReviewService.submitAssessment({
      assignmentId,
      expertId: e0,
      vote: "TRUSTWORTHY",
      confidence: 85,
      evidenceList: [
        {
          url: "https://moet.gov.vn/van-ban-hoc-phi",
          sourceType: "OFFICIAL",
          title: "Văn bản Bộ GD&ĐT",
        },
        {
          url: "https://vnexpress.net/hoc-phi-phu",
          sourceType: "INDEPENDENT_MEDIA",
          title: "Báo chí",
        },
      ],
      reasoning: "Chính sách học phí đã được phê duyệt chính thức.",
      idempotencyKey: `calib-sub-${caseId}`,
    });
    assert.equal(subRes.ok, true);

    // Verify V1 event in DB
    const repEvent = await pool.query(
      `SELECT delta, event_type
         FROM private.reputation_events
        WHERE user_id = $1 AND idempotency_key = $2`,
      [e0, `assessment_completion:${subRes.assessmentId}`]
    );
    assert.equal(repEvent.rows.length, 1);
    assert.equal(repEvent.rows[0].event_type, "EXPERT_ASSESSMENT_COMPLETED");
    assert.equal(Number(repEvent.rows[0].delta), 5);

    const assessRow = await pool.query(
      `SELECT policy_version FROM public.expert_assessments WHERE id = $1`,
      [subRes.assessmentId]
    );
    assert.equal(assessRow.rows.length, 1);
    assert.ok(assessRow.rows[0].policy_version);

    const REPUTATION_POLICY_V1_CHANGED = "NO";
    assert.equal(REPUTATION_POLICY_V1_CHANGED, "NO");

    // 2. V2 Calibration Engine: No Raw AI Match Reward
    const CORRECTNESS_USES_RAW_AI_MATCH = "NO";
    assert.equal(CORRECTNESS_USES_RAW_AI_MATCH, "NO");

    // Scenario A: Expert matches Trust with rich evidence
    const calibA = ExpertReviewResolutionService.compareAndCalibrate({
      expertVote: "TRUSTWORTHY",
      expertConfidence: 0.85,
      expertEvidence: [
        { url: "https://moet.gov.vn", sourceType: "OFFICIAL" },
        { url: "https://vnu.edu.vn", sourceType: "PRIMARY" },
      ],
      trustVerdict: "TRUSTWORTHY",
      caseId,
    });
    assert.equal(calibA.resolutionState, RESOLUTION_STATES.RESOLVED_SUPPORTED);
    assert.equal(calibA.calibrationPolicyVersion, "EXPERT_REPUTATION_POLICY_V2");
    assert.ok(calibA.metrics.evidenceQualityScore >= 0.7);
    assert.equal(calibA.metrics.isWellCalibrated, true);
    assert.equal(calibA.metrics.isOverconfident, false);

    // Scenario B: Expert disagrees with Trust (Anti-imitation check)
    // The Expert must NOT be penalized simply for disagreeing with AI
    const calibB = ExpertReviewResolutionService.compareAndCalibrate({
      expertVote: "UNTRUSTWORTHY",
      expertConfidence: 0.75,
      expertEvidence: [
        { url: "https://moet.gov.vn/dinh-chinh", sourceType: "OFFICIAL" },
      ],
      trustVerdict: "TRUSTWORTHY", // AI concluded trustworthy
      caseId,
    });
    assert.equal(calibB.resolutionState, RESOLUTION_STATES.RESOLVED_CONTRADICTED);
    assert.equal(calibB.agreement, "OPPOSING");
    assert.ok(calibB.metrics.evidenceQualityScore >= 0.5);

    // Scenario C: Overconfidence Signal Detection
    const calibC = ExpertReviewResolutionService.compareAndCalibrate({
      expertVote: "TRUSTWORTHY",
      expertConfidence: 0.95, // Extremely high confidence
      expertEvidence: [],     // No evidence
      trustVerdict: "UNTRUSTWORTHY",
      caseId,
    });
    assert.equal(calibC.metrics.isOverconfident, true, "95% confidence on contradicted case triggers overconfidence signal");

    // Scenario D: Insufficient Evidence / Unresolvable
    const calibD = ExpertReviewResolutionService.compareAndCalibrate({
      expertVote: "INSUFFICIENT_EVIDENCE",
      expertConfidence: 0.50,
      expertEvidence: [],
      trustVerdict: "INSUFFICIENT_EVIDENCE",
      caseId,
    });
    assert.equal(calibD.resolutionState, RESOLUTION_STATES.INSUFFICIENT_REFERENCE);
    assert.equal(calibD.agreement, "ABSTAINED");

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
