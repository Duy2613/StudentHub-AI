import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";
import { ReportService } from "../../src/lib/server/reports/ReportService.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { configureDisposableDatabase, disposableLiveGate } from "../helpers/disposableDbGuard.mjs";

const disposableDatabaseUrl = configureDisposableDatabase();
const liveUrl = disposableDatabaseUrl;
const liveGate = disposableLiveGate();
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const reportsMigration = readFileSync(join(repositoryRoot, "database", "migrations", "202609060004_reports.sql"), "utf8");

after(async () => {
  if (disposableDatabaseUrl) await getPostgresPool().end();
});

test("PHASE 2 REPORT LIVE GATE: committed Trust snapshot, hash, ownership, and idempotency", liveGate, async (t) => {
  const pool = getPostgresPool();
  await pool.query(reportsMigration);
  const users = await pool.query("select id from auth.users order by created_at limit 2");
  if (users.rows.length < 2) {
    t.skip("At least two auth users are required for the ownership proof");
    return;
  }

  const ownerId = users.rows[0].id;
  const otherOwnerId = users.rows[1].id;
  const caseId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const idempotencyKey = `report-live-${crypto.randomUUID()}`;
  let reportId;
  try {
    await pool.query(
      "insert into public.trust_cases(id,owner_id,state,visibility) values($1,$2,'SUSPICIOUS','PRIVATE')",
      [caseId, ownerId]
    );
    await pool.query(
      "insert into public.trust_runs(id,case_id,owner_id,status,pipeline_version,started_at,completed_at) values($1,$2,$3,'COMPLETED','trust.v5',now(),now())",
      [runId, caseId, ownerId]
    );
    await pool.query(
      "insert into public.case_inputs(case_id,input_type,content_hash) values($1,'URL',decode(repeat('ab',32),'hex'))",
      [caseId]
    );
    await pool.query(
      "insert into public.trust_case_revisions(case_id,owner_id,revision,run_id,state,snapshot) values($1,$2,1,$3,'SUSPICIOUS',$4::jsonb)",
      [caseId, ownerId, runId, JSON.stringify({ source: "report-live-gate" })]
    );
    await pool.query(
      "insert into public.trust_verdict_revisions(case_id,owner_id,revision,run_id,verdict) values($1,$2,1,$3,$4::jsonb)",
      [caseId, ownerId, runId, JSON.stringify({ security: "SUSPICIOUS", truth: "INSUFFICIENT_EVIDENCE", action: "REVIEW" })]
    );

    const first = await ReportService.createTrustCaseReport({ ownerId, caseId, requestedRevision: 1, idempotencyKey });
    reportId = first.report.reportId;
    assert.equal(first.idempotent, false);
    assert.equal(first.report.status, "READY");
    assert.equal(first.report.snapshotRevision, 1);
    assert.match(first.report.artifactHash, /^[0-9a-f]{64}$/);
    assert.equal(first.report.document.schemaVersion, "trust.case.report.v1");
    assert.deepEqual(first.report.document.inputHashes, ["ab".repeat(32)]);

    const replay = await ReportService.createTrustCaseReport({ ownerId, caseId, requestedRevision: 1, idempotencyKey });
    assert.equal(replay.idempotent, true);
    assert.equal(replay.report.reportId, reportId);
    assert.equal((await ReportService.getReportForOwner({ ownerId, reportId })).reportId, reportId);
    assert.equal(await ReportService.getReportForOwner({ ownerId: otherOwnerId, reportId }), null);
    assert.equal((await ReportService.listReportsForOwner({ ownerId, caseId })).length, 1);
    await assert.rejects(
      ReportService.createTrustCaseReport({ ownerId, caseId, requestedRevision: null, idempotencyKey }),
      (error) => error?.code === "REPORT_IDEMPOTENCY_CONFLICT"
    );
  } finally {
    if (reportId) await pool.query("delete from private.report_jobs where id=$1", [reportId]);
    await pool.query("delete from public.trust_cases where id=$1", [caseId]);
  }
});
