begin;

-- Community discussion is server-owned.  Browser roles cannot query this
-- table directly; the API returns a public, identity-minimized projection.
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.community_contributions(id) on delete cascade,
  parent_comment_id uuid,
  author_id uuid not null references auth.users(id) on delete restrict,
  content text not null check (char_length(content) between 1 and 4000),
  depth smallint not null default 0 check (depth between 0 and 3),
  status text not null default 'PUBLISHED' check (status in ('PUBLISHED', 'DELETED', 'MODERATED')),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 180),
  request_digest bytea not null check (octet_length(request_digest) = 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, idempotency_key),
  unique (id, contribution_id),
  foreign key (parent_comment_id, contribution_id)
    references public.community_comments(id, contribution_id) on delete cascade
);

create index if not exists community_comments_thread_idx
  on public.community_comments(contribution_id, created_at asc, id asc)
  where status = 'PUBLISHED';
create index if not exists community_comments_parent_idx
  on public.community_comments(parent_comment_id, created_at asc, id asc)
  where status = 'PUBLISHED';

alter table public.community_comments enable row level security;
drop policy if exists community_comments_service_only on public.community_comments;
create policy community_comments_service_only on public.community_comments
  for all to service_role using (true) with check (true);
revoke all on public.community_comments from public, anon, authenticated;
grant select, insert, update, delete on public.community_comments to service_role;

commit;
