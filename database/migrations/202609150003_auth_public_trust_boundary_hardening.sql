-- StudentHub AI — Remove inherited browser grants from Trust graph/public catalog
--
-- Forward-only and non-destructive. Core Trust graph rows are server-owned;
-- institution rows expose only a public directory projection. Existing
-- user-facing Passport/follow/decision policies remain owner-scoped but are
-- explicitly limited to the authenticated role.

begin;

-- Trust graph inputs, evidence, claims, and entity links are persisted by the
-- server repositories. RLS alone is not enough because TRUNCATE and other
-- table privileges are checked before row policies.
revoke all on public.case_inputs, public.entities, public.case_entities,
  public.evidence, public.claims, public.claim_sources
  from public, anon, authenticated;
grant select, insert, update, delete on public.case_inputs, public.entities,
  public.case_entities, public.evidence, public.claims, public.claim_sources
  to service_role;

drop policy if exists case_inputs_own on public.case_inputs;
drop policy if exists evidence_own on public.evidence;

-- Institution data is a public directory projection. Verified-domain details
-- remain server-side and are not included in browser column privileges.
revoke all on public.institutions from public, anon, authenticated;
grant select(id, slug, name, created_at, updated_at)
  on public.institutions to anon, authenticated;
grant select, insert, update, delete on public.institutions to service_role;

drop policy if exists institutions_read_public on public.institutions;
create policy institutions_read_public on public.institutions
  for select to anon, authenticated using (true);

-- These feature tables already grant only the listed authenticated reads or
-- follow mutations. Make the policy role explicit and do not leave mutation
-- policies available to the pseudo-role PUBLIC.
drop policy if exists evidence_passports_own_select on public.evidence_passports;
create policy evidence_passports_own_select on public.evidence_passports
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists evidence_passports_own_insert on public.evidence_passports;

drop policy if exists evidence_passport_events_own_select on public.evidence_passport_events;
create policy evidence_passport_events_own_select on public.evidence_passport_events
  for select to authenticated using (exists (
    select 1 from public.evidence_passports passport
    where passport.id = evidence_passport_events.passport_id
      and passport.owner_id = auth.uid()
  ));

drop policy if exists evidence_passport_events_own_insert on public.evidence_passport_events;

drop policy if exists decision_scenarios_own_select on public.decision_scenarios;
create policy decision_scenarios_own_select on public.decision_scenarios
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists decision_scenarios_own_insert on public.decision_scenarios;

drop policy if exists decision_options_own_select on public.decision_options;
create policy decision_options_own_select on public.decision_options
  for select to authenticated using (exists (
    select 1 from public.decision_scenarios scenario
    where scenario.id = decision_options.scenario_id
      and scenario.owner_id = auth.uid()
  ));

drop policy if exists case_follows_own on public.case_follows;
create policy case_follows_own on public.case_follows
  for all to authenticated using (auth.uid() = owner_id) with check (
    auth.uid() = owner_id and exists (
      select 1 from public.evidence_passports passport
      where passport.id = case_follows.passport_id
        and passport.owner_id = auth.uid()
    )
  );

drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
  for select to authenticated using (auth.uid() = owner_id);

commit;
