begin;

-- StudentHub AI — Expert Trust Network V3 integrity closure.
-- Forward-only: the original Phase F migration remains historical input. This
-- migration closes authority, target-consistency, audit-retention, and grant
-- gaps without touching Main Supabase data.

-- 1. Domain-scoped progression projections.
alter table public.expert_progression_projections
  drop constraint if exists expert_progression_projections_pkey;
alter table public.expert_progression_projections
  add constraint expert_progression_projections_pkey
  primary key (user_id, domain_code);

-- 2. Perception target consistency and server-only mutation.
alter table public.community_perception_votes
  drop constraint if exists community_perception_votes_target_consistency_check;
alter table public.community_perception_votes
  add constraint community_perception_votes_target_consistency_check
  check (
    (target_type = 'CASE' and claim_id is null and contribution_id is null)
    or (target_type = 'CLAIM' and claim_id is not null and contribution_id is null)
    or (target_type = 'CONTRIBUTION' and claim_id is null and contribution_id is not null)
  );

alter table private.community_perception_events
  add column if not exists user_snapshot jsonb not null default '{}'::jsonb;
alter table private.community_perception_events
  drop constraint if exists community_perception_events_target_consistency_check;
alter table private.community_perception_events
  add constraint community_perception_events_target_consistency_check
  check (
    (target_type = 'CASE' and claim_id is null and contribution_id is null)
    or (target_type = 'CLAIM' and claim_id is not null and contribution_id is null)
    or (target_type = 'CONTRIBUTION' and claim_id is null and contribution_id is not null)
  );

drop policy if exists community_perception_write_policy on public.community_perception_votes;
revoke insert, update, delete on public.community_perception_votes from public, anon, authenticated;
grant select on public.community_perception_votes to anon, authenticated;
grant select, insert, update on public.community_perception_votes to service_role;

-- Even trusted server code cannot persist a client-supplied expert flag. The
-- trigger derives it from the current, qualified verification row.
create or replace function private.derive_community_perception_expert_flag()
returns trigger
language plpgsql
set search_path = private, public, pg_catalog
as $$
begin
  new.voter_is_expert_at_vote := exists (
    select 1
      from private.expert_verifications ev
     where ev.user_id = new.user_id
       and ev.status = 'VERIFIED'
       and ev.qualification_state = 'DOMAIN_VERIFIED'
       and ev.suspended_at is null
       and (ev.expires_at is null or ev.expires_at > now())
  );
  return new;
end;
$$;
revoke all on function private.derive_community_perception_expert_flag() from public, anon, authenticated;
grant execute on function private.derive_community_perception_expert_flag() to service_role;
drop trigger if exists community_perception_expert_flag_derive on public.community_perception_votes;
create trigger community_perception_expert_flag_derive
before insert or update of user_id, voter_is_expert_at_vote
on public.community_perception_votes
for each row execute function private.derive_community_perception_expert_flag();

-- 3. Moderation scope is V1-safe: only contributions have a non-destructive
-- public projection action. Reaction/profile target types are removed until a
-- separate projection and action contract exists.
alter table private.moderation_cases
  drop constraint if exists moderation_cases_target_type_check;
alter table private.moderation_cases
  add constraint moderation_cases_target_type_check
  check (target_type = 'COMMUNITY_CONTRIBUTION');

alter table private.moderation_cases
  alter column target_author_id drop not null;
alter table private.moderation_cases
  drop constraint if exists moderation_cases_target_author_id_fkey;
alter table private.moderation_cases
  add constraint moderation_cases_target_author_id_fkey
  foreign key (target_author_id) references auth.users(id) on delete set null;
alter table private.moderation_cases
  add column if not exists target_author_snapshot jsonb not null default '{}'::jsonb;
alter table private.moderation_cases
  add column if not exists reporter_snapshot jsonb not null default '{}'::jsonb;

-- Preserve audit rows when principals or cases are removed. Identity snapshots
-- remain in the audit row after the FK is set NULL.
alter table private.moderation_votes
  alter column moderation_case_id drop not null;
alter table private.moderation_votes
  drop constraint if exists moderation_votes_moderation_case_id_fkey;
alter table private.moderation_votes
  add constraint moderation_votes_moderation_case_id_fkey
  foreign key (moderation_case_id) references private.moderation_cases(id) on delete set null;
alter table private.moderation_votes
  alter column moderator_id drop not null;
alter table private.moderation_votes
  drop constraint if exists moderation_votes_moderator_id_fkey;
alter table private.moderation_votes
  add constraint moderation_votes_moderator_id_fkey
  foreign key (moderator_id) references auth.users(id) on delete set null;
alter table private.moderation_votes
  add column if not exists policy_version text not null default 'community-moderation-v2';
alter table private.moderation_votes
  add column if not exists qualification_state text not null default 'LEGACY_UNKNOWN';
alter table private.moderation_votes
  add column if not exists quality_sufficiency text not null default 'LEGACY_UNKNOWN';
alter table private.moderation_votes
  add column if not exists verification_id uuid references private.expert_verifications(id) on delete set null;
alter table private.moderation_votes
  add column if not exists verification_revision integer;
alter table private.moderation_votes
  add column if not exists coi_state text not null default 'LEGACY_UNKNOWN';
alter table private.moderation_votes
  add column if not exists eligibility_result text not null default 'LEGACY_UNKNOWN';
alter table private.moderation_votes
  add column if not exists eligibility_snapshot jsonb not null default '{}'::jsonb;
alter table private.moderation_votes
  add column if not exists moderator_snapshot jsonb not null default '{}'::jsonb;
alter table private.moderation_votes
  drop constraint if exists moderation_votes_snapshot_check;
alter table private.moderation_votes
  add constraint moderation_votes_snapshot_check
  check (
    qualification_state in ('DOMAIN_VERIFIED', 'LEGACY_UNKNOWN')
    and quality_sufficiency in ('SUFFICIENT', 'INSUFFICIENT', 'LEGACY_UNKNOWN')
    and coi_state in ('CLEAR', 'CONFLICT', 'LEGACY_UNKNOWN')
    and eligibility_result in ('ELIGIBLE', 'INELIGIBLE', 'LEGACY_UNKNOWN')
    and jsonb_typeof(eligibility_snapshot) = 'object'
    and jsonb_typeof(moderator_snapshot) = 'object'
  );

alter table private.moderation_events
  alter column moderation_case_id drop not null;
alter table private.moderation_events
  drop constraint if exists moderation_events_moderation_case_id_fkey;
alter table private.moderation_events
  add constraint moderation_events_moderation_case_id_fkey
  foreign key (moderation_case_id) references private.moderation_cases(id) on delete set null;
alter table private.moderation_events
  alter column actor_id drop not null;
alter table private.moderation_events
  drop constraint if exists moderation_events_actor_id_fkey;
alter table private.moderation_events
  add constraint moderation_events_actor_id_fkey
  foreign key (actor_id) references auth.users(id) on delete set null;
alter table private.moderation_events
  add column if not exists actor_snapshot jsonb not null default '{}'::jsonb;

alter table public.moderation_appeals
  alter column moderation_case_id drop not null;
alter table public.moderation_appeals
  drop constraint if exists moderation_appeals_moderation_case_id_fkey;
alter table public.moderation_appeals
  add constraint moderation_appeals_moderation_case_id_fkey
  foreign key (moderation_case_id) references private.moderation_cases(id) on delete set null;
alter table public.moderation_appeals
  alter column appellant_id drop not null;
alter table public.moderation_appeals
  drop constraint if exists moderation_appeals_appellant_id_fkey;
alter table public.moderation_appeals
  add constraint moderation_appeals_appellant_id_fkey
  foreign key (appellant_id) references auth.users(id) on delete set null;
alter table public.moderation_appeals
  add column if not exists appellant_snapshot jsonb not null default '{}'::jsonb;
alter table public.moderation_appeals
  add column if not exists reviewer_snapshot jsonb not null default '{}'::jsonb;

drop trigger if exists moderation_votes_append_only on private.moderation_votes;
create trigger moderation_votes_append_only
before update or delete on private.moderation_votes
for each row execute function private.reject_v3_history_mutation();

-- 4. Private moderation/perception tables are server-owned. RLS is defense in
-- depth; the explicit grants prevent direct Data API writes by students.
alter table private.community_perception_events enable row level security;
alter table private.moderation_cases enable row level security;
alter table private.moderation_votes enable row level security;
alter table private.moderation_events enable row level security;

revoke all on private.community_perception_events, private.moderation_cases,
  private.moderation_votes, private.moderation_events from public, anon, authenticated;
grant select, insert on private.community_perception_events to service_role;
grant select, insert, update on private.moderation_cases to service_role;
grant select, insert on private.moderation_votes, private.moderation_events to service_role;

revoke insert, update, delete on public.moderation_appeals from public, anon, authenticated;
grant select on public.moderation_appeals to authenticated;
grant select, insert, update on public.moderation_appeals to service_role;

revoke insert, update, delete on public.expert_progression_projections from public, anon, authenticated;
grant select on public.expert_progression_projections to anon, authenticated;
grant select, insert, update on public.expert_progression_projections to service_role;

-- Audit rows are immutable, while case state remains mutable through the
-- service repository until a quorum-backed finalization.

commit;
