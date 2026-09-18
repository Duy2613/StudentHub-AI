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

test("Blind Expert L5 Reveal Gate — Reveal opens ONLY when Expert is locked AND L5 is completed", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, e0 } = accounts;

  const caseId = randomUUID();
  // Start with case IN_PROGRESS (L5 not yet completed)
  await createTestTrustCase(pool, { caseId, ownerId: u0, state: "IN_PROGRESS" });

  try {
    // 1. Dispatch blind review at L1
    const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: "Thông tin phát hiện vi phạm bản quyền đề tài nghiên cứu." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Thông tin phát hiện vi phạm bản quyền đề tài nghiên cứu.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `reveal-gate-${caseId}`,
    });
    assert.equal(dispatchRes.ok, true);

    const assignRes = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e0]
    );
    const assignmentId = assignRes.rows[0].id;

    // --- QUADRANT 1: Expert Unlocked + L5 In Progress ---
    const q1Dossier = await ExpertBlindReviewService.getBlindDossier({ assignmentId, expertId: e0 });
    assert.equal(q1Dossier.isLocked, false);
    assert.equal(q1Dossier.revealGate, undefined);
    assert.equal(q1Dossier.trustResult, undefined);
    assert.equal(q1Dossier.resolution, undefined);

    // --- QUADRANT 2: L5 Completes FIRST + Expert Unlocked ---
    // Update Trust case to COMPLETED/UNTRUSTWORTHY
    await pool.query(`UPDATE public.trust_cases SET state = 'UNTRUSTWORTHY' WHERE id = $1`, [caseId]);

    const q2Dossier = await ExpertBlindReviewService.getBlindDossier({ assignmentId, expertId: e0 });
    // Invariant: Even though L5 is completed, Expert is STILL blind because they have not submitted!
    assert.equal(q2Dossier.isLocked, false);
    assert.equal(q2Dossier.trustResult, undefined, "L5 completed first must NOT reveal result to unsubmitted expert");
    assert.equal(q2Dossier.resolution, undefined);
    assert.equal(q2Dossier.revealGate, undefined);

    // --- QUADRANT 3: Expert Submits FIRST + L5 Re-opened/In Progress ---
    // Set case back to IN_PROGRESS to test submit-first scenario
    await pool.query(`UPDATE public.trust_cases SET state = 'IN_PROGRESS' WHERE id = $1`, [caseId]);

    const submitRes = await ExpertBlindReviewService.submitAssessment({
      assignmentId,
      expertId: e0,
      vote: "UNTRUSTWORTHY",
      confidence: 85,
      evidenceList: [
        {
          url: "https://journals.plos.org/plosone/article?id=10.1371/example",
          sourceType: "ACADEMIC",
          title: "Báo cáo liêm chính khoa học",
        },
      ],
      reasoning: "Kiểm tra thấy nội dung đạo văn trùng khớp 80% từ tài liệu công bố năm 2023.",
      idempotencyKey: `reveal-sub-${caseId}`,
    });
    assert.equal(submitRes.ok, true);

    const q3Dossier = await ExpertBlindReviewService.getBlindDossier({ assignmentId, expertId: e0 });
    assert.equal(q3Dossier.isLocked, true);
    assert.equal(q3Dossier.revealGate, "WAITING_FOR_L5");
    assert.ok(q3Dossier.revealMessage);
    assert.equal(q3Dossier.trustResult, undefined, "Trust result must not be revealed while L5 in progress");
    assert.equal(q3Dossier.resolution, undefined);

    // --- QUADRANT 4: Expert Locked + L5 Completed -> REVEAL GATE OPENS ---
    await pool.query(`UPDATE public.trust_cases SET state = 'UNTRUSTWORTHY' WHERE id = $1`, [caseId]);

    const q4Dossier = await ExpertBlindReviewService.getBlindDossier({ assignmentId, expertId: e0 });
    assert.equal(q4Dossier.isLocked, true);
    assert.equal(q4Dossier.revealGate, "REVEALED");
    assert.ok(q4Dossier.trustResult, "Trust result must be revealed in Quadrant 4");
    assert.equal(q4Dossier.trustResult.verdict, "UNTRUSTWORTHY");
    assert.ok(q4Dossier.resolution, "Resolution comparator must be revealed");
    assert.ok(q4Dossier.resolution.comparisonState);
    assert.ok(q4Dossier.resolution.calibration);

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
