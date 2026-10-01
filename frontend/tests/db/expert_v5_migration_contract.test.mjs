import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../../../database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql", import.meta.url), "utf8");
const hardeningMigration = await readFile(new URL("../../../database/migrations/20260929135553_expert_v5_trigger_path_and_fk_indexes.sql", import.meta.url), "utf8");
const groundedQuestionMigration = await readFile(new URL("../../../database/migrations/202610010004_grounded_multimodal_question_bank.sql", import.meta.url), "utf8");

test("Expert V5 migration defines source, question, mission and room persistence without fake seed content", () => {
  for (const table of [
    "expert_v5_source_registry", "expert_v5_source_snapshots", "expert_v5_questions",
    "expert_v5_source_events", "expert_v5_ingestion_requests",
    "expert_daily_missions", "expert_mission_attempts", "expert_mission_answers",
    "expert_verification_rooms", "expert_room_participants", "expert_room_rounds",
    "expert_room_answers", "expert_room_evidence_packages", "expert_room_adjudications",
  ]) assert.match(migration, new RegExp(`create table if not exists private\\.${table}\\b`, "i"));
  assert.doesNotMatch(migration, /insert\s+into\s+private\.expert_v5_(?:source_registry|source_snapshots|questions)/i);
});

test("Expert V5 storage uses private RLS and reuses the existing reputation ledger", () => {
  assert.match(migration, /alter table if exists private\.reputation_events\s+add column if not exists context jsonb/i);
  assert.match(migration, /room_daily_reputation_cap/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on private\.%I from public, anon, authenticated/i);
  assert.match(migration, /expert_v5_reject_immutable_mutation/i);
  assert.match(migration, /expert_v5_source_event_immutable/i);
  for (const eventType of ["INGEST_SUCCEEDED", "INGEST_BLOCKED", "INGEST_UNAVAILABLE"]) {
    assert.match(migration, new RegExp(`'${eventType}'`));
  }
  assert.match(migration, /fetch_policy text not null default 'TRUST_PUBLIC_RETRIEVAL'/i);
});

test("V5 daily mission question and timer rules are persisted and server configurable", () => {
  assert.match(migration, /unique\(user_id, mission_date, mission_type, domain_code\)/i);
  assert.match(migration, /mission_attempt_seconds/);
  assert.match(migration, /room_answer_seconds/);
  assert.match(migration, /question_validity_days/);
  assert.match(migration, /content_hash text[\s\S]*retrieval_status/i);
});

test("V5 staging advisor hardening pins trigger search path and covers reported foreign keys", () => {
  assert.match(hardeningMigration, /set search_path\s*=\s*pg_catalog/i);
  assert.match(hardeningMigration, /expert_v5_config_updated_by_idx/);
  assert.match(hardeningMigration, /expert_room_answers_expert_idx/);
  assert.match(hardeningMigration, /expert_room_adjudications_host_ack_idx/);
});

test("grounded Question Bank stores provenance by referencing canonical Trust data and the existing URL snapshot", () => {
  for (const table of [
    "expert_v5_scenarios", "expert_v5_scenario_intakes", "expert_v5_scenario_inputs",
    "expert_v5_scenario_claims", "expert_v5_scenario_evidence", "expert_v5_question_generation_runs",
  ]) assert.match(groundedQuestionMigration, new RegExp(`create table if not exists private\\.${table}\\b`, "i"));
  assert.match(groundedQuestionMigration, /trust_case_id uuid not null references public\.trust_cases\(id\)/i);
  assert.match(groundedQuestionMigration, /claim_id uuid not null references public\.claims\(id\)/i);
  assert.match(groundedQuestionMigration, /evidence_id uuid not null references public\.evidence\(id\)/i);
  assert.match(groundedQuestionMigration, /source_snapshot_id uuid references private\.expert_v5_source_snapshots\(id\)/i);
  assert.match(groundedQuestionMigration, /expert_v5_scenario_is_current\(p_scenario_id uuid\)/i);
  assert.match(groundedQuestionMigration, /latest_source\.retrieval_status is distinct from 'SUCCESS'/i);
  assert.match(groundedQuestionMigration, /snapshot\.content_hash is distinct from latest_source\.content_hash/i);
  assert.match(groundedQuestionMigration, /alter column source_snapshot_id drop not null/i);
  assert.match(groundedQuestionMigration, /check \(source_snapshot_id is not null or scenario_id is not null\)/i);
  assert.doesNotMatch(groundedQuestionMigration, /insert\s+into\s+private\.expert_v5_(?:scenarios|scenario_inputs|questions)/i);
  assert.doesNotMatch(groundedQuestionMigration, /(?:repair|stamp|update)\s+(?:table\s+)?(?:supabase_migrations|schema_migrations)/i);
});

test("grounded Question Bank bounds Gemini runs and protects scenario, answer and provenance tables", () => {
  for (const modality of ["TEXT", "URL", "IMAGE", "QR", "TEXT_URL", "TEXT_IMAGE", "IMAGE_URL", "QR_URL", "TEXT_URL_IMAGE"]) {
    assert.match(groundedQuestionMigration, new RegExp(`'${modality}'`));
  }
  for (const type of [
    "TRUE_FALSE", "MULTIPLE_CHOICE", "MULTI_SELECT", "BEST_EVIDENCE", "SOURCE_RANKING",
    "CLAIM_CLASSIFICATION", "CLAIM_EXTRACTION", "MISSING_CONTEXT", "CONTRADICTION", "TIMELINE",
    "ENTITY_RESOLUTION", "NUMERICAL_REASONING", "SOURCE_AUTHORITY", "IMAGE_CONTEXT", "QR_SAFETY",
    "URL_REDIRECT", "EVIDENCE_MATCHING", "FINAL_VERDICT",
  ]) assert.match(groundedQuestionMigration, new RegExp(`'${type}'`));
  assert.match(groundedQuestionMigration, /batch_size between 1 and 5/i);
  assert.match(groundedQuestionMigration, /max_calls between 1 and 15/i);
  assert.match(groundedQuestionMigration, /retry_limit between 0 and 1/i);
  assert.match(groundedQuestionMigration, /timeout_ms between 1000 and 60000/i);
  assert.match(groundedQuestionMigration, /alter table private\.%I enable row level security/i);
  assert.match(groundedQuestionMigration, /grant select, insert, update, delete on private\.%I to service_role/i);
});
