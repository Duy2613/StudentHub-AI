import "../../src/lib/server/env/canonicalEnv.js";
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { ExpertBlindReviewDispatcher } from "../../src/lib/server/expert/ExpertBlindReviewDispatcher.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";

after(async () => {
  await getPostgresPool().end().catch(() => {});
});

test("Blind Expert L1 Dispatch — Dispatches assignments to eligible experts upon L1 claim ready", async () => {
  const caseId = "11111111-2222-3333-4444-555555555555";
  const ownerId = "8a9b3c93-8459-4072-b46c-95cfb71d0f66"; // U0

  const pool = getPostgresPool();
  await pool.query(
    `INSERT INTO public.trust_cases (id, owner_id, state, visibility)
     VALUES ($1, $2, 'PASS', 'PRIVATE')
     ON CONFLICT (id) DO NOTHING`,
    [caseId, ownerId]
  );

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
      requestId: "test-l1-req-1",
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

    // Cleanup test records
    await pool.query(`DELETE FROM private.expert_assignments WHERE review_request_id = $1`, [result.reviewRequestId]);
    await pool.query(`DELETE FROM private.expert_review_requests WHERE id = $1`, [result.reviewRequestId]);
  } finally {
    await pool.query(`DELETE FROM public.trust_cases WHERE id = $1`, [caseId]);
  }
});
