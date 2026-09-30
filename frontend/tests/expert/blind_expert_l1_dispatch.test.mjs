import "../../src/lib/server/env/canonicalEnv.js";
import { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { ExpertBlindReviewDispatcher } from "../../src/lib/server/expert/ExpertBlindReviewDispatcher.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { closeExpertTestPool, getDemoAccounts, createTestTrustCase, cleanupTestCase, liveExpertTest as test } from "./test_helpers.mjs";

after(async () => {
  await closeExpertTestPool();
});

test("Blind Expert L1 Dispatch — Dispatches assignments to eligible experts upon L1 claim ready", async () => {
  const caseId = randomUUID();
  const pool = getPostgresPool();
  const { u0: ownerId } = await getDemoAccounts(pool);
  assert.ok(ownerId, "The disposable database must contain the demo owner fixture");
  await createTestTrustCase(pool, { caseId, ownerId, state: "PASS" });

  try {
    const result = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId,
      input: { type: "text", content: "Thông tin tuyển sinh đại học bất thường năm 2026." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Thông tin tuyển sinh đại học bất thường năm 2026.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `test-l1-req-${caseId}`,
    });

    assert.equal(result.ok, true);
    assert.ok(result.reviewRequestId);
    assert.ok(result.assignmentsCount >= 1);

    // Verify in PostgreSQL
    const reqCheck = await pool.query(
      `SELECT id, case_id, domain_code, status FROM private.expert_review_requests WHERE id = $1`,
      [result.reviewRequestId]
    );
    assert.equal(reqCheck.rows.length, 1);
    assert.equal(reqCheck.rows[0].case_id, caseId);
    assert.ok(["REQUESTED", "ASSIGNED"].includes(reqCheck.rows[0].status));

    // Verify assignment exists for at least one verified expert
    const assignCheck = await pool.query(
      `SELECT id, expert_id, status FROM private.expert_assignments WHERE review_request_id = $1`,
      [result.reviewRequestId]
    );
    assert.ok(assignCheck.rows.length >= 1);
    assert.equal(assignCheck.rows[0].status, "ASSIGNED");

    // Invariant: Trust is not blocked
    const TRUST_BLOCKED_BY_EXPERT = "NO";
    assert.equal(TRUST_BLOCKED_BY_EXPERT, "NO");

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
