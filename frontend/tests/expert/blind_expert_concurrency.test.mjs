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

test("Blind Expert Concurrency — Two browser tabs submitting concurrently serialized cleanly by DB lock", async () => {
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
      input: { type: "text", content: "Nghiên cứu ứng dụng trí tuệ nhân tạo trong xử lý dữ liệu lớn 2026." },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: "Nghiên cứu ứng dụng trí tuệ nhân tạo trong xử lý dữ liệu lớn 2026.",
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `concurrency-${caseId}`,
    });
    assert.equal(dispatchRes.ok, true);

    const assignRes = await pool.query(
      `SELECT id FROM private.expert_assignments WHERE review_request_id = $1 AND expert_id = $2`,
      [dispatchRes.reviewRequestId, e0]
    );
    const assignmentId = assignRes.rows[0].id;

    // 2. Fire two concurrent submissions at the exact same moment (two browser tabs)
    const p1 = ExpertBlindReviewService.submitAssessment({
      assignmentId,
      expertId: e0,
      vote: "TRUSTWORTHY",
      confidence: 85,
      evidenceList: [
        {
          url: "https://ieee.org/ai-data-2026",
          sourceType: "ACADEMIC",
          title: "IEEE Publication",
        },
      ],
      reasoning: "Bài báo khoa học đã được bình duyệt và đăng tải trên tạp chí quốc tế.",
      idempotencyKey: `concurrent-tab1-${caseId}`,
    }).then(
      (res) => ({ ok: true, res }),
      (err) => ({ ok: false, err })
    );

    const p2 = ExpertBlindReviewService.submitAssessment({
      assignmentId,
      expertId: e0,
      vote: "TRUSTWORTHY",
      confidence: 85,
      evidenceList: [
        {
          url: "https://ieee.org/ai-data-2026",
          sourceType: "ACADEMIC",
          title: "IEEE Publication",
        },
      ],
      reasoning: "Bài báo khoa học đã được bình duyệt và đăng tải trên tạp chí quốc tế.",
      idempotencyKey: `concurrent-tab2-${caseId}`,
    }).then(
      (res) => ({ ok: true, res }),
      (err) => ({ ok: false, err })
    );

    const [r1, r2] = await Promise.all([p1, p2]);

    // One must succeed, and the other must either succeed idempotently or be rejected with 409 SUBMISSION_LOCKED
    const successes = [r1, r2].filter((r) => r.ok);
    const failures = [r1, r2].filter((r) => !r.ok);

    assert.ok(successes.length >= 1, "At least one submission must succeed");
    if (failures.length > 0) {
      assert.equal(failures[0].err.code, "SUBMISSION_LOCKED");
      assert.equal(failures[0].err.statusCode, 409);
    }

    // 3. Invariant: Database contains exactly 1 assessment record
    const countAssess = await pool.query(
      `SELECT count(*)::int AS count FROM public.expert_assessments WHERE assignment_id = $1`,
      [assignmentId]
    );
    assert.equal(countAssess.rows[0].count, 1, "Concurrency race must produce exactly 1 assessment");

    // 4. Invariant: Database contains exactly 1 reputation event
    const repRes = await pool.query(
      `SELECT count(*)::int AS count, sum(delta)::int AS total
         FROM private.reputation_events
        WHERE user_id = $1 AND reason LIKE $2`,
      [e0, `%${caseId}%`]
    );
    assert.equal(repRes.rows[0].count, 1, "Exactly 1 reputation event awarded");
    assert.equal(repRes.rows[0].total, 5, "Total delta must be +5");

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
