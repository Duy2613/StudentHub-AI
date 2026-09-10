begin;

-- Forward-only closure for the Expert -> Trust authority boundary.
-- Existing rows remain readable as legacy history (snapshot version 0). New
-- submissions written by the Promax repository must carry version 1 below.
-- This migration never drops, truncates, resets, or seeds application data.

alter table private.expert_verifications
  add column if not exists revision integer not null default 1;
alter table private.expert_verifications
  drop constraint if exists expert_verifications_revision_check;
alter table private.expert_verifications
  add constraint expert_verifications_revision_check check (revision >= 1);

create or replace function private.bump_expert_verification_revision()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status
       or new.qualification_state is distinct from old.qualification_state
       or new.domain_code is distinct from old.domain_code
       or new.verified_by is distinct from old.verified_by
       or new.verified_at is distinct from old.verified_at
       or new.evidence_ref is distinct from old.evidence_ref
       or new.expires_at is distinct from old.expires_at
       or new.suspended_at is distinct from old.suspended_at then
      new.revision := old.revision + 1;
    else
      new.revision := old.revision;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists expert_verifications_revision_bump on private.expert_verifications;
create trigger expert_verifications_revision_bump
before update on private.expert_verifications
for each row execute function private.bump_expert_verification_revision();

alter table private.expert_assignments
  add column if not exists revision integer not null default 1;
alter table private.expert_assignments
  drop constraint if exists expert_assignments_revision_check;
alter table private.expert_assignments
  add constraint expert_assignments_revision_check check (revision >= 1);

create or replace function private.bump_expert_assignment_revision()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  if tg_op = 'UPDATE' then
    if new.expert_id is distinct from old.expert_id
       or new.case_id is distinct from old.case_id
       or new.case_revision is distinct from old.case_revision
       or new.claim_id is distinct from old.claim_id
       or new.domain_code is distinct from old.domain_code
       or new.status is distinct from old.status
       or new.assigned_by is distinct from old.assigned_by
       or new.conflict_of_interest is distinct from old.conflict_of_interest
       or new.conflict_reason is distinct from old.conflict_reason
       or new.expires_at is distinct from old.expires_at then
      new.revision := old.revision + 1;
    else
      new.revision := old.revision;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists expert_assignments_revision_bump on private.expert_assignments;
create trigger expert_assignments_revision_bump
before update on private.expert_assignments
for each row execute function private.bump_expert_assignment_revision();

alter table public.expert_assessments
  add column if not exists verification_id uuid references private.expert_verifications(id) on delete restrict;
alter table public.expert_assessments
  add column if not exists verification_revision integer;
alter table public.expert_assessments
  add column if not exists verified_domain text;
alter table public.expert_assessments
  add column if not exists verification_status text;
alter table public.expert_assessments
  add column if not exists verification_qualification_state text;
alter table public.expert_assessments
  add column if not exists verification_expires_at timestamptz;
alter table public.expert_assessments
  add column if not exists verification_suspended_at timestamptz;
alter table public.expert_assessments
  add column if not exists assignment_revision integer;
alter table public.expert_assessments
  add column if not exists coi_state text not null default 'LEGACY_UNKNOWN';
alter table public.expert_assessments
  add column if not exists coi_declaration_ref text;
alter table public.expert_assessments
  add column if not exists qualification_policy_version text not null default 'expert-qualification-v1';
alter table public.expert_assessments
  add column if not exists submitted_at timestamptz;
alter table public.expert_assessments
  add column if not exists authority_snapshot_version integer not null default 0;
alter table public.expert_assessments
  add column if not exists authority_snapshot_digest bytea;
alter table public.expert_assessments
  add column if not exists authority_snapshot jsonb not null default '{}'::jsonb;

alter table public.expert_assessments
  drop constraint if exists expert_assessments_verification_revision_check;
alter table public.expert_assessments
  add constraint expert_assessments_verification_revision_check
  check (verification_revision is null or verification_revision >= 1);
alter table public.expert_assessments
  drop constraint if exists expert_assessments_assignment_revision_check;
alter table public.expert_assessments
  add constraint expert_assessments_assignment_revision_check
  check (assignment_revision is null or assignment_revision >= 1);
alter table public.expert_assessments
  drop constraint if exists expert_assessments_coi_state_check;
alter table public.expert_assessments
  add constraint expert_assessments_coi_state_check
  check (coi_state in ('LEGACY_UNKNOWN','DECLARED_NO_CONFLICT','CONFLICT_DECLARED','NOT_DECLARED'));
alter table public.expert_assessments
  drop constraint if exists expert_assessments_qualification_policy_check;
alter table public.expert_assessments
  add constraint expert_assessments_qualification_policy_check
  check (char_length(qualification_policy_version) between 1 and 120);
alter table public.expert_assessments
  drop constraint if exists expert_assessments_authority_snapshot_digest_check;
alter table public.expert_assessments
  add constraint expert_assessments_authority_snapshot_digest_check
  check (authority_snapshot_digest is null or octet_length(authority_snapshot_digest) = 32);
alter table public.expert_assessments
  drop constraint if exists expert_assessments_authority_snapshot_check;
alter table public.expert_assessments
  add constraint expert_assessments_authority_snapshot_check
  check (jsonb_typeof(authority_snapshot) = 'object');
alter table public.expert_assessments
  drop constraint if exists expert_assessments_authority_snapshot_version_check;
alter table public.expert_assessments
  add constraint expert_assessments_authority_snapshot_version_check
  check (
    authority_snapshot_version = 0
    or (
      authority_snapshot_version = 1
      and verification_id is not null
      and verification_revision is not null
      and verified_domain is not null
      and verification_status = 'VERIFIED'
      and verification_qualification_state = 'DOMAIN_VERIFIED'
      and assignment_id is not null
      and assignment_revision is not null
      and coi_declared = true
      and coi_state = 'DECLARED_NO_CONFLICT'
      and coi_declaration_ref is not null
      and submitted_at is not null
      and authority_snapshot_digest is not null
      and authority_snapshot->>'snapshotVersion' = '1'
      and authority_snapshot->>'verificationId' = verification_id::text
      and authority_snapshot->>'assignmentId' = assignment_id::text
      and authority_snapshot->>'verifiedDomain' = verified_domain
    )
  );

create index if not exists expert_assessments_verification_lineage_idx
  on public.expert_assessments(verification_id, verification_revision);
create index if not exists expert_assessments_assignment_lineage_idx
  on public.expert_assessments(assignment_id, assignment_revision);

commit;
