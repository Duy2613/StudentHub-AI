begin;

-- ==============================================================================
-- STUDENTHUB AI — CITADEL SECURITY TRANSACTIONAL OUTBOX (I1)
-- ==============================================================================
-- Atomic security event boundary for export to GovSec Citadel.
-- Governed by Cross-System Constitution:
-- - StudentHub owns TrustDecision, persistence, and product availability.
-- - Outbox inserts commit atomically with Trust Cases.
-- - Citadel is NEVER a synchronous dependency of product execution.
-- ==============================================================================

create table if not exists public.security_outbox (
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

create index if not exists idx_security_outbox_claim
  on public.security_outbox(delivery_state, next_attempt_at)
  where delivery_state in ('PENDING', 'FAILED');

create index if not exists idx_security_outbox_lease
  on public.security_outbox(lease_expires_at)
  where lease_expires_at is not null;

alter table public.security_outbox enable row level security;
revoke all on public.security_outbox from public, anon, authenticated;
grant select, insert, update, delete on public.security_outbox to service_role;

commit;
