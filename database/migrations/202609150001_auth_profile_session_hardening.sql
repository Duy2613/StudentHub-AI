-- StudentHub AI — Auth/profile reconciliation and RLS hardening
--
-- Forward-safe and non-destructive. Apply this migration to a disposable
-- database first, then to the intended Supabase project through the owner's
-- migration workflow. It does not delete, truncate, or rewrite user data.

begin;

-- The application-owned first-run state must not live in user-editable Auth
-- metadata. Existing rows keep the safe default until onboarding completes.
alter table if exists public.profiles
  add column if not exists onboarded boolean not null default false;

-- Reconcile historical Auth users that predate the profile trigger. The
-- identity key is auth.users.id; no email-based merge is attempted.
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(
    nullif(left(regexp_replace(u.raw_user_meta_data->>'full_name', '[[:cntrl:]]', '', 'g'), 120), ''),
    nullif(left(regexp_replace(u.raw_user_meta_data->>'name', '[[:cntrl:]]', '', 'g'), 120), ''),
    nullif(left(split_part(coalesce(u.email, ''), '@', 1), 120), ''),
    'StudentHub member'
  ),
  nullif(left(regexp_replace(u.raw_user_meta_data->>'avatar_url', '[[:cntrl:]]', '', 'g'), 1000), '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Give historical Auth users an explicit least-privilege application role.
-- The role is selected from the server-owned role catalog, never from Auth
-- metadata or a client-supplied field.
insert into private.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u
join private.roles r on r.code = 'STUDENT'
left join private.user_roles ur on ur.user_id = u.id and ur.role_id = r.id
where ur.user_id is null
on conflict do nothing;

-- Make the browser-facing RLS contract explicit. Policies scoped to PUBLIC
-- are easy to misread and accidentally broaden when grants change.
drop policy if exists profiles_own_select on public.profiles;
create policy profiles_own_select on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists profiles_own_insert on public.profiles;
create policy profiles_own_insert on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts
  for select to anon, authenticated using (status = 'PUBLISHED' or auth.uid() = author_id);

drop policy if exists posts_own_insert on public.posts;
create policy posts_own_insert on public.posts
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists posts_own_update on public.posts;
create policy posts_own_update on public.posts
  for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments
  for select to anon, authenticated using (status = 'PUBLISHED' or auth.uid() = author_id);

drop policy if exists comments_own_insert on public.comments;
create policy comments_own_insert on public.comments
  for insert to authenticated with check (auth.uid() = author_id);

drop policy if exists votes_own_write on public.votes;
create policy votes_own_write on public.votes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists trust_cases_own on public.trust_cases;
create policy trust_cases_own on public.trust_cases
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Expert directory rows contain only the public projection. Qualification and
-- role authority remain server/private and are not granted to browser roles.
drop policy if exists expert_profiles_public_read on public.expert_profiles;
create policy expert_profiles_public_read on public.expert_profiles
  for select to anon, authenticated using (true);

-- Remove inherited table privileges that are not needed by the browser roles,
-- especially TRUNCATE/REFERENCES/TRIGGER. RLS does not protect TRUNCATE.
revoke all on public.profiles, public.posts, public.comments, public.votes,
  public.trust_cases, public.expert_profiles
  from public, anon, authenticated;

grant select(id, institution_id, display_name, avatar_url, bio, onboarded, created_at, updated_at)
  on public.profiles to authenticated;
grant insert(id, display_name, avatar_url, bio)
  on public.profiles to authenticated;
grant update(display_name, avatar_url, bio)
  on public.profiles to authenticated;

grant select(id, category, location_tag, title, content, images, links, status, created_at, updated_at)
  on public.posts to anon, authenticated;
grant insert(author_id, title, content, category, location_tag, images, links)
  on public.posts to authenticated;
grant update(title, content, category, location_tag, images, links)
  on public.posts to authenticated;

grant select(id, post_id, content, status, created_at, updated_at)
  on public.comments to anon, authenticated;
grant insert(post_id, author_id, content) on public.comments to authenticated;

grant insert(post_id, user_id, value) on public.votes to authenticated;
grant update(value) on public.votes to authenticated;
grant delete on public.votes to authenticated;
-- Trust cases and their state transitions are server-owned. The RLS policy
-- remains explicit for controlled service-side sessions, but browser roles
-- receive no table privilege for this private resource.
grant select(user_id, public_title, public_bio, created_at, updated_at)
  on public.expert_profiles to anon, authenticated;

commit;
