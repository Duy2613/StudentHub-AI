begin;

-- Academic workflow state is server-owned. The browser receives read-only
-- projections; all writes go through the authenticated server repository.
create table if not exists public.academic_workflow_plans (
  id text primary key check (char_length(id) between 1 and 180),
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null default 1 check (revision >= 1),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academic_workflow_plans_owner_idx
  on public.academic_workflow_plans(owner_id, updated_at desc);

create table if not exists public.academic_workflow_tasks (
  id text primary key check (char_length(id) between 1 and 180),
  plan_id text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  assignee_id uuid references auth.users(id) on delete set null,
  task_type text not null check (char_length(task_type) between 1 and 120),
  status text not null check (char_length(status) between 1 and 80),
  trust_case_id uuid references public.trust_cases(id) on delete set null,
  trust_case_revision integer check (trust_case_revision is null or trust_case_revision >= 1),
  revision integer not null default 1 check (revision >= 1),
  idempotency_key text,
  payload jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academic_workflow_tasks_owner_idx
  on public.academic_workflow_tasks(owner_id, updated_at desc);
create index if not exists academic_workflow_tasks_assignee_idx
  on public.academic_workflow_tasks(assignee_id, updated_at desc)
  where assignee_id is not null;
create index if not exists academic_workflow_tasks_plan_idx
  on public.academic_workflow_tasks(owner_id, plan_id, updated_at desc);
create unique index if not exists academic_workflow_tasks_idempotency_idx
  on public.academic_workflow_tasks(owner_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.academic_workflow_task_events (
  event_id text primary key check (char_length(event_id) between 1 and 180),
  task_id text not null references public.academic_workflow_tasks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 120),
  from_state text,
  to_state text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists academic_workflow_task_events_task_idx
  on public.academic_workflow_task_events(task_id, created_at asc);

-- Extend the canonical notification projection without replacing its existing
-- Evidence Passport contract. Legacy rows remain valid and keep their UUID id.
alter table public.notifications add column if not exists notification_key text;
alter table public.notifications add column if not exists dedupe_key text;
alter table public.notifications add column if not exists task_id text;
alter table public.notifications add column if not exists status text not null default 'SCHEDULED';
alter table public.notifications add column if not exists priority text not null default 'MEDIUM';
alter table public.notifications add column if not exists source_type text;
alter table public.notifications add column if not exists source_id text;
alter table public.notifications add column if not exists action_url text;
alter table public.notifications add column if not exists due_at timestamptz;
alter table public.notifications add column if not exists scheduled_at timestamptz;
alter table public.notifications add column if not exists expires_at timestamptz;
alter table public.notifications add column if not exists sent_at timestamptz;
alter table public.notifications add column if not exists acknowledged_at timestamptz;
alter table public.notifications add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists history jsonb not null default '[]'::jsonb;
alter table public.notifications add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists revision integer not null default 1;
alter table public.notifications add column if not exists updated_at timestamptz not null default now();

create unique index if not exists notifications_owner_notification_key_idx
  on public.notifications(owner_id, notification_key)
  where notification_key is not null;
create index if not exists notifications_owner_task_idx
  on public.notifications(owner_id, task_id, created_at desc)
  where task_id is not null;
create index if not exists notifications_owner_status_idx
  on public.notifications(owner_id, status, scheduled_at asc);

alter table public.academic_workflow_plans enable row level security;
alter table public.academic_workflow_tasks enable row level security;
alter table public.academic_workflow_task_events enable row level security;
alter table public.notifications enable row level security;

drop policy if exists academic_workflow_plans_own_select on public.academic_workflow_plans;
create policy academic_workflow_plans_own_select on public.academic_workflow_plans
  for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists academic_workflow_tasks_scoped_select on public.academic_workflow_tasks;
create policy academic_workflow_tasks_scoped_select on public.academic_workflow_tasks
  for select to authenticated
  using ((select auth.uid()) = owner_id or (select auth.uid()) = assignee_id);

drop policy if exists academic_workflow_task_events_scoped_select on public.academic_workflow_task_events;
create policy academic_workflow_task_events_scoped_select on public.academic_workflow_task_events
  for select to authenticated
  using (
    (select auth.uid()) = owner_id
    or exists (
      select 1
        from public.academic_workflow_tasks task
       where task.id = public.academic_workflow_task_events.task_id
         and task.assignee_id = (select auth.uid())
    )
  );

drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
  for select to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.academic_workflow_plans,
  public.academic_workflow_tasks,
  public.academic_workflow_task_events,
  public.notifications from public, anon, authenticated;

grant select on public.academic_workflow_plans,
  public.academic_workflow_tasks,
  public.academic_workflow_task_events,
  public.notifications to authenticated;

grant select, insert, update, delete on public.academic_workflow_plans,
  public.academic_workflow_tasks,
  public.academic_workflow_task_events,
  public.notifications to service_role;

commit;
