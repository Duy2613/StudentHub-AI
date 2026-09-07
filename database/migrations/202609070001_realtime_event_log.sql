begin;

-- The event log is the recovery source for realtime projections.  Broadcast
-- delivery is still at-least-once; consumers resume from sequence and
-- deduplicate by event_id/idempotency_key.
create schema if not exists private;

create table if not exists private.realtime_events (
  sequence bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  channel text not null check (channel ~ '^[a-z][a-z0-9._:-]{0,127}$'),
  event_type text not null check (event_type ~ '^[a-z][a-z0-9._:-]{0,127}$'),
  subject_id uuid references auth.users(id) on delete set null,
  classification text not null default 'INTERNAL'
    check (classification in ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED')),
  producer text not null check (char_length(producer) between 1 and 120),
  environment text not null check (char_length(environment) between 1 and 80),
  correlation_id text not null check (char_length(correlation_id) between 1 and 160),
  causation_id text check (causation_id is null or char_length(causation_id) between 1 and 160),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  payload_hash bytea not null check (octet_length(payload_hash) = 32),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  expires_at timestamptz,
  check (expires_at is null or expires_at > recorded_at),
  unique(channel, idempotency_key)
);

create index if not exists realtime_events_channel_sequence_idx
  on private.realtime_events(channel, sequence);
create index if not exists realtime_events_subject_channel_sequence_idx
  on private.realtime_events(subject_id, channel, sequence);
create index if not exists realtime_events_recorded_idx
  on private.realtime_events(recorded_at, sequence);

alter table private.realtime_events enable row level security;
revoke all on private.realtime_events from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert on private.realtime_events to service_role;
grant usage, select on sequence private.realtime_events_sequence_seq to service_role;

-- Event history is append-only. Retention is handled by partition/drop policy
-- owned by the platform operator, not by a request-scoped web role.
create or replace function private.reject_realtime_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  raise exception 'realtime event log is append-only';
end;
$$;

drop trigger if exists realtime_events_no_update on private.realtime_events;
create trigger realtime_events_no_update
before update on private.realtime_events
for each row execute function private.reject_realtime_event_mutation();

drop trigger if exists realtime_events_no_delete on private.realtime_events;
create trigger realtime_events_no_delete
before delete on private.realtime_events
for each row execute function private.reject_realtime_event_mutation();

revoke execute on function private.reject_realtime_event_mutation() from public, anon, authenticated;

commit;
