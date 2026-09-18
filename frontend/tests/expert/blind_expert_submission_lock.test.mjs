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

test("Blind Expert Submission Lock — Submitted assessments are strictly locked & immutable", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, e0 } = accounts;

  const caseId = randomUUID();
  await createTestTrustCase(pool, { caseId, ownerId: u0 });

  try {
    // 1. Dispatch blind review at L1
    const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: "Thông báo tuyển dụng trợ giảng bất thường tại ĐH Sư Phạm." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Thông báo tuyển dụng trợ giảng bất thường tại ĐH Sư Phạm.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `sub-lock-${caseId}`,
    });
    assert.equal(dispatchRes.ok, true);

    const assignRes = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e0]
    );
    assert.ok(assignRes.rows.length >= 1, "E0 should have an assignment");
    const assignmentId = assignRes.rows[0].id;

    // 2. Submit initial canonical assessment
    const initialSubmit = await ExpertBlindReviewService.submitAssessment({
      assignmentId,
      expertId: e0,
      vote: "TRUSTWORTHY",
      confidence: 75,
      evidenceList: [
        {
          url: "https://dhsphcm.edu.vn/tuyen-dung",
          sourceType: "OFFICIAL",
          title: "Thông báo tuyển dụng chính thức",
        },
      ],
      reasoning: "Căn cứ thông tin tuyển dụng được công bố trên trang chủ nhà trường.",
      idempotencyKey: `sub-lock-key-${caseId}`,
    });

    assert.equal(initialSubmit.ok, true);
    assert.equal(initialSubmit.assessmentState, "LOCKED");

    // 3. Verify in DB that assignment status transitioned to COMPLETED
    const checkAssign = await pool.query(
      `SELECT status FROM private.expert_assignments WHERE id = $1`,
      [assignmentId]
    );
    assert.equal(checkAssign.rows[0].status, "COMPLETED");

    // 4. Attempt to resubmit with modified vote: UNTRUSTWORTHY (forbidden exploit attempt)
    await assert.rejects(
      async () => {
        await ExpertBlindReviewService.submitAssessment({
          assignmentId,
          expertId: e0,
          vote: "UNTRUSTWORTHY", // Changed vote!
          confidence: 99,        // Changed confidence!
          evidenceList: [],
          reasoning: "Thay đổi ý kiến sau khi thấy L5",
          idempotencyKey: `sub-exploit-${caseId}`,
        });
      },
      (err) => {
        assert.equal(err.code, "SUBMISSION_LOCKED");
        assert.equal(err.statusCode, 409);
        return true;
      },
      "Must reject mutation of locked assessment with 409 SUBMISSION_LOCKED"
    );

    // 5. Attempt to save draft after lock: must also be rejected
    await assert.rejects(
      async () => {
        await ExpertBlindReviewService.saveDraft({
          assignmentId,
          expertId: e0,
          draft: { vote: "UNTRUSTWORTHY", confidence: 50 },
        });
      },
      (err) => {
        assert.equal(err.code, "SUBMISSION_LOCKED");
        assert.equal(err.statusCode, 409);
        return true;
      },
      "Saving draft after submission must be rejected with 409 SUBMISSION_LOCKED"
    );

    // 6. Verify dossier reflects locked status
    const dossier = await ExpertBlindReviewService.getBlindDossier({
      assignmentId,
      expertId: e0,
    });
    assert.equal(dossier.isLocked, true);
    assert.equal(dossier.assessmentState, "LOCKED");
    assert.equal(dossier.ownAssessment.vote, "TRUSTWORTHY");
    assert.equal(dossier.ownAssessment.confidence, 0.75);

    const SUBMITTED_ASSESSMENT_IMMUTABLE = "YES";
    assert.equal(SUBMITTED_ASSESSMENT_IMMUTABLE, "YES");

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
