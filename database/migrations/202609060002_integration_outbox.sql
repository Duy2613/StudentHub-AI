begin;

create schema if not exists private;

-- Outbox rows are the durable hand-off between a committed StudentHub case and
-- an optional external security system.  Delivery is at-least-once and the
-- receiver's event_id/payload_hash contract makes retries safe.
create table if not exists private.integration_outbox (
  id bigint generated always as identity primary key,
  event_id text not null unique check (char_length(event_id) between 1 and 180),
  integration text not null check (integration in ('LABBE')),
  aggregate_type text not null check (char_length(aggregate_type) between 1 and 80),
  aggregate_id text not null check (char_length(aggregate_id) between 1 and 160),
  event_type text not null check (char_length(event_type) between 1 and 160),
  schema_version text not null check (char_length(schema_version) between 1 and 80),
  occurred_at timestamptz not null,
  produced_at timestamptz not null,
  producer text not null check (char_length(producer) between 1 and 80),
  environment text not null check (char_length(environment) between 1 and 80),
  correlation_id text not null check (char_length(correlation_id) between 1 and 160),
  causation_id text,
  subject text not null check (char_length(subject) between 1 and 160),
  classification text not null check (classification in ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  payload_hash bytea not null check (octet_length(payload_hash) = 32),
  status text not null default 'PENDING' constraint integration_outbox_status_check
    check (status in ('PENDING','IN_FLIGHT','DELIVERED','FAILED','SHADOW','CONFLICT')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_token uuid,
  lease_count integer not null default 0 check (lease_count >= 0),
  shadow_count integer not null default 0 check (shadow_count >= 0),
  shadowed_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);
alter table private.integration_outbox add column if not exists schema_version text;
alter table private.integration_outbox add column if not exists occurred_at timestamptz;
alter table private.integration_outbox add column if not exists produced_at timestamptz;
alter table private.integration_outbox add column if not exists producer text;
alter table private.integration_outbox add column if not exists environment text;
alter table private.integration_outbox add column if not exists correlation_id text;
alter table private.integration_outbox add column if not exists causation_id text;
alter table private.integration_outbox add column if not exists subject text;
alter table private.integration_outbox add column if not exists classification text;
alter table private.integration_outbox add column if not exists lease_token uuid;
alter table private.integration_outbox add column if not exists lease_count integer not null default 0;
alter table private.integration_outbox add column if not exists shadow_count integer not null default 0;
alter table private.integration_outbox add column if not exists shadowed_at timestamptz;
alter table private.integration_outbox drop constraint if exists integration_outbox_status_check;
alter table private.integration_outbox add constraint integration_outbox_status_check
  check (status in ('PENDING','IN_FLIGHT','DELIVERED','FAILED','SHADOW','CONFLICT'));
create index if not exists integration_outbox_delivery_idx
  on private.integration_outbox(integration, status, available_at, created_at);

alter table private.integration_outbox enable row level security;
revoke all on private.integration_outbox from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update on private.integration_outbox to service_role;
grant usage, select on sequence private.integration_outbox_id_seq to service_role;

commit;
