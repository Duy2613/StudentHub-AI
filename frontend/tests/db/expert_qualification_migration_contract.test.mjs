import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const sql = readFileSync(join(repositoryRoot, "database", "migrations", "202609060001_expert_qualification.sql"), "utf8");
const outboxSql = readFileSync(join(repositoryRoot, "database", "migrations", "202609060002_integration_outbox.sql"), "utf8");
const trustRevisionSql = readFileSync(join(repositoryRoot, "database", "migrations", "202609060003_trust_runs_revisions.sql"), "utf8");

test("expert qualification migration keeps the workflow server-owned", () => {
  for (const table of ["expert_applications", "expert_quiz_attempts", "expert_quiz_answers"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}\\b`, "i"));
  }
  assert.match(sql, /private\.expert_qualification_reviews/);
  assert.match(sql, /alter table public\.expert_applications enable row level security/i);
  assert.match(sql, /auth\.uid\(\) = user_id/i);
  assert.match(sql, /grant select, insert, update on public\.expert_applications,\s*public\.expert_quiz_attempts,\s*public\.expert_quiz_answers to service_role/i);
  assert.match(sql, /decision in \('APPROVE_QUIZ','ACTIVATE','REJECT','APPEAL_REVIEW'\)/i);
});

test("Labbe hand-off is durable, leased, and retriable", () => {
  assert.match(outboxSql, /private\.integration_outbox/);
  assert.match(outboxSql, /status in \('PENDING','IN_FLIGHT','DELIVERED','FAILED','SHADOW','CONFLICT'\)/i);
  assert.match(outboxSql, /payload_hash bytea/i);
  assert.match(outboxSql, /lease_token uuid/i);
  assert.match(outboxSql, /lease_count integer/i);
  assert.match(outboxSql, /shadow_count integer/i);
  assert.match(outboxSql, /revoke all on private\.integration_outbox from public, anon, authenticated/i);
});

test("Trust persistence separates case, run, stage run, and immutable revisions", () => {
  for (const table of ["trust_runs", "trust_stage_runs", "trust_case_revisions", "trust_verdict_revisions"]) {
    assert.match(trustRevisionSql, new RegExp(`create table if not exists public\\.${table}\\b`, "i"));
  }
  assert.match(trustRevisionSql, /idempotency_key/i);
  assert.match(trustRevisionSql, /trust_runs_owner_idempotency_idx/i);
  assert.match(trustRevisionSql, /unique\(case_id, revision\)/i);
  assert.match(trustRevisionSql, /for select using \(auth\.uid\(\) = owner_id\)/i);
  assert.match(trustRevisionSql, /revoke all on public\.trust_runs, public\.trust_stage_runs/i);
  assert.match(trustRevisionSql, /grant select, insert on public\.trust_case_revisions, public\.trust_verdict_revisions to service_role/i);
});
