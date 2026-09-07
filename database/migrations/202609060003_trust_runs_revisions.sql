begin;

-- A Trust case is the durable subject.  A run is one execution, stage runs are
-- its bounded observations, and revisions keep the case/verdict history
-- append-only for replay, audit, and realtime consumers.
create table if not exists public.trust_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id text check (request_id is null or char_length(request_id) between 1 and 160),
  idempotency_key text,
  input_fingerprint bytea check (input_fingerprint is null or octet_length(input_fingerprint) = 32),
  status text not null check (status in ('RUNNING','QUEUED','FOLLOWING','COMPLETED','PARTIAL','FAILED','CANCELLED')),
  pipeline_version text not null check (char_length(pipeline_version) between 1 and 120),
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(case_id, id)
);
alter table public.trust_runs add column if not exists idempotency_key text;
alter table public.trust_runs drop constraint if exists trust_runs_idempotency_key_length;
alter table public.trust_runs add constraint trust_runs_idempotency_key_length
  check (idempotency_key is null or char_length(idempotency_key) between 1 and 160);
create unique index if not exists trust_runs_owner_idempotency_idx
  on public.trust_runs(owner_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists trust_runs_owner_created_idx on public.trust_runs(owner_id, created_at desc);
create index if not exists trust_runs_case_created_idx on public.trust_runs(case_id, created_at desc);

create table if not exists public.trust_stage_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.trust_runs(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  stage_id text not null check (stage_id in ('l1','l2a','l2b','l2c','l3','l4','l5')),
  stage_index integer not null check (stage_index between 0 and 6),
  status text not null check (status in ('NOT_STARTED','IDLE','VALIDATING','QUEUED','RUNNING','FOLLOWING','INSPECTING','DEGRADED','RECONNECTING','COMPLETED','CANCEL_REQUESTED','CANCELLED','FAILED','PARTIAL','BLOCKED')),
  attempt integer not null default 1 check (attempt > 0),
  request_id text check (request_id is null or char_length(request_id) between 1 and 160),
  started_at timestamptz,
  completed_at timestamptz,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  result_digest bytea check (result_digest is null or octet_length(result_digest) = 32),
  summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object'),
  created_at timestamptz not null default now(),
  unique(run_id, stage_id, attempt)
);
create index if not exists trust_stage_runs_owner_created_idx on public.trust_stage_runs(owner_id, created_at desc);
create index if not exists trust_stage_runs_run_index_idx on public.trust_stage_runs(run_id, stage_index, attempt);

create table if not exists public.trust_case_revisions (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  run_id uuid not null references public.trust_runs(id) on delete restrict,
  state text not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz not null default now(),
  unique(case_id, revision)
);
create index if not exists trust_case_revisions_owner_idx on public.trust_case_revisions(owner_id, case_id, revision desc);

create table if not exists public.trust_verdict_revisions (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  run_id uuid not null references public.trust_runs(id) on delete restrict,
  verdict jsonb not null check (jsonb_typeof(verdict) = 'object'),
  decision_digest bytea check (decision_digest is null or octet_length(decision_digest) = 32),
  created_at timestamptz not null default now(),
  unique(case_id, revision)
);
create index if not exists trust_verdict_revisions_owner_idx on public.trust_verdict_revisions(owner_id, case_id, revision desc);

alter table public.trust_runs enable row level security;
alter table public.trust_stage_runs enable row level security;
alter table public.trust_case_revisions enable row level security;
alter table public.trust_verdict_revisions enable row level security;

drop policy if exists trust_runs_own_select on public.trust_runs;
create policy trust_runs_own_select on public.trust_runs for select using (auth.uid() = owner_id);
drop policy if exists trust_stage_runs_own_select on public.trust_stage_runs;
create policy trust_stage_runs_own_select on public.trust_stage_runs for select using (auth.uid() = owner_id);
drop policy if exists trust_case_revisions_own_select on public.trust_case_revisions;
create policy trust_case_revisions_own_select on public.trust_case_revisions for select using (auth.uid() = owner_id);
drop policy if exists trust_verdict_revisions_own_select on public.trust_verdict_revisions;
create policy trust_verdict_revisions_own_select on public.trust_verdict_revisions for select using (auth.uid() = owner_id);

revoke all on public.trust_runs, public.trust_stage_runs,
  public.trust_case_revisions, public.trust_verdict_revisions from public, anon, authenticated;
grant select on public.trust_runs, public.trust_stage_runs,
  public.trust_case_revisions, public.trust_verdict_revisions to authenticated;
grant select, insert, update on public.trust_runs, public.trust_stage_runs to service_role;
grant select, insert on public.trust_case_revisions, public.trust_verdict_revisions to service_role;
grant usage, select on sequence public.trust_case_revisions_id_seq to service_role;
grant usage, select on sequence public.trust_verdict_revisions_id_seq to service_role;

commit;
