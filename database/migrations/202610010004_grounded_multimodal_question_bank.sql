-- Grounded multimodal Question Bank extension.
-- Reuses canonical Trust cases/claims/evidence and the existing Expert V5 URL snapshots.
-- No question, source, claim, or evidence seed content is fabricated here.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table private.expert_v5_source_snapshots
  add column if not exists trust_case_id uuid references public.trust_cases(id) on delete restrict;
create index if not exists expert_v5_source_snapshots_trust_case_idx
  on private.expert_v5_source_snapshots(trust_case_id) where trust_case_id is not null;

create table if not exists private.expert_v5_scenarios (
  scenario_id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 240),
  domain_code text not null check (char_length(domain_code) between 2 and 80),
  modality text not null check (modality in (
    'TEXT','URL','IMAGE','QR','TEXT_URL','TEXT_IMAGE','IMAGE_URL','QR_URL','TEXT_URL_IMAGE'
  )),
  status text not null default 'READY' check (status in ('READY','STALE','REVIEW_REQUIRED','INACTIVE')),
  input_fingerprint text not null check (input_fingerprint ~ '^[a-fA-F0-9]{64}$'),
  input_language text not null default 'MIXED' check (input_language in ('VI','EN','MIXED','UNKNOWN')),
  expected_skills jsonb not null default '[]'::jsonb check (jsonb_typeof(expected_skills) = 'array'),
  difficulty_potential text[] not null default array['EASY','MEDIUM','HARD']::text[],
  limitations jsonb not null default '[]'::jsonb check (jsonb_typeof(limitations) = 'array'),
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pg_column_size(expected_skills) <= 8192 and pg_column_size(limitations) <= 8192),
  check (cardinality(difficulty_potential) between 1 and 3)
);
create index if not exists expert_v5_scenarios_domain_modality_idx
  on private.expert_v5_scenarios(domain_code, modality, created_at desc);
create index if not exists expert_v5_scenarios_fingerprint_idx
  on private.expert_v5_scenarios(input_fingerprint);

create table if not exists private.expert_v5_scenario_intakes (
  idempotency_key text primary key check (char_length(idempotency_key) between 1 and 180),
  actor_id uuid not null references auth.users(id) on delete restrict,
  input_fingerprint text not null check (input_fingerprint ~ '^[a-fA-F0-9]{64}$'),
  state text not null default 'PROCESSING' check (state in ('PROCESSING','COMPLETED','FAILED')),
  lease_expires_at timestamptz not null,
  scenario_id uuid references private.expert_v5_scenarios(scenario_id) on delete restrict,
  error_code text check (error_code is null or error_code ~ '^[A-Z0-9_:-]{1,100}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((state = 'COMPLETED' and scenario_id is not null) or state <> 'COMPLETED')
);
create index if not exists expert_v5_scenario_intakes_actor_idx
  on private.expert_v5_scenario_intakes(actor_id, created_at desc);
create index if not exists expert_v5_scenario_intakes_lease_idx
  on private.expert_v5_scenario_intakes(state, lease_expires_at);

create table if not exists private.expert_v5_scenario_inputs (
  scenario_id uuid not null references private.expert_v5_scenarios(scenario_id) on delete restrict,
  input_index smallint not null check (input_index between 0 and 4),
  input_type text not null check (input_type in ('TEXT','URL','IMAGE','QR')),
  trust_case_id uuid not null references public.trust_cases(id) on delete restrict,
  case_revision integer not null check (case_revision > 0),
  source_snapshot_id uuid references private.expert_v5_source_snapshots(id) on delete restrict,
  media_artifact_id text check (media_artifact_id is null or media_artifact_id ~ '^art_[0-9a-fA-F-]{36}$'),
  media_sha256 text check (media_sha256 is null or media_sha256 ~ '^[a-fA-F0-9]{64}$'),
  input_fingerprint text not null check (input_fingerprint ~ '^[a-fA-F0-9]{64}$'),
  canonical_url text check (canonical_url is null or (char_length(canonical_url) between 9 and 2048 and canonical_url ~ '^https://')),
  retrieved_at timestamptz not null default now(),
  published_at timestamptz,
  primary key (scenario_id, input_index),
  unique (scenario_id, trust_case_id),
  check ((media_artifact_id is null) = (media_sha256 is null)),
  check ((input_type = 'URL' and source_snapshot_id is not null and canonical_url is not null)
      or input_type <> 'URL')
);
create index if not exists expert_v5_scenario_inputs_case_idx
  on private.expert_v5_scenario_inputs(trust_case_id, case_revision);
create index if not exists expert_v5_scenario_inputs_snapshot_idx
  on private.expert_v5_scenario_inputs(source_snapshot_id) where source_snapshot_id is not null;

create table if not exists private.expert_v5_scenario_claims (
  scenario_id uuid not null,
  input_index smallint not null,
  claim_id uuid not null references public.claims(id) on delete restrict,
  primary key (scenario_id, input_index, claim_id),
  foreign key (scenario_id, input_index)
    references private.expert_v5_scenario_inputs(scenario_id, input_index) on delete restrict
);
create index if not exists expert_v5_scenario_claims_claim_idx
  on private.expert_v5_scenario_claims(claim_id);

create table if not exists private.expert_v5_scenario_evidence (
  scenario_id uuid not null,
  input_index smallint not null,
  evidence_id uuid not null references public.evidence(id) on delete restrict,
  primary key (scenario_id, input_index, evidence_id),
  foreign key (scenario_id, input_index)
    references private.expert_v5_scenario_inputs(scenario_id, input_index) on delete restrict
);
create index if not exists expert_v5_scenario_evidence_evidence_idx
  on private.expert_v5_scenario_evidence(evidence_id);

create table if not exists private.expert_v5_question_generation_runs (
  generation_run_id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references private.expert_v5_scenarios(scenario_id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  state text not null default 'RESERVED' check (state in ('RESERVED','RUNNING','COMPLETED','PARTIAL','FAILED')),
  batch_size smallint not null check (batch_size between 1 and 5),
  max_calls smallint not null check (max_calls between 1 and 15),
  calls_made smallint not null default 0 check (calls_made between 0 and max_calls),
  retry_limit smallint not null default 0 check (retry_limit between 0 and 1),
  timeout_ms integer not null check (timeout_ms between 1000 and 60000),
  prompt_template_version text not null check (char_length(prompt_template_version) between 1 and 80),
  provider text check (provider is null or provider in ('gemini')),
  model text check (model is null or char_length(model) <= 120),
  input_digest text not null check (input_digest ~ '^[a-fA-F0-9]{64}$'),
  output_digest text check (output_digest is null or output_digest ~ '^[a-fA-F0-9]{64}$'),
  generated_count integer not null default 0 check (generated_count >= 0),
  validated_count integer not null default 0 check (validated_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  rejection_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(rejection_summary) = 'object' and pg_column_size(rejection_summary) <= 8192),
  provider_attempt_count integer not null default 0 check (provider_attempt_count >= 0),
  latency_ms integer check (latency_ms is null or latency_ms between 0 and 600000),
  error_code text check (error_code is null or error_code ~ '^[A-Z0-9_:-]{1,100}$'),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (calls_made <= max_calls)
);
create index if not exists expert_v5_question_generation_runs_scenario_idx
  on private.expert_v5_question_generation_runs(scenario_id, created_at desc);
create index if not exists expert_v5_question_generation_runs_actor_idx
  on private.expert_v5_question_generation_runs(actor_id, created_at desc);

create or replace function private.expert_v5_scenario_is_current(p_scenario_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select exists (
    select 1
      from private.expert_v5_scenarios sc
     where sc.scenario_id = p_scenario_id
       and sc.status = 'READY'
       and sc.retrieved_at > pg_catalog.now() - pg_catalog.make_interval(days => coalesce((
         select (cfg.config_value #>> '{}')::integer
           from private.expert_v5_config cfg where cfg.config_key = 'question_validity_days'
       ), 30))
       and not exists (
         select 1 from private.expert_v5_scenario_inputs freshness
          where freshness.scenario_id = sc.scenario_id
            and freshness.retrieved_at <= pg_catalog.now() - pg_catalog.make_interval(days => coalesce((
              select (cfg.config_value #>> '{}')::integer
                from private.expert_v5_config cfg where cfg.config_key = 'question_validity_days'
            ), 30))
       )
       and not exists (
         select 1
           from private.expert_v5_scenario_inputs si
           join public.trust_cases tc on tc.id = si.trust_case_id
           left join lateral (
             select revision from public.trust_case_revisions
              where case_id = tc.id order by revision desc limit 1
           ) latest_case on true
           left join private.expert_v5_source_snapshots snapshot on snapshot.id = si.source_snapshot_id
           left join private.expert_v5_source_registry registry on registry.id = snapshot.source_id
           left join lateral (
             select current.content_hash, current.retrieval_status
               from private.expert_v5_source_snapshots current
              where current.source_id = snapshot.source_id
              order by current.retrieved_at desc limit 1
           ) latest_source on true
          where si.scenario_id = sc.scenario_id
            and (si.case_revision <> coalesce(latest_case.revision, 0)
              or (si.source_snapshot_id is not null and (
                snapshot.retrieval_status is distinct from 'SUCCESS'
                or registry.enabled is distinct from true
                or latest_source.retrieval_status is distinct from 'SUCCESS'
                or snapshot.content_hash is null
                or latest_source.content_hash is null
                or snapshot.content_hash is distinct from latest_source.content_hash
              )))
       )
  );
$$;
revoke all on function private.expert_v5_scenario_is_current(uuid) from public, anon, authenticated;
grant execute on function private.expert_v5_scenario_is_current(uuid) to service_role;

alter table private.expert_v5_questions alter column source_snapshot_id drop not null;
alter table private.expert_v5_questions
  add column if not exists scenario_id uuid references private.expert_v5_scenarios(scenario_id) on delete restrict,
  add column if not exists modality text check (modality is null or modality in (
    'TEXT','URL','IMAGE','QR','TEXT_URL','TEXT_IMAGE','IMAGE_URL','QR_URL','TEXT_URL_IMAGE'
  )),
  add column if not exists claim_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(claim_refs) = 'array'),
  add column if not exists rubric jsonb not null default '{}'::jsonb check (jsonb_typeof(rubric) = 'object'),
  add column if not exists skills jsonb not null default '[]'::jsonb check (jsonb_typeof(skills) = 'array'),
  add column if not exists limitations jsonb not null default '[]'::jsonb check (jsonb_typeof(limitations) = 'array'),
  add column if not exists generation_provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(generation_provenance) = 'object'),
  add column if not exists validation_status text not null default 'PENDING' check (validation_status in ('PENDING','AUTO_VALIDATED','REJECTED','REVIEW_REQUIRED')),
  add column if not exists normalized_prompt_hash text check (normalized_prompt_hash is null or normalized_prompt_hash ~ '^[a-fA-F0-9]{64}$'),
  add column if not exists source_claim_fingerprint text check (source_claim_fingerprint is null or source_claim_fingerprint ~ '^[a-fA-F0-9]{64}$'),
  add column if not exists semantic_fingerprint text check (semantic_fingerprint is null or semantic_fingerprint ~ '^[a-fA-F0-9]{64}$'),
  add column if not exists generation_run_id uuid references private.expert_v5_question_generation_runs(generation_run_id) on delete restrict;

alter table private.expert_v5_questions drop constraint if exists expert_v5_questions_question_type_check;
alter table private.expert_v5_questions add constraint expert_v5_questions_question_type_check check (question_type in (
  'SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE','MULTI_SELECT','BEST_EVIDENCE',
  'SOURCE_RANKING','CLAIM_CLASSIFICATION','CLAIM_EXTRACTION','MISSING_CONTEXT',
  'CONTRADICTION','TIMELINE','ENTITY_RESOLUTION','NUMERICAL_REASONING',
  'SOURCE_AUTHORITY','IMAGE_CONTEXT','QR_SAFETY','URL_REDIRECT','EVIDENCE_MATCHING','FINAL_VERDICT'
));
alter table private.expert_v5_questions add constraint expert_v5_questions_source_binding_check
  check (source_snapshot_id is not null or scenario_id is not null);
alter table private.expert_v5_questions add constraint expert_v5_questions_json_limits_check
  check (pg_column_size(claim_refs) <= 8192 and pg_column_size(rubric) <= 8192
     and pg_column_size(skills) <= 4096 and pg_column_size(limitations) <= 8192
     and pg_column_size(generation_provenance) <= 8192);
create index if not exists expert_v5_questions_scenario_status_idx
  on private.expert_v5_questions(scenario_id, status, question_version desc) where scenario_id is not null;
create index if not exists expert_v5_questions_generation_run_idx
  on private.expert_v5_questions(generation_run_id) where generation_run_id is not null;
create index if not exists expert_v5_questions_source_claim_prompt_dedup_idx
  on private.expert_v5_questions(source_claim_fingerprint, normalized_prompt_hash, question_type)
  where source_claim_fingerprint is not null and normalized_prompt_hash is not null and status <> 'RETIRED';

alter table private.expert_v5_question_events drop constraint if exists expert_v5_question_events_event_type_check;
alter table private.expert_v5_question_events add constraint expert_v5_question_events_event_type_check
  check (event_type in ('DRAFT_CREATED','ACTIVATED','REVALIDATION_REQUIRED','RETIRED','DRAFT_REJECTED','VERSION_CREATED'));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'expert_v5_scenarios','expert_v5_scenario_intakes','expert_v5_scenario_inputs',
    'expert_v5_scenario_claims','expert_v5_scenario_evidence','expert_v5_question_generation_runs'
  ] loop
    execute format('alter table private.%I enable row level security', table_name);
    execute format('revoke all on private.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on private.%I to service_role', table_name);
  end loop;
end
$$;
commit;
