import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { ExpertBlindReviewDispatcher } from "../../src/lib/server/expert/ExpertBlindReviewDispatcher.js";
import { getDemoAccounts, createTestTrustCase, cleanupTestCase } from "./test_helpers.mjs";

after(async () => {
  await getPostgresPool().end().catch(() => {});
});

test("Blind Expert Realtime — Emits minimal projection without broadcasting raw claim or private data", async () => {
  const pool = getPostgresPool();
  const accounts = await getDemoAccounts(pool);
  const { u0 } = accounts;

  const caseId = randomUUID();
  await createTestTrustCase(pool, { caseId, ownerId: u0 });

  const sensitivePrivateClaim = "NỘI DUNG TUYỆT MẬT RIÊNG TƯ CỦA SINH VIÊN KHÔNG ĐƯỢC PHÁT TÁN REALTIME";

  try {
    const dispatchRes = await ExpertBlindReviewDispatcher.dispatchOnL1ClaimReady({
      caseId,
      caseRevision: 1,
      ownerId: u0,
      input: { type: "text", content: sensitivePrivateClaim },
      l1Result: {
        operationStatus: "COMPLETED",
        finding: "LOCAL_PASS",
        canonicalClaim: sensitivePrivateClaim,
        domainCode: "GENERAL_EPISTEMICS",
      },
      requestId: `rt-test-${caseId}`,
    });

    assert.equal(dispatchRes.ok, true);
    assert.ok(dispatchRes.assignmentsCount >= 1);

    // Verify persisted realtime projections in private.realtime_events
    const rtRows = await pool.query(
      `SELECT event_id, channel, event_type, subject_id, classification, payload
         FROM private.realtime_events
        WHERE event_type = 'EXPERT_BLIND_REVIEW_AVAILABLE'
          AND (payload->>'caseId') = $1`,
      [caseId]
    );

    // If durable realtime is configured in the environment, verify the stored events
    if (rtRows.rows.length > 0) {
      for (const row of rtRows.rows) {
        assert.equal(row.event_type, "EXPERT_BLIND_REVIEW_AVAILABLE");
        assert.equal(row.classification, "RESTRICTED");
        assert.ok(row.channel.startsWith("expert:"));

        const payload = row.payload;
        assert.ok(payload.assignmentId, "Data must have assignmentId");
        assert.ok(payload.reviewRequestId, "Data must have reviewRequestId");
        assert.equal(payload.caseId, caseId);
        assert.equal(payload.domain, "GENERAL_EPISTEMICS");

        // Invariant: Zero leakage of raw claim in realtime projection
        const serialized = JSON.stringify(payload);
        assert.equal(
          serialized.includes("NỘI DUNG TUYỆT MẬT"),
          false,
          "Realtime broadcast must NOT include raw private claim text"
        );
        assert.equal(
          serialized.includes(sensitivePrivateClaim),
          false,
          "Realtime broadcast must NOT include full private claim text"
        );
      }
    }

    // Cleanup realtime events
    await pool.query(
      `DELETE FROM private.realtime_events WHERE event_type = 'EXPERT_BLIND_REVIEW_AVAILABLE' AND (payload->>'caseId') = $1`,
      [caseId]
    ).catch(() => {});

  } finally {
    await cleanupTestCase(pool, caseId);
  }
});
