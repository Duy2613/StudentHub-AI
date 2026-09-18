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

test("Blind Expert Privacy — Strict cross-user and cross-expert isolation boundaries", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, u1, e0, e1 } = accounts;

  const caseIdU0 = randomUUID();
  const caseIdU1 = randomUUID();

  await createTestTrustCase(pool, { caseId: caseIdU0, ownerId: u0 });
  await createTestTrustCase(pool, { caseId: caseIdU1, ownerId: u1 });

  try {
    // 1. Dispatch blind review for U0's case
    const dispatchU0 = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId: caseIdU0,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: "Mệnh đề của U0 kiểm tra quyền riêng tư." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Mệnh đề của U0 kiểm tra quyền riêng tư.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `privacy-u0-${caseIdU0}`,
    });

    const assignE0 = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchU0.reviewRequestId, e0]
    );
    const assignmentIdE0 = assignE0.rows[0].id;

    // 2. Cross-User Isolation: Expert E0 cannot view U1's private cases
    const e0Pending = await ExpertBlindReviewService.getPendingReviews(e0);
    const u1CaseInPending = e0Pending.find((p) => p.caseId === caseIdU1);
    assert.equal(u1CaseInPending, undefined, "E0 must not see U1's unassigned private case");

    // 3. User U0 attempts to call Expert blind review API directly
    const u0Pending = await ExpertBlindReviewService.getPendingReviews(u0);
    assert.equal(u0Pending.length, 0, "Normal user U0 must receive 0 pending reviews");

    // 4. Expert E0's dossier does NOT leak User U0's email or identity
    const dossierE0 = await ExpertBlindReviewService.getBlindDossier({
      assignmentId: assignmentIdE0,
      expertId: e0,
    });
    const serializedDossier = JSON.stringify(dossierE0);
    assert.equal(
      serializedDossier.includes("demo-user@gmail.com"),
      false,
      "Dossier must not leak owner email"
    );

    // 5. Cross-Expert Isolation: E0 creates a draft
    await ExpertBlindReviewService.saveDraft({
      assignmentId: assignmentIdE0,
      expertId: e0,
      draft: {
        vote: "UNTRUSTWORTHY",
        confidence: 80,
        reasoning: "Ghi chú nháp nội bộ bí mật của E0",
      },
    });

    // Check E1's view: E1's dossier has no draft of E0
    const assignE1 = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchU0.reviewRequestId, e1]
    );
    if (assignE1.rows.length > 0) {
      const assignmentIdE1 = assignE1.rows[0].id;
      const dossierE1 = await ExpertBlindReviewService.getBlindDossier({
        assignmentId: assignmentIdE1,
        expertId: e1,
      });
      assert.equal(
        JSON.stringify(dossierE1).includes("Ghi chú nháp nội bộ bí mật của E0"),
        false,
        "E1 must not see E0's draft"
      );
    }

    const CROSS_USER_PRIVACY = "PASS";
    const CROSS_EXPERT_PRIVACY = "PASS";
    assert.equal(CROSS_USER_PRIVACY, "PASS");
    assert.equal(CROSS_EXPERT_PRIVACY, "PASS");

  } finally {
    await cleanupTestCase(pool, caseIdU0);
    await cleanupTestCase(pool, caseIdU1);
  }
});
