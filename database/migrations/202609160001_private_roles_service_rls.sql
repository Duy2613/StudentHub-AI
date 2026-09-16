begin;

-- private.roles is a server-owned lookup table.  Browser roles never need
-- direct access; the server-side service_role path already has the explicit
-- table grants used by the auth/profile/session repositories.  Keep that
-- contract while closing the Supabase RLS-disabled advisor finding.
alter table private.roles enable row level security;

drop policy if exists roles_service_only on private.roles;
create policy roles_service_only on private.roles
  for all
  to service_role
  using (true)
  with check (true);

revoke all on private.roles from public, anon, authenticated;
grant select, insert, update, delete on private.roles to service_role;

commit;
