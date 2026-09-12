begin;

-- Community Max is additive.  The preceding Community Promax migration owns
-- contributions, immutable revisions, source clusters, reactions, moderation
-- and the private quality ledger.  This migration adds only the projections
-- needed for the three Community waves; none of these tables is a Trust
-- verdict store or an Expert-authority store.
create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.community_source_references (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  contribution_revision integer not null check (contribution_revision >= 1),
  source_cluster_id uuid references public.community_source_clusters(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  source_url text not null check (char_length(source_url) between 12 and 4000),
  canonical_url text not null check (char_length(canonical_url) between 12 and 4000),
  publisher text check (publisher is null or char_length(publisher) between 1 and 300),
  independence_key text not null check (char_length(independence_key) between 1 and 1000),
  content_digest bytea check (content_digest is null or octet_length(content_digest) = 32),
  source_state text not null default 'UNKNOWN' check (source_state in (
    'AVAILABLE','UPDATED','UNAVAILABLE','RETRACTED','UNKNOWN'
  )),
  published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_checked_at timestamptz,
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  request_digest bytea check (request_digest is null or octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contribution_id, contribution_revision, canonical_url),
  unique(created_by, idempotency_key)
);
create index if not exists community_source_references_cluster_idx
  on public.community_source_references(source_cluster_id, source_state, updated_at desc);
create index if not exists community_source_references_contribution_idx
  on public.community_source_references(contribution_id, contribution_revision, created_at desc);

create table if not exists public.community_source_change_events (
  id bigint generated always as identity primary key,
  source_reference_id uuid not null references public.community_source_references(id) on delete cascade,
  previous_state text check (previous_state is null or previous_state in (
    'AVAILABLE','UPDATED','UNAVAILABLE','RETRACTED','UNKNOWN'
  )),
  next_state text not null check (next_state in (
    'AVAILABLE','UPDATED','UNAVAILABLE','RETRACTED','UNKNOWN'
  )),
  reason text not null check (char_length(reason) between 1 and 1000),
  actor_type text not null check (actor_type in (
    'COMMUNITY_MEMBER','MODERATOR','VERIFICATION_WORKER','SYSTEM'
  )),
  created_at timestamptz not null default now()
);
create index if not exists community_source_change_events_reference_idx
  on public.community_source_change_events(source_reference_id, created_at desc);

create table if not exists public.community_verification_projections (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  contribution_revision integer not null check (contribution_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  trust_case_id uuid not null references public.trust_cases(id) on delete cascade,
  trust_case_revision integer not null check (trust_case_revision >= 1),
  source_reference_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(source_reference_ids) = 'array'),
  verification_state text not null default 'PENDING' check (verification_state in (
    'LINKED','PENDING','OUTDATED','NEW_VERIFICATION_REQUIRED'
  )),
  freshness_state text not null default 'UNKNOWN' check (freshness_state in (
    'FRESH','AGING','STALE','SOURCE_RETRACTED','CONTEXT_CHANGED','UNKNOWN'
  )),
  freshness_reason text check (freshness_reason is null or char_length(freshness_reason) between 1 and 1000),
  last_checked_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contribution_id, contribution_revision, trust_case_id)
);
create index if not exists community_verification_projections_scope_idx
  on public.community_verification_projections(trust_case_id, trust_case_revision, freshness_state, updated_at desc);
create index if not exists community_verification_projections_contribution_idx
  on public.community_verification_projections(contribution_id, contribution_revision, updated_at desc);

create table if not exists public.community_claim_discussions (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete set null,
  contribution_revision integer not null check (contribution_revision >= 1),
  author_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in (
    'SUPPORT','CHALLENGE','ADD_EVIDENCE','REQUEST_SOURCE','ADD_CONTEXT',
    'REQUEST_EXPERT','REQUEST_VERIFICATION'
  )),
  body text not null check (char_length(body) between 10 and 10000),
  evidence_reference_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_reference_ids) = 'array'),
  privacy_findings jsonb not null default '[]'::jsonb check (jsonb_typeof(privacy_findings) = 'array'),
  status text not null default 'PUBLISHED' check (status in ('PUBLISHED','WITHDRAWN','MODERATED')),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(author_id, idempotency_key)
);
create index if not exists community_claim_discussions_scope_idx
  on public.community_claim_discussions(contribution_id, claim_id, contribution_revision, created_at);

create table if not exists public.community_discussion_summaries (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  contribution_revision integer not null check (contribution_revision >= 1),
  summary_text text not null check (char_length(summary_text) between 20 and 12000),
  discussion_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(discussion_ids) = 'array'),
  source_reference_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(source_reference_ids) = 'array'),
  policy_version text not null check (char_length(policy_version) between 1 and 120),
  provider_status text not null check (provider_status in ('RULE_GROUNDED','AI_PROVIDER_UNAVAILABLE','HUMAN_REVIEW_REQUIRED')),
  is_authoritative boolean not null default false check (is_authoritative = false),
  created_at timestamptz not null default now(),
  unique(contribution_id, contribution_revision, policy_version)
);
create index if not exists community_discussion_summaries_scope_idx
  on public.community_discussion_summaries(contribution_id, contribution_revision, created_at desc);

create table if not exists private.community_review_candidates (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  contribution_revision integer not null check (contribution_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  candidate_type text not null check (candidate_type in ('HIGH_VALUE_DISAGREEMENT','FRESHNESS_REVIEW','SOURCE_RETRACTION_REVIEW')),
  priority smallint not null default 0 check (priority between 0 and 100),
  signals jsonb not null default '{}'::jsonb check (jsonb_typeof(signals) = 'object'),
  status text not null default 'OPEN' check (status in ('OPEN','ASSIGNED','IN_REVIEW','ADJUDICATED','DISMISSED')),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contribution_id, contribution_revision, candidate_type),
  unique(idempotency_key)
);
create index if not exists community_review_candidates_queue_idx
  on private.community_review_candidates(status, priority desc, created_at);

create table if not exists private.community_expert_requests (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  contribution_revision integer not null check (contribution_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  requester_id uuid not null references auth.users(id) on delete restrict,
  domain_code text not null check (char_length(domain_code) between 1 and 120),
  reason text not null check (char_length(reason) between 10 and 4000),
  privacy_sanitized boolean not null default true check (privacy_sanitized = true),
  priority smallint not null default 0 check (priority between 0 and 100),
  status text not null default 'QUEUED' check (status in ('QUEUED','ELIGIBLE','ASSIGNED','COMPLETED','DECLINED')),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, idempotency_key)
);
create index if not exists community_expert_requests_queue_idx
  on private.community_expert_requests(status, priority desc, created_at);

create table if not exists public.community_campus_contexts (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  contribution_revision integer not null check (contribution_revision >= 1),
  institution_id uuid references public.institutions(id) on delete set null,
  university_label text check (university_label is null or char_length(university_label) between 1 and 240),
  faculty text check (faculty is null or char_length(faculty) between 1 and 240),
  major text check (major is null or char_length(major) between 1 and 240),
  topic text check (topic is null or char_length(topic) between 1 and 240),
  visibility text not null default 'PRIVATE' check (visibility in ('PUBLIC','PRIVATE')),
  consent_state text not null default 'CONSENTED' check (consent_state in ('CONSENTED','REVOKED')),
  consented_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contribution_id, contribution_revision)
);
create index if not exists community_campus_contexts_visibility_idx
  on public.community_campus_contexts(visibility, consent_state, updated_at desc);

create table if not exists private.community_risk_clusters (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  risk_type text not null check (char_length(risk_type) between 1 and 120),
  severity smallint not null default 0 check (severity between 0 and 100),
  occurrence_count integer not null default 1 check (occurrence_count >= 1),
  confidence numeric(5,4) not null default 0 check (confidence between 0 and 1),
  status text not null default 'OPEN' check (status in ('OPEN','REVIEW','RESOLVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(fingerprint)
);
create index if not exists community_risk_clusters_queue_idx
  on private.community_risk_clusters(status, severity desc, updated_at desc);

create table if not exists private.community_risk_cluster_members (
  cluster_id uuid not null references private.community_risk_clusters(id) on delete cascade,
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  contribution_revision integer not null check (contribution_revision >= 1),
  signal_type text not null check (char_length(signal_type) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key(cluster_id, contribution_id, contribution_revision)
);

create table if not exists public.community_correction_records (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  previous_revision integer not null check (previous_revision >= 1),
  new_revision integer not null check (new_revision > previous_revision),
  correction_type text not null check (correction_type in ('SELF_CORRECTION','ADD_SOURCE','WITHDRAW_CLAIM','CONTEXT_UPDATE')),
  statement text not null check (char_length(statement) between 10 and 5000),
  quality_signal jsonb not null default '{"integrity":"RECORDED","pointDelta":0}'::jsonb check (jsonb_typeof(quality_signal) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(created_by, idempotency_key)
);
create index if not exists community_correction_records_lineage_idx
  on public.community_correction_records(contribution_id, new_revision desc, created_at desc);

create table if not exists private.community_data_candidates (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  contribution_revision integer not null check (contribution_revision >= 1),
  candidate_type text not null check (candidate_type in ('QUALITY_EVENT','CORRECTION_EXAMPLE','SOURCE_COMPARISON','DISCUSSION_LABEL')),
  consent_state text not null default 'NOT_PROVIDED' check (consent_state in ('NOT_PROVIDED','EXPLICIT','REVOKED')),
  license_state text not null default 'UNKNOWN' check (license_state in ('UNKNOWN','ALLOWED','REJECTED')),
  annotation_state text not null default 'UNANNOTATED' check (annotation_state in ('UNANNOTATED','REVIEWED')),
  adjudication_state text not null default 'NOT_REQUESTED' check (adjudication_state in ('NOT_REQUESTED','PENDING','APPROVED','REJECTED')),
  training_eligible boolean not null default false check (training_eligible = false),
  privacy_sanitized boolean not null default true check (privacy_sanitized = true),
  created_at timestamptz not null default now(),
  unique(contribution_id, contribution_revision, candidate_type)
);

-- Public projections are read-only to browser roles.  Server repositories use
-- the service role and still enforce scope, privacy, and idempotency.
alter table public.community_source_references enable row level security;
alter table public.community_source_change_events enable row level security;
alter table public.community_verification_projections enable row level security;
alter table public.community_claim_discussions enable row level security;
alter table public.community_discussion_summaries enable row level security;
alter table public.community_campus_contexts enable row level security;
alter table public.community_correction_records enable row level security;
alter table private.community_review_candidates enable row level security;
alter table private.community_expert_requests enable row level security;
alter table private.community_risk_clusters enable row level security;
alter table private.community_risk_cluster_members enable row level security;
alter table private.community_data_candidates enable row level security;

drop policy if exists community_max_source_references_read on public.community_source_references;
create policy community_max_source_references_read on public.community_source_references for select using (
  exists (
    select 1
      from public.community_contributions c
      join public.trust_cases tc on tc.id = c.case_id
     where c.id = contribution_id
       and (tc.visibility = 'PUBLIC' or c.author_id = auth.uid())
  )
);
drop policy if exists community_max_source_events_read on public.community_source_change_events;
create policy community_max_source_events_read on public.community_source_change_events for select using (
  exists (
    select 1
      from public.community_source_references sr
      join public.community_contributions c on c.id = sr.contribution_id
      join public.trust_cases tc on tc.id = c.case_id
     where sr.id = source_reference_id
       and (tc.visibility = 'PUBLIC' or c.author_id = auth.uid())
  )
);
drop policy if exists community_max_verification_read on public.community_verification_projections;
create policy community_max_verification_read on public.community_verification_projections for select using (
  exists (
    select 1
      from public.community_contributions c
      join public.trust_cases tc on tc.id = c.case_id
     where c.id = contribution_id
       and (tc.visibility = 'PUBLIC' or c.author_id = auth.uid())
  )
);
drop policy if exists community_max_discussions_read on public.community_claim_discussions;
create policy community_max_discussions_read on public.community_claim_discussions for select using (
  exists (
    select 1
      from public.community_contributions c
      join public.trust_cases tc on tc.id = c.case_id
     where c.id = contribution_id
       and (tc.visibility = 'PUBLIC' or c.author_id = auth.uid())
  )
);
drop policy if exists community_max_summaries_read on public.community_discussion_summaries;
create policy community_max_summaries_read on public.community_discussion_summaries for select using (
  exists (
    select 1
      from public.community_contributions c
      join public.trust_cases tc on tc.id = c.case_id
     where c.id = contribution_id
       and (tc.visibility = 'PUBLIC' or c.author_id = auth.uid())
  )
);
drop policy if exists community_max_campus_read on public.community_campus_contexts;
create policy community_max_campus_read on public.community_campus_contexts for select using (
  (
    visibility = 'PUBLIC' and consent_state = 'CONSENTED' and exists (
      select 1 from public.community_contributions c
      join public.trust_cases tc on tc.id = c.case_id
      where c.id = contribution_id and tc.visibility = 'PUBLIC'
    )
  )
  or created_by = auth.uid()
);
drop policy if exists community_max_corrections_read on public.community_correction_records;
create policy community_max_corrections_read on public.community_correction_records for select using (
  exists (
    select 1
      from public.community_contributions c
      join public.trust_cases tc on tc.id = c.case_id
     where c.id = contribution_id
       and (tc.visibility = 'PUBLIC' or c.author_id = auth.uid())
  )
);

-- Browser roles never write these projections directly.  This prevents a
-- client from forging source status, freshness, summaries, review queues,
-- campus consent, correction lineage, or private risk/data decisions.
revoke all on public.community_source_references,
  public.community_source_change_events,
  public.community_verification_projections,
  public.community_claim_discussions,
  public.community_discussion_summaries,
  public.community_campus_contexts,
  public.community_correction_records
from public, anon, authenticated;
grant select on public.community_source_references,
  public.community_source_change_events,
  public.community_verification_projections,
  public.community_claim_discussions,
  public.community_discussion_summaries,
  public.community_campus_contexts,
  public.community_correction_records to authenticated;

revoke all on private.community_review_candidates,
  private.community_expert_requests,
  private.community_risk_clusters,
  private.community_risk_cluster_members,
  private.community_data_candidates
from public, anon, authenticated;
grant select, insert, update on public.community_source_references,
  public.community_verification_projections,
  public.community_campus_contexts to service_role;
grant select, insert on public.community_source_change_events,
  public.community_claim_discussions,
  public.community_discussion_summaries,
  public.community_correction_records to service_role;
grant select, insert, update on private.community_review_candidates,
  private.community_expert_requests,
  private.community_risk_clusters to service_role;
grant select, insert on private.community_risk_cluster_members,
  private.community_data_candidates to service_role;

-- History is append-only.  The shared Promax trigger rejects UPDATE/DELETE;
-- current-state projections remain mutable only through the service boundary.
drop trigger if exists community_source_change_events_no_update on public.community_source_change_events;
create trigger community_source_change_events_no_update before update or delete on public.community_source_change_events
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists community_claim_discussions_no_update on public.community_claim_discussions;
create trigger community_claim_discussions_no_update before update or delete on public.community_claim_discussions
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists community_discussion_summaries_no_update on public.community_discussion_summaries;
create trigger community_discussion_summaries_no_update before update or delete on public.community_discussion_summaries
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists community_correction_records_no_update on public.community_correction_records;
create trigger community_correction_records_no_update before update or delete on public.community_correction_records
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists community_risk_cluster_members_no_update on private.community_risk_cluster_members;
create trigger community_risk_cluster_members_no_update before update or delete on private.community_risk_cluster_members
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists community_data_candidates_no_update on private.community_data_candidates;
create trigger community_data_candidates_no_update before update or delete on private.community_data_candidates
for each row execute function private.reject_promax_history_mutation();

commit;
