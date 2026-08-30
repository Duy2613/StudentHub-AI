begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  verified_domains text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 120),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Upgrade the legacy profiles table without trusting or reusing its privileged
-- role/trust/verification columns as V2 authority.
alter table public.profiles add column if not exists institution_id uuid references public.institutions(id) on delete set null;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
update public.profiles p
set display_name = coalesce(p.display_name, nullif(to_jsonb(p)->>'full_name', ''), nullif(to_jsonb(p)->>'email', ''), 'StudentHub member')
where display_name is null;
alter table public.profiles alter column display_name set not null;

create table if not exists private.roles (
  id smallserial primary key,
  code text not null unique check (code in ('STUDENT','EXPERT','MODERATOR','ADMIN','SERVICE')),
  description text not null
);
insert into private.roles(code, description) values
  ('STUDENT','Standard authenticated user'),
  ('EXPERT','Domain-scoped verified expert'),
  ('MODERATOR','Community moderation operator'),
  ('ADMIN','Security and platform administrator'),
  ('SERVICE','Non-human workload identity')
on conflict (code) do nothing;

create table if not exists private.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id smallint not null references private.roles(id) on delete restrict,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role_id)
);

create table if not exists private.server_sessions (
  token_hash bytea primary key check (octet_length(token_hash) = 32),
  user_id uuid not null references auth.users(id) on delete cascade,
  auth_provider text not null default 'supabase',
  upstream_jti_hash bytea check (upstream_jti_hash is null or octet_length(upstream_jti_hash) = 32),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  idle_expires_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revocation_reason text,
  session_version integer not null default 1 check (session_version > 0),
  user_agent_hash bytea,
  constraint session_expiry_order check (created_at < expires_at and last_seen_at <= expires_at)
);
create index if not exists server_sessions_user_active_idx
  on private.server_sessions(user_id, expires_at desc) where revoked_at is null;
create unique index if not exists server_sessions_upstream_jti_unique
  on private.server_sessions(upstream_jti_hash) where upstream_jti_hash is not null;

create table if not exists private.audit_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  target_type text,
  target_id text,
  request_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(metadata) = 'object')
);
create index if not exists audit_events_actor_time_idx on private.audit_events(actor_id, occurred_at desc);
create index if not exists audit_events_type_time_idx on private.audit_events(event_type, occurred_at desc);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(title) between 5 and 200),
  content text not null check (char_length(content) between 20 and 20000),
  category text not null default 'GENERAL',
  location_tag text not null default 'CAMPUS',
  images text[] not null default '{}',
  links text[] not null default '{}',
  status text not null default 'PUBLISHED' check (status in ('DRAFT','PUBLISHED','PENDING_REVIEW','HIDDEN','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists posts_author_idx on public.posts(author_id, created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  content text not null check (char_length(content) between 1 and 5000),
  status text not null default 'PUBLISHED' check (status in ('PUBLISHED','PENDING_REVIEW','HIDDEN','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id, created_at);

create table if not exists public.votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.trust_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'INSUFFICIENT_EVIDENCE',
  visibility text not null default 'PRIVATE' check (visibility in ('PRIVATE','ANONYMIZED','PUBLIC')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.case_inputs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  input_type text not null,
  object_key text,
  content_hash bytea,
  created_at timestamptz not null default now()
);
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  normalized_value text not null,
  value_hash bytea not null,
  created_at timestamptz not null default now(),
  unique(entity_type, value_hash)
);
create table if not exists public.case_entities (
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  relation_type text not null,
  confidence numeric(5,4) check (confidence between 0 and 1),
  primary key(case_id, entity_id, relation_type)
);
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  source_type text not null,
  source_identifier text,
  observed_at timestamptz not null,
  extractor_version text,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete set null,
  statement text not null check (char_length(statement) between 1 and 10000),
  status text not null default 'UNVERIFIED',
  valid_from timestamptz,
  valid_to timestamptz,
  superseded_by uuid references public.claims(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.claim_sources (
  claim_id uuid not null references public.claims(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  relation text not null check (relation in ('SUPPORTS','CONTRADICTS','CONTEXT')),
  primary key(claim_id, evidence_id)
);

create table if not exists public.expert_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_title text,
  public_bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists private.expert_domains (
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  primary key(user_id, domain_code)
);
create table if not exists private.expert_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null,
  status text not null check (status in ('PENDING','VERIFIED','REJECTED','REVOKED')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  evidence_ref text,
  unique(user_id, domain_code)
);
create table if not exists public.expert_assessments (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references auth.users(id) on delete restrict,
  case_id uuid not null references public.trust_cases(id) on delete cascade,
  domain_code text not null,
  assessment jsonb not null,
  confidence numeric(5,4) check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique(expert_id, case_id, domain_code)
);
create table if not exists private.reputation_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_code text not null,
  event_type text not null,
  delta numeric(10,4) not null,
  reason text not null,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.trust_cases enable row level security;
alter table public.case_inputs enable row level security;
alter table public.entities enable row level security;
alter table public.case_entities enable row level security;
alter table public.evidence enable row level security;
alter table public.claims enable row level security;
alter table public.claim_sources enable row level security;
alter table public.expert_profiles enable row level security;
alter table public.expert_assessments enable row level security;
alter table private.server_sessions enable row level security;
alter table private.user_roles enable row level security;
alter table private.expert_verifications enable row level security;
alter table private.expert_domains enable row level security;
alter table private.reputation_events enable row level security;
alter table private.audit_events enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists profiles_own_select on public.profiles;
create policy profiles_own_select on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_own_insert on public.profiles;
create policy profiles_own_insert on public.profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select using (status = 'PUBLISHED' or auth.uid() = author_id);
drop policy if exists posts_own_insert on public.posts;
create policy posts_own_insert on public.posts for insert with check (auth.uid() = author_id);
drop policy if exists posts_own_update on public.posts;
create policy posts_own_update on public.posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments for select using (status = 'PUBLISHED' or auth.uid() = author_id);
drop policy if exists comments_own_insert on public.comments;
create policy comments_own_insert on public.comments for insert with check (auth.uid() = author_id);
-- Vote rows contain user_id and are never exposed directly to browser roles.
-- Public vote counts are produced by server-side aggregate queries instead.
drop policy if exists votes_public_read on public.votes;
drop policy if exists votes_own_write on public.votes;
create policy votes_own_write on public.votes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists trust_cases_own on public.trust_cases;
create policy trust_cases_own on public.trust_cases for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists case_inputs_own on public.case_inputs;
create policy case_inputs_own on public.case_inputs for all using (exists(select 1 from public.trust_cases c where c.id=case_id and c.owner_id=auth.uid())) with check (exists(select 1 from public.trust_cases c where c.id=case_id and c.owner_id=auth.uid()));
drop policy if exists evidence_own on public.evidence;
create policy evidence_own on public.evidence for all using (exists(select 1 from public.trust_cases c where c.id=case_id and c.owner_id=auth.uid())) with check (exists(select 1 from public.trust_cases c where c.id=case_id and c.owner_id=auth.uid()));

revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.roles, private.user_roles, private.server_sessions,
  private.expert_domains, private.expert_verifications, private.reputation_events to service_role;
grant select, insert on private.audit_events to service_role;
grant usage, select on all sequences in schema private to service_role;
grant usage on schema public to anon, authenticated;
-- Browser roles may read the public forum projection, but author_id is an
-- identity join key and must never be exposed through direct PostgREST reads.
-- Server-side repository queries use service_role and can perform the private
-- join needed to build the redacted DTO.
revoke select on public.posts, public.comments from anon, authenticated;
grant select(id, category, location_tag, title, content, images, links, status, created_at, updated_at) on public.posts to anon, authenticated;
grant select(id, post_id, content, status, created_at, updated_at) on public.comments to anon, authenticated;
revoke all on public.profiles from public, anon, authenticated;
grant select(id, institution_id, display_name, avatar_url, bio, created_at, updated_at) on public.profiles to authenticated;
grant insert(id, institution_id, display_name, avatar_url, bio) on public.profiles to authenticated;
grant update(display_name, avatar_url, bio, institution_id) on public.profiles to authenticated;
grant insert, update, delete on public.posts, public.comments, public.votes to authenticated;

create or replace function public.handle_new_user_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'StudentHub member'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  insert into private.user_roles(user_id, role_id)
  select new.id, id from private.roles where code = 'STUDENT'
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_v2 on auth.users;
create trigger on_auth_user_created_v2 after insert on auth.users
for each row execute function public.handle_new_user_v2();
revoke execute on function public.handle_new_user_v2() from public, anon, authenticated;

commit;
