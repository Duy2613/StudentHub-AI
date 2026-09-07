begin;

-- Reports are immutable, revision-pinned artifacts.  The job row is metadata
-- and lifecycle; the document itself stays in the private schema so the
-- browser can only receive it after the API has checked the owner's scope.
create schema if not exists private;

create table if not exists private.report_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('TRUST_CASE','EXPERT_QUALIFICATION','COMMUNITY_CASE','AI_EVALUATION','OPS_LABBE')),
  subject_type text not null check (subject_type in ('TRUST_CASE','EXPERT_APPLICATION','COMMUNITY_CASE','EVALUATION_RUN','OPS_SNAPSHOT')),
  subject_id uuid not null,
  snapshot_revision integer not null check (snapshot_revision > 0),
  status text not null check (status in ('REQUESTED','SNAPSHOTTING','GENERATING','VALIDATING','READY','PARTIAL','FAILED','SUPERSEDED','REVOKED')),
  template_version text not null check (char_length(template_version) between 1 and 120),
  policy_version text,
  request_fingerprint bytea not null check (octet_length(request_fingerprint) = 32),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 160),
  artifact_hash bytea check (artifact_hash is null or octet_length(artifact_hash) = 32),
  failure_code text check (failure_code is null or char_length(failure_code) between 1 and 120),
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists report_jobs_owner_idempotency_idx
  on private.report_jobs(owner_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists report_jobs_owner_created_idx
  on private.report_jobs(owner_id, created_at desc);
create index if not exists report_jobs_subject_created_idx
  on private.report_jobs(subject_type, subject_id, created_at desc);

create table if not exists private.report_artifacts (
  report_id uuid primary key references private.report_jobs(id) on delete cascade,
  snapshot_revision integer not null check (snapshot_revision > 0),
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  artifact_hash bytea not null check (octet_length(artifact_hash) = 32),
  created_at timestamptz not null default now()
);

create table if not exists private.report_job_events (
  report_id uuid not null references private.report_jobs(id) on delete cascade,
  sequence integer not null check (sequence > 0),
  from_status text,
  to_status text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now(),
  primary key (report_id, sequence)
);
create index if not exists report_job_events_report_idx
  on private.report_job_events(report_id, sequence);

alter table private.report_jobs enable row level security;
alter table private.report_artifacts enable row level security;
alter table private.report_job_events enable row level security;

revoke all on private.report_jobs, private.report_artifacts, private.report_job_events from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update on private.report_jobs to service_role;
grant select, insert on private.report_artifacts, private.report_job_events to service_role;

commit;
