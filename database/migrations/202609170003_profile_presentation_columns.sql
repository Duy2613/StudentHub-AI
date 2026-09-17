-- StudentHub AI — Add presentation columns to public.profiles
--
-- Safe, additive migration for student education profile presentation fields.
-- Only presentation fields (university, major) are added.
-- Authority, roles, and reputation remain strictly server-owned in private schema.

begin;

alter table if exists public.profiles
  add column if not exists university text check (char_length(university) <= 180),
  add column if not exists major text check (char_length(major) <= 180);

grant select(university, major) on public.profiles to authenticated;
grant update(university, major) on public.profiles to authenticated;

commit;
