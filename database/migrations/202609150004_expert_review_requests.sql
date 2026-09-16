-- StudentHub AI — durable Trust -> Expert review-request handoff.
-- A requester creates a bounded question.  Assignment remains a separate,
-- coordinator-controlled authority transition in private.expert_assignments.
create schema if not exists private;

create table if not exists private.expert_review_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  case_revision integer not null check (case_revision >= 1),
  claim_id uuid references public.claims(id) on delete set null,
  domain_code text not null check (char_length(domain_code) between 1 and 80),
  question text not null check (char_length(question) between 20 and 4000),
  context_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(context_refs) = 'array'),
  status text not null default 'REQUESTED' check (status in (
    'REQUESTED','MATCHING','ASSIGNED','IN_REVIEW','COMPLETED','CANCELLED','EXPIRED'
  )),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, idempotency_key)
);

create index if not exists expert_review_requests_requester_idx
  on private.expert_review_requests(requester_id, created_at desc);
create index if not exists expert_review_requests_case_idx
  on private.expert_review_requests(case_id, case_revision, claim_id, created_at desc);
create unique index if not exists expert_review_requests_active_scope_idx
  on private.expert_review_requests(
    requester_id,
    case_id,
    case_revision,
    coalesce(claim_id, '00000000-0000-0000-0000-000000000000'::uuid),
    domain_code
  )
  where status in ('REQUESTED','MATCHING','ASSIGNED','IN_REVIEW');

create table if not exists private.expert_review_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references private.expert_review_requests(id) on delete cascade,
  status text not null check (status in (
    'REQUESTED','MATCHING','ASSIGNED','IN_REVIEW','COMPLETED','CANCELLED','EXPIRED'
  )),
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists expert_review_request_events_lookup_idx
  on private.expert_review_request_events(request_id, created_at asc);

alter table private.expert_assignments
  add column if not exists review_request_id uuid references private.expert_review_requests(id) on delete set null;
create index if not exists expert_assignments_review_request_idx
  on private.expert_assignments(review_request_id, created_at asc)
  where review_request_id is not null;

alter table private.expert_review_requests enable row level security;
alter table private.expert_review_request_events enable row level security;

revoke all on private.expert_review_requests, private.expert_review_request_events from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update on private.expert_review_requests to service_role;
grant select, insert on private.expert_review_request_events to service_role;

-- Request history is append-only.  The request projection itself may advance
-- through the state machine; only its event ledger is immutable.
create or replace function private.reject_expert_review_request_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'EXPERT_REVIEW_REQUEST_EVENT_IMMUTABLE' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists expert_review_request_events_no_mutation on private.expert_review_request_events;
create trigger expert_review_request_events_no_mutation
before update or delete on private.expert_review_request_events
for each row execute function private.reject_expert_review_request_event_mutation();
