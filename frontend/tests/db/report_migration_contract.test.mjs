import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const sql = readFileSync(join(repositoryRoot, "database", "migrations", "202609060004_reports.sql"), "utf8");
const service = readFileSync(join(repositoryRoot, "frontend", "src", "lib", "server", "reports", "ReportService.js"), "utf8");
const collectionRoute = readFileSync(join(repositoryRoot, "frontend", "src", "app", "api", "v1", "reports", "route.js"), "utf8");
const itemRoute = readFileSync(join(repositoryRoot, "frontend", "src", "app", "api", "v1", "reports", "[reportId]", "route.js"), "utf8");

test("report vertical slice pins immutable Trust snapshots and keeps artifacts private", () => {
  for (const table of ["report_jobs", "report_artifacts", "report_job_events"]) {
    assert.match(sql, new RegExp(`create table if not exists private\\.${table}\\b`, "i"));
  }
  assert.match(sql, /snapshot_revision integer not null check \(snapshot_revision > 0\)/i);
  assert.match(sql, /artifact_hash bytea not null check \(octet_length\(artifact_hash\) = 32\)/i);
  assert.match(sql, /unique index if not exists report_jobs_owner_idempotency_idx/i);
  assert.match(sql, /alter table private\.report_jobs enable row level security/i);
  assert.match(sql, /revoke all on private\.report_jobs, private\.report_artifacts, private\.report_job_events from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update on private\.report_jobs to service_role/i);
  assert.doesNotMatch(sql, /report_job_events_sequence_seq/i);

  assert.match(service, /REPORT_TEMPLATE_VERSION = "trust-case\.report\.v1"/);
  assert.match(service, /REPORT_IDEMPOTENCY_CONFLICT/);
  assert.match(service, /snapshotTrustCase/);
  assert.match(service, /inputHashes/);
  assert.match(service, /artifactHash/);
  assert.match(collectionRoute, /requiredPermission: "TRUST\.READ"/);
  assert.match(collectionRoute, /allowAnonymous: false/);
  assert.match(itemRoute, /getReportForOwner/);
  assert.match(itemRoute, /REPORT_NOT_FOUND/);
});
