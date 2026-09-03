begin;

-- Review-only migration for the StudentHub-owned private screenshot boundary.
-- Do not execute against a remote project without explicit approval.

create table if not exists public.screenshot_objects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.trust_cases(id) on delete cascade,
  bucket_id text not null default 'trust-screenshots-private'
    check (bucket_id = 'trust-screenshots-private'),
  object_key text not null unique
    check (object_key ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.(png|jpg|jpeg|webp)$'),
  mime_type text not null
    check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  byte_size integer not null check (byte_size between 1 and 8388608),
  sha256 bytea not null check (octet_length(sha256) = 32),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  deleted_at timestamptz
);

create index if not exists screenshot_objects_owner_created_idx
  on public.screenshot_objects(owner_id, created_at desc);
create index if not exists screenshot_objects_case_idx
  on public.screenshot_objects(case_id)
  where case_id is not null;

alter table public.screenshot_objects enable row level security;
revoke all on public.screenshot_objects from public, anon, authenticated;
grant select on public.screenshot_objects to authenticated;
grant select, insert, update, delete on public.screenshot_objects to service_role;

drop policy if exists screenshot_objects_owner_select on public.screenshot_objects;
create policy screenshot_objects_owner_select on public.screenshot_objects
  for select to authenticated
  using (owner_id = auth.uid() and deleted_at is null);

-- Metadata writes stay server-controlled so the client cannot forge hashes,
-- ownership, case linkage, or retention timestamps.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trust-screenshots-private',
  'trust-screenshots-private',
  false,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1
    from storage.buckets
    where id = 'trust-screenshots-private'
      and public = true
  ) then
    raise exception 'trust-screenshots-private must remain private';
  end if;
end;
$$;

drop policy if exists screenshot_storage_authenticated_insert on storage.objects;
create policy screenshot_storage_authenticated_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'trust-screenshots-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists screenshot_storage_owner_select on storage.objects;
create policy screenshot_storage_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'trust-screenshots-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists screenshot_storage_owner_delete on storage.objects;
create policy screenshot_storage_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'trust-screenshots-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
