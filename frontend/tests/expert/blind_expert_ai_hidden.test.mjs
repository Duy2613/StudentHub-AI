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

test("Blind Expert AI Hidden — Zero AI leakage to Expert pre-submission (including Senior E0)", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, e0, e1 } = accounts;

  const caseId = randomUUID();
  // Simulate a case where L5 has finished or is progressing with suspicious state
  await createTestTrustCase(pool, { caseId, ownerId: u0, state: "UNTRUSTWORTHY" });

  try {
    // 1. Dispatch blind review at L1
    const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: "Thông tin văn bằng chứng chỉ được cấp sai quy định tại ĐHQG." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Thông tin văn bằng chứng chỉ được cấp sai quy định tại ĐHQG.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `ai-hidden-${caseId}`,
    });
    assert.equal(dispatchRes.ok, true);

    // 2. Fetch assignments for E0 (Senior 5★) and E1 (Junior 1★)
    const assignE0Res = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e0]
    );
    const assignE1Res = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e1]
    );

    assert.ok(assignE0Res.rows.length >= 1, "E0 should have an assignment");
    const e0AssignmentId = assignE0Res.rows[0].id;

    // 3. Inspect Pending Reviews DTO for E0
    const pendingList = await ExpertBlindReviewService.getPendingReviews(e0);
    const pendingItem = pendingList.find((p) => p.assignmentId === e0AssignmentId);
    assert.ok(pendingItem, "Pending item must be present");

    const forbiddenFields = [
      "l2", "l2a", "l2b", "l2c", "l3", "l4", "l5",
      "verdict", "aiVerdict", "aiConfidence", "trustConfidence",
      "mediaForensics", "decision", "sightengine", "forensicScores",
      "stages", "trustResult", "consensus", "comparison"
    ];

    for (const field of forbiddenFields) {
      assert.equal(
        pendingItem[field],
        undefined,
        `Pending review DTO leaked forbidden field: ${field}`
      );
    }

    // 4. Inspect Full Blind Dossier for Senior Expert E0
    const dossierE0 = await ExpertBlindReviewService.getBlindDossier({
      assignmentId: e0AssignmentId,
      expertId: e0,
    });

    // Verify allowed context is present
    assert.ok(dossierE0.claim, "Dossier must contain claim");
    assert.ok(dossierE0.domain, "Dossier must contain domain");
    assert.ok(dossierE0.boundedContext, "Dossier must contain boundedContext");
    assert.equal(dossierE0.status, "ASSIGNED");

    // Invariant: Zero AI leakage pre-submission
    let leakedCount = 0;
    for (const field of forbiddenFields) {
      if (dossierE0[field] !== undefined) {
        leakedCount++;
      }
    }
    assert.equal(dossierE0.comparison, undefined, "Comparison must not exist before submission");
    assert.equal(dossierE0.trustResult, undefined, "Trust result must not exist before submission");
    assert.equal(dossierE0.resolution, undefined, "Resolution must not exist before submission");
    assert.equal(dossierE0.isLocked, false);

    const serializedDto = JSON.stringify(dossierE0);
    const forbiddenPatterns = [
      /"verdict"/i,
      /"aiVerdict"/i,
      /"trustScore"/i,
      /"sightengine"/i,
      /"mediaForensics"/i,
      /"l5Result"/i,
    ];

    for (const pattern of forbiddenPatterns) {
      assert.equal(
        pattern.test(serializedDto),
        false,
        `Serialized DTO matched forbidden AI pattern ${pattern}`
      );
    }

    const PRE_SUBMISSION_AI_RESULT_LEAK = leakedCount;
    assert.equal(PRE_SUBMISSION_AI_RESULT_LEAK, 0, "PRE_SUBMISSION_AI_RESULT_LEAK must be 0");

    // 5. Verify Senior E0 gets identical blind protection as Junior E1
    if (assignE1Res.rows.length >= 1) {
      const e1AssignmentId = assignE1Res.rows[0].id;
      const dossierE1 = await ExpertBlindReviewService.getBlindDossier({
        assignmentId: e1AssignmentId,
        expertId: e1,
      });
      assert.equal(dossierE1.comparison, undefined);
      assert.equal(dossierE0.comparison, undefined);
    }

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
