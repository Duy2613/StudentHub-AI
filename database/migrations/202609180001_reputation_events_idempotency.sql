-- StudentHub AI — Migration: Reputation Events Idempotency Constraint
-- Enforces database-level uniqueness on idempotency_key for append-only reputation ledger.

alter table if exists private.reputation_events
  add column if not exists idempotency_key text unique;

create index if not exists idx_reputation_events_user_id
  on private.reputation_events(user_id);
