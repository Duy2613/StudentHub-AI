import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const sql = readFileSync(join(root, "database", "migrations", "202609090001_community_expert_promax.sql"), "utf8");

test("Promax migration has one durable Community/Expert authority with the required state dimensions", () => {
  for (const table of ["community_contributions", "community_contribution_revisions", "community_reactions", "community_source_clusters", "case_appeals", "case_corrections"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}\\b`, "i"));
  }
  for (const table of ["community_quality_events", "community_reaction_events", "community_file_objects", "expert_assignments", "expert_practice_submissions", "expert_practice_decisions", "case_appeal_reviews", "expert_quality_events", "expert_review_decisions"]) {
    assert.match(sql, new RegExp(`create table if not exists private\\.${table}\\b`, "i"));
  }
  for (const state of ["PRIVACY_SCAN_PENDING", "PREVIEW_READY", "CONTRADICTORY", "NEEDS_THIRD_REVIEW", "PRACTICE_REVIEW", "BLOCKED"]) assert.match(sql, new RegExp(state));
  assert.match(sql, /unique\(author_id, idempotency_key\)/i);
  assert.match(sql, /unique\(user_id, contribution_id, kind\)/i);
  assert.match(sql, /unique\(user_id, domain_code, idempotency_key\)/i);
  assert.match(sql, /unique\(requester_id, idempotency_key\)/i);
  assert.match(sql, /case_corrections_idempotency_idx/i);
  assert.match(sql, /alter table public\.expert_assessments add column if not exists assignment_id/i);
  assert.match(sql, /evidence_revision_ids jsonb/i);
  assert.match(sql, /incident_cluster_id text/i);
  assert.match(sql, /coi_declared boolean/i);
  assert.match(sql, /original_object_key text/i);
  assert.match(sql, /public_derivative_object_key text/i);
  assert.match(sql, /alter table public\.expert_assessments enable row level security/i);
  assert.match(sql, /revoke all on public\.expert_assessments from public, anon, authenticated/i);
  assert.match(sql, /evidence_revision_ids jsonb not null default '\[\]'::jsonb/i);
  assert.match(sql, /revoke all on private\.community_reaction_events, private\.community_file_objects, private\.expert_assignments, private\.expert_quality_events/i);
  assert.match(sql, /unique\(application_id, domain_code\)/i);
  assert.match(sql, /expert_assignment_idempotency_idx/i);
});

test("Promax migration preserves history and expands the existing internal outbox", () => {
  assert.match(sql, /append-only/i);
  assert.match(sql, /integration_outbox_integration_check/);
  assert.match(sql, /integration in \('LABBE','INTERNAL'\)/i);
  assert.match(sql, /previousRevisionsImmutable|no prior assessment/i);
  assert.match(sql, /expert_review_decisions_no_update/i);
  assert.match(sql, /expert_practice_decisions_no_update/i);
  assert.match(sql, /case_appeal_reviews_no_update/i);
  assert.match(sql, /expert_qualification_reviews_decision_check/i);
  assert.match(sql, /expert_qualification_reviews_no_update/i);
});
