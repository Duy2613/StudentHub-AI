begin;

-- Reviewed staging follow-up for the server-owned onboarding projection.
-- These fields are user-editable presentation/state fields only. They never
-- encode role, reputation, mailbox verification, or institutional authority.
alter table public.profiles
  add column if not exists avatar_id text
    check (avatar_id is null or avatar_id ~ '^[a-z0-9-]{1,80}$'),
  add column if not exists institution_label text
    check (institution_label is null or char_length(institution_label) <= 200),
  add column if not exists major text
    check (major is null or char_length(major) <= 160),
  add column if not exists academic_year text
    check (academic_year is null or char_length(academic_year) <= 80),
  add column if not exists onboarded boolean not null default false;

revoke select, insert, update on public.profiles from anon, authenticated;
grant select(
  id, institution_id, display_name, avatar_url, bio, avatar_id,
  institution_label, major, academic_year, onboarded, created_at, updated_at
) on public.profiles to authenticated;
grant insert(
  id, institution_id, display_name, avatar_url, bio, avatar_id,
  institution_label, major, academic_year, onboarded
) on public.profiles to authenticated;
grant update(
  display_name, avatar_url, bio, avatar_id, institution_label,
  major, academic_year, onboarded, institution_id
) on public.profiles to authenticated;

commit;
