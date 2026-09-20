-- StudentHub AI — Persist onboarding presentation fields
--
-- Avatar selection and academic year are presentation data, not authority.
-- This migration is additive and does not alter existing user identity data.

begin;

alter table if exists public.profiles
  add column if not exists avatar_id text check (char_length(avatar_id) <= 80),
  add column if not exists academic_year text check (char_length(academic_year) <= 80);

grant select(avatar_id, academic_year) on public.profiles to authenticated;
grant update(avatar_id, academic_year) on public.profiles to authenticated;

commit;
