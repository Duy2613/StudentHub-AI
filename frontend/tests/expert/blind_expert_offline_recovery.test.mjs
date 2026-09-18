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

test("Blind Expert Offline Recovery — Full reconstruction of pending reviews from database without realtime dependency", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0, e2 } = accounts; // Use E2

  const caseId = randomUUID();
  await createTestTrustCase(pool, { caseId, ownerId: u0 });

  const offlineClaim = "Khảo sát tính trung thực của báo cáo kiểm định chất lượng đào tạo năm 2026.";

  try {
    // 1. Case dispatched while Expert E2 was offline
    const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: offlineClaim },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: offlineClaim,
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `offline-${caseId}`,
    });
    assert.equal(dispatchRes.ok, true);

    // 2. Expert logs in later: floating widget and Review Desk call getPendingReviews
    // Reconstructs completely from DB authority
    const pendingReviews = await ExpertBlindReviewService.getPendingReviews(e2);
    assert.ok(pendingReviews.length >= 1, "Must reconstruct pending reviews from DB");

    const match = pendingReviews.find((p) => p.caseId === caseId);
    assert.ok(match, "Reconstructed review for offline case must be present");
    assert.equal(match.domain, "GENERAL_EPISTEMICS");
    assert.equal(match.claim, offlineClaim);
    assert.equal(match.status, "ASSIGNED");
    assert.ok(match.deadline);

    // 3. Expert expands widget: getBlindDossier reconstructs state
    const dossier = await ExpertBlindReviewService.getBlindDossier({
      assignmentId: match.assignmentId,
      expertId: e2,
    });
    assert.equal(dossier.assignmentId, match.assignmentId);
    assert.equal(dossier.isLocked, false);
    assert.equal(dossier.claim, offlineClaim);

    // 4. Expert completes review and submits
    const submitRes = await ExpertBlindReviewService.submitAssessment({
      assignmentId: match.assignmentId,
      expertId: e2,
      vote: "INSUFFICIENT_EVIDENCE",
      confidence: 60,
      evidenceList: [],
      reasoning: "Chưa đủ tài liệu đối chứng chính thức để xác định tính trung thực của báo cáo kiểm định.",
      idempotencyKey: `offline-sub-${caseId}`,
    });
    assert.equal(submitRes.ok, true);
    assert.equal(submitRes.assessmentState, "LOCKED");

    // 5. Subsequent getPendingReviews excludes completed review
    const pendingAfter = await ExpertBlindReviewService.getPendingReviews(e2);
    const matchAfter = pendingAfter.find((p) => p.caseId === caseId);
    assert.equal(matchAfter, undefined, "Completed review must no longer appear in pending list");

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
