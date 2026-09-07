begin;

-- Expert qualification is a server-owned workflow.  The browser may read its
-- own progress, but it can never promote itself or write a verification row.
create table if not exists public.expert_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'IDENTITY_REVIEW' check (status in (
    'IDENTITY_REVIEW','QUIZ_ELIGIBLE','QUIZ_IN_PROGRESS','DOMAIN_REVIEW',
    'ACTIVE','REJECTED','APPEALED'
  )),
  profile_snapshot jsonb not null check (jsonb_typeof(profile_snapshot) = 'object'),
  requested_domains jsonb not null check (jsonb_typeof(requested_domains) = 'array'),
  approved_domains jsonb not null default '[]'::jsonb check (jsonb_typeof(approved_domains) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists expert_applications_status_updated_idx
  on public.expert_applications(status, updated_at desc);

create table if not exists public.expert_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.expert_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_version text not null check (char_length(quiz_version) between 1 and 120),
  question_ids jsonb not null check (jsonb_typeof(question_ids) = 'array'),
  status text not null default 'IN_PROGRESS' check (status in (
    'IN_PROGRESS','SUBMITTED','PASSED','FAILED','EXPIRED','CANCELLED'
  )),
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  submitted_at timestamptz,
  score numeric(7,4) check (score is null or score between 0 and 1),
  max_score integer not null check (max_score > 0),
  created_at timestamptz not null default now(),
  unique(id, user_id)
);
create index if not exists expert_quiz_attempts_user_created_idx
  on public.expert_quiz_attempts(user_id, created_at desc);
create unique index if not exists expert_quiz_attempts_one_active_idx
  on public.expert_quiz_attempts(application_id)
  where status = 'IN_PROGRESS';

create table if not exists public.expert_quiz_answers (
  attempt_id uuid not null references public.expert_quiz_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null check (question_id ~ '^[a-z0-9][a-z0-9._:-]{1,119}$'),
  answer jsonb not null check (
    jsonb_typeof(answer) = 'string' and char_length(answer #>> '{}') between 1 and 320
  ),
  answered_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);
create index if not exists expert_quiz_answers_user_idx
  on public.expert_quiz_answers(user_id, answered_at desc);

create table if not exists private.expert_qualification_reviews (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.expert_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('APPROVE_QUIZ','ACTIVATE','REJECT','APPEAL_REVIEW')),
  approved_domains jsonb not null default '[]'::jsonb check (jsonb_typeof(approved_domains) = 'array'),
  reason text check (reason is null or char_length(reason) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists expert_qualification_reviews_application_idx
  on private.expert_qualification_reviews(application_id, created_at desc);

alter table public.expert_applications enable row level security;
alter table public.expert_quiz_attempts enable row level security;
alter table public.expert_quiz_answers enable row level security;
alter table private.expert_qualification_reviews enable row level security;

drop policy if exists expert_applications_own_select on public.expert_applications;
create policy expert_applications_own_select on public.expert_applications
  for select using (auth.uid() = user_id);
drop policy if exists expert_quiz_attempts_own_select on public.expert_quiz_attempts;
create policy expert_quiz_attempts_own_select on public.expert_quiz_attempts
  for select using (auth.uid() = user_id);
drop policy if exists expert_quiz_answers_own_select on public.expert_quiz_answers;
create policy expert_quiz_answers_own_select on public.expert_quiz_answers
  for select using (auth.uid() = user_id);

revoke all on public.expert_applications, public.expert_quiz_attempts,
  public.expert_quiz_answers from public, anon, authenticated;
grant select on public.expert_applications, public.expert_quiz_attempts,
  public.expert_quiz_answers to authenticated;
grant select, insert, update on public.expert_applications,
  public.expert_quiz_attempts, public.expert_quiz_answers to service_role;

revoke all on private.expert_qualification_reviews from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert on private.expert_qualification_reviews to service_role;
grant usage, select on sequence private.expert_qualification_reviews_id_seq to service_role;

commit;
