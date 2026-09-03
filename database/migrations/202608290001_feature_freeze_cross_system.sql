begin;

create table if not exists public.evidence_passports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  subject_type text not null check (char_length(subject_type) between 1 and 80),
  subject_id text not null check (char_length(subject_id) between 1 and 160),
  current_status text not null check (current_status in (
    'UNKNOWN','INSUFFICIENT_EVIDENCE','SUPPORTED','SAFE_WITHIN_SCOPE','SUSPICIOUS',
    'HIGH_RISK','DANGEROUS','DISPUTED','RESOLVED'
  )),
  revision integer not null default 1 check (revision > 0),
  demo boolean not null default false check (demo = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, subject_type, subject_id)
);
create index if not exists evidence_passports_owner_updated_idx
  on public.evidence_passports(owner_id, updated_at desc);

create table if not exists public.evidence_passport_events (
  id text primary key check (char_length(id) between 1 and 180),
  passport_id uuid not null references public.evidence_passports(id) on delete cascade,
  revision integer not null check (revision > 0),
  event_type text not null check (event_type in (
    'CREATED','USER_NOTE','TRUST_RESULT','COMMUNITY_UPDATE','EXPERT_REVIEW','OFFICIAL_UPDATE','RESULT_CHANGED','RESOLVED'
  )),
  provenance_class text not null check (provenance_class in (
    'OFFICIAL','TRUST_ENGINE','COMMUNITY','EXPERT','DETERMINISTIC_RULE','MODEL_ESTIMATE','USER_SUBMISSION'
  )),
  summary text not null check (char_length(summary) between 1 and 600),
  previous_status text not null,
  new_status text not null,
  material boolean not null default false,
  change_reason text check (change_reason is null or char_length(change_reason) <= 600),
  source_references jsonb not null default '[]'::jsonb check (jsonb_typeof(source_references) = 'array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(passport_id, revision)
);
create index if not exists evidence_passport_events_timeline_idx
  on public.evidence_passport_events(passport_id, revision);

create table if not exists public.decision_scenarios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  current_state text not null check (char_length(current_state) between 1 and 800),
  evaluation_method text not null default 'DETERMINISTIC_WEIGHTED_FACTORS_V1',
  recommendation_state text not null check (recommendation_state in ('RECOMMENDED','REVIEW_REQUIRED')),
  recommended_option_key text,
  unknowns jsonb not null default '[]'::jsonb check (jsonb_typeof(unknowns) = 'array'),
  demo boolean not null default false check (demo = false),
  created_at timestamptz not null default now()
);
create index if not exists decision_scenarios_owner_created_idx
  on public.decision_scenarios(owner_id, created_at desc);

create table if not exists public.decision_options (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.decision_scenarios(id) on delete cascade,
  option_key text not null check (char_length(option_key) between 1 and 160),
  label text not null check (char_length(label) between 1 and 160),
  summary text not null check (char_length(summary) between 1 and 500),
  next_action text not null check (char_length(next_action) between 1 and 400),
  factors jsonb not null check (jsonb_typeof(factors) = 'object'),
  consequences jsonb not null check (jsonb_typeof(consequences) = 'array'),
  total_cost numeric(12,4) not null,
  rank integer not null check (rank > 0),
  unique(scenario_id, option_key),
  unique(scenario_id, rank)
);

create table if not exists public.case_follows (
  owner_id uuid not null references auth.users(id) on delete cascade,
  passport_id uuid not null references public.evidence_passports(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(owner_id, passport_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  subject_type text not null,
  subject_id text not null,
  material_change_revision integer,
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 1000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id, subject_type, subject_id, material_change_revision)
);
create index if not exists notifications_owner_unread_idx
  on public.notifications(owner_id, created_at desc) where read_at is null;

alter table public.evidence_passports enable row level security;
alter table public.evidence_passport_events enable row level security;
alter table public.decision_scenarios enable row level security;
alter table public.decision_options enable row level security;
alter table public.case_follows enable row level security;
alter table public.notifications enable row level security;

drop policy if exists evidence_passports_own_select on public.evidence_passports;
create policy evidence_passports_own_select on public.evidence_passports
  for select using (auth.uid() = owner_id);
drop policy if exists evidence_passports_own_insert on public.evidence_passports;
create policy evidence_passports_own_insert on public.evidence_passports
  for insert with check (auth.uid() = owner_id and demo = false);

drop policy if exists evidence_passport_events_own_select on public.evidence_passport_events;
create policy evidence_passport_events_own_select on public.evidence_passport_events
  for select using (exists (
    select 1 from public.evidence_passports passport
    where passport.id = passport_id and passport.owner_id = auth.uid()
  ));
drop policy if exists evidence_passport_events_own_insert on public.evidence_passport_events;
create policy evidence_passport_events_own_insert on public.evidence_passport_events
  for insert with check (exists (
    select 1 from public.evidence_passports passport
    where passport.id = passport_id and passport.owner_id = auth.uid() and passport.demo = false
  ));

drop policy if exists decision_scenarios_own_select on public.decision_scenarios;
create policy decision_scenarios_own_select on public.decision_scenarios
  for select using (auth.uid() = owner_id);
drop policy if exists decision_scenarios_own_insert on public.decision_scenarios;
create policy decision_scenarios_own_insert on public.decision_scenarios
  for insert with check (auth.uid() = owner_id and demo = false);
drop policy if exists decision_options_own_select on public.decision_options;
create policy decision_options_own_select on public.decision_options
  for select using (exists (
    select 1 from public.decision_scenarios scenario
    where scenario.id = scenario_id and scenario.owner_id = auth.uid()
  ));

drop policy if exists case_follows_own on public.case_follows;
create policy case_follows_own on public.case_follows
  for all using (auth.uid() = owner_id) with check (
    auth.uid() = owner_id and exists (
      select 1 from public.evidence_passports passport
      where passport.id = passport_id and passport.owner_id = auth.uid()
    )
  );
drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
  for select using (auth.uid() = owner_id);

revoke all on public.evidence_passports, public.evidence_passport_events,
  public.decision_scenarios, public.decision_options, public.case_follows,
  public.notifications from public, anon, authenticated;

grant select on public.evidence_passports, public.evidence_passport_events,
  public.decision_scenarios, public.decision_options to authenticated;
grant select, insert, delete on public.case_follows to authenticated;
grant select on public.notifications to authenticated;

grant select, insert, update on public.evidence_passports to service_role;
grant select, insert on public.evidence_passport_events to service_role;
grant select, insert on public.decision_scenarios, public.decision_options to service_role;
grant select, insert, delete on public.case_follows to service_role;
grant select, insert, update on public.notifications to service_role;

commit;
