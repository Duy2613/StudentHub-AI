begin;

-- StudentHub AI — Expert Trust Network V3 Schema
-- Preserves Core Invariants:
-- 1. EXPERT != TRUST VERDICT
-- 2. STARS != TRUTH (expert_quality_events remains sole source of truth)
-- 3. COMMUNITY PERCEPTION != TRUST ENGINE EVIDENCE
-- 4. MODERATION SCOPED TO COMMUNITY CONTENT ONLY

create extension if not exists pgcrypto;
create schema if not exists private;

-- 1. Expert Progression Projections (Stars 1-5, Sufficiency >= 20 independent units)
create table if not exists public.expert_progression_projections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  domain_code text not null default 'GENERAL',
  adjudicated_count integer not null default 0 check (adjudicated_count >= 0),
  upheld_count integer not null default 0 check (upheld_count >= 0),
  overturned_count integer not null default 0 check (overturned_count >= 0),
  raw_quality_score numeric(6,4) not null default 0.0 check (raw_quality_score >= 0.0 and raw_quality_score <= 1.0),
  star_level integer not null default 1 check (star_level between 1 and 5),
  sufficiency_state text not null default 'INSUFFICIENT_DATA' check (sufficiency_state in ('INSUFFICIENT_DATA', 'SUFFICIENT')),
  missions_completed_count integer not null default 0 check (missions_completed_count >= 0),
  last_calculated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expert_progression_domain_idx
  on public.expert_progression_projections(domain_code, star_level desc, raw_quality_score desc);

alter table public.expert_progression_projections enable row level security;
drop policy if exists expert_progression_read_policy on public.expert_progression_projections;
create policy expert_progression_read_policy
  on public.expert_progression_projections
  for select using (true);

-- 2. Community Perception Votes (Target & Revision Aware, Server-Derived Expert Flag)
create table if not exists public.community_perception_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete cascade,
  contribution_id uuid references public.community_contributions(id) on delete cascade,
  target_type text not null default 'CASE' check (target_type in ('CASE', 'CLAIM', 'CONTRIBUTION')),
  vote text not null check (vote in ('BELIEVE', 'DOUBT')),
  voter_is_expert_at_vote boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists community_perception_revision_target_idx
  on public.community_perception_votes (
    user_id,
    case_id,
    case_revision,
    coalesce(claim_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(contribution_id, '00000000-0000-0000-0000-000000000000'::uuid),
    target_type
  );

create index if not exists community_perception_lookup_idx
  on public.community_perception_votes (case_id, case_revision, target_type);

alter table public.community_perception_votes enable row level security;
drop policy if exists community_perception_read_policy on public.community_perception_votes;
create policy community_perception_read_policy
  on public.community_perception_votes
  for select using (true);

drop policy if exists community_perception_write_policy on public.community_perception_votes;
create policy community_perception_write_policy
  on public.community_perception_votes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Community Perception Events (Append-Only Audit)
create table if not exists private.community_perception_events (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid references public.community_perception_votes(id) on delete set null,
  user_id uuid not null,
  case_id uuid not null,
  case_revision integer not null,
  claim_id uuid,
  contribution_id uuid,
  target_type text not null,
  vote text not null,
  voter_is_expert boolean not null,
  event_type text not null check (event_type in ('VOTE_CAST', 'VOTE_CHANGED', 'VOTE_REVOKED')),
  created_at timestamptz not null default now()
);

-- 4. Moderation System (Scoped strictly to Community content)
create table if not exists private.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('COMMUNITY_CONTRIBUTION', 'COMMUNITY_REACTION', 'COMMUNITY_PROFILE')),
  target_id uuid not null,
  target_author_id uuid not null references auth.users(id) on delete cascade,
  reported_by uuid references auth.users(id) on delete set null,
  reason_category text not null check (reason_category in ('SPAM', 'HARASSMENT', 'MISINFORMATION', 'PRIVACY_VIOLATION', 'ACADEMIC_DISHONESTY', 'OTHER')),
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED')),
  resolution text check (resolution is null or resolution in ('KEEP', 'LIMIT', 'REMOVE_FROM_PUBLIC_PROJECTION', 'ESCALATE')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moderation_cases_status_idx
  on private.moderation_cases (status, created_at desc);
create index if not exists moderation_cases_target_idx
  on private.moderation_cases (target_type, target_id);

-- 5. Moderation Votes (Private to qualified moderators)
create table if not exists private.moderation_votes (
  id uuid primary key default gen_random_uuid(),
  moderation_case_id uuid not null references private.moderation_cases(id) on delete cascade,
  moderator_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('KEEP', 'LIMIT', 'REMOVE_FROM_PUBLIC_PROJECTION', 'ESCALATE')),
  rationale text check (rationale is null or char_length(rationale) <= 1000),
  created_at timestamptz not null default now(),
  unique(moderation_case_id, moderator_id)
);

-- 6. Moderation Events (Append-Only Audit)
create table if not exists private.moderation_events (
  id uuid primary key default gen_random_uuid(),
  moderation_case_id uuid not null references private.moderation_cases(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('CASE_OPENED', 'VOTE_RECORDED', 'CASE_RESOLVED', 'CASE_DISMISSED', 'APPEAL_SUBMITTED', 'APPEAL_RESOLVED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 7. Moderation Appeals (Publicly accessible projection for appellants)
create table if not exists public.moderation_appeals (
  id uuid primary key default gen_random_uuid(),
  moderation_case_id uuid not null references private.moderation_cases(id) on delete cascade,
  appellant_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 10 and 2000),
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'REJECTED')),
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(moderation_case_id, appellant_id)
);

alter table public.moderation_appeals enable row level security;
drop policy if exists moderation_appeals_owner_policy on public.moderation_appeals;
create policy moderation_appeals_owner_policy
  on public.moderation_appeals
  for select using (auth.uid() = appellant_id);

-- 8. Append-Only Trigger Function
create or replace function private.reject_v3_history_mutation()
returns trigger
language plpgsql
security definer
as $$
begin
  raise exception 'Table % is an append-only audit log; updates and deletes are forbidden.', tg_table_name;
end;
$$;

drop trigger if exists community_perception_events_append_only on private.community_perception_events;
create trigger community_perception_events_append_only
before update or delete on private.community_perception_events
for each row execute function private.reject_v3_history_mutation();

drop trigger if exists moderation_events_append_only on private.moderation_events;
create trigger moderation_events_append_only
before update or delete on private.moderation_events
for each row execute function private.reject_v3_history_mutation();

commit;
