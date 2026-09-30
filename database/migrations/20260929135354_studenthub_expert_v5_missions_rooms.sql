-- Expert V5: real-source missions and evidence-based verification rooms.
-- This migration defines durable contracts only. It contains no synthetic
-- source/question/room/reputation data and must be applied by the approved
-- staging migration owner before any live assurance run.

alter table if exists private.reputation_events
  add column if not exists context jsonb not null default '{}'::jsonb;

create table if not exists private.expert_v5_config (
  config_key text primary key check (char_length(config_key) between 1 and 100),
  config_value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Five mission levels are an explicit learning progression. They are separate
-- from professional credentials and from ExpertReputationPolicy stars.
create table if not exists private.expert_mission_level_policy (
  mission_level smallint primary key check (mission_level between 1 and 5),
  completed_missions_required integer not null unique check (completed_missions_required >= 0),
  allowed_difficulties text[] not null check (cardinality(allowed_difficulties) > 0),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  check (allowed_difficulties <@ array['EASY','MEDIUM','HARD']::text[])
);

insert into private.expert_mission_level_policy
  (mission_level, completed_missions_required, allowed_difficulties)
values
  (1, 0,  array['EASY']::text[]),
  (2, 5,  array['EASY','MEDIUM']::text[]),
  (3, 15, array['MEDIUM']::text[]),
  (4, 30, array['MEDIUM','HARD']::text[]),
  (5, 50, array['HARD']::text[])
on conflict (mission_level) do nothing;

insert into private.expert_v5_config(config_key, config_value)
values
  ('mission_timezone', '"Asia/Ho_Chi_Minh"'::jsonb),
  ('question_validity_days', '30'::jsonb),
  ('mission_attempt_seconds', '180'::jsonb),
  ('room_answer_seconds', '30'::jsonb),
  ('room_participant_limit', '6'::jsonb),
  ('room_presence_lease_seconds', '45'::jsonb),
  ('room_supervisor_offer_seconds', '90'::jsonb),
  ('room_daily_reputation_cap', '5'::jsonb),
  ('room_score_threshold_earned', '70'::jsonb),
  ('room_score_threshold_excellent', '95'::jsonb),
  ('room_reputation_delta_earned', '1'::jsonb),
  ('room_reputation_delta_excellent', '2'::jsonb),
  ('room_ingestion_lease_seconds', '180'::jsonb)
on conflict (config_key) do nothing;

create table if not exists private.expert_v5_source_registry (
  id uuid primary key default gen_random_uuid(),
  canonical_host text not null unique check (char_length(canonical_host) between 1 and 253),
  domain_code text not null check (char_length(domain_code) between 2 and 80),
  category text not null check (char_length(category) between 2 and 80),
  fetch_policy text not null default 'TRUST_PUBLIC_RETRIEVAL' check (fetch_policy in ('TRUST_PUBLIC_RETRIEVAL')),
  license_notes text not null check (char_length(license_notes) between 1 and 1000),
  enabled boolean not null default false,
  max_requests_per_day integer not null default 10 check (max_requests_per_day between 1 and 1000),
  min_request_interval_seconds integer not null default 60 check (min_request_interval_seconds between 1 and 86400),
  requests_in_window integer not null default 0 check (requests_in_window between 0 and 1000),
  window_started_at timestamptz not null default now(),
  last_request_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expert_v5_source_registry_creator_idx
  on private.expert_v5_source_registry(created_by);

create table if not exists private.expert_v5_source_events (
  id bigint generated always as identity primary key,
  source_id uuid not null references private.expert_v5_source_registry(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'REGISTERED','POLICY_UPDATED','ENABLED','DISABLED',
    'INGEST_SUCCEEDED','INGEST_BLOCKED','INGEST_UNAVAILABLE'
  )),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16384),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now()
);
create index if not exists expert_v5_source_events_lookup_idx
  on private.expert_v5_source_events(source_id, created_at desc);
create index if not exists expert_v5_source_events_actor_idx
  on private.expert_v5_source_events(actor_id, created_at desc);

create table if not exists private.expert_v5_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references private.expert_v5_source_registry(id) on delete restrict,
  requested_url text not null check (char_length(requested_url) between 9 and 2048),
  canonical_url text check (canonical_url is null or char_length(canonical_url) between 9 and 2048),
  title text check (title is null or char_length(title) <= 500),
  publisher text check (publisher is null or char_length(publisher) <= 300),
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  source_type text not null default 'PUBLIC_WEB' check (source_type in ('PUBLIC_WEB','OFFICIAL_DOCUMENTATION','GOVERNMENT','UNIVERSITY','RESEARCH','PUBLIC_DATASET')),
  content_hash text check (content_hash is null or content_hash ~ '^[a-fA-F0-9]{64}$'),
  retrieval_status text not null check (retrieval_status in ('SUCCESS','BLOCKED','UNAVAILABLE')),
  blocked_reason text check (blocked_reason is null or char_length(blocked_reason) <= 120),
  ingestion_key text not null unique check (char_length(ingestion_key) between 1 and 180),
  evidence_items jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_items) = 'array'),
  provider_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_metadata) = 'object'),
  created_at timestamptz not null default now(),
  check (pg_column_size(evidence_items) <= 16384),
  check ((retrieval_status = 'SUCCESS' and canonical_url is not null and content_hash is not null)
      or retrieval_status <> 'SUCCESS')
);
create index if not exists expert_v5_source_snapshots_source_retrieved_idx
  on private.expert_v5_source_snapshots(source_id, retrieved_at desc);
create unique index if not exists expert_v5_source_snapshots_hash_idx
  on private.expert_v5_source_snapshots(source_id, content_hash)
  where content_hash is not null;

create table if not exists private.expert_v5_ingestion_requests (
  ingestion_key text primary key check (char_length(ingestion_key) between 1 and 180),
  source_id uuid not null references private.expert_v5_source_registry(id) on delete restrict,
  requested_url text not null check (char_length(requested_url) between 9 and 2048),
  state text not null default 'PROCESSING' check (state in ('PROCESSING','COMPLETED')),
  lease_expires_at timestamptz not null,
  snapshot_id uuid references private.expert_v5_source_snapshots(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((state = 'PROCESSING' and snapshot_id is null) or (state = 'COMPLETED' and snapshot_id is not null))
);
create index if not exists expert_v5_ingestion_requests_lease_idx
  on private.expert_v5_ingestion_requests(state, lease_expires_at);
create index if not exists expert_v5_ingestion_requests_source_idx
  on private.expert_v5_ingestion_requests(source_id, created_at desc);
create index if not exists expert_v5_ingestion_requests_snapshot_idx
  on private.expert_v5_ingestion_requests(snapshot_id) where snapshot_id is not null;

create table if not exists private.expert_v5_questions (
  question_id uuid not null default gen_random_uuid(),
  question_version integer not null default 1 check (question_version > 0),
  source_snapshot_id uuid not null references private.expert_v5_source_snapshots(id) on delete restrict,
  domain_code text not null check (char_length(domain_code) between 2 and 80),
  question_type text not null check (question_type in ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE')),
  difficulty text not null check (difficulty in ('EASY','MEDIUM','HARD')),
  prompt text not null check (char_length(prompt) between 20 and 1200),
  choices jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array'),
  answer_key jsonb not null,
  explanation text not null check (char_length(explanation) between 20 and 2400),
  evidence_refs jsonb not null check (jsonb_typeof(evidence_refs) = 'array' and jsonb_array_length(evidence_refs) > 0),
  difficulty_features jsonb not null default '{}'::jsonb check (jsonb_typeof(difficulty_features) = 'object'),
  source_content_hash text not null check (source_content_hash ~ '^[a-fA-F0-9]{64}$'),
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','REVALIDATION_REQUIRED','RETIRED')),
  valid_until timestamptz,
  editorial_reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (question_id, question_version),
  check ((status <> 'ACTIVE') or (editorial_reviewer_id is not null and reviewed_at is not null))
);
create index if not exists expert_v5_questions_active_domain_difficulty_idx
  on private.expert_v5_questions(domain_code, difficulty, created_at desc)
  where status = 'ACTIVE';
create index if not exists expert_v5_questions_source_snapshot_idx
  on private.expert_v5_questions(source_snapshot_id);
create index if not exists expert_v5_questions_reviewer_idx
  on private.expert_v5_questions(editorial_reviewer_id) where editorial_reviewer_id is not null;
create index if not exists expert_v5_questions_creator_idx
  on private.expert_v5_questions(created_by) where created_by is not null;

create table if not exists private.expert_v5_question_events (
  id bigint generated always as identity primary key,
  question_id uuid not null,
  question_version integer not null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('DRAFT_CREATED','ACTIVATED','REVALIDATION_REQUIRED','RETIRED')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16384),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now(),
  foreign key (question_id, question_version) references private.expert_v5_questions(question_id, question_version) on delete restrict
);
create index if not exists expert_v5_question_events_lookup_idx
  on private.expert_v5_question_events(question_id, question_version, created_at);
create index if not exists expert_v5_question_events_actor_idx
  on private.expert_v5_question_events(actor_id, created_at desc);

create table if not exists private.expert_mission_progression (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_missions integer not null default 0 check (completed_missions >= 0),
  mission_level smallint not null default 1 check (mission_level between 1 and 5),
  updated_at timestamptz not null default now()
);

create table if not exists private.expert_daily_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_date date not null,
  timezone text not null check (char_length(timezone) between 1 and 80),
  mission_type text not null check (mission_type in ('SOURCE_QUIZ','LIVE_ROOM','SUPERVISOR_REVIEW')),
  domain_code text not null check (char_length(domain_code) between 2 and 80),
  mission_level smallint not null check (mission_level between 1 and 5),
  question_id uuid,
  question_version integer,
  difficulty text check (difficulty is null or difficulty in ('EASY','MEDIUM','HARD')),
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE','IN_PROGRESS','COMPLETED','EXPIRED','UNRESOLVED')),
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  foreign key (question_id, question_version) references private.expert_v5_questions(question_id, question_version) on delete restrict,
  unique(user_id, mission_date, mission_type, domain_code)
);
create index if not exists expert_daily_missions_user_date_idx
  on private.expert_daily_missions(user_id, mission_date desc, assigned_at desc);
create index if not exists expert_daily_missions_question_idx
  on private.expert_daily_missions(question_id, question_version) where question_id is not null;

create table if not exists private.expert_mission_attempts (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references private.expert_daily_missions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null,
  question_version integer not null,
  status text not null default 'IN_PROGRESS' check (status in ('IN_PROGRESS','SUBMITTED','EVALUATED','REVIEW_REQUIRED','EXPIRED')),
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  submitted_at timestamptz,
  score numeric(5,2) check (score is null or score between 0 and 100),
  is_correct boolean,
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  foreign key (question_id, question_version) references private.expert_v5_questions(question_id, question_version) on delete restrict,
  unique(mission_id, user_id)
);
create index if not exists expert_mission_attempts_user_started_idx
  on private.expert_mission_attempts(user_id, started_at desc);
create index if not exists expert_mission_attempts_question_idx
  on private.expert_mission_attempts(question_id, question_version);

create table if not exists private.expert_mission_answers (
  attempt_id uuid primary key references private.expert_mission_attempts(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer jsonb not null,
  submitted_at timestamptz not null default now(),
  answer_hash text not null check (answer_hash ~ '^[a-fA-F0-9]{64}$')
);
create index if not exists expert_mission_answers_user_idx
  on private.expert_mission_answers(user_id, submitted_at desc);

create table if not exists private.expert_mission_events (
  id bigint generated always as identity primary key,
  mission_id uuid not null references private.expert_daily_missions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null check (event_type in ('ASSIGNED','STARTED','ANSWER_SUBMITTED','EVALUATED','EXPIRED','SOURCE_REVALIDATION_REQUIRED')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16384),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now()
);
create index if not exists expert_mission_events_user_created_idx
  on private.expert_mission_events(user_id, created_at desc);
create index if not exists expert_mission_events_mission_idx
  on private.expert_mission_events(mission_id, created_at desc);

create table if not exists private.expert_room_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  heartbeat_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > heartbeat_at and expires_at <= heartbeat_at + interval '2 minutes')
);
create index if not exists expert_room_presence_online_idx on private.expert_room_presence(expires_at);

create table if not exists private.expert_verification_rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete restrict,
  domain_code text not null check (char_length(domain_code) between 2 and 80),
  input_type text not null check (input_type in ('TEXT','URL','IMAGE','QR')),
  challenge_payload jsonb not null check (jsonb_typeof(challenge_payload) = 'object' and pg_column_size(challenge_payload) <= 12582912),
  status text not null default 'WAITING_FOR_SUPERVISOR' check (status in ('WAITING_FOR_SUPERVISOR','LOBBY','QUESTION_ACTIVE','ANSWER_LOCKED','TRUST_ANALYZING','ADJUDICATION','SUPERVISOR_CONFIRMATION','HOST_ACKNOWLEDGEMENT','DISPUTED','SETTLED','CLOSED','CANCELLED','TRUST_UNAVAILABLE','ADJUDICATION_BLOCKED')),
  supervisor_user_id uuid references auth.users(id) on delete set null,
  supervisor_offer_expires_at timestamptz,
  current_round_id uuid,
  trust_case_id uuid,
  trust_revision integer,
  evidence_package_id uuid,
  revision bigint not null default 1 check (revision > 0),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  request_hash text not null check (request_hash ~ '^[a-fA-F0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expert_verification_rooms_open_domain_idx
  on private.expert_verification_rooms(domain_code, status, created_at desc);
create index if not exists expert_verification_rooms_host_created_idx
  on private.expert_verification_rooms(host_user_id, created_at desc);
create index if not exists expert_verification_rooms_supervisor_idx
  on private.expert_verification_rooms(supervisor_user_id, created_at desc) where supervisor_user_id is not null;
create index if not exists expert_verification_rooms_current_round_idx
  on private.expert_verification_rooms(current_round_id) where current_round_id is not null;
create index if not exists expert_verification_rooms_package_idx
  on private.expert_verification_rooms(evidence_package_id) where evidence_package_id is not null;

create table if not exists private.expert_room_participants (
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('HOST','PARTICIPANT_EXPERT','SUPERVISOR_EXPERT')),
  state text not null default 'JOINED' check (state in ('JOINED','LEFT','DISCONNECTED')),
  conflict_declaration text not null default 'NOT_REQUIRED' check (conflict_declaration in ('NOT_REQUIRED','NO_KNOWN_CONFLICT','CONFLICT_DECLARED')),
  conflict_declared_at timestamptz,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique(room_id, user_id, role)
);
create index if not exists expert_room_participants_user_active_idx
  on private.expert_room_participants(user_id, last_seen_at desc) where state = 'JOINED';

create table if not exists private.expert_room_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  round_number integer not null check (round_number > 0),
  status text not null default 'LOBBY' check (status in ('LOBBY','QUESTION_ACTIVE','ANSWER_LOCKED','TRUST_ANALYZING','ADJUDICATION','SUPERVISOR_CONFIRMATION','HOST_ACKNOWLEDGEMENT','DISPUTED','SETTLED','CLOSED','TRUST_UNAVAILABLE','ADJUDICATION_BLOCKED')),
  round_started_at timestamptz,
  answer_deadline_at timestamptz,
  answer_locked_at timestamptz,
  trust_started_at timestamptz,
  trust_completed_at timestamptz,
  eligible_expert_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(eligible_expert_ids) = 'array'),
  created_at timestamptz not null default now(),
  unique(room_id, round_number),
  check ((status not in ('QUESTION_ACTIVE','ANSWER_LOCKED','TRUST_ANALYZING','ADJUDICATION','SUPERVISOR_CONFIRMATION','HOST_ACKNOWLEDGEMENT','DISPUTED','SETTLED'))
      or (round_started_at is not null and answer_deadline_at is not null))
);

alter table private.expert_verification_rooms
  drop constraint if exists expert_verification_rooms_current_round_fk;
alter table private.expert_verification_rooms
  add constraint expert_verification_rooms_current_round_fk
  foreign key (current_round_id) references private.expert_room_rounds(id) on delete set null;

create table if not exists private.expert_room_answers (
  round_id uuid not null references private.expert_room_rounds(id) on delete restrict,
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  expert_user_id uuid not null references auth.users(id) on delete restrict,
  response jsonb not null,
  answer_hash text not null check (answer_hash ~ '^[a-fA-F0-9]{64}$'),
  submitted_at timestamptz not null default now(),
  primary key(round_id, expert_user_id)
);
create index if not exists expert_room_answers_room_idx
  on private.expert_room_answers(room_id, round_id);

create table if not exists private.expert_room_evidence_packages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  round_id uuid not null unique references private.expert_room_rounds(id) on delete restrict,
  trust_case_id uuid,
  trust_revision integer,
  retrieval_state text not null check (retrieval_state in ('SUCCESS','BLOCKED','UNAVAILABLE','NOT_APPLICABLE')),
  trust_analysis_state text not null check (trust_analysis_state in ('COMPLETE','PARTIAL','N/A')),
  package jsonb not null check (jsonb_typeof(package) = 'object' and pg_column_size(package) <= 1048576),
  package_hash text not null check (package_hash ~ '^[a-fA-F0-9]{64}$'),
  created_at timestamptz not null default now()
);
create index if not exists expert_room_evidence_packages_room_idx
  on private.expert_room_evidence_packages(room_id, created_at desc);
alter table private.expert_verification_rooms
  drop constraint if exists expert_verification_rooms_package_fk;
alter table private.expert_verification_rooms
  add constraint expert_verification_rooms_package_fk
  foreign key (evidence_package_id) references private.expert_room_evidence_packages(id) on delete set null;

create table if not exists private.expert_room_adjudications (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  round_id uuid not null references private.expert_room_rounds(id) on delete restrict,
  expert_user_id uuid not null references auth.users(id) on delete restrict,
  supervisor_user_id uuid not null references auth.users(id) on delete restrict,
  rubric_version text not null,
  rubric_ratings jsonb not null check (jsonb_typeof(rubric_ratings) = 'object'),
  evidence_ids jsonb not null check (jsonb_typeof(evidence_ids) = 'array' and jsonb_array_length(evidence_ids) > 0),
  proposed_score numeric(5,2) not null check (proposed_score between 0 and 100),
  reason text not null check (char_length(reason) between 20 and 4000),
  proposal_hash text not null check (proposal_hash ~ '^[a-fA-F0-9]{64}$'),
  supervisor_confirmed_at timestamptz,
  host_acknowledged_at timestamptz,
  host_acknowledged_by uuid references auth.users(id) on delete set null,
  state text not null default 'PROPOSED' check (state in ('PROPOSED','SUPERVISOR_CONFIRMED','HOST_ACKNOWLEDGED','DISPUTED','SETTLED','REVIEW_REQUIRED')),
  created_at timestamptz not null default now(),
  unique(round_id, expert_user_id)
);
create index if not exists expert_room_adjudications_room_idx
  on private.expert_room_adjudications(room_id, created_at);
create index if not exists expert_room_adjudications_expert_idx
  on private.expert_room_adjudications(expert_user_id, created_at desc);
create index if not exists expert_room_adjudications_supervisor_idx
  on private.expert_room_adjudications(supervisor_user_id, created_at desc);

create table if not exists private.expert_room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references private.expert_verification_rooms(id) on delete restrict,
  round_id uuid references private.expert_room_rounds(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('ROOM_CREATED','SUPERVISOR_OFFERED','SUPERVISOR_ACCEPTED','PARTICIPANT_JOINED','PARTICIPANT_LEFT','ROUND_STARTED','ANSWER_SUBMITTED','ANSWERS_LOCKED','TRUST_STARTED','TRUST_COMPLETED','TRUST_BLOCKED','ADJUDICATION_PROPOSED','SUPERVISOR_CONFIRMED','HOST_ACKNOWLEDGED','ROUND_DISPUTED','ROOM_SETTLED','ROOM_CLOSED')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16384),
  idempotency_key text not null unique check (char_length(idempotency_key) between 1 and 180),
  created_at timestamptz not null default now()
);
create index if not exists expert_room_events_room_created_idx on private.expert_room_events(room_id, created_at);
create index if not exists expert_room_events_round_idx
  on private.expert_room_events(round_id, created_at desc) where round_id is not null;
create index if not exists expert_room_events_actor_idx
  on private.expert_room_events(actor_id, created_at desc) where actor_id is not null;

create or replace function private.expert_v5_reject_immutable_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Expert V5 audit records are append-only' using errcode = '55000';
end;
$$;

drop trigger if exists expert_v5_source_snapshot_immutable on private.expert_v5_source_snapshots;
create trigger expert_v5_source_snapshot_immutable before update or delete on private.expert_v5_source_snapshots
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_source_event_immutable on private.expert_v5_source_events;
create trigger expert_v5_source_event_immutable before update or delete on private.expert_v5_source_events
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_mission_answer_immutable on private.expert_mission_answers;
create trigger expert_v5_mission_answer_immutable before update or delete on private.expert_mission_answers
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_room_answer_immutable on private.expert_room_answers;
create trigger expert_v5_room_answer_immutable before update or delete on private.expert_room_answers
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_room_package_immutable on private.expert_room_evidence_packages;
create trigger expert_v5_room_package_immutable before update or delete on private.expert_room_evidence_packages
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_room_event_immutable on private.expert_room_events;
create trigger expert_v5_room_event_immutable before update or delete on private.expert_room_events
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_mission_event_immutable on private.expert_mission_events;
create trigger expert_v5_mission_event_immutable before update or delete on private.expert_mission_events
  for each row execute function private.expert_v5_reject_immutable_mutation();
drop trigger if exists expert_v5_question_event_immutable on private.expert_v5_question_events;
create trigger expert_v5_question_event_immutable before update or delete on private.expert_v5_question_events
  for each row execute function private.expert_v5_reject_immutable_mutation();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'expert_v5_config', 'expert_mission_level_policy', 'expert_v5_source_registry', 'expert_v5_source_events',
    'expert_v5_source_snapshots', 'expert_v5_ingestion_requests', 'expert_v5_questions', 'expert_v5_question_events', 'expert_mission_progression',
    'expert_daily_missions', 'expert_mission_attempts', 'expert_mission_answers', 'expert_mission_events',
    'expert_room_presence', 'expert_verification_rooms', 'expert_room_participants',
    'expert_room_rounds', 'expert_room_answers', 'expert_room_evidence_packages',
    'expert_room_adjudications', 'expert_room_events'
  ] loop
    execute format('alter table private.%I enable row level security', table_name);
    execute format('revoke all on private.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on private.%I to service_role', table_name);
  end loop;
end
$$;

revoke all on function private.expert_v5_reject_immutable_mutation() from public, anon, authenticated;

-- No source or question seed is included here: content must be genuinely
-- retrieved, provenance-backed, editorially reviewed and available to serve.
