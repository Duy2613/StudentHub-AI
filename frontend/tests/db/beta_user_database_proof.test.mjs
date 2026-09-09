// frontend/tests/db/beta_user_database_proof.test.mjs
//
// Rigorous verification test proving:
// 1. Two distinct test identities (USER_A and USER_B)
// 2. USER_A creates durable trust cases, runs, stage runs, revisions, and reports
// 3. USER_B cannot read USER_A's records under RLS (Cross-Tenant Isolation / IDOR defense)
// 4. Idempotency replay verification:
//    - Same payload + same key -> returns identical result without row duplication
//    - Different payload + same key -> throws 409 conflict
// 5. Complete teardown cleanup

import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { getPostgresPool, closePostgresPoolForTests } from "../../src/lib/server/database/PostgresPool.js";
import { TrustPersistenceService } from "../../src/lib/server/database/TrustPersistenceService.js";
import { ReportService } from "../../src/lib/server/reports/ReportService.js";

const USER_A = "00000000-0000-4000-a000-000000000001";
const USER_B = "00000000-0000-4000-b000-000000000002";
const liveGate = {
  skip: !process.env.DATABASE_URL && "DATABASE_URL is not configured",
};

let pool;
let createdCaseIds = [];
let createdRunIds = [];
let createdReportIds = [];

async function asRole(role, subjectId, sql, values = []) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${role}`);
    await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [subjectId || ""]);
    const result = await client.query(sql, values);
    await client.query("ROLLBACK");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

before(async () => {
  if (!process.env.DATABASE_URL) return;
  pool = getPostgresPool();

  // Ensure test users exist in auth.users
  await pool.query(`
    INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
    VALUES
      ($1, 'authenticated', 'authenticated', 'beta-user-a@studenthub.test', NOW(), NOW()),
      ($2, 'authenticated', 'authenticated', 'beta-user-b@studenthub.test', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [USER_A, USER_B]);

  // Ensure profiles exist
  await pool.query(`
    INSERT INTO public.profiles (id, display_name, created_at, updated_at)
    VALUES
      ($1, 'Beta User A', NOW(), NOW()),
      ($2, 'Beta User B', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [USER_A, USER_B]);
});

after(async () => {
  if (pool) {
    try {
      if (createdReportIds.length) {
        await pool.query("DELETE FROM private.report_jobs WHERE id = ANY($1::uuid[])", [createdReportIds]);
      }
      if (createdCaseIds.length) {
        await pool.query("DELETE FROM public.trust_cases WHERE id = ANY($1::uuid[])", [createdCaseIds]);
      }
      await pool.query("DELETE FROM public.profiles WHERE id IN ($1, $2)", [USER_A, USER_B]);
      await pool.query("DELETE FROM auth.users WHERE id IN ($1, $2)", [USER_A, USER_B]);
    } catch (cleanupErr) {
      console.error("[Cleanup Error]", cleanupErr);
    }
  }
  await closePostgresPoolForTests();
});

test("Beta User Proof 1: USER_A creates durable trust execution with idempotency key", liveGate, async () => {
  const idemKey = `idem-proof-${Date.now()}-1`;
  const verificationId = crypto.randomUUID();

  const mockPipeline = {
    verificationId,
    contractVersion: "trust.v5",
    pipelineVersion: "trust.v5",
    state: "SUSPICIOUS",
    decision: {
      verdict: "SUSPICIOUS",
      confidence: 0.88,
      security: "SUSPICIOUS",
      epistemicState: "SUSPICIOUS",
      reasons: ["Tên miền mạo danh cổng đào tạo"],
    },
    stages: {
      l1: {
        operationStatus: "COMPLETED",
        finding: "Phishing domain pattern detected",
        summary: "Layer 1 local rules flagged suspicious domain",
        evidenceRefs: ["rule://l1/domain-pattern"],
      },
      l2a: {
        operationStatus: "COMPLETED",
        finding: "Threat intelligence match",
        summary: "Layer 2A threat provider check",
      },
    },
    layers: {
      layer1: {
        id: crypto.randomUUID(),
        status: "FLAG",
        confidence: 0.85,
        ruleVersion: "l1-v1",
        signals: ["phishing_domain_pattern"],
      },
      layer4: {
        id: crypto.randomUUID(),
        status: "SUSPICIOUS",
        confidence: 0.88,
        riskLevel: "HIGH",
        reasons: ["Tên miền mạo danh"],
      },
    },
  };

  const input = {
    type: "url",
    content: "https://sinhvien-portal-fake.edu.vn/login",
  };

  const principalA = {
    subjectId: `user:${USER_A}`,
    principalType: "STUDENT",
  };

  const result = await TrustPersistenceService.recordTrustExecution({
    pipelineResult: mockPipeline,
    input,
    principal: principalA,
    requestId: "req-beta-proof-1",
    idempotencyKey: idemKey,
  });

  assert.equal(result.persisted, true, "Trust record must be durably persisted");
  assert.ok(result.caseId, "Case ID must be returned");
  assert.ok(result.runId, "Run ID must be returned");

  createdCaseIds.push(result.caseId);
  createdRunIds.push(result.runId);

  // Check in DB
  const caseRow = await pool.query("SELECT * FROM public.trust_cases WHERE id = $1", [result.caseId]);
  assert.equal(caseRow.rows.length, 1);
  assert.equal(caseRow.rows[0].owner_id, USER_A);

  const runRow = await pool.query("SELECT * FROM public.trust_runs WHERE id = $1", [result.runId]);
  assert.equal(runRow.rows.length, 1);
  assert.equal(runRow.rows[0].owner_id, USER_A);
  assert.equal(runRow.rows[0].idempotency_key, idemKey);

  const stageRows = await pool.query("SELECT * FROM public.trust_stage_runs WHERE run_id = $1", [result.runId]);
  assert.ok(stageRows.rows.length > 0, "Stage runs must be recorded");
  assert.equal(stageRows.rows[0].owner_id, USER_A);
});

test("Beta User Proof 2: Cross-Tenant Isolation & IDOR Defense (USER_B cannot read USER_A's records)", liveGate, async () => {
  const caseId = createdCaseIds[0];
  const runId = createdRunIds[0];

  // 1. USER_A reading own records under RLS
  const userARun = await asRole("authenticated", USER_A, "SELECT id, owner_id FROM public.trust_runs WHERE id = $1", [runId]);
  assert.equal(userARun.rowCount, 1, "USER_A must be able to read own trust_runs");

  const userACaseRev = await asRole("authenticated", USER_A, "SELECT id FROM public.trust_case_revisions WHERE case_id = $1", [caseId]);
  assert.equal(userACaseRev.rowCount, 1, "USER_A must be able to read own case revisions");

  const userAStages = await asRole("authenticated", USER_A, "SELECT id FROM public.trust_stage_runs WHERE run_id = $1", [runId]);
  assert.ok(userAStages.rowCount > 0, "USER_A must be able to read own stage runs");

  // 2. USER_B attempting to read USER_A's records under RLS (IDOR attempt)
  const userBRun = await asRole("authenticated", USER_B, "SELECT id FROM public.trust_runs WHERE id = $1", [runId]);
  assert.equal(userBRun.rowCount, 0, "USER_B must receive 0 rows for USER_A's trust_runs (RLS denied)");

  const userBCaseRev = await asRole("authenticated", USER_B, "SELECT id FROM public.trust_case_revisions WHERE case_id = $1", [caseId]);
  assert.equal(userBCaseRev.rowCount, 0, "USER_B must receive 0 rows for USER_A's case revisions (RLS denied)");

  const userBStages = await asRole("authenticated", USER_B, "SELECT id FROM public.trust_stage_runs WHERE run_id = $1", [runId]);
  assert.equal(userBStages.rowCount, 0, "USER_B must receive 0 rows for USER_A's stage runs (RLS denied)");
});

test("Beta User Proof 3: Idempotency Replay Verification (Same payload returns identical result, differing payload conflicts)", liveGate, async () => {
  const sharedKey = `idem-replay-${Date.now()}`;
  const inputA = { type: "url", content: "https://daihoc-online.edu.vn/tra-cuu" };

  const mockPipelineA = {
    verificationId: crypto.randomUUID(),
    contractVersion: "trust.v5",
    pipelineVersion: "trust.v5",
    state: "SAFE",
    decision: { verdict: "NO_KNOWN_THREAT", confidence: 0.95 },
    stages: {
      l1: {
        operationStatus: "COMPLETED",
        finding: "Safe domain check",
        summary: "No known threats identified",
      },
    },
    layers: {
      layer1: { id: crypto.randomUUID(), status: "PASS", confidence: 0.95 },
    },
  };

  const principalA = { subjectId: `user:${USER_A}`, principalType: "STUDENT" };

  // First call
  const firstResult = await TrustPersistenceService.recordTrustExecution({
    pipelineResult: mockPipelineA,
    input: inputA,
    principal: principalA,
    requestId: "req-idem-1",
    idempotencyKey: sharedKey,
  });

  assert.equal(firstResult.persisted, true);
  createdCaseIds.push(firstResult.caseId);
  createdRunIds.push(firstResult.runId);

  // 1. Replay with identical payload + identical key
  const replayResult = await TrustPersistenceService.recordTrustExecution({
    pipelineResult: mockPipelineA,
    input: inputA,
    principal: principalA,
    requestId: "req-idem-2-replay",
    idempotencyKey: sharedKey,
  });

  assert.equal(replayResult.persisted, true, "Replayed call returns success");
  assert.equal(replayResult.idempotent, true, "Idempotent flag must be true");
  assert.equal(replayResult.runId, firstResult.runId, "Must return identical existing run ID");
  assert.equal(replayResult.caseId, firstResult.caseId, "Must return identical existing case ID");

  // Verify DB count: strictly 1 row in trust_runs for this key
  const runRows = await pool.query(
    "SELECT id FROM public.trust_runs WHERE owner_id = $1 AND idempotency_key = $2",
    [USER_A, sharedKey]
  );
  assert.equal(runRows.rows.length, 1, "Row count must remain exactly 1 after replay");

  // 2. Call with differing payload + SAME idempotency key -> Must throw 409 conflict
  const conflictingInput = { type: "url", content: "https://completely-different-target.com" };

  await assert.rejects(
    async () => {
      await TrustPersistenceService.recordTrustExecution({
        pipelineResult: mockPipelineA,
        input: conflictingInput,
        principal: principalA,
        requestId: "req-idem-3-conflict",
        idempotencyKey: sharedKey,
      });
    },
    (err) => {
      assert.equal(err.code, "TRUST_IDEMPOTENCY_CONFLICT", "Error code must be TRUST_IDEMPOTENCY_CONFLICT");
      assert.equal(err.statusCode, 409, "Status code must be 409");
      return true;
    },
    "Conflicting payload with same idempotency key must raise 409 conflict"
  );
});

test("Beta User Proof 4: Durable Report Jobs Isolation & Idempotency", liveGate, async () => {
  const caseId = createdCaseIds[0];
  const reportKey = `rep-idem-${Date.now()}`;

  // 1. USER_A creates report with idempotency key
  const { report: reportA } = await ReportService.createTrustCaseReport({
    ownerId: USER_A,
    caseId,
    requestedRevision: 1,
    idempotencyKey: reportKey,
  });

  assert.ok(reportA?.reportId, "Report must be generated");
  createdReportIds.push(reportA.reportId);

  // 2. Idempotent replay: same owner + same key + same case -> identical report returned
  const { report: reportReplay } = await ReportService.createTrustCaseReport({
    ownerId: USER_A,
    caseId,
    requestedRevision: 1,
    idempotencyKey: reportKey,
  });

  assert.equal(reportReplay.reportId, reportA.reportId, "Replay returns identical existing report ID");

  // 3. Cross-Tenant Isolation on Report Retrieval
  // USER_B cannot get USER_A's report via ReportService
  const userBReport = await ReportService.getReportForOwner({
    ownerId: USER_B,
    reportId: reportA.reportId,
  });
  assert.equal(userBReport, null, "USER_B querying USER_A's report must return null");

  // Proving defense-in-depth: 'authenticated' role is blocked from direct access to private schema
  await assert.rejects(
    async () => {
      await asRole("authenticated", USER_B, "SELECT id FROM private.report_jobs WHERE id = $1", [reportA.reportId]);
    },
    /permission denied for schema private/,
    "Direct query to private schema by authenticated role must be denied"
  );
});
