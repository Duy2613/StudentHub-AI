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

test("Blind Expert 16-Pair Matrix — Exhaustive 4x4 matrix (U0..U3 x E0..E3) verification", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const users = [
    { label: "U0", id: accounts.u0 },
    { label: "U1", id: accounts.u1 },
    { label: "U2", id: accounts.u2 },
    { label: "U3", id: accounts.u3 },
  ];
  const experts = [
    { label: "E0", id: accounts.e0, vote: "TRUSTWORTHY", conf: 85 },
    { label: "E1", id: accounts.e1, vote: "UNTRUSTWORTHY", conf: 75 },
    { label: "E2", id: accounts.e2, vote: "INSUFFICIENT_EVIDENCE", conf: 60 },
    { label: "E3", id: accounts.e3, vote: "TRUSTWORTHY", conf: 90 },
  ];

  let totalPairsTested = 0;
  const createdCaseIds = [];

  try {
    for (const u of users) {
      const caseId = randomUUID();
      createdCaseIds.push(caseId);
      await createTestTrustCase(pool, { caseId, ownerId: u.id, state: "IN_PROGRESS" });

      const claim = `Mệnh đề ma trận 4x4 của ${u.label}: Khảo sát chứng chỉ hành nghề y tế năm 2026.`;

      // 1. L1 Dispatch
      const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
        caseId,
        caseRevision: 1,
        ownerId: u.id,
        input: { type: "text", content: claim },
        l1Result: {
          operationStatus: "COMPLETED",
          finding: "LOCAL_PASS",
          canonicalClaim: claim,
          domainCode: "GENERAL_EPISTEMICS",
        },
        requestId: `matrix-${u.label}-${caseId}`,
      });
      assert.equal(dispatchRes.ok, true, `Dispatch must succeed for user ${u.label}`);

      // 2. Iterate through all 4 experts for this user's case
      for (const e of experts) {
        const assignRes = await pool.query(
          `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
          [dispatchRes.reviewRequestId, e.id]
        );
        assert.ok(
          assignRes.rows.length >= 1,
          `Assignment must exist for pair ${u.label} -> ${e.label}`
        );
        const assignmentId = assignRes.rows[0].id;

        // Verify Pre-Submission Blindness
        const blindDossier = await ExpertBlindReviewService.getBlindDossier({
          assignmentId,
          expertId: e.id,
        });
        assert.equal(blindDossier.isLocked, false);
        assert.equal(blindDossier.trustResult, undefined);
        assert.equal(blindDossier.resolution, undefined);

        // Submit Assessment
        const submitRes = await ExpertBlindReviewService.submitAssessment({
          assignmentId,
          expertId: e.id,
          vote: e.vote,
          confidence: e.conf,
          evidenceList: [
            {
              url: "https://moh.gov.vn/van-ban-y-te-2026",
              sourceType: "OFFICIAL",
              title: "Cổng thông tin Bộ Y Tế",
            },
          ],
          reasoning: `Thẩm định chuyên môn độc lập của ${e.label} cho ca ${u.label}: Bằng chứng xác thực.`,
          idempotencyKey: `matrix-sub-${u.label}-${e.label}-${caseId}`,
        });
        assert.equal(submitRes.ok, true);
        assert.equal(submitRes.assessmentState, "LOCKED");

        // Verify Lock
        const lockedDossier = await ExpertBlindReviewService.getBlindDossier({
          assignmentId,
          expertId: e.id,
        });
        assert.equal(lockedDossier.isLocked, true);
        assert.equal(lockedDossier.revealGate, "WAITING_FOR_L5");

        totalPairsTested++;
      }

      // 3. Complete Trust L5 for this case
      await pool.query(`UPDATE public.trust_cases SET state = 'TRUSTWORTHY' WHERE id = $1`, [caseId]);

      // 4. Verify Reveal Gate opens for all 4 experts after L5
      for (const e of experts) {
        const assignRes = await pool.query(
          `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
          [dispatchRes.reviewRequestId, e.id]
        );
        const assignmentId = assignRes.rows[0].id;

        const revealedDossier = await ExpertBlindReviewService.getBlindDossier({
          assignmentId,
          expertId: e.id,
        });
        assert.equal(revealedDossier.revealGate, "REVEALED");
        assert.ok(revealedDossier.trustResult);
        assert.equal(revealedDossier.trustResult.verdict, "TRUSTWORTHY");
        assert.ok(revealedDossier.resolution);
      }
    }

    assert.equal(totalPairsTested, 16, "Must have verified all 16 pairs (4 users x 4 experts)");

  } finally {
    for (const cId of createdCaseIds) {
      await cleanupTestCase(pool, cId);
    }
  }
});
