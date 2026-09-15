-- StudentHub AI — Explicit browser boundary for private trust/expert state
--
-- Forward-only and non-destructive. This closes legacy inherited browser
-- grants left by earlier feature migrations; server-side PostgreSQL/service
-- access is unchanged. No user/application rows are deleted or rewritten.

begin;

-- Expert assessments contain reviewer/qualification authority and are
-- server-owned. In particular, RLS is not a substitute for revoking
-- TRUNCATE, REFERENCES, and TRIGGER privileges.
revoke all on public.expert_assessments from public, anon, authenticated;

-- Qualification progress is readable by the owning authenticated user only;
-- all writes and privilege-bearing transitions remain server-side.
revoke all on public.expert_applications, public.expert_quiz_attempts,
  public.expert_quiz_answers
  from public, anon, authenticated;

grant select on public.expert_applications, public.expert_quiz_attempts,
  public.expert_quiz_answers to authenticated;

drop policy if exists expert_applications_own_select on public.expert_applications;
create policy expert_applications_own_select on public.expert_applications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists expert_quiz_attempts_own_select on public.expert_quiz_attempts;
create policy expert_quiz_attempts_own_select on public.expert_quiz_attempts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists expert_quiz_answers_own_select on public.expert_quiz_answers;
create policy expert_quiz_answers_own_select on public.expert_quiz_answers
  for select to authenticated using (auth.uid() = user_id);

-- Trust execution history is owner-readable but append/update authority is
-- service-side. Make the existing intended read path explicit instead of
-- relying on policies scoped to PUBLIC.
revoke all on public.trust_runs, public.trust_stage_runs,
  public.trust_case_revisions, public.trust_verdict_revisions
  from public, anon, authenticated;
grant select on public.trust_runs, public.trust_stage_runs,
  public.trust_case_revisions, public.trust_verdict_revisions to authenticated;

drop policy if exists trust_runs_own_select on public.trust_runs;
create policy trust_runs_own_select on public.trust_runs
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists trust_stage_runs_own_select on public.trust_stage_runs;
create policy trust_stage_runs_own_select on public.trust_stage_runs
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists trust_case_revisions_own_select on public.trust_case_revisions;
create policy trust_case_revisions_own_select on public.trust_case_revisions
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists trust_verdict_revisions_own_select on public.trust_verdict_revisions;
create policy trust_verdict_revisions_own_select on public.trust_verdict_revisions
  for select to authenticated using (auth.uid() = owner_id);

commit;
