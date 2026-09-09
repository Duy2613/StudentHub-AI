begin;

-- Promax keeps Community signals, objective evidence, expert assessments, and
-- reputation quality separate.  All writes are made by server-side services;
-- browser roles receive only the public projection permitted by RLS.
create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.community_source_clusters (
  id uuid primary key default gen_random_uuid(),
  canonical_locator text not null,
  publisher text,
  independence_key text not null,
  content_digest bytea check (content_digest is null or octet_length(content_digest) = 32),
  source_count integer not null default 1 check (source_count >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(canonical_locator, independence_key)
);
create unique index if not exists community_source_clusters_digest_idx
  on public.community_source_clusters(content_digest, independence_key)
  where content_digest is not null;

create table if not exists public.community_contributions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  contribution_type text not null check (contribution_type in (
    'DIRECT_EXPERIENCE','FOUND_SOURCE','NEEDS_VERIFICATION',
    'SUPPORTING_EVIDENCE','CONTRADICTING_EVIDENCE','CONTEXT','CRITIQUE'
  )),
  publication_state text not null default 'DRAFT' check (publication_state in (
    'DRAFT','PRIVACY_SCAN_PENDING','PREVIEW_READY','PUBLISHED',
    'EDITED','WITHDRAWN','MODERATED','BLOCKED'
  )),
  evidence_state text not null default 'UNKNOWN' check (evidence_state in (
    'UNKNOWN','INSUFFICIENT','SUPPORTING','CONTRADICTORY','MIXED','STALE','SUPERSEDED'
  )),
  review_state text not null default 'UNASSIGNED' check (review_state in (
    'UNASSIGNED','ASSIGNED','IN_REVIEW','CONFLICT','NEEDS_THIRD_REVIEW',
    'RESOLVED','APPEALED','SUPERSEDED'
  )),
  revision integer not null default 1 check (revision >= 1),
  statement text not null check (char_length(statement) between 20 and 20000),
  public_statement text not null check (char_length(public_statement) between 20 and 20000),
  evidence_revision_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_revision_ids) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  source_cluster_id uuid references public.community_source_clusters(id) on delete set null,
  content_digest bytea not null check (octet_length(content_digest) = 32),
  privacy_findings jsonb not null default '[]'::jsonb check (jsonb_typeof(privacy_findings) = 'array'),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(author_id, idempotency_key)
);
create index if not exists community_contributions_case_idx
  on public.community_contributions(case_id, case_revision, claim_id, created_at desc);
create index if not exists community_contributions_public_idx
  on public.community_contributions(publication_state, review_state, created_at desc);

create table if not exists public.community_contribution_revisions (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  revision integer not null check (revision >= 1),
  statement text not null check (char_length(statement) between 20 and 20000),
  public_statement text not null check (char_length(public_statement) between 20 and 20000),
  evidence_revision_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_revision_ids) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  content_digest bytea not null check (octet_length(content_digest) = 32),
  privacy_findings jsonb not null default '[]'::jsonb check (jsonb_typeof(privacy_findings) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(contribution_id, revision)
);
create index if not exists community_contribution_revisions_lookup_idx
  on public.community_contribution_revisions(contribution_id, revision desc);

-- File metadata is private by construction. The object keys point to a
-- private bucket and the redacted derivative is a separate revision; neither
-- key is included in public DTOs, search documents, notifications, or logs.
create table if not exists private.community_file_objects (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.community_contributions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  original_object_key text not null check (char_length(original_object_key) between 1 and 500),
  public_derivative_object_key text check (public_derivative_object_key is null or char_length(public_derivative_object_key) between 1 and 500),
  scan_state text not null default 'PRIVACY_SCAN_PENDING' check (scan_state in ('PRIVACY_SCAN_PENDING','PREVIEW_READY','PUBLISHED','BLOCKED','DELETED')),
  mime_type text not null check (char_length(mime_type) between 1 and 120),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 8388608),
  sha256 bytea not null check (octet_length(sha256) = 32),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_file_objects_scope_idx
  on private.community_file_objects(owner_id, case_id, case_revision, scan_state);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete set null,
  case_revision integer not null check (case_revision >= 1),
  kind text not null check (kind in ('HELPFUL','ADD_EVIDENCE','CHALLENGE','INSUFFICIENT_INFORMATION','REPORT_ABUSE')),
  value smallint not null default 1 check (value in (-1, 1)),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, contribution_id, kind)
);
create index if not exists community_reactions_claim_idx
  on public.community_reactions(contribution_id, claim_id, case_revision, kind);

-- The contributor track record is an auditable quality-event ledger. It is a
-- qualification signal only; it never writes Trust verdicts or expert
-- authority. The current score is projected from durable contributions and
-- reactions, while this append-only ledger preserves why the projection
-- changed.
create table if not exists private.community_quality_events (
  id bigint generated always as identity primary key,
  subject_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  contribution_id uuid references public.community_contributions(id) on delete set null,
  case_id uuid references public.trust_cases(id) on delete set null,
  case_revision integer check (case_revision is null or case_revision >= 1),
  event_type text not null check (event_type in (
    'CONTRIBUTION_PUBLISHED','CONTRIBUTION_REVISED','REACTION_RECORDED',
    'CORRECTION_RECORDED','MODERATION_RECORDED','MANUAL_CORRECTION'
  )),
  point_delta integer not null default 0 check (point_delta between -100 and 100),
  reason text not null check (char_length(reason) between 1 and 1000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(subject_id, idempotency_key)
);
create index if not exists community_quality_events_subject_idx
  on private.community_quality_events(subject_id, created_at desc);

-- Append-only reaction history gives idempotent retries without treating a
-- reaction as a truth vote or as an author reputation mutation.
create table if not exists private.community_reaction_events (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete set null,
  case_revision integer not null check (case_revision >= 1),
  kind text not null check (kind in ('HELPFUL','ADD_EVIDENCE','CHALLENGE','INSUFFICIENT_INFORMATION','REPORT_ABUSE')),
  value smallint not null check (value in (-1, 1)),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

create table if not exists private.expert_assignments (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  domain_code text not null check (char_length(domain_code) between 1 and 80),
  status text not null default 'ASSIGNED' check (status in ('ASSIGNED','IN_REVIEW','COMPLETED','CANCELLED')),
  assigned_by uuid not null references auth.users(id) on delete restrict,
  conflict_of_interest boolean not null default false,
  conflict_reason text,
  expires_at timestamptz,
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  request_digest bytea check (request_digest is null or octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expert_assignments_subject_idx
  on private.expert_assignments(expert_id, case_id, case_revision, status);
create unique index if not exists expert_assignment_active_once
  on private.expert_assignments(expert_id, case_id, case_revision, claim_id, domain_code)
  where status in ('ASSIGNED','IN_REVIEW');

-- Evidence-based practice is a separate qualification projection.  The
-- applicant response is private, the reviewer decision is append-only, and
-- neither table grants domain authority until an authorized activation writes
-- DOMAIN_VERIFIED to expert_verifications.
create table if not exists private.expert_practice_submissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.expert_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null check (char_length(domain_code) between 1 and 80),
  prompt_version text not null check (char_length(prompt_version) between 1 and 120),
  prompt_snapshot jsonb not null check (jsonb_typeof(prompt_snapshot) = 'object'),
  response jsonb not null check (jsonb_typeof(response) = 'object'),
  evidence_revision_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_revision_ids) = 'array'),
  state text not null default 'SUBMITTED' check (state in ('SUBMITTED','UNDER_REVIEW','PASSED','FAILED','EXPIRED')),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id, domain_code),
  unique(user_id, idempotency_key)
);
create index if not exists expert_practice_submissions_review_idx
  on private.expert_practice_submissions(state, created_at asc);

create table if not exists private.expert_practice_decisions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references private.expert_practice_submissions(id) on delete cascade,
  application_id uuid not null references public.expert_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('PASS','FAIL','REQUEST_REVISION')),
  rubric_version text not null check (char_length(rubric_version) between 1 and 120),
  reason text not null check (char_length(reason) between 20 and 4000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(reviewer_id, idempotency_key),
  unique(reviewer_id, submission_id)
);
create index if not exists expert_practice_decisions_submission_idx
  on private.expert_practice_decisions(submission_id, created_at asc);

alter table private.expert_qualification_reviews drop constraint if exists expert_qualification_reviews_decision_check;
alter table private.expert_qualification_reviews add constraint expert_qualification_reviews_decision_check
  check (decision in ('APPROVE_QUIZ','ACTIVATE','REJECT','APPEAL_REVIEW','PRACTICE_PASS','PRACTICE_FAIL','PRACTICE_REQUEST_REVISION'));

create table if not exists private.expert_quality_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null,
  case_id uuid references public.trust_cases(id) on delete set null,
  case_revision integer check (case_revision is null or case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  incident_cluster_id text check (incident_cluster_id is null or char_length(incident_cluster_id) between 1 and 180),
  event_type text not null check (event_type in ('ADJUDICATION','REVERSE_ADJUDICATION','MANUAL_CORRECTION')),
  outcome text not null check (outcome in ('SUPPORT','CONTRADICT','CORRECT','INCORRECT','ABSTAIN','MIXED')),
  weight numeric(10,4) not null default 1 check (weight > 0 and weight <= 10),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  reason text not null,
  policy_version text not null default 'expert-quality-v1',
  created_at timestamptz not null default now(),
  unique(user_id, domain_code, idempotency_key)
);
create index if not exists expert_quality_events_lookup_idx
  on private.expert_quality_events(user_id, domain_code, created_at desc);

create table if not exists private.expert_review_decisions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.expert_assessments(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  assignment_id uuid references private.expert_assignments(id) on delete restrict,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  decision text not null check (decision in ('AGREE','DISAGREE','ABSTAIN')),
  reasoning text not null check (char_length(reasoning) between 20 and 4000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(reviewer_id, idempotency_key)
);
create index if not exists expert_review_decisions_assessment_idx on private.expert_review_decisions(assessment_id, created_at asc);
create unique index if not exists expert_review_one_per_reviewer_assessment
  on private.expert_review_decisions(reviewer_id, assessment_id);

create table if not exists public.case_appeals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  assessment_id uuid references public.expert_assessments(id) on delete set null,
  requester_id uuid not null references auth.users(id) on delete restrict,
  reason text not null check (char_length(reason) between 20 and 4000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','RESOLVED','REJECTED','SUPERSEDED')),
  supersedes_appeal_id uuid references public.case_appeals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, idempotency_key)
);
create index if not exists case_appeals_case_idx on public.case_appeals(case_id, case_revision, created_at desc);
alter table public.case_appeals add column if not exists resolved_by uuid references auth.users(id) on delete set null;
alter table public.case_appeals add column if not exists resolution text;
alter table public.case_appeals add column if not exists resolution_reason text;
alter table public.case_appeals add column if not exists resolved_at timestamptz;

create table if not exists private.case_appeal_reviews (
  id uuid primary key default gen_random_uuid(),
  appeal_id uuid not null references public.case_appeals(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('UPHOLD','OVERTURN','REQUEST_EVIDENCE')),
  reason text not null check (char_length(reason) between 20 and 4000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  unique(reviewer_id, idempotency_key),
  unique(reviewer_id, appeal_id)
);
create index if not exists case_appeal_reviews_appeal_idx on private.case_appeal_reviews(appeal_id, created_at asc);

create table if not exists public.case_corrections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  correction_type text not null check (correction_type in ('EVIDENCE_UPDATE','SOURCE_RETRACTION','CLAIM_SPLIT','CLAIM_MERGE','CONTEXT_UPDATE')),
  statement text not null check (char_length(statement) between 20 and 10000),
  evidence_revision_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_revision_ids) = 'array'),
  created_by uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now()
);
alter table public.case_appeals add column if not exists idempotency_key text;
alter table public.case_appeals add column if not exists request_digest bytea;
create unique index if not exists case_appeals_idempotency_idx on public.case_appeals(requester_id, idempotency_key) where idempotency_key is not null;
alter table public.case_corrections add column if not exists idempotency_key text;
alter table public.case_corrections add column if not exists request_digest bytea;
create unique index if not exists case_corrections_idempotency_idx on public.case_corrections(created_by, idempotency_key);

-- Extend the existing assessment row rather than creating a second expert
-- authority table.  Existing rows remain readable for compatibility, while
-- new Promax assessments carry the full revision/assignment contract.
alter table public.expert_assessments add column if not exists assignment_id uuid references private.expert_assignments(id) on delete restrict;
alter table public.expert_assessments add column if not exists case_revision integer;
alter table public.expert_assessments add column if not exists claim_id uuid references public.claims(id) on delete set null;
alter table public.expert_assessments add column if not exists evidence_revision_ids jsonb not null default '[]'::jsonb;
alter table public.expert_assessments add column if not exists assessment_state text not null default 'SUBMITTED';
alter table public.expert_assessments add column if not exists conclusion_within_scope text;
alter table public.expert_assessments add column if not exists reasoning text;
alter table public.expert_assessments add column if not exists uncertainty text;
alter table public.expert_assessments add column if not exists missing_evidence jsonb not null default '[]'::jsonb;
alter table public.expert_assessments add column if not exists coi_declared boolean not null default false;
alter table public.expert_assessments add column if not exists policy_version text not null default 'expert-quality-v1';
alter table public.expert_assessments add column if not exists idempotency_key text;
alter table public.expert_assessments add column if not exists request_digest bytea;
alter table public.expert_assessments drop constraint if exists expert_assessments_evidence_array_check;
alter table public.expert_assessments add constraint expert_assessments_evidence_array_check
  check (jsonb_typeof(evidence_revision_ids) = 'array');
alter table public.expert_assessments drop constraint if exists expert_assessments_state_check;
alter table public.expert_assessments add constraint expert_assessments_state_check
  check (assessment_state in ('DRAFT','SUBMITTED','REVIEWED','CONFLICT','STALE','SUPERSEDED','WITHDRAWN'));
create unique index if not exists expert_assessments_idempotency_idx
  on public.expert_assessments(expert_id, idempotency_key) where idempotency_key is not null;

-- Each assessment is immutable history, including across claims/revisions.
alter table public.expert_assessments drop constraint if exists expert_assessments_expert_id_case_id_domain_code_key;
create unique index if not exists expert_assessment_assignment_once on public.expert_assessments(assignment_id) where assignment_id is not null;
alter table private.expert_verifications add column if not exists expires_at timestamptz;
alter table private.expert_verifications add column if not exists suspended_at timestamptz;
alter table private.expert_assignments add column if not exists idempotency_key text;
alter table private.expert_assignments add column if not exists request_digest bytea;
alter table private.expert_assignments drop constraint if exists expert_assignments_request_digest_check;
alter table private.expert_assignments add constraint expert_assignments_request_digest_check
  check (request_digest is null or octet_length(request_digest) = 32);
create unique index if not exists expert_assignment_idempotency_idx
  on private.expert_assignments(assigned_by, idempotency_key)
  where idempotency_key is not null;
-- Qualification is a separate progression from domain verification status.  It
-- keeps applicant, practice review, trainee, expiry, suspension, and revocation
-- transitions auditable without overloading the legacy status column.
alter table private.expert_verifications add column if not exists qualification_state text not null default 'APPLICANT';
alter table private.expert_verifications drop constraint if exists expert_verifications_qualification_state_check;
alter table private.expert_verifications add constraint expert_verifications_qualification_state_check
  check (qualification_state in ('APPLICANT','IDENTITY_CHECKED','QUIZ_PASSED','PRACTICE_REVIEW','TRAINEE','DOMAIN_VERIFIED','SUSPENDED','EXPIRED','REVOKED'));
update private.expert_verifications
   set qualification_state = case
     when status = 'VERIFIED' and suspended_at is null and (expires_at is null or expires_at > now()) then 'DOMAIN_VERIFIED'
     when status = 'REVOKED' then 'REVOKED'
     when suspended_at is not null then 'SUSPENDED'
     when expires_at is not null and expires_at <= now() then 'EXPIRED'
     else qualification_state
   end
 where qualification_state = 'APPLICANT';
alter table private.expert_quality_events add column if not exists actor_id uuid references auth.users(id);
alter table private.expert_quality_events add column if not exists supersedes_event_id bigint references private.expert_quality_events(id);
alter table private.expert_quality_events add column if not exists evidence_revision_ids jsonb not null default '[]'::jsonb;
alter table private.expert_quality_events add column if not exists incident_cluster_id text;
alter table private.expert_quality_events drop constraint if exists expert_quality_events_incident_cluster_length;
alter table private.expert_quality_events add constraint expert_quality_events_incident_cluster_length
  check (incident_cluster_id is null or char_length(incident_cluster_id) between 1 and 180);
alter table private.expert_quality_events drop constraint if exists expert_quality_events_evidence_array_check;
alter table private.expert_quality_events add constraint expert_quality_events_evidence_array_check
  check (jsonb_typeof(evidence_revision_ids) = 'array');
create unique index if not exists quality_one_reversal on private.expert_quality_events(supersedes_event_id) where supersedes_event_id is not null;
create unique index if not exists reaction_one_claim_revision_kind on public.community_reactions(user_id, claim_id, case_revision, kind) where claim_id is not null;

-- Internal outbox events are durable and replayable but are not sent to Labbe.
alter table private.integration_outbox drop constraint if exists integration_outbox_integration_check;
alter table private.integration_outbox add constraint integration_outbox_integration_check
  check (integration in ('LABBE','INTERNAL'));

alter table public.community_source_clusters enable row level security;
alter table public.community_contributions enable row level security;
alter table public.community_contribution_revisions enable row level security;
alter table public.community_reactions enable row level security;
alter table private.community_quality_events enable row level security;
-- Assessments retain a public table name for Trust compatibility, but the
-- rows are server-owned and contain reviewer reasoning/identity links.
alter table public.expert_assessments enable row level security;
alter table private.community_reaction_events enable row level security;
alter table private.community_file_objects enable row level security;
alter table private.expert_assignments enable row level security;
alter table private.expert_practice_submissions enable row level security;
alter table private.expert_practice_decisions enable row level security;
alter table private.case_appeal_reviews enable row level security;
alter table private.expert_quality_events enable row level security;
alter table private.expert_review_decisions enable row level security;
alter table public.case_appeals enable row level security;
alter table public.case_corrections enable row level security;

drop policy if exists community_source_clusters_read on public.community_source_clusters;
create policy community_source_clusters_read on public.community_source_clusters for select using (true);
drop policy if exists community_contributions_read on public.community_contributions;
create policy community_contributions_read on public.community_contributions for select
  using (publication_state = 'PUBLISHED' or author_id = auth.uid());
drop policy if exists community_contributions_owner_insert on public.community_contributions;
create policy community_contributions_owner_insert on public.community_contributions for insert
  with check (author_id = auth.uid());
drop policy if exists community_contributions_owner_update on public.community_contributions;
create policy community_contributions_owner_update on public.community_contributions for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists community_contribution_revisions_read on public.community_contribution_revisions;
create policy community_contribution_revisions_read on public.community_contribution_revisions for select
  using (exists (select 1 from public.community_contributions c join public.trust_cases tc on tc.id = c.case_id where c.id = contribution_id and (tc.visibility = 'PUBLIC' or c.author_id = auth.uid())));
drop policy if exists community_reactions_read on public.community_reactions;
create policy community_reactions_read on public.community_reactions for select using (true);
drop policy if exists community_reactions_owner_write on public.community_reactions;
create policy community_reactions_owner_write on public.community_reactions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists case_appeals_owner_read on public.case_appeals;
create policy case_appeals_owner_read on public.case_appeals for select using (requester_id = auth.uid());
drop policy if exists case_corrections_read on public.case_corrections;
create policy case_corrections_read on public.case_corrections for select using (true);

revoke all on private.community_reaction_events, private.community_file_objects, private.expert_assignments, private.expert_quality_events, private.expert_practice_submissions, private.expert_practice_decisions, private.case_appeal_reviews, private.expert_review_decisions, private.community_quality_events from public, anon, authenticated;
revoke all on public.community_source_clusters, public.community_contributions, public.community_contribution_revisions, public.community_reactions, public.case_appeals, public.case_corrections from public, anon, authenticated;
revoke all on public.expert_assessments from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert on private.community_quality_events to service_role;
grant select, insert on private.community_reaction_events to service_role;
grant select, insert, update on private.community_file_objects to service_role;
grant select, insert, update on private.expert_assignments to service_role;
grant select, insert, update on private.expert_practice_submissions to service_role;
grant select, insert on private.expert_practice_decisions to service_role;
grant select, insert on private.case_appeal_reviews to service_role;
grant select, insert on private.expert_quality_events to service_role;
grant select, insert on private.expert_review_decisions to service_role;
grant usage, select on sequence private.community_quality_events_id_seq, private.community_reaction_events_id_seq, private.expert_quality_events_id_seq to service_role;
grant select, insert, update on public.community_source_clusters, public.community_contributions, public.community_reactions to service_role;
grant select, insert on public.community_contribution_revisions to service_role;
grant select, insert, update on public.case_appeals to service_role;
grant select, insert on public.case_corrections to service_role;
grant select, insert, update on public.expert_assessments to service_role;

-- Private event/quality histories are append-only.  Corrections are new rows
-- with a new revision; no prior assessment or reaction is overwritten.
create or replace function private.reject_promax_history_mutation()
returns trigger language plpgsql security definer set search_path = private as $$
begin raise exception 'Promax history is append-only'; end;
$$;
drop trigger if exists community_reaction_events_no_update on private.community_reaction_events;
create trigger community_reaction_events_no_update before update or delete on private.community_reaction_events
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists community_quality_events_no_update on private.community_quality_events;
create trigger community_quality_events_no_update before update or delete on private.community_quality_events
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_quality_events_no_update on private.expert_quality_events;
create trigger expert_quality_events_no_update before update or delete on private.expert_quality_events
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_practice_decisions_no_update on private.expert_practice_decisions;
create trigger expert_practice_decisions_no_update before update or delete on private.expert_practice_decisions
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists case_appeal_reviews_no_update on private.case_appeal_reviews;
create trigger case_appeal_reviews_no_update before update or delete on private.case_appeal_reviews
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_qualification_reviews_no_update on private.expert_qualification_reviews;
create trigger expert_qualification_reviews_no_update before update or delete on private.expert_qualification_reviews
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_review_decisions_no_update on private.expert_review_decisions;
create trigger expert_review_decisions_no_update before update or delete on private.expert_review_decisions
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists expert_assessments_no_update on public.expert_assessments;
create trigger expert_assessments_no_update before update or delete on public.expert_assessments
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists case_corrections_no_update on public.case_corrections;
create trigger case_corrections_no_update before update or delete on public.case_corrections
for each row execute function private.reject_promax_history_mutation();
drop trigger if exists community_contribution_revisions_no_update on public.community_contribution_revisions;
create trigger community_contribution_revisions_no_update before update or delete on public.community_contribution_revisions
for each row execute function private.reject_promax_history_mutation();

commit;
