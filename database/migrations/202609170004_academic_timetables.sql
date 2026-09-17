begin;

-- Canonical academic timetable state. Images are intentionally not retained:
-- the server keeps the upload in memory long enough to obtain an editable
-- draft, then only a user-confirmed timetable is persisted.
create table if not exists public.user_timetables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Thời khóa biểu'
    check (char_length(name) between 1 and 180),
  academic_term text
    check (academic_term is null or char_length(academic_term) between 1 and 120),
  source_type text not null default 'MANUAL'
    check (source_type in ('MANUAL', 'IMAGE')),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'ARCHIVED')),
  is_active boolean not null default false,
  source_artifact_id uuid,
  idempotency_key text
    check (idempotency_key is null or char_length(idempotency_key) between 1 and 180),
  request_digest text
    check (request_digest is null or request_digest ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index if not exists user_timetables_one_active_idx
  on public.user_timetables(user_id)
  where is_active = true;

create unique index if not exists user_timetables_idempotency_idx
  on public.user_timetables(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists user_timetables_user_idx
  on public.user_timetables(user_id, updated_at desc);

create index if not exists user_timetables_user_active_idx
  on public.user_timetables(user_id, is_active);

create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_name text not null check (char_length(course_name) between 1 and 240),
  course_code text
    check (course_code is null or char_length(course_code) between 1 and 80),
  day_of_week smallint not null check (day_of_week between 1 and 7),
  start_time time,
  end_time time,
  period_start smallint check (period_start is null or period_start between 1 and 99),
  period_end smallint check (period_end is null or period_end between 1 and 99),
  room text check (room is null or char_length(room) between 1 and 120),
  building text check (building is null or char_length(building) between 1 and 120),
  lecturer text check (lecturer is null or char_length(lecturer) between 1 and 180),
  class_group text check (class_group is null or char_length(class_group) between 1 and 120),
  week_range text check (week_range is null or char_length(week_range) between 1 and 120),
  notes text check (notes is null or char_length(notes) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (timetable_id, user_id)
    references public.user_timetables(id, user_id)
    on delete cascade
);

create index if not exists timetable_entries_user_idx
  on public.timetable_entries(user_id, updated_at desc);
create index if not exists timetable_entries_timetable_idx
  on public.timetable_entries(timetable_id, day_of_week, start_time);
create index if not exists timetable_entries_day_idx
  on public.timetable_entries(day_of_week, start_time);

-- A reminder is an explicit user intention, not an inferred university
-- deadline. Notification delivery can consume this durable intent later.
create table if not exists public.timetable_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timetable_id uuid not null references public.user_timetables(id) on delete cascade,
  entry_id uuid references public.timetable_entries(id) on delete cascade,
  task_id text,
  offset_minutes integer not null check (offset_minutes between 0 and 10080),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (entry_id is not null or task_id is not null),
  foreign key (timetable_id, user_id)
    references public.user_timetables(id, user_id)
    on delete cascade,
  foreign key (entry_id, user_id)
    references public.timetable_entries(id, user_id)
    on delete cascade
);

create unique index if not exists timetable_reminders_entry_offset_idx
  on public.timetable_reminders(user_id, timetable_id, entry_id, offset_minutes)
  where entry_id is not null;
create unique index if not exists timetable_reminders_task_offset_idx
  on public.timetable_reminders(user_id, timetable_id, task_id, offset_minutes)
  where task_id is not null;
create index if not exists timetable_reminders_user_idx
  on public.timetable_reminders(user_id, is_active, updated_at desc);

alter table public.user_timetables enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.timetable_reminders enable row level security;

drop policy if exists user_timetables_own_select on public.user_timetables;
create policy user_timetables_own_select on public.user_timetables
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_timetables_own_insert on public.user_timetables;
create policy user_timetables_own_insert on public.user_timetables
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists user_timetables_own_update on public.user_timetables;
create policy user_timetables_own_update on public.user_timetables
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_timetables_own_delete on public.user_timetables;
create policy user_timetables_own_delete on public.user_timetables
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists timetable_entries_own_select on public.timetable_entries;
create policy timetable_entries_own_select on public.timetable_entries
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
      where timetable.id = timetable_entries.timetable_id
        and timetable.user_id = (select auth.uid())
    )
  );

drop policy if exists timetable_entries_own_insert on public.timetable_entries;
create policy timetable_entries_own_insert on public.timetable_entries
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
      where timetable.id = timetable_entries.timetable_id
        and timetable.user_id = (select auth.uid())
    )
  );

drop policy if exists timetable_entries_own_update on public.timetable_entries;
create policy timetable_entries_own_update on public.timetable_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
      where timetable.id = timetable_entries.timetable_id
        and timetable.user_id = (select auth.uid())
    )
  );

drop policy if exists timetable_entries_own_delete on public.timetable_entries;
create policy timetable_entries_own_delete on public.timetable_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists timetable_reminders_own_select on public.timetable_reminders;
create policy timetable_reminders_own_select on public.timetable_reminders
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists timetable_reminders_own_insert on public.timetable_reminders;
create policy timetable_reminders_own_insert on public.timetable_reminders
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
      where timetable.id = timetable_reminders.timetable_id
        and timetable.user_id = (select auth.uid())
    )
    and (entry_id is null or exists (
      select 1 from public.timetable_entries entry
       where entry.id = timetable_reminders.entry_id
         and entry.timetable_id = timetable_reminders.timetable_id
         and entry.user_id = (select auth.uid())
    ))
  );

drop policy if exists timetable_reminders_own_update on public.timetable_reminders;
create policy timetable_reminders_own_update on public.timetable_reminders
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.user_timetables timetable
       where timetable.id = timetable_reminders.timetable_id
         and timetable.user_id = (select auth.uid())
    )
    and (entry_id is null or exists (
      select 1 from public.timetable_entries entry
       where entry.id = timetable_reminders.entry_id
         and entry.timetable_id = timetable_reminders.timetable_id
         and entry.user_id = (select auth.uid())
    ))
  );

drop policy if exists timetable_reminders_own_delete on public.timetable_reminders;
create policy timetable_reminders_own_delete on public.timetable_reminders
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_timetables, public.timetable_entries, public.timetable_reminders
  from public, anon;
grant select, insert, update, delete
  on public.user_timetables, public.timetable_entries, public.timetable_reminders
  to authenticated;
grant select, insert, update, delete
  on public.user_timetables, public.timetable_entries, public.timetable_reminders
  to service_role;

commit;
