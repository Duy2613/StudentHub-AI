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

test("Blind Expert Authorization — BOLA & role boundaries strictly enforced", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, e0, e1 } = accounts;

  const caseId = randomUUID();
  await createTestTrustCase(pool, { caseId, ownerId: u0 });

  try {
    // 1. Dispatch blind review for case
    const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: "Chương trình học bổng quốc tế kiểm tra phân quyền." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Chương trình học bổng quốc tế kiểm tra phân quyền.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `auth-test-${caseId}`,
    });
    assert.equal(dispatchRes.ok, true);

    // 2. Normal User U0 cannot access pending reviews
    const u0Pending = await ExpertBlindReviewService.getPendingReviews(u0);
    assert.equal(u0Pending.length, 0, "Normal user must not have pending expert reviews");

    // 3. Find assignment for E0
    const assignE0Res = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e0]
    );
    assert.ok(assignE0Res.rows.length >= 1, "E0 should have an assignment");
    const e0AssignmentId = assignE0Res.rows[0].id;

    // 4. E0 can access their own dossier
    const e0Dossier = await ExpertBlindReviewService.getBlindDossier({
      assignmentId: e0AssignmentId,
      expertId: e0,
    });
    assert.ok(e0Dossier.assignmentId);
    assert.equal(e0Dossier.assignmentId, e0AssignmentId);

    // 5. BOLA: Expert E1 CANNOT access E0's assignment
    await assert.rejects(
      async () => {
        await ExpertBlindReviewService.getBlindDossier({
          assignmentId: e0AssignmentId,
          expertId: e1,
        });
      },
      (err) => {
        assert.equal(err.code, "FORBIDDEN_ASSIGNMENT");
        assert.equal(err.statusCode, 403);
        return true;
      },
      "E1 accessing E0 assignment must be rejected with 403 FORBIDDEN_ASSIGNMENT"
    );

    // 6. Non-existent assignment returns 404
    const fakeAssignmentId = randomUUID();
    await assert.rejects(
      async () => {
        await ExpertBlindReviewService.getBlindDossier({
          assignmentId: fakeAssignmentId,
          expertId: e0,
        });
      },
      (err) => {
        assert.equal(err.code, "ASSIGNMENT_NOT_FOUND");
        assert.equal(err.statusCode, 404);
        return true;
      }
    );

    // 7. BOLA on submission: E1 cannot submit on E0's assignment
    await assert.rejects(
      async () => {
        await ExpertBlindReviewService.submitAssessment({
          assignmentId: e0AssignmentId,
          expertId: e1,
          vote: "TRUSTWORTHY",
          confidence: 80,
          evidenceList: [],
          reasoning: "Phân tích trái phép",
          idempotencyKey: `illegal-sub-${caseId}`,
        });
      },
      (err) => {
        assert.equal(err.code, "FORBIDDEN_ASSIGNMENT");
        assert.equal(err.statusCode, 403);
        return true;
      },
      "E1 submitting on E0 assignment must be rejected with 403 FORBIDDEN_ASSIGNMENT"
    );

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
