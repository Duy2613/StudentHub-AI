import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { TrustPersistenceService } from "../../src/lib/server/database/TrustPersistenceService.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";

after(async () => {
  await getPostgresPool().end();
});

test("PHASE 2 LIVE GATE: End-to-end Trust persistence, retrieval, cross-user denial, and idempotency", async () => {
  const pool = getPostgresPool();
  const userRes = await pool.query(`SELECT id FROM auth.users LIMIT 2`);
  if (userRes.rows.length === 0) {
    console.log("No users in auth.users, skipping live gate test");
    return;
  }
  const userA = userRes.rows[0].id;
  const userB = userRes.rows[1]?.id || crypto.randomUUID();

  const caseId = crypto.randomUUID();
  const idempotencyCaseId = crypto.randomUUID();
  const requestId = `req_gate_${Date.now()}`;
  const inputUrl = `https://gate-verify-test-${Date.now()}.edu.vn`;
  const idempotencyInput = {
    type: "url",
    content: `https://idempotency-gate-${Date.now()}.edu.vn/path?Case=Sensitive`,
    metadata: { url: `https://idempotency-gate-${Date.now()}.edu.vn/path?Case=Sensitive` },
  };
  const idempotencyKey = `trust-live-${crypto.randomUUID()}`;
  const idempotencyPipeline = (verificationId, runId) => ({
    ...mockPipelineResult,
    verificationId,
    runId,
    layers: Object.fromEntries(Object.entries(mockPipelineResult.layers).map(([layerId, layer]) => [layerId, { ...layer, id: crypto.randomUUID() }])),
  });

  const mockPipelineResult = {
    verificationId: caseId,
    contractVersion: "trust.v5",
    state: "BLOCK",
    decision: {
      verdict: "BLOCK",
      confidence: 0.96,
      reasons: ["Phát hiện giả mạo tên miền trường đại học chính quy."],
    },
    layers: {
      layer2A: {
        id: crypto.randomUUID(),
        threatMatch: true,
        threatType: "PHISHING",
        provider: "google-safe-browsing",
        confidence: 0.99,
      },
      layer2: {
        id: crypto.randomUUID(),
        classification: "IMPERSONATION",
        riskLevel: "CRITICAL",
        confidence: 0.95,
        claims: [
          { statement: "Nhận bằng thạc sĩ không cần đi học", status: "CONTRADICTED" },
        ],
        entities: [
          { type: "ORGANIZATION", value: "Gate University Impersonator", role: "SUSPECT", confidence: 0.92 },
        ],
      },
      layer3: {
        id: crypto.randomUUID(),
        verified: false,
        source: "tavily-evidence",
        confidence: 0.90,
        sources: [
          { title: "Cảnh báo lừa đảo", url: "https://moet.gov.vn/canh-bao" },
        ],
      },
      layer4: {
        id: crypto.randomUUID(),
        verdict: "BLOCK",
        confidence: 0.98,
        policyVersion: "l4-v2.1",
        rulesTriggered: ["RULE_ZERO_TOLERANCE_PHISHING"],
      },
    },
  };

  const input = {
    type: "url",
    content: inputUrl,
    metadata: { source: "test_harness" },
  };

  let createdCaseId = null;

  try {
    // 1. Persist canonical Trust case for User A
    const res = await TrustPersistenceService.recordTrustExecution({
      pipelineResult: mockPipelineResult,
      input,
      principal: { subjectId: `user:${userA}` },
      requestId,
    });

    assert.ok(res.persisted, "Case must be persisted");
    assert.ok(res.caseId, "caseId must be returned");
    createdCaseId = res.caseId;

    // 2. Verify database records
    const caseInDb = await pool.query(`SELECT * FROM public.trust_cases WHERE id = $1`, [createdCaseId]);
    assert.equal(caseInDb.rows[0].state, "BLOCK", "Final decision state persisted");
    assert.equal(caseInDb.rows[0].owner_id, userA, "Case owner strictly User A");

    const inputInDb = await pool.query(`SELECT * FROM public.case_inputs WHERE case_id = $1`, [createdCaseId]);
    assert.equal(inputInDb.rows.length, 1, "Input persisted");
    assert.equal(inputInDb.rows[0].object_key, inputUrl, "Object key matches input URL");
    assert.ok(inputInDb.rows[0].content_hash, "Content hash is populated");

    const claimsInDb = await pool.query(`SELECT * FROM public.claims WHERE creator_id = $1`, [userA]);
    assert.ok(claimsInDb.rows.length > 0, "Claims persisted");

    const evidenceInDb = await pool.query(`SELECT * FROM public.evidence WHERE case_id = $1`, [createdCaseId]);
    assert.ok(evidenceInDb.rows.length >= 3, "All layers of evidence persisted with provenance");

    // 3. Retrieve through owner-safe API
    const ownerView = await TrustPersistenceService.getCaseForOwner(createdCaseId, userA);
    assert.ok(ownerView, "Owner A can retrieve case");
    assert.equal(ownerView.id, createdCaseId);
    assert.equal(ownerView.inputs.length, 1);
    assert.ok(ownerView.evidence.length >= 3);

    // 4. Another user denied (Cross-user denial)
    const attackerBView = await TrustPersistenceService.getCaseForOwner(createdCaseId, userB);
    assert.equal(attackerBView, null, "User B strictly denied access to User A case");

    // 5. Idempotent retry: Same input with isRetry flag does not duplicate case
    const retryRes = await TrustPersistenceService.recordTrustExecution({
      pipelineResult: mockPipelineResult,
      input: { ...input, metadata: { isRetry: true } },
      principal: { subjectId: `user:${userA}` },
      requestId: `req_retry_${Date.now()}`,
    });

    assert.equal(retryRes.caseId, createdCaseId, "Idempotent retry returns existing case ID");
    assert.equal(retryRes.idempotent, true, "Marked as idempotent");

    const countRes = await pool.query(`SELECT count(*)::int as c FROM public.trust_cases WHERE id = $1`, [createdCaseId]);
    assert.equal(countRes.rows[0].c, 1, "Exactly one case exists in DB");

    // 6. Durable idempotency: a new execution with the same key and payload
    // resolves to the first case, while a different payload conflicts.
    const firstIdempotent = await TrustPersistenceService.recordTrustExecution({
      pipelineResult: idempotencyPipeline(idempotencyCaseId, crypto.randomUUID()),
      input: idempotencyInput,
      principal: { subjectId: `user:${userA}` },
      requestId: `req_idempotency_first_${Date.now()}`,
      idempotencyKey,
    });
    const retryIdempotent = await TrustPersistenceService.recordTrustExecution({
      pipelineResult: idempotencyPipeline(crypto.randomUUID(), crypto.randomUUID()),
      input: idempotencyInput,
      principal: { subjectId: `user:${userA}` },
      requestId: `req_idempotency_retry_${Date.now()}`,
      idempotencyKey,
    });
    assert.equal(firstIdempotent.caseId, idempotencyCaseId, "The first idempotent command persists its case");
    assert.equal(retryIdempotent.caseId, idempotencyCaseId, "A retried execution resolves to the durable case");
    assert.equal(retryIdempotent.idempotent, true, "A retried execution is marked idempotent");
    await assert.rejects(
      () => TrustPersistenceService.recordTrustExecution({
        pipelineResult: idempotencyPipeline(crypto.randomUUID(), crypto.randomUUID()),
        input: { ...idempotencyInput, content: `${idempotencyInput.content}/different` },
        principal: { subjectId: `user:${userA}` },
        requestId: `req_idempotency_conflict_${Date.now()}`,
        idempotencyKey,
      }),
      (error) => error?.code === "TRUST_IDEMPOTENCY_CONFLICT" && error?.statusCode === 409,
      "A reused key with a different payload must conflict"
    );

    // 7. Record failure state
    const failRes = await TrustPersistenceService.recordTrustFailure({
      error: new Error("Simulated pipeline network timeout"),
      input,
      principal: { subjectId: `user:${userA}` },
      requestId: `req_fail_${Date.now()}`,
    });
    assert.ok(failRes.persisted, "Failure state persisted");
    const failedCase = await pool.query(`SELECT * FROM public.trust_cases WHERE id = $1`, [failRes.caseId]);
    assert.equal(failedCase.rows[0].state, "FAILED", "Failed case state is FAILED");

    // Clean up failure case
    await pool.query(`DELETE FROM private.audit_events WHERE target_id = $1`, [failRes.caseId]);
    await pool.query(`DELETE FROM public.trust_cases WHERE id = $1`, [failRes.caseId]);

  } finally {
    if (createdCaseId) {
      await pool.query(`DELETE FROM public.evidence_passports WHERE subject_id = $1`, [createdCaseId]);
      await pool.query(`DELETE FROM private.audit_events WHERE target_id = $1`, [createdCaseId]);
      await pool.query(`DELETE FROM public.case_inputs WHERE case_id = $1`, [createdCaseId]);
      await pool.query(`DELETE FROM public.evidence WHERE case_id = $1`, [createdCaseId]);
      await pool.query(`DELETE FROM public.case_entities WHERE case_id = $1`, [createdCaseId]);
      await pool.query(`DELETE FROM public.trust_cases WHERE id = $1`, [createdCaseId]);
      await pool.query(`DELETE FROM public.claims WHERE creator_id = $1`, [userA]);
    }
    await pool.query(`DELETE FROM public.evidence_passports WHERE subject_id = $1`, [idempotencyCaseId]);
    await pool.query(`DELETE FROM private.audit_events WHERE target_id = $1`, [idempotencyCaseId]);
    await pool.query(`DELETE FROM public.trust_cases WHERE id = $1`, [idempotencyCaseId]);
  }
});
