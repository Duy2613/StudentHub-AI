begin;

-- ==============================================================================
-- STUDENTHUB AI — CITADEL SECURITY OUTBOX HARDENING (I1)
-- ==============================================================================
-- Server-only database isolation and strict state machine transition validation.
-- Prevents Supabase PostgREST / browser access by isolating table to private schema.
-- Governed by Cross-System Constitution:
-- - Citadel outbox is private server-internal infrastructure.
-- - Ordinary anon/authenticated roles have 0 access.
-- ==============================================================================

-- 1. Ensure private schema exists
create schema if not exists private;

-- 2. Migrate existing public.security_outbox to private schema if present
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'security_outbox'
  ) and not exists (
    select 1 from information_schema.tables 
    where table_schema = 'private' and table_name = 'security_outbox'
  ) then
    alter table public.security_outbox set schema private;
  end if;
end $$;

-- 3. If private.security_outbox does not exist (clean bootstrap), create it
create table if not exists private.security_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null check (event_type ~ '^[a-z0-9][a-z0-9_.:-]{0,127}$'),
  schema_version text not null default 'studenthub-security-event-v1',
  classification text not null default 'INTERNAL' check (classification in ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED')),
  payload jsonb not null,
  payload_hash text not null check (octet_length(payload_hash) = 64 and payload_hash ~ '^[0-9a-f]{64}$'),
  delivery_state text not null default 'PENDING' check (delivery_state in ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'DEAD_LETTER')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  next_attempt_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  last_failure_code text,
  last_failure_reason text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. State Transition Machine Trigger
-- Enforces strictly defined transitions:
-- PENDING -> PROCESSING
-- PROCESSING -> DELIVERED, FAILED, DEAD_LETTER
-- FAILED -> PROCESSING, DEAD_LETTER
-- DELIVERED is terminal
-- DEAD_LETTER is terminal
create or replace function private.validate_security_outbox_transition()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.delivery_state = new.delivery_state then
    return new;
  end if;

  if old.delivery_state = 'DELIVERED' then
    raise exception 'INVALID_STATE_TRANSITION: DELIVERED is a terminal outbox state.';
  end if;

  if old.delivery_state = 'DEAD_LETTER' then
    raise exception 'INVALID_STATE_TRANSITION: DEAD_LETTER is a terminal outbox state.';
  end if;

  if old.delivery_state = 'PENDING' and new.delivery_state not in ('PROCESSING') then
    raise exception 'INVALID_STATE_TRANSITION: PENDING may only transition to PROCESSING (got %)', new.delivery_state;
  end if;

  if old.delivery_state = 'PROCESSING' and new.delivery_state not in ('DELIVERED', 'FAILED', 'DEAD_LETTER') then
    raise exception 'INVALID_STATE_TRANSITION: PROCESSING may only transition to DELIVERED, FAILED, or DEAD_LETTER (got %)', new.delivery_state;
  end if;

  if old.delivery_state = 'FAILED' and new.delivery_state not in ('PROCESSING', 'DEAD_LETTER') then
    raise exception 'INVALID_STATE_TRANSITION: FAILED may only transition to PROCESSING or DEAD_LETTER (got %)', new.delivery_state;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_security_outbox_state_transition on private.security_outbox;
create trigger trg_security_outbox_state_transition
before update of delivery_state on private.security_outbox
for each row execute function private.validate_security_outbox_transition();

-- 5. Composite indexes for claim and lease recovery
create index if not exists idx_security_outbox_claim
  on private.security_outbox(delivery_state, next_attempt_at)
  where delivery_state in ('PENDING', 'FAILED');

create index if not exists idx_security_outbox_lease_recovery
  on private.security_outbox(delivery_state, lease_expires_at)
  where delivery_state = 'PROCESSING';

-- 6. Strict schema and RLS boundaries
alter table private.security_outbox enable row level security;
revoke all on schema private from public, anon, authenticated;
revoke all on private.security_outbox from public, anon, authenticated;
grant select, insert, update, delete on private.security_outbox to service_role;

commit;
