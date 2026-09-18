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

test("Blind Expert Other Votes Hidden — Independent expert votes strictly isolated pre-submission", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, e0, e1 } = accounts;

  const caseId = randomUUID();
  await createTestTrustCase(pool, { caseId, ownerId: u0 });

  try {
    // 1. Dispatch blind review at L1 to eligible experts
    const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: "Thông tin xét tuyển kết hợp chứng chỉ ngoại ngữ 2026." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Thông tin xét tuyển kết hợp chứng chỉ ngoại ngữ 2026.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `other-votes-${caseId}`,
    });
    assert.equal(dispatchRes.ok, true);

    const assignE0Res = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e0]
    );
    const assignE1Res = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e1]
    );

    assert.ok(assignE0Res.rows.length >= 1, "E0 should be assigned");
    assert.ok(assignE1Res.rows.length >= 1, "E1 should be assigned");
    const e0AssignmentId = assignE0Res.rows[0].id;
    const e1AssignmentId = assignE1Res.rows[0].id;

    // 2. E0 submits their assessment with distinctive reasoning and evidence
    const distinctiveReasoning = "LẬP LUẬN BÍ MẬT CỦA E0: Căn cứ công văn số 1234/BGDĐT-GDĐH";
    const distinctiveUrl = "https://moet.gov.vn/van-ban-1234";

    const submitResE0 = await ExpertBlindReviewService.submitAssessment({
      assignmentId: e0AssignmentId,
      expertId: e0,
      vote: "UNTRUSTWORTHY",
      confidence: 85,
      evidenceList: [
        {
          url: distinctiveUrl,
          sourceType: "OFFICIAL",
          title: "Công văn Bộ Giáo dục",
        },
      ],
      reasoning: distinctiveReasoning,
      idempotencyKey: `e0-sub-${caseId}`,
    });
    assert.equal(submitResE0.ok, true);
    assert.equal(submitResE0.assessmentState, "LOCKED");

    // 3. E1 fetches pending reviews list
    const e1Pending = await ExpertBlindReviewService.getPendingReviews(e1);
    const e1PendingItem = e1Pending.find((p) => p.assignmentId === e1AssignmentId);
    assert.ok(e1PendingItem, "E1 must still have pending review");

    assert.equal(e1PendingItem.otherVotes, undefined);
    assert.equal(e1PendingItem.peerReviews, undefined);

    // 4. E1 fetches their full Blind Dossier
    const e1Dossier = await ExpertBlindReviewService.getBlindDossier({
      assignmentId: e1AssignmentId,
      expertId: e1,
    });

    assert.equal(e1Dossier.isLocked, false);
    assert.equal(e1Dossier.otherVotes, undefined);
    assert.equal(e1Dossier.peerAssessments, undefined);

    // 5. Audit serialized JSON for any trace of E0's submission
    const serializedE1 = JSON.stringify(e1Dossier);

    assert.equal(
      serializedE1.includes("LẬP LUẬN BÍ MẬT"),
      false,
      "E1 dossier must NOT contain E0 reasoning"
    );
    assert.equal(
      serializedE1.includes("1234/BGDĐT"),
      false,
      "E1 dossier must NOT contain E0 reasoning details"
    );
    assert.equal(
      serializedE1.includes("van-ban-1234"),
      false,
      "E1 dossier must NOT contain E0 evidence URL"
    );
    assert.equal(
      serializedE1.includes(e0),
      false,
      "E1 dossier must NOT contain E0 ID"
    );

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
