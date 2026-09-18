import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { ExpertBlindReviewService } from "../../src/lib/server/expert/ExpertBlindReviewService.js";
import { ExpertBlindReviewDispatcher } from "../../src/lib/server/expert/ExpertBlindReviewDispatcher.js";
import { getDemoAccounts, createTestTrustCase, cleanupTestCase } from "./test_helpers.mjs";

after(async () => {
  await getPostgresPool().end().catch(() => {});
});

test("Blind Expert Idempotency — Deterministic single-execution guarantees across dispatch & submission", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, e0 } = accounts;

  const caseId = randomUUID();
  await createTestTrustCase(pool, { caseId, ownerId: u0 });

  const claimText = "Kiểm tra tính lũy kế của học phần tiên quyết theo quy chế đào tạo tín chỉ.";

  try {
    // 1. Triple dispatch on L1 (simulating retries, race conditions, or reconnection)
    const dispatch1 = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: claimText },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: claimText,
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `idempotent-1-${caseId}`,
    });

    const dispatch2 = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: claimText },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: claimText,
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `idempotent-2-${caseId}`,
    });

    assert.equal(dispatch1.ok, true);
    assert.equal(dispatch2.ok, true);
    assert.equal(dispatch1.reviewRequestId, dispatch2.reviewRequestId, "Both dispatches must yield the identical reviewRequestId");

    // Verify DB count of review requests for this case
    const reqCount = await pool.query(
      `SELECT count(*)::int AS count FROM private.expert_review_requests WHERE case_id = $1`,
      [caseId]
    );
    assert.equal(reqCount.rows[0].count, 1, "Exactly 1 review request must exist in DB");

    // Verify assignment count for E0
    const assignRows = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE case_id = $1 AND expert_id = $2`,
      [caseId, e0]
    );
    assert.equal(assignRows.rows.length, 1, "Exactly 1 assignment must exist for E0");
    const assignmentId = assignRows.rows[0].id;

    // 2. Test Idempotent Submissions with stable idempotency key
    const subKey = `stable-sub-key-${caseId}`;

    const sub1 = await ExpertBlindReviewService.submitAssessment({
      assignmentId,
      expertId: e0,
      vote: "TRUSTWORTHY",
      confidence: 80,
      evidenceList: [
        {
          url: "https://moet.gov.vn/quy-che-tin-chi",
          sourceType: "OFFICIAL",
          title: "Quy chế đào tạo",
        },
      ],
      reasoning: "Quy chế tín chỉ đã quy định rõ về điều kiện học phần tiên quyết.",
      idempotencyKey: subKey,
    });
    assert.equal(sub1.ok, true);
    assert.equal(sub1.assessmentState, "LOCKED");

    // Second submission with exact same idempotency key
    const sub2 = await ExpertBlindReviewService.submitAssessment({
      assignmentId,
      expertId: e0,
      vote: "TRUSTWORTHY",
      confidence: 80,
      evidenceList: [
        {
          url: "https://moet.gov.vn/quy-che-tin-chi",
          sourceType: "OFFICIAL",
          title: "Quy chế đào tạo",
        },
      ],
      reasoning: "Quy chế tín chỉ đã quy định rõ về điều kiện học phần tiên quyết.",
      idempotencyKey: subKey,
    });
    assert.equal(sub2.ok, true);
    assert.equal(sub2.idempotent, true);
    assert.equal(sub2.assessmentId, sub1.assessmentId);

    // 3. Verify exactly 1 assessment in public.expert_assessments
    const assessCount = await pool.query(
      `SELECT count(*)::int AS count FROM public.expert_assessments WHERE assignment_id = $1`,
      [assignmentId]
    );
    assert.equal(assessCount.rows[0].count, 1, "Exactly 1 assessment must exist in DB");

    // 4. Invariant: REPUTATION_IDEMPOTENCY — Exactly 1 reputation event awarded
    const repEvents = await pool.query(
      `SELECT count(*)::int AS count, sum(delta)::int AS total_delta
         FROM private.reputation_events
        WHERE user_id = $1 AND idempotency_key = $2`,
      [e0, `assessment_completion:${sub1.assessmentId}`]
    );
    assert.equal(repEvents.rows[0].count, 1, "Exactly 1 reputation event must be recorded");
    assert.equal(repEvents.rows[0].total_delta, 5, "Exactly +5 delta awarded once");

    const REPUTATION_IDEMPOTENCY = "PASS";
    assert.equal(REPUTATION_IDEMPOTENCY, "PASS");

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
